import { useMemo } from 'react';
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

const STATUS_COLORS = ['#3b6ec2', '#eb7f2f'];

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-LK');
}

function formatCardNumber(value) {
  return Number(value || 0).toLocaleString('en-US');
}

export default function OverviewDashboard({ records = [] }) {
  const totals = useMemo(() => {
    return records.reduce(
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
  }, [records]);

  const regionTrendData = useMemo(() => {
    const regionMap = new Map();

    records.forEach((record) => {
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
  }, [records]);

  const varianceStatusData = useMemo(() => {
    const balanced = records.filter((record) => {
      const variance = Number(record.variance) || 0;
      const status = String(record.varianceStatus || '').toLowerCase().trim();
      return variance === 0 || status === 'balanced';
    }).length;

    const nonZeroVariance = records.length - balanced;
    const total = records.length;

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
  }, [records]);

  const cards = [
    { label: 'Total Float Value', value: totals.floatAmount },
    { label: 'Total Cash In Hand', value: totals.cashInHand },
    { label: 'Total Invoice Amount', value: totals.invoiceAmount },
    { label: 'Total Expenses', value: totals.utilization },
    { label: 'Total Variance', value: totals.variance },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
              <p className="text-sm font-semibold text-slate-700 leading-snug min-h-[2.75rem]">
                {card.label}
              </p>
            </div>
            <div className="px-5 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">LKR</p>
              <p className="mt-2 text-[clamp(1.6rem,1.5vw,2.3rem)] font-black text-slate-900 leading-none whitespace-nowrap">
                {formatCardNumber(card.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Monthly Trend Chart</h3>
            <p className="text-sm text-slate-500 mt-1">Region-wise comparison of float and utilization totals.</p>
          </div>
          <div className="p-6">
          {regionTrendData.length === 0 ? (
            <p className="text-center text-slate-500 py-20">No trend data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={regionTrendData} margin={{ top: 20, right: 16, left: 8, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="region"
                  angle={-38}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12, fill: '#475569' }}
                />
                <YAxis tick={{ fontSize: 12, fill: '#475569' }} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 20px rgba(15, 23, 42, 0.08)',
                  }}
                />
                <Legend />
                <Bar dataKey="floatAmount" name="Sum of Float Amount" fill="#3b6ec2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilization" name="Sum of Utilization" fill="#eb7f2f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Variance Status</h3>
            <p className="text-sm text-slate-500 mt-1">Balanced vs non-zero variance records.</p>
          </div>
          <div className="p-6">
          {varianceStatusData.every((item) => item.value === 0) ? (
            <p className="text-center text-slate-500 py-20">No variance data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={varianceStatusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={95}
                  outerRadius={145}
                  dataKey="value"
                  label={({ percent }) => `${percent}%`}
                >
                  {varianceStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
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
    </div>
  );
}
