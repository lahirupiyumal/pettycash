import { FileSpreadsheet } from 'lucide-react';

export default function AccountantTable({ records }) {
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-bold text-slate-700">No records found</p>
        <p className="text-sm text-slate-500 mt-1">Import an Excel file to get started.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-b-xl border-t border-slate-100 bg-white">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/50 sticky top-0">
          <tr>
            <th className="px-5 py-3 border-b border-slate-100">Region</th>
            <th className="px-5 py-3 border-b border-slate-100">PCF Ref</th>
            <th className="px-5 py-3 border-b border-slate-100">Cost Center</th>
            <th className="px-5 py-3 border-b border-slate-100">Number</th>
            <th className="px-5 py-3 border-b border-slate-100">Email</th>
            <th className="px-5 py-3 border-b border-slate-100">Supervising Officers Name</th>
            <th className="px-5 py-3 border-b border-slate-100">Email3</th>
            <th className="px-5 py-3 border-b border-slate-100">Emp Number3</th>
            <th className="px-5 py-3 border-b border-slate-100">Reporting Accountants Name</th>
            <th className="px-5 py-3 border-b border-slate-100">Email2</th>
            <th className="px-5 py-3 border-b border-slate-100">Emp Number2</th>
            <th className="px-5 py-3 border-b border-slate-100">Employee Name</th>
            <th className="px-5 py-3 border-b border-slate-100">Employee ID</th>
            <th className="px-5 py-3 border-b border-slate-100">Date of Reconciliation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-5 py-3.5">
                <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-bold text-slate-700">
                  {r.region || '—'}
                </span>
              </td>
              <td className="px-5 py-3.5 font-bold text-slate-900">{r.pcfRef || '—'}</td>
              <td className="px-5 py-3.5 text-slate-700">{r.costCenterName || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.number || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 text-xs">{r.payingOfficer?.email || '—'}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{r.supervisingOfficer?.name || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 text-xs">{r.supervisingOfficer?.email || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.supervisingOfficer?.empNumber || '—'}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{r.reportingAccountant?.name || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 text-xs">{r.reportingAccountant?.email || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.reportingAccountant?.empNumber || '—'}</td>
              <td className="px-5 py-3.5 text-slate-700 font-medium">{r.payingOfficer?.name || '—'}</td>
              <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.payingOfficer?.empNumber || '—'}</td>
              <td className="px-5 py-3.5">
                {r.dateOfReconciliation || r.checkedStatus ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                    {r.dateOfReconciliation || r.checkedStatus}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                    Pending
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
