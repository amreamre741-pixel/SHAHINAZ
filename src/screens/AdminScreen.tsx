import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { RolePermissions, UserRole } from "../types";

type AdminTab = "overview" | "users" | "permissions" | "content" | "safety" | "system";

const ROLES: { key: UserRole; label: string; color: string }[] = [
  { key: "ADMIN", label: "👑 مطور", color: "#a855f7" },
  { key: "MODERATOR", label: "🛡️ مشرف", color: "#3897f0" },
  { key: "VIP", label: "⭐ VIP", color: "#f59e0b" },
  { key: "USER", label: "👤 عضو", color: "#64748b" },
];

const PERMISSION_META: { key: keyof RolePermissions; title: string; sub: string }[] = [
  { key: "canPost", title: "النشر في الصفحة الرئيسية", sub: "السماح بإنشاء منشورات وصور واستطلاعات" },
  { key: "canComment", title: "التعليق والتفاعل النصي", sub: "السماح بكتابة تعليقات على المنشورات" },
  { key: "canSellMarket", title: "عرض المنتجات في السوق", sub: "السماح بنشر منتجات للبيع في SHAHINAZ Market" },
  { key: "canCreateAudioRoom", title: "فتح غرف صوتية مباشرة", sub: "السماح بإنشاء قعدات صوتية واستضافة متحدثين" },
  { key: "canBoostPosts", title: "ترويج المنشورات (VIP)", sub: "إمكانية إبراز المنشورات كمنشورات مموّلة" },
  { key: "canModerateContent", title: "صلاحيات الإشراف والأمان", sub: "مراجعة البلاغات وحذف المحتوى المخالف" },
];

const API_HEALTH_URL = (process.env.EXPO_PUBLIC_API_URL || "https://shahinaz.onrender.com") + "/api/health";

export default function AdminScreen({ onClose }: { onClose: () => void }) {
  const {
    currentUser,
    allPosts,
    allUsers,
    marketItems,
    audioRooms,
    codOrders,
    reports,
    blockedUserIds,
    announcement,
    maintenanceMode,
    allowRegistration,
    marketEnabled,
    audioRoomsEnabled,
    adminPin,
    bannedWords,
    adminLogs,
    rolePermissions,
    adminDeletePost,
    adminToggleSponsor,
    adminTogglePinPost,
    adminDismissReport,
    adminClearAllReports,
    adminToggleVerify,
    adminSetUserRole,
    adminGivePoints,
    adminUpdateRolePermission,
    adminSendGlobalNotification,
    adminDeleteMarketItem,
    adminCloseAudioRoom,
    adminAddBannedWord,
    adminRemoveBannedWord,
    adminChangePin,
    adminSetAnnouncement,
    adminToggleMaintenance,
    adminToggleRegistration,
    adminToggleMarket,
    adminToggleAudioRooms,
    adminClearLogs,
    adminResetSystemSettings,
    blockUser,
    unblockUser,
  } = useApp();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("MODERATOR");
  const [bannerInput, setBannerInput] = useState(announcement);
  const [pushInput, setPushInput] = useState("");
  const [wordInput, setWordInput] = useState("");
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinging, setPinging] = useState(false);
  const [serverStatus, setServerStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 2400);
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  async function testServerHealth() {
    setPinging(true);
    const start = Date.now();
    try {
      const res = await fetch(API_HEALTH_URL);
      const ms = Date.now() - start;
      if (res.ok) {
        setServerStatus({ ok: true, msg: `السيرفر وقاعدة Neon يعملان بامتياز · ${ms} ms` });
        showToast(`✅ السيرفر متصل وسريع (${ms} ms)`);
      } else {
        setServerStatus({ ok: false, msg: `استجابة غير مكتملة (HTTP ${res.status}) · ${ms} ms` });
      }
    } catch {
      setServerStatus({ ok: false, msg: "تعذر الوصول إلى Render — قد يكون في وضع الاستيقاظ (Cold Start)" });
    } finally {
      setPinging(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Luxury Super-Admin Header */}
      <LinearGradient colors={["#1e1b4b", "#09090b", "#000000"]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <LinearGradient colors={["#a855f7", "#ec4899"]} style={styles.badgeIcon}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.title}>مركز قيادة المطور</Text>
              <Text style={styles.subtitle}>SHAHINAZ Super-Admin · صلاحيات كاملة ومشفّرة</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* All 6 Admin Tabs Visible in 3x2 Grid (No Hidden Tabs on Android RTL) */}
        <View style={styles.tabsGrid}>
          {[
            { key: "overview", label: "📊 القيادة" },
            { key: "users", label: `👥 الأعضاء (${allUsers.length})` },
            { key: "permissions", label: "🛡️ الصلاحيات" },
            { key: "content", label: `📝 المحتوى (${allPosts.length})` },
            { key: "safety", label: `🚩 الأمان (${reports.length})` },
            { key: "system", label: "⚙️ النظام" },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabPill, tab === t.key && styles.tabPillActive]}
              onPress={() => setTab(t.key as AdminTab)}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!toastMsg && (
          <View style={styles.toastBar}>
            <Text style={styles.toastText}>{toastMsg}</Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 46 }} showsVerticalScrollIndicator={false}>
        {/* 1. OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            <View style={styles.kpiGrid}>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("users")}>
                <Text style={styles.kpiNum}>{allUsers.length}</Text>
                <Text style={styles.kpiLabel}>المستخدمون</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("content")}>
                <Text style={styles.kpiNum}>{allPosts.length}</Text>
                <Text style={styles.kpiLabel}>المنشورات</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("content")}>
                <Text style={[styles.kpiNum, { color: COLORS.success }]}>{codOrders.length}</Text>
                <Text style={styles.kpiLabel}>طلبات 58 ولاية</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("safety")}>
                <Text style={[styles.kpiNum, { color: reports.length > 0 ? COLORS.danger : COLORS.verified }]}>
                  {reports.length}
                </Text>
                <Text style={styles.kpiLabel}>البلاغات</Text>
              </TouchableOpacity>
            </View>

            {/* Quick System Health Strip (Tappable to jump to System tab) */}
            <TouchableOpacity style={styles.statusStrip} activeOpacity={0.8} onPress={() => setTab("system")}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: maintenanceMode ? COLORS.warn : COLORS.success }]} />
                <Text style={styles.statusPillText}>{maintenanceMode ? "صيانة" : "النشر نشط"}</Text>
              </View>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: marketEnabled ? COLORS.success : COLORS.danger }]} />
                <Text style={styles.statusPillText}>{marketEnabled ? "السوق مفتوح" : "السوق مغلق"}</Text>
              </View>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, { backgroundColor: audioRoomsEnabled ? COLORS.success : COLORS.danger }]} />
                <Text style={styles.statusPillText}>{audioRoomsEnabled ? "الصوتيات نشطة" : "الصوتيات متوقفة"}</Text>
              </View>
            </TouchableOpacity>

            {/* Broadcast Banner */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📢 إعلان عاجل في أعلى الرئيسية</Text>
              <TextInput
                style={styles.input}
                placeholder="اكتب رسالة شريط الإعلان لجميع المستخدمين..."
                placeholderTextColor={COLORS.muted}
                value={bannerInput}
                onChangeText={setBannerInput}
              />
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    if (!bannerInput.trim()) {
                      Alert.alert("تنبيه", "اكتب نص الإعلان أولاً.");
                      return;
                    }
                    adminSetAnnouncement(bannerInput);
                    showToast("📢 تم بث الإعلان في أعلى الرئيسية!");
                  }}
                >
                  <Text style={styles.btnText}>بث الإعلان الآن</Text>
                </TouchableOpacity>
                {!!announcement && (
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={() => {
                      setBannerInput("");
                      adminSetAnnouncement("");
                      showToast("✓ تم إيقاف شريط الإعلان");
                    }}
                  >
                    <Text style={styles.outlineText}>إيقاف</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Global Push Notification */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔔 إرسال إشعار فوري لجرس الإشعارات</Text>
              <TextInput
                style={styles.input}
                placeholder="مثال: تم إطلاق تحديث جديد وجوائز هذا الأسبوع! 🎉"
                placeholderTextColor={COLORS.muted}
                value={pushInput}
                onChangeText={setPushInput}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: COLORS.verified }]}
                onPress={() => {
                  if (!pushInput.trim()) {
                    Alert.alert("تنبيه", "اكتب نص الإشعار أولاً.");
                    return;
                  }
                  adminSendGlobalNotification(pushInput);
                  setPushInput("");
                  showToast("🔔 تم إرسال الإشعار الفوري للجميع!");
                }}
              >
                <Text style={styles.btnText}>إرسال إشعار فوري للجميع</Text>
              </TouchableOpacity>
            </View>

            {/* Audit Log */}
            <View style={styles.card}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.cardTitle}>📜 سجل نشاط الإدارة (Audit Log)</Text>
                <TouchableOpacity
                  onPress={() => {
                    adminClearLogs();
                    showToast("✓ تم مسح سجل النشاط");
                  }}
                >
                  <Text style={{ color: COLORS.muted, fontSize: 11, fontWeight: "700" }}>مسح السجل</Text>
                </TouchableOpacity>
              </View>
              {adminLogs.map((lg) => (
                <View key={lg.id} style={styles.logRow}>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{lg.time}</Text>
                  <Text style={{ color: COLORS.text, fontSize: 12.5, flex: 1, textAlign: "right" }}>• {lg.action}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 2. USERS & ROLES TAB */}
        {tab === "users" && (
          <>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              placeholder="🔍 ابحث عن مستخدم بالاسم أو @username..."
              placeholderTextColor={COLORS.muted}
              value={userSearch}
              onChangeText={setUserSearch}
            />
            {filteredUsers.map((u) => {
              const isMe = currentUser?.id === u.id;
              const isBlocked = blockedUserIds.includes(u.id);
              const curRole: UserRole = u.role || "USER";
              return (
                <View key={u.id} style={[styles.card, isMe && { borderColor: "rgba(168,85,247,0.55)" }]}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" }}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                      {u.avatarUri ? (
                        <Image source={{ uri: u.avatarUri }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={{ fontSize: 18 }}>{u.avatarEmoji}</Text>
                        </View>
                      )}
                      <View style={{ alignItems: "flex-end" }}>
                        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                          <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 14 }}>{u.name}</Text>
                          {u.verified && <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />}
                          {isMe && (
                            <View style={styles.meTag}>
                              <Text style={{ color: COLORS.primary, fontSize: 10, fontWeight: "800" }}>حسابك</Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: COLORS.muted, fontSize: 11 }}>
                          @{u.username} · 🏆 {u.points ?? 100} نقطة
                        </Text>
                      </View>
                    </View>
                    {!isMe && (
                      <TouchableOpacity
                        style={[styles.miniBtn, { backgroundColor: isBlocked ? COLORS.success : "rgba(239,68,68,0.18)" }]}
                        onPress={() => {
                          if (isBlocked) {
                            unblockUser(u.id);
                            showToast(`✓ تم فك الحظر عن ${u.name}`);
                          } else {
                            blockUser(u.id);
                            showToast(`🚫 تم حظر ${u.name}`);
                          }
                        }}
                      >
                        <Text style={{ color: isBlocked ? "#fff" : COLORS.danger, fontSize: 11, fontWeight: "700" }}>
                          {isBlocked ? "فك الحظر" : "🚫 حظر"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Role Selector */}
                  <Text style={styles.smallLabel}>تعيين الرتبة (Role):</Text>
                  <View style={styles.rolesRow}>
                    {ROLES.map((r) => (
                      <TouchableOpacity
                        key={r.key}
                        style={[
                          styles.roleChip,
                          curRole === r.key && { borderColor: r.color, backgroundColor: "rgba(168,85,247,0.18)" },
                        ]}
                        onPress={() => {
                          adminSetUserRole(u.id, r.key);
                          showToast(`✅ تم ترقية ${u.name} إلى ${r.label}`);
                        }}
                      >
                        <Text style={{ color: curRole === r.key ? "#fff" : COLORS.muted, fontSize: 11, fontWeight: "700" }}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Quick Actions: Verify + Points */}
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => {
                        adminToggleVerify(u.id);
                        showToast(u.verified ? `تم سحب التوثيق من ${u.name}` : `☑️ تم منح التوثيق الأزرق لـ ${u.name}`);
                      }}
                    >
                      <Text style={styles.outlineText}>{u.verified ? "سحب التوثيق ☑️" : "توثيق أزرق ☑️"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => {
                        adminGivePoints(u.id, 500);
                        showToast(`🪙 تم منح +500 نقطة لـ ${u.name}`);
                      }}
                    >
                      <Text style={{ color: COLORS.warn, fontWeight: "700", fontSize: 12 }}>+500 🪙</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => {
                        adminGivePoints(u.id, -100);
                        showToast(`تم خصم 100 نقطة من ${u.name}`);
                      }}
                    >
                      <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 12 }}>-100</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* 3. GRANULAR ROLE PERMISSIONS MATRIX TAB */}
        {tab === "permissions" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛡️ مصفوفة الصلاحيات حسب الرتبة</Text>
              <Text style={styles.smallLabel}>
                اختر رتبة وعدّل صلاحياتها الحقيقية داخل التطبيق — يتم تطبيقها فوراً!
              </Text>
              <View style={styles.rolesRow}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.key}
                    style={[
                      styles.roleChip,
                      selectedRole === r.key && { borderColor: r.color, backgroundColor: "rgba(168,85,247,0.22)" },
                    ]}
                    onPress={() => setSelectedRole(r.key)}
                  >
                    <Text style={{ color: selectedRole === r.key ? "#fff" : COLORS.muted, fontSize: 12, fontWeight: "700" }}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                صلاحيات رتبة: {ROLES.find((r) => r.key === selectedRole)?.label}
              </Text>
              {PERMISSION_META.map((perm) => {
                const enabled = rolePermissions[selectedRole][perm.key];
                return (
                  <TouchableOpacity
                    key={perm.key}
                    activeOpacity={0.75}
                    style={styles.toggleRow}
                    onPress={() => {
                      adminUpdateRolePermission(selectedRole, perm.key, !enabled);
                      showToast(`${!enabled ? "✅ تم تفعيل" : "🔒 تم إيقاف"}: ${perm.title}`);
                    }}
                  >
                    <Switch
                      value={enabled}
                      onValueChange={(val) => {
                        adminUpdateRolePermission(selectedRole, perm.key, val);
                        showToast(`${val ? "✅ تم تفعيل" : "🔒 تم إيقاف"}: ${perm.title}`);
                      }}
                    />
                    <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                      <Text style={styles.toggleLabel}>{perm.title}</Text>
                      <Text style={styles.toggleSub}>{perm.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* 4. CONTENT, PIN, BOOST, MARKET, AUDIO ROOMS & ORDERS TAB */}
        {tab === "content" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📝 التحكم في المنشورات والتثبيت والترويج ({allPosts.length})</Text>
              {allPosts.map((p) => (
                <View key={p.id} style={styles.itemBox}>
                  <Text style={styles.itemTitle}>
                    {p.author.name}
                    {p.isPinned ? " · 📌 مثبّت" : ""}
                    {p.isSponsored ? " · ⭐ مموّل" : ""}
                  </Text>
                  <Text style={styles.itemSub} numberOfLines={2}>
                    {p.content}
                  </Text>
                  <View style={styles.row}>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => {
                        adminTogglePinPost(p.id);
                        showToast(p.isPinned ? "تم فك تثبيت المنشور" : "📌 تم تثبيت المنشور أعلى الرئيسية");
                      }}
                    >
                      <Text style={{ color: COLORS.verified, fontWeight: "700", fontSize: 11.5 }}>
                        {p.isPinned ? "فك التثبيت" : "📌 تثبيت"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.outlineBtn}
                      onPress={() => {
                        adminToggleSponsor(p.id);
                        showToast(p.isSponsored ? "تم إيقاف ترويج المنشور" : "⭐ تم تمييز المنشور كمموّل");
                      }}
                    >
                      <Text style={{ color: COLORS.warn, fontWeight: "700", fontSize: 11.5 }}>
                        {p.isSponsored ? "إلغاء الترويج" : "⭐ مموّل"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dangerBtn}
                      onPress={() => {
                        adminDeletePost(p.id);
                        showToast("🗑️ تم حذف المنشور نهائياً");
                      }}
                    >
                      <Text style={styles.dangerText}>🗑️ حذف</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛍️ طلبات الدفع عند الاستلام ({codOrders.length})</Text>
              {codOrders.length === 0 ? (
                <Text style={styles.empty}>لا توجد طلبات مسجلة بعد.</Text>
              ) : (
                codOrders.map((o) => (
                  <View key={o.id} style={styles.itemBox}>
                    <Text style={styles.itemTitle}>
                      {o.productTitle} — {o.priceDzd.toLocaleString("fr-DZ")} دج
                    </Text>
                    <Text style={styles.itemSub}>
                      الزبون: {o.buyerName} · 📞 {o.phone} · 📍 {o.wilaya}
                    </Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎙️ الغرف الصوتية المفتوحة ({audioRooms.length})</Text>
              {audioRooms.length === 0 ? (
                <Text style={styles.empty}>لا توجد غرف صوتية مفتوحة حالياً.</Text>
              ) : (
                audioRooms.map((r) => (
                  <View key={r.id} style={styles.itemBox}>
                    <Text style={styles.itemTitle}>{r.title}</Text>
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.itemSub}>المضيف: {r.hostName} · {r.listeners} مستمع</Text>
                      <TouchableOpacity onPress={() => adminCloseAudioRoom(r.id)}>
                        <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 12 }}>إغلاق الغرفة ✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛒 منتجات السوق ({marketItems.length})</Text>
              {marketItems.map((m) => (
                <View key={m.id} style={styles.itemBox}>
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.itemTitle}>{m.title}</Text>
                    <TouchableOpacity onPress={() => adminDeleteMarketItem(m.id)}>
                      <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 12 }}>حذف 🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemSub}>
                    {m.priceDzd.toLocaleString("fr-DZ")} دج · {m.city} · {m.sellerName}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 5. SAFETY, REPORTS, BLOCKED & AUTO-FILTER TAB */}
        {tab === "safety" && (
          <>
            <View style={styles.card}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.cardTitle}>🚩 مركز البلاغات (حماية Google Play)</Text>
                {reports.length > 0 && (
                  <TouchableOpacity onPress={adminClearAllReports}>
                    <Text style={{ color: COLORS.verified, fontSize: 11.5, fontWeight: "700" }}>تصفير الكل</Text>
                  </TouchableOpacity>
                )}
              </View>
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
                        <TouchableOpacity style={styles.dangerBtn} onPress={() => adminDeletePost(rep.postId)}>
                          <Text style={styles.dangerText}>🗑️ حذف المنشور</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.outlineBtn} onPress={() => adminDismissReport(rep.id)}>
                          <Text style={styles.outlineText}>تجاهل ✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🚫 قائمة المحظورين ({blockedUserIds.length})</Text>
              {blockedUserIds.length === 0 ? (
                <Text style={styles.empty}>لا يوجد مستخدمون محظورون حالياً ✓</Text>
              ) : (
                blockedUserIds.map((uid) => {
                  const u = allUsers.find((x) => x.id === uid);
                  return (
                    <View key={uid} style={styles.blockedRow}>
                      <TouchableOpacity onPress={() => unblockUser(uid)}>
                        <Text style={{ color: COLORS.success, fontWeight: "700", fontSize: 12 }}>فك الحظر</Text>
                      </TouchableOpacity>
                      <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 13 }}>
                        {u ? `${u.name} (@${u.username})` : uid}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛡️ فلتر الكلمات المحظورة التلقائي (منشورات وتعليقات)</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="أضف كلمة ممنوعة..."
                  placeholderTextColor={COLORS.muted}
                  value={wordInput}
                  onChangeText={setWordInput}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { flex: 0, paddingHorizontal: 16 }]}
                  onPress={() => {
                    adminAddBannedWord(wordInput);
                    setWordInput("");
                  }}
                >
                  <Text style={styles.btnText}>إضافة</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
                {bannedWords.map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={styles.wordPill}
                    onPress={() => adminRemoveBannedWord(w)}
                  >
                    <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: "700" }}>{w} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* 6. SYSTEM KILL-SWITCHES, SERVER DIAGNOSTICS & VAULT SECURITY TAB */}
        {tab === "system" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ مفاتيح التحكم الحية (Kill Switches)</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.toggleRow}
                onPress={() => {
                  adminToggleMaintenance();
                  showToast(!maintenanceMode ? "⚡ تم تفعيل وضع الصيانة (توقف النشر)" : "✅ تم إيقاف الصيانة وعودة النشر");
                }}
              >
                <Switch
                  value={maintenanceMode}
                  onValueChange={() => {
                    adminToggleMaintenance();
                    showToast(!maintenanceMode ? "⚡ تم تفعيل وضع الصيانة (توقف النشر)" : "✅ تم إيقاف الصيانة وعودة النشر");
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={styles.toggleLabel}>وضع الصيانة (إيقاف النشر)</Text>
                  <Text style={styles.toggleSub}>تجميد النشر مؤقتاً أثناء التحديثات</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.toggleRow}
                onPress={() => {
                  adminToggleRegistration();
                  showToast(!allowRegistration ? "✅ تم فتح التسجيل للحسابات الجديدة" : "🔒 تم إغلاق التسجيل الجديد مؤقتاً");
                }}
              >
                <Switch
                  value={allowRegistration}
                  onValueChange={() => {
                    adminToggleRegistration();
                    showToast(!allowRegistration ? "✅ تم فتح التسجيل للحسابات الجديدة" : "🔒 تم إغلاق التسجيل الجديد مؤقتاً");
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={styles.toggleLabel}>السماح بالتسجيل الجديد</Text>
                  <Text style={styles.toggleSub}>فتح أو إغلاق إنشاء حسابات جديدة</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.toggleRow}
                onPress={() => {
                  adminToggleMarket();
                  showToast(!marketEnabled ? "🛒 تم تفعيل قسم السوق" : "🔒 تم إيقاف قسم السوق مؤقتاً");
                }}
              >
                <Switch
                  value={marketEnabled}
                  onValueChange={() => {
                    adminToggleMarket();
                    showToast(!marketEnabled ? "🛒 تم تفعيل قسم السوق" : "🔒 تم إيقاف قسم السوق مؤقتاً");
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={styles.toggleLabel}>تفعيل السوق (Marketplace)</Text>
                  <Text style={styles.toggleSub}>إظهار أو إيقاف قسم البيع والشراء</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.toggleRow}
                onPress={() => {
                  adminToggleAudioRooms();
                  showToast(!audioRoomsEnabled ? "🎙️ تم تفعيل الغرف الصوتية" : "🔇 تم إيقاف الغرف الصوتية مؤقتاً");
                }}
              >
                <Switch
                  value={audioRoomsEnabled}
                  onValueChange={() => {
                    adminToggleAudioRooms();
                    showToast(!audioRoomsEnabled ? "🎙️ تم تفعيل الغرف الصوتية" : "🔇 تم إيقاف الغرف الصوتية مؤقتاً");
                  }}
                />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={styles.toggleLabel}>تفعيل الغرف الصوتية 🎙️</Text>
                  <Text style={styles.toggleSub}>تشغيل أو إيقاف القعدات الصوتية</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Live Server & Neon Health Diagnostics */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🌐 فحص السيرفر وقاعدة البيانات (Render + Neon)</Text>
              <Text style={styles.smallLabel}>API: https://shahinaz.onrender.com/api/health · DB: Neon</Text>
              {serverStatus && (
                <View
                  style={[
                    styles.healthBox,
                    { borderColor: serverStatus.ok ? COLORS.success : COLORS.danger },
                  ]}
                >
                  <Text style={{ color: serverStatus.ok ? COLORS.success : COLORS.danger, fontSize: 12, fontWeight: "700", textAlign: "right" }}>
                    {serverStatus.ok ? "✅ " : "⚠️ "}
                    {serverStatus.msg}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.outlineBtn} onPress={testServerHealth} disabled={pinging}>
                {pinging ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.outlineText}>⚡ فحص سرعة الاتصال الآن</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Developer Vault Security PIN */}
            <View style={styles.card}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.cardTitle}>🔐 بوابة المطور السرية</Text>
                <TouchableOpacity onPress={() => setShowPin((v) => !v)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name={showPin ? "eye-off-outline" : "eye-outline"} size={16} color={COLORS.muted} />
                  <Text style={{ color: COLORS.muted, fontSize: 12, fontWeight: "700" }}>
                    {showPin ? adminPin : "•".repeat(adminPin.length)}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.smallLabel}>
                طرق الدخول المخفية: اضغط مطولاً على شعار SHAHINAZ في الرئيسية، أو اضغط 5 مرات على رقم الإصدار داخل الإعدادات.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="أدخل الرمز السري الجديد (4 أرقام أو أكثر)"
                placeholderTextColor={COLORS.muted}
                keyboardType="number-pad"
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
              />
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  const digits = newPin.trim().replace(/\D/g, "");
                  if (digits.length < 4) {
                    Alert.alert("تنبيه", "يجب أن يتكون الرمز من 4 أرقام على الأقل.");
                    return;
                  }
                  adminChangePin(digits);
                  setNewPin("");
                  showToast("🔐 تم تحديث رمز البوابة السري وحفظه بنجاح!");
                }}
              >
                <Text style={styles.btnText}>تحديث رمز البوابة السري</Text>
              </TouchableOpacity>
            </View>

            {/* Reset System Settings */}
            <TouchableOpacity
              style={styles.dangerBtn}
              onPress={() =>
                Alert.alert("إعادة ضبط الإعدادات", "سيتم إعادة تفعيل جميع الأقسام والصلاحيات للوضع الافتراضي.", [
                  { text: "إلغاء", style: "cancel" },
                  {
                    text: "نعم، إعادة ضبط",
                    style: "destructive",
                    onPress: () => {
                      adminResetSystemSettings();
                      showToast("🔄 تمت إعادة ضبط جميع الإعدادات للوضع الافتراضي");
                    },
                  },
                ])
              }
            >
              <Text style={styles.dangerText}>🔄 إعادة ضبط إعدادات النظام للوضع الافتراضي</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800" },
  subtitle: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 6,
  },
  tabPill: {
    width: "31.5%",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  tabPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: 11.5, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  toastBar: {
    marginTop: 10,
    marginHorizontal: 14,
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: COLORS.success,
    borderWidth: 0.6,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  toastText: { color: COLORS.success, fontSize: 12, fontWeight: "700", textAlign: "center" },
  body: { flex: 1, padding: 14 },
  kpiGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  kpiCard: {
    width: "48.5%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  kpiNum: { color: COLORS.primary, fontSize: 22, fontWeight: "800" },
  kpiLabel: { color: COLORS.muted, fontSize: 12, marginTop: 3 },
  statusStrip: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  statusPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { color: COLORS.text, fontSize: 11, fontWeight: "600" },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 14.5, fontWeight: "800", textAlign: "right" },
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
  row: { flexDirection: "row-reverse", gap: 8 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, padding: 11, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  outlineBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  outlineText: { color: COLORS.text, fontWeight: "700", fontSize: 12 },
  dangerBtn: {
    flex: 1,
    backgroundColor: "rgba(239,68,68,0.14)",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.danger,
  },
  dangerText: { color: COLORS.danger, fontWeight: "700", fontSize: 12 },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  avatarFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  meTag: {
    backgroundColor: "rgba(168,85,247,0.18)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  smallLabel: { color: COLORS.muted, fontSize: 11.5, textAlign: "right", lineHeight: 18 },
  rolesRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemBox: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 10,
    gap: 6,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  itemTitle: { color: COLORS.text, fontWeight: "700", fontSize: 13, textAlign: "right" },
  itemSub: { color: COLORS.muted, fontSize: 11.5, textAlign: "right" },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  blockedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  wordPill: {
    backgroundColor: "rgba(239,68,68,0.14)",
    borderColor: COLORS.danger,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  healthBox: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
  },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  toggleLabel: { color: COLORS.text, fontSize: 13.5, fontWeight: "700" },
  toggleSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 10, fontSize: 13 },
});
