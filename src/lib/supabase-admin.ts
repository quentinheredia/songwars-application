import { createClient } from "@supabase/supabase-js";

export const TRACK_BUCKET = "artist-tracks";
export const MAX_TRACK_SIZE = 10 * 1024 * 1024;
export const ACCEPTED_TRACK_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/aac",
] as const;

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function ensureTrackBucket() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.getBucket(TRACK_BUCKET);

  if (data) return supabase;
  if (error && !error.message.toLowerCase().includes("not found")) {
    throw error;
  }

  const { error: createError } = await supabase.storage.createBucket(
    TRACK_BUCKET,
    {
      public: false,
      fileSizeLimit: MAX_TRACK_SIZE,
      allowedMimeTypes: [...ACCEPTED_TRACK_TYPES],
    },
  );

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw createError;
  }

  return supabase;
}
