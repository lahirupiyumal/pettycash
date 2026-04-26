export default function TransactionTable({ transactions, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
          <tr>
            {['Date', 'Description', 'Category', 'Type', 'Amount', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map(t => (
            <tr key={t._id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3">{new Date(t.date).toLocaleDateString()}</td>
              <td className="px-4 py-3">{t.description}</td>
              <td className="px-4 py-3">{t.category}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {t.type}
                </span>
              </td>
              <td className="px-4 py-3 font-medium">Rs. {t.amount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <button onClick={() => onDelete(t._id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr><td colSpan={6} className="text-center py-6 text-gray-400">No transactions found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
