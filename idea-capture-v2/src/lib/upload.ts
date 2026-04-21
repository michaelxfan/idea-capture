import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Upload a file to Supabase Storage and return its public URL.
 * Falls back to a base64 data URL if Supabase isn't configured.
 */
export async function uploadImage(file: File): Promise<string> {
  // Generate a unique filename
  const ext = file.name.split(".").pop() || "png";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `tasks/${name}`;

  if (!supabase) {
    // Fallback: convert to data URL
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const { error } = await supabase.storage
    .from("attachments")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload image");
  }

  const { data } = supabase.storage.from("attachments").getPublicUrl(path);
  return data.publicUrl;
}
