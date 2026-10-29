import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db.js';
import { DEFAULTS } from './repositories.js';
export function useSettings() {
  const r = useLiveQuery(() => db.settings.get('prefs'), []);
  return { ...DEFAULTS, ...(r?.value || {}) };
}
// Companies enriched with visit-derived fields (all computed, nothing stored).
export function useData() {
  const companies = useLiveQuery(() => db.companies.toArray(), []);
  const visits = useLiveQuery(() => db.visits.toArray(), []);
  return useMemo(() => {
    if (!companies || !visits) return { loading: true, companies: [], visits: [], rows: [], byId: {} };
    const rows = companies.map((c) => {
      const vs = visits.filter((v) => v.companyId === c.id).sort((a, b) => b.visitDate.localeCompare(a.visitDate));
      return { ...c, vs, lastVisit: vs[0]?.visitDate || '', firstVisit: vs[vs.length - 1]?.visitDate || '', visitCount: vs.length };
    });
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    return { loading: false, companies, visits, rows, byId };
  }, [companies, visits]);
}
