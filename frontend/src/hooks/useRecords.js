import { useState, useEffect } from 'react';
import api from '../api/axios';

export function useRecords(refreshTrigger = 0, pollIntervalMs = 0) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRecords = async ({ showLoading = false } = {}) => {
      try {
        if (showLoading) setLoading(true);
        const res = await api.get('/records');
        if (!isMounted) return;
        setRecords(res.data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err.response?.data?.message || err.message);
      } finally {
        if (isMounted && showLoading) setLoading(false);
      }
    };

    fetchRecords({ showLoading: true });
    const intervalId = pollIntervalMs > 0
      ? window.setInterval(() => fetchRecords(), pollIntervalMs)
      : null;

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [refreshTrigger, pollIntervalMs]);

  return { records, loading, error };
}
