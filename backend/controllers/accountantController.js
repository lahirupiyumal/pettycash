const Accountant = require('../models/Accountant');
const ImportedFile = require('../models/ImportedFile');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/audit');
const XLSX = require('xlsx');

// Returns the ID of the canonical shared admin (oldest admin by creation date).
// All admin data reads and writes go through this single owner so every admin
// sees the same records. Falls back to the caller's own ID if no admin exists.
const getSharedAdminId = async (fallbackId) => {
  const adminUser = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).lean();
  return adminUser ? adminUser._id : fallbackId;
};

const processImportAccountants = async (records, fileName, userId) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Invalid records array');
  }

  // Step 1: Deduplicate rows within the uploaded file
  const uniqueIncoming = [];
  const seenKeys = new Set();
  for (const r of records) {
    const key = `${String(r.region || '').trim().toLowerCase()}-${String(r.pcfRef || '').trim().toLowerCase()}-${r.year}-${String(r.month || '').trim().toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueIncoming.push(r);
    }
  }

  const isGoogleDriveSync = fileName === 'GoogleDrive_Accountant.xlsx';

  if (isGoogleDriveSync) {
    let importFile = await ImportedFile.findOne({
      fileName: fileName,
      createdBy: userId,
      type: 'accountant'
    });

    if (!importFile) {
      importFile = await ImportedFile.create({
        fileName: fileName,
        createdBy: userId,
        recordCount: 0,
        type: 'accountant',
      });
    }

    const ops = uniqueIncoming.map(record => ({
      updateOne: {
        filter: {
          createdBy: userId,
          region: record.region,
          pcfRef: record.pcfRef,
          year: record.year,
          month: record.month
        },
        update: {
          $set: {
            ...record,
            createdBy: userId,
            importFileId: importFile._id
          }
        },
        upsert: true
      }
    }));

    await Accountant.bulkWrite(ops);

    importFile = await ImportedFile.findByIdAndUpdate(
      importFile._id,
      { recordCount: uniqueIncoming.length },
      { new: true }
    );

    return {
      message: `Successfully synchronized ${uniqueIncoming.length} accountant record(s) from Google Drive.`,
      count: uniqueIncoming.length,
      skipped: 0,
      file: {
        id: importFile._id,
        fileName: importFile.fileName,
      },
    };
  }

  // Step 2: Find records that already exist in the DB
  const existingDocs = await Accountant.find({
    createdBy: userId,
    $or: uniqueIncoming.map(r => ({
      region: r.region,
      pcfRef: r.pcfRef,
      year: r.year,
      month: r.month,
    })),
  }).select('region pcfRef year month');

  const existingKeys = new Set(
    existingDocs.map(r =>
      `${String(r.region || '').trim().toLowerCase()}-${String(r.pcfRef || '').trim().toLowerCase()}-${r.year}-${String(r.month || '').trim().toLowerCase()}`
    )
  );

  // Step 3: Keep only new records
  const newRecords = uniqueIncoming.filter(r => {
    const key = `${String(r.region || '').trim().toLowerCase()}-${String(r.pcfRef || '').trim().toLowerCase()}-${r.year}-${String(r.month || '').trim().toLowerCase()}`;
    return !existingKeys.has(key);
  });

  const skipped = records.length - newRecords.length;

  let importFile = null;

  if (newRecords.length === 0) {
    return {
      message: `No new records imported. All ${skipped} record(s) already exist in the system.`,
      count: 0,
      skipped,
    };
  }

  if (!importFile) {
    importFile = await ImportedFile.create({
      fileName: fileName || 'Imported Accountant File',
      createdBy: userId,
      recordCount: 0,
      type: 'accountant',
    });
  }

  const recordsToInsert = newRecords.map(record => ({
    ...record,
    createdBy: userId,
    importFileId: importFile._id,
  }));

  let insertedCount = 0;
  try {
    const result = await Accountant.insertMany(recordsToInsert, { ordered: false });
    insertedCount = result.length;
  } catch (bulkErr) {
    if (bulkErr.code === 11000 || bulkErr.name === 'BulkWriteError') {
      insertedCount = bulkErr.result?.nInserted ?? 0;
    } else {
      throw bulkErr;
    }
  }

  importFile = await ImportedFile.findByIdAndUpdate(
    importFile._id,
    { $inc: { recordCount: insertedCount } },
    { new: true }
  );

  return {
    message: `Successfully imported ${insertedCount} accountant record(s).${skipped > 0 ? ` ${skipped} duplicate(s) were skipped.` : ''}`,
    count: insertedCount,
    skipped,
    file: {
      id: importFile._id,
      fileName: importFile.fileName,
    },
  };
};

exports.importAccountants = async (req, res) => {
  try {
    const { records, fileName } = req.body;
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const result = await processImportAccountants(records, fileName, sharedAdminId);
    const status = result.count > 0 ? 201 : 200;
    res.status(status).json(result);
  } catch (err) {
    console.error('Accountant import error:', err);
    res.status(500).json({ message: err.message });
  }
};

const syncAccountantsForUser = async (userId) => {
  const sheetId = process.env.GOOGLE_DRIVE_ACCOUNTANT_SHEET_ID || '1tKboF2XoTGH8Zrx55CbSYRtpyu0aMYd8';
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download sheet from Google Drive: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  if (rows.length < 2) {
    throw new Error("File is empty or missing headers");
  }

  const parseNum = (val) => {
    if (val === undefined || val === null || val === '') return null;
    const parsed = Number(String(val).replace(/,/g, ''));
    return isNaN(parsed) ? null : parsed;
  };

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    records.push({
      region: row[0],
      pcfRef: row[1],
      costCenterName: row[2],
      number: String(row[3] || ''),
      year: parseNum(row[4]),
      month: row[5]
    });
  }

  return await processImportAccountants(records, 'GoogleDrive_Accountant.xlsx', userId);
};

exports.syncAccountantsForUser = syncAccountantsForUser;

exports.googleDriveSync = async (req, res) => {
  try {
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const result = await syncAccountantsForUser(sharedAdminId);

    const user = await User.findById(req.user.id).select('name email role').lean();
    if (user) {
      await createAuditLog(
        user,
        'Imported Accountant Data from Google Drive',
        'import',
        `Successfully synchronized ${result.count} accountant record(s) from Google Drive.`,
        { fileName: 'Accountant.xlsx', syncSource: 'Google Drive', importedCount: result.count, skippedCount: result.skipped },
        req
      );
    }

    const status = result.count > 0 ? 201 : 200;
    res.status(status).json(result);
  } catch (err) {
    console.error('Google Drive Sync error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAccountants = async (req, res) => {
  try {
    const { importFileId } = req.query;
    // All roles always read from the shared admin's data pool
    const targetUserId = await getSharedAdminId(req.user.id);

    const query = { createdBy: targetUserId };
    if (importFileId) {
      query.importFileId = importFileId;
    }

    // Accountant filtering: only show records matching their service number
    if (req.user.role === 'accountant' && req.user.serviceNumber) {
      const svcNum = parseInt(req.user.serviceNumber, 10);
      const matchNumbers = [req.user.serviceNumber, String(req.user.serviceNumber)];
      if (!isNaN(svcNum)) {
        matchNumbers.push(svcNum);
        matchNumbers.push(String(svcNum));
        matchNumbers.push(String(svcNum).padStart(6, '0'));
      }
      query.number = { $in: matchNumbers };
    }

    const accountants = await Accountant.find(query).sort({ createdAt: -1 });
    res.json(accountants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getImportedFiles = async (req, res) => {
  try {
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const files = await ImportedFile.find({ createdBy: sharedAdminId, type: 'accountant' }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccountants = async (req, res) => {
  try {
    const { importFileId } = req.query;
    const sharedAdminId = await getSharedAdminId(req.user.id);
    if (importFileId) {
      await Accountant.deleteMany({ createdBy: sharedAdminId, importFileId });
      await ImportedFile.deleteOne({ _id: importFileId, createdBy: sharedAdminId });
      return res.json({ message: 'Selected imported file data deleted successfully.' });
    }

    const fileIds = await Accountant.distinct('importFileId', { createdBy: sharedAdminId });
    await Accountant.deleteMany({ createdBy: sharedAdminId });
    await ImportedFile.deleteMany({ _id: { $in: fileIds } });

    res.json({ message: 'All accountant data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
