import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';

export default function SummaryCards({ summary }) {
  const cards = [
    { 
      label: 'Total Credit', 
      value: summary.totalCredit, 
      icon: TrendingUp,
      iconBg: 'bg-emerald-100 text-emerald-600',
      trend: 'text-emerald-500'
    },
    { 
      label: 'Total Debit', 
      value: summary.totalDebit, 
      icon: TrendingDown,
      iconBg: 'bg-rose-100 text-rose-600',
      trend: 'text-rose-500'
    },
    { 
      label: 'Net Balance', 
      value: summary.balance, 
      icon: Wallet,
      iconBg: 'bg-blue-100 text-blue-600',
      trend: 'text-blue-500'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div 
            key={c.label} 
            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{c.label}</p>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Rs. {c.value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${c.iconBg}`}>
                <Icon className="h-6 w-6" strokeWidth={2.5} />
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
              <span className={c.trend}>Current Period</span>
              <span className="text-slate-400">Total Calculation</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
