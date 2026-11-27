import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  Modal,
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
import { useApp } from "../store/AppContext";
import AdminScreen from "./AdminScreen";
import DevVaultModal from "../components/DevVaultModal";
import DailyStreakModal from "../components/DailyStreakModal";
import ThemeStudioModal from "../components/ThemeStudioModal";
import WalletModal from "../components/WalletModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 36) / 3;

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: "👑 مطور", color: "#F5C65C" },
  MODERATOR: { label: "🛡️ مشرف", color: "#38BDF8" },
  VIP: { label: "⭐ VIP", color: "#FBBF24" },
};

export default function ProfileScreen() {
  const {
    currentUser,
    posts,
    allUsers,
    blockedUserIds,
    adminPin,
    theme,
    updateProfile,
    togglePrivateAccount,
    toggleLike,
    toggleSave,
    deleteMyPost,
    unblockUser,
    logout,
    deleteAccount,
  } = useApp();

  const [subTab, setSubTab] = useState<"posts" | "saved" | "settings">("posts");
  const [showAdmin, setShowAdmin] = useState(false);
  const [devVaultOpen, setDevVaultOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedPost = useMemo(
    () => posts.find((p) => p.id === selectedPostId) || null,
    [posts, selectedPostId]
  );

  if (!currentUser) return null;

  const myPosts = posts.filter((p) => p.author.id === currentUser.id);
  const savedPosts = posts.filter((p) => p.savedByMe);
  const roleBadge = currentUser.role ? ROLE_LABELS[currentUser.role] : undefined;
  const totalLikes = myPosts.reduce((s, p) => s + p.likes, 0);
  const totalComments = myPosts.reduce((s, p) => s + p.comments.length, 0);
  const estReach = Math.max(120, totalLikes * 14 + currentUser.followers * 3 + myPosts.length * 85);
  const pts = currentUser.points ?? 150;
  const creatorLevel =
    pts >= 1000 ? { title: "سفير SHAHINAZ 👑", pct: 100 } :
    pts >= 500 ? { title: "نجم صاعد ⭐", pct: Math.round((pts / 1000) * 100) } :
    pts >= 250 ? { title: "صانع محتوى 🎬", pct: Math.round((pts / 500) * 100) } :
    { title: "عضو نشط 🌱", pct: Math.min(100, Math.round((pts / 250) * 100)) };

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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Luxury Atmospheric Cover Banner */}
      <LinearGradient colors={theme.coverGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.coverBanner}>
        <View
          style={{
            position: "absolute",
            right: -30,
            top: -30,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: theme.primarySoft,
          }}
        />
        <View style={styles.coverTopRow}>
          <View style={[styles.handlePill, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: theme.borderGlow }]}>
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 13 }}>@{currentUser.username}</Text>
            {currentUser.verified && <Ionicons name="checkmark-circle" size={14} color={theme.verified} />}
            {currentUser.isPrivate && <Ionicons name="lock-closed" size={12} color={theme.primary} />}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              style={[styles.coverIconBtn, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: theme.borderGlow }]}
              onPress={() => setThemeOpen(true)}
            >
              <Ionicons name="color-palette-outline" size={19} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.coverIconBtn, { backgroundColor: "rgba(0,0,0,0.45)", borderColor: theme.border }]}
              onPress={() => setSubTab(subTab === "settings" ? "posts" : "settings")}
            >
              <Ionicons name="settings-outline" size={19} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Overlapping Crowned Squircle Avatar & Identity */}
      <View style={styles.identityWrap}>
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.88} style={styles.avatarOverlap}>
          <LinearGradient colors={theme.storyGrad} style={[styles.avatarRing, { borderColor: theme.bg }]}>
            <View style={[styles.avatarInner, { backgroundColor: theme.bg }]}>
              {currentUser.avatarUri ? (
                <Image source={{ uri: currentUser.avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: theme.surface2 }]}>
                  <Ionicons name="person" size={38} color={theme.muted} />
                </View>
              )}
            </View>
          </LinearGradient>
          <LinearGradient colors={theme.btnGrad} style={[styles.cameraBadge, { borderColor: theme.bg }]}>
            <Ionicons name="camera" size={13} color={theme.btnText} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 10 }}>
          <Text style={[styles.displayName, { color: theme.text }]}>{currentUser.name}</Text>
          {currentUser.verified && <Ionicons name="checkmark-circle" size={18} color={theme.verified} />}
        </View>

        <View style={{ flexDirection: "row-reverse", alignItems: "center", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 6 }}>
          {roleBadge && (
            <View style={[styles.badgePill, { backgroundColor: theme.primarySoft, borderColor: theme.borderGlow }]}>
              <Text style={{ color: roleBadge.color, fontSize: 11, fontWeight: "800" }}>{roleBadge.label}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.badgePill, { backgroundColor: theme.primarySoft, borderColor: theme.borderGlow }]}
            onPress={() => setStreakOpen(true)}
          >
            <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: "900" }}>
              🪙 {pts.toLocaleString("fr-DZ")} نقطة · المتجر 🎁
            </Text>
          </TouchableOpacity>
          <View style={[styles.badgePill, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ color: theme.muted, fontSize: 11, fontWeight: "700" }}>{creatorLevel.title}</Text>
          </View>
        </View>

        <Text style={[styles.bio, { color: theme.muted }]}>{currentUser.bio}</Text>

        {/* Frosted Glass KPI Bar */}
        <View style={[styles.kpiCapsule, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
          <TouchableOpacity style={styles.kpiCol} onPress={() => setSubTab("posts")}>
            <Text style={[styles.statNum, { color: theme.text }]}>{myPosts.length}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>منشور</Text>
          </TouchableOpacity>
          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.statNum, { color: theme.text }]}>{currentUser.followers}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>متابِع</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
          <View style={styles.kpiCol}>
            <Text style={[styles.statNum, { color: theme.text }]}>{currentUser.following}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>يتابِع</Text>
          </View>
          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
          <TouchableOpacity style={styles.kpiCol} onPress={() => setAnalyticsOpen(true)}>
            <Text style={[styles.statNum, { color: theme.primary }]}>{estReach}</Text>
            <Text style={[styles.statLabel, { color: theme.muted }]}>الوصول</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={{ flex: 1.15 }} activeOpacity={0.88} onPress={() => setAnalyticsOpen(true)}>
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryActionBtn}>
              <Ionicons name="stats-chart" size={14} color={theme.btnText} />
              <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 12 }}>إحصائياتي</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.glassBtn, { backgroundColor: theme.surface, borderColor: theme.borderGlow, flexDirection: "row-reverse", gap: 4 }]}
            onPress={() => setWalletOpen(true)}
          >
            <Ionicons name="card-outline" size={14} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 12 }}>محفظتي</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.glassBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => {
              setEditName(currentUser.name);
              setEditBio(currentUser.bio);
              setEditing((v) => !v);
            }}
          >
            <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>
              {editing ? "إغلاق" : "تعديل"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.glassBtn, { flex: 0.72, backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => Share.share({ message: `تابعني على تطبيق SHAHINAZ: @${currentUser.username}` })}
          >
            <Ionicons name="share-social-outline" size={16} color={theme.text} />
          </TouchableOpacity>
        </View>

        {editing && (
          <View style={[styles.editBox, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="الاسم"
              placeholderTextColor={theme.muted}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="البايو"
              placeholderTextColor={theme.muted}
              value={editBio}
              onChangeText={setEditBio}
            />
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                updateProfile(editName, editBio);
                setEditing(false);
                Alert.alert("تم الحفظ ✓", "تم تحديث بيانات ملفك الشخصي.");
              }}
            >
              <LinearGradient colors={theme.btnGrad} style={styles.saveBtn}>
                <Text style={{ color: theme.btnText, fontWeight: "900" }}>حفظ التغييرات</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Frosted Pill Sub-Tab Switcher */}
      <View style={[styles.subTabs, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          { key: "posts" as const, icon: "grid" as const, label: "منشوراتي" },
          { key: "saved" as const, icon: "bookmark" as const, label: "المحفوظات" },
          { key: "settings" as const, icon: "shield-checkmark" as const, label: "الخصوصية" },
        ].map((t) => {
          const active = subTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.subTabBtn, active && { backgroundColor: theme.primarySoft }]}
              onPress={() => setSubTab(t.key)}
            >
              <Ionicons name={t.icon} size={16} color={active ? theme.primary : theme.muted} />
              <Text style={{ color: active ? theme.primary : theme.muted, fontSize: 12, fontWeight: active ? "900" : "700" }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Rounded Gallery Grid / Settings */}
      {subTab !== "settings" ? (
        gridItems.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name={subTab === "posts" ? "camera-outline" : "bookmark-outline"} size={38} color={theme.primary} />
            <Text style={{ color: theme.muted, fontSize: 13, fontWeight: "700" }}>
              {subTab === "posts" ? "لم تنشر أي صورة بعد — اضغط + في الأسفل" : "لا توجد منشورات محفوظة بعد"}
            </Text>
          </View>
        ) : (
          <View style={styles.gridWrap}>
            {gridItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
                activeOpacity={0.85}
                onPress={() => setSelectedPostId(item.id)}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={[item.bgColor || "#7C3AED", "#0B0E17"]} style={styles.gridImg}>
                    <Text style={styles.gridText} numberOfLines={3}>
                      {item.content}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.gridLikeBadge}>
                  <Ionicons name="heart" size={10} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 9.5, fontWeight: "800" }}>{item.likes}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )
      ) : (
        <View style={styles.settingsBox}>
          <TouchableOpacity
            style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
            onPress={() => setThemeOpen(true)}
          >
            <Ionicons name="chevron-back" size={18} color={theme.primary} />
            <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>🎨 مظهر وهوية SHAHINAZ</Text>
              <Text style={[styles.settingSub, { color: theme.primary }]}>الثيم الحالي: {theme.emoji} {theme.name}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={togglePrivateAccount}
          >
            <Switch value={!!currentUser.isPrivate} onValueChange={togglePrivateAccount} />
            <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>حساب خاص (Private)</Text>
              <Text style={[styles.settingSub, { color: theme.muted }]}>فقط المتابعون الموافق عليهم يرون منشوراتك</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.blockedCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={[styles.settingTitle, { color: theme.text }]}>المستخدمون المحظورون</Text>
              <Text style={{ color: theme.muted, fontWeight: "700" }}>{blockedUserIds.length}</Text>
            </View>
            {blockedUserIds.length > 0 && (
              <View style={{ marginTop: 8, gap: 6 }}>
                {blockedUserIds.map((uid) => {
                  const u = allUsers.find((x) => x.id === uid);
                  return (
                    <View key={uid} style={[styles.blockedItem, { borderTopColor: theme.border }]}>
                      <TouchableOpacity onPress={() => unblockUser(uid)}>
                        <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "800" }}>إلغاء الحظر</Text>
                      </TouchableOpacity>
                      <Text style={{ color: theme.text, fontSize: 13 }}>{u ? u.name : uid}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.surface2 }]} onPress={logout}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>تسجيل الخروج</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dangerBtn, { borderColor: theme.danger }]} onPress={confirmDeleteAccount}>
            <Text style={{ color: theme.danger, fontWeight: "800" }}>حذف الحساب نهائياً</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSecretVersionTap}
            style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}
          >
            <Text style={{ color: theme.muted, fontSize: 11.5 }}>SHAHINAZ Ultra 5.0 · Royal Platinum</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Interactive Post Detail Modal */}
      <Modal visible={!!selectedPost} transparent animationType="fade" onRequestClose={() => setSelectedPostId(null)}>
        <View style={styles.modalBackdrop}>
          {selectedPost && (
            <View style={[styles.postModalCard, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <View style={[styles.postModalHead, { borderBottomColor: theme.border }]}>
                <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}>{selectedPost.author.name}</Text>
                <TouchableOpacity onPress={() => setSelectedPostId(null)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              {selectedPost.imageUri ? (
                <Image source={{ uri: selectedPost.imageUri }} style={styles.postModalImg} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[selectedPost.bgColor || "#7C3AED", "#0B0E17"]} style={styles.postModalTextBox}>
                  <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" }}>
                    {selectedPost.content}
                  </Text>
                </LinearGradient>
              )}
              <View style={{ padding: 14, gap: 10 }}>
                {!!selectedPost.imageUri && !!selectedPost.content && (
                  <Text style={{ color: theme.text, fontSize: 13.5, textAlign: "right", lineHeight: 20 }}>
                    {selectedPost.content}
                  </Text>
                )}
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row-reverse", gap: 16, alignItems: "center" }}>
                    <TouchableOpacity
                      style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}
                      onPress={() => toggleLike(selectedPost.id)}
                    >
                      <Ionicons
                        name={selectedPost.likedByMe ? "heart" : "heart-outline"}
                        size={22}
                        color={selectedPost.likedByMe ? theme.heart : theme.text}
                      />
                      <Text style={{ color: theme.text, fontWeight: "700", fontSize: 13 }}>{selectedPost.likes}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => toggleSave(selectedPost.id)}>
                      <Ionicons
                        name={selectedPost.savedByMe ? "bookmark" : "bookmark-outline"}
                        size={21}
                        color={selectedPost.savedByMe ? theme.primary : theme.text}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Share.share({ message: `${selectedPost.author.name} على SHAHINAZ:\n${selectedPost.content}` })}
                    >
                      <Ionicons name="paper-plane-outline" size={21} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                  {selectedPost.author.id === currentUser.id && (
                    <TouchableOpacity
                      onPress={() =>
                        Alert.alert("حذف المنشور", "هل تريد حذف هذا المنشور نهائياً؟", [
                          { text: "إلغاء", style: "cancel" },
                          {
                            text: "حذف",
                            style: "destructive",
                            onPress: () => {
                              deleteMyPost(selectedPost.id);
                              setSelectedPostId(null);
                            },
                          },
                        ])
                      }
                    >
                      <Text style={{ color: theme.danger, fontWeight: "800", fontSize: 12.5 }}>🗑️ حذف المنشور</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Creator Analytics Studio Modal */}
      <Modal visible={analyticsOpen} transparent animationType="slide" onRequestClose={() => setAnalyticsOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.analyticsCard, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>📊 استوديو تحليلاتك</Text>
              <TouchableOpacity onPress={() => setAnalyticsOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={theme.coverGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: theme.borderGlow }}
            >
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "800" }}>مستوى صانع المحتوى</Text>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginTop: 2 }}>{creatorLevel.title}</Text>
                </View>
                <View style={{ backgroundColor: theme.primarySoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
                  <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 12 }}>🪙 {pts} نقطة</Text>
                </View>
              </View>
              <View style={{ height: 7, backgroundColor: "rgba(255,255,255,0.14)", borderRadius: 4, marginTop: 12, overflow: "hidden" }}>
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${creatorLevel.pct}%`, height: "100%", borderRadius: 4 }} />
              </View>
              <Text style={{ color: theme.muted, fontSize: 11, textAlign: "right", marginTop: 5 }}>
                التقدم للمستوى التالي: {creatorLevel.pct}%
              </Text>
            </LinearGradient>

            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {[
                { label: "الوصول التقديري", val: estReach.toLocaleString("fr-DZ"), icon: "eye-outline" as const, color: theme.primary },
                { label: "مجموع الإعجابات", val: totalLikes.toLocaleString("fr-DZ"), icon: "heart" as const, color: theme.heart },
                { label: "التعليقات", val: String(totalComments), icon: "chatbubble-ellipses" as const, color: theme.verified },
                { label: "منشوراتك", val: String(myPosts.length), icon: "grid-outline" as const, color: theme.success },
              ].map((kpi) => (
                <View key={kpi.label} style={[styles.kpiBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Ionicons name={kpi.icon} size={18} color={kpi.color} />
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 4 }}>{kpi.val}</Text>
                  <Text style={{ color: theme.muted, fontSize: 11 }}>{kpi.label}</Text>
                </View>
              ))}
            </View>

            {myPosts.length > 0 && (
              <View style={{ backgroundColor: theme.surface, borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "800", textAlign: "right", marginBottom: 4 }}>
                  🏆 أفضل منشور أداءً
                </Text>
                {(() => {
                  const topPost = [...myPosts].sort((a, b) => b.likes - a.likes)[0];
                  return (
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <Text style={{ color: theme.text, fontSize: 12.5, flex: 1, textAlign: "right" }} numberOfLines={2}>
                        {topPost.content || "منشور مصوّر"}
                      </Text>
                      <Text style={{ color: theme.heart, fontWeight: "800", fontSize: 13 }}>❤️ {topPost.likes}</Text>
                    </View>
                  );
                })()}
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => {
                setAnalyticsOpen(false);
                setTimeout(() => setStreakOpen(true), 200);
              }}
            >
              <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>
                  🔥 افتح المكافآت اليومية ومتجر النقاط
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DailyStreakModal visible={streakOpen} onClose={() => setStreakOpen(false)} />
      <ThemeStudioModal visible={themeOpen} onClose={() => setThemeOpen(false)} />
      <WalletModal visible={walletOpen} onClose={() => setWalletOpen(false)} />

      <DevVaultModal
        visible={devVaultOpen}
        expectedPin={adminPin}
        onClose={() => setDevVaultOpen(false)}
        onUnlock={() => setShowAdmin(true)}
      />

      <Modal visible={showAdmin} animationType="slide" onRequestClose={() => setShowAdmin(false)}>
        <AdminScreen onClose={() => setShowAdmin(false)} />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  coverBanner: {
    height: 146,
    paddingHorizontal: 16,
    paddingTop: 14,
    overflow: "hidden",
  },
  coverTopRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  handlePill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  coverIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  identityWrap: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  avatarOverlap: {
    marginTop: -50,
    position: "relative",
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 34,
    padding: 3.5,
    borderWidth: 3,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 28,
    padding: 2,
  },
  avatarImg: { width: "100%", height: "100%", borderRadius: 26 },
  avatarFallback: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: -2,
    left: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: { fontSize: 20, fontWeight: "900" },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.8,
  },
  bio: { fontSize: 13, marginTop: 8, textAlign: "center", lineHeight: 20, paddingHorizontal: 10 },
  kpiCapsule: {
    flexDirection: "row-reverse",
    alignItems: "center",
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 14,
    marginTop: 14,
  },
  kpiCol: { flex: 1, alignItems: "center" },
  kpiDivider: { width: 1, height: 26 },
  statNum: { fontSize: 17, fontWeight: "900" },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  btnRow: { flexDirection: "row-reverse", gap: 8, marginTop: 12, width: "100%" },
  primaryActionBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 15,
    paddingVertical: 11,
  },
  glassBtn: {
    flex: 1,
    borderRadius: 15,
    borderWidth: 1,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  editBox: {
    width: "100%",
    marginTop: 12,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: "right",
    borderWidth: 1,
  },
  saveBtn: { borderRadius: 14, padding: 13, alignItems: "center" },
  subTabs: {
    flexDirection: "row-reverse",
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 14,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 14,
  },
  gridWrap: { flexDirection: "row-reverse", flexWrap: "wrap", paddingHorizontal: 12, gap: 6 },
  gridTile: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.15,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.8,
    position: "relative",
  },
  gridImg: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 8 },
  gridText: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  gridLikeBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  emptyBox: {
    marginHorizontal: 16,
    paddingVertical: 42,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
  },
  settingsBox: { paddingHorizontal: 16, gap: 10 },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  blockedCard: { padding: 14, borderRadius: 18, borderWidth: 1 },
  blockedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderTopWidth: 0.5,
  },
  settingTitle: { fontSize: 14, fontWeight: "800" },
  settingSub: { fontSize: 11.5, marginTop: 2 },
  logoutBtn: { borderRadius: 16, padding: 14, alignItems: "center" },
  dangerBtn: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.84)", justifyContent: "center", padding: 18 },
  postModalCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1 },
  postModalHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  postModalImg: { width: "100%", height: 320 },
  postModalTextBox: { width: "100%", minHeight: 220, padding: 24, alignItems: "center", justifyContent: "center" },
  analyticsCard: { borderRadius: 26, padding: 18, borderWidth: 1 },
  kpiBox: {
    width: "48.5%",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
  },
});
