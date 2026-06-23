import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CalendarDays, CalendarRange, MapPinned } from 'lucide-react';

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
  const key = String(monthValue).trim().toLowerCase();
  return MONTH_ALIASES[key] || null;
}

function normalizeYear(yearValue) {
  const year = Number(yearValue);
  return Number.isInteger(year) && year > 0 ? year : null;
}

export default function MonthlySummary({ records = [] }) {
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  const availableRegions = useMemo(() => {
    const regions = [...new Set(
      records
        .map((record) => String(record.region || '').trim())
        .filter((region) => region && region.toLowerCase() !== 'region')
    )];
    return regions.sort((a, b) => String(a).localeCompare(String(b)));
  }, [records]);

  const availableMonths = useMemo(() => {
    const months = new Set(
      records
        .map((record) => normalizeMonth(record.month))
        .filter(Boolean)
    );

    return MONTHS.filter((month) => months.has(month));
  }, [records]);

  const availableYears = useMemo(() => {
    const years = [...new Set(
      records
        .map((record) => normalizeYear(record.year))
        .filter((year) => year !== null)
    )];

    return years.sort((a, b) => b - a);
  }, [records]);

  const summaryRows = useMemo(() => {
    const monthWiseMap = new Map();

    MONTHS.forEach((month) => {
      monthWiseMap.set(month, {
        month,
        floatAmount: 0,
        cashInHand: 0,
        invoiceAmount: 0,
        utilization: 0,
        variance: 0,
      });
    });

    records.forEach((record) => {
      const month = normalizeMonth(record.month);
      const year = normalizeYear(record.year);
      if (!month) return;
      if (year === null) return;

      if (selectedRegion !== 'ALL' && record.region !== selectedRegion) return;
      if (selectedYear !== 'ALL' && year !== Number(selectedYear)) return;
      if (selectedMonth !== 'ALL' && month !== selectedMonth) return;

      const row = monthWiseMap.get(month);
      row.floatAmount += Number(record.floatAmount) || 0;
      row.cashInHand += Number(record.cashInHand) || 0;
      row.invoiceAmount += Number(record.invoiceAmount) || 0;
      row.utilization += Number(record.utilization) || 0;
      row.variance += Number(record.variance) || 0;
    });

    return MONTHS
      .map((month) => monthWiseMap.get(month))
      .filter((row) => {
        if (selectedMonth !== 'ALL') return row.month === selectedMonth;

        const total =
          row.floatAmount +
          row.cashInHand +
          row.invoiceAmount +
          row.utilization +
          row.variance;

        return total > 0;
      });
  }, [records, selectedRegion, selectedMonth, selectedYear]);

  const chartData = useMemo(() => {
    return summaryRows.map((row) => ({
      ...row,
      shortMonth: row.month.slice(0, 3),
    }));
  }, [summaryRows]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="region-filter" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Select Region
            </label>
            <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <MapPinned className="h-4 w-4 text-blue-600" />
              <select
                id="region-filter"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-black text-slate-800 outline-none"
              >
                <option value="ALL">All Regions</option>
                {availableRegions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600">⌄</span>
            </div>
          </div>

          <div>
            <label htmlFor="month-filter" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Select Month
            </label>
            <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <CalendarRange className="h-4 w-4 text-blue-600" />
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-black text-slate-800 outline-none"
              >
                <option value="ALL">All Months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600">⌄</span>
            </div>
          </div>

          <div>
            <label htmlFor="year-filter" className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Select Year
            </label>
            <div className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-all duration-300 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-black text-slate-800 outline-none"
              >
                <option value="ALL">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none text-slate-500 transition-colors duration-300 group-focus-within:text-blue-600">⌄</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
            <h3 className="text-lg font-black tracking-tight text-slate-900">Monthly Performance Overview</h3>
          </div>
          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No chart data available for the selected filters.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} dy={10} />
                <YAxis tickFormatter={(value) => Number(value).toLocaleString('en-LK')} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  formatter={(value, name) => [Number(value).toLocaleString('en-LK'), <span className="font-semibold">{name}</span>]}
                  labelFormatter={(label, payload) => <span className="font-bold text-slate-900 block mb-1">{(payload?.[0]?.payload?.month || label)}</span>}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="floatAmount" name="Float Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="cashInHand" name="Cash In Hand" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="invoiceAmount" name="Total Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="utilization" name="Utilization" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="variance" name="Variance" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
