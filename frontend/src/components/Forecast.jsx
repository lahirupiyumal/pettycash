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

export default function Forecast({ records = [] }) {
  const forecastData = useMemo(() => {
    if (!records.length) {
      return { cashInHand: [], invoiceAmount: [], utilization: [], nextSixMonths: [] };
    }

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

    const buildSeries = (metricKey, colorKey) => {
      const values = data.map((entry) => entry[metricKey]);
      const forecastValues = generateForecast(values);
      const futureValues = buildFutureValues(values);
      const lastMonth = data[data.length - 1];

      const historical = data.map((entry, index) => ({
        ...entry,
        value: Math.max(0, Math.round(entry[metricKey])),
        forecast: forecastValues[index]?.forecast ?? null,
        lowerBound: forecastValues[index]?.lowerBound ?? null,
        upperBound: forecastValues[index]?.upperBound ?? null,
        dateLabel: `${entry.year}-${String(getMonthNumber(entry.month)).padStart(2, '0')}`,
        isFuture: false,
        metricKey,
        colorKey,
      }));

      const future = Array.from({ length: 6 }, (_, index) => {
        const monthDate = new Date(Number(lastMonth.year), getMonthNumber(lastMonth.month) - 1 + index + 1, 1);
        return {
          key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          year: monthDate.getFullYear(),
          month: monthDate.toLocaleString('en-US', { month: 'long' }),
          dateLabel: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
          value: null,
          forecast: futureValues[index],
          lowerBound: Math.max(0, Math.round(futureValues[index] * 0.85)),
          upperBound: Math.max(0, Math.round(futureValues[index] * 1.15)),
          isFuture: true,
          metricKey,
          colorKey,
        };
      });

      return [...historical, ...future];
    };

    const generateForecast = (values) => {
      if (!values.length) return [];

      const start = values[0];
      const end = values[values.length - 1];
      const slope = values.length > 1 ? (end - start) / (values.length - 1) : 0;

      return values.map((val, i) => {
        const forecast = Math.max(0, Math.round(val + slope * (i + 1)));
        return {
          value: Math.max(0, Math.round(val)),
          forecast,
          lowerBound: Math.max(0, Math.round(forecast - val * 0.15)),
          upperBound: Math.max(0, Math.round(forecast + val * 0.15)),
        };
      });
    };

    const buildFutureValues = (values) => {
      if (!values.length) return [];

      const start = values[0];
      const end = values[values.length - 1];
      const slope = values.length > 1 ? (end - start) / (values.length - 1) : 0;
      const lastValue = values[values.length - 1];

      return Array.from({ length: 6 }, (_, index) => Math.max(0, Math.round(lastValue + slope * (index + 1))));
    };

    const cashInHandValues = data.map((d) => d.cashInHand);
    const invoiceAmountValues = data.map((d) => d.invoiceAmount);
    const utilizationValues = data.map((d) => d.utilization);

    const cashInHandForecast = generateForecast(cashInHandValues);
    const invoiceAmountForecast = generateForecast(invoiceAmountValues);
    const utilizationForecast = generateForecast(utilizationValues);
    const nextCashInHand = buildFutureValues(cashInHandValues);
    const nextInvoiceAmount = buildFutureValues(invoiceAmountValues);
    const nextUtilization = buildFutureValues(utilizationValues);

    const lastMonth = data[data.length - 1];
    return {
      cashInHand: buildSeries('cashInHand', 'values'),
      invoiceAmount: buildSeries('invoiceAmount', 'values'),
      utilization: buildSeries('utilization', 'values'),
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
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={COLORS.forecast}
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke={COLORS.lowerBound}
                  name="Lower Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
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
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={COLORS.forecast}
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke={COLORS.lowerBound}
                  name="Lower Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Utilization Forecast */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-emerald-500" />
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Utilization Forecast</h3>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">Historical values with linear forecast</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {forecastData.utilization.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No forecast data available.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={forecastData.utilization} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
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
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke={COLORS.forecast}
                  name="Forecast"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="lowerBound"
                  stroke={COLORS.lowerBound}
                  name="Lower Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="upperBound"
                  stroke={COLORS.upperBound}
                  name="Upper Confidence"
                  strokeWidth={1}
                  dot={false}
                  opacity={0.4}
                  connectNulls
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
