import { createClient } from "@supabase/supabase-js";

// Server-only client: the secret key bypasses row level security, so never import this in a client component.
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
