import * as Updates from "expo-updates";
import { apiFetch } from "./api";
import { devTelemetry } from "./devTelemetry";

export const APP_LOCAL_VERSION = "1.0.0";

export interface OtaMetadata {
  isEnabled: boolean;
  channel: string;
  runtimeVersion: string;
  updateId: string;
  isEmbeddedLaunch: boolean;
  createdAt: string;
}

export interface OtaCheckResult {
  status: "ready" | "up-to-date" | "dev-mode" | "error";
  message: string;
}

export interface ServerVersionInfo {
  ok: boolean;
  latestVersion: string;
  minVersion: string;
  forceUpdate: boolean;
  releaseNotes: string;
  downloadUrl: string;
}

export function getOtaMetadata(): OtaMetadata {
  return {
    isEnabled: !!Updates.isEnabled,
    channel: Updates.channel || "local",
    runtimeVersion: Updates.runtimeVersion || APP_LOCAL_VERSION,
    updateId: Updates.updateId ? Updates.updateId.slice(0, 12) : "embedded",
    isEmbeddedLaunch: !!Updates.isEmbeddedLaunch,
    createdAt: Updates.createdAt ? Updates.createdAt.toLocaleDateString("ar-DZ") : "النسخة المثبتة",
  };
}

export async function checkAndDownloadOtaUpdate(): Promise<OtaCheckResult> {
  if (__DEV__ || !Updates.isEnabled) {
    return {
      status: "dev-mode",
      message: "نظام التحديث التلقائي (OTA) يعمل تلقائياً داخل النسخة المثبّتة APK/Play Store.",
    };
  }
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return {
        status: "up-to-date",
        message: "تطبيق SHAHINAZ محدّث إلى آخر نسخة متاحة ✓",
      };
    }
    const fetched = await Updates.fetchUpdateAsync();
    if (fetched.isNew) {
      return {
        status: "ready",
        message: "تم تحميل التحديث الجديد بنجاح — جاهز للتثبيت فوراً ⚡",
      };
    }
    return {
      status: "up-to-date",
      message: "التطبيق على أحدث إصدار بالفعل ✓",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "تعذر فحص التحديثات";
    devTelemetry.recordError("warn", "expo-updates", msg);
    return { status: "error", message: msg };
  }
}

export async function applyOtaUpdateNow(): Promise<void> {
  if (!Updates.isEnabled) return;
  await Updates.reloadAsync();
}

function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map((n) => parseInt(n, 10) || 0);
  const pb = b.split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
  }
  return 0;
}

export async function checkServerVersionUpdate(): Promise<ServerVersionInfo | null> {
  try {
    const info = await apiFetch<ServerVersionInfo>("/api/app/version");
    if (info?.latestVersion && compareSemver(info.latestVersion, APP_LOCAL_VERSION) > 0) {
      return info;
    }
    return null;
  } catch {
    return null;
  }
}
