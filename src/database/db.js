import Dexie from 'dexie';
export const db = new Dexie('factorytrack');
db.version(3).stores({
  companies: 'id, companyName, ownerName, city, state, industry, createdAt',
  visits: 'id, companyId, visitDate, createdAt',
  users: 'id, name, email, role, createdAt',
  settings: 'key'
});
