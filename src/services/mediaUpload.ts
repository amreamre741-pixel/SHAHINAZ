import * as FileSystem from "expo-file-system";
import { apiFetch } from "./api";

/**
 * Uploads a local file:// photo, video, or voice note to SHAHINAZ's real HTTPS
 * streaming endpoint (/api/media/upload) so Android ExoPlayer & Audio.Sound can
 * stream it natively across all devices without data-URI errors.
 */
export async function uploadMediaFile(
  localUri: string,
  mimeType: "image/jpeg" | "video/mp4" | "audio/m4a",
  token: string | null
): Promise<string> {
  if (!localUri) return "";
  if (localUri.startsWith("http://") || localUri.startsWith("https://")) {
    return localUri;
  }
  if (!token) return localUri;

  try {
    const info = await FileSystem.getInfoAsync(localUri);
    const maxBytes = mimeType === "video/mp4" ? 18 * 1024 * 1024 : 8 * 1024 * 1024;
    if (info.exists && info.size && info.size > maxBytes) {
      return localUri;
    }
    const base64 = await FileSystem.readAsStringAsync(localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const res = await apiFetch<{ ok: boolean; url: string }>("/api/media/upload", token, {
      method: "POST",
      body: JSON.stringify({ base64, mimeType }),
    });
    if (res?.url) return res.url;
  } catch {
    // Fallback to local URI if offline
  }
  return localUri;
}
