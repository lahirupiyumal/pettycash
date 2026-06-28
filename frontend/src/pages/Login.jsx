import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import logo from '../Assert/Logo.png';

const ROLE_OPTIONS = [
  { value: 'department_lead', label: 'Department Lead' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'admin', label: 'Admin' },
];

const ROLE_DESCRIPTIONS = {
  department_lead: 'Department Lead accounts require manual administrator approval.',
  accountant: 'Accountant accounts are auto-approved only when your service ID matches Reporting Accountant Emp.',
  admin: 'Admin accounts require manual administrator approval.',
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [pendingRoleSelection, setPendingRoleSelection] = useState(false);
  const [selectRoleUserId, setSelectRoleUserId] = useState(null);
  const [selectedRole, setSelectedRole] = useState('department_lead');
  const [submittingRole, setSubmittingRole] = useState(false);

  // Once token state is committed (by login() or from localStorage on mount),
  // redirect away from login page to the dashboard.
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authValue = params.get('auth');
    const errorValue = params.get('error');
    const successValue = params.get('success');
    const selectRoleValue = params.get('selectRole');
    const userIdValue = params.get('userId');

    if (selectRoleValue === 'true' && userIdValue) {
      setPendingRoleSelection(true);
      setSelectRoleUserId(userIdValue);
      setError('');
      setSuccess('');
      return;
    }

    if (errorValue) {
      setError(errorValue);
      setSuccess('');
    }

    if (successValue) {
      setSuccess(successValue);
      setError('');
    }

    if (!authValue) return;

    try {
      const normalized = authValue.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(padded));

      if (payload?.token && payload?.user) {
        login(payload.user, payload.token);
        // Don't navigate here — login() calls setToken() which is async.
        // The auth-guard useEffect above will redirect once React commits the state.
      }
    } catch {
      setError('Microsoft login could not be completed.');
    }
  }, [location.search, login]);

  const handleMicrosoftLogin = () => {
    const backendBaseUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');
    window.location.href = `${backendBaseUrl}/api/auth/microsoft`;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRole(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/auth/select-role', {
        userId: selectRoleUserId,
        role: selectedRole,
      });
      setSuccess(data.message || 'Your account request has been sent to the administrator for approval. Please wait until your account is approved.');
      setPendingRoleSelection(false);
      setSelectRoleUserId(null);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to select role. Please try again.');
    } finally {
      setSubmittingRole(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#edf7ff_46%,#f4fff7_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(14,116,144,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute -left-32 top-0 h-full w-[34rem] -skew-x-12 bg-gradient-to-b from-sky-200/60 via-cyan-100/50 to-transparent" />
      <div className="absolute -right-40 bottom-0 h-[115%] w-[32rem] -skew-x-12 bg-gradient-to-t from-emerald-200/60 via-blue-100/50 to-transparent" />

      <div className="relative w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="Logo"
            className="h-20 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
          {pendingRoleSelection ? (
            <>
              <div className="border-b border-slate-200/80 bg-white/70 px-8 py-7 text-center">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-600 mb-2">Finance Portal</p>
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Select Account Type</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">First-time Microsoft Login Setup</p>
              </div>

              <div className="px-8 py-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 shadow-inner shadow-red-100">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRoleSubmit} className="space-y-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="role">Account Type</label>
                    <select
                      id="role"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      required
                    >
                      {ROLE_OPTIONS.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-[10px] text-slate-400">
                      {ROLE_DESCRIPTIONS[selectedRole]}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRole}
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {submittingRole ? 'Submitting Request...' : 'Confirm & Request Access'}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <>
              <div className="border-b border-slate-200/80 bg-white/70 px-8 py-7 text-center">
                <h2 className="text-3xl font-black tracking-tight text-slate-950">Sign In</h2>
                <p className="mt-2 text-sm font-medium text-slate-500">Finance Portal Access</p>
              </div>

              <div className="px-8 py-8">
                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700">
                    {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="password">Password</label>
                    <input
                      id="password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="text-right">
                    <Link to="/forgot-password" className="text-sm font-bold text-sky-600 transition-colors hover:text-sky-700 hover:underline underline-offset-4">
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] hover:shadow-blue-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleMicrosoftLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3.5 font-bold text-slate-700 shadow-sm transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-slate-100"
                >
                  <span className="grid h-5 w-5 grid-cols-2 gap-0.5" aria-hidden="true">
                    <span className="bg-[#f25022]" />
                    <span className="bg-[#7fba00]" />
                    <span className="bg-[#00a4ef]" />
                    <span className="bg-[#ffb900]" />
                  </span>
                  Log in with Microsoft
                </button>

                <div className="mt-8 border-t border-slate-200 pt-6 text-center">
                  <p className="text-sm text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-sky-600 transition-colors hover:text-sky-700 hover:underline underline-offset-4">
                      Request Access
                    </Link>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
