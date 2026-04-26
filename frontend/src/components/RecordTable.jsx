export default function RecordTable({ records }) {
  if (!records || records.length === 0) {
    return <div className="text-center text-gray-500 py-6">No records found. Import an Excel file to get started.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-3 border-b">Region</th>
            <th className="px-4 py-3 border-b">PCF Ref</th>
            <th className="px-4 py-3 border-b">Cost Center</th>
            <th className="px-4 py-3 border-b">Paying Officer</th>
            <th className="px-4 py-3 border-b">Reporting Accountant</th>
            <th className="px-4 py-3 border-b">Year/Month</th>
            <th className="px-4 py-3 border-b text-right">Float Amount</th>
            <th className="px-4 py-3 border-b text-right">Cash In Hand</th>
            <th className="px-4 py-3 border-b text-right">Invoice Amount</th>
            <th className="px-4 py-3 border-b text-right">Utilization</th>
            <th className="px-4 py-3 border-b text-right">Variance</th>
            <th className="px-4 py-3 border-b">Variance Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r._id || i} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3">{r.region}</td>
              <td className="px-4 py-3 font-medium">{r.pcfRef}</td>
              <td className="px-4 py-3">{r.costCenterName}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{r.payingOfficer?.name}</div>
                <div className="text-xs text-gray-500">{r.payingOfficer?.empNumber}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-medium text-gray-800">{r.reportingAccountant?.name}</div>
                <div className="text-xs text-gray-500">{r.reportingAccountant?.empNumber}</div>
              </td>
              <td className="px-4 py-3">{r.month} {r.year}</td>
              <td className="px-4 py-3 text-right">{(r.floatAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{(r.cashInHand || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{(r.invoiceAmount || 0).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{(r.utilization || 0).toLocaleString()}</td>
              <td className={`px-4 py-3 text-right font-medium ${r.variance !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(r.variance || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${r.varianceStatus === 'Balanced' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {r.varianceStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
