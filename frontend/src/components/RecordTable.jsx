import { AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function RecordTable({
  records,
  emptyTitle = 'No records found',
  emptySubtitle = 'Import an Excel file to get started.',
}) {
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
          <FileSpreadsheet className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-base font-bold text-slate-700">{emptyTitle}</p>
        <p className="text-sm text-slate-500 mt-1">{emptySubtitle}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-b-xl border-t border-slate-100 bg-white">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/50 sticky top-0">
          <tr>
            <th className="px-4 py-3 border-b border-slate-100">Region</th>
            <th className="px-4 py-3 border-b border-slate-100">PCF Ref</th>
            <th className="px-4 py-3 border-b border-slate-100">Cost Center</th>
            <th className="px-4 py-3 border-b border-slate-100">CC Number</th>
            <th className="px-4 py-3 border-b border-slate-100">Paying Officer Name</th>
            <th className="px-4 py-3 border-b border-slate-100">Paying Officer Email</th>
            <th className="px-4 py-3 border-b border-slate-100">Paying Officer Emp#</th>
            <th className="px-4 py-3 border-b border-slate-100">Supervising Officer Name</th>
            <th className="px-4 py-3 border-b border-slate-100">Supervising Officer Email</th>
            <th className="px-4 py-3 border-b border-slate-100">Supervising Officer Emp#</th>
            <th className="px-4 py-3 border-b border-slate-100">Reporting Accountant Name</th>
            <th className="px-4 py-3 border-b border-slate-100">Reporting Accountant Email</th>
            <th className="px-4 py-3 border-b border-slate-100">Reporting Accountant Emp#</th>
            <th className="px-4 py-3 border-b border-slate-100">Year</th>
            <th className="px-4 py-3 border-b border-slate-100">Month</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Float Amount</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Cash In Hand</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Invoice Amount</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Total</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Utilization</th>
            <th className="px-4 py-3 border-b border-slate-100 text-right">Variance</th>
            <th className="px-4 py-3 border-b border-slate-100">Variance Status</th>
            <th className="px-4 py-3 border-b border-slate-100">Checked Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-4 py-2.5 font-semibold text-slate-700">{r.region}</td>
              <td className="px-4 py-2.5 font-bold text-slate-900">{r.pcfRef}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.costCenterName}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.number || '-'}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.payingOfficer?.name || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600 text-xs">{r.payingOfficer?.email || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.payingOfficer?.empNumber || '-'}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.supervisingOfficer?.name || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600 text-xs">{r.supervisingOfficer?.email || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.supervisingOfficer?.empNumber || '-'}</td>
              <td className="px-4 py-2.5 text-slate-700">{r.reportingAccountant?.name || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600 text-xs">{r.reportingAccountant?.email || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.reportingAccountant?.empNumber || '-'}</td>
              <td className="px-4 py-2.5 text-slate-600">{r.year || '-'}</td>
              <td className="px-4 py-2.5 font-semibold text-slate-700">{r.month || '-'}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-600">{(r.floatAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-600">{(r.cashInHand || 0).toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-600">{(r.invoiceAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-600">{(r.total || 0).toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right font-medium text-slate-600">{(r.utilization || 0).toLocaleString()}</td>
              <td className={`px-4 py-2.5 text-right font-bold ${r.variance !== 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(r.variance || 0).toLocaleString()}
              </td>
              <td className="px-4 py-2.5">
                {r.varianceStatus === 'Balanced' ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                    Balanced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                    <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                    {r.varianceStatus}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-slate-600">{r.checkedStatus || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
