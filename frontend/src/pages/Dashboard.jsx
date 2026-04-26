import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import SummaryCards from '../components/SummaryCards';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });
  const [filter, setFilter] = useState('');

  const fetchData = async () => {
    const [txRes, sumRes] = await Promise.all([api.get('/transactions'), api.get('/transactions/summary')]);
    setTransactions(txRes.data);
    setSummary(sumRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async form => {
    await api.post('/transactions', form);
    fetchData();
  };

  const handleDelete = async id => {
    await api.delete(`/transactions/${id}`);
    fetchData();
  };

  const filtered = transactions.filter(t =>
    t.description.toLowerCase().includes(filter.toLowerCase()) ||
    t.category.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-blue-700">Petty Cash Dashboard</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <button onClick={logout} className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>

        <SummaryCards summary={summary} />
        <TransactionForm onSubmit={handleAdd} />

        <input className="w-full border p-2 rounded mb-4 bg-white"
          placeholder="Search by description or category..."
          value={filter} onChange={e => setFilter(e.target.value)} />

        <TransactionTable transactions={filtered} onDelete={handleDelete} />
      </div>
    </div>
  );
}
