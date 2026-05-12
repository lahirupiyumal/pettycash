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
            <th className="px-6 py-3 border-b border-slate-100">Region</th>
            <th className="px-6 py-3 border-b border-slate-100">PCF Ref</th>
            <th className="px-6 py-3 border-b border-slate-100">Cost Center Name</th>
            <th className="px-6 py-3 border-b border-slate-100">Number</th>
            <th className="px-6 py-3 border-b border-slate-100">Year</th>
            <th className="px-6 py-3 border-b border-slate-100">Month</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {records.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-6 py-4 font-semibold text-slate-700">{r.region}</td>
              <td className="px-6 py-4 font-bold text-slate-900">{r.pcfRef}</td>
              <td className="px-6 py-4 text-slate-600">{r.costCenterName || '-'}</td>
              <td className="px-6 py-4 text-slate-600">{r.number || '-'}</td>
              <td className="px-6 py-4 text-slate-600">{r.year || '-'}</td>
              <td className="px-6 py-4 font-semibold text-slate-700">{r.month || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
