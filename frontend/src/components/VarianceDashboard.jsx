import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CalendarDays, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const VARIANCE_STATUS_COLORS = ['#2563eb', '#f97316'];

export default function VarianceDashboard({ records }) {
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
        <div className="bg-gradient-to-b from-white to-slate-50 rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Variance Analysis</h3>
              <p className="text-sm text-slate-500 mt-1">Track monthly variance movement and balanced record status.</p>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-700" />
              <label htmlFor="variance-year" className="text-sm font-semibold text-slate-700">Select Year</label>
            <select
              id="variance-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm text-slate-800 shadow-sm transition-colors"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Monthly Variance Trends</h3>
                  <p className="text-sm text-slate-500 mt-1">Variance patterns across months.</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {monthlyVarianceData.length === 0 ? (
                <p className="text-sm text-slate-500 py-20 text-center">No variance trend data available for the selected year.</p>
              ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyVarianceData}>
                  <defs>
                    <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#93c5fd" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#475569' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickFormatter={(value) => `LKR ${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '12px',
                      boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)'
                    }}
                    formatter={(value) => [formatCurrency(value), 'Total Variance']}
                    labelFormatter={(label) => {
                      const item = monthlyVarianceData.find(d => d.month === label);
                      return item ? `${item.month} ${item.year}` : label;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="totalVariance" 
                    fill="url(#colorVariance)"
                    name="Total Variance"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 flex items-center justify-center">
                  <PieChartIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Variance Status</h3>
                  <p className="text-sm text-slate-500 mt-1">Balanced vs non-zero variance for {selectedYear}.</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {varianceStatusData.every((item) => item.value === 0) ? (
                <p className="text-sm text-slate-500 py-20 text-center">No variance data available for the selected year.</p>
              ) : (
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={varianceStatusData}
                      cx="50%"
                      cy="45%"
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${percent}%`}
                    >
                      {varianceStatusData.map((entry, index) => (
                        <Cell key={entry.name} fill={VARIANCE_STATUS_COLORS[index % VARIANCE_STATUS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} records`, name]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm text-slate-600">Monthly Variance Trends</span>
              </div>
            </div>
            <div className="text-sm text-slate-500">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
    </div>
  );
}
