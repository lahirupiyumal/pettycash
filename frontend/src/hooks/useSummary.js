import { useEffect, useState } from 'react';
import api from '../api/axios';

export function useSummary(transactions) {
  const [summary, setSummary] = useState({ totalCredit: 0, totalDebit: 0, balance: 0 });

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/transactions/summary');
      setSummary(data);
    } catch {
      setSummary({ totalCredit: 0, totalDebit: 0, balance: 0 });
    }
  };

  useEffect(() => { fetchSummary(); }, [transactions]);

  return { summary };
}
