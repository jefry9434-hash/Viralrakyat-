import { createClient } from "@supabase/supabase-js";

export const VIDEO_BUCKET = "videos";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export function getVideoUrl(filePath) {
  return supabase.storage.from(VIDEO_BUCKET).getPublicUrl(filePath).data.publicUrl;
}
