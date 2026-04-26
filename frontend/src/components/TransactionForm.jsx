import { useState } from 'react';

const CATEGORIES = ['Office Supplies', 'Travel', 'Meals', 'Utilities', 'Maintenance', 'Other'];
const empty = { date: '', description: '', category: '', type: 'debit', amount: '' };

export default function TransactionForm({ onSubmit, initial }) {
  const [form, setForm] = useState(initial || empty);

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
    setForm(empty);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl shadow mb-6 grid grid-cols-2 gap-3">
      <input className="border p-2 rounded" type="date" value={form.date}
        onChange={e => setForm({ ...form, date: e.target.value })} required />
      <input className="border p-2 rounded" placeholder="Description" value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })} required />
      <select className="border p-2 rounded" value={form.category}
        onChange={e => setForm({ ...form, category: e.target.value })} required>
        <option value="">Select Category</option>
        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
      </select>
      <select className="border p-2 rounded" value={form.type}
        onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="debit">Debit</option>
        <option value="credit">Credit</option>
      </select>
      <input className="border p-2 rounded" type="number" placeholder="Amount" value={form.amount}
        onChange={e => setForm({ ...form, amount: e.target.value })} required />
      <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 col-span-1">Add Transaction</button>
    </form>
  );
}
