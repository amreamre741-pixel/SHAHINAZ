import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useApp } from "../../store/AppContext";
import { API_BASE } from "../../services/api";
import { devTelemetry, useDevTelemetry } from "../../services/devTelemetry";

const PRESETS: { label: string; method: "GET" | "POST" | "DELETE"; path: string; body?: string }[] = [
  { label: "GET · فحص السيرفر", method: "GET", path: "/api/health" },
  { label: "GET · Neon Admin", method: "GET", path: "/api/admin/overview" },
  { label: "GET · إصدار التطبيق", method: "GET", path: "/api/app/version" },
  { label: "GET · المنشورات", method: "GET", path: "/api/posts" },
  {
    label: "POST · تحديث الإصدار",
    method: "POST",
    path: "/api/admin/app/version",
    body: JSON.stringify({ latestVersion: "1.0.0", forceUpdate: false, releaseNotes: "تحديث SHAHINAZ OTA ⚡" }, null, 2),
  },
];

export default function NetworkPanel({ onToast }: { onToast: (msg: string) => void }) {
  const { token, adminPin } = useApp();
  const { networkLogs } = useDevTelemetry();

  const [method, setMethod] = useState<"GET" | "POST" | "DELETE">("GET");
  const [path, setPath] = useState("/api/health");
  const [bodyStr, setBodyStr] = useState("");
  const [busy, setBusy] = useState(false);
  const [resp, setResp] = useState<{ status: number; ms: number; body: string } | null>(null);

  async function sendTestRequest() {
    const cleanPath = path.trim().startsWith("/") ? path.trim() : `/${path.trim()}`;
    setBusy(true);
    const start = Date.now();
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-admin-pin": adminPin,
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const init: RequestInit = { method, headers };
      if (method === "POST" && bodyStr.trim()) {
        init.body = bodyStr.trim();
      }
      const res = await fetch(`${API_BASE}${cleanPath}`, init);
      const ms = Date.now() - start;
      const raw = await res.text();
      let formatted = raw;
      try {
        formatted = JSON.stringify(JSON.parse(raw), null, 2);
      } catch {
        // plain text response
      }
      devTelemetry.recordNetwork({
        method,
        path: cleanPath,
        status: res.status,
        ok: res.ok,
        durationMs: ms,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      });
      setResp({ status: res.status, ms, body: formatted.slice(0, 2200) });
      onToast(res.ok ? `✅ HTTP ${res.status} (${ms} ms)` : `⚠️ HTTP ${res.status} (${ms} ms) — تحقق من نوع الطلب`);
    } catch (err) {
      const ms = Date.now() - start;
      const msg = err instanceof Error ? err.message : "Network error";
      devTelemetry.recordNetwork({ method, path: cleanPath, status: 0, ok: false, durationMs: ms, error: msg });
      setResp({ status: 0, ms, body: msg });
      onToast("❌ فشل الاتصال بالشبكة");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 12 }}>
      {/* Built-in Postman API Playground */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ مختبر الـ API المباشر (Built-in Postman)</Text>
        <Text style={styles.sub}>
          اختر أحد القوالب الجاهزة بالأسفل (GET للقراءة · POST للإرسال · DELETE للحذف):
        </Text>

        {/* Quick Presets */}
        <View style={styles.rowWrap}>
          {PRESETS.map((p) => (
            <TouchableOpacity
              key={`${p.method}_${p.path}`}
              style={[
                styles.presetChip,
                method === p.method && path === p.path && { backgroundColor: COLORS.primary },
              ]}
              onPress={() => {
                setMethod(p.method);
                setPath(p.path);
                setBodyStr(p.body || "");
              }}
            >
              <Text style={styles.presetTxt}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Method Selector */}
        <View style={styles.row}>
          {(["GET", "POST", "DELETE"] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodActive]}
              onPress={() => setMethod(m)}
            >
              <Text style={[styles.methodTxt, method === m && { color: "#fff" }]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="/api/health"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          value={path}
          onChangeText={setPath}
        />

        {method === "POST" && (
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top", fontFamily: "monospace", fontSize: 11.5 }]}
            placeholder='{"key": "value"}'
            placeholderTextColor={COLORS.muted}
            multiline
            autoCapitalize="none"
            value={bodyStr}
            onChangeText={setBodyStr}
          />
        )}

        <TouchableOpacity style={styles.sendBtn} onPress={sendTestRequest} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="flash" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>إرسال الطلب الآن</Text>
            </>
          )}
        </TouchableOpacity>

        {resp && (
          <View style={styles.respBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text
                style={{
                  color: resp.status >= 200 && resp.status < 300 ? COLORS.success : COLORS.danger,
                  fontWeight: "800",
                  fontSize: 12,
                }}
              >
                STATUS: {resp.status || "ERR"}
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 11.5 }}>{resp.ms} ms</Text>
            </View>
            <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
              <Text style={styles.codeText}>{resp.body}</Text>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Live Network Traffic Monitor */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>🌐 سجل طلبات الشبكة الحي ({networkLogs.length})</Text>
          {networkLogs.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                devTelemetry.clearNetworkLogs();
                onToast("✓ تم مسح سجل الشبكة");
              }}
            >
              <Text style={{ color: COLORS.muted, fontSize: 11.5, fontWeight: "700" }}>مسح السجل</Text>
            </TouchableOpacity>
          )}
        </View>

        {networkLogs.length === 0 ? (
          <Text style={styles.empty}>لم يتم تسجيل أي طلب شبكة بعد — جرّب إرسال طلب أعلاه!</Text>
        ) : (
          networkLogs.map((n) => (
            <View key={n.id} style={styles.netRow}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
                  <View style={[styles.statusBadge, { backgroundColor: n.ok ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.2)" }]}>
                    <Text style={{ color: n.ok ? COLORS.success : COLORS.danger, fontSize: 10.5, fontWeight: "800" }}>
                      {n.status || "ERR"}
                    </Text>
                  </View>
                  <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: "800" }}>{n.method}</Text>
                  <Text style={{ color: COLORS.text, fontSize: 11.5, flex: 1 }} numberOfLines={1}>
                    {n.path}
                  </Text>
                </View>
                <Text style={{ color: COLORS.muted, fontSize: 10.5 }}>{n.durationMs}ms</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 3 }}>
                <Text style={{ color: COLORS.muted, fontSize: 10 }}>{n.time}</Text>
                {!!n.error && <Text style={{ color: COLORS.danger, fontSize: 10.5 }}>{n.error}</Text>}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 14.5, fontWeight: "800", textAlign: "right" },
  sub: { color: COLORS.muted, fontSize: 11.5, textAlign: "right", lineHeight: 17 },
  rowWrap: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  presetChip: {
    backgroundColor: "rgba(168,85,247,0.16)",
    borderColor: COLORS.primary,
    borderWidth: 0.5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  presetTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  row: { flexDirection: "row", gap: 6 },
  methodBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  methodActive: { backgroundColor: COLORS.verified, borderColor: COLORS.verified },
  methodTxt: { color: COLORS.muted, fontSize: 11.5, fontWeight: "800" },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  sendBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 11,
  },
  respBox: {
    backgroundColor: "#060609",
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  codeText: { color: "#86efac", fontSize: 11, fontFamily: "monospace" },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 12, fontSize: 12.5 },
  netRow: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 9,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
});
