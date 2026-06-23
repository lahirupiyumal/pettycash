import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Search,
  User,
  Mail,
  Shield,
  FileSpreadsheet,
  Building2,
  Users,
  CalendarCheck,
  AlertCircle,
  RefreshCw,
  Filter,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  TrendingUp,
  Award,
  Activity,
  MapPin,
  Clock,
  LayoutDashboard
} from 'lucide-react';
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
  Legend
} from 'recharts';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function monthIndex(m) {
  return MONTHS.indexOf(m);
}

// Unified StatCard matching the Department Lead style
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

export default function AccountantDashboard({ refreshTrigger = 0 }) {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Search & Filter state
  const [searchPcfRef, setSearchPcfRef] = useState('');
  const [searchEmployeeName, setSearchEmployeeName] = useState('');
  const [searchCostCenter, setSearchCostCenter] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterReconciliation, setFilterReconciliation] = useState('');

  // Analytics section toggle
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'pcfRef', direction: 'asc' });

  // Fetch records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/records');
        setRecords(res.data || []);
      } catch (err) {
        console.error('Error fetching accountant records:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load records.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [refreshTrigger, localRefresh]);

  // Derived filters option
  const regions = useMemo(() => {
    const uniqueRegions = new Set(records.map((r) => r.region).filter(Boolean));
    return [...uniqueRegions].sort();
  }, [records]);

  const reconciliationDates = useMemo(() => {
    const uniqueDates = new Set(records.map((r) => r.checkedStatus).filter(Boolean));
    return [...uniqueDates].sort();
  }, [records]);

  // Filter & Search Logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (searchPcfRef && !String(r.pcfRef || '').toLowerCase().includes(searchPcfRef.toLowerCase())) {
        return false;
      }
      const employeeName = r.payingOfficer?.name || '';
      if (searchEmployeeName && !employeeName.toLowerCase().includes(searchEmployeeName.toLowerCase())) {
        return false;
      }
      if (searchCostCenter && !String(r.costCenterName || '').toLowerCase().includes(searchCostCenter.toLowerCase())) {
        return false;
      }
      if (filterRegion && r.region !== filterRegion) {
        return false;
      }
      if (filterReconciliation && r.checkedStatus !== filterReconciliation) {
        return false;
      }
      return true;
    });
  }, [records, searchPcfRef, searchEmployeeName, searchCostCenter, filterRegion, filterReconciliation]);

  // Sorting Logic
  const sortedRecords = useMemo(() => {
    const sortableItems = [...filteredRecords];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        let aVal = '';
        let bVal = '';

        if (sortConfig.key === 'email') {
          aVal = a.payingOfficer?.email || '';
          bVal = b.payingOfficer?.email || '';
        } else if (sortConfig.key === 'supervisingOfficerName') {
          aVal = a.supervisingOfficer?.name || '';
          bVal = b.supervisingOfficer?.name || '';
        } else if (sortConfig.key === 'email3') {
          aVal = a.supervisingOfficer?.email || '';
          bVal = b.supervisingOfficer?.email || '';
        } else if (sortConfig.key === 'empNumber3') {
          aVal = a.supervisingOfficer?.empNumber || 0;
          bVal = b.supervisingOfficer?.empNumber || 0;
        } else if (sortConfig.key === 'reportingAccountantName') {
          aVal = a.reportingAccountant?.name || '';
          bVal = b.reportingAccountant?.name || '';
        } else if (sortConfig.key === 'email2') {
          aVal = a.reportingAccountant?.email || '';
          bVal = b.reportingAccountant?.email || '';
        } else if (sortConfig.key === 'empNumber2') {
          aVal = a.reportingAccountant?.empNumber || 0;
          bVal = b.reportingAccountant?.empNumber || 0;
        } else if (sortConfig.key === 'employeeName') {
          aVal = a.payingOfficer?.name || '';
          bVal = b.payingOfficer?.name || '';
        } else if (sortConfig.key === 'employeeId') {
          aVal = a.payingOfficer?.empNumber || 0;
          bVal = b.payingOfficer?.empNumber || 0;
        } else if (sortConfig.key === 'dateOfReconciliation') {
          aVal = a.checkedStatus || '';
          bVal = b.checkedStatus || '';
        } else {
          aVal = a[sortConfig.key] || '';
          bVal = b[sortConfig.key] || '';
        }

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else {
          return sortConfig.direction === 'asc'
            ? aVal - bVal
            : bVal - aVal;
        }
      });
    }
    return sortableItems;
  }, [filteredRecords, sortConfig]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(sortedRecords.length / ITEMS_PER_PAGE));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedRecords.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedRecords, currentPage]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronDown className="ml-1 h-3 w-3 opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="ml-1 h-3.5 w-3.5 text-indigo-600" />
      : <ChevronDown className="ml-1 h-3.5 w-3.5 text-indigo-600" />;
  };

  const isReconciliationCompleted = (checkedStatus) => {
    if (!checkedStatus) return false;
    const status = String(checkedStatus).trim().toLowerCase();
    return ['completed', 'checked', 'reconciled', 'yes', 'done'].includes(status) || 
           (/\d{4}-\d{2}-\d{2}/.test(status)) || 
           (/\d{1,2}\/\d{1,2}\/\d{4}/.test(status));
  };

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const totalPCFs = records.length;
    const uniqueCostCenters = new Set(records.map((r) => r.costCenterName).filter(Boolean)).size;
    const uniqueEmployees = new Set(records.map((r) => r.payingOfficer?.empNumber).filter(Boolean)).size;

    let completed = 0;
    let upcoming = 0;

    records.forEach((r) => {
      if (isReconciliationCompleted(r.checkedStatus)) {
        completed += 1;
      } else {
        upcoming += 1;
      }
    });

    const pct = totalPCFs ? Math.round((completed / totalPCFs) * 100) : 0;

    return {
      totalPCFs,
      uniqueCostCenters,
      uniqueEmployees,
      completed,
      upcoming,
      pct,
    };
  }, [records]);

  // Accountant-specific Monthly and Regional progress calculations for Recharts
  const monthlyData = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      const key = `${r.year} ${r.month}`;
      if (!groups[key]) {
        groups[key] = { name: key, year: r.year, month: r.month, Assigned: 0, Completed: 0 };
      }
      groups[key].Assigned += 1;
      if (isReconciliationCompleted(r.checkedStatus)) {
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
  }, [filteredRecords]);

  const regionData = useMemo(() => {
    const groups = {};
    filteredRecords.forEach(r => {
      const key = r.region || 'No Region';
      if (!groups[key]) {
        groups[key] = { region: key, Assigned: 0, Completed: 0 };
      }
      groups[key].Assigned += 1;
      if (isReconciliationCompleted(r.checkedStatus)) {
        groups[key].Completed += 1;
      }
    });

    return Object.values(groups).map(g => ({
      ...g,
      'Completion Rate': g.Assigned ? Math.round((g.Completed / g.Assigned) * 100) : 0
    })).sort((a, b) => b.Completed - a.Completed);
  }, [filteredRecords]);

  // Automated Accountant Performance Insights
  const personalInsights = useMemo(() => {
    if (records.length === 0) return null;

    // Primary Region
    const regionCounts = {};
    records.forEach(r => {
      if (r.region) regionCounts[r.region] = (regionCounts[r.region] || 0) + 1;
    });
    const sortedRegions = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
    const primaryRegion = sortedRegions[0] ? `${sortedRegions[0][0]} (${sortedRegions[0][1]} PCFs)` : '—';

    // Most productive period
    const monthCounts = {};
    records.forEach(r => {
      if (isReconciliationCompleted(r.checkedStatus)) {
        const key = `${r.month} ${r.year}`;
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      }
    });
    const sortedMonths = Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
    const topMonth = sortedMonths[0] ? `${sortedMonths[0][0]} (${sortedMonths[0][1]} Reconciled)` : '—';

    return {
      primaryRegion,
      topMonth,
      completionRate: `${metrics.pct}%`
    };
  }, [records, metrics.pct]);

  const clearFilters = () => {
    setSearchPcfRef('');
    setSearchEmployeeName('');
    setSearchCostCenter('');
    setFilterRegion('');
    setFilterReconciliation('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchPcfRef || searchEmployeeName || searchCostCenter || filterRegion || filterReconciliation;

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white shadow-xl">
        <div>
          <p className="text-xs font-semibold tracking-widest text-indigo-300 uppercase">Accountant Portal</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-black tracking-tight text-white">Accountant Dashboard</h1>
          <p className="mt-1 text-sm text-slate-300">
            Assigned Petty Cash Float records filtered securely by your Service ID.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 transition px-4 py-2 text-sm font-bold text-white border border-white/15 cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4" />
            {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
          <button
            onClick={() => setLocalRefresh(p => p + 1)}
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 transition px-4 py-2 text-sm font-bold text-white border border-white/15 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm animate-pulse">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <span className="font-bold">Error: </span>
            {error}
          </div>
        </div>
      )}

      {/* Main Grid: Statistics Summary Cards spanning full width */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={FileSpreadsheet}
          label="Total PCFs"
          value={metrics.totalPCFs}
          subtext="Assigned PCF Refs"
          accent="#4f46e5"
          tint="bg-indigo-50 text-indigo-600 ring-indigo-100"
        />
        <StatCard
          icon={Building2}
          label="Cost Centers"
          value={metrics.uniqueCostCenters}
          subtext="Assigned Cost Centers"
          accent="#7c3aed"
          tint="bg-violet-50 text-violet-600 ring-violet-100"
        />
        <StatCard
          icon={Users}
          label="Employees"
          value={metrics.uniqueEmployees}
          subtext="Assigned Paying Officers"
          accent="#06b6d4"
          tint="bg-cyan-50 text-cyan-600 ring-cyan-100"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={metrics.completed}
          subtext="Reconciled Records"
          accent="#10b981"
          tint="bg-emerald-50 text-emerald-600 ring-emerald-100"
        />
        <StatCard
          icon={CalendarCheck}
          label="Upcoming"
          value={metrics.upcoming}
          subtext="Pending Reconciliation"
          accent="#f59e0b"
          tint="bg-amber-50 text-amber-600 ring-amber-100"
        />
      </div>

      {/* EXTENSION: Accountant Progress Analytics Section */}
      {showAnalytics && records.length > 0 && (
        <div className="space-y-6">
          {/* Insights Panel */}
          {personalInsights && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 border-b border-slate-100 pb-3">
                <Award className="h-5 w-5 text-indigo-600" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">My Reconciliation Performance Insights</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><MapPin className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Primary Active Region</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">{personalInsights.primaryRegion}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Most Productive Period</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">{personalInsights.topMonth}</p>
                  </div>
                </div>
                <div className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Completion Rate</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">{personalInsights.completionRate}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recharts Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Progress line chart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Monthly Completion Progress</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">My assigned vs. reconciled records over time</p>
              <div className="h-[240px] w-full">
                {monthlyData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No monthly data available</div>
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

            {/* Region Workload bar chart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-1">Region Workload & Completion</h3>
              <p className="text-xs font-semibold text-slate-400 mb-4">Assigned vs. reconciled records across regions</p>
              <div className="h-[240px] w-full">
                {regionData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 text-xs">No region data available</div>
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

      {/* Filter Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
          <Filter className="h-4.5 w-4.5 text-slate-500" />
          <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">Search & Filters</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search PCF Ref..."
              value={searchPcfRef}
              onChange={(e) => { setSearchPcfRef(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Employee..."
              value={searchEmployeeName}
              onChange={(e) => { setSearchEmployeeName(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Cost Center..."
              value={searchCostCenter}
              onChange={(e) => { setSearchCostCenter(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div>
            <select
              value={filterRegion}
              onChange={(e) => { setFilterRegion(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filterReconciliation}
              onChange={(e) => { setFilterReconciliation(e.target.value); setCurrentPage(1); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="">All Reconciliations</option>
              {reconciliationDates.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-xs font-semibold text-slate-400">
              Found {filteredRecords.length} matching record{filteredRecords.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
            >
              <X className="h-3.5 w-3.5" />
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* PCF Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
              <FileSpreadsheet className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">My Assigned PCFs</p>
          </div>
          <span className="rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-indigo-100 border-t-indigo-600" />
            <p className="text-sm font-semibold text-slate-400">Fetching assigned records...</p>
          </div>
        ) : sortedRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
              <FileSpreadsheet className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
            </div>
            <p className="text-base font-bold text-slate-700">No records found</p>
            <p className="text-sm text-slate-400 mt-1">There are no records matching your current filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr>
                  {[
                    { key: 'region', label: 'Region' },
                    { key: 'pcfRef', label: 'PCF Ref' },
                    { key: 'costCenterName', label: 'Cost Center' },
                    { key: 'number', label: 'Number' },
                    { key: 'email', label: 'Email' },
                    { key: 'supervisingOfficerName', label: 'Supervising Officers Name' },
                    { key: 'email3', label: 'Email3' },
                    { key: 'empNumber3', label: 'Emp Number3' },
                    { key: 'reportingAccountantName', label: 'Reporting Accountants Name' },
                    { key: 'email2', label: 'Email2' },
                    { key: 'empNumber2', label: 'Emp Number2' },
                    { key: 'employeeName', label: 'Employee Name' },
                    { key: 'employeeId', label: 'Employee ID' },
                    { key: 'dateOfReconciliation', label: 'Date of Reconciliation' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => requestSort(key)}
                      className="px-5 py-3 border-b border-slate-100 cursor-pointer select-none"
                    >
                      <div className="flex items-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
                        {label}
                        <SortIndicator column={key} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRecords.map((r, i) => (
                  <tr key={r._id || i} className="hover:bg-slate-50/70 transition-colors duration-100">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex h-6 items-center rounded-full bg-slate-100 px-2.5 text-[11px] font-bold text-slate-700">
                        {r.region || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{r.pcfRef || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-700">{r.costCenterName || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.number || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{r.payingOfficer?.email || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{r.supervisingOfficer?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{r.supervisingOfficer?.email || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.supervisingOfficer?.empNumber || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{r.reportingAccountant?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">{r.reportingAccountant?.email || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.reportingAccountant?.empNumber || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{r.payingOfficer?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-xs">{r.payingOfficer?.empNumber || '—'}</td>
                    <td className="px-5 py-3.5">
                      {isReconciliationCompleted(r.checkedStatus) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          {r.checkedStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                          {r.checkedStatus || 'Pending'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/30">
            <p className="text-xs font-semibold text-slate-400">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, sortedRecords.length)} of {sortedRecords.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                    currentPage === idx + 1
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
