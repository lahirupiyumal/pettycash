import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { FileDown, Layers3, PieChart as PieChartIcon, Sparkles, TrendingUp } from 'lucide-react';

const CARD_ACCENTS = ['#2563eb', '#0f766e', '#7c3aed', '#f59e0b', '#dc2626'];
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-LK');
}

function formatCardNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatExportNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toLocaleString('en-LK') : '';
}

function buildExportFileName(prefix, extension, selectedYear) {
  const safePrefix = String(prefix || 'export')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'export';
  const safeYear = String(selectedYear || 'all')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'all';
  return `${safePrefix}-${safeYear}.${extension}`;
}

function normalizeMonth(monthValue) {
  if (!monthValue) return null;
  return MONTH_ALIASES[String(monthValue).trim().toLowerCase()] || null;
}

function buildYAxisTicks(maxValue) {
  if (!maxValue) return [0, 70000, 140000, 210000, 280000];
  const baseStep = 70000;
  const roundedMax = Math.max(baseStep, Math.ceil(maxValue / baseStep) * baseStep);
  const step = roundedMax <= 280000 ? baseStep : Math.ceil(roundedMax / 4 / 10000) * 10000;
  return Array.from({ length: 5 }, (_, index) => index * step);
}

export default function Overview({ records = [] }) {
  const [selectedYear, setSelectedYear] = useState('All');

  const availableYears = useMemo(() => {
    const years = new Set();
    records.forEach((r) => {
      if (r.year) years.add(r.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (selectedYear === 'All') return records;
    return records.filter((r) => String(r.year) === String(selectedYear));
  }, [records, selectedYear]);

  const totals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        acc.floatAmount += Number(record.floatAmount) || 0;
        acc.cashInHand += Number(record.cashInHand) || 0;
        acc.invoiceAmount += Number(record.invoiceAmount) || 0;
        acc.total += Number(record.total) || 0;
        acc.utilization += Number(record.utilization) || 0;
        acc.variance += Number(record.variance) || 0;
        return acc;
      },
      {
        floatAmount: 0,
        cashInHand: 0,
        invoiceAmount: 0,
        total: 0,
        utilization: 0,
        variance: 0,
      }
    );
  }, [filteredRecords]);

  const selectedYearLabel = selectedYear === 'All' ? 'All Time' : String(selectedYear);

  const regionTrendData = useMemo(() => {
    const regionMap = new Map();

    filteredRecords.forEach((record) => {
      const region = String(record.region || '').trim();
      if (!region || region.toLowerCase() === 'region') return;

      if (!regionMap.has(region)) {
        regionMap.set(region, {
          region,
          floatAmount: 0,
          utilization: 0,
        });
      }

      const row = regionMap.get(region);
      row.floatAmount += Number(record.floatAmount) || 0;
      row.utilization += Number(record.utilization) || 0;
    });

    return [...regionMap.values()].sort((a, b) => a.region.localeCompare(b.region));
  }, [filteredRecords]);

  const monthlyTrendData = useMemo(() => {
    const trendMap = new Map();

    filteredRecords.forEach((record) => {
      const month = normalizeMonth(record.month);
      const year = Number(record.year);
      if (!month || !Number.isFinite(year)) return;

      const monthIndex = MONTHS.indexOf(month);
      const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

      if (!trendMap.has(key)) {
        trendMap.set(key, {
          key,
          label: selectedYear === 'All' ? `${String(year).slice(-2)} ${month.slice(0, 3)}` : month.slice(0, 3),
          year,
          monthIndex,
          floatAmount: 0,
          cashInHand: 0,
          invoiceAmount: 0,
          utilization: 0,
          variance: 0,
        });
      }

      const row = trendMap.get(key);
      row.floatAmount += Number(record.floatAmount) || 0;
      row.cashInHand += Number(record.cashInHand) || 0;
      row.invoiceAmount += Number(record.invoiceAmount) || 0;
      row.utilization += Number(record.utilization) || 0;
      row.variance += Number(record.variance) || 0;
    });

    return [...trendMap.values()].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.monthIndex - b.monthIndex;
    });
  }, [filteredRecords, selectedYear]);

  const monthlyTrendMax = useMemo(() => {
    return monthlyTrendData.reduce((max, item) => {
      return Math.max(max, item.cashInHand, item.floatAmount, item.invoiceAmount, item.utilization);
    }, 0);
  }, [monthlyTrendData]);

  const monthlyTrendTicks = useMemo(() => buildYAxisTicks(monthlyTrendMax), [monthlyTrendMax]);

  const monthlyTrendXAxisTicks = useMemo(() => {
    const lastIndex = monthlyTrendData.length - 1;
    return monthlyTrendData
      .filter((item, index) => index % 3 === 0 || index === lastIndex)
      .map((item) => item.label);
  }, [monthlyTrendData]);

  // Float vs Expenses by Region
  const floatVsExpensesByRegion = useMemo(() => {
    const regionMap = new Map();

    filteredRecords.forEach((record) => {
      const region = String(record.region || '').trim();
      if (!region || region.toLowerCase() === 'region') return;

      if (!regionMap.has(region)) {
        regionMap.set(region, {
          region,
          floatAmount: 0,
          expenses: 0,
        });
      }

      const row = regionMap.get(region);
      row.floatAmount += Number(record.floatAmount) || 0;
      row.expenses += Number(record.invoiceAmount) || 0;
    });

    return [...regionMap.values()].sort((a, b) => a.region.localeCompare(b.region));
  }, [filteredRecords]);

  // Variance Analysis by Region
  const varianceByRegion = useMemo(() => {
    const regionMap = new Map();

    filteredRecords.forEach((record) => {
      const region = String(record.region || '').trim();
      if (!region || region.toLowerCase() === 'region') return;

      if (!regionMap.has(region)) {
        regionMap.set(region, {
          region,
          variance: 0,
        });
      }

      const row = regionMap.get(region);
      row.variance += Math.abs(Number(record.variance) || 0);
    });

    return [...regionMap.values()].sort((a, b) => a.region.localeCompare(b.region));
  }, [filteredRecords]);

  const exportReady = filteredRecords.length > 0;

  function handleMonthlyCsvExport() {
    if (!exportReady) return;

    const headers = ['Year', 'Month', 'Total Cash In Hand', 'Total Invoice Amount', 'Total Expenses', 'Total Variance'];
    const rows = monthlyTrendData.map((item) => [
      item.year,
      MONTHS[item.monthIndex],
      item.cashInHand,
      item.invoiceAmount,
      item.utilization,
      item.variance,
    ]);

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map((row) => row.map(escapeCsvValue).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildExportFileName('overview-monthly-export', 'csv', selectedYearLabel);
    link.click();
    URL.revokeObjectURL(url);
  }

  const cards = [
    { label: 'Total Float Value', value: totals.floatAmount, icon: Layers3, tint: 'bg-blue-50 text-blue-600 ring-blue-100' },
    { label: 'Total Cash In Hand', value: totals.cashInHand, icon: Sparkles, tint: 'bg-teal-50 text-teal-600 ring-teal-100' },
    { label: 'Total Expenses', value: totals.invoiceAmount, icon: TrendingUp, tint: 'bg-violet-50 text-violet-600 ring-violet-100' },
    { label: 'Total', value: totals.total, icon: PieChartIcon, tint: 'bg-teal-50 text-teal-600 ring-teal-100' },
    { label: 'Total Variance', value: totals.variance, icon: PieChartIcon, tint: 'bg-red-50 text-red-600 ring-red-100' },
  ];

  return (
    <div className="space-y-6 rounded-[2rem] bg-transparent">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200 w-fit">
          <label htmlFor="yearFilter" className="text-xs font-bold uppercase tracking-widest text-slate-500">Year:</label>
          <select
            id="yearFilter"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="All">All Time</option>
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMonthlyCsvExport}
            disabled={!exportReady}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            CSV Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/30"
          >
            <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: CARD_ACCENTS[index % CARD_ACCENTS.length] }} />
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125" style={{ backgroundColor: CARD_ACCENTS[index % CARD_ACCENTS.length] }} />
            <div className="relative px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 mb-3 leading-snug min-h-[2rem]">{card.label}</p>
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black text-blue-700 uppercase tracking-widest">LKR</span>
                    <p className="text-2xl font-black text-slate-950 tracking-tight whitespace-nowrap">
                      {formatCardNumber(card.value)}
                    </p>
                  </div>
                </div>
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 transition-transform duration-300 group-hover:scale-105 ${card.tint}`}>
                  <card.icon className="h-5 w-5" strokeWidth={2.4} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-purple-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Float vs Expenses by Region</h3>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {floatVsExpensesByRegion.length} Regions
            </div>
          </div>
          <div className="p-4 sm:p-5">
          {floatVsExpensesByRegion.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No regional data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={floatVsExpensesByRegion} margin={{ top: 12, right: 8, left: 0, bottom: 48 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="region"
                  angle={-28}
                  textAnchor="end"
                  interval={0}
                  height={78}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={5}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} width={56} />
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ padding: '2px 0', fontWeight: 600 }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '12px', fontWeight: 700 }} iconType="circle" />
                <Bar dataKey="floatAmount" name="Cash Float Amount" fill="#9333ea" radius={[5, 5, 0, 0]} maxBarSize={56} />
                <Bar dataKey="expenses" name="Expenses Made" fill="#f97316" radius={[5, 5, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-red-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Variance Analysis by Region</h3>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {varianceByRegion.length} Regions
            </div>
          </div>
          <div className="p-4 sm:p-5">
          {varianceByRegion.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No variance data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varianceByRegion} margin={{ top: 12, right: 8, left: 0, bottom: 48 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="region"
                  angle={-28}
                  textAnchor="end"
                  interval={0}
                  height={78}
                  tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={5}
                />
                <YAxis tick={{ fontSize: 12, fill: '#64748b', fontWeight: 700 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} width={56} />
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                    padding: '12px 16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(8px)'
                  }}
                  itemStyle={{ padding: '2px 0', fontWeight: 600 }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                <Bar dataKey="variance" name="Total Variance" fill="#ef4444" radius={[5, 5, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-emerald-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Monthly Financial Movement</h3>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {monthlyTrendData.length} Months
            </div>
          </div>
          <div className="p-4 sm:p-5">
            {monthlyTrendData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500">No monthly trend data available.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={monthlyTrendData} margin={{ top: 14, right: 18, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    ticks={monthlyTrendXAxisTicks}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 800 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    dy={10}
                  />
                  <YAxis
                    domain={[0, monthlyTrendTicks[monthlyTrendTicks.length - 1]]}
                    ticks={monthlyTrendTicks}
                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 800 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value, name) => [`Rs. ${formatNumber(value)}`, name]}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ padding: '2px 0', fontWeight: 600 }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '18px', fontWeight: 900, fontSize: '14px' }} iconType="circle" />
                  <Line type="monotone" dataKey="cashInHand" name="Cash In Hand" stroke="#0f766e" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#ffffff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="floatAmount" name="Float Amount" stroke="#2563eb" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#ffffff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="invoiceAmount" name="Invoice Amount" stroke="#7c3aed" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#ffffff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="utilization" name="Utilization" stroke="#f59e0b" strokeWidth={4} dot={{ r: 5, strokeWidth: 3, fill: '#ffffff' }} activeDot={{ r: 7, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
