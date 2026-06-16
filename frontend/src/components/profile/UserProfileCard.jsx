import { CheckCircle2, Edit3, LogOut } from 'lucide-react';

const getInitials = (fullName = '') => {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function UserProfileCard({ user, loading = false, onEdit, onLogout }) {
  if (loading) {
    return (
      <div className="flex min-h-[72vh] w-full items-center justify-center bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#4f8fe8]" />
          <span className="text-sm font-medium">Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <section className="relative flex min-h-[72vh] w-full flex-col overflow-hidden bg-white">
      <div className="absolute inset-x-0 top-0 h-36 overflow-hidden rounded-t-[32px] bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pb-10 pt-8 text-center sm:pt-12">
        <div className="w-full max-w-2xl">
          <div className="relative flex items-start justify-between">
            <div className="relative">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.55)] sm:h-44 sm:w-44">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#f3f4f6] text-4xl font-semibold text-slate-700">
                    {getInitials(user?.fullName)}
                  </div>
                )}
              </div>

              <div className="absolute -bottom-2 left-6 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-md">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => (onEdit ? onEdit() : window.alert('Edit profile'))}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white/75 px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-white"
                aria-label="Edit profile"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => (onLogout ? onLogout() : window.alert('Logout'))}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 shadow-sm transition hover:bg-red-100"
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>

          <div className="mt-4 text-left">
            <h1 className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
              {user?.fullName || 'User Name'}
            </h1>
            <p className="mt-1 text-sm text-slate-200">{user?.email || 'user@example.com'}</p>

            <p className="mt-4 text-sm text-slate-600">{user?.bio || 'No bio provided.'}</p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                <div className="text-sm font-medium text-slate-600">Role</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{user?.role || 'Accountant'}</div>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                <div className="text-sm font-medium text-slate-600">Region</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{user?.region || 'Head Office'}</div>
              </div>

              <div className="rounded-lg bg-slate-50 px-3 py-2 text-center">
                <div className="text-sm font-medium text-slate-600">Joined</div>
                <div className="mt-1 text-lg font-semibold text-slate-900">{formatDate(user?.joinedDate)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
