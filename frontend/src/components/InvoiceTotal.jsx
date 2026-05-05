import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarDays, ReceiptText } from 'lucide-react';

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

const REGION_COLORS = ['#2563eb', '#0f766e', '#f59e0b', '#7c3aed', '#dc2626', '#0891b2'];

function normalizeMonth(monthValue) {
  if (!monthValue) return null;
  return MONTH_ALIASES[String(monthValue).trim().toLowerCase()] || null;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-LK');
}

export default function InvoiceTotal({ records = [], recordsError, recordsLoading }) {
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

  const filteredRecords = useMemo(() => {
    return records.filter((record) => Number(record.year) === Number(selectedYear));
  }, [records, selectedYear]);

  const monthlyInvoiceData = useMemo(() => {
    const totals = MONTHS.reduce((acc, month) => {
      acc[month] = 0;
      return acc;
    }, {});

    filteredRecords.forEach((record) => {
      const month = normalizeMonth(record.month);
      if (month) totals[month] += Number(record.invoiceAmount) || 0;
    });

    return MONTHS.map((month) => ({ month, invoiceAmount: totals[month] }));
  }, [filteredRecords]);

  const regionalInvoiceData = useMemo(() => {
    const regionMap = new Map();

    filteredRecords.forEach((record) => {
      const region = String(record.region || '').trim();
      if (!region || region.toLowerCase() === 'region') return;
      regionMap.set(region, (regionMap.get(region) || 0) + (Number(record.invoiceAmount) || 0));
    });

    return [...regionMap.entries()]
      .map(([region, invoiceAmount]) => ({ region, invoiceAmount }))
      .sort((a, b) => b.invoiceAmount - a.invoiceAmount);
  }, [filteredRecords]);

  const totalInvoiceAmount = filteredRecords.reduce((sum, record) => sum + (Number(record.invoiceAmount) || 0), 0);
  const hasMonthlyData = monthlyInvoiceData.some((item) => item.invoiceAmount > 0);
  const hasRegionalData = regionalInvoiceData.some((item) => item.invoiceAmount > 0);

  if (recordsError) {
    return <p className="text-red-500 text-sm bg-red-50 p-3 rounded">{recordsError}</p>;
  }

  if (recordsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ReceiptText className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Invoice Amount</p>
            <h3 className="text-2xl font-black text-slate-900">Rs. {formatNumber(totalInvoiceAmount)}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <label htmlFor="invoice-year" className="text-xs font-bold uppercase tracking-widest text-slate-500">Year:</label>
          <select
            id="invoice-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="h-6 w-1.5 rounded-full bg-blue-500" />
            <h3 className="text-lg font-black tracking-tight text-slate-900">Monthly Invoice Total</h3>
          </div>
          <div className="p-6">
            {!hasMonthlyData ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500">No invoice data available for {selectedYear}.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={monthlyInvoiceData} margin={{ top: 16, right: 16, left: 10, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    tickLine={false}
                    axisLine={false}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [formatNumber(value), 'Invoice Amount']}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ padding: '2px 0', fontWeight: 800, color: '#2563eb' }}
                    labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                  />
                  <Bar dataKey="invoiceAmount" name="Invoice Amount" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={42} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-indigo-500" />
              <h3 className="text-lg font-black tracking-tight text-slate-900">Regional Invoice Share</h3>
            </div>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {regionalInvoiceData.length} Regions
            </span>
          </div>
          <div className="p-6">
            {!hasRegionalData ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500">No regional invoice data available for {selectedYear}.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Pie
                      data={regionalInvoiceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={72}
                      outerRadius={112}
                      paddingAngle={2}
                      dataKey="invoiceAmount"
                      nameKey="region"
                      stroke="#ffffff"
                      strokeWidth={3}
                    >
                      {regionalInvoiceData.map((entry, index) => (
                        <Cell key={entry.region} fill={REGION_COLORS[index % REGION_COLORS.length]} />
                      ))}
                    </Pie>
                    <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="24" fontWeight="900">
                      {regionalInvoiceData.length}
                    </text>
                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="12" fontWeight="800">
                      REGIONS
                    </text>
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
                      itemStyle={{ padding: '2px 0', fontWeight: 800 }}
                      labelStyle={{ display: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {regionalInvoiceData.map((item, index) => {
                    const percent = totalInvoiceAmount > 0 ? ((item.invoiceAmount / totalInvoiceAmount) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.region} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: REGION_COLORS[index % REGION_COLORS.length] }} />
                          <span className="truncate text-sm font-black text-slate-800">{item.region}</span>
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-3">
                          <span className="text-xl font-black text-slate-900">{percent}%</span>
                          <span className="text-xs font-bold text-slate-500">Rs. {formatNumber(item.invoiceAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
