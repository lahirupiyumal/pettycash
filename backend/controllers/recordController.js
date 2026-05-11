const PettyCashRecord = require('../models/PettyCashRecord');
const ImportedFile = require('../models/ImportedFile');

exports.importRecords = async (req, res) => {
  try {
    const records = req.body.records;
    const fileName = req.body.fileName;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Invalid records array' });
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

    // Step 2: Find records that already exist in the DB for this user
    const existingDocs = await PettyCashRecord.find({
      createdBy: req.user.id,
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

    if (newRecords.length === 0) {
      return res.status(200).json({
        message: `No new records imported. All ${skipped} record(s) already exist in the system.`,
        count: 0,
        skipped,
      });
    }

    const importFile = await ImportedFile.create({
      fileName: fileName || 'Imported Excel File',
      createdBy: req.user.id,
      recordCount: newRecords.length,
    });

    const recordsToInsert = newRecords.map(record => ({
      ...record,
      createdBy: req.user.id,
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
    await ImportedFile.findByIdAndUpdate(importFile._id, { recordCount: insertedCount });

    res.status(201).json({
      message: `Successfully imported ${insertedCount} record(s).${totalSkipped > 0 ? ` ${totalSkipped} duplicate(s) were skipped.` : ''}`,
      count: insertedCount,
      skipped: totalSkipped,
      file: {
        id: importFile._id,
        fileName: importFile.fileName,
      },
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const { importFileId } = req.query;
    let targetImportFileId = importFileId;

    if (targetImportFileId === 'legacy') {
      const legacyRecords = await PettyCashRecord.find({
        createdBy: req.user.id,
        $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
      }).sort({ year: -1, month: -1, createdAt: -1 });

      return res.json(legacyRecords);
    }

    if (!targetImportFileId) {
      const allRecords = await PettyCashRecord.find({
        createdBy: req.user.id,
      }).sort({ year: -1, month: -1, createdAt: -1 });

      return res.json(allRecords);
    }

    const records = await PettyCashRecord.find({
      createdBy: req.user.id,
      importFileId: targetImportFileId,
    }).sort({ year: -1, month: -1, createdAt: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getImportedFiles = async (req, res) => {
  try {
    const files = await ImportedFile.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).lean();

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
    await ImportedFile.deleteMany({ createdBy: req.user.id });

    res.json({ message: 'Imported data deleted successfully.', deletedCount: result.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
