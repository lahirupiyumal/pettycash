import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalendarDays, HandCoins } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ALIASES = {
  jan: 'January',
  january: 'January',
  feb: 'February',
  february: 'February',
  mar: 'March',
  march: 'March',
  apr: 'April',
  april: 'April',
  may: 'May',
  jun: 'June',
  june: 'June',
  jul: 'July',
  july: 'July',
  aug: 'August',
  august: 'August',
  sep: 'September',
  sept: 'September',
  september: 'September',
  oct: 'October',
  october: 'October',
  nov: 'November',
  november: 'November',
  dec: 'December',
  december: 'December',
};

function normalizeMonth(monthValue) {
  if (!monthValue) return null;
  const normalized = String(monthValue).trim().toLowerCase();
  return MONTH_ALIASES[normalized] || null;
}

export default function CashInHandChart({ records = [] }) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = [...new Set(records.map((record) => Number(record.year)).filter(Boolean))];
    const sorted = years.sort((a, b) => b - a);
    return sorted.length ? sorted : [currentYear];
  }, [records, currentYear]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYear);

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] || currentYear);
    }
  }, [availableYears, selectedYear, currentYear]);

  const monthlyCashInHandData = useMemo(() => {
    const totals = MONTHS.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    records.forEach((record) => {
      const year = Number(record.year);
      const month = normalizeMonth(record.month);
      const amount = Number(record.cashInHand) || 0;

      if (year === selectedYear && MONTHS.includes(month)) {
        totals[month] += amount;
      }
    });

    return MONTHS.map((month) => ({ month, total: totals[month] }));
  }, [records, selectedYear]);

  const hasDataForYear = monthlyCashInHandData.some((item) => item.total > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
            <HandCoins className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Monthly Cash In Hand Amount</h3>
            <p className="text-sm text-slate-500 mt-1">Year-wise cash position across all months.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-700" />
          <label htmlFor="cash-in-hand-year" className="text-sm font-semibold text-slate-700">
            Select Year
          </label>
          <select
            id="cash-in-hand-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-6">
        {!hasDataForYear ? (
          <p className="text-sm text-slate-500 py-12 text-center">No cash in hand data available for the selected year.</p>
        ) : (
          <ResponsiveContainer width="100%" height={440}>
            <BarChart data={monthlyCashInHandData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 12, fill: '#475569' }} tickFormatter={(value) => `${Number(value).toLocaleString()}`} />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString('en-LK'), 'Total']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                }}
              />
              <Bar dataKey="total" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
