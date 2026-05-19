import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  LineChart as LineChartIcon,
  ListChecks,
  Search,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api from '../api/axios';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_LOOKUP = {
  jan: 'January', january: 'January', feb: 'February', february: 'February', mar: 'March', march: 'March', apr: 'April', april: 'April',
  may: 'May', jun: 'June', june: 'June', jul: 'July', july: 'July', aug: 'August', august: 'August', sep: 'September', sept: 'September', september: 'September',
  oct: 'October', october: 'October', nov: 'November', november: 'November', dec: 'December', december: 'December',
};

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#dc2626', '#d97706', '#0891b2', '#db2777', '#4f46e5', '#16a34a', '#ea580c'];

function normalizeMonth(month) {
  const value = String(month || '').trim();
  const normalized = MONTH_LOOKUP[value.toLowerCase()];
  return normalized || value;
}

function monthIndex(month) {
  return MONTHS.indexOf(normalizeMonth(month));
}

function parseLabel(label) {
  const text = String(label || '').trim();
  if (!text) {
    return { accountantName: 'Unknown', regionCode: 'Unknown' };
  }

  const parts = text.split(/\s*-\s*/);
  if (parts.length > 1) {
    return {
      regionCode: parts[0].trim() || 'Unknown',
      accountantName: parts.slice(1).join(' - ').trim() || parts[0].trim() || 'Unknown',
    };
  }

  return {
    regionCode: 'Unknown',
    accountantName: text,
  };
}

function parseCostCenterCode(code) {
  const text = String(code || '').trim();
  const match = text.match(/^(.*?)-?(\d+)$/);
  if (!match) {
    return null;
  }
  return {
    prefix: match[1] || text,
    number: Number(match[2]),
    padLength: match[2].length,
  };
}

function formatPercent(value) {
  return `${Math.round(value || 0)}%`;
}

function buildAssignedCodes(prefixMap) {
  const assigned = new Set();

  prefixMap.forEach((prefixInfo) => {
    if (prefixInfo.maxNumber > 0) {
      const padLength = Math.max(prefixInfo.padLength || 3, String(prefixInfo.maxNumber).length, 3);
      for (let number = 1; number <= prefixInfo.maxNumber; number += 1) {
        assigned.add(`${prefixInfo.prefix}-${String(number).padStart(padLength, '0')}`);
      }
      return;
    }

    prefixInfo.rawCodes.forEach((code) => assigned.add(code));
  });

  return assigned;
}

function getComparableDate(record) {
  const year = Number(record.year) || 0;
  const month = monthIndex(record.month);
  return { year, month };
}

function isEarlier(a, b) {
  if (!b) return true;
  if (a.year !== b.year) return a.year < b.year;
  return a.month < b.month;
}

function buildAccountantGroups(records) {
  const groups = new Map();

  records.forEach((record, index) => {
    const { accountantName, regionCode } = parseLabel(record.region);
    const groupKey = `${regionCode}__${accountantName}`;
    const code = String(record.pcfRef || '').trim();
    const codeMeta = parseCostCenterCode(code);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        accountantName,
        regionCode,
        records: [],
        firstCompletedByCode: new Map(),
        prefixMap: new Map(),
      });
    }

    const group = groups.get(groupKey);
    const normalizedRecord = {
      ...record,
      _index: index,
      accountantName,
      regionCode,
      monthName: normalizeMonth(record.month),
      monthNumber: monthIndex(record.month),
      yearNumber: Number(record.year) || null,
      code,
      codeMeta,
    };

    group.records.push(normalizedRecord);

    if (code) {
      const current = group.firstCompletedByCode.get(code);
      if (!current || isEarlier(getComparableDate(normalizedRecord), getComparableDate(current))) {
        group.firstCompletedByCode.set(code, normalizedRecord);
      }

      if (codeMeta) {
        const prefixInfo = group.prefixMap.get(codeMeta.prefix) || {
          prefix: codeMeta.prefix,
          maxNumber: 0,
          padLength: codeMeta.padLength,
          rawCodes: new Set(),
        };
        prefixInfo.maxNumber = Math.max(prefixInfo.maxNumber, codeMeta.number || 0);
        prefixInfo.padLength = Math.max(prefixInfo.padLength || 0, codeMeta.padLength || 0);
        prefixInfo.rawCodes.add(code);
        group.prefixMap.set(codeMeta.prefix, prefixInfo);
      } else {
        const prefixInfo = group.prefixMap.get(code) || {
          prefix: code,
          maxNumber: 0,
          padLength: 0,
          rawCodes: new Set(),
        };
        prefixInfo.rawCodes.add(code);
        group.prefixMap.set(code, prefixInfo);
      }
    }
  });

  return [...groups.values()].map((group) => {
    const assignedCodes = buildAssignedCodes(group.prefixMap);
    const completedCodes = new Set(group.firstCompletedByCode.keys());
    const pendingCodes = [...assignedCodes].filter((code) => !completedCodes.has(code));
    const completionPercent = assignedCodes.size ? (completedCodes.size / assignedCodes.size) * 100 : 0;

    const visits = [...group.firstCompletedByCode.values()].sort((a, b) => {
      if (a.yearNumber !== b.yearNumber) return a.yearNumber - b.yearNumber;
      return a.monthNumber - b.monthNumber;
    });

    return {
      ...group,
      assignedCodes,
      completedCodes,
      pendingCodes,
      assignedCount: assignedCodes.size,
      completedCount: completedCodes.size,
      remainingCount: Math.max(assignedCodes.size - completedCodes.size, 0),
      completionPercent,
      status: completionPercent > 80 ? 'green' : completionPercent >= 50 ? 'yellow' : 'red',
      visits,
    };
  });
}

function StatCard({ icon: Icon, title, value, tone }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${tone.bg}`}>
        <Icon className={`h-5 w-5 ${tone.fg}`} strokeWidth={1.9} />
      </div>
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-900 tabular-nums">{value}</p>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${styles[status] || styles.red}`}>{status.toUpperCase()}</span>;
}

function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) return <ChevronDown className="h-3 w-3 opacity-30" />;
  return sortConfig.dir === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-indigo-500" /> : <ChevronDown className="h-3.5 w-3.5 text-indigo-500" />;
}

function buildSeriesData(groups, selectedYear, scope) {
  const yearValue = Number(selectedYear);
  const relevantGroups = groups.filter((group) => {
    if (scope.region !== 'all' && group.regionCode !== scope.region) return false;
    if (scope.accountant !== 'all' && group.key !== scope.accountant) return false;
    return true;
  });

  return MONTHS.map((monthName, monthNumber) => {
    const row = { month: monthName };

    relevantGroups.forEach((group) => {
      const completedByMonth = [...group.firstCompletedByCode.values()].filter((visit) => {
        // Only include visits from the selected year and up to the current month
        if (!visit.yearNumber) return false;
        if (visit.yearNumber !== yearValue) return false;
        return visit.monthNumber <= monthNumber;
      }).length;

      row[group.key] = completedByMonth;
      row[`${group.key}Assigned`] = group.assignedCount;
      row[`${group.key}Remaining`] = Math.max(group.assignedCount - completedByMonth, 0);
      row[`${group.key}Percent`] = group.assignedCount ? (completedByMonth / group.assignedCount) * 100 : 0;
    });

    return row;
  });
}

function buildRegionStats(groups, selectedYear) {
  const yearValue = Number(selectedYear);
  const regionMap = new Map();

  groups.forEach((group) => {
    if (!regionMap.has(group.regionCode)) {
      regionMap.set(group.regionCode, {
        region: group.regionCode,
        assigned: 0,
        completed: 0,
        pending: 0,
        groups: [],
      });
    }

    const entry = regionMap.get(group.regionCode);
    const completedThisYear = [...group.firstCompletedByCode.values()].filter((visit) => visit.yearNumber === yearValue).length;
    entry.assigned += group.assignedCount;
    entry.completed += completedThisYear;
    entry.pending += Math.max(group.assignedCount - completedThisYear, 0);
    entry.groups.push(group);
  });

  return [...regionMap.values()].map((entry) => ({
    ...entry,
    completionPercent: entry.assigned ? (entry.completed / entry.assigned) * 100 : 0,
  }));
}

function buildInsights(groups, selectedYear) {
  if (!groups.length) return [];

  const yearValue = Number(selectedYear);
  const withProgress = groups.map((group) => {
    const completed = [...group.firstCompletedByCode.values()].filter((visit) => visit.yearNumber === yearValue).length;
    const percent = group.assignedCount ? (completed / group.assignedCount) * 100 : 0;
    return { ...group, completed, percent };
  });

  const bestAccountant = [...withProgress].sort((a, b) => b.percent - a.percent)[0];
  const lowestAccountant = [...withProgress].sort((a, b) => a.percent - b.percent)[0];

  const regionStats = buildRegionStats(groups, selectedYear).sort((a, b) => b.completionPercent - a.completionPercent);
  const bestRegion = regionStats[0];
  const lowestRegion = regionStats[regionStats.length - 1];

  const monthlyActivity = MONTHS.map((monthName, monthNumber) => {
    const count = withProgress.reduce((sum, group) => sum + [...group.firstCompletedByCode.values()].filter((visit) => visit.yearNumber === yearValue && visit.monthNumber === monthNumber).length, 0);
    return { month: monthName, count };
  }).sort((a, b) => b.count - a.count)[0];

  const fastestGrowth = withProgress
    .map((group) => {
      // build cumulative monthly series for the selected year only
      const monthSeries = MONTHS.map((_, monthNumber) => [...group.firstCompletedByCode.values()].filter((visit) => visit.yearNumber === yearValue && visit.monthNumber <= monthNumber).length);
      const delta = monthSeries.reduce((max, value, index) => {
        if (index === 0) return max;
        return Math.max(max, value - monthSeries[index - 1]);
      }, 0);
      return { ...group, delta };
    })
    .sort((a, b) => b.delta - a.delta)[0];

  return [
    { title: 'Best Performing Accountant', value: `${bestAccountant.accountantName} (${formatPercent(bestAccountant.percent)})`, type: 'success', icon: '🏆' },
    { title: 'Lowest Performing Accountant', value: `${lowestAccountant.accountantName} (${formatPercent(lowestAccountant.percent)})`, type: lowestAccountant.percent === 0 ? 'error' : 'warning', icon: '⚠️' },
    { title: 'Best Performing Region', value: `${bestRegion?.region || 'N/A'} (${formatPercent(bestRegion?.completionPercent)})`, type: 'success', icon: '📈' },
    { title: 'Lowest Performing Region', value: `${lowestRegion?.region || 'N/A'} (${formatPercent(lowestRegion?.completionPercent)})`, type: 'warning', icon: '📉' },
    { title: 'Most Active Month', value: monthlyActivity ? `${monthlyActivity.month} (${monthlyActivity.count})` : 'N/A', type: 'info', icon: '🗓️' },
    { title: 'Fastest Growth', value: fastestGrowth ? `${fastestGrowth.accountantName} (+${fastestGrowth.delta})` : 'N/A', type: 'success', icon: '🚀' },
  ];
}

function InsightCard({ insight }) {
  const styles = {
    success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    error: 'border-rose-200 bg-rose-50 text-rose-800',
    info: 'border-sky-200 bg-sky-50 text-sky-800',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[insight.type] || styles.info}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] opacity-70">
        <span>{insight.icon}</span>
        <span>{insight.title}</span>
      </div>
      <p className="mt-3 text-sm font-semibold leading-6">{insight.value}</p>
    </div>
  );
}

function AccountantTooltip({ active, payload, label, chartMode }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <div className="mt-2 space-y-1 text-sm text-slate-700">
        {payload.map((item) => (
          <p key={item.dataKey}>
            <span className="font-bold" style={{ color: item.color }}>{item.name}:</span>{' '}
            {chartMode === 'percent'
              ? `${Math.round(item.value)}%`
              : `${item.value} completed / ${item.payload?.[`${item.dataKey}Assigned`] || 0} assigned / ${item.payload?.[`${item.dataKey}Remaining`] || 0} pending`}
          </p>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ group, selectedYear }) {
  if (!group) return null;

  const scopeYear = Number(selectedYear);
  const scopeVisits = group.visits.filter((visit) => visit.yearNumber === scopeYear);
  const pendingCodes = group.pendingCodes;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Accountant Detail View</p>
            <h3 className="mt-1 text-2xl font-black text-slate-900">{group.accountantName}</h3>
            <p className="text-sm text-slate-500">Region code: {group.regionCode}</p>
          </div>
          <StatusPill status={group.status} />
        </div>
      </div>

      <div className="grid gap-4 border-b border-slate-100 px-6 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Target} title="Assigned" value={group.assignedCount.toLocaleString()} tone={{ bg: 'bg-indigo-50', fg: 'text-indigo-600' }} />
        <StatCard icon={CheckCircle2} title="Completed" value={Math.min(scopeVisits.length, group.assignedCount).toLocaleString()} tone={{ bg: 'bg-emerald-50', fg: 'text-emerald-600' }} />
        <StatCard icon={ListChecks} title="Remaining" value={Math.max(group.assignedCount - scopeVisits.length, 0).toLocaleString()} tone={{ bg: 'bg-amber-50', fg: 'text-amber-600' }} />
        <StatCard icon={TrendingUp} title="Completion" value={formatPercent(group.assignedCount ? (Math.min(scopeVisits.length, group.assignedCount) / group.assignedCount) * 100 : 0)} tone={{ bg: 'bg-sky-50', fg: 'text-sky-600' }} />
      </div>

      <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.35fr_0.9fr]">
        <div>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Visit History</h4>
          </div>

          {scopeVisits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No visits recorded for the selected year.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Completed Month</th>
                    <th className="px-4 py-3">Completed Year</th>
                    <th className="px-4 py-3">Cost Center Name</th>
                    <th className="px-4 py-3">Cost Center Code</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopeVisits.map((visit) => (
                    <tr key={`${visit.code}-${visit.yearNumber}-${visit.monthNumber}`} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-semibold text-slate-700">{visit.monthName}</td>
                      <td className="px-4 py-3 text-slate-600">{visit.yearNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{visit.costCenterName || visit.code}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{visit.code}</td>
                      <td className="px-4 py-3"><StatusPill status="green" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Pending Cost Centers</h4>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {pendingCodes.length === 0 ? (
              <p className="text-sm text-slate-500">No pending cost centers. This accountant is fully completed based on the inferred assignment range.</p>
            ) : (
              <div className="space-y-2">
                {pendingCodes.slice(0, 24).map((code) => (
                  <div key={code} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <span className="font-mono text-xs text-slate-600">{code}</span>
                    <span className="text-[11px] font-bold text-amber-700">Pending</span>
                  </div>
                ))}
                {pendingCodes.length > 24 && (
                  <p className="text-xs font-semibold text-slate-500">+{pendingCodes.length - 24} more pending codes</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountantProgressAnalytics({ refreshTrigger = 0 }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedAccountant, setSelectedAccountant] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'completionPercent', dir: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [chartMode, setChartMode] = useState('count');
  const [regionView, setRegionView] = useState('bar');
  const [activeAccountantKey, setActiveAccountantKey] = useState('');
  const [recordsPage, setRecordsPage] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/accountants');
      setRecords(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load accountant data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  const normalizedRecords = useMemo(() => records.map((record, index) => {
    const parsed = parseLabel(record.region);
    return {
      ...record,
      _index: index,
      accountantName: parsed.accountantName,
      regionCode: parsed.regionCode,
      monthName: normalizeMonth(record.month),
      monthNumber: monthIndex(record.month),
      yearNumber: Number(record.year) || null,
      code: String(record.pcfRef || '').trim(),
      codeMeta: parseCostCenterCode(record.pcfRef),
    };
  }), [records]);

  const groups = useMemo(() => buildAccountantGroups(normalizedRecords), [normalizedRecords]);

  const availableYears = useMemo(() => {
    const years = [...new Set(normalizedRecords.map((record) => record.yearNumber).filter(Boolean))].sort((a, b) => b - a);
    return years;
  }, [normalizedRecords]);

  useEffect(() => {
    if (!selectedYear && availableYears.length > 0) {
      setSelectedYear(String(availableYears[0]));
    }
  }, [availableYears, selectedYear]);

  const filteredGroups = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    return groups
      .map((group) => {
        const scopeVisits = group.visits.filter((visit) => visit.yearNumber === yearValue);
        const completedCount = scopeVisits.length;
        const assignedCount = group.assignedCount;
        const remainingCount = Math.max(assignedCount - completedCount, 0);
        const completionPercent = assignedCount ? (completedCount / assignedCount) * 100 : 0;

        return {
          ...group,
          scopeVisits,
          completedCount,
          remainingCount,
          completionPercent,
          status: completionPercent > 80 ? 'green' : completionPercent >= 50 ? 'yellow' : 'red',
        };
      })
      .filter((group) => {
        if (selectedRegion !== 'all' && group.regionCode !== selectedRegion) return false;
        if (selectedAccountant !== 'all' && group.key !== selectedAccountant) return false;
        if (searchQuery.trim()) {
          const query = searchQuery.trim().toLowerCase();
          const haystack = `${group.accountantName} ${group.regionCode} ${group.assignedCount} ${group.completedCount}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      });
  }, [groups, selectedYear, selectedRegion, selectedAccountant, searchQuery, availableYears]);

  const sortedGroups = useMemo(() => {
    const copy = [...filteredGroups];
    copy.sort((a, b) => {
      const { key, dir } = sortConfig;
      let av = a[key];
      let bv = b[key];

      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();

      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredGroups, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedGroups.length / 10));
  const visibleGroups = sortedGroups.slice((currentPage - 1) * 10, currentPage * 10);

  const displayGroups = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    return filteredGroups.map((group) => {
      const completedAsOfYear = group.visits.filter((visit) => visit.yearNumber === yearValue).length;
      return {
        ...group,
        completedAsOfYear,
        remainingAsOfYear: Math.max(group.assignedCount - completedAsOfYear, 0),
        progressAsOfYear: group.assignedCount ? (completedAsOfYear / group.assignedCount) * 100 : 0,
      };
    });
  }, [filteredGroups, selectedYear, availableYears]);

  const summary = useMemo(() => {
    const accountantCount = displayGroups.length;
    const assigned = displayGroups.reduce((sum, group) => sum + group.assignedCount, 0);
    const completed = displayGroups.reduce((sum, group) => sum + group.completedAsOfYear, 0);
    const pending = Math.max(assigned - completed, 0);
    const overall = assigned ? (completed / assigned) * 100 : 0;
    return { accountantCount, assigned, completed, pending, overall };
  }, [displayGroups]);

  const chartData = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    const chartGroups = displayGroups.filter((group) => group.assignedCount > 0);
    return buildSeriesData(chartGroups, yearValue, { region: selectedRegion, accountant: selectedAccountant });
  }, [displayGroups, selectedYear, selectedRegion, selectedAccountant, availableYears]);

  const regionStats = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    const stats = buildRegionStats(displayGroups, yearValue).filter((region) => {
      if (selectedRegion !== 'all' && region.region !== selectedRegion) return false;
      return true;
    });
    return stats;
  }, [displayGroups, selectedYear, selectedRegion, availableYears]);

  const regionTrendData = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    const regions = regionStats.map((region) => region.region);

    return MONTHS.map((monthName, monthNumber) => {
      const row = { month: monthName };

      regions.forEach((regionName) => {
        row[regionName] = displayGroups
          .filter((group) => group.regionCode === regionName)
          .reduce((sum, group) => sum + group.visits.filter((visit) => {
            // only count visits from the selected year up to this month
            if (!visit.yearNumber) return false;
            return visit.yearNumber === yearValue && visit.monthNumber <= monthNumber;
          }).length, 0);
      });

      return row;
    });
  }, [displayGroups, regionStats, selectedYear, availableYears]);

  const insights = useMemo(() => {
    const yearValue = Number(selectedYear) || Number(availableYears[0]) || new Date().getFullYear();
    return buildInsights(displayGroups, yearValue);
  }, [displayGroups, selectedYear, availableYears]);

  const detailedRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...normalizedRecords]
      .filter((record) => {
        if (selectedRegion !== 'all' && record.regionCode !== selectedRegion) return false;
        if (selectedAccountant !== 'all') {
          const accountant = groups.find((group) => group.key === selectedAccountant);
          if (!accountant || record.regionCode !== accountant.regionCode || record.accountantName !== accountant.accountantName) return false;
        }
        if (query) {
          const haystack = `${record.accountantName} ${record.regionCode} ${record.costCenterName || ''} ${record.code || ''} ${record.monthName} ${record.yearNumber}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.yearNumber !== b.yearNumber) return b.yearNumber - a.yearNumber;
        if (a.monthNumber !== b.monthNumber) return a.monthNumber - b.monthNumber;
        return String(a.code).localeCompare(String(b.code));
      });
  }, [normalizedRecords, searchQuery, selectedRegion, selectedAccountant, groups]);

  const activeAccountant = useMemo(() => displayGroups.find((group) => group.key === activeAccountantKey) || displayGroups[0] || null, [displayGroups, activeAccountantKey]);

  useEffect(() => {
    if (!activeAccountantKey && displayGroups[0]) {
      setActiveAccountantKey(displayGroups[0].key);
    }
  }, [displayGroups, activeAccountantKey]);

  const handleSort = (key) => {
    setSortConfig((previous) => previous.key === key ? { key, dir: previous.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedRegion('all');
    setSelectedAccountant('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const hasFilters = selectedRegion !== 'all' || selectedAccountant !== 'all' || searchQuery.trim();
  const detailedTotalPages = Math.max(1, Math.ceil(detailedRecords.length / 12));
  const detailedPageRecords = detailedRecords.slice((recordsPage - 1) * 12, recordsPage * 12);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-indigo-100 border-t-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading accountant analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        <div className="flex items-center gap-2 font-bold">
          <AlertCircle className="h-4 w-4" />
          Error
        </div>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900">No accountant data yet</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Upload accountant visit records using the existing import flow to populate this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Accountant Management</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Cost Center Visit Progress Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Cumulative progress tracking from uploaded accountant visit data.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          {summary.accountantCount} accountant{summary.accountantCount !== 1 ? 's' : ''} tracked
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} title="Total Accountants" value={summary.accountantCount.toLocaleString()} tone={{ bg: 'bg-blue-50', fg: 'text-blue-600' }} />
        <StatCard icon={Target} title="Total Assigned Cost Centers" value={summary.assigned.toLocaleString()} tone={{ bg: 'bg-violet-50', fg: 'text-violet-600' }} />
        <StatCard icon={CheckCircle2} title="Total Completed Cost Centers" value={summary.completed.toLocaleString()} tone={{ bg: 'bg-emerald-50', fg: 'text-emerald-600' }} />
        <StatCard icon={X} title="Total Pending Cost Centers" value={summary.pending.toLocaleString()} tone={{ bg: 'bg-amber-50', fg: 'text-amber-600' }} />
        <StatCard icon={TrendingUp} title="Overall Completion %" value={formatPercent(summary.overall)} tone={{ bg: 'bg-sky-50', fg: 'text-sky-600' }} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => <InsightCard key={insight.title} insight={insight} />)}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Main Visualization</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Yearly cumulative progress line chart</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400">
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button onClick={() => setChartMode('count')} className={`rounded-lg px-3 py-2 text-xs font-bold ${chartMode === 'count' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Completed Count</button>
              <button onClick={() => setChartMode('percent')} className={`rounded-lg px-3 py-2 text-xs font-bold ${chartMode === 'percent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Completion %</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-slate-100 px-6 py-5 lg:grid-cols-3">
          <div>
            <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Accountant</label>
            <select value={selectedAccountant} onChange={(e) => { setSelectedAccountant(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="all">All Accountants</option>
              {groups.map((group) => <option key={group.key} value={group.key}>{group.accountantName}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Region</label>
            <select value={selectedRegion} onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="all">All Regions</option>
              {[...new Set(groups.map((group) => group.regionCode))].sort().map((region) => <option key={region} value={region}>{region}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Year</label>
            <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-400">
              {availableYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          <div className="mb-4 h-[360px] w-full">
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={chartMode === 'percent' ? [0, 100] : ['auto', 'auto']} />
                <Tooltip content={(props) => <AccountantTooltip {...props} chartMode={chartMode} />} />
                <Legend />
                {displayGroups.filter((group) => group.assignedCount > 0).map((group, index) => (
                  <Line
                    key={group.key}
                    type="monotone"
                    dataKey={chartMode === 'percent' ? `${group.key}Percent` : group.key}
                    name={group.accountantName}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Accountant Progress Table</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Sortable progress tracking</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Search accountant or region" className="w-[260px] rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              <tr>
                {[
                  { key: 'accountantName', label: 'Accountant Name' },
                  { key: 'regionCode', label: 'Region' },
                  { key: 'assignedCount', label: 'Assigned Count' },
                  { key: 'completedAsOfYear', label: 'Completed Count' },
                  { key: 'remainingAsOfYear', label: 'Remaining Count' },
                  { key: 'progressAsOfYear', label: 'Completion %' },
                ].map((column) => (
                  <th key={column.key} className="px-5 py-3">
                    <button type="button" onClick={() => handleSort(column.key)} className="inline-flex items-center gap-1.5">
                      <span>{column.label}</span>
                      <SortIcon column={column.key} sortConfig={sortConfig} />
                    </button>
                  </th>
                ))}
                <th className="px-5 py-3">Progress Bar</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleGroups.map((group) => (
                <tr key={group.key} className={`transition-colors ${activeAccountantKey === group.key ? 'bg-indigo-50/50' : 'hover:bg-slate-50/80'}`}>
                  <td className="px-5 py-4 font-semibold text-slate-900">{group.accountantName}</td>
                  <td className="px-5 py-4 text-slate-600">{group.regionCode}</td>
                  <td className="px-5 py-4 text-slate-700 tabular-nums">{group.assignedCount}</td>
                  <td className="px-5 py-4 text-slate-700 tabular-nums">{group.completedAsOfYear}</td>
                  <td className="px-5 py-4 text-slate-700 tabular-nums">{group.remainingAsOfYear}</td>
                  <td className="px-5 py-4 text-slate-700 tabular-nums">{formatPercent(group.progressAsOfYear)}</td>
                  <td className="px-5 py-4">
                    <div className="h-2.5 w-full rounded-full bg-slate-100">
                      <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${Math.min(group.progressAsOfYear, 100)}%` }} />
                    </div>
                  </td>
                  <td className="px-5 py-4"><StatusPill status={group.status} /></td>
                  <td className="px-5 py-4">
                    <button onClick={() => setActiveAccountantKey(group.key)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-700">
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {visibleGroups.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-5 py-12 text-center text-sm text-slate-500">No accountants match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold text-slate-400">Page {currentPage} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">Prev</button>
              <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Region Performance Analytics</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">Regional summary and trend view</h2>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => setRegionView('bar')} className={`rounded-lg px-3 py-2 text-xs font-bold ${regionView === 'bar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Bar</button>
            <button onClick={() => setRegionView('pie')} className={`rounded-lg px-3 py-2 text-xs font-bold ${regionView === 'pie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Pie</button>
            <button onClick={() => setRegionView('trend')} className={`rounded-lg px-3 py-2 text-xs font-bold ${regionView === 'trend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Trend</button>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.25fr_0.9fr]">
          <div className="h-[340px] w-full">
            <ResponsiveContainer>
              {regionView === 'bar' ? (
                <BarChart data={regionStats} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="assigned" name="Assigned" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : regionView === 'pie' ? (
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie data={[{ name: 'Completed', value: summary.completed }, { name: 'Pending', value: summary.pending }]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    <Cell fill="#2563eb" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                </PieChart>
              ) : (
                <LineChart data={regionTrendData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {regionStats.map((region, index) => (
                    <Line key={region.region} type="monotone" dataKey={region.region} name={region.region} stroke={COLORS[index % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {regionStats.map((region) => (
              <div key={region.region} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{region.region}</p>
                    <p className="text-xs text-slate-500">Assigned {region.assigned} · Completed {region.completed} · Pending {region.pending}</p>
                  </div>
                  <StatusPill status={region.completionPercent > 80 ? 'green' : region.completionPercent >= 50 ? 'yellow' : 'red'} />
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white">
                  <div className="h-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${Math.min(region.completionPercent, 100)}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{formatPercent(region.completionPercent)} completion</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-400">Detailed Excel Sheet Table</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">All imported visit records</h2>
            <p className="mt-1 text-sm text-slate-500">This is the full detailed table from the uploaded Excel sheet.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {detailedRecords.length.toLocaleString()} row{detailedRecords.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
            <Filter className="h-4 w-4" />
            Current filters apply to this table
          </div>
          <button onClick={() => setRecordsPage(1)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
            Reset page
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Accountant Name</th>
                <th className="px-5 py-3">Region</th>
                <th className="px-5 py-3">Cost Center Name</th>
                <th className="px-5 py-3">Cost Center Code</th>
                <th className="px-5 py-3">Completed Year</th>
                <th className="px-5 py-3">Completed Month</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detailedPageRecords.map((record) => (
                <tr key={record._id || `${record.code}-${record.yearNumber}-${record.monthName}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-900">{record.accountantName}</td>
                  <td className="px-5 py-4 text-slate-600">{record.regionCode}</td>
                  <td className="px-5 py-4 text-slate-700">{record.costCenterName || record.code}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{record.code}</td>
                  <td className="px-5 py-4 text-slate-700">{record.yearNumber || '—'}</td>
                  <td className="px-5 py-4 text-slate-700">{record.monthName || '—'}</td>
                  <td className="px-5 py-4"><StatusPill status="green" /></td>
                </tr>
              ))}
              {detailedPageRecords.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-sm text-slate-500">No detailed records match the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {detailedTotalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold text-slate-400">Page {recordsPage} of {detailedTotalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setRecordsPage((page) => Math.max(1, page - 1))} disabled={recordsPage === 1} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">Prev</button>
              <button onClick={() => setRecordsPage((page) => Math.min(detailedTotalPages, page + 1))} disabled={recordsPage === detailedTotalPages} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
