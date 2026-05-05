import { AlertCircle, FileSpreadsheet } from 'lucide-react';

export default function RecordTable({ records }) {
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
        <thead className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-slate-50/50">
          <tr>
            <th className="px-6 py-4 border-b border-slate-100">Region</th>
            <th className="px-6 py-4 border-b border-slate-100">PCF Ref</th>
            <th className="px-6 py-4 border-b border-slate-100">Cost Center</th>
            <th className="px-6 py-4 border-b border-slate-100">Paying Officer</th>
            <th className="px-6 py-4 border-b border-slate-100">Reporting Accountant</th>
            <th className="px-6 py-4 border-b border-slate-100">Year / Month</th>
            <th className="px-6 py-4 border-b border-slate-100 text-right">Float Amount</th>
            <th className="px-6 py-4 border-b border-slate-100 text-right">Cash In Hand</th>
            <th className="px-6 py-4 border-b border-slate-100 text-right">Invoice Amount</th>
            <th className="px-6 py-4 border-b border-slate-100 text-right">Utilization</th>
            <th className="px-6 py-4 border-b border-slate-100 text-right">Variance</th>
            <th className="px-6 py-4 border-b border-slate-100">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-3.5 font-semibold text-slate-700">{r.region}</td>
              <td className="px-6 py-3.5 font-bold text-slate-900">{r.pcfRef}</td>
              <td className="px-6 py-3.5 text-slate-600">{r.costCenterName}</td>
              <td className="px-6 py-3.5">
                <div className="font-semibold text-slate-800">{r.payingOfficer?.name}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{r.payingOfficer?.empNumber}</div>
              </td>
              <td className="px-6 py-3.5">
                <div className="font-semibold text-slate-800">{r.reportingAccountant?.name}</div>
                <div className="text-[11px] text-slate-500 uppercase tracking-wider mt-0.5">{r.reportingAccountant?.empNumber}</div>
              </td>
              <td className="px-6 py-3.5">
                <span className="font-bold text-slate-700">{r.month}</span> <span className="text-slate-500">{r.year}</span>
              </td>
              <td className="px-6 py-3.5 text-right font-medium text-slate-600">{(r.floatAmount || 0).toLocaleString()}</td>
              <td className="px-6 py-3.5 text-right font-medium text-slate-600">{(r.cashInHand || 0).toLocaleString()}</td>
              <td className="px-6 py-3.5 text-right font-medium text-slate-600">{(r.invoiceAmount || 0).toLocaleString()}</td>
              <td className="px-6 py-3.5 text-right font-medium text-slate-600">{(r.utilization || 0).toLocaleString()}</td>
              <td className={`px-6 py-3.5 text-right font-bold ${r.variance !== 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                {(r.variance || 0).toLocaleString()}
              </td>
              <td className="px-6 py-3.5">
                {r.varianceStatus === 'Balanced' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Balanced
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-600/20">
                    <AlertCircle className="h-3 w-3" strokeWidth={2.5} />
                    {r.varianceStatus}
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
