-- ====================================================================
-- FACTORYTRACK SUPABASE DATABASE SCHEMA
-- Run this complete script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ====================================================================

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  "companyName" TEXT NOT NULL,
  "ownerName" TEXT DEFAULT '',
  "ownerContact" TEXT DEFAULT '',
  "ownerContact2" TEXT DEFAULT '',
  city TEXT DEFAULT '',
  "siteAddress" TEXT DEFAULT '',
  "contactPersonName" TEXT DEFAULT '',
  "contactPersonNumber" TEXT DEFAULT '',
  "factoryName" TEXT DEFAULT '',
  industry TEXT DEFAULT 'Manufacturing',
  "contactPerson" TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  products JSONB DEFAULT '[]'::jsonb,
  description TEXT DEFAULT '',
  "addressLine1" TEXT DEFAULT '',
  "addressLine2" TEXT DEFAULT '',
  state TEXT DEFAULT '',
  "pinCode" TEXT DEFAULT '',
  country TEXT DEFAULT 'India',
  "googleMapsUrl" TEXT DEFAULT '',
  latitude NUMERIC,
  longitude NUMERIC,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Visits Table
CREATE TABLE IF NOT EXISTS public.visits (
  id TEXT PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  "visitDate" DATE NOT NULL,
  "visitType" TEXT DEFAULT 'First Visit',
  "whichProductUsing" TEXT DEFAULT '',
  "suggestedProduct" TEXT DEFAULT '',
  "samplesGiven" JSONB DEFAULT '[]'::jsonb,
  "samplesGivenOther" TEXT DEFAULT '',
  "testingDoneAtSite" TEXT DEFAULT '',
  note TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  "productsDiscussed" JSONB DEFAULT '[]'::jsonb,
  "businessOpportunities" TEXT DEFAULT '',
  "meetingNotes" TEXT DEFAULT '',
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Users & Credentials Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  "avatarText" TEXT DEFAULT 'U',
  permissions JSONB DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create App Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Allow Anonymous Read/Write with Anon Key
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow anon public access policies
CREATE POLICY "Allow anon read companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Allow anon insert companies" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update companies" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete companies" ON public.companies FOR DELETE USING (true);

CREATE POLICY "Allow anon read visits" ON public.visits FOR SELECT USING (true);
CREATE POLICY "Allow anon insert visits" ON public.visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update visits" ON public.visits FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete visits" ON public.visits FOR DELETE USING (true);

CREATE POLICY "Allow anon read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete users" ON public.users FOR DELETE USING (true);

CREATE POLICY "Allow anon read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow anon insert settings" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update settings" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete settings" ON public.settings FOR DELETE USING (true);

-- 6. Insert Default Admin and Field User Accounts
INSERT INTO public.users (id, name, username, password, email, role, "avatarText", permissions)
VALUES
(
  'user-admin',
  'Admin Manager',
  'admin',
  'admin123',
  'admin@factorytrack.com',
  'admin',
  'AD',
  '{"canAddVisit": true, "canViewMap": true, "canViewCompanies": true, "canEditCompany": true, "canDeleteCompany": true, "canViewVisits": true, "canEditVisit": true, "canViewReports": true, "canAccessSettings": true}'::jsonb
),
(
  'user-field',
  'Field Executive',
  'field',
  'field123',
  'field@factorytrack.com',
  'user',
  'FE',
  '{"canAddVisit": true, "canViewMap": true, "canViewCompanies": true, "canEditCompany": false, "canDeleteCompany": false, "canViewVisits": true, "canEditVisit": false, "canViewReports": false, "canAccessSettings": false}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  password = EXCLUDED.password,
  permissions = EXCLUDED.permissions;

-- 7. Insert Default Preferences
INSERT INTO public.settings (key, value)
VALUES (
  'prefs',
  '{"appName": "FactoryTrack", "defaultVisitType": "First Visit", "defaultTravelMode": "driving"}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

