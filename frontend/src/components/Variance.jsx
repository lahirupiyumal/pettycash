import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const VARIANCE_STATUS_COLORS = ['#2563eb', '#f97316'];

export default function Variance({ records }) {
  const currentYear = new Date().getFullYear();
  
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get available years from records
  const availableYears = useMemo(() => {
    const years = [...new Set(records?.map(record => record.year).filter(Boolean) || [])];
    return years.sort((a, b) => b - a);
  }, [records]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Calculate monthly total variance data
  const monthlyVarianceData = useMemo(() => {
    const data = {};
    
    records?.forEach(record => {
      if (
        record.year === selectedYear
        && record.month
        && record.variance !== undefined
        && record.variance !== null
      ) {
        const key = `${record.year}-${record.month}`;
        if (!data[key]) {
          data[key] = {
            year: record.year,
            month: record.month,
            totalVariance: 0
          };
        }
        data[key].totalVariance += Math.abs(record.variance);
      }
    });

    return Object.values(data)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
      })
      .slice(-12); // Last 12 months
  }, [records, selectedYear]);

  const varianceStatusData = useMemo(() => {
    const yearRecords = (records || []).filter((record) => record.year === selectedYear);

    const balanced = yearRecords.filter((record) => {
      const variance = Number(record.variance) || 0;
      const status = String(record.varianceStatus || '').toLowerCase().trim();
      return variance === 0 || status === 'balanced';
    }).length;

    const nonZeroVariance = yearRecords.length - balanced;
    const total = yearRecords.length;

    return [
      {
        name: 'Balanced',
        value: balanced,
        percent: total > 0 ? Math.round((balanced / total) * 100) : 0,
      },
      {
        name: 'Non-Zero Variance',
        value: nonZeroVariance,
        percent: total > 0 ? Math.round((nonZeroVariance / total) * 100) : 0,
      },
    ];
  }, [records, selectedYear]);

  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <label htmlFor="variance-year" className="text-xs font-bold uppercase tracking-widest text-slate-500">Year:</label>
          <select
            id="variance-year"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Monthly Variance Trends</h3>
              </div>
            </div>
            <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600 ring-1 ring-blue-200/50">
              {selectedYear}
            </div>
          </div>
          <div className="p-6">
            {monthlyVarianceData.length === 0 ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500">No variance trend data available for {selectedYear}.</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyVarianceData} margin={{ top: 20, right: 16, left: 8, bottom: 40 }}>
                <defs>
                  <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={5}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={(value) => `LKR ${Math.round(value/1000)}k`}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
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
                  formatter={(value) => [formatCurrency(value), 'Total Variance']}
                  labelFormatter={(label) => {
                    const item = monthlyVarianceData.find(d => d.month === label);
                    return item ? `${item.month} ${item.year}` : label;
                  }}
                />
                <Bar 
                  dataKey="totalVariance" 
                  fill="url(#colorVariance)"
                  name="Total Variance"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-indigo-500" />
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-900">Variance Status</h3>
              </div>
            </div>
            <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
              Balanced vs Non-Zero
            </div>
          </div>

          <div className="p-6">
            {varianceStatusData.every((item) => item.value === 0) ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-500">No variance data available for {selectedYear}.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={varianceStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={90}
                    outerRadius={140}
                    dataKey="value"
                    label={({ percent }) => `${percent}%`}
                    labelLine={false}
                    stroke="none"
                  >
                    {varianceStatusData.map((entry, index) => (
                      <Cell key={entry.name} fill={index === 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Pie>
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
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
