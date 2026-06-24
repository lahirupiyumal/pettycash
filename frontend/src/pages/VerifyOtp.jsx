import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../Assert/Logo.jpg';

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    if (!/^\d{6}$/.test(normalizedOtp)) {
      setError('OTP must be 6 digits.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/password-reset/verify-otp', {
        email: normalizedEmail,
        otp: normalizedOtp,
      });
      setSuccess(data.message);
      setTimeout(() => navigate('/reset-password', { state: { email: normalizedEmail } }), 800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
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

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img
            src={logo}
            alt="Logo"
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <div className="w-full overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-2xl shadow-slate-300/40 backdrop-blur-xl">
          <div className="border-b border-slate-200/80 bg-white/70 px-8 py-7 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950">Verify OTP</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Enter the code from your email</p>
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
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor="otp">
                  OTP
                </label>
                <input
                  id="otp"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-emerald-500 py-3.5 font-bold tracking-wide text-white shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] hover:shadow-blue-300 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>

            <div className="mt-8 border-t border-slate-200 pt-6 text-center">
              <Link to="/forgot-password" className="font-bold text-sky-600 transition-colors hover:text-sky-700 hover:underline underline-offset-4">
                Request a New OTP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
