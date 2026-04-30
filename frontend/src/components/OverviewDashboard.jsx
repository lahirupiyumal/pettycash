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
import { Layers3, PieChart as PieChartIcon, Sparkles, TrendingUp } from 'lucide-react';

const STATUS_COLORS = ['#3b6ec2', '#eb7f2f'];
const CARD_ACCENTS = ['#2563eb', '#0f766e', '#7c3aed', '#f59e0b', '#dc2626'];

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
    { label: 'Total Float Value', value: totals.floatAmount, icon: Layers3 },
    { label: 'Total Cash In Hand', value: totals.cashInHand, icon: Sparkles },
    { label: 'Total Invoice Amount', value: totals.invoiceAmount, icon: TrendingUp },
    { label: 'Total Expenses', value: totals.utilization, icon: PieChartIcon },
    { label: 'Total Variance', value: totals.variance, icon: PieChartIcon },
  ];

  return (
    <div className="space-y-8 rounded-[2rem] bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_34%,#ffffff_100%)] p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: CARD_ACCENTS[[...cards].indexOf(card) % CARD_ACCENTS.length] }} />
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700 leading-snug min-h-[2.75rem]">{card.label}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">LKR</p>
                  <p className="mt-2 text-[clamp(1.45rem,1.5vw,2.15rem)] font-black text-slate-900 leading-none whitespace-nowrap">
                    {formatCardNumber(card.value)}
                  </p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800">Monthly Trend Chart</h3>
                <p className="mt-1 text-sm text-slate-500">Region-wise comparison of float and utilization totals.</p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                {regionTrendData.length} regions
              </div>
            </div>
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

        <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
            <h3 className="text-lg font-black text-slate-800">Variance Status</h3>
            <p className="mt-1 text-sm text-slate-500">Balanced vs non-zero variance records.</p>
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

      <div className="rounded-2xl border border-slate-200 bg-white/90 px-5 py-4 shadow-sm">
        <p className="text-sm text-slate-600">
          Tip: use the side menu to switch between overview, cash, variance, and monthly summaries.
        </p>
      </div>
    </div>
  );
}
