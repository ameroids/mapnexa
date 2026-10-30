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

    // If Supabase returned data successfully, make IndexedDB match Supabase exactly
    if (!cRes.error && Array.isArray(cRes.data)) {
      const serverCompanies = cRes.data;
      const localCompanies = await db.companies.toArray();
      const serverIds = new Set(serverCompanies.map((c) => c.id));
      
      // Remove any local record that no longer exists on Supabase (e.g. old demo data)
      const toDelete = localCompanies.filter((c) => !serverIds.has(c.id)).map((c) => c.id);
      if (toDelete.length > 0) {
        await db.companies.bulkDelete(toDelete);
      }
      if (serverCompanies.length > 0) {
        await db.companies.bulkPut(serverCompanies);
      }
    }

    if (!vRes.error && Array.isArray(vRes.data)) {
      const serverVisits = vRes.data;
      const localVisits = await db.visits.toArray();
      const serverIds = new Set(serverVisits.map((v) => v.id));

      const toDeleteVisits = localVisits.filter((v) => !serverIds.has(v.id)).map((v) => v.id);
      if (toDeleteVisits.length > 0) {
        await db.visits.bulkDelete(toDeleteVisits);
      }
      if (serverVisits.length > 0) {
        await db.visits.bulkPut(serverVisits);
      }
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
  // Try fetching latest records from Supabase
  await syncFromSupabase();
  await db.settings.put({ key: 'seeded', value: true });
}

export async function clearDemoData() {
  // Delete all demo records (whose ID starts with 'demo-') from local IndexedDB
  const allCompanies = await db.companies.toArray();
  const demoCompanyIds = allCompanies.filter(c => String(c.id).startsWith('demo-')).map(c => c.id);

  const allVisits = await db.visits.toArray();
  const demoVisitIds = allVisits.filter(v => String(v.id).startsWith('demo-') || demoCompanyIds.includes(v.companyId)).map(v => v.id);

  await db.transaction('rw', db.companies, db.visits, async () => {
    if (demoVisitIds.length > 0) {
      await db.visits.bulkDelete(demoVisitIds);
    }
    if (demoCompanyIds.length > 0) {
      await db.companies.bulkDelete(demoCompanyIds);
    }
  });

  // Also remove demo records from Supabase
  try {
    if (demoVisitIds.length > 0) {
      await supabase.from('visits').delete().in('id', demoVisitIds);
    }
    if (demoCompanyIds.length > 0) {
      await supabase.from('companies').delete().in('id', demoCompanyIds);
    }
    // Safety check: also remove by prefix pattern on Supabase if any exist
    await supabase.from('visits').delete().like('id', 'demo-%');
    await supabase.from('companies').delete().like('id', 'demo-%');
  } catch (e) {
    console.warn('Supabase clearDemoData warning:', e);
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
