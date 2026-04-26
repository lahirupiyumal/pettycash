import { useState, useMemo } from 'react';

export function useFilter(transactions) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() =>
    transactions.filter(t =>
      t.description.toLowerCase().includes(filter.toLowerCase()) ||
      t.category.toLowerCase().includes(filter.toLowerCase())
    ), [transactions, filter]);

  return { filter, setFilter, filtered };
}
