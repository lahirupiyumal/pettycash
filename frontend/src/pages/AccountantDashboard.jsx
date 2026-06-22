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
  X
} from 'lucide-react';

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
        // GET /api/records will automatically apply backend filtering based on req.user.serviceNumber
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
      // Search by PCF Ref
      if (searchPcfRef && !String(r.pcfRef || '').toLowerCase().includes(searchPcfRef.toLowerCase())) {
        return false;
      }
      // Search by Employee Name (payingOfficer.name)
      const employeeName = r.payingOfficer?.name || '';
      if (searchEmployeeName && !employeeName.toLowerCase().includes(searchEmployeeName.toLowerCase())) {
        return false;
      }
      // Search by Cost Center (costCenterName)
      if (searchCostCenter && !String(r.costCenterName || '').toLowerCase().includes(searchCostCenter.toLowerCase())) {
        return false;
      }
      // Filter by Region
      if (filterRegion && r.region !== filterRegion) {
        return false;
      }
      // Filter by Date of Reconciliation (checkedStatus)
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

        // Handle nested fields
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

  // Request sort helper
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

  // Helper to check if reconciliation is completed
  const isReconciliationCompleted = (checkedStatus) => {
    if (!checkedStatus) return false;
    const status = String(checkedStatus).trim().toLowerCase();
    // Common indicator for completed reconciliations
    return ['completed', 'checked', 'reconciled', 'yes', 'done'].includes(status) || 
           (/\d{4}-\d{2}-\d{2}/.test(status)) || // If it has a date format
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

    return {
      totalPCFs,
      uniqueCostCenters,
      uniqueEmployees,
      completed,
      upcoming,
    };
  }, [records]);

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
        <button
          onClick={() => setLocalRefresh(p => p + 1)}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 transition px-4 py-2 text-sm font-bold text-white border border-white/15 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
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

      {/* Main Grid: Statistics & Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card Section */}
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">My Profile</h3>
                <p className="text-xs text-slate-500">Authenticated Session</p>
              </div>
            </div>
            
            <div className="mt-5 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accountant Name</p>
                  <p className="text-sm font-bold text-slate-800">{user?.name || 'Reporting Accountant'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-bold text-slate-800 break-all">{user?.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileSpreadsheet className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service ID (Emp Number2)</p>
                  <p className="text-sm font-bold text-slate-800 font-mono">{user?.serviceNumber || '—'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Record Count</p>
                  <p className="text-sm font-bold text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded inline-block mt-0.5">
                    {metrics.totalPCFs} records
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Note:</strong> Financial fields (Float, Cash in Hand, Expenses, Variance) are restricted and hidden to comply with Accountant Dashboard scope guidelines.
            </p>
          </div>
        </div>

        {/* Summary Cards Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between min-h-[140px] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Total PCFs</span>
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{metrics.totalPCFs}</p>
              <p className="text-xs text-slate-500 mt-1">Assigned PCF Refs</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between min-h-[140px] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Cost Centers</span>
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{metrics.uniqueCostCenters}</p>
              <p className="text-xs text-slate-500 mt-1">Assigned Cost Centers</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-5 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between min-h-[140px] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-500">Employees</span>
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{metrics.uniqueEmployees}</p>
              <p className="text-xs text-slate-500 mt-1">Assigned Paying Officers</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between min-h-[140px] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Completed</span>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{metrics.completed}</p>
              <p className="text-xs text-slate-500 mt-1">Reconciled Records</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 shadow-sm ring-1 ring-slate-200/50 flex flex-col justify-between min-h-[140px] hover:shadow-md transition">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Upcoming</span>
              <CalendarCheck className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-900 tabular-nums">{metrics.upcoming}</p>
              <p className="text-xs text-slate-500 mt-1">Pending Reconciliation</p>
            </div>
          </div>
        </div>
      </div>

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
