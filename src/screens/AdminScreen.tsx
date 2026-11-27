import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const {
    allPosts,
    allUsers,
    reports,
    blockedUserIds,
    announcement,
    maintenanceMode,
    allowRegistration,
    adminDeletePost,
    adminDismissReport,
    adminToggleVerify,
    adminSetAnnouncement,
    adminToggleMaintenance,
    adminToggleRegistration,
    blockUser,
    unblockUser,
  } = useApp();

  const [bannerInput, setBannerInput] = useState(announcement);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>← رجوع</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🛡️ لوحة تحكم المطور (Admin)</Text>
      </View>

      {/* Stats */}
      <View style={styles.kpiRow}>
        <View style={styles.kpi}>
          <Text style={styles.kpiNum}>{allUsers.length}</Text>
          <Text style={styles.kpiLabel}>المستخدمون</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiNum}>{allPosts.length}</Text>
          <Text style={styles.kpiLabel}>المنشورات</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={[styles.kpiNum, { color: reports.length > 0 ? COLORS.danger : COLORS.success }]}>
            {reports.length}
          </Text>
          <Text style={styles.kpiLabel}>البلاغات</Text>
        </View>
        <View style={styles.kpi}>
          <Text style={styles.kpiNum}>{blockedUserIds.length}</Text>
          <Text style={styles.kpiLabel}>محظورون</Text>
        </View>
      </View>

      {/* Broadcast Announcement */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📢 إعلان عام لكل المستخدمين</Text>
        <TextInput
          style={styles.input}
          placeholder="اكتب رسالة تظهر في أعلى الرئيسية للجميع..."
          placeholderTextColor={COLORS.muted}
          value={bannerInput}
          onChangeText={setBannerInput}
        />
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              adminSetAnnouncement(bannerInput);
              Alert.alert("تم النشر", "سيظهر الإعلان الآن لجميع المستخدمين.");
            }}
          >
            <Text style={styles.btnText}>نشر الإعلان</Text>
          </TouchableOpacity>
          {!!announcement && (
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => {
                setBannerInput("");
                adminSetAnnouncement("");
              }}
            >
              <Text style={styles.outlineText}>إخفاء</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* App Controls */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚙️ مفاتيح التحكم السريع</Text>
        <View style={styles.toggleRow}>
          <Switch value={maintenanceMode} onValueChange={adminToggleMaintenance} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.toggleLabel}>وضع الصيانة (إيقاف النشر مؤقتاً)</Text>
            <Text style={styles.toggleSub}>يمنع نشر منشورات جديدة أثناء التحديثات</Text>
          </View>
        </View>
        <View style={styles.toggleRow}>
          <Switch value={allowRegistration} onValueChange={adminToggleRegistration} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.toggleLabel}>السماح بتسجيل حسابات جديدة</Text>
            <Text style={styles.toggleSub}>يمكنك إغلاق التسجيل مؤقتاً عند الحاجة</Text>
          </View>
        </View>
      </View>

      {/* Reports Center */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚩 مركز البلاغات ({reports.length})</Text>
        {reports.length === 0 ? (
          <Text style={styles.empty}>لا توجد بلاغات معلقة حالياً ✓</Text>
        ) : (
          reports.map((rep) => {
            const post = allPosts.find((p) => p.id === rep.postId);
            return (
              <View key={rep.id} style={styles.itemBox}>
                <Text style={styles.itemTitle}>السبب: {rep.reason}</Text>
                <Text style={styles.itemSub} numberOfLines={2}>
                  {post ? `${post.author.name}: ${post.content}` : "منشور محذوف"}
                </Text>
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => adminDeletePost(rep.postId)}
                  >
                    <Text style={styles.dangerText}>🗑️ حذف المنشور</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => adminDismissReport(rep.id)}
                  >
                    <Text style={styles.outlineText}>تجاهل ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Users Management & Verification */}
      <View style={[styles.card, { marginBottom: 32 }]}>
        <Text style={styles.cardTitle}>👥 إدارة المستخدمين والتوثيق ☑️</Text>
        {allUsers.map((u) => {
          const isBlocked = blockedUserIds.includes(u.id);
          return (
            <View key={u.id} style={styles.itemBox}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.itemTitle}>
                  {u.avatarEmoji} {u.name} {u.verified ? "☑️" : ""}
                </Text>
                <Text style={styles.itemSub}>@{u.username}</Text>
              </View>
              <View style={styles.row}>
                <TouchableOpacity style={styles.outlineBtn} onPress={() => adminToggleVerify(u.id)}>
                  <Text style={styles.outlineText}>{u.verified ? "إزالة التوثيق" : "☑️ توثيق الحساب"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={isBlocked ? styles.primaryBtn : styles.dangerBtn}
                  onPress={() => (isBlocked ? unblockUser(u.id) : blockUser(u.id))}
                >
                  <Text style={isBlocked ? styles.btnText : styles.dangerText}>
                    {isBlocked ? "فك الحظر" : "🚫 حظر"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 14 },
  topBar: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  backBtn: { padding: 6 },
  backText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  kpiRow: { flexDirection: "row-reverse", gap: 8, marginBottom: 14 },
  kpi: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiNum: { color: COLORS.primary, fontSize: 18, fontWeight: "800" },
  kpiLabel: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "right" },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  row: { flexDirection: "row-reverse", gap: 8 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 10, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  outlineBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineText: { color: COLORS.text, fontWeight: "600", fontSize: 12 },
  dangerBtn: {
    flex: 1,
    backgroundColor: "rgba(239,68,68,0.14)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  dangerText: { color: COLORS.danger, fontWeight: "700", fontSize: 12 },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  toggleLabel: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  toggleSub: { color: COLORS.muted, fontSize: 11 },
  itemBox: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemTitle: { color: COLORS.text, fontWeight: "700", fontSize: 13, textAlign: "right" },
  itemSub: { color: COLORS.muted, fontSize: 12, textAlign: "right" },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 10, fontSize: 13 },
});
