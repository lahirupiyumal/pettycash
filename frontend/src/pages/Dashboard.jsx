import { useAuth } from '../context/AuthContext';
import { useTransactions } from '../hooks/useTransactions';
import { useSummary } from '../hooks/useSummary';
import { useFilter } from '../hooks/useFilter';
import SummaryCards from '../components/SummaryCards';
import TransactionForm from '../components/TransactionForm';
import TransactionTable from '../components/TransactionTable';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { transactions, loading, error, addTransaction, deleteTransaction } = useTransactions();
  const { summary } = useSummary(transactions);
  const { filter, setFilter, filtered } = useFilter(transactions);

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
        <TransactionForm onSubmit={addTransaction} />

        <input className="w-full border p-2 rounded mb-4 bg-white"
          placeholder="Search by description or category..."
          value={filter} onChange={e => setFilter(e.target.value)} />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-400 py-6">Loading...</p>
        ) : (
          <TransactionTable transactions={filtered} onDelete={deleteTransaction} />
        )}
      </div>
    </div>
  );
}
