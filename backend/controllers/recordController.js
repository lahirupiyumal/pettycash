const PettyCashRecord = require('../models/PettyCashRecord');

exports.importRecords = async (req, res) => {
  try {
    const records = req.body.records;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ message: 'Invalid records array' });
    }

    // Add createdBy to all records
    const recordsWithUser = records.map(record => ({
      ...record,
      createdBy: req.user.id
    }));

    // To prevent massive duplicates, if the user re-imports, we might want to clear old ones.
    // For now, we will clear their previous records to keep the DB clean as it's a dashboard view.
    await PettyCashRecord.deleteMany({ createdBy: req.user.id });

    const inserted = await PettyCashRecord.insertMany(recordsWithUser);
    res.status(201).json({ message: `Successfully imported ${inserted.length} records.`, count: inserted.length });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await PettyCashRecord.find({ createdBy: req.user.id }).sort({ year: -1, month: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
