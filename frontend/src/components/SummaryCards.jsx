export default function SummaryCards({ summary }) {
  const cards = [
    { label: 'Total Credit', value: summary.totalCredit, color: 'bg-green-100 text-green-700' },
    { label: 'Total Debit', value: summary.totalDebit, color: 'bg-red-100 text-red-700' },
    { label: 'Balance', value: summary.balance, color: 'bg-blue-100 text-blue-700' },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map(c => (
        <div key={c.label} className={`p-4 rounded-xl shadow ${c.color}`}>
          <p className="text-sm font-medium">{c.label}</p>
          <p className="text-2xl font-bold">Rs. {c.value?.toFixed(2)}</p>
        </div>
      ))}
    </div>
  );
}
