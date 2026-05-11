const mongoose = require('mongoose');

const pettyCashRecordSchema = new mongoose.Schema({
  region: { type: String },
  pcfRef: { type: String },
  costCenterName: { type: String },
  number: { type: Number },
  
  payingOfficer: {
    name: { type: String },
    email: { type: String },
    empNumber: { type: Number }
  },
  
  supervisingOfficer: {
    name: { type: String },
    email: { type: String },
    empNumber: { type: Number }
  },
  
  reportingAccountant: {
    name: { type: String },
    email: { type: String },
    empNumber: { type: Number }
  },
  
  year: { type: Number },
  month: { type: String },
  
  floatAmount: { type: Number },
  cashInHand: { type: Number },
  invoiceAmount: { type: Number },
  utilization: { type: Number },
  variance: { type: Number },
  
  varianceStatus: { type: String },
  checkedStatus: { type: String },
  sourceFileName: { type: String },
  importFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportedFile' },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Enforce uniqueness at the database level across ALL files.
// A record for the same user, region, pcfRef, year, and month can only exist once.
pettyCashRecordSchema.index(
  { createdBy: 1, region: 1, pcfRef: 1, year: 1, month: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } } // case-insensitive
);

module.exports = mongoose.model('PettyCashRecord', pettyCashRecordSchema);
