import { useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  MapPin,
} from 'lucide-react';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Consistent colour palette per region index
const PALETTE = [
  { bar: 'bg-indigo-500',  badge: 'bg-indigo-100 text-indigo-700',  header: 'from-indigo-600 to-purple-600',  ring: 'ring-indigo-200' },
  { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',      header: 'from-blue-600 to-cyan-600',      ring: 'ring-blue-200' },
  { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700',header: 'from-emerald-600 to-teal-600',   ring: 'ring-emerald-200' },
  { bar: 'bg-orange-400',  badge: 'bg-orange-100 text-orange-700',  header: 'from-orange-500 to-rose-500',    ring: 'ring-orange-200' },
  { bar: 'bg-violet-500',  badge: 'bg-violet-100 text-violet-700',  header: 'from-violet-600 to-purple-600',  ring: 'ring-violet-200' },
  { bar: 'bg-rose-500',    badge: 'bg-rose-100 text-rose-700',      header: 'from-rose-600 to-pink-600',      ring: 'ring-rose-200' },
  { bar: 'bg-amber-400',   badge: 'bg-amber-100 text-amber-700',    header: 'from-amber-500 to-orange-500',   ring: 'ring-amber-200' },
  { bar: 'bg-cyan-500',    badge: 'bg-cyan-100 text-cyan-700',      header: 'from-cyan-600 to-blue-600',      ring: 'ring-cyan-200' },
];

function colour(idx) {
  return PALETTE[idx % PALETTE.length];
}

function RegionCard({ region, rows, idx, maxCount }) {
  const [open, setOpen] = useState(false);
  const c = colour(idx);

  const costCenters = useMemo(
    () => [...new Set(rows.map(r => r.costCenterName).filter(Boolean))],
    [rows],
  );
  const years = useMemo(
    () => [...new Set(rows.map(r => r.year).filter(Boolean))].sort((a, b) => a - b),
    [rows],
  );

  const barPct = maxCount > 0 ? Math.round((rows.length / maxCount) * 100) : 0;

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden ring-1 ${c.ring} ring-opacity-40`}>
      {/* Card header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors select-none"
      >
        {/* Icon */}
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.header} shadow-md`}>
          <MapPin className="h-5 w-5 text-white" strokeWidth={1.8} />
        </div>

        {/* Name + bar */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-sm font-black text-slate-900 truncate">{region}</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${c.badge}`}>
              {rows.length} record{rows.length !== 1 ? 's' : ''}
            </span>
          </div>
          {/* progress bar */}
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full ${c.bar} transition-all duration-500`}
              style={{ width: `${barPct}%` }}
            />
          </div>
        </div>

        {/* Meta pills */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            <Building2 className="h-3 w-3" />
            {costCenters.length} CC
          </span>
          <span className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
            <CalendarDays className="h-3 w-3" />
            {years.length > 0 ? `${years[0]}${years.length > 1 ? `–${years[years.length - 1]}` : ''}` : '—'}
          </span>
        </div>

        {/* Chevron */}
        <div className="flex-shrink-0 ml-1">
          {open
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {/* Expandable table */}
      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-50">
              <tr>
                {['PCF Ref', 'Cost Center Name', 'Number', 'Year', 'Month'].map(h => (
                  <th key={h} className="px-5 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 font-bold text-slate-900">{r.pcfRef || '—'}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-[240px] truncate">{r.costCenterName || '—'}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{r.number || '—'}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                      {r.year || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                      {r.month || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function RegionView({ records }) {
  const [search, setSearch] = useState('');

  // Group by region
  const grouped = useMemo(() => {
    const map = {};
    records.forEach(r => {
      const key = r.region || '(No Region)';
      if (!map[key]) map[key] = [];
      map[key].push(r);
    });
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length);
  }, [records]);

  const filtered = useMemo(() => {
    if (!search.trim()) return grouped;
    const q = search.trim().toLowerCase();
    return grouped.filter(([region]) => region.toLowerCase().includes(q));
  }, [grouped, search]);

  const maxCount = grouped[0]?.[1]?.length ?? 0;

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <FileSpreadsheet className="h-8 w-8 text-slate-400" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-slate-500">No records to group by region.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Region search */}
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by region name…"
          className="flex-1 bg-transparent text-sm font-medium text-slate-700 placeholder-slate-400 focus:outline-none"
        />
        <span className="text-xs font-bold text-slate-400">
          {filtered.length} / {grouped.length} region{grouped.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Region cards */}
      {filtered.length === 0 ? (
        <p className="text-center text-sm text-slate-400 py-10">No regions match "{search}"</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(([region, rows], idx) => (
            <RegionCard
              key={region}
              region={region}
              rows={rows}
              idx={idx}
              maxCount={maxCount}
            />
          ))}
        </div>
      )}
    </div>
  );
}
