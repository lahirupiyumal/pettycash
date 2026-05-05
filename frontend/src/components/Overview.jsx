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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Layers3, PieChart as PieChartIcon, Sparkles, TrendingUp } from 'lucide-react';

const STATUS_COLORS = ['#3b6ec2', '#eb7f2f'];
const CARD_ACCENTS = ['#2563eb', '#0f766e', '#7c3aed', '#f59e0b', '#dc2626'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-LK');
}

function formatCardNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
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
        acc.utilization += Number(record.utilization) || 0;
        acc.variance += Number(record.variance) || 0;
        return acc;
      },
      {
        floatAmount: 0,
        cashInHand: 0,
        invoiceAmount: 0,
        utilization: 0,
        variance: 0,
      }
    );
  }, [filteredRecords]);

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

  const varianceStatusData = useMemo(() => {
    const balanced = filteredRecords.filter((record) => {
      const variance = Number(record.variance) || 0;
      const status = String(record.varianceStatus || '').toLowerCase().trim();
      return variance === 0 || status === 'balanced';
    }).length;

    const nonZeroVariance = filteredRecords.length - balanced;
    const total = filteredRecords.length;

    return [
      {
        name: 'Balanced',
        value: balanced,
        percent: total > 0 ? ((balanced / total) * 100).toFixed(2) : '0.00',
      },
      {
        name: 'Non-Zero Variance',
        value: nonZeroVariance,
        percent: total > 0 ? ((nonZeroVariance / total) * 100).toFixed(2) : '0.00',
      },
    ];
  }, [filteredRecords]);

  const varianceStatusTotal = varianceStatusData.reduce((sum, item) => sum + item.value, 0);

  const cards = [
    { label: 'Total Float Value', value: totals.floatAmount, icon: Layers3 },
    { label: 'Total Cash In Hand', value: totals.cashInHand, icon: Sparkles },
    { label: 'Total Invoice Amount', value: totals.invoiceAmount, icon: TrendingUp },
    { label: 'Total Expenses', value: totals.utilization, icon: PieChartIcon },
    { label: 'Total Variance', value: totals.variance, icon: PieChartIcon },
  ];

  return (
    <div className="space-y-8 rounded-[2rem] p-4 sm:p-6 bg-transparent">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200">
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
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card, index) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-200/50"
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: CARD_ACCENTS[index % CARD_ACCENTS.length] }} />
            <div className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 leading-snug min-h-[2rem]">{card.label}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">LKR</span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight whitespace-nowrap">
                      {formatCardNumber(card.value)}
                    </p>
                  </div>
                </div>
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                  <card.icon className="h-5 w-5" strokeWidth={2} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Regional Float vs Utilization</h3>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              {regionTrendData.length} Regions
            </div>
          </div>
          <div className="p-5 sm:p-6">
          {regionTrendData.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No trend data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <BarChart data={regionTrendData} margin={{ top: 16, right: 12, left: 0, bottom: 54 }} barCategoryGap="28%">
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
                <Bar dataKey="floatAmount" name="Float Amount" fill="#3b82f6" radius={[5, 5, 0, 0]} maxBarSize={56} />
                <Bar dataKey="utilization" name="Utilization" fill="#f59e0b" radius={[5, 5, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-white px-6 py-5 flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-indigo-500" />
            <h3 className="text-lg font-black tracking-tight text-slate-900">Variance Status Distribution</h3>
          </div>
          <div className="p-5 sm:p-6">
          {varianceStatusData.every((item) => item.value === 0) ? (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No variance data available.</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Pie
                    data={varianceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={116}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={3}
                  >
                    {varianceStatusData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Pie>
                  <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" fill="#0f172a" fontSize="30" fontWeight="900">
                    {varianceStatusTotal}
                  </text>
                  <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="12" fontWeight="800">
                    RECORDS
                  </text>
                  <Tooltip
                    formatter={(value, name) => [`${value} records`, name]}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)'
                    }}
                    itemStyle={{ padding: '2px 0', fontWeight: 600 }}
                    labelStyle={{ display: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {varianceStatusData.map((item, index) => (
                  <div key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: index === 0 ? '#10b981' : '#f43f5e' }} />
                      <span className="text-sm font-black text-slate-800">{item.name}</span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <span className="text-2xl font-black text-slate-900">{item.percent}%</span>
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.value} records</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
