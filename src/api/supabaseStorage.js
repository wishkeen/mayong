import { requireSupabase } from "@/api/supabaseClient";

const BUCKET = "ritual-assets";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;
const MAX_BRAND_IMAGE_SIZE = 5 * 1024 * 1024;

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

export async function uploadProfileAvatar(file, userId) {
  if (!(file instanceof File)) throw new Error("Choose an image to upload.");
  if (!userId) throw new Error("Sign in before updating your profile photo.");
  if (file.size > MAX_AVATAR_FILE_SIZE) throw new Error("Profile photos must be 5 MB or smaller.");

  const allowedTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("Use a JPG, PNG, WebP, or GIF image.");

  const client = requireSupabase();
  const path = `avatars/${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    const { error: cleanupError } = await client.storage.from(BUCKET).remove([path]);
    if (cleanupError) console.error("Could not remove the uploaded avatar after URL creation failed:", cleanupError);
    throw new Error("The uploaded profile photo URL could not be created.");
  }
  return { file_url: data.publicUrl };
}

export async function removeProfileAvatar(avatarUrl, userId) {
  if (!avatarUrl || !userId) return;
  const client = requireSupabase();
  const ownAvatarBase = client.storage.from(BUCKET).getPublicUrl(`avatars/${userId}/avatar`).data.publicUrl;
  const publicPrefix = ownAvatarBase.slice(0, ownAvatarBase.lastIndexOf("/") + 1);
  if (!avatarUrl.startsWith(publicPrefix)) return;

  const path = avatarUrl.slice(publicPrefix.length).split("?")[0];
  if (!path || path.includes("/") || path.includes("..")) return;
  const { error } = await client.storage.from(BUCKET).remove([`avatars/${userId}/${path}`]);
  if (error) throw error;
}

export async function uploadBrandImage(file) {
  if (!(file instanceof File)) throw new Error("Choose an image to upload.");
  if (file.size > MAX_BRAND_IMAGE_SIZE) throw new Error("Brand images must be 5 MB or smaller.");

  const allowedTypes = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["image/x-icon", "ico"],
    ["image/vnd.microsoft.icon", "ico"],
  ]);
  const extension = allowedTypes.get(file.type);
  if (!extension) throw new Error("Use a JPG, PNG, WebP, GIF, or ICO image.");

  const client = requireSupabase();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError) throw authError;
  if (!user) throw new Error("Sign in as an administrator to upload brand images.");
  const { data: isAdmin, error: roleError } = await client.rpc("is_admin");
  if (roleError) throw roleError;
  if (!isAdmin) throw new Error("Administrator access is required to upload brand images.");

  const path = `branding/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  if (!data?.publicUrl) {
    const { error: cleanupError } = await client.storage.from(BUCKET).remove([path]);
    if (cleanupError) console.error("Could not remove a brand image after URL creation failed:", cleanupError);
    throw new Error("The uploaded image URL could not be created.");
  }
  return data.publicUrl;
}

export async function removeBrandImage(imageUrl) {
  if (!imageUrl) return;
  const client = requireSupabase();
  const bucketUrl = client.storage.from(BUCKET).getPublicUrl("branding/asset").data.publicUrl;
  const publicPrefix = bucketUrl.slice(0, bucketUrl.lastIndexOf("/") + 1);
  if (!imageUrl.startsWith(publicPrefix)) return;

  const path = imageUrl.slice(publicPrefix.length).split("?")[0];
  if (!path.startsWith("branding/") || path.includes("..") || path.includes("\\")) return;
  const { error } = await client.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
