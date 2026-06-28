const mongoose = require('mongoose');
const { Types } = mongoose;
const PettyCashRecord = require('../models/PettyCashRecord');
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

const normalizeIdentityValue = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return Number.isNaN(value) ? '' : value;
  return String(value).trim().toLowerCase();
};

const exactExcelValue = (value) => {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
};

const getReconciliationValue = (record) => {
  if (record.dateOfReconciliation !== undefined && record.dateOfReconciliation !== null) {
    return record.dateOfReconciliation;
  }
  return record.checkedStatus;
};

const buildRecordIdentityKey = (record) => JSON.stringify([
  normalizeIdentityValue(record.region),
  normalizeIdentityValue(record.pcfRef),
  normalizeIdentityValue(record.year),
  normalizeIdentityValue(record.month),
]);

const buildImportedExcelRowKey = (record) => JSON.stringify([
  exactExcelValue(record.region),
  exactExcelValue(record.pcfRef),
  exactExcelValue(record.costCenterName),
  exactExcelValue(record.number),
  exactExcelValue(record.payingOfficer?.email),
  exactExcelValue(record.supervisingOfficer?.name),
  exactExcelValue(record.supervisingOfficer?.email),
  exactExcelValue(record.supervisingOfficer?.empNumber),
  exactExcelValue(record.reportingAccountant?.name),
  exactExcelValue(record.reportingAccountant?.email),
  exactExcelValue(record.reportingAccountant?.empNumber),
  exactExcelValue(record.payingOfficer?.name),
  exactExcelValue(record.payingOfficer?.empNumber),
  exactExcelValue(getReconciliationValue(record)),
  exactExcelValue(record.floatAmount),
  exactExcelValue(record.cashInHand),
  exactExcelValue(record.invoiceAmount),
  exactExcelValue(record.total),
  exactExcelValue(record.variance),
]);

const getRecordIdentityFilter = (record, userId) => ({
  createdBy: userId,
  region: record.region,
  pcfRef: record.pcfRef,
  year: record.year,
  month: record.month,
});

const CASE_INSENSITIVE_COLLATION = { locale: 'en', strength: 2 };
const LEGACY_IDENTITY_INDEX_KEY = { createdBy: 1, region: 1, pcfRef: 1, year: 1, month: 1 };
const RECORD_LOOKUP_FIELDS = 'region pcfRef costCenterName number payingOfficer supervisingOfficer reportingAccountant year month floatAmount cashInHand invoiceAmount total variance checkedStatus dateOfReconciliation importFileId';
const IDENTITY_LOOKUP_BATCH_SIZE = 500;
const PETTY_CASH_FILE_TYPE_FILTER = [{ type: 'pettyCash' }, { type: { $exists: false } }, { type: null }];

let legacyIdentityIndexDropPromise = null;

const getAdminUserObjectIds = async (currentUserId) => {
  const adminIds = await User.distinct('_id', { role: 'admin' });
  const adminIdSet = new Set(adminIds.map(id => String(id)));

  if (currentUserId && !adminIdSet.has(String(currentUserId))) {
    adminIds.push(currentUserId);
  }

  return adminIds.map(id => id instanceof Types.ObjectId ? id : new Types.ObjectId(id));
};

const getVisibleImportedOwnerFilter = async (req) => {
  if (req.user.role === 'admin') {
    return { $in: await getAdminUserObjectIds(req.user.id) };
  }

  return new Types.ObjectId(req.user.id);
};

const hasSameIndexKey = (actualKey, expectedKey) => {
  const actualEntries = Object.entries(actualKey || {});
  const expectedEntries = Object.entries(expectedKey);
  return actualEntries.length === expectedEntries.length
    && expectedEntries.every(([key, value]) => actualKey[key] === value);
};

const dropLegacyIdentityUniqueIndex = async () => {
  if (!legacyIdentityIndexDropPromise) {
    legacyIdentityIndexDropPromise = (async () => {
      const indexes = await PettyCashRecord.collection.indexes();
      const legacyIndex = indexes.find(index =>
        index.unique && hasSameIndexKey(index.key, LEGACY_IDENTITY_INDEX_KEY)
      );

      if (legacyIndex) {
        await PettyCashRecord.collection.dropIndex(legacyIndex.name);
      }
    })().catch((err) => {
      legacyIdentityIndexDropPromise = null;
      if (err?.codeName === 'IndexNotFound' || err?.code === 27) return;
      throw err;
    });
  }

  return legacyIdentityIndexDropPromise;
};

const fetchExistingRecordsForIdentities = async (userId, identityFilters) => {
  if (identityFilters.length === 0) return [];

  const queries = [];
  for (let i = 0; i < identityFilters.length; i += IDENTITY_LOOKUP_BATCH_SIZE) {
    const batch = identityFilters.slice(i, i + IDENTITY_LOOKUP_BATCH_SIZE);
    queries.push(
      PettyCashRecord.find({
        createdBy: userId,
        $or: batch.map(({ createdBy, ...filter }) => filter),
      })
        .select(RECORD_LOOKUP_FIELDS)
        .collation(CASE_INSENSITIVE_COLLATION)
        .lean()
    );
  }

  const batches = await Promise.all(queries);
  return batches.flat();
};

const processImportRecords = async (records, fileName, userId) => {
  if (!records || !Array.isArray(records) || records.length === 0) {
    throw new Error('Invalid records array');
  }

  // Step 1: Deduplicate exact Excel rows within the uploaded file itself.
  const uniqueIncoming = [];
  const seenExcelRows = new Set();
  for (const r of records) {
    const key = buildImportedExcelRowKey(r);
    if (!seenExcelRows.has(key)) {
      seenExcelRows.add(key);
      uniqueIncoming.push(r);
    }
  }

  const isGoogleDriveSync = fileName === 'GoogleDrive_PettyCash.xlsx';
  const identityFilters = [
    ...new Map(
      uniqueIncoming.map(record => [
        buildRecordIdentityKey(record),
        getRecordIdentityFilter(record, userId),
      ])
    ).values(),
  ];

  const existingDocs = await fetchExistingRecordsForIdentities(userId, identityFilters);

  const existingExcelRows = new Set(existingDocs.map(buildImportedExcelRowKey));
  const recordsToInsert = uniqueIncoming.filter(record => !existingExcelRows.has(buildImportedExcelRowKey(record)));
  const skipped = records.length - recordsToInsert.length;

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

    if (recordsToInsert.length === 0) {
      return {
        message: `No petty cash changes found. ${skipped} duplicate record(s) were skipped.`,
        count: 0,
        skipped,
        file: {
          id: importFile._id,
          fileName: importFile.fileName,
        },
      };
    }

    await dropLegacyIdentityUniqueIndex();

    const recordsToCreate = recordsToInsert.map(record => ({
      ...record,
      createdBy: userId,
      sourceFileName: fileName,
      importFileId: importFile._id
    }));

    const insertedDocs = await PettyCashRecord.insertMany(recordsToCreate, { ordered: false });

    const recordCount = await PettyCashRecord.countDocuments({
      createdBy: userId,
      importFileId: importFile._id,
    });

    importFile = await ImportedFile.findByIdAndUpdate(
      importFile._id,
      { recordCount },
      { new: true }
    );

    return {
      message: `Successfully synchronized ${insertedDocs.length} changed record(s) from Google Drive.${skipped > 0 ? ` ${skipped} duplicate(s) were skipped.` : ''}`,
      count: insertedDocs.length,
      skipped,
      file: {
        id: importFile._id,
        fileName: importFile.fileName,
      },
    };
  }

  let importFile = null;

  if (recordsToInsert.length === 0) {
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

  await dropLegacyIdentityUniqueIndex();

  const recordsToCreate = recordsToInsert.map(record => ({
    ...record,
    createdBy: userId,
    sourceFileName: fileName || 'Imported Excel File',
    importFileId: importFile._id,
  }));

  const insertedDocs = await PettyCashRecord.insertMany(recordsToCreate, { ordered: false });

  importFile = await ImportedFile.findByIdAndUpdate(
    importFile._id,
    { $inc: { recordCount: insertedDocs.length } },
    { new: true }
  );

  return {
    message: `Successfully imported ${insertedDocs.length} record(s).${skipped > 0 ? ` ${skipped} duplicate(s) were skipped.` : ''}`,
    count: insertedDocs.length,
    skipped,
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
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const result = await processImportRecords(records, fileName, sharedAdminId);
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

  const parseDateOfReconciliation = (val) => {
    if (!val) {
      const d = new Date();
      return {
        dateStr: '',
        year: d.getFullYear(),
        month: d.toLocaleString('en-US', { month: 'long' })
      };
    }

    if (val instanceof Date) {
      return {
        dateStr: val.toISOString().split('T')[0],
        year: val.getFullYear(),
        month: val.toLocaleString('en-US', { month: 'long' })
      };
    }

    const str = String(val).trim();
    
    // Check if Excel serial number
    const numVal = Number(str);
    if (!isNaN(numVal) && numVal > 30000 && numVal < 60000) {
      const dateObj = new Date((numVal - 25569) * 86400 * 1000);
      if (!isNaN(dateObj.getTime())) {
        return {
          dateStr: dateObj.toISOString().split('T')[0],
          year: dateObj.getFullYear(),
          month: dateObj.toLocaleString('en-US', { month: 'long' })
        };
      }
    }

    let parts = str.split(/[-/.]/);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const year = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) {
          return {
            dateStr: str,
            year,
            month: d.toLocaleString('en-US', { month: 'long' })
          };
        }
      } else {
        const day = parseInt(parts[0], 10);
        const monthIdx = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const d = new Date(year, monthIdx, day);
        if (!isNaN(d.getTime())) {
          return {
            dateStr: str,
            year,
            month: d.toLocaleString('en-US', { month: 'long' })
          };
        }
      }
    }

    const parsedDate = new Date(str);
    if (!isNaN(parsedDate.getTime())) {
      return {
        dateStr: str,
        year: parsedDate.getFullYear(),
        month: parsedDate.toLocaleString('en-US', { month: 'long' })
      };
    }

    const d = new Date();
    return {
      dateStr: str,
      year: d.getFullYear(),
      month: d.toLocaleString('en-US', { month: 'long' })
    };
  };

  const records = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || !row[0]) continue;

    const rawReconciliationDate = row[13];
    const { dateStr, year, month } = parseDateOfReconciliation(rawReconciliationDate);
    const floatVal = parseNum(row[14]);
    const expensesVal = parseNum(row[16]);
    const varianceVal = parseNum(row[18]);

    records.push({
      region: row[0],
      pcfRef: row[1],
      costCenterName: row[2],
      number: parseNum(row[3]),
      payingOfficer: {
        name: row[11],
        email: row[4],
        empNumber: parseNum(row[12])
      },
      supervisingOfficer: {
        name: row[5],
        email: row[6],
        empNumber: parseNum(row[7])
      },
      reportingAccountant: {
        name: row[8],
        email: row[9],
        empNumber: parseNum(row[10])
      },
      year,
      month,
      floatAmount: floatVal,
      cashInHand: parseNum(row[15]),
      invoiceAmount: expensesVal,
      total: parseNum(row[17]),
      variance: varianceVal,
      utilization: floatVal ? (expensesVal / floatVal) * 100 : 0,
      varianceStatus: varianceVal === 0 ? 'Balanced' : 'Unbalanced',
      checkedStatus: dateStr || String(rawReconciliationDate || ''),
      dateOfReconciliation: dateStr || String(rawReconciliationDate || '')
    });
  }

  return await processImportRecords(records, 'GoogleDrive_PettyCash.xlsx', userId);
};

exports.syncPettyCashForUser = syncPettyCashForUser;

exports.googleDriveSync = async (req, res) => {
  try {
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const result = await syncPettyCashForUser(sharedAdminId);

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
    // All roles always read from the shared admin's data pool
    const targetUserId = await getSharedAdminId(req.user.id);

    let matchQuery = { createdBy: targetUserFilter };

    // Collect $or conditions; we may need more than one
    const orConditions = [];

    if (importFileId === 'legacy') {
      orConditions.push([{ importFileId: { $exists: false } }, { importFileId: null }]);
    } else if (importFileId) {
      matchQuery.importFileId = new Types.ObjectId(importFileId);
    }

    // Accountant filtering: only show records assigned to their service number
    if (req.user.role === 'accountant' && req.user.serviceNumber) {
      const trimmedServiceNumber = req.user.serviceNumber.trim();
      const svcNum = parseInt(trimmedServiceNumber, 10);
      const empNumberVariants = [
        { 'reportingAccountant.empNumber': trimmedServiceNumber },
        { 'reportingAccountant.empNumber': String(trimmedServiceNumber) }
      ];
      if (!isNaN(svcNum)) {
        empNumberVariants.push({ 'reportingAccountant.empNumber': svcNum });
        empNumberVariants.push({ 'reportingAccountant.empNumber': String(svcNum) });
        empNumberVariants.push({ 'reportingAccountant.empNumber': String(svcNum).padStart(6, '0') });
      }
      orConditions.push(empNumberVariants);
      console.log('Accountant filtering - serviceNumber:', trimmedServiceNumber, 'svcNum:', svcNum, 'variants:', empNumberVariants);
    }

    // Merge all $or conditions safely using $and
    if (orConditions.length === 1) {
      matchQuery.$or = orConditions[0];
    } else if (orConditions.length > 1) {
      matchQuery.$and = orConditions.map(cond => ({ $or: cond }));
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
    const sharedAdminId = await getSharedAdminId(req.user.id);
    const files = await ImportedFile.find({
      createdBy: sharedAdminId,
      $or: [{ type: 'pettyCash' }, { type: { $exists: false } }, { type: null }]
    }).sort({ createdAt: -1 }).lean();

    const legacyCount = await PettyCashRecord.countDocuments({
      createdBy: sharedAdminId,
      $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
    });

    if (legacyCount > 0) {
      const latestLegacyRecord = await PettyCashRecord.findOne({
        createdBy: sharedAdminId,
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
    const sharedAdminId = await getSharedAdminId(req.user.id);

    if (importFileId) {
      let result;

      if (importFileId === 'legacy') {
        result = await PettyCashRecord.deleteMany({
          createdBy: sharedAdminId,
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

    const result = await PettyCashRecord.deleteMany({ createdBy: sharedAdminId });
    // Fix: Only delete pettyCash files, don't touch accountant files
    await ImportedFile.deleteMany({
      createdBy: sharedAdminId,
      $or: [{ type: 'pettyCash' }, { type: { $exists: false } }, { type: null }]
    });

    res.json({ message: 'Imported data deleted successfully.', deletedCount: result.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
