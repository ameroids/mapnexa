import { db } from '../database/db.js';
import { download } from './csv.js';
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + Math.random().toString(16).slice(2));
export async function exportAll() {
  const data = { app: 'FactoryTrack', version: 1, exportedAt: new Date().toISOString(),
    companies: await db.companies.toArray(), visits: await db.visits.toArray(), settings: await db.settings.toArray() };
  download(`factorytrack-backup-${data.exportedAt.slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
}
export function validate(d) {
  if (!d || d.app !== 'FactoryTrack') return 'This is not a FactoryTrack backup file.';
  if (!Array.isArray(d.companies) || !Array.isArray(d.visits)) return 'Backup is missing companies or visits.';
  if (d.companies.some((c) => !c.id || !c.companyName)) return 'Some companies are missing an id or name.';
  if (d.visits.some((v) => !v.id || !v.companyId || !v.visitDate)) return 'Some visits are missing required fields.';
  const ids = new Set(d.companies.map((c) => c.id));
  if (d.visits.some((v) => !ids.has(v.companyId))) return 'Some visits point to companies that are not in the file.';
  return null;
}
export async function importAll(d, mode) {
  await db.transaction('rw', db.companies, db.visits, db.settings, async () => {
    if (mode === 'replace') { await db.companies.clear(); await db.visits.clear(); await db.companies.bulkPut(d.companies); await db.visits.bulkPut(d.visits);
      for (const s of d.settings || []) await db.settings.put(s); return; }
    const map = {};
    const cs = [];
    for (const c of d.companies) { const clash = await db.companies.get(c.id); const id = clash ? uid() : c.id; map[c.id] = id; cs.push({ ...c, id }); }
    const vs = [];
    for (const v of d.visits) { const clash = await db.visits.get(v.id); vs.push({ ...v, id: clash ? uid() : v.id, companyId: map[v.companyId] }); }
    await db.companies.bulkPut(cs); await db.visits.bulkPut(vs);
  });
}
