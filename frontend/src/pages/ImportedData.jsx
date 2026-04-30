import { useState } from 'react';
import { Trash2, FileSpreadsheet } from 'lucide-react';
import api from '../api/axios';

export default function ImportedDataPage({ records = [], loading, error, onDeleteSuccess }) {
  const [deleting, setDeleting] = useState(false);

  if (error) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</p>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fileName = records[0]?.sourceFileName || 'Imported Excel File';
  const importDate = records.length > 0 && records[0]?.createdAt 
    ? new Date(records[0].createdAt).toLocaleString('en-LK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete all imported records? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await api.delete('/records');
        if (onDeleteSuccess) onDeleteSuccess();
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/60">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-blue-400/20 blur-lg"></div>
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 shadow-md">
                <FileSpreadsheet className="h-6 w-6 text-blue-700" strokeWidth={1.5} />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">📊 Imported Data</p>
              <p className="text-base font-bold text-slate-900 line-clamp-1">{fileName}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100 px-0">
          <div className="bg-gradient-to-br from-white to-slate-50 px-6 py-4 transition-all hover:from-slate-50 hover:to-white">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">📅 Import Date</p>
              <p className="text-sm font-bold text-slate-900">{importDate}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-slate-50 px-6 py-4 transition-all hover:from-slate-50 hover:to-white">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">📑 Records</p>
              <p className="text-sm font-bold text-slate-900">{records.length} <span className="text-xs text-slate-500 font-medium">rows</span></p>
            </div>
          </div>

          <div className="flex items-center justify-center bg-gradient-to-br from-red-50 to-rose-50 px-6 py-4 transition-all hover:from-red-100 hover:to-rose-100">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting || records.length === 0}
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
              <span>{deleting ? 'Deleting' : 'Delete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
