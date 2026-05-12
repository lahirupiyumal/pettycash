const mongoose = require('mongoose');

const accountantDetailSchema = new mongoose.Schema({
  region: { type: String },
  pcfRef: { type: String },
  costCenterName: { type: String },
  number: { type: String },
  year: { type: Number },
  month: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  importFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportedFile' }
}, { timestamps: true });

module.exports = mongoose.model('Accountant', accountantDetailSchema);
