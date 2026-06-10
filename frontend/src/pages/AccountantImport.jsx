import { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/axios';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';

export default function AccountantImport({ onImportSuccess }) {
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
          if (!row || row.length === 0 || !row[0]) continue; 

          records.push({
            region: row[0],
            pcfRef: row[1],
            costCenterName: row[2],
            number: String(row[3] || ''),
            year: parseNum(row[4]),
            month: row[5]
          });
        }

        const response = await api.post('/accountants/import', { records, fileName: file.name });
        setSuccess(response.data.message);
        setFile(null);
        if (onImportSuccess) onImportSuccess();
        
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error processing file');
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8 max-w-4xl mx-auto">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-indigo-600 shadow-inner">
            <UploadCloud className="h-5 w-5" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Import Accountant Details</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Accountant Records</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 bg-slate-50/50">
        <div className="mb-8 max-w-2xl text-sm font-medium text-slate-600 leading-relaxed">
          <p>
            Upload the Accountant Details Excel file. The expected format is: 
            <span className="font-bold text-slate-800 ml-1">Region, PCF Ref, Cost Center Name, Number, Year, Month</span>.
          </p>
          <p className="mt-2 text-indigo-600 font-semibold italic text-xs">
            * Duplicate records found in previously uploaded files will be automatically skipped to prevent data redundancy.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 text-sm font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div 
            className="flex items-center justify-center w-full"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <label 
              htmlFor="dropzone-file-acc" 
              className={`group flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                file 
                  ? 'border-indigo-500 bg-gradient-to-b from-indigo-50/50 to-purple-50/50 shadow-inner shadow-indigo-100' 
                  : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 ${file ? 'bg-indigo-100 scale-110' : 'bg-slate-100 group-hover:scale-110 group-hover:bg-indigo-50'}`}>
                  {file ? (
                    <FileSpreadsheet className="h-8 w-8 text-indigo-600" strokeWidth={1.5} />
                  ) : (
                    <UploadCloud className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors" strokeWidth={1.5} />
                  )}
                </div>
                
                {file ? (
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Ready to process</p>
                    <p className="text-[11px] text-slate-400 mt-2">Click or drag here to choose a different file</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700"><span className="text-indigo-600 font-bold">Click to browse</span> or drag and drop</p>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-widest pt-1">XLSX, XLS or CSV (MAX. 10MB)</p>
                  </div>
                )}
              </div>
              <input 
                id="dropzone-file-acc" 
                type="file" 
                className="hidden" 
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />
            </label>
          </div>
          
          <div className="mt-8 flex justify-end pt-6 border-t border-slate-200">
            <button 
              type="submit" 
              disabled={!file || loading}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-900/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-900/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:pointer-events-none disabled:opacity-50 ring-1 ring-white/10"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  <span>Processing File...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" strokeWidth={2.5} />
                  <span>Import Accountant Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
