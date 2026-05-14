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
  Map,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-react';
import api from '../api/axios';
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
function StatCard({ icon: Icon, label, value, gradient, iconBg }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow duration-200`}>
      {/* accent strip */}
      <div className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${gradient}`} />
      <div className="flex items-center gap-4 pt-2">
        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums leading-none">{value}</p>
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
              <Map className="h-3.5 w-3.5" />
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={FileSpreadsheet}
          label="Total Records"
          value={stats.total.toLocaleString()}
          gradient="bg-gradient-to-r from-indigo-500 to-purple-500"
          iconBg="bg-gradient-to-br from-indigo-500 to-purple-600"
        />
        <StatCard
          icon={MapPin}
          label="Regions"
          value={stats.regions}
          gradient="bg-gradient-to-r from-blue-500 to-cyan-500"
          iconBg="bg-gradient-to-br from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={Building2}
          label="Cost Centers"
          value={stats.costCenters}
          gradient="bg-gradient-to-r from-emerald-500 to-teal-500"
          iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          icon={CalendarDays}
          label="Latest Year"
          value={stats.latestYear}
          gradient="bg-gradient-to-r from-orange-400 to-rose-500"
          iconBg="bg-gradient-to-br from-orange-400 to-rose-500"
        />
      </div>

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
