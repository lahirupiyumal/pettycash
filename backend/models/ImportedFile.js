const mongoose = require('mongoose');

const importedFileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  recordCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('ImportedFile', importedFileSchema);
