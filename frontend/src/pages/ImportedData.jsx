import { useEffect, useMemo, useState } from 'react';
import { FileSpreadsheet, Trash2 } from 'lucide-react';
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

        if (nextFiles.length === 0) {
          setSelectedFileId('');
          return;
        }

        setSelectedFileId((currentId) => {
          if (currentId && nextFiles.some((file) => file._id === currentId)) {
            return currentId;
          }
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

  if (error) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</p>;
  }

  if (loading || filesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const fileName = selectedFile?.fileName || 'Imported Excel File';
  const importDate = selectedFile?.createdAt
    ? new Date(selectedFile.createdAt).toLocaleString('en-LK', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : 'N/A';

  const deleteButtonDisabled = deleting || !selectedFileId;

  const handleDelete = async () => {
    if (!selectedFileId) return;

    if (window.confirm('Are you sure you want to delete this imported file and its records? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await api.delete('/records', {
          params: { importFileId: selectedFileId },
        });

        const remainingFiles = files.filter((file) => file._id !== selectedFileId);
        setFiles(remainingFiles);

        if (remainingFiles.length === 0) {
          setSelectedFileId('');
        } else {
          setSelectedFileId(remainingFiles[0]._id);
        }

        if (onDeleteSuccess) onDeleteSuccess();
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {pageError && <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{pageError}</p>}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
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

          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {files.length} saved file{files.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/50 px-6 py-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Saved Import Files</p>
        {files.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">
            No imported files available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => {
              const isSelected = file._id === selectedFileId;
              const fileImportedAt = file?.createdAt
                ? new Date(file.createdAt).toLocaleString('en-LK', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : 'N/A';

              const handleCardDelete = async (e) => {
                e.stopPropagation();
                if (!window.confirm(`Delete imported file "${file.fileName}" and its ${file.recordCount || 0} records?`)) return;
                try {
                  setDeleting(true);
                  await api.delete('/records', { params: { importFileId: file._id } });
                  const remainingFiles = files.filter((f) => f._id !== file._id);
                  setFiles(remainingFiles);
                  if (selectedFileId === file._id) {
                    setSelectedFileId(remainingFiles[0]?._id || '');
                  }
                  if (onDeleteSuccess) onDeleteSuccess();
                } catch (err) {
                  setPageError(err.response?.data?.message || err.message || 'Failed to delete file');
                } finally {
                  setDeleting(false);
                }
              };

              return (
                <div
                  key={file._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedFileId(file._id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') setSelectedFileId(file._id); }}
                  className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/60'
                  }`}
                >
                  <div className="absolute right-3 top-3">
                    <button
                      type="button"
                      onClick={handleCardDelete}
                      disabled={deleting}
                      className="inline-flex items-center justify-center rounded-md p-1 text-red-600 hover:bg-red-50"
                      aria-label={`Delete ${file.fileName}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <p className="line-clamp-1 text-sm font-bold text-slate-900">{file.fileName}</p>
                  <p className="mt-2 text-xs text-slate-600">{fileImportedAt}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
                    {file.recordCount || 0} rows
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">📅 Import Date</p>
            <p className="text-sm font-bold text-slate-900">{importDate}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">📑 Records</p>
            <p className="text-sm font-bold text-slate-900">
              {selectedFile?.recordCount ?? 0} <span className="text-xs text-slate-500 font-medium">rows</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-red-50 to-rose-50 shadow-sm px-6 py-5 flex items-center justify-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleteButtonDisabled}
            className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-500/30 transition-all duration-200 hover:from-red-700 hover:to-rose-700 hover:shadow-xl hover:shadow-red-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
            <span>{deleting ? 'Deleting' : 'Delete Selected File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
