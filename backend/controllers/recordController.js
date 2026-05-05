const PettyCashRecord = require('../models/PettyCashRecord');
const ImportedFile = require('../models/ImportedFile');

exports.importRecords = async (req, res) => {
  try {
    const records = req.body.records;
    const fileName = req.body.fileName;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Invalid records array' });
    }

    const importFile = await ImportedFile.create({
      fileName: fileName || 'Imported Excel File',
      createdBy: req.user.id,
      recordCount: records.length,
    });

    // Add createdBy, sourceFileName, and importFileId to all records
    const recordsWithUser = records.map(record => ({
      ...record,
      createdBy: req.user.id,
      sourceFileName: fileName || 'Imported Excel File',
      importFileId: importFile._id,
    }));

    const inserted = await PettyCashRecord.insertMany(recordsWithUser);
    await ImportedFile.findByIdAndUpdate(importFile._id, { recordCount: inserted.length });

    res.status(201).json({
      message: `Successfully imported ${inserted.length} records.`,
      count: inserted.length,
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
      const latestFile = await ImportedFile.findOne({ createdBy: req.user.id }).sort({ createdAt: -1 });
      if (latestFile) {
        targetImportFileId = latestFile._id;
      } else {
        const legacyRecords = await PettyCashRecord.find({
          createdBy: req.user.id,
          $or: [{ importFileId: { $exists: false } }, { importFileId: null }],
        }).sort({ year: -1, month: -1, createdAt: -1 });

        return res.json(legacyRecords);
      }
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
