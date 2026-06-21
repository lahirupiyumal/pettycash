import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'department_lead' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useAuth();

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.post('/auth/register', { 
        name: form.name, 
        email: form.email, 
        password: form.password,
        role: form.role
      });
      setSuccess(data.message);
      // Auto-redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fbff_0%,#edf7ff_46%,#f4fff7_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(14,116,144,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(14,116,144,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute -left-32 top-0 h-full w-[34rem] -skew-x-12 bg-gradient-to-b from-sky-200/60 via-cyan-100/50 to-transparent" />
      <div className="absolute -right-40 bottom-0 h-[115%] w-[32rem] -skew-x-12 bg-gradient-to-t from-emerald-200/60 via-blue-100/50 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/80 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/90 to-transparent" />

      <div className="relative w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/ed/SLTMobitel_Logo.svg"
            alt="SLT Logo"
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
          <div className="border-b border-slate-200/80 bg-white/70 px-8 py-7 text-center">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-sky-600 mb-2">Finance Portal</p>
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Create Account</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Request access to Petty Cash</p>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-700 shadow-inner shadow-red-100">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm font-medium text-emerald-700 shadow-inner shadow-emerald-100">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="name">Full Name</label>
                <input 
                  id="name"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" 
                  type="text" 
                  placeholder="John Doe"
                  value={form.name} 
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" 
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" 
                  type="password" 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                  required 
                  minLength={6}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  id="confirmPassword"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100" 
                  type="password" 
                  placeholder="••••••••"
                  value={form.confirmPassword} 
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                  required 
                  minLength={6}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="role">Account Type</label>
                <select
                  id="role"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 shadow-inner outline-none transition-all duration-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  required
                >
                  <option value="department_lead">Department Lead</option>
                  <option value="accountant">Accountant</option>
                </select>
                <p className="mt-1.5 text-[10px] text-slate-400">
                  {form.role === 'department_lead'
                    ? 'Department Lead account with team management access'
                    : 'Accountant account with extended data management privileges'}
                </p>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? 'Creating account...' : 'Submit Request'}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have access?{' '}
                <Link to="/login" className="font-bold text-sky-600 transition-colors hover:text-sky-700 hover:underline underline-offset-4">
                  Secure Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
