import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const PALETTE = ['#4F46E5', '#06B6D4', '#F59E0B', '#10B981', '#8B5CF6', '#64748B'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-obsidian-900/95 text-white backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/80 shadow-xl text-xs font-medium">
        <p className="text-slate-400 text-[11px] mb-1 font-semibold">{label}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="font-bold text-white text-sm">{payload[0].value}</span>
          <span className="text-slate-400 text-[11px]">records</span>
        </div>
      </div>
    );
  }
  return null;
};

export function BarBox({ title, data, horizontal, color = '#4F46E5' }) {
  const gradId = `grad-${title.replace(/[^a-zA-Z0-9]/g, '')}`;
  const isAmber = color === '#C47A45' || color === '#F59E0B';
  const isDark = color === '#123C3A' || color === '#0F172A';

  const stop1 = isAmber ? '#F59E0B' : isDark ? '#334155' : '#6366F1';
  const stop2 = isAmber ? '#D97706' : isDark ? '#0F172A' : '#3B82F6';

  return (
    <div className="card p-5 hover:border-slate-300 transition-all">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-extrabold text-slate-800 font-display tracking-tight">{title}</h3>
        <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {data.length} categories
        </span>
      </div>

      {data.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center font-medium">No activity recorded yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(240, horizontal ? data.length * 32 : 240)}>
          <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 30 : 0, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2={horizontal ? '1' : '0'} y2={horizontal ? '0' : '1'}>
                <stop offset="0%" stopColor={stop1} stopOpacity={0.9} />
                <stop offset="100%" stopColor={stop2} stopOpacity={1} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal ? false : true} />
            {horizontal ? (
              <>
                <XAxis type="number" allowDecimals={false} fontSize={11} stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={115} fontSize={11} stroke="#64748B" tickLine={false} axisLine={false} />
              </>
            ) : (
              <>
                <XAxis dataKey="name" fontSize={11} stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={11} stroke="#94A3B8" tickLine={false} axisLine={false} />
              </>
            )}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.04)', radius: 8 }} />
            <Bar dataKey="value" name="Count" fill={`url(#${gradId})`} radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export const countBy = (arr, fn, top = 8) =>
  Object.entries(
    arr.reduce((m, x) => {
      const k = fn(x) || 'Unspecified';
      m[k] = (m[k] || 0) + 1;
      return m;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top);

