import { useEffect, useMemo, useState } from 'react';
import {
  BookUser,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Hash,
  LayoutList,
  Map as MapIcon,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import RegionView from '../components/RegionView';

// ── helpers ────────────────────────────────────────────────────────────────
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function monthIndex(m) {
  return MONTHS.indexOf(m);
}

// ── sub-components ─────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, tint }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/30">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: accent }} />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125" style={{ backgroundColor: accent }} />
      <div className="relative px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-3 min-h-[2rem] text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 leading-snug">{label}</p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="rounded-md bg-blue-50 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-blue-700">LKR</span>
              <p className="whitespace-nowrap text-2xl font-black tracking-tight text-slate-950 tabular-nums">
                {value.toLocaleString?.() ?? value}
              </p>
            </div>
          </div>
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl shadow-inner ring-1 transition-transform duration-300 group-hover:scale-105 ${tint}`}>
            <Icon className="h-5 w-5" strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ChevronDown className="h-3 w-3 opacity-30" />;
  }
  return sortConfig.dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
    : <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />;
}

function ProgressChart({ records }) {
  const [chartYear, setChartYear] = useState('');
  const [chartMonth, setChartMonth] = useState('');

  const chartYears = useMemo(
    () => [...new Set(records.map(r => r.year).filter(Boolean))].sort((a, b) => b - a),
    [records]
  );

  const chartMonths = useMemo(
    () => [...new Set(records.map(r => r.month).filter(Boolean))].sort((a, b) => monthIndex(a) - monthIndex(b)),
    [records]
  );

  useEffect(() => {
    if (!chartYear && chartYears.length) setChartYear(String(chartYears[0]));
    if (!chartMonth && chartMonths.length) setChartMonth(chartMonths[0]);
  }, [chartYear, chartMonth, chartYears, chartMonths]);

  const chartData = useMemo(() => {
    const filtered = records.filter(r => (
      (!chartYear || String(r.year) === String(chartYear)) &&
      (!chartMonth || r.month === chartMonth)
    ));

    const regionMap = new Map();
    filtered.forEach(r => {
      const key = r.region || '(No Region)';
      if (!regionMap.has(key)) {
        regionMap.set(key, { region: key, completed: 0, costCenters: new Set() });
      }
      const entry = regionMap.get(key);
      entry.completed += 1;
      if (r.costCenterName) entry.costCenters.add(r.costCenterName);
    });

    return [...regionMap.values()]
      .map(entry => ({
        region: entry.region,
        completed: entry.completed,
        costCenters: entry.costCenters.size,
      }))
      .sort((a, b) => b.completed - a.completed);
  }, [records, chartYear, chartMonth]);

  const totalCompleted = chartData.reduce((sum, item) => sum + item.completed, 0);
  const topRegion = chartData[0]?.region || '—';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Progress Chart</p>
          <h3 className="text-base font-black text-slate-900">Region completion by month</h3>
          <p className="text-xs text-slate-500 mt-1">Pick a month to see which region completed the most cost centers.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={chartYear}
            onChange={e => setChartYear(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Years</option>
            {chartYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={chartMonth}
            onChange={e => setChartMonth(e.target.value)}
            className="appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Months</option>
            {chartMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-100 px-6 py-4 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Completed</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{totalCompleted.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Top region</p>
          <p className="mt-1 text-2xl font-black text-slate-900 truncate">{topRegion}</p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Regions active</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{chartData.length.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 py-4 sm:px-6">
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <CalendarDays className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No region completions found for the selected month.</p>
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="region" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  formatter={(value, name) => [value, name === 'completed' ? 'Completed' : 'Cost centers']}
                />
                <Bar dataKey="completed" name="completed" radius={[8, 8, 0, 0]} fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────
export default function AccountantDetails() {
  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'year', dir: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState('table'); // 'table' | 'region'
  const PAGE_SIZE = 20;

  // Fetch all accountant records (no importFileId filter)
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/accountants');
        setRecords(res.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load accountant details.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Derived filter options
  const regions = useMemo(() => [...new Set(records.map(r => r.region).filter(Boolean))].sort(), [records]);
  const years   = useMemo(() => [...new Set(records.map(r => r.year).filter(Boolean))].sort((a, b) => b - a), [records]);
  const months  = useMemo(() => [...new Set(records.map(r => r.month).filter(Boolean))].sort((a, b) => monthIndex(a) - monthIndex(b)), [records]);

  // Stats
  const stats = useMemo(() => ({
    total:       records.length,
    regions:     new Set(records.map(r => r.region).filter(Boolean)).size,
    costCenters: new Set(records.map(r => r.costCenterName).filter(Boolean)).size,
    latestYear:  records.length ? Math.max(...records.map(r => Number(r.year)).filter(Boolean)) : '—',
  }), [records]);

  // Filter + search
  const filtered = useMemo(() => {
    let data = records;
    if (filterRegion) data = data.filter(r => r.region === filterRegion);
    if (filterYear)   data = data.filter(r => String(r.year) === filterYear);
    if (filterMonth)  data = data.filter(r => r.month === filterMonth);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(r =>
        [r.region, r.pcfRef, r.costCenterName, r.number, String(r.year), r.month]
          .some(v => v && String(v).toLowerCase().includes(q))
      );
    }
    return data;
  }, [records, filterRegion, filterYear, filterMonth, search]);

  // Sort
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = a[sortConfig.key] ?? '';
      let bv = b[sortConfig.key] ?? '';
      if (sortConfig.key === 'year') { av = Number(av); bv = Number(bv); }
      else if (sortConfig.key === 'month') { av = monthIndex(av); bv = monthIndex(bv); }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.dir === 'asc' ?  1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortConfig]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key) => {
    setSortConfig(prev =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    );
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterRegion('');
    setFilterYear('');
    setFilterMonth('');
    setSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterRegion || filterYear || filterMonth || search.trim();

  // ── render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-indigo-100 border-t-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Loading accountant details…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
            <BookUser className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Accountant Management</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Accountant Details</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeView === 'table'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              Table
            </button>
            <button
              onClick={() => setActiveView('region')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                activeView === 'region'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              By Region
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-700">
              {records.length.toLocaleString()} total record{records.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FileSpreadsheet}
          label="Total Records"
          value={stats.total}
          accent="#4f46e5"
          tint="bg-blue-50 text-blue-600 ring-blue-100"
        />
        <StatCard
          icon={MapPin}
          label="Regions"
          value={stats.regions}
          accent="#0f766e"
          tint="bg-teal-50 text-teal-600 ring-teal-100"
        />
        <StatCard
          icon={Building2}
          label="Cost Centers"
          value={stats.costCenters}
          accent="#7c3aed"
          tint="bg-violet-50 text-violet-600 ring-violet-100"
        />
        <StatCard
          icon={CalendarDays}
          label="Latest Year"
          value={stats.latestYear}
          accent="#f59e0b"
          tint="bg-amber-50 text-amber-600 ring-amber-100"
        />
      </div>

      <ProgressChart records={records} />

      {/* ── Region View ── */}
      {activeView === 'region' && (
        <RegionView records={records} />
      )}


      {/* ── Table view (filters + table) ── */}
      {activeView === 'table' && (
        <>
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={handleFilterChange(setSearch)}
              placeholder="Search by region, PCF ref, cost center…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>

          {/* Region filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterRegion}
              onChange={handleFilterChange(setFilterRegion)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition cursor-pointer"
            >
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Year filter */}
          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterYear}
              onChange={handleFilterChange(setFilterYear)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition cursor-pointer"
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {/* Month filter */}
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={filterMonth}
              onChange={handleFilterChange(setFilterMonth)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition cursor-pointer"
            >
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          {/* Result count */}
          <span className="ml-auto text-xs font-bold text-slate-400">
            {sorted.length.toLocaleString()} result{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <Users className="h-4 w-4 text-white" strokeWidth={1.8} />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Records</p>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {records.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <BookUser className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-base font-bold text-slate-700">No accountant records found</p>
              <p className="text-sm text-slate-400 mt-1">Import an Excel file using <span className="font-semibold text-indigo-600">Accountant Import</span> to populate this page.</p>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <Search className="h-10 w-10 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No records match your filters.</p>
            <button onClick={clearFilters} className="text-xs font-bold text-indigo-600 hover:underline">Clear all filters</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50/80">
                <tr>
                  {[
                    { key: 'region',        label: 'Region' },
                    { key: 'pcfRef',        label: 'PCF Ref' },
                    { key: 'costCenterName', label: 'Cost Center Name' },
                    { key: 'number',        label: 'Number' },
                    { key: 'year',          label: 'Year' },
                    { key: 'month',         label: 'Month' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-6 py-3 border-b border-slate-100 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                        {label}
                        <SortIcon column={key} sortConfig={sortConfig} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-indigo-50/40 transition-colors duration-100 group">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-6 items-center rounded-full bg-indigo-100 px-2.5 text-[11px] font-bold text-indigo-700">
                          {r.region || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{r.pcfRef || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-[260px] truncate">{r.costCenterName || '—'}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono text-xs">{r.number || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        {r.year || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                        {r.month || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold text-slate-400">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let page;
                if (totalPages <= 5) {
                  page = idx + 1;
                } else if (currentPage <= 3) {
                  page = idx + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + idx;
                } else {
                  page = currentPage - 2 + idx;
                }
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      currentPage === page
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
