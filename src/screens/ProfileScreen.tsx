import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import AdminScreen from "./AdminScreen";
import DevVaultModal from "../components/DevVaultModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "👑 مطور", color: "#a855f7" },
  MODERATOR: { label: "🛡️ مشرف", color: "#3897f0" },
  VIP: { label: "⭐ VIP", color: "#f59e0b" },
};

export default function ProfileScreen() {
  const {
    currentUser,
    posts,
    blockedUserIds,
    adminPin,
    updateProfile,
    togglePrivateAccount,
    logout,
    deleteAccount,
  } = useApp();

  const [subTab, setSubTab] = useState<"posts" | "saved" | "settings">("posts");
  const [showAdmin, setShowAdmin] = useState(false);
  const [devVaultOpen, setDevVaultOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const tapCountRef = React.useRef(0);
  const tapTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  if (!currentUser) return null;
  if (showAdmin) return <AdminScreen onClose={() => setShowAdmin(false)} />;

  const myPosts = posts.filter((p) => p.author.id === currentUser.id);
  const savedPosts = posts.filter((p) => p.savedByMe);
  const roleBadge = currentUser.role ? ROLE_LABELS[currentUser.role] : undefined;

  async function pickAvatar() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      updateProfile(currentUser!.name, currentUser!.bio, res.assets[0].uri);
    }
  }

  function handleSecretVersionTap() {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setDevVaultOpen(true);
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 2500);
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

  const gridItems = subTab === "posts" ? myPosts : savedPosts;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Username Bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
          <Text style={styles.topUsername}>@{currentUser.username}</Text>
          {currentUser.verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.verified} />}
          {currentUser.isPrivate && <Ionicons name="lock-closed" size={14} color={COLORS.muted} />}
        </View>
        <TouchableOpacity onPress={() => setSubTab(subTab === "settings" ? "posts" : "settings")}>
          <Ionicons name="settings-outline" size={23} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Instagram-Style Header Row: Avatar + Stats */}
      <View style={styles.profileTop}>
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85}>
          <LinearGradient colors={["#f59e0b", "#ec4899", "#8b5cf6"]} style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              {currentUser.avatarUri ? (
                <Image source={{ uri: currentUser.avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="person" size={38} color={COLORS.muted} />
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

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

      {/* Name, Role, VIP Pill & Bio */}
      <View style={styles.bioWrap}>
        <View style={{ flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <Text style={styles.displayName}>{currentUser.name}</Text>
          {roleBadge && (
            <View style={[styles.vipPill, { backgroundColor: "rgba(168,85,247,0.18)" }]}>
              <Text style={[styles.vipText, { color: roleBadge.color }]}>{roleBadge.label}</Text>
            </View>
          )}
          <View style={styles.vipPill}>
            <Text style={styles.vipText}>🏆 {currentUser.points ?? 150} نقطة</Text>
          </View>
        </View>
        <Text style={styles.bio}>{currentUser.bio}</Text>

        {/* Action Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.grayBtn}
            onPress={() => {
              setEditName(currentUser.name);
              setEditBio(currentUser.bio);
              setEditing((v) => !v);
            }}
          >
            <Text style={styles.grayBtnText}>{editing ? "إغلاق" : "تعديل الملف"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.grayBtn}
            onPress={() => Share.share({ message: `تابعني على تطبيق SHAHINAZ: @${currentUser.username}` })}
          >
            <Text style={styles.grayBtnText}>مشاركة الحساب</Text>
          </TouchableOpacity>
        </View>

        {editing && (
          <View style={styles.editBox}>
            <TextInput style={styles.input} placeholder="الاسم" placeholderTextColor={COLORS.muted} value={editName} onChangeText={setEditName} />
            <TextInput style={styles.input} placeholder="البايو" placeholderTextColor={COLORS.muted} value={editBio} onChangeText={setEditBio} />
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                updateProfile(editName, editBio);
                setEditing(false);
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Instagram Icon Tab Bar */}
      <View style={styles.subTabs}>
        <TouchableOpacity style={[styles.subTabBtn, subTab === "posts" && styles.subTabActive]} onPress={() => setSubTab("posts")}>
          <Ionicons name="grid-outline" size={22} color={subTab === "posts" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.subTabBtn, subTab === "saved" && styles.subTabActive]} onPress={() => setSubTab("saved")}>
          <Ionicons name="bookmark-outline" size={22} color={subTab === "saved" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.subTabBtn, subTab === "settings" && styles.subTabActive]} onPress={() => setSubTab("settings")}>
          <Ionicons name="shield-checkmark-outline" size={22} color={subTab === "settings" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>
      </View>

      {/* Grid Views (My Posts / Saved Posts) */}
      {subTab !== "settings" ? (
        gridItems.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name={subTab === "posts" ? "camera-outline" : "bookmark-outline"} size={40} color={COLORS.muted} />
            <Text style={styles.emptyText}>
              {subTab === "posts" ? "لم تنشر أي صورة بعد — اضغط + للبدء" : "لا توجد منشورات محفوظة بعد"}
            </Text>
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {gridItems.map((item) => (
              <View key={item.id} style={styles.gridTile}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={[item.bgColor || "#6d28d9", "#111827"]} style={styles.gridImg}>
                    <Text style={styles.gridText} numberOfLines={3}>
                      {item.content}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            ))}
          </View>
        )
      ) : (
        /* Settings & Google Play Compliance Panel (Admin entry completely hidden!) */
        <View style={styles.settingsBox}>
          <View style={styles.settingRow}>
            <Switch value={!!currentUser.isPrivate} onValueChange={togglePrivateAccount} />
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.settingTitle}>حساب خاص (Private)</Text>
              <Text style={styles.settingSub}>فقط المتابعون الموافق عليهم يرون منشوراتك</Text>
            </View>
          </View>

          <View style={styles.settingRow}>
            <Text style={{ color: COLORS.muted, fontWeight: "700" }}>{blockedUserIds.length}</Text>
            <Text style={styles.settingTitle}>المستخدمون المحظورون</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={{ color: COLORS.text, fontWeight: "700" }}>تسجيل الخروج</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.dangerBtn} onPress={confirmDeleteAccount}>
            <Text style={{ color: COLORS.danger, fontWeight: "700" }}>حذف الحساب نهائياً</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSecretVersionTap}
            style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}
          >
            <Text style={{ color: COLORS.muted, fontSize: 11.5 }}>SHAHINAZ Ultra · v1.0.0</Text>
          </TouchableOpacity>
        </View>
      )}

      <DevVaultModal
        visible={devVaultOpen}
        expectedPin={adminPin}
        onClose={() => setDevVaultOpen(false)}
        onUnlock={() => setShowAdmin(true)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topUsername: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  profileTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  avatarRing: { width: 88, height: 88, borderRadius: 44, padding: 3, alignItems: "center", justifyContent: "center" },
  avatarInner: { width: 82, height: 82, borderRadius: 41, backgroundColor: COLORS.bg, padding: 2 },
  avatarImg: { width: 78, height: 78, borderRadius: 39 },
  avatarFallback: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flex: 1, flexDirection: "row-reverse", justifyContent: "space-around", paddingRight: 16 },
  stat: { alignItems: "center" },
  statNum: { color: COLORS.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  bioWrap: { paddingHorizontal: 16, paddingTop: 12, alignItems: "flex-end" },
  displayName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  vipPill: { backgroundColor: "rgba(245,158,11,0.16)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  vipText: { color: COLORS.warn, fontSize: 11, fontWeight: "700" },
  bio: { color: COLORS.muted, fontSize: 13, marginTop: 4, textAlign: "right", lineHeight: 19 },
  btnRow: { flexDirection: "row-reverse", gap: 8, marginTop: 14, width: "100%" },
  grayBtn: { flex: 1, backgroundColor: COLORS.surface2, borderRadius: 10, paddingVertical: 9, alignItems: "center" },
  grayBtnText: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  editBox: { width: "100%", marginTop: 12, gap: 8 },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  saveBtn: { backgroundColor: COLORS.verified, borderRadius: 10, padding: 11, alignItems: "center" },
  subTabs: {
    flexDirection: "row-reverse",
    marginTop: 18,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  subTabBtn: { flex: 1, alignItems: "center", paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  subTabActive: { borderBottomColor: COLORS.text },
  gridWrap: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 2, paddingTop: 2 },
  gridTile: { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: COLORS.surface },
  gridImg: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 8 },
  gridText: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  emptyBox: { alignItems: "center", paddingVertical: 48, gap: 10 },
  emptyText: { color: COLORS.muted, fontSize: 13 },
  settingsBox: { padding: 16, gap: 12, paddingBottom: 40 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  settingTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  settingSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  adminBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(168,85,247,0.14)",
    borderColor: COLORS.primary,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
  },
  adminBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 14 },
  pinRow: { flexDirection: "row-reverse", gap: 8 },
  pinBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  logoutBtn: { backgroundColor: COLORS.surface2, borderRadius: 12, padding: 13, alignItems: "center" },
  dangerBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: COLORS.danger,
    borderWidth: 1,
    borderRadius: 12,
    padding: 13,
    alignItems: "center",
  },
});
