import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileSpreadsheet, Hash, Layers, Trash2 } from 'lucide-react';
import api from '../api/axios';

export default function ImportedDataPage({ loading, error, onDeleteSuccess, refreshTrigger = 0 }) {
  const [deleting, setDeleting] = useState(false);
  const [filesLoading, setFilesLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setFilesLoading(true);
        setPageError('');
        const response = await api.get('/records/files');
        const nextFiles = response.data || [];
        setFiles(nextFiles);
        if (nextFiles.length === 0) { setSelectedFileId(''); return; }
        setSelectedFileId((currentId) => {
          if (currentId && nextFiles.some((file) => file._id === currentId)) return currentId;
          return nextFiles[0]._id;
        });
      } catch (err) {
        setPageError(err.response?.data?.message || err.message || 'Failed to load imported files.');
      } finally {
        setFilesLoading(false);
      }
    };
    fetchFiles();
  }, [refreshTrigger]);

  const selectedFile = useMemo(() => files.find((file) => file._id === selectedFileId), [files, selectedFileId]);

  if (error) return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</p>;

  if (loading || filesLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-blue-100 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading files…</p>
        </div>
      </div>
    );
  }

  const handleCardDelete = async (e, file) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${file.fileName}" and its ${file.recordCount || 0} records?`)) return;
    try {
      setDeleting(true);
      await api.delete('/records', { params: { importFileId: file._id } });
      const remainingFiles = files.filter((f) => f._id !== file._id);
      setFiles(remainingFiles);
      if (selectedFileId === file._id) setSelectedFileId(remainingFiles[0]?._id || '');
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      setPageError(err.response?.data?.message || err.message || 'Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {pageError && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-semibold">Error:</span> {pageError}
        </div>
      )}

      {/* ── Header card ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
            <Layers className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Data Management</p>
            <h2 className="text-lg font-black text-slate-900">Imported Data</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs font-bold text-blue-700">
            {files.length} file{files.length !== 1 ? 's' : ''} stored
          </span>
        </div>
      </div>

      {/* ── File grid ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-slate-500" />
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Saved Import Files</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {files.length} total
          </span>
        </div>

        <div className="p-5">
          {files.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-14">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FileSpreadsheet className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">No imported files yet</p>
              <p className="text-xs text-slate-400">Import an Excel file to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => {
                const isSelected = file._id === selectedFileId;
                const fileDate = file?.createdAt
                  ? new Date(file.createdAt).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })
                  : 'N/A';

                return (
                  <div
                    key={file._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedFileId(file._id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setSelectedFileId(file._id); }}
                    className={`group relative flex flex-col gap-3 overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                        : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    {/* Selected top stripe */}
                    {isSelected && (
                      <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 to-indigo-500" />
                    )}

                    {/* Hover-reveal delete button */}
                    <button
                      type="button"
                      onClick={(e) => handleCardDelete(e, file)}
                      disabled={deleting}
                      className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-300 opacity-0 transition-all duration-150 hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:pointer-events-none"
                      aria-label={`Delete ${file.fileName}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    {/* Icon + file name */}
                    <div className="flex items-start gap-3 pr-8">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isSelected ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-50'} transition-colors`}>
                        <FileSpreadsheet className={`h-5 w-5 ${isSelected ? 'text-blue-600' : 'text-slate-500 group-hover:text-blue-500'} transition-colors`} strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="line-clamp-2 text-sm font-bold text-slate-900 leading-snug">{file.fileName}</p>
                      </div>
                    </div>

                    {/* Meta badges */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                        <span>{fileDate}</span>
                      </div>
                      <div className={`ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Hash className="h-3 w-3" />
                        {file.recordCount || 0} rows
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
