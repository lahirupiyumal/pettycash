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

export default function CashInHand({ records = [] }) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1.5 rounded-full bg-emerald-500" />
          <div>
            <h3 className="text-lg font-black tracking-tight text-slate-900">Monthly Cash In Hand</h3>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Year-wise cash position</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200">
          <CalendarDays className="h-4 w-4 text-emerald-600" />
          <label htmlFor="cash-in-hand-year" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Year:
          </label>
          <select
            id="cash-in-hand-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
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
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
            <p className="text-sm font-semibold text-slate-500">No cash in hand data available for {selectedYear}.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart data={monthlyCashInHandData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                dy={10} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                tickFormatter={(value) => `${Number(value).toLocaleString()}`} 
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                formatter={(value) => [Number(value).toLocaleString('en-LK'), <span className="font-semibold text-slate-500">Cash In Hand</span>]}
                contentStyle={{
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(8px)'
                }}
                itemStyle={{ padding: '2px 0', fontWeight: 800, color: '#10b981' }}
                labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
              />
              <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
