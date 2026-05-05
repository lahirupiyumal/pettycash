import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  values: '#2563eb',
  forecast: '#f97316',
  lowerBound: '#ef4444',
  upperBound: '#f59e0b',
};

function formatNumber(value) {
  return (value / 1000000).toFixed(1) + 'M';
}

function formatTooltip(value) {
  return [Number(value).toLocaleString('en-LK'), ''];
}

export default function ForecastCharts({ records = [] }) {
  const forecastData = useMemo(() => {
    if (!records.length) return { cashInHand: [], invoiceAmount: [], utilization: [] };

    // Group records by month and year
    const monthlyData = {};
    records.forEach((record) => {
      const key = `${record.year}-${record.month}`;
      if (!monthlyData[key]) {
        monthlyData[key] = {
          key,
          year: record.year,
          month: record.month,
          cashInHand: 0,
          invoiceAmount: 0,
          utilization: 0,
          count: 0,
        };
      }
      monthlyData[key].cashInHand += Number(record.cashInHand) || 0;
      monthlyData[key].invoiceAmount += Number(record.invoiceAmount) || 0;
      monthlyData[key].utilization += Number(record.utilization) || 0;
      monthlyData[key].count += 1;
    });

    const data = Object.values(monthlyData)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return compareMonths(a.month, b.month);
      })
      .slice(-12);

    // Generate forecast (simple linear interpolation)
    const generateForecast = (values) => {
      if (values.length < 2) return values;
      const avgChange = (values[values.length - 1] - values[0]) / values.length;
      return values.map((val, i) => ({
        value: val,
        forecast: Math.max(0, val + avgChange * (i + 1)),
        lowerBound: Math.max(0, val + avgChange * (i + 1) - val * 0.15),
        upperBound: val + avgChange * (i + 1) + val * 0.15,
      }));
    };

    const cashInHandValues = data.map((d) => d.cashInHand);
    const invoiceAmountValues = data.map((d) => d.invoiceAmount);
    const utilizationValues = data.map((d) => d.utilization);

    const cashInHandForecast = generateForecast(cashInHandValues);
    const invoiceAmountForecast = generateForecast(invoiceAmountValues);
    const utilizationForecast = generateForecast(utilizationValues);

    return {
      cashInHand: data.map((d, i) => ({
        ...d,
        ...cashInHandForecast[i],
        dateLabel: `${d.year}-${String(getMonthNumber(d.month)).padStart(2, '0')}`,
      })),
      invoiceAmount: data.map((d, i) => ({
        ...d,
        ...invoiceAmountForecast[i],
        dateLabel: `${d.year}-${String(getMonthNumber(d.month)).padStart(2, '0')}`,
      })),
      utilization: data.map((d, i) => ({
        ...d,
        ...utilizationForecast[i],
        dateLabel: `${d.year}-${String(getMonthNumber(d.month)).padStart(2, '0')}`,
      })),
    };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* Cash In Hand Forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-blue-500" />
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Cash In Hand Forecast</h3>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Historical values with linear forecast</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {forecastData.cashInHand.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No forecast data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData.cashInHand} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={5}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={formatNumber}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  formatter={formatTooltip}
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
                <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.values}
                  name="Values"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={COLORS.forecast}
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke={COLORS.lowerBound}
                  name="Lower Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Invoice Amount Forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-orange-500" />
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Invoice Amount Forecast</h3>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Historical values with linear forecast</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {forecastData.invoiceAmount.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No forecast data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData.invoiceAmount} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  dy={5}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  tickFormatter={formatNumber}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip
                  formatter={formatTooltip}
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
                <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.values}
                  name="Values"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={COLORS.forecast}
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke={COLORS.lowerBound}
                  name="Lower Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function compareMonths(a, b) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const aIndex = months.indexOf(a);
  const bIndex = months.indexOf(b);
  return aIndex - bIndex;
}

function getMonthNumber(monthName) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months.indexOf(monthName) + 1;
}
