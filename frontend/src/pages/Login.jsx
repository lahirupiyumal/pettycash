import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.user, data.token);
      navigate('/');
    } catch {
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] relative flex items-center justify-center px-4 py-10 text-slate-100 overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md z-10">
        {/* Logo outside the card for premium feel */}
        <div className="flex justify-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/ed/SLTMobitel_Logo.svg"
            alt="SLT Logo"
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="w-full overflow-hidden rounded-3xl border border-slate-800/60 bg-[#0a0f1c]/90 shadow-2xl shadow-black/50 backdrop-blur-xl">
          <div className="border-b border-slate-800/60 bg-slate-900/50 px-8 py-7 text-center">
            <h2 className="text-3xl font-black tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-400 font-medium">Finance Portal Access</p>
          </div>

          <div className="px-8 py-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200 text-center font-medium shadow-inner shadow-red-500/10">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-inner" 
                  type="email" 
                  placeholder="you@example.com"
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })} 
                  required 
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400" htmlFor="password">Password</label>
                <input 
                  id="password"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-300 shadow-inner" 
                  type="password" 
                  placeholder="••••••••"
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })} 
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-blue-900/40 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-900/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 ring-1 ring-white/10"
              >
                {loading ? 'Authenticating...' : 'Secure Sign In'}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-800 pt-6 text-center">
              <p className="text-sm text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-blue-400 transition-colors hover:text-blue-300 hover:underline underline-offset-4">
                  Request Access
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
