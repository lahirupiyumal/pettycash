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
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PettyCashRecord', pettyCashRecordSchema);
