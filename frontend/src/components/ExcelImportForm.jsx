import { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';

export default function ExcelImportForm({ onImportSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
      setSuccess('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Use header: 1 to get a 2D array to handle duplicate column names like "Emp Number"
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          throw new Error("File is empty or missing headers");
        }
        
        const parseNum = (val) => {
          if (val === undefined || val === null || val === '') return null;
          const parsed = Number(String(val).replace(/,/g, ''));
          return isNaN(parsed) ? null : parsed;
        };

        const records = [];
        // Skip header row
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

          records.push({
            region: row[0],
            pcfRef: row[1],
            costCenterName: row[2],
            number: parseNum(row[3]),
            
            payingOfficer: {
              name: row[4],
              email: row[5],
              empNumber: parseNum(row[6])
            },
            
            supervisingOfficer: {
              name: row[7],
              email: row[8],
              empNumber: parseNum(row[9])
            },
            
            reportingAccountant: {
              name: row[10],
              email: row[11],
              empNumber: parseNum(row[12])
            },
            
            year: parseNum(row[13]),
            month: row[14],
            floatAmount: parseNum(row[15]),
            cashInHand: parseNum(row[16]),
            invoiceAmount: parseNum(row[17]),
            utilization: parseNum(row[18]),
            variance: parseNum(row[19]),
            varianceStatus: row[20],
            checkedStatus: row[21]
          });
        }

        const response = await api.post('/records/import', { records, fileName: file.name });
        setSuccess(response.data.message);
        setFile(null);
        if (onImportSuccess) onImportSuccess();
        
      } catch (err) {
        setError(err.message || 'Error processing file');
      } finally {
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-800">Import Transactions from Excel</h3>
      </div>
      
      <div className="p-8">
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Upload the Regional Petty Cash Excel file.
            Make sure the columns exactly match the standard template format.
          </p>
        </div>

        {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}
        {success && <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div 
            className="flex items-center justify-center w-full"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label 
              htmlFor="dropzone-file" 
              className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className={`w-10 h-10 mb-3 ${file ? 'text-blue-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                {file ? (
                  <>
                    <p className="mb-2 text-sm text-gray-700 font-semibold">Selected file: {file.name}</p>
                    <p className="text-xs text-gray-500">Click or drag and drop to change file</p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                    <p className="text-xs text-gray-500">XLSX, XLS or CSV (MAX. 10MB)</p>
                  </>
                )}
              </div>
              <input 
                id="dropzone-file" 
                type="file" 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              type="submit" 
              disabled={!file || loading}
              className="bg-blue-600 text-white font-medium py-2.5 px-6 rounded-lg transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Process File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
