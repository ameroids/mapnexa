import { db } from './db.js';
import { supabase } from './supabaseClient.js';
import { buildDemo } from './seed.js';

const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + Math.random().toString(16).slice(2);
const now = () => new Date().toISOString();

export const DEFAULTS = {
  appName: 'MapNexa',
  defaultVisitType: 'First Visit',
  defaultTravelMode: 'driving',
};

// ----------------- SETTINGS -----------------
export const getSettings = async () => {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('key', 'prefs').maybeSingle();
    if (!error && data?.value) {
      // Also cache in IndexedDB
      await db.settings.put({ key: 'prefs', value: data.value });
      return { ...DEFAULTS, ...data.value };
    }
  } catch (e) {
    console.warn('Supabase getSettings error, falling back to local DB:', e);
  }
  const r = await db.settings.get('prefs');
  return { ...DEFAULTS, ...(r?.value || {}) };
};

export const saveSettings = async (v) => {
  // Save local
  await db.settings.put({ key: 'prefs', value: v });
  // Sync to Supabase
  try {
    await supabase.from('settings').upsert({ key: 'prefs', value: v, updatedAt: now() });
  } catch (e) {
    console.warn('Supabase saveSettings error:', e);
  }
};

// ----------------- COMPANIES -----------------
export async function saveCompany(data) {
  const rec = {
    ...data,
    id: data.id || uid(),
    updatedAt: now(),
    createdAt: data.createdAt || now(),
  };

  // Save to Dexie local DB immediately for zero latency
  await db.companies.put(rec);

  // Sync to Supabase
  try {
    const payload = {
      id: rec.id,
      companyName: rec.companyName || '',
      ownerName: rec.ownerName || '',
      ownerContact: rec.ownerContact || '',
      ownerContact2: rec.ownerContact2 || '',
      city: rec.city || '',
      siteAddress: rec.siteAddress || '',
      contactPersonName: rec.contactPersonName || '',
      contactPersonNumber: rec.contactPersonNumber || '',
      factoryName: rec.factoryName || '',
      industry: rec.industry || 'Manufacturing',
      contactPerson: rec.contactPerson || '',
      designation: rec.designation || '',
      phone: rec.phone || '',
      email: rec.email || '',
      website: rec.website || '',
      products: rec.products || [],
      description: rec.description || '',
      addressLine1: rec.addressLine1 || '',
      addressLine2: rec.addressLine2 || '',
      state: rec.state || '',
      pinCode: rec.pinCode || '',
      country: rec.country || 'India',
      googleMapsUrl: rec.googleMapsUrl || '',
      latitude: rec.latitude === '' || rec.latitude == null ? null : Number(rec.latitude),
      longitude: rec.longitude === '' || rec.longitude == null ? null : Number(rec.longitude),
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
    const { error } = await supabase.from('companies').upsert(payload);
    if (error) console.error('Supabase saveCompany error:', error);
  } catch (e) {
    console.warn('Supabase sync error on saveCompany:', e);
  }

  return rec;
}

export async function deleteCompany(id) {
  await db.transaction('rw', db.companies, db.visits, async () => {
    await db.visits.where('companyId').equals(id).delete();
    await db.companies.delete(id);
  });

  try {
    await supabase.from('visits').delete().eq('companyId', id);
    await supabase.from('companies').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase deleteCompany error:', e);
  }
}

// ----------------- VISITS -----------------
export async function saveVisit(data) {
  const rec = {
    ...data,
    id: data.id || uid(),
    updatedAt: now(),
    createdAt: data.createdAt || now(),
  };

  // Save to Dexie local DB
  await db.visits.put(rec);

  // Sync to Supabase
  try {
    const payload = {
      id: rec.id,
      companyId: rec.companyId,
      visitDate: rec.visitDate,
      visitType: rec.visitType || 'First Visit',
      whichProductUsing: rec.whichProductUsing || '',
      suggestedProduct: rec.suggestedProduct || '',
      samplesGiven: rec.samplesGiven || [],
      samplesGivenOther: rec.samplesGivenOther || '',
      testingDoneAtSite: rec.testingDoneAtSite || '',
      note: rec.note || '',
      purpose: rec.purpose || '',
      productsDiscussed: rec.productsDiscussed || [],
      businessOpportunities: rec.businessOpportunities || '',
      meetingNotes: rec.meetingNotes || '',
      createdAt: rec.createdAt,
      updatedAt: rec.updatedAt,
    };
    const { error } = await supabase.from('visits').upsert(payload);
    if (error) console.error('Supabase saveVisit error:', error);
  } catch (e) {
    console.warn('Supabase sync error on saveVisit:', e);
  }

  return rec;
}

export async function deleteVisit(id) {
  await db.visits.delete(id);
  try {
    await supabase.from('visits').delete().eq('id', id);
  } catch (e) {
    console.warn('Supabase deleteVisit error:', e);
  }
}

// ----------------- SEED & SYNC -----------------
export async function syncFromSupabase() {
  try {
    const [cRes, vRes, sRes] = await Promise.all([
      supabase.from('companies').select('*'),
      supabase.from('visits').select('*'),
      supabase.from('settings').select('*'),
    ]);

    if (!cRes.error && cRes.data?.length > 0) {
      await db.companies.bulkPut(cRes.data);
    }
    if (!vRes.error && vRes.data?.length > 0) {
      await db.visits.bulkPut(vRes.data);
    }
    if (!sRes.error && sRes.data?.length > 0) {
      for (const s of sRes.data) {
        await db.settings.put(s);
      }
    }
  } catch (err) {
    console.warn('Initial Supabase fetch warning:', err);
  }
}

export async function seedIfNeeded() {
  // First try fetching latest records from Supabase
  await syncFromSupabase();

  const count = await db.companies.count();
  if (count === 0) {
    // If Supabase and local DB are both empty, seed demo dataset
    const d = buildDemo();
    await db.companies.bulkPut(d.companies);
    await db.visits.bulkPut(d.visits);

    // Also push demo dataset to Supabase so it's populated there!
    try {
      await supabase.from('companies').upsert(d.companies);
      await supabase.from('visits').upsert(d.visits);
    } catch (e) {
      console.warn('Failed to push initial demo data to Supabase:', e);
    }
  }
  await db.settings.put({ key: 'seeded', value: true });
}

export async function restoreDemo() {
  const d = buildDemo();
  await db.transaction('rw', db.companies, db.visits, async () => {
    await db.companies.bulkPut(d.companies);
    await db.visits.bulkPut(d.visits);
  });

  try {
    await supabase.from('companies').upsert(d.companies);
    await supabase.from('visits').upsert(d.visits);
  } catch (e) {
    console.warn('Supabase restoreDemo error:', e);
  }
}

export async function clearAll() {
  await db.transaction('rw', db.companies, db.visits, async () => {
    await db.companies.clear();
    await db.visits.clear();
  });

  try {
    await supabase.from('visits').delete().neq('id', 'dummy');
    await supabase.from('companies').delete().neq('id', 'dummy');
  } catch (e) {
    console.warn('Supabase clearAll error:', e);
  }
}
