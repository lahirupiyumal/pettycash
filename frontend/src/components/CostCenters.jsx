import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatNumber(value) {
  return Number(value || 0).toLocaleString('en-LK');
}

export default function CostCenters({ records = [], recordsError, recordsLoading }) {
  const costCenterData = useMemo(() => {
    const costCenterMap = new Map();

    records.forEach((record) => {
      const number = record.number ?? record.costCenterNumber;
      const label = number ? String(number) : String(record.costCenterName || '').trim();
      if (!label || label.toLowerCase() === 'cost center') return;

      if (!costCenterMap.has(label)) {
        costCenterMap.set(label, {
          costCenter: label,
          cashInHand: 0,
          invoiceAmount: 0,
          utilization: 0,
          floatAmount: 0,
        });
      }

      const row = costCenterMap.get(label);
      row.cashInHand += Number(record.cashInHand) || 0;
      row.invoiceAmount += Number(record.invoiceAmount) || 0;
      row.utilization += Number(record.utilization) || 0;
      row.floatAmount += Number(record.floatAmount) || 0;
    });

    return [...costCenterMap.values()].sort((a, b) => {
      const numericA = Number(a.costCenter);
      const numericB = Number(b.costCenter);
      if (Number.isFinite(numericA) && Number.isFinite(numericB)) return numericA - numericB;
      return a.costCenter.localeCompare(b.costCenter);
    });
  }, [records]);

  const chartData = useMemo(() => {
    return [...costCenterData]
      .sort((a, b) => b.floatAmount - a.floatAmount)
      .slice(0, 20)
      .sort((a, b) => {
        const numericA = Number(a.costCenter);
        const numericB = Number(b.costCenter);
        if (Number.isFinite(numericA) && Number.isFinite(numericB)) return numericA - numericB;
        return a.costCenter.localeCompare(b.costCenter);
      });
  }, [costCenterData]);

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
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-white px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 rounded-full bg-amber-500" />
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-900">Cost Center Summary</h3>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mt-0.5">
                Top 20 by float amount
              </p>
            </div>
          </div>
          <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
            {costCenterData.length} Cost Centers
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {costCenterData.length === 0 ? (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm font-semibold text-slate-500">No cost center data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[1100px]">
                <ResponsiveContainer width="100%" height={460}>
                  <BarChart data={chartData} margin={{ top: 16, right: 24, left: 12, bottom: 18 }} barCategoryGap="22%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="costCenter"
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 800 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    dy={10}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#475569', fontWeight: 800 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                      if (value >= 1000) return `${Math.round(value / 1000)}k`;
                      return value;
                    }}
                    tickLine={false}
                    axisLine={false}
                    width={78}
                  />
                  <Tooltip
                    formatter={(value, name) => [`Rs. ${formatNumber(value)}`, name]}
                    contentStyle={{
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.96)',
                    }}
                    itemStyle={{ padding: '2px 0', fontWeight: 700 }}
                    labelStyle={{ fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="center"
                    iconType="square"
                    wrapperStyle={{ paddingBottom: '20px', fontWeight: 800, color: '#475569' }}
                  />
                  <Bar dataKey="cashInHand" name="Cash In Hand" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="invoiceAmount" name="Invoice Amount" fill="#ea580c" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="utilization" name="Utilization" fill="#94a3b8" radius={[3, 3, 0, 0]} maxBarSize={18} />
                  <Bar dataKey="floatAmount" name="Float Amount" fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
