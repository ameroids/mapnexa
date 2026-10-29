import { createClient } from '@supabase/supabase-js';

// Base URL clean without /rest/v1/ suffix for supabase-js client
export const SUPABASE_URL = 'https://gysktgjnbntxrhnsbwcf.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5c2t0Z2puYm50eHJobnNid2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjY1MzYsImV4cCI6MjEwODg0MjUzNn0.52to-0LX51R6ach39we1LJtbeeN6WQAsBpVRb2SRjxc';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

