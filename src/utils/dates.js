const loc = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const today = () => loc(new Date());
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return loc(d); };
export const fmt = (s) => s ? new Date(s + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const lastMonths = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (n - 1 - i)); return loc(d).slice(0, 7); });
export const monthLabel = (k) => new Date(k + '-01T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
export const fuState = (v) => {
  if (!v || v.followUpStatus === 'Not Required' || !v.followUpStatus) return 'None';
  if (v.followUpStatus === 'Completed') return 'Completed';
  if (!v.followUpDate) return 'No Date';
  const t = today();
  return v.followUpDate < t ? 'Overdue' : v.followUpDate === t ? 'Due Today' : 'Upcoming';
};
