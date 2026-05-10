import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Shield, Mail, Calendar, Search, RefreshCw, Trash2 } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth');
      setUsers(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await api.patch('/auth/status', { userId, status: newStatus });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete the account for "${userName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/auth/${userId}`);
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Administration</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage user accounts and access levels</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={fetchUsers}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
            title="Refresh list"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Total Users</span>
          </div>
          <p className="text-3xl font-black">{users.length}</p>
          <p className="text-blue-100 text-xs font-medium mt-1">Active registered accounts</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-3xl text-white shadow-lg shadow-amber-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <RefreshCw className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Pending</span>
          </div>
          <p className="text-3xl font-black">{users.filter(u => u.status === 'pending').length}</p>
          <p className="text-amber-100 text-xs font-medium mt-1">Awaiting approval</p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-200/50">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Shield className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-lg">Admins</span>
          </div>
          <p className="text-3xl font-black">{users.filter(u => u.role === 'admin').length}</p>
          <p className="text-emerald-100 text-xs font-medium mt-1">Privileged accounts</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">User Directory</h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {filteredUsers.length} Entries
          </span>
        </div>

        {error && (
          <div className="m-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">User</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-10 w-32 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-16 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-40 bg-slate-100 rounded-lg"></div></td>
                    <td className="px-6 py-4"><div className="h-6 w-24 bg-slate-100 rounded-lg"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{user.name}</p>
                          <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-tight">{user.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        user.status === 'approved' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : user.status === 'rejected'
                          ? 'bg-red-50 text-red-600 border-red-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {user.status !== 'approved' && user.role !== 'admin' && (
                          <button 
                            onClick={() => handleStatusUpdate(user._id, 'approved')}
                            className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                          >
                            Approve
                          </button>
                        )}
                        {user.status !== 'rejected' && user.role !== 'admin' && (
                          <button 
                            onClick={() => handleStatusUpdate(user._id, 'rejected')}
                            className="px-3 py-1.5 bg-red-500 text-white text-[10px] font-bold rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                          >
                            Deny
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button 
                            onClick={() => handleDelete(user._id, user.name)}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm"
                            title="Delete Account"
                          >
                            Delete
                          </button>
                        )}
                        {user.role === 'admin' && (
                          <span className="text-[10px] font-bold text-slate-400 italic">No actions</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Search className="h-10 w-10 opacity-20" />
                      <p className="font-medium text-slate-500">No users found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
