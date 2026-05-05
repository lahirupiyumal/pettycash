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
    <div className="space-y-3">
      {/* Cash In Hand Forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm font-bold text-slate-800">Cash In Hand Forecast</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Historical values with forecast and confidence bounds.</p>
        </div>
        <div className="p-3">
          {forecastData.cashInHand.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No forecast data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={forecastData.cashInHand} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  angle={-30}
                  textAnchor="end"
                  height={42}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={formatTooltip}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.values}
                  name="Values"
                  strokeWidth={2}
                  dot={false}
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
                  name="Lower Confidence Bound"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence Bound"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.6}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Invoice Amount Forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-sm font-bold text-slate-800">Invoice Amount Forecast</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Historical values with forecast and confidence bounds.</p>
        </div>
        <div className="p-3">
          {forecastData.invoiceAmount.length === 0 ? (
            <p className="text-center text-slate-500 py-6 text-sm">No forecast data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={forecastData.invoiceAmount} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 9, fill: '#475569' }}
                  angle={-30}
                  textAnchor="end"
                  height={42}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#475569' }}
                  tickFormatter={formatNumber}
                />
                <Tooltip
                  formatter={formatTooltip}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.values}
                  name="Values"
                  strokeWidth={2}
                  dot={false}
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
                  name="Lower Confidence Bound"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.6}
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence Bound"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.6}
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
