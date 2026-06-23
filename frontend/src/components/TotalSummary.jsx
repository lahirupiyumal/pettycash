import { useMemo, useState } from 'react';
import CashFloatAmount from './CashFloatAmount';
import CashInHand from './CashInHand';
import TotalExpenses from './TotalExpenses';
import Total from './Total';
import Variance from './Variance';
import { CalendarDays, LayoutDashboard } from 'lucide-react';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_ALIASES = {
  jan: 'January',
  january: 'January',
  feb: 'February',
  february: 'February',
  mar: 'March',
  march: 'March',
  apr: 'April',
  april: 'April',
  may: 'May',
  jun: 'June',
  june: 'June',
  jul: 'July',
  july: 'July',
  aug: 'August',
  august: 'August',
  sep: 'September',
  sept: 'September',
  september: 'September',
  oct: 'October',
  october: 'October',
  nov: 'November',
  november: 'November',
  dec: 'December',
  december: 'December',
};

function normalizeMonth(monthValue) {
  if (!monthValue) return null;
  const normalized = String(monthValue).trim().toLowerCase();
  return MONTH_ALIASES[normalized] || null;
}

export default function TotalSummary({ records = [] }) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = [...new Set(records.map((record) => Number(record.year)).filter(Boolean))];
    const sorted = years.sort((a, b) => b - a);
    return sorted.length ? sorted : [currentYear];
  }, [records, currentYear]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYear);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => Number(record.year) === selectedYear);
  }, [records, selectedYear]);

  const summaryTotals = useMemo(() => {
    return filteredRecords.reduce(
      (acc, record) => {
        acc.floatAmount += Number(record.floatAmount) || 0;
        acc.cashInHand += Number(record.cashInHand) || 0;
        acc.invoiceAmount += Number(record.invoiceAmount) || 0;
        acc.total += Number(record.total) || 0;
        acc.variance += Math.abs(Number(record.variance) || 0);
        return acc;
      },
      {
        floatAmount: 0,
        cashInHand: 0,
        invoiceAmount: 0,
        total: 0,
        variance: 0,
      }
    );
  }, [filteredRecords]);

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString('en-LK');
  };

  return (
    <div className="space-y-6">
      {/* Header with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 text-blue-600 shadow-inner">
            <LayoutDashboard className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Dashboard</p>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Total Summary</h3>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-xl border border-slate-200 w-fit">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          <label htmlFor="summary-year" className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Year:
          </label>
          <select
            id="summary-year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="bg-transparent text-sm font-black text-slate-800 focus:outline-none cursor-pointer"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 shadow-sm ring-1 ring-purple-200/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600 mb-2">Cash Float Amount</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rs. {formatNumber(summaryTotals.floatAmount)}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm ring-1 ring-emerald-200/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 mb-2">Cash In Hand</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rs. {formatNumber(summaryTotals.cashInHand)}</p>
        </div>
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 shadow-sm ring-1 ring-orange-200/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-600 mb-2">Total Expenses</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rs. {formatNumber(summaryTotals.invoiceAmount)}</p>
        </div>
        <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-teal-100/50 p-5 shadow-sm ring-1 ring-teal-200/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 mb-2">Total</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rs. {formatNumber(summaryTotals.total)}</p>
        </div>
        <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 p-5 shadow-sm ring-1 ring-red-200/50">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 mb-2">Total Variance</p>
          <p className="text-2xl font-black text-slate-900 tracking-tight">Rs. {formatNumber(summaryTotals.variance)}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFloatAmount records={filteredRecords} />
        <CashInHand records={filteredRecords} />
        <TotalExpenses records={filteredRecords} />
        <Total records={filteredRecords} />
      </div>

      {/* Variance Chart - Full Width */}
      <Variance records={filteredRecords} />
    </div>
  );
}
