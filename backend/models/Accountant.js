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

// Ensure uniqueness and enable efficient lookup/joining
accountantDetailSchema.index(
  { createdBy: 1, region: 1, pcfRef: 1, year: 1, month: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
);

module.exports = mongoose.model('Accountant', accountantDetailSchema);
