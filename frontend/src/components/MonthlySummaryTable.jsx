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

export default function MonthlySummaryTable({ records = [] }) {
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');

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
      if (!month) return;

      if (selectedRegion !== 'ALL' && record.region !== selectedRegion) return;
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
  }, [records, selectedRegion, selectedMonth]);

  const chartData = useMemo(() => {
    return summaryRows.map((row) => ({
      ...row,
      shortMonth: row.month.slice(0, 3),
    }));
  }, [summaryRows]);

  const activeFilterText = `${selectedRegion === 'ALL' ? 'All Regions' : selectedRegion} | ${selectedMonth === 'ALL' ? 'All Months' : selectedMonth}`;

  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">Monthly Summary</h3>
            <p className="text-sm text-slate-500 mt-1">Filter by region and month to compare monthly totals.</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">{availableRegions.length} Regions</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{availableMonths.length} Months</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label htmlFor="region-filter" className="block text-sm font-semibold text-slate-700 mb-2">
              Select Region
            </label>
            <select
              id="region-filter"
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Regions</option>
              {availableRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="month-filter" className="block text-sm font-semibold text-slate-700 mb-2">
              Select Month
            </label>
            <select
              id="month-filter"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500 font-medium">
          Active Filters: {activeFilterText}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
          <h4 className="text-lg font-bold text-slate-800">Monthly Summary Column Chart</h4>
          <p className="text-sm text-slate-500 mt-1">Month-wise comparison of key financial metrics.</p>
        </div>

        <div className="p-5">

          {chartData.length === 0 ? (
            <p className="text-sm text-slate-500">No chart data available for the selected filters.</p>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={chartData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="shortMonth" tick={{ fontSize: 12, fill: '#475569' }} />
                <YAxis tickFormatter={(value) => Number(value).toLocaleString('en-LK')} tick={{ fontSize: 12, fill: '#475569' }} />
                <Tooltip
                  formatter={(value, name) => [Number(value).toLocaleString('en-LK'), name]}
                  labelFormatter={(label, payload) => (payload?.[0]?.payload?.month || label)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '8px' }} />
                <Bar dataKey="floatAmount" name="Float Amount" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cashInHand" name="Cash In Hand" fill="#059669" radius={[4, 4, 0, 0]} />
                <Bar dataKey="invoiceAmount" name="Invoice Amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilization" name="Utilization" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="variance" name="Variance" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
