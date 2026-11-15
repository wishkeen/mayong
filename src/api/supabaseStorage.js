import { requireSupabase } from "@/api/supabaseClient";

const BUCKET = "ritual-assets";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

export async function uploadRitualAsset(file) {
  if (!(file instanceof File)) throw new Error("Choose a file to upload.");
  if (file.size > MAX_FILE_SIZE) throw new Error("Files must be 25 MB or smaller.");
  if (!file.type.startsWith("image/") && !file.type.startsWith("audio/")) {
    throw new Error("Only image and audio files are supported.");
  }

  const client = requireSupabase();
  const extension = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error("The uploaded file URL could not be created.");
  return { file_url: data.publicUrl };
}
