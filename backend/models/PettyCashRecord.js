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
  total: { type: Number },
  dateOfReconciliation: { type: String },
  
  varianceStatus: { type: String },
  checkedStatus: { type: String },
  sourceFileName: { type: String },
  importFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportedFile' },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Keep identity lookups fast while allowing multiple non-identical Excel rows
// for the same user, region, PCF ref, year, and month.
pettyCashRecordSchema.index(
  { createdBy: 1, region: 1, pcfRef: 1, year: 1, month: 1 },
  { collation: { locale: 'en', strength: 2 } } // case-insensitive
);

module.exports = mongoose.model('PettyCashRecord', pettyCashRecordSchema);
