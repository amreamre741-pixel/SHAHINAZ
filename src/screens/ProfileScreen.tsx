import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import AdminScreen from "./AdminScreen";

const ADMIN_PIN = "1994";

export default function ProfileScreen() {
  const { currentUser, posts, blockedUserIds, logout, deleteAccount } = useApp();
  const [showAdmin, setShowAdmin] = useState(false);
  const [pinPrompt, setPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");

  if (!currentUser) return null;
  if (showAdmin) return <AdminScreen onClose={() => setShowAdmin(false)} />;

  const myPosts = posts.filter((p) => p.author.id === currentUser.id);

  function handleCheckPin() {
    if (pinInput.trim() === ADMIN_PIN) {
      setPinPrompt(false);
      setPinInput("");
      setShowAdmin(true);
    } else {
      Alert.alert("رمز خاطئ", "رمز المطور غير صحيح.");
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "حذف الحساب نهائياً",
      "هل أنت متأكد؟ سيتم حذف حسابك وجميع منشوراتك وبياناتك بشكل نهائي ولا يمكن التراجع عن ذلك.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "نعم، احذف حسابي",
          style: "destructive",
          onPress: () => {
            deleteAccount();
            Alert.alert("تم الحذف", "تم حذف حسابك وبياناتك بنجاح.");
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 36 }}>{currentUser.avatarEmoji}</Text>
        </View>
        <Text style={styles.name}>
          {currentUser.name} {currentUser.verified ? "☑️" : ""}
        </Text>
        <Text style={styles.username}>@{currentUser.username}</Text>
        <Text style={styles.bio}>{currentUser.bio}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{myPosts.length}</Text>
            <Text style={styles.statLabel}>منشور</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{currentUser.followers}</Text>
            <Text style={styles.statLabel}>متابِع</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{currentUser.following}</Text>
            <Text style={styles.statLabel}>يتابِع</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ الإعدادات والخصوصية (Google Play)</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingText}>🚫 المستخدمون المحظورون: {blockedUserIds.length}</Text>
        </View>

        <TouchableOpacity style={styles.adminBtn} onPress={() => setPinPrompt((v) => !v)}>
          <Text style={styles.adminBtnText}>🛡️ لوحة تحكم المطور (Admin)</Text>
        </TouchableOpacity>

        {pinPrompt && (
          <View style={styles.pinBox}>
            <TextInput
              style={styles.pinInput}
              placeholder="أدخل رمز المطور السري"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              keyboardType="number-pad"
              value={pinInput}
              onChangeText={setPinInput}
            />
            <TouchableOpacity style={styles.pinGoBtn} onPress={handleCheckPin}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>دخول</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.outlineBtn} onPress={logout}>
          <Text style={styles.outlineBtnText}>تسجيل الخروج</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerBtn} onPress={confirmDeleteAccount}>
          <Text style={styles.dangerBtnText}>🗑️ حذف الحساب نهائياً</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 14 },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  name: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
  username: { color: COLORS.primary, fontSize: 13, marginTop: 2 },
  bio: { color: COLORS.muted, fontSize: 13, marginTop: 6, textAlign: "center" },
  statsRow: { flexDirection: "row-reverse", gap: 28, marginTop: 16 },
  stat: { alignItems: "center" },
  statNum: { color: COLORS.text, fontSize: 17, fontWeight: "700" },
  statLabel: { color: COLORS.muted, fontSize: 12 },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", textAlign: "right" },
  settingRow: { paddingVertical: 6, alignItems: "flex-end" },
  settingText: { color: COLORS.muted, fontSize: 13 },
  adminBtn: {
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  adminBtnText: { color: COLORS.primary, fontWeight: "700" },
  pinBox: { flexDirection: "row-reverse", gap: 8 },
  pinInput: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pinGoBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  outlineBtn: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineBtnText: { color: COLORS.text, fontWeight: "700" },
  dangerBtn: {
    backgroundColor: "rgba(239, 68, 68, 0.14)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  dangerBtnText: { color: COLORS.danger, fontWeight: "700" },
});
