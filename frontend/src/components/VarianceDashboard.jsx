import { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const VARIANCE_STATUS_COLORS = ['#3B82F6', '#EA7B2C'];

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Year Selector */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="max-w-xs">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 hover:bg-white transition-colors"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Monthly Variance Chart */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-white" />
                <h3 className="text-lg font-semibold text-white">Monthly Variance Trends</h3>
              </div>
              <p className="text-blue-100 text-sm mt-1">Variance patterns across months</p>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyVarianceData}>
                  <defs>
                    <linearGradient id="colorVariance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    tickFormatter={(value) => `LKR ${value/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
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
            </div>
          </div>

          {/* Variance Status Pie Chart */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4">
              <h3 className="text-lg font-semibold text-white">Variance Status</h3>
              <p className="text-orange-100 text-sm mt-1">Balanced vs Non-Zero Variance for {selectedYear}</p>
            </div>

            <div className="p-6">
              {varianceStatusData.every((item) => item.value === 0) ? (
                <p className="text-sm text-gray-500">No variance data available for the selected year.</p>
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
                    <Tooltip formatter={(value, name) => [`${value} records`, name]} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Footer Stats Bar */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Monthly Variance Trends</span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
