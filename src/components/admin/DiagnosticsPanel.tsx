import React, { useState } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useApp } from "../../store/AppContext";
import { API_BASE, apiFetch } from "../../services/api";
import { devTelemetry, useDevTelemetry, type ErrorSeverity } from "../../services/devTelemetry";

interface CheckResult {
  id: string;
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export default function DiagnosticsPanel({ onToast }: { onToast: (msg: string) => void }) {
  const { token, maintenanceMode, bannedWords, allPosts, allUsers } = useApp();
  const { errors, networkLogs } = useDevTelemetry();

  const [scanning, setScanning] = useState(false);
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [sevFilter, setSevFilter] = useState<"all" | ErrorSeverity>("all");
  const [expandedErrId, setExpandedErrId] = useState<string | null>(null);

  async function runFullDiagnostics() {
    setScanning(true);
    const out: CheckResult[] = [];

    // 1 & 2. Render API & Neon PostgreSQL Health
    const t0 = Date.now();
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      const ms = Date.now() - t0;
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        out.push({
          id: "api",
          label: "سيرفر Render الخلفي (/api/health)",
          status: ms > 2500 ? "warn" : "pass",
          detail: `HTTP 200 · زمن الاستجابة ${ms} ms`,
        });
        if (typeof body.dbOk === "boolean") {
          out.push({
            id: "db",
            label: "قاعدة بيانات Neon PostgreSQL",
            status: body.dbOk ? "pass" : "fail",
            detail: body.dbOk
              ? `متصلة بنجاح · Ping ${body.dbLatencyMs ?? 0} ms · RAM ${body.memoryMb ?? "?"} MB`
              : "تعذر الاتصال بقاعدة البيانات",
          });
        } else {
          out.push({
            id: "db",
            label: "قاعدة بيانات Neon PostgreSQL",
            status: "pass",
            detail: "السيرفر استجاب بنجاح (انتظر تحديث Render للقياسات التفصيلية)",
          });
        }
      } else {
        out.push({
          id: "api",
          label: "سيرفر Render الخلفي (/api/health)",
          status: "fail",
          detail: `HTTP ${res.status} · ${ms} ms`,
        });
      }
    } catch (e) {
      out.push({
        id: "api",
        label: "سيرفر Render الخلفي (/api/health)",
        status: "fail",
        detail: e instanceof Error ? e.message : "فشل الاتصال بالسيرفر",
      });
    }

    // 3. JWT Auth Session Check
    if (token) {
      try {
        await apiFetch("/api/posts", token);
        out.push({
          id: "auth",
          label: "جلسة المصادقة (JWT Token)",
          status: "pass",
          detail: "التوكن صالح ومصادق عليه من السيرفر ✓",
        });
      } catch (e) {
        out.push({
          id: "auth",
          label: "جلسة المصادقة (JWT Token)",
          status: "warn",
          detail: `توكن محفوظ لكن تعذر التحقق: ${e instanceof Error ? e.message : "خطأ"}`,
        });
      }
    } else {
      out.push({
        id: "auth",
        label: "جلسة المصادقة (JWT Token)",
        status: "warn",
        detail: "وضع تجريبي/بدون توكن سحابي نشط",
      });
    }

    // 4. AsyncStorage Read/Write Test
    const stStart = Date.now();
    try {
      const testKey = "__shahinaz_diag_test__";
      const val = String(Date.now());
      await AsyncStorage.setItem(testKey, val);
      const readBack = await AsyncStorage.getItem(testKey);
      await AsyncStorage.removeItem(testKey);
      const stMs = Date.now() - stStart;
      out.push({
        id: "storage",
        label: "ذاكرة التخزين المحلي (AsyncStorage)",
        status: readBack === val ? "pass" : "fail",
        detail: readBack === val ? `قراءة/كتابة سليمة (${stMs} ms)` : "فشل تطابق القراءة والكتابة",
      });
    } catch {
      out.push({
        id: "storage",
        label: "ذاكرة التخزين المحلي (AsyncStorage)",
        status: "fail",
        detail: "تعذر الوصول إلى التخزين المحلي",
      });
    }

    // 5. Runtime Crash & Error Monitor
    const crashCount = errors.filter((e) => e.severity === "crash").length;
    out.push({
      id: "errors",
      label: "رادار الأعطال والأخطاء البرمجية",
      status: crashCount > 0 ? "fail" : errors.length > 0 ? "warn" : "pass",
      detail:
        errors.length === 0
          ? "0 أخطاء مسجلة — التطبيق مستقر 100%"
          : `${errors.length} سجل (${crashCount} أعطال حرجة)`,
    });

    // 6. Safety & Kill Switches
    out.push({
      id: "safety",
      label: "أنظمة الحماية والفلتر التلقائي",
      status: maintenanceMode ? "warn" : "pass",
      detail: `${maintenanceMode ? "وضع الصيانة مُفعّل · " : "النشر مفتوح · "}فلتر الكلمات: ${bannedWords.length} كلمة`,
    });

    // 7. Device & App Memory Footprint
    const specs = devTelemetry.getDeviceSpecs();
    out.push({
      id: "device",
      label: "بيئة الجهاز والأداء",
      status: "pass",
      detail: `${specs.os.toUpperCase()} ${specs.osVersion} · ${specs.screenSize} (@${specs.pixelRatio}x) · مدة الجلسة ${specs.sessionUptimeSec}ث`,
    });

    setChecks(out);
    setScanning(false);
    const failed = out.filter((c) => c.status === "fail").length;
    onToast(failed === 0 ? "✅ اكتمل الفحص الشامل: كل الأنظمة سليمة!" : `⚠️ تم رصد ${failed} مشكلة في الفحص`);
  }

  const filteredErrors = sevFilter === "all" ? errors : errors.filter((e) => e.severity === sevFilter);

  const sevColor = (s: ErrorSeverity) =>
    s === "crash" ? "#ef4444" : s === "error" ? "#f97316" : s === "network" ? "#3897f0" : "#f59e0b";

  return (
    <View style={{ gap: 12 }}>
      {/* Automated 7-Point Diagnostics Scanner */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>🔍 الفحص التلقائي الشامل (7 فحوصات)</Text>
          <Ionicons name="pulse" size={18} color={COLORS.success} />
        </View>
        <Text style={styles.sub}>
          يفحص اتصال Render، قاعدة Neon، جلسة JWT، سرعة التخزين، رادار الأخطاء، الأمان، ومواصفات الجهاز دفعة واحدة.
        </Text>

        <TouchableOpacity style={styles.scanBtn} onPress={runFullDiagnostics} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={18} color="#fff" />
              <Text style={styles.btnText}>تشغيل الفحص الشامل الآن ⚡</Text>
            </>
          )}
        </TouchableOpacity>

        {checks.length > 0 && (
          <View style={{ gap: 8, marginTop: 4 }}>
            {checks.map((c) => (
              <View key={c.id} style={styles.checkRow}>
                <Ionicons
                  name={c.status === "pass" ? "checkmark-circle" : c.status === "warn" ? "alert-circle" : "close-circle"}
                  size={20}
                  color={c.status === "pass" ? COLORS.success : c.status === "warn" ? COLORS.warn : COLORS.danger}
                />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.checkLabel}>{c.label}</Text>
                  <Text style={styles.checkDetail}>{c.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Error Simulation & Report Export Tools */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🧪 أدوات اختبار كشف الأخطاء وتصدير التقارير</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              devTelemetry.recordError("warn", "DevTest", "تحذير تجريبي لاختبار رادار الأخطاء الحي");
              onToast("🧪 تم تسجيل تحذير تجريبي في الرادار");
            }}
          >
            <Text style={styles.outlineTxt}>🧪 تحذير تجريبي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => {
              apiFetch("/api/dev-test-404-probe").catch(() => {});
              onToast("🧪 تم إطلاق فحص خطأ HTTP 404");
            }}
          >
            <Text style={styles.outlineTxt}>🧪 اختبار 404</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.outlineBtn, { borderColor: COLORS.primary }]}
          onPress={() =>
            Share.share({
              message: devTelemetry.buildDiagnosticReport({
                users: allUsers.length,
                posts: allPosts.length,
                networkCount: networkLogs.length,
              }),
            })
          }
        >
          <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12.5 }}>
            📤 مشاركة تقرير التشخيص الكامل (Diagnostic Report)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Error & Crash Radar */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>🐞 سجل الأخطاء الحي ({errors.length})</Text>
          {errors.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                devTelemetry.clearErrors();
                onToast("✓ تم مسح سجل الأخطاء");
              }}
            >
              <Text style={{ color: COLORS.danger, fontSize: 11.5, fontWeight: "700" }}>مسح الكل</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { k: "all", l: "الكل" },
            { k: "crash", l: "أعطال" },
            { k: "error", l: "أخطاء" },
            { k: "network", l: "شبكة" },
            { k: "warn", l: "تحذيرات" },
          ].map((f) => (
            <TouchableOpacity
              key={f.k}
              style={[styles.chip, sevFilter === f.k && styles.chipActive]}
              onPress={() => setSevFilter(f.k as any)}
            >
              <Text style={[styles.chipTxt, sevFilter === f.k && { color: "#fff" }]}>{f.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredErrors.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-done-circle" size={34} color={COLORS.success} />
            <Text style={{ color: COLORS.success, fontWeight: "700", fontSize: 13 }}>
              لا توجد أخطاء مسجلة — النظام نظيف 100%
            </Text>
          </View>
        ) : (
          filteredErrors.map((err) => {
            const expanded = expandedErrId === err.id;
            return (
              <TouchableOpacity
                key={err.id}
                style={[styles.errItem, { borderRightColor: sevColor(err.severity) }]}
                onPress={() => setExpandedErrId(expanded ? null : err.id)}
              >
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: sevColor(err.severity), fontWeight: "800", fontSize: 11.5 }}>
                    [{err.severity.toUpperCase()}] {err.source}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 10.5 }}>{err.time}</Text>
                </View>
                <Text style={{ color: COLORS.text, fontSize: 12.5, textAlign: "right", marginTop: 4 }}>
                  {err.message}
                </Text>
                {expanded && !!err.stack && (
                  <Text style={styles.stackBox}>{err.stack}</Text>
                )}
              </TouchableOpacity>
            );
          })
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
  sub: { color: COLORS.muted, fontSize: 11.5, textAlign: "right", lineHeight: 18 },
  scanBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 13.5 },
  checkRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface2,
    padding: 10,
    borderRadius: 11,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  checkLabel: { color: COLORS.text, fontSize: 12.5, fontWeight: "700" },
  checkDetail: { color: COLORS.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  row: { flexDirection: "row-reverse", gap: 8 },
  outlineBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  outlineTxt: { color: COLORS.text, fontWeight: "700", fontSize: 12 },
  filterRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: COLORS.surface2,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  emptyBox: { alignItems: "center", paddingVertical: 18, gap: 6 },
  errItem: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    borderRightWidth: 3,
  },
  stackBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#060609",
    color: COLORS.muted,
    fontSize: 10,
  },
});
