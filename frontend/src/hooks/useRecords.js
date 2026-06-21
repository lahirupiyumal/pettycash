import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useRecords(refreshTrigger = 0) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        const res = await api.get('/records');
        setRecords(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [refreshTrigger]);

  return { records, loading, error };
}
