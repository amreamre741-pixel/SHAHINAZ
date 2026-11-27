import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useApp } from "../../store/AppContext";
import { apiFetch } from "../../services/api";

interface CloudOverview {
  ok: boolean;
  dbLatencyMs: number;
  uptimeSec: number;
  memoryMb: number;
  nodeVersion: string;
  r2Configured: boolean;
  counts: {
    users: number;
    posts: number;
    comments: number;
    likes: number;
    reports: number;
    blocks: number;
    messages: number;
  };
  recentUsers: { id: string; name: string; username: string; email: string; verified: boolean }[];
  recentPosts: {
    id: string;
    content: string;
    author: { name: string; username: string; verified: boolean };
    _count: { likes: number; comments: number };
  }[];
  recentReports: { id: string; reason: string; reporter: { name: string }; post: { id: string; content: string } }[];
  serverErrors: { id: string; method: string; path: string; message: string; time: string }[];
}

export default function CloudServerPanel({ onToast }: { onToast: (msg: string) => void }) {
  const { adminPin } = useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CloudOverview | null>(null);
  const [errMsg, setErrMsg] = useState("");

  async function loadCloudOverview() {
    setLoading(true);
    setErrMsg("");
    try {
      const res = await apiFetch<CloudOverview>("/api/admin/overview", null, {
        headers: { "x-admin-pin": adminPin },
      });
      setData(res);
      onToast(`☁️ تم تحديث بيانات Neon PostgreSQL (${res.dbLatencyMs} ms)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر جلب بيانات السيرفر";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCloudOverview();
  }, []);

  async function toggleCloudVerify(userId: string) {
    try {
      await apiFetch(`/api/admin/users/${userId}/verify`, null, {
        method: "POST",
        headers: { "x-admin-pin": adminPin },
      });
      onToast("☑️ تم تحديث التوثيق مباشرة في قاعدة Neon!");
      loadCloudOverview();
    } catch (e) {
      Alert.alert("خطأ", e instanceof Error ? e.message : "تعذر التحديث");
    }
  }

  async function deleteCloudPost(postId: string) {
    try {
      await apiFetch(`/api/admin/posts/${postId}`, null, {
        method: "DELETE",
        headers: { "x-admin-pin": adminPin },
      });
      onToast("🗑️ تم حذف المنشور من قاعدة Neon!");
      loadCloudOverview();
    } catch (e) {
      Alert.alert("خطأ", e instanceof Error ? e.message : "تعذر الحذف");
    }
  }

  async function dismissCloudReport(reportId: string) {
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, null, {
        method: "DELETE",
        headers: { "x-admin-pin": adminPin },
      });
      onToast("✓ تم إغلاق البلاغ في Neon!");
      loadCloudOverview();
    } catch (e) {
      Alert.alert("خطأ", e instanceof Error ? e.message : "تعذر الإغلاق");
    }
  }

  function formatUptime(sec: number) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}س ${m}د` : m > 0 ? `${m}د ${s}ث` : `${s}ث`;
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.card}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>☁️ الاتصال الحي بسيرفر Render وقاعدة Neon</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={loadCloudOverview} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="refresh" size={16} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {!!errMsg && (
          <View style={styles.errBox}>
            <Text style={{ color: COLORS.warn, fontSize: 12, fontWeight: "700", textAlign: "right" }}>
              ⚠️ {errMsg}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 11, textAlign: "right", marginTop: 4 }}>
              ملاحظة: بعد رفع الكود إلى GitHub، يقوم Render بإعادة النشر تلقائياً خلال 1-2 دقيقة. اضغط زر التحديث لإعادة المحاولة.
            </Text>
          </View>
        )}

        {data && (
          <>
            {/* Live Render Server Telemetry Pills */}
            <View style={styles.pillsRow}>
              <View style={styles.pill}>
                <Text style={styles.pillVal}>{data.dbLatencyMs} ms</Text>
                <Text style={styles.pillLbl}>Neon Ping</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillVal}>{data.memoryMb} MB</Text>
                <Text style={styles.pillLbl}>RAM السيرفر</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillVal}>{formatUptime(data.uptimeSec)}</Text>
                <Text style={styles.pillLbl}>وقت التشغيل</Text>
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillVal}>{data.nodeVersion}</Text>
                <Text style={styles.pillLbl}>Node.js</Text>
              </View>
            </View>

            {/* Real Neon DB Counts */}
            <Text style={styles.smallHead}>📊 إحصائيات قاعدة Neon PostgreSQL الحقيقية:</Text>
            <View style={styles.countsGrid}>
              {[
                { label: "مستخدمون", val: data.counts.users, color: COLORS.primary },
                { label: "منشورات", val: data.counts.posts, color: COLORS.verified },
                { label: "تعليقات", val: data.counts.comments, color: COLORS.success },
                { label: "إعجابات", val: data.counts.likes, color: COLORS.heart },
                { label: "رسائل", val: data.counts.messages, color: "#38bdf8" },
                { label: "بلاغات", val: data.counts.reports, color: COLORS.danger },
              ].map((c) => (
                <View key={c.label} style={styles.countBox}>
                  <Text style={{ color: c.color, fontSize: 18, fontWeight: "800" }}>{c.val}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{c.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Live Neon Users */}
      {data && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 حسابات Neon المسجّلة ({data.recentUsers.length})</Text>
          {data.recentUsers.length === 0 ? (
            <Text style={styles.empty}>لا توجد حسابات مسجلة في Neon بعد.</Text>
          ) : (
            data.recentUsers.map((u) => (
              <View key={u.id} style={styles.itemRow}>
                <TouchableOpacity style={styles.miniAction} onPress={() => toggleCloudVerify(u.id)}>
                  <Text style={{ color: COLORS.verified, fontSize: 11, fontWeight: "700" }}>
                    {u.verified ? "سحب ☑️" : "توثيق ☑️"}
                  </Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                    <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 13 }}>{u.name}</Text>
                    {u.verified && <Ionicons name="checkmark-circle" size={13} color={COLORS.verified} />}
                  </View>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                    @{u.username} · {u.email}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Live Neon Posts */}
      {data && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📝 منشورات Neon الحقيقية ({data.recentPosts.length})</Text>
          {data.recentPosts.length === 0 ? (
            <Text style={styles.empty}>لا توجد منشورات سحابية بعد.</Text>
          ) : (
            data.recentPosts.map((p) => (
              <View key={p.id} style={styles.itemRow}>
                <TouchableOpacity
                  style={[styles.miniAction, { borderColor: COLORS.danger }]}
                  onPress={() =>
                    Alert.alert("حذف من Neon", "هل تريد حذف هذا المنشور نهائياً من قاعدة البيانات؟", [
                      { text: "إلغاء", style: "cancel" },
                      { text: "حذف", style: "destructive", onPress: () => deleteCloudPost(p.id) },
                    ])
                  }
                >
                  <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: "700" }}>حذف 🗑️</Text>
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 12.5 }}>
                    {p.author.name} · ❤️ {p._count.likes} · 💬 {p._count.comments}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11.5 }} numberOfLines={2}>
                    {p.content || "(صورة بدون نص)"}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* Live Neon Reports & Render Server Errors */}
      {data && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 أخطاء السيرفر على Render ({data.serverErrors.length})</Text>
          {data.serverErrors.length === 0 ? (
            <Text style={{ color: COLORS.success, fontSize: 12.5, textAlign: "center", paddingVertical: 8 }}>
              ✅ السيرفر يعمل بدون أي خطأ في الـ Backend
            </Text>
          ) : (
            data.serverErrors.map((se) => (
              <View key={se.id} style={styles.errBox}>
                <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 11.5 }}>
                  {se.method} {se.path}
                </Text>
                <Text style={{ color: COLORS.text, fontSize: 12, marginTop: 2 }}>{se.message}</Text>
              </View>
            ))
          )}
          {data.recentReports.length > 0 && (
            <>
              <Text style={[styles.smallHead, { marginTop: 6 }]}>🚩 بلاغات Neon ({data.recentReports.length}):</Text>
              {data.recentReports.map((r) => (
                <View key={r.id} style={styles.itemRow}>
                  <TouchableOpacity style={styles.miniAction} onPress={() => dismissCloudReport(r.id)}>
                    <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: "700" }}>إغلاق ✓</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: COLORS.text, fontSize: 12.5, fontWeight: "700" }}>{r.reason}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }} numberOfLines={1}>
                      بواسطة {r.reporter.name}: {r.post.content}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      )}
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
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "right", flex: 1 },
  refreshBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  errBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderColor: COLORS.danger,
    borderWidth: 0.5,
    borderRadius: 10,
    padding: 10,
  },
  pillsRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  pill: {
    width: "48.5%",
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  pillVal: { color: COLORS.success, fontSize: 14, fontWeight: "800" },
  pillLbl: { color: COLORS.muted, fontSize: 10.5, marginTop: 2 },
  smallHead: { color: COLORS.muted, fontSize: 11.5, fontWeight: "700", textAlign: "right" },
  countsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  countBox: {
    width: "31.5%",
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface2,
    padding: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  miniAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  empty: { color: COLORS.muted, textAlign: "center", fontSize: 12.5, paddingVertical: 8 },
});
