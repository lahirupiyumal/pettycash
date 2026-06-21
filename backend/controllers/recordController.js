const mongoose = require('mongoose');
const { Types } = mongoose;
const PettyCashRecord = require('../models/PettyCashRecord');
const ImportedFile = require('../models/ImportedFile');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/audit');
const XLSX = require('xlsx');

const processImportRecords = async (records, fileName, userId) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Invalid records array');
  }

  // Step 1: Deduplicate rows within the uploaded file itself
  const uniqueIncoming = [];
  const seenKeys = new Set();
  for (const r of records) {
    const key = `${String(r.region || '').trim().toLowerCase()}-${String(r.pcfRef || '').trim().toLowerCase()}-${r.year}-${String(r.month || '').trim().toLowerCase()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueIncoming.push(r);
    }
  }

  const isGoogleDriveSync = fileName === 'GoogleDrive_PettyCash.xlsx';

  if (isGoogleDriveSync) {
    let importFile = await ImportedFile.findOne({
      fileName: fileName,
      createdBy: userId,
      type: 'pettyCash'
    });

    if (!importFile) {
      importFile = await ImportedFile.create({
        fileName: fileName,
        createdBy: userId,
        recordCount: 0,
        type: 'pettyCash',
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
            sourceFileName: fileName,
            importFileId: importFile._id
          }
        },
        upsert: true
      }
    }));

    await PettyCashRecord.bulkWrite(ops);

    importFile = await ImportedFile.findByIdAndUpdate(
      importFile._id,
      { recordCount: uniqueIncoming.length },
      { new: true }
    );

    return {
      message: `Successfully synchronized ${uniqueIncoming.length} record(s) from Google Drive.`,
      count: uniqueIncoming.length,
      skipped: 0,
      file: {
        id: importFile._id,
        fileName: importFile.fileName,
      },
    };
  }

  // Step 2: Find records that already exist in the DB for this user
  const existingDocs = await PettyCashRecord.find({
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

  // Step 3: Keep only records that do NOT exist in the DB
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
      fileName: fileName || 'Imported Excel File',
      createdBy: userId,
      recordCount: 0,
      type: 'pettyCash',
    });
  }

  const recordsToInsert = newRecords.map(record => ({
    ...record,
    createdBy: userId,
    sourceFileName: fileName || 'Imported Excel File',
    importFileId: importFile._id,
  }));

  let insertedCount = 0;
  let dbSkipped = 0;

  try {
    // ordered: false → MongoDB continues on duplicate key errors instead of stopping
    const result = await PettyCashRecord.insertMany(recordsToInsert, { ordered: false });
    insertedCount = result.length;
  } catch (bulkErr) {
    // Code 11000 = duplicate key — some records inserted, some skipped
    if (bulkErr.code === 11000 || bulkErr.name === 'BulkWriteError') {
      insertedCount = bulkErr.result?.nInserted ?? 0;
      dbSkipped = recordsToInsert.length - insertedCount;
    } else {
      throw bulkErr; // rethrow unexpected errors
    }
  }

  const totalSkipped = skipped + dbSkipped;
  
  importFile = await ImportedFile.findByIdAndUpdate(
    importFile._id, 
    { $inc: { recordCount: insertedCount } },
    { new: true }
  );

  return {
    message: `Successfully imported ${insertedCount} record(s).${totalSkipped > 0 ? ` ${totalSkipped} duplicate(s) were skipped.` : ''}`,
    count: insertedCount,
    skipped: totalSkipped,
    file: {
      id: importFile._id,
      fileName: importFile.fileName,
    },
  };
};

exports.importRecords = async (req, res) => {
  try {
    const records = req.body.records;
    const fileName = req.body.fileName;
    const result = await processImportRecords(records, fileName, req.user.id);
    const status = result.count > 0 ? 201 : 200;
    res.status(status).json(result);
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

const syncPettyCashForUser = async (userId) => {
  const sheetId = process.env.GOOGLE_DRIVE_PETTYCASH_SHEET_ID || '1NCNqPIdGepw7nl_dHiPuULonvrTDdAq9v1yuU172tso';
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
      number: parseNum(row[3]),
      payingOfficer: {
        name: row[4],
        email: row[5],
        empNumber: parseNum(row[6])
      },
      supervisingOfficer: {
        name: row[7],
        email: row[8],
        empNumber: parseNum(row[9])
      },
      reportingAccountant: {
        name: row[10],
        email: row[11],
        empNumber: parseNum(row[12])
      },
      year: parseNum(row[13]),
      month: row[14],
      floatAmount: parseNum(row[15]),
      cashInHand: parseNum(row[16]),
      invoiceAmount: parseNum(row[17]),
      utilization: parseNum(row[18]),
      variance: parseNum(row[19]),
      varianceStatus: row[20],
      checkedStatus: row[21]
    });
  }

  return await processImportRecords(records, 'GoogleDrive_PettyCash.xlsx', userId);
};

exports.syncPettyCashForUser = syncPettyCashForUser;

exports.googleDriveSync = async (req, res) => {
  try {
    const result = await syncPettyCashForUser(req.user.id);

    const user = await User.findById(req.user.id).select('name email role').lean();
    if (user) {
      await createAuditLog(
        user,
        'Imported Petty Cash from Google Drive',
        'import',
        `Successfully synchronized ${result.count} record(s) from Google Drive.`,
        { fileName: 'PettyCash.xlsx', syncSource: 'Google Drive', importedCount: result.count, skippedCount: result.skipped },
        req
      );
    }

    const status = result.count > 0 ? 201 : 200;
    res.status(status).json(result);
  } catch (err) {
    console.error('Google Drive Sync error:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const { importFileId } = req.query;
    let targetUserId = req.user.id;

    if (req.user.role !== 'admin') {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        targetUserId = adminUser._id;
      }
    }

    let matchQuery = { createdBy: new Types.ObjectId(targetUserId) };

    if (importFileId === 'legacy') {
      matchQuery.$or = [{ importFileId: { $exists: false } }, { importFileId: null }];
    } else if (importFileId) {
      matchQuery.importFileId = new Types.ObjectId(importFileId);
    }

    const records = await PettyCashRecord.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'accountants',
          let: { 
            r_region: { $toLower: { $trim: { input: '$region' } } }, 
            r_pcf: { $toLower: { $trim: { input: '$pcfRef' } } }, 
            r_year: '$year', 
            r_month: { $toLower: { $trim: { input: '$month' } } }, 
            r_user: '$createdBy' 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$createdBy', '$$r_user'] },
                    { $eq: [{ $toLower: { $trim: { input: '$region' } } }, '$$r_region'] },
                    { $eq: [{ $toLower: { $trim: { input: '$pcfRef' } } }, '$$r_pcf'] },
                    { $eq: ['$year', '$$r_year'] },
                    { $eq: [{ $toLower: { $trim: { input: '$month' } } }, '$$r_month'] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 }
          ],
          as: 'accountantInfo'
        }
      },
      { $addFields: { accountant: { $arrayElemAt: ['$accountantInfo', 0] } } },
      {
        $addFields: {
          // Priority: Accountant record > PettyCash record
          number: { $ifNull: ['$accountant.number', '$number'] },
          costCenterName: { $ifNull: ['$accountant.costCenterName', '$costCenterName'] }
        }
      },
      { $project: { accountantInfo: 0, accountant: 0 } },
      { $sort: { year: -1, month: -1, createdAt: -1 } }
    ]);

    res.json(records);
  } catch (err) {
    console.error('getRecords error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getImportedFiles = async (req, res) => {
  try {
    const files = await ImportedFile.find({ 
      createdBy: req.user.id, 
      $or: [{ type: 'pettyCash' }, { type: { $exists: false } }, { type: null }] 
    }).sort({ createdAt: -1 }).lean();

    const legacyCount = await PettyCashRecord.countDocuments({
      createdBy: req.user.id,
      $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
    });

    if (legacyCount > 0) {
      const latestLegacyRecord = await PettyCashRecord.findOne({
        createdBy: req.user.id,
        $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
      }).sort({ createdAt: -1 });

      files.push({
        _id: 'legacy',
        fileName: latestLegacyRecord?.sourceFileName || 'Legacy Imported Data',
        recordCount: legacyCount,
        createdAt: latestLegacyRecord?.createdAt || new Date(),
      });
    }

    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteRecords = async (req, res) => {
  try {
    const { importFileId } = req.query;

    if (importFileId) {
      let result;

      if (importFileId === 'legacy') {
        result = await PettyCashRecord.deleteMany({
          createdBy: req.user.id,
          $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
        });
      } else {
        result = await PettyCashRecord.deleteMany({ createdBy: req.user.id, importFileId });
        await ImportedFile.deleteOne({ _id: importFileId, createdBy: req.user.id });
      }

      return res.json({
        message: 'Selected imported file data deleted successfully.',
        deletedCount: result.deletedCount || 0,
      });
    }

    const result = await PettyCashRecord.deleteMany({ createdBy: req.user.id });
    // Fix: Only delete pettyCash files, don't touch accountant files
    await ImportedFile.deleteMany({ 
      createdBy: req.user.id, 
      $or: [{ type: 'pettyCash' }, { type: { $exists: false } }, { type: null }] 
    });

    res.json({ message: 'Imported data deleted successfully.', deletedCount: result.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
