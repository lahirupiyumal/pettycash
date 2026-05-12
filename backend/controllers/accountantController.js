const Accountant = require('../models/Accountant');
const ImportedFile = require('../models/ImportedFile');

exports.importAccountants = async (req, res) => {
  try {
    const { records, fileName } = req.body;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'Invalid records array' });
    }

    const importFile = await ImportedFile.create({
      fileName: fileName || 'Imported Accountant File',
      createdBy: req.user.id,
      recordCount: records.length,
      type: 'accountant',
    });

    const recordsToInsert = records.map(record => ({
      ...record,
      createdBy: req.user.id,
      importFileId: importFile._id,
    }));

    await Accountant.insertMany(recordsToInsert);

    res.status(201).json({
      message: `Successfully imported ${records.length} accountant record(s).`,
      count: records.length,
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
