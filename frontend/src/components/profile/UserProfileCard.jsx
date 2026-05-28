import { CheckCircle2 } from 'lucide-react';

const getInitials = (fullName = '') => {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
};

export default function UserProfileCard({ user, loading = false }) {
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
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-6 pb-10 pt-10 text-center sm:pt-12">
        <div className="relative">
          <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-full border-[6px] border-white bg-white shadow-[0_18px_40px_-20px_rgba(15,23,42,0.55)] sm:h-52 sm:w-52">
            <div className="flex h-full w-full items-center justify-center bg-[#f3f4f6] text-5xl font-semibold text-slate-700">
              {getInitials(user?.fullName)}
            </div>
          </div>

          <div className="absolute -bottom-1 left-8 flex h-11 w-11 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white shadow-md">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <h1 className="text-[2.05rem] font-semibold leading-none tracking-tight text-slate-900 sm:text-[2.35rem]">
            {user?.fullName || 'User Name'}
          </h1>
          <p className="text-base text-slate-500 sm:text-lg">
            {user?.email || 'user@example.com'}
          </p>
        </div>

      </div>
    </section>
  );
}
