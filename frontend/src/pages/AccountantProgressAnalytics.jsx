import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Hash,
  MapPin,
  Search,
  X,
  TrendingUp,
  Users,
  Award,
  AlertCircle,
  Activity,
  UserCheck,
  Percent,
  TrendingDown,
  Clock,
  ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function monthIndex(m) {
  return MONTHS.indexOf(m);
}

function StatCard({ icon: Icon, label, value, subtext, accent, tint }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/30">
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ backgroundColor: accent }} />
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 transition-transform duration-300 group-hover:scale-125" style={{ backgroundColor: accent }} />
      <div className="relative px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 min-h-[1.5rem] text-[11px] font-black uppercase tracking-[0.16em] text-slate-500 leading-snug">{label}</p>
            <p className="whitespace-nowrap text-3xl font-black tracking-tight text-slate-950 tabular-nums">
              {value}
            </p>
            {subtext && <p className="mt-1 text-xs font-semibold text-slate-400">{subtext}</p>}
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
  if (sortConfig.key !== column) return <ChevronDown className="h-3 w-3 opacity-30" />;
  return sortConfig.dir === 'asc'
    ? <ChevronUp className="h-3.5 w-3.5 text-indigo-500" />
    : <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />;
}

const PAGE_SIZE = 15;

const isReconciled = (val) => {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return /\d{4}-\d{2}-\d{2}/.test(s) || /\d{1,2}\/\d{1,2}\/\d{4}/.test(s) ||
    ['completed', 'checked', 'reconciled', 'yes', 'done'].includes(s);
};

export default function AccountantProgressAnalytics({ refreshTrigger = 0 }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering states
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterAccountant, setFilterAccountant] = useState('');

  // Selected accountant for detail view
  const [selectedAccountantKey, setSelectedAccountantKey] = useState(null);

  // Pagination & Sorting
  const [sortConfig, setSortConfig] = useState({ key: 'year', dir: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Active Dashboard Tab ('overview' | 'regions' | 'table')
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await api.get('/records');
        setRecords(data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load records.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshTrigger]);

  // Derive filter lists from ALL raw records to keep choices complete
  const regions = useMemo(() => [...new Set(records.map(r => r.region).filter(Boolean))].sort(), [records]);
  const years   = useMemo(() => [...new Set(records.map(r => r.year).filter(Boolean))].sort((a, b) => b - a), [records]);
  const months  = useMemo(() => [...new Set(records.map(r => r.month).filter(Boolean))].sort((a, b) => monthIndex(a) - monthIndex(b)), [records]);

  // Extract unique accountants
  const uniqueAccountants = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      const empNum = r.reportingAccountant?.empNumber || r.number;
      if (!empNum) return;
      const name = r.reportingAccountant?.name || 'Unknown Accountant';
      const email = r.reportingAccountant?.email || '—';
      const key = String(empNum).trim();
      if (!map.has(key)) {
        map.set(key, { empNumber: key, name, email, region: r.region });
      }
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // Filtered records
  const filtered = useMemo(() => {
    let data = records;
    if (filterRegion) data = data.filter(r => r.region === filterRegion);
    if (filterYear)   data = data.filter(r => String(r.year) === filterYear);
    if (filterMonth)  data = data.filter(r => r.month === filterMonth);
    if (filterAccountant) {
      data = data.filter(r => {
        const empNum = r.reportingAccountant?.empNumber || r.number;
        return empNum && String(empNum).trim() === String(filterAccountant).trim();
      });
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(r =>
        [r.region, r.pcfRef, r.costCenterName, String(r.number ?? ''), String(r.year), r.month, r.reportingAccountant?.name]
          .some(v => v && String(v).toLowerCase().includes(q))
      );
    }
    return data;
  }, [records, filterRegion, filterYear, filterMonth, filterAccountant, search]);

  // Stats derived from FILTERED records
  const stats = useMemo(() => {
    const assigned = filtered.length;
    const completed = filtered.filter(r => isReconciled(r.checkedStatus)).length;
    const pending = assigned - completed;
    const pct = assigned ? Math.round((completed / assigned) * 100) : 0;

    const activeAccs = new Set(filtered.map(r => r.reportingAccountant?.empNumber || r.number).filter(Boolean)).size;
    const activeRegs = new Set(filtered.map(r => r.region).filter(Boolean)).size;

    return {
      assigned,
      completed,
      pending,
      pct,
      activeAccs,
      activeRegs,
    };
  }, [filtered]);

  // Sorted records for Table view
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av = a[sortConfig.key] ?? '';
      let bv = b[sortConfig.key] ?? '';
      if (sortConfig.key === 'year' || sortConfig.key === 'number') { av = Number(av); bv = Number(bv); }
      else if (sortConfig.key === 'month') { av = monthIndex(av); bv = monthIndex(bv); }
      else if (sortConfig.key === 'reportingAccountantName') {
        av = a.reportingAccountant?.name || '';
        bv = b.reportingAccountant?.name || '';
      }
      else { av = String(av).toLowerCase(); bv = String(bv).toLowerCase(); }
      if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1;
      if (av > bv) return sortConfig.dir === 'asc' ?  1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated  = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Time-series and Region grouping for charts
  const monthlyData = useMemo(() => {
    const groups = {};
    filtered.forEach(r => {
      const key = `${r.year} ${r.month}`;
      if (!groups[key]) {
        groups[key] = { name: key, year: r.year, month: r.month, Assigned: 0, Completed: 0 };
      }
      groups[key].Assigned += 1;
      if (isReconciled(r.checkedStatus)) {
        groups[key].Completed += 1;
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      'Completion Rate': g.Assigned ? Math.round((g.Completed / g.Assigned) * 100) : 0
    })).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return monthIndex(a.month) - monthIndex(b.month);
    });
  }, [filtered]);

  const regionData = useMemo(() => {
    const groups = {};
    filtered.forEach(r => {
      const key = r.region || 'No Region';
      if (!groups[key]) {
        groups[key] = { region: key, Assigned: 0, Completed: 0 };
      }
      groups[key].Assigned += 1;
      if (isReconciled(r.checkedStatus)) {
        groups[key].Completed += 1;
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      'Completion Rate': g.Assigned ? Math.round((g.Completed / g.Assigned) * 100) : 0
    })).sort((a, b) => b.Completed - a.Completed);
  }, [filtered]);

  // Performance Insights calculations
  const insights = useMemo(() => {
    if (!filtered.length) return null;

    // Group by Accountant
    const accMap = {};
    filtered.forEach(r => {
      const empNum = r.reportingAccountant?.empNumber || r.number;
      if (!empNum) return;
      const name = r.reportingAccountant?.name || `Accountant ${empNum}`;
      if (!accMap[empNum]) {
        accMap[empNum] = { name, assigned: 0, completed: 0 };
      }
      accMap[empNum].assigned += 1;
      if (isReconciled(r.checkedStatus)) {
        accMap[empNum].completed += 1;
      }
    });

    const accList = Object.values(accMap).map(a => ({
      ...a,
      rate: a.assigned ? (a.completed / a.assigned) * 100 : 0
    }));

    let bestAcc = '—';
    let worstAcc = '—';
    if (accList.length > 0) {
      const sortedBest = [...accList].sort((a, b) => b.rate - a.rate || b.completed - a.completed);
      bestAcc = `${sortedBest[0].name} (${Math.round(sortedBest[0].rate)}% completed)`;

      const sortedWorst = [...accList].sort((a, b) => a.rate - b.rate || a.completed - b.completed);
      worstAcc = `${sortedWorst[0].name} (${Math.round(sortedWorst[0].rate)}% completed)`;
    }

    // Group by Region
    const regList = regionData.map(r => ({
      name: r.region,
      rate: r['Completion Rate'],
      completed: r.Completed
    }));

    let bestReg = '—';
    let worstReg = '—';
    if (regList.length > 0) {
      const sortedBestReg = [...regList].sort((a, b) => b.rate - a.rate || b.completed - a.completed);
      bestReg = `${sortedBestReg[0].name} (${Math.round(sortedBestReg[0].rate)}%)`;

      const sortedWorstReg = [...regList].sort((a, b) => a.rate - b.rate || a.completed - b.completed);
      worstReg = `${sortedWorstReg[0].name} (${Math.round(sortedWorstReg[0].rate)}%)`;
    }

    // Group by Month-Year for most active
    let mostActiveMonth = '—';
    if (monthlyData.length > 0) {
      const sortedMonths = [...monthlyData].sort((a, b) => b.Assigned - a.Assigned);
      mostActiveMonth = `${sortedMonths[0].name} (${sortedMonths[0].Assigned} Assigned)`;
    }

    // Growth calculations
    let growthPeriod = '—';
    let maxGrowth = -Infinity;
    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData[i-1];
      const curr = monthlyData[i];
      const diff = curr['Completion Rate'] - prev['Completion Rate'];
      if (diff > maxGrowth) {
        maxGrowth = diff;
        growthPeriod = `${prev.name} → ${curr.name} (+${Math.round(diff)}% Completion)`;
      }
    }

    return {
      bestAcc,
      worstAcc,
      bestReg,
      worstReg,
      mostActiveMonth,
      growthPeriod: maxGrowth > 0 ? growthPeriod : 'Steady progress'
    };
  }, [filtered, monthlyData, regionData]);

  // Selected Accountant Details
  const selectedAccountantDetails = useMemo(() => {
    if (!selectedAccountantKey) return null;
    const accRecords = records.filter(r => {
      const empNum = r.reportingAccountant?.empNumber || r.number;
      return empNum && String(empNum).trim() === String(selectedAccountantKey).trim();
    });

    if (accRecords.length === 0) return null;

    const first = accRecords[0];
    const name = first.reportingAccountant?.name || 'Unknown Accountant';
    const email = first.reportingAccountant?.email || '—';
    const empNumber = selectedAccountantKey;

    const assigned = accRecords.length;
    const completed = accRecords.filter(r => isReconciled(r.checkedStatus)).length;
    const pending = assigned - completed;
    const pct = assigned ? Math.round((completed / assigned) * 100) : 0;

    const pendingCostCenters = accRecords.filter(r => !isReconciled(r.checkedStatus));

    // History grouped by month/year
    const history = accRecords.map(r => ({
      year: r.year,
      month: r.month,
      pcfRef: r.pcfRef,
      costCenterName: r.costCenterName,
      region: r.region,
      status: isReconciled(r.checkedStatus) ? 'Completed' : 'Pending',
      checkedStatus: r.checkedStatus
    })).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return monthIndex(b.month) - monthIndex(a.month);
    });

    return {
      name,
      email,
      empNumber,
      region: first.region || '—',
      assigned,
      completed,
      pending,
      pct,
      pendingCostCenters,
      history
    };
  }, [selectedAccountantKey, records]);

  const handleSort = (key) => {
    setSortConfig(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setCurrentPage(1);
  };

  const onFilter = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterRegion('');
    setFilterYear('');
    setFilterMonth('');
    setFilterAccountant('');
    setSearch('');
    setCurrentPage(1);
  };

  const hasActiveFilters = filterRegion || filterYear || filterMonth || filterAccountant || search.trim();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-indigo-100 border-t-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Loading records…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
            <FileSpreadsheet className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Department Lead Analytics</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Accountant Performance Dashboard</h2>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 gap-1">
            {[
              { id: 'overview', label: 'Overview & Charts' },
              { id: 'regions', label: 'Region Analytics' },
              { id: 'table', label: 'All Records Table' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={onFilter(setSearch)}
              placeholder="Search region, cost center, PCF, accountant…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select value={filterRegion} onChange={onFilter(setFilterRegion)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer">
              <option value="">All Regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select value={filterYear} onChange={onFilter(setFilterYear)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer">
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select value={filterMonth} onChange={onFilter(setFilterMonth)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer">
              <option value="">All Months</option>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <select value={filterAccountant} onChange={onFilter(setFilterAccountant)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition cursor-pointer">
              <option value="">All Accountants</option>
              {uniqueAccountants.map(a => <option key={a.empNumber} value={a.empNumber}>{a.name}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}

          <span className="ml-auto text-xs font-bold text-slate-400">
            {filtered.length.toLocaleString()} record{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Executive KPI Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={FileSpreadsheet} label="Assigned Centers" value={stats.assigned} accent="#4f46e5" tint="bg-indigo-50 text-indigo-600 ring-indigo-100" />
        <StatCard icon={UserCheck} label="Completed" value={stats.completed} accent="#10b981" tint="bg-emerald-50 text-emerald-600 ring-emerald-100" />
        <StatCard icon={Clock} label="Pending Work" value={stats.pending} accent="#f59e0b" tint="bg-amber-50 text-amber-600 ring-amber-100" />
        <StatCard icon={Percent} label="Completion %" value={`${stats.pct}%`} accent="#06b6d4" tint="bg-cyan-50 text-cyan-600 ring-cyan-100" />
        <StatCard icon={Users} label="Total Accountants" value={stats.activeAccs} accent="#a855f7" tint="bg-purple-50 text-purple-600 ring-purple-100" />
        <StatCard icon={MapPin} label="Active Regions" value={stats.activeRegs} accent="#0d9488" tint="bg-teal-50 text-teal-600 ring-teal-100" />
      </div>

      {/* Accountant Detail View Overlay Modal */}
      {selectedAccountantDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-sm shadow-md">
                  {selectedAccountantDetails.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedAccountantDetails.name}</h3>
                  <p className="text-xs font-semibold text-slate-500">Employee ID: {selectedAccountantDetails.empNumber} • {selectedAccountantDetails.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccountantKey(null)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Accountant KPIs */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Assigned</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{selectedAccountantDetails.assigned}</p>
                </div>
                <div className="rounded-xl bg-emerald-50/50 px-4 py-3 border border-emerald-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">Completed</p>
                  <p className="mt-1 text-xl font-black text-emerald-900">{selectedAccountantDetails.completed}</p>
                </div>
                <div className="rounded-xl bg-amber-50/50 px-4 py-3 border border-amber-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">Pending</p>
                  <p className="mt-1 text-xl font-black text-amber-900">{selectedAccountantDetails.pending}</p>
                </div>
                <div className="rounded-xl bg-indigo-50/50 px-4 py-3 border border-indigo-100">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Completion %</p>
                  <p className="mt-1 text-xl font-black text-indigo-900">{selectedAccountantDetails.pct}%</p>
                </div>
              </div>

              {/* Pending Cost Centers List */}
              {selectedAccountantDetails.pendingCostCenters.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-700 mb-3">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Action Required: Pending Cost Centers ({selectedAccountantDetails.pendingCostCenters.length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedAccountantDetails.pendingCostCenters.map((cc, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg bg-white border border-amber-100 px-3.5 py-2 text-xs shadow-sm">
                        <div>
                          <p className="font-bold text-slate-800">{cc.costCenterName}</p>
                          <p className="text-[10px] font-semibold text-slate-400">{cc.pcfRef} • {cc.region}</p>
                        </div>
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100">
                          {cc.month} {cc.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historical Progress Timeline */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Assigned History & Timeline</h4>
                <div className="rounded-xl border border-slate-150 bg-white overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Period</th>
                          <th className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">PCF Ref</th>
                          <th className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Cost Center</th>
                          <th className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Region</th>
                          <th className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedAccountantDetails.history.map((h, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-semibold text-slate-700">{h.month} {h.year}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-900">{h.pcfRef}</td>
                            <td className="px-4 py-2.5 text-slate-600 max-w-[200px] truncate">{h.costCenterName}</td>
                            <td className="px-4 py-2.5 text-slate-500">{h.region}</td>
                            <td className="px-4 py-2.5">
                              {h.status === 'Completed' ? (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                  Reconciled
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  Pending
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedAccountantKey(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: OVERVIEW & CHARTS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Insights & Quick Stats */}
          {insights && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Performance Insights Panel</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Award className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Best Performing Accountant</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.bestAcc}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><AlertCircle className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Lowest Performing Accountant</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.worstAcc}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><MapPin className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Best Performing Region</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.bestReg}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600"><TrendingDown className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Lowest Performing Region</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.worstReg}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600"><Activity className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Most Active Month</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.mostActiveMonth}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Highest Growth Period</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800 truncate">{insights.growthPeriod}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Chart 1: Monthly Progress Line Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Monthly Progress</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">Assigned vs Completed cost centers chronologically</p>
              <div className="h-[260px] w-full">
                {monthlyData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data available</div>
                ) : (
                  <ResponsiveContainer>
                    <LineChart data={monthlyData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="Assigned" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: Region Performance Bar Chart */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Region Performance</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">Total completed cost centers by region</p>
              <div className="h-[260px] w-full">
                {regionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data available</div>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={regionData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="Completed" fill="#10b981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 3: Completion Percentage Trend */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Completion Trend</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">Reconciliation rate (%) trend over time</p>
              <div className="h-[260px] w-full">
                {monthlyData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data available</div>
                ) : (
                  <ResponsiveContainer>
                    <AreaChart data={monthlyData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Completion Rate']} />
                      <Area type="monotone" dataKey="Completion Rate" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Assigned vs Completed Comparison */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Workload Comparison</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">Assigned vs Completed side-by-side by region</p>
              <div className="h-[260px] w-full">
                {regionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No chart data available</div>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={regionData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="region" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Assigned" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: REGION ANALYTICS */}
      {activeTab === 'regions' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-4">Region Performance Rankings</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {regionData.map((reg, idx) => {
                let badgeColor = 'bg-slate-100 text-slate-700';
                if (idx === 0) badgeColor = 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                else if (idx === regionData.length - 1) badgeColor = 'bg-rose-100 text-rose-700 border border-rose-200';

                return (
                  <div key={reg.region} className="rounded-xl border border-slate-150 bg-slate-50/60 p-4 relative overflow-hidden shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold ${badgeColor}`}>
                          Rank #{idx + 1}
                        </span>
                        <h4 className="mt-1.5 text-sm font-black text-slate-900">{reg.region}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-indigo-600">{reg['Completion Rate']}%</p>
                        <p className="text-[10px] font-semibold text-slate-400">Completion</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 space-y-1">
                      <div className="h-2 w-full rounded-full bg-slate-200">
                        <div
                          className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${reg['Completion Rate']}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>{reg.Completed} Completed</span>
                        <span>{reg.Assigned} Assigned</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TABLE & DETAIL TRIGGER */}
      {activeTab === 'table' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Users className="h-4 w-4 text-white" strokeWidth={1.8} />
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Record List</p>
            </div>
            <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          {records.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <FileSpreadsheet className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="text-base font-bold text-slate-700">No records found</p>
              <p className="text-sm text-slate-400">Import a petty cash Excel file to populate this page.</p>
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
                      { key: 'region',         label: 'Region' },
                      { key: 'pcfRef',         label: 'PCF Ref' },
                      { key: 'costCenterName', label: 'Cost Center Name' },
                      { key: 'reportingAccountantName', label: 'Reporting Accountant' },
                      { key: 'year',           label: 'Year' },
                      { key: 'month',          label: 'Month' },
                      { key: 'checkedStatus',  label: 'Status' },
                    ].map(({ key, label }) => (
                      <th key={key} onClick={() => handleSort(key)}
                        className="px-5 py-3 border-b border-slate-100 cursor-pointer select-none">
                        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                          {label}
                          <SortIcon column={key} sortConfig={sortConfig} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginated.map((r, i) => {
                    const empNum = r.reportingAccountant?.empNumber || r.number;
                    return (
                      <tr key={r._id || i} className="hover:bg-indigo-50/40 transition-colors duration-100">
                        <td className="px-5 py-3.5">
                          <span className="inline-flex h-6 items-center rounded-full bg-indigo-100 px-2.5 text-[11px] font-bold text-indigo-700">
                            {r.region || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">{r.pcfRef || '—'}</td>
                        <td className="px-5 py-3.5 text-slate-600 max-w-[260px] truncate">{r.costCenterName || '—'}</td>
                        <td className="px-5 py-3.5">
                          {empNum ? (
                            <button
                              onClick={() => setSelectedAccountantKey(empNum)}
                              className="text-left font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 group/btn"
                            >
                              <span>{r.reportingAccountant?.name || `Accountant ${empNum}`}</span>
                              <ArrowRight className="h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            {r.year || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                            {r.month || '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {isReconciled(r.checkedStatus) ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                              Reconciled
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
              <p className="text-xs font-semibold text-slate-400">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, sorted.length)} of {sorted.length.toLocaleString()}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  ← Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let page;
                  if (totalPages <= 5)              page = idx + 1;
                  else if (currentPage <= 3)        page = idx + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + idx;
                  else                              page = currentPage - 2 + idx;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                        currentPage === page
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
