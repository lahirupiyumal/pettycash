import { useEffect, useState } from 'react';
import api from '../api/axios';

export function useTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async form => {
    await api.post('/transactions', form);
    fetchTransactions();
  };

  const deleteTransaction = async id => {
    await api.delete(`/transactions/${id}`);
    fetchTransactions();
  };

  const updateTransaction = async (id, form) => {
    await api.put(`/transactions/${id}`, form);
    fetchTransactions();
  };

  useEffect(() => { fetchTransactions(); }, []);

  return { transactions, loading, error, addTransaction, deleteTransaction, updateTransaction };
}
