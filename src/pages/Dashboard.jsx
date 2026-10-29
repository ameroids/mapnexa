import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ClipboardList,
  MapPinned,
  CalendarDays,
  BellRing,
  Sparkles,
  Plus,
  Pencil,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Compass
} from 'lucide-react';
import { useData } from '../database/useData.js';
import { Head, Badge, Empty, Loading, MapActions } from '../components/ui.jsx';
import { BarBox, countBy } from '../components/Charts.jsx';
import { fmt, today, addDays, lastMonths, monthLabel } from '../utils/dates.js';

const statConfig = {
  'Total Companies': {
    grad: 'from-blue-600 to-indigo-600',
    light: 'bg-blue-50 text-blue-600 border-blue-100',
    tag: 'Active Directory',
  },
  'Total Visits': {
    grad: 'from-cyan-500 to-blue-600',
    light: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    tag: 'Logged Visits',
  },
  'Cities Covered': {
    grad: 'from-amber-500 to-orange-500',
    light: 'bg-amber-50 text-amber-600 border-amber-100',
    tag: 'Geo Reach',
  },
  'Visits This Month': {
    grad: 'from-violet-600 to-indigo-600',
    light: 'bg-violet-50 text-violet-600 border-violet-100',
    tag: 'Current Month',
  },
  'Pending Follow-ups': {
    grad: 'from-rose-500 to-pink-600',
    light: 'bg-rose-50 text-rose-600 border-rose-100',
    tag: 'Action Required',
  },
  'Added Recently (30d)': {
    grad: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    tag: 'New Accounts',
  },
};

const StatCard = ({ icon: Icon, label, value }) => {
  const conf = statConfig[label] || {
    grad: 'from-indigo-600 to-blue-600',
    light: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    tag: 'Metric',
  };

  return (
    <div className="card p-5 group hover:-translate-y-1 hover:shadow-card-hover transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${conf.grad} text-white flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-300`}
        >
          <Icon size={20} />
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.light} uppercase tracking-wider`}
        >
          {conf.tag}
        </span>
      </div>

      <div>
        <p className="text-3xl font-extrabold text-slate-900 font-display tracking-tight group-hover:text-indigo-600 transition-colors">
          {value}
        </p>
        <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
      </div>

      {/* Decorative corner accent on hover */}
      <div
        className={`absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-gradient-to-tr ${conf.grad} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-300 pointer-events-none`}
      />
    </div>
  );
};

export default function Dashboard() {
  const { rows, visits, byId, loading } = useData();
  const nav = useNavigate();

  if (loading) return <Loading />;

  const month = today().slice(0, 7);
  const recentCut = addDays(-30);

  const stats = [
    [Building2, 'Total Companies', rows.length],
    [ClipboardList, 'Total Visits', visits.length],
    [MapPinned, 'Cities Covered', new Set(rows.map((r) => r.city?.trim().toLowerCase()).filter(Boolean)).size],
    [CalendarDays, 'Visits This Month', visits.filter((v) => v.visitDate.startsWith(month)).length],
    [Sparkles, 'Added Recently (30d)', rows.filter((r) => r.createdAt.slice(0, 10) >= recentCut).length],
  ];

  const monthly = lastMonths(6).map((k) => ({
    name: monthLabel(k),
    value: visits.filter((v) => v.visitDate.startsWith(k)).length,
  }));

  const recent = [...rows]
    .filter((r) => r.lastVisit)
    .sort((a, b) => b.lastVisit.localeCompare(a.lastVisit))
    .slice(0, 6);

  const activity = [...visits]
    .sort((a, b) => b.visitDate.localeCompare(a.visitDate))
    .slice(0, 6);

  if (!rows.length)
    return (
      <Empty
        title="No companies yet"
        text="Record your first factory visit to start building your directory with real-time location navigation."
      >
        <Link to="/visit/new" className="btn btn-p">
          <Plus size={15} />
          Add First Visit
        </Link>
      </Empty>
    );

  const citiesCount = new Set(rows.map((r) => r.city).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      {/* Aurora Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0B0F19] via-[#1E1B4B] to-[#0F172A] text-white p-7 md:p-8 relative overflow-hidden shadow-2xl border border-indigo-500/30">
        {/* Glow Spheres */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-16 w-56 h-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200 mb-3">
              <Compass size={14} className="text-cyan-400" />
              <span>Executive Location Dashboard</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight font-display text-white">
              {rows.length} Factories Across {citiesCount} Cities
            </h1>
            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              Track onsite engagements, review geo-located facilities, and schedule immediate client follow-ups seamlessly.
            </p>
          </div>

          <div className="relative flex flex-wrap gap-3">
            <Link to="/visit/new" className="btn btn-accent shadow-glow-amber !py-2.5 !px-4">
              <Plus size={16} />
              Log New Visit
            </Link>
            <Link
              to="/map"
              className="btn !bg-white/10 hover:!bg-white/20 !border-white/20 !text-white backdrop-blur-md !py-2.5 !px-4"
            >
              <MapPinned size={16} className="text-cyan-400" />
              Interactive Map
            </Link>
          </div>
        </div>
      </div>

      {/* Modern Metric Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(([Icon, label, val]) => (
          <StatCard key={label} icon={Icon} label={label} value={val} />
        ))}
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <BarBox title="Visits per month (last 6)" data={monthly} color="#4F46E5" />
        <BarBox
          title="Companies by industry"
          data={countBy(rows, (r) => r.industry)}
          horizontal
          color="#F59E0B"
        />
        <BarBox
          title="Visits by state"
          data={countBy(
            visits.map((v) => byId[v.companyId]).filter(Boolean),
            (c) => c.state
          )}
          horizontal
          color="#0F172A"
        />
      </div>

      {/* Recent Visits Table / Mobile Cards Section */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 font-display">Recent Factory Visits</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Latest client consultations and onsite inspections
            </p>
          </div>
          <Link
            to="/visits"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all"
          >
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Mobile View for Recent Visits */}
        <div className="md:hidden divide-y divide-slate-100">
          {recent.map((r) => (
            <div key={r.id} className="p-3.5 space-y-2 hover:bg-slate-50/60 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/company/${r.id}`} className="font-bold text-slate-900 hover:text-indigo-600 text-sm leading-snug line-clamp-1">
                  {r.companyName}
                </Link>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{r.city}, {r.state}</span>
                <span className="font-mono text-slate-700 font-semibold">{fmt(r.lastVisit)}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-600 font-medium">{r.contactPerson || '—'}</span>
                <div className="flex items-center gap-1">
                  <MapActions c={r} compact />
                  <button
                    className="ib !p-1.5"
                    title="View details"
                    onClick={() => nav(`/company/${r.id}`)}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    className="ib !p-1.5"
                    title="Edit company"
                    onClick={() => nav(`/company/${r.id}/edit`)}
                  >
                    <Pencil size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View for Recent Visits */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                {['Company', 'Contact Person', 'Location', 'Industry', 'Last Visit', 'Actions'].map(
                  (h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="td font-bold">
                    <Link to={`/company/${r.id}`} className="text-slate-900 hover:text-indigo-600 transition-colors">
                      {r.companyName}
                    </Link>
                  </td>
                  <td className="td">{r.contactPerson || <span className="text-slate-300">—</span>}</td>
                  <td className="td font-medium text-slate-600">
                    {r.city}, {r.state}
                  </td>
                  <td className="td">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">
                      {r.industry}
                    </span>
                  </td>
                  <td className="td font-mono text-xs text-slate-600">{fmt(r.lastVisit)}</td>
                  <td className="td">
                    <span className="inline-flex items-center gap-1">
                      <button
                        className="ib"
                        title="View details"
                        onClick={() => nav(`/company/${r.id}`)}
                      >
                        <Eye size={15} />
                      </button>
                      <MapActions c={r} compact />
                      <button
                        className="ib"
                        title="Edit company"
                        onClick={() => nav(`/company/${r.id}/edit`)}
                      >
                        <Pencil size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Activity Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Clock size={16} />
            </span>
            <h3 className="font-extrabold text-sm text-slate-900 font-display">Recent Field Activity</h3>
          </div>
          <Link to="/visits" className="text-xs font-semibold text-indigo-600 hover:underline">
            History
          </Link>
        </div>

        <ol className="relative border-l border-slate-200 ml-3 space-y-4 py-1">
          {activity.map((v) => (
            <li key={v.id} className="pl-4 relative text-sm group">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-white" />
              <div className="flex flex-wrap items-center justify-between gap-1">
                <Link
                  to={`/company/${v.companyId}`}
                  className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                >
                  {byId[v.companyId]?.companyName}
                </Link>
                <span className="text-[11px] font-mono text-slate-400">{fmt(v.visitDate)}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700">{v.visitType}</span>
                {v.purpose ? ` · ${v.purpose}` : ''}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

