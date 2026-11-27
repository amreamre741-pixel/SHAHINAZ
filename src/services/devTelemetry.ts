import { useEffect, useState } from "react";
import { Dimensions, PixelRatio, Platform } from "react-native";

export type ErrorSeverity = "crash" | "error" | "warn" | "network";

export interface DevErrorEntry {
  id: string;
  severity: ErrorSeverity;
  source: string;
  message: string;
  stack?: string;
  time: string;
}

export interface NetworkLogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  ok: boolean;
  durationMs: number;
  error?: string;
  time: string;
}

interface TelemetryState {
  errors: DevErrorEntry[];
  networkLogs: NetworkLogEntry[];
  startedAt: number;
}

function nowTimeStr() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds()
  ).padStart(2, "0")}`;
}

class DevTelemetryEngine {
  private state: TelemetryState = {
    errors: [],
    networkLogs: [],
    startedAt: Date.now(),
  };

  private listeners = new Set<() => void>();
  private hooksInstalled = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }

  getSnapshot(): TelemetryState {
    return this.state;
  }

  recordError(severity: ErrorSeverity, source: string, message: string, stack?: string) {
    const entry: DevErrorEntry = {
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      severity,
      source,
      message: String(message || "Unknown error").slice(0, 400),
      stack: stack ? String(stack).slice(0, 600) : undefined,
      time: nowTimeStr(),
    };
    this.state = {
      ...this.state,
      errors: [entry, ...this.state.errors.slice(0, 79)],
    };
    this.emit();
  }

  recordNetwork(entry: Omit<NetworkLogEntry, "id" | "time">) {
    const full: NetworkLogEntry = {
      ...entry,
      id: `net_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      time: nowTimeStr(),
    };
    this.state = {
      ...this.state,
      networkLogs: [full, ...this.state.networkLogs.slice(0, 59)],
    };
    if (!entry.ok) {
      this.recordError(
        "network",
        `${entry.method} ${entry.path}`,
        `HTTP ${entry.status} (${entry.durationMs}ms): ${entry.error || "Request failed"}`
      );
      return;
    }
    this.emit();
  }

  clearErrors() {
    this.state = { ...this.state, errors: [] };
    this.emit();
  }

  clearNetworkLogs() {
    this.state = { ...this.state, networkLogs: [] };
    this.emit();
  }

  installGlobalHooks() {
    if (this.hooksInstalled) return;
    this.hooksInstalled = true;

    const origError = console.error.bind(console);
    const origWarn = console.warn.bind(console);

    console.error = (...args: unknown[]) => {
      try {
        const msg = args.map((a) => (a instanceof Error ? a.message : String(a))).join(" ");
        this.recordError("error", "console.error", msg);
      } catch {
        // ignore telemetry internal error
      }
      origError(...args);
    };

    console.warn = (...args: unknown[]) => {
      try {
        const msg = args.map((a) => String(a)).join(" ");
        if (!msg.includes("DevTelemetry")) {
          this.recordError("warn", "console.warn", msg);
        }
      } catch {
        // ignore
      }
      origWarn(...args);
    };

    const g = globalThis as unknown as {
      ErrorUtils?: {
        getGlobalHandler?: () => ((err: unknown, isFatal?: boolean) => void) | undefined;
        setGlobalHandler?: (fn: (err: unknown, isFatal?: boolean) => void) => void;
      };
    };

    if (g.ErrorUtils?.setGlobalHandler) {
      const prevHandler = g.ErrorUtils.getGlobalHandler?.();
      g.ErrorUtils.setGlobalHandler((err: unknown, isFatal?: boolean) => {
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        this.recordError(isFatal ? "crash" : "error", isFatal ? "FatalJS" : "GlobalJS", msg, stack);
        if (prevHandler) prevHandler(err, isFatal);
      });
    }
  }

  getDeviceSpecs() {
    const win = Dimensions.get("window");
    const scr = Dimensions.get("screen");
    return {
      os: Platform.OS,
      osVersion: String(Platform.Version),
      windowSize: `${Math.round(win.width)}×${Math.round(win.height)}`,
      screenSize: `${Math.round(scr.width)}×${Math.round(scr.height)}`,
      pixelRatio: PixelRatio.get(),
      fontScale: Number(PixelRatio.getFontScale().toFixed(2)),
      sessionUptimeSec: Math.round((Date.now() - this.state.startedAt) / 1000),
    };
  }

  buildDiagnosticReport(extra?: Record<string, unknown>) {
    const specs = this.getDeviceSpecs();
    return [
      "=== SHAHINAZ DevOS Diagnostic Report ===",
      `Generated: ${new Date().toISOString()}`,
      `OS: ${specs.os} ${specs.osVersion} | Screen: ${specs.screenSize} @${specs.pixelRatio}x`,
      `Session Uptime: ${specs.sessionUptimeSec}s`,
      `Captured Errors: ${this.state.errors.length} | Network Requests: ${this.state.networkLogs.length}`,
      extra ? `App State: ${JSON.stringify(extra)}` : "",
      "--- Recent Errors ---",
      ...(this.state.errors.length === 0
        ? ["No errors recorded ✓"]
        : this.state.errors.slice(0, 10).map((e) => `[${e.time}] (${e.severity}) ${e.source}: ${e.message}`)),
      "--- Recent Network ---",
      ...(this.state.networkLogs.length === 0
        ? ["No requests recorded"]
        : this.state.networkLogs
            .slice(0, 10)
            .map((n) => `[${n.time}] ${n.method} ${n.path} -> ${n.status} (${n.durationMs}ms)`)),
    ]
      .filter(Boolean)
      .join("\n");
  }
}

export const devTelemetry = new DevTelemetryEngine();

export function useDevTelemetry() {
  const [snap, setSnap] = useState(() => devTelemetry.getSnapshot());
  useEffect(() => {
    setSnap(devTelemetry.getSnapshot());
    return devTelemetry.subscribe(() => setSnap(devTelemetry.getSnapshot()));
  }, []);
  return snap;
}
