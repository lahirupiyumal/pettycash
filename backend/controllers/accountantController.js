const Accountant = require('../models/Accountant');
const ImportedFile = require('../models/ImportedFile');

exports.importAccountants = async (req, res) => {
  try {
    const { records, fileName } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Invalid records array' });
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

    // Step 2: Find records that already exist in the DB
    const existingDocs = await Accountant.find({
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

    // Step 3: Keep only new records
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
      fileName: fileName || 'Imported Accountant File',
      createdBy: req.user.id,
      recordCount: newRecords.length,
      type: 'accountant',
    });

    const recordsToInsert = newRecords.map(record => ({
      ...record,
      createdBy: req.user.id,
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

    await ImportedFile.findByIdAndUpdate(importFile._id, { recordCount: insertedCount });

    res.status(201).json({
      message: `Successfully imported ${insertedCount} accountant record(s).${skipped > 0 ? ` ${skipped} duplicate(s) were skipped.` : ''}`,
      count: insertedCount,
      skipped,
      file: {
        id: importFile._id,
        fileName: importFile.fileName,
      },
    });
  } catch (err) {
    console.error('Accountant import error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getAccountants = async (req, res) => {
  try {
    const { importFileId } = req.query;
    const query = { createdBy: req.user.id };
    if (importFileId) {
      query.importFileId = importFileId;
    }

    const accountants = await Accountant.find(query).sort({ createdAt: -1 });
    res.json(accountants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getImportedFiles = async (req, res) => {
  try {
    const files = await ImportedFile.find({ createdBy: req.user.id, type: 'accountant' }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAccountants = async (req, res) => {
  try {
    const { importFileId } = req.query;
    if (importFileId) {
      await Accountant.deleteMany({ createdBy: req.user.id, importFileId });
      await ImportedFile.deleteOne({ _id: importFileId, createdBy: req.user.id });
      return res.json({ message: 'Selected imported file data deleted successfully.' });
    }

    const fileIds = await Accountant.distinct('importFileId', { createdBy: req.user.id });
    await Accountant.deleteMany({ createdBy: req.user.id });
    await ImportedFile.deleteMany({ _id: { $in: fileIds } });

    res.json({ message: 'All accountant data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
