import { useState, useEffect, useMemo } from 'react';
import axios from '../api/axios';
import {
  Activity,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  Search,
  User,
  Users,
  LogIn,
  LogOut,
  Eye,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  Navigation,
  ChevronLeft,
  ChevronRight,
  FileText,
  Shield,
  BookUser,
} from 'lucide-react';

const ACTION_TYPE_ICONS = {
  login: LogIn,
  logout: LogOut,
  view: Eye,
  create: Plus,
  update: Edit,
  delete: Trash2,
  import: Upload,
  export: Download,
  navigate: Navigation,
  other: Activity,
};

const ACTION_TYPE_COLORS = {
  login: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  logout: 'bg-amber-50 text-amber-600 border-amber-100',
  view: 'bg-blue-50 text-blue-600 border-blue-100',
  create: 'bg-green-50 text-green-600 border-green-100',
  update: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  delete: 'bg-red-50 text-red-600 border-red-100',
  import: 'bg-purple-50 text-purple-600 border-purple-100',
  export: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  navigate: 'bg-slate-50 text-slate-600 border-slate-100',
  other: 'bg-gray-50 text-gray-600 border-gray-100',
};

const ROLE_COLORS = {
  admin: 'bg-blue-50 text-blue-600 border-blue-100',
  accountant: 'bg-purple-50 text-purple-600 border-purple-100',
  user: 'bg-slate-50 text-slate-600 border-slate-100',
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateTime = (dateString) => {
  return `${formatDate(dateString)} ${formatTime(dateString)}`;
};

const formatDuration = (minutes) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

export default function Audit() {
  const [activeTab, setActiveTab] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [actionType, setActionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState([]);

  // Fetch sessions data
  const fetchSessions = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(userRole && { userRole }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await axios.get(`/audit/sessions?${params}`);
      if (response.data.success) {
        setSessions(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs data
  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(userRole && { userRole }),
        ...(actionType && { actionType }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await axios.get(`/audit/logs?${params}`);
      if (response.data.success) {
        setLogs(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary data
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await axios.get(`/audit/summary?${params}`);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions(pagination.page);
    } else if (activeTab === 'logs') {
      fetchLogs(pagination.page);
    }
    fetchSummary();
  }, [activeTab, pagination.page, search, userRole, actionType, startDate, endDate]);

  // Handle filter reset
  const handleReset = () => {
    setSearch('');
    setUserRole('');
    setActionType('');
    setStartDate('');
    setEndDate('');
    setPagination({ ...pagination, page: 1 });
  };

  // Stats cards data
  const statsCards = useMemo(() => {
    const totalSessions = pagination.total;
    const totalLogins = summary.reduce((acc, s) => acc + (s.logins || 0), 0);
    const totalActions = summary.reduce((acc, s) => acc + (s.totalActions || 0), 0);
    const uniqueUsers = summary.length;

    return [
      { 
        label: 'Total Sessions', 
        value: totalSessions, 
        icon: Activity, 
        color: 'from-blue-600 to-indigo-700',
        shadow: 'shadow-blue-200/50',
        subtext: 'User login sessions'
      },
      { 
        label: 'Total Logins', 
        value: totalLogins, 
        icon: LogIn, 
        color: 'from-emerald-500 to-teal-600',
        shadow: 'shadow-emerald-200/50',
        subtext: 'Successful logins'
      },
      { 
        label: 'Total Actions', 
        value: totalActions, 
        icon: Activity, 
        color: 'from-purple-500 to-violet-600',
        shadow: 'shadow-purple-200/50',
        subtext: 'All recorded actions'
      },
      { 
        label: 'Active Users', 
        value: uniqueUsers, 
        icon: Users, 
        color: 'from-amber-500 to-orange-600',
        shadow: 'shadow-amber-200/50',
        subtext: 'Unique active users'
      },
    ];
  }, [pagination.total, summary]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Audit Trail</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Monitor user activities and session logs</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'sessions') fetchSessions(pagination.page);
              else fetchLogs(pagination.page);
              fetchSummary();
            }}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div key={index} className={`bg-gradient-to-br ${stat.color} p-6 rounded-3xl text-white shadow-lg ${stat.shadow}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <stat.icon className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">
                {stat.label}
              </span>
            </div>
            <p className="text-3xl font-black">{stat.value}</p>
            <p className="text-white/80 text-xs font-medium mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Main Content Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
              onClick={() => {
                setActiveTab('sessions');
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'sessions'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              User Sessions
            </button>
            <button
              onClick={() => {
                setActiveTab('logs');
                setPagination({ ...pagination, page: 1 });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'logs'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Activity Logs
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'summary'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Summary
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="accountant">Accountant</option>
              <option value="user">User</option>
            </select>

            {activeTab === 'logs' && (
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="view">View</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="import">Import</option>
                <option value="export">Export</option>
                <option value="navigate">Navigate</option>
                <option value="other">Other</option>
              </select>
            )}

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <Filter className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : activeTab === 'sessions' ? (
            /* Sessions Tab */
            sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Activity className="h-12 w-12 opacity-20" />
                  <p className="font-medium text-slate-500">No sessions found</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session._id}
                    className="border border-slate-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-slate-50/30"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md ${
                          session.userRole === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                          session.userRole === 'accountant' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                          'bg-gradient-to-br from-slate-500 to-slate-600'
                        }`}>
                          {session.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{session.userName}</p>
                          <p className="text-xs text-slate-500 font-medium">{session.userEmail}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${ROLE_COLORS[session.userRole]}`}>
                        {session.userRole}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-emerald-50 rounded-lg">
                          <LogIn className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs font-medium">Login: </span>
                          <span className="font-bold text-slate-900">{formatDateTime(session.loginTime)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-amber-50 rounded-lg">
                          <LogOut className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs font-medium">Logout: </span>
                          <span className="font-bold text-slate-900">
                            {session.logoutTime ? formatDateTime(session.logoutTime) : 'Active'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-blue-50 rounded-lg">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs font-medium">Duration: </span>
                          <span className="font-bold text-slate-900">{formatDuration(session.duration)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="p-1.5 bg-purple-50 rounded-lg">
                          <Activity className="h-4 w-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs font-medium">Activities: </span>
                          <span className="font-bold text-slate-900">{session.activityCount}</span>
                        </div>
                      </div>
                    </div>

                    {session.activities && session.activities.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Activities</p>
                        <div className="space-y-2">
                          {session.activities.map((activity, idx) => {
                            const Icon = ACTION_TYPE_ICONS[activity.actionType] || Activity;
                            return (
                              <div key={idx} className="flex items-center gap-3 text-sm">
                                <div className="p-1 bg-slate-100 rounded">
                                  <Icon className="h-3.5 w-3.5 text-slate-500" />
                                </div>
                                <span className="text-slate-500 text-xs font-mono">{formatTime(activity.time)}</span>
                                <span className="text-slate-700 font-medium">{activity.action}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : activeTab === 'logs' ? (
            /* Logs Tab */
            logs.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FileText className="h-12 w-12 opacity-20" />
                  <p className="font-medium text-slate-500">No activity logs found</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        User
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Type
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Details
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date & Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map((log) => {
                      const Icon = ACTION_TYPE_ICONS[log.actionType] || Activity;
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm ${
                                log.userRole === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                                log.userRole === 'accountant' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                                'bg-gradient-to-br from-slate-500 to-slate-600'
                              }`}>
                                {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{log.userName}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{log.userEmail}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-slate-100 rounded-lg">
                                <Icon className="h-4 w-4 text-slate-500" />
                              </div>
                              <span className="text-sm font-medium text-slate-700">{log.action}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              ACTION_TYPE_COLORS[log.actionType] || ACTION_TYPE_COLORS.other
                            }`}>
                              {log.actionType}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-slate-500 max-w-xs truncate block font-medium">
                              {log.details || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-slate-500 font-medium">
                              <div>{formatDate(log.createdAt)}</div>
                              <div className="text-xs text-slate-400">{formatTime(log.createdAt)}</div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Summary Tab */
            summary.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <FileText className="h-12 w-12 opacity-20" />
                  <p className="font-medium text-slate-500">No summary data available</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        User / Role
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total Actions
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Logins
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Views
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Creates
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Updates
                      </th>
                      <th className="text-right py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Deletes
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        First Activity
                      </th>
                      <th className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black ${
                              item.userRole === 'admin' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                              item.userRole === 'accountant' ? 'bg-gradient-to-br from-purple-500 to-violet-600' :
                              'bg-gradient-to-br from-slate-500 to-slate-600'
                            }`}>
                              {item.userName ? item.userName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <span className="text-sm font-bold text-slate-900">
                              {item.userName || 'Unknown'}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${ROLE_COLORS[item.userRole]}`}>
                              {item.userRole}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-black text-slate-900">{item.totalActions}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-slate-600">{item.logins || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-slate-600">{item.views || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-slate-600">{item.creates || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-slate-600">{item.updates || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-sm font-medium text-slate-600">{item.deletes || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500 font-medium">
                          {item.firstActivity ? formatDateTime(item.firstActivity) : '-'}
                        </td>
                        <td className="py-4 px-4 text-sm text-slate-500 font-medium">
                          {item.lastActivity ? formatDateTime(item.lastActivity) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-slate-900">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-slate-900">{pagination.total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm font-bold text-slate-700 bg-white rounded-xl border border-slate-200">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="p-2 rounded-xl border border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}