import React, { useMemo, useRef, useState } from "react";
import {
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
import { useDevTelemetry } from "../services/devTelemetry";
import type { RolePermissions, UserRole } from "../types";
import DiagnosticsPanel from "../components/admin/DiagnosticsPanel";
import NetworkPanel from "../components/admin/NetworkPanel";
import CloudServerPanel from "../components/admin/CloudServerPanel";
import DevToolsPanel from "../components/admin/DevToolsPanel";

type AdminTab = "overview" | "diagnostics" | "network" | "cloud" | "users" | "permissions" | "content" | "tools";

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
    marketEnabled,
    audioRoomsEnabled,
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
    adminSetAnnouncement,
    adminClearLogs,
    blockUser,
    unblockUser,
  } = useApp();

  const { errors, networkLogs } = useDevTelemetry();

  const [tab, setTab] = useState<AdminTab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("MODERATOR");
  const [bannerInput, setBannerInput] = useState(announcement);
  const [pushInput, setPushInput] = useState("");
  const [wordInput, setWordInput] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(""), 2600);
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)
    );
  }, [allUsers, userSearch]);

  const tabsList: { key: AdminTab; label: string; alert?: boolean }[] = [
    { key: "overview", label: "📊 القيادة" },
    { key: "diagnostics", label: `🐞 أخطاء (${errors.length})`, alert: errors.length > 0 },
    { key: "network", label: `🌐 الشبكة (${networkLogs.length})` },
    { key: "cloud", label: "☁️ السيرفر" },
    { key: "users", label: `👥 الأعضاء (${allUsers.length})` },
    { key: "permissions", label: "🛡️ الصلاحيات" },
    { key: "content", label: `📝 المحتوى (${allPosts.length})` },
    { key: "tools", label: "🧰 الأدوات" },
  ];

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      {/* Luxury SHAHINAZ DevOS v2.0 Header */}
      <LinearGradient colors={["#1e1b4b", "#09090b", "#000000"]} style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <LinearGradient colors={["#a855f7", "#ec4899", "#3897f0"]} style={styles.badgeIcon}>
              <Ionicons name="terminal" size={20} color="#fff" />
            </LinearGradient>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.title}>SHAHINAZ DevOS v2.0</Text>
              <Text style={styles.subtitle}>مركز قيادة المطور · كشف الأخطاء · Neon Cloud · أدوات متقدمة</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* All 8 Developer Modules Visible Simultaneously in Crisp 4x2 Grid */}
        <View style={styles.tabsGrid}>
          {tabsList.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabPill,
                tab === t.key && styles.tabPillActive,
                t.alert && tab !== t.key && { borderColor: COLORS.danger },
              ]}
              onPress={() => setTab(t.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  tab === t.key && styles.tabTextActive,
                  t.alert && tab !== t.key && { color: COLORS.danger },
                ]}
                numberOfLines={1}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!!toastMsg && (
          <View
            style={[
              styles.toastBar,
              (toastMsg.startsWith("⚠️") || toastMsg.startsWith("❌")) && {
                backgroundColor: "rgba(239,68,68,0.18)",
                borderColor: COLORS.danger,
              },
            ]}
          >
            <Text
              style={[
                styles.toastText,
                (toastMsg.startsWith("⚠️") || toastMsg.startsWith("❌")) && { color: "#fca5a5" },
              ]}
            >
              {toastMsg}
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* 1. COMMAND OVERVIEW */}
        {tab === "overview" && (
          <>
            <View style={styles.kpiGrid}>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("diagnostics")}>
                <Text style={[styles.kpiNum, { color: errors.length > 0 ? COLORS.danger : COLORS.success }]}>
                  {errors.length}
                </Text>
                <Text style={styles.kpiLabel}>🐞 أخطاء مرصودة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("network")}>
                <Text style={[styles.kpiNum, { color: COLORS.verified }]}>{networkLogs.length}</Text>
                <Text style={styles.kpiLabel}>🌐 طلبات الشبكة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("users")}>
                <Text style={styles.kpiNum}>{allUsers.length}</Text>
                <Text style={styles.kpiLabel}>👥 المستخدمون</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.kpiCard} onPress={() => setTab("content")}>
                <Text style={[styles.kpiNum, { color: COLORS.warn }]}>{codOrders.length}</Text>
                <Text style={styles.kpiLabel}>🛍️ طلبات 58 ولاية</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Action Launchpad */}
            <View style={styles.row}>
              <TouchableOpacity style={styles.launchCard} onPress={() => setTab("diagnostics")}>
                <Ionicons name="pulse" size={20} color={COLORS.success} />
                <Text style={styles.launchTxt}>فحص الأخطاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.launchCard} onPress={() => setTab("cloud")}>
                <Ionicons name="cloud-done-outline" size={20} color={COLORS.verified} />
                <Text style={styles.launchTxt}>Neon السحابي</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.launchCard} onPress={() => setTab("tools")}>
                <Ionicons name="construct-outline" size={20} color={COLORS.primary} />
                <Text style={styles.launchTxt}>التخزين و HUD</Text>
              </TouchableOpacity>
            </View>

            {/* Quick System Health Strip */}
            <TouchableOpacity style={styles.statusStrip} activeOpacity={0.8} onPress={() => setTab("tools")}>
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

        {/* 2. ERROR DETECTION & 7-POINT DIAGNOSTICS */}
        {tab === "diagnostics" && <DiagnosticsPanel onToast={showToast} />}

        {/* 3. NETWORK MONITOR & BUILT-IN API TESTER */}
        {tab === "network" && <NetworkPanel onToast={showToast} />}

        {/* 4. LIVE NEON POSTGRESQL & RENDER SERVER CONTROL */}
        {tab === "cloud" && <CloudServerPanel onToast={showToast} />}

        {/* 5. USERS & ROLES */}
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

        {/* 6. GRANULAR ROLE PERMISSIONS MATRIX */}
        {tab === "permissions" && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛡️ مصفوفة الصلاحيات حسب الرتبة</Text>
              <Text style={styles.smallLabel}>
                اختر رتبة وعدّل صلاحياتها الحقيقية داخل التطبيق — يتم تطبيقها وحفظها فوراً!
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

        {/* 7. CONTENT, MODERATION, SAFETY REPORTS & AUTO-FILTER */}
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
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={styles.cardTitle}>🚩 البلاغات وفلتر الكلمات ({reports.length})</Text>
                {reports.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      adminClearAllReports();
                      showToast("✓ تم تصفير كل البلاغات");
                    }}
                  >
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
                        <TouchableOpacity
                          style={styles.dangerBtn}
                          onPress={() => {
                            adminDeletePost(rep.postId);
                            showToast("🗑️ تم حذف المنشور المخالف");
                          }}
                        >
                          <Text style={styles.dangerText}>🗑️ حذف المنشور</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.outlineBtn}
                          onPress={() => {
                            adminDismissReport(rep.id);
                            showToast("✓ تم تجاهل البلاغ");
                          }}
                        >
                          <Text style={styles.outlineText}>تجاهل ✓</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}

              {/* Banned Words Auto-Filter */}
              <Text style={[styles.smallLabel, { marginTop: 4 }]}>🛡️ فلتر الكلمات المحظورة (منشورات وتعليقات):</Text>
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
                    if (!wordInput.trim()) return;
                    adminAddBannedWord(wordInput);
                    showToast(`🛡️ تمت إضافة "${wordInput.trim()}" إلى الفلتر`);
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
                    onPress={() => {
                      adminRemoveBannedWord(w);
                      showToast(`تمت إزالة "${w}" من الفلتر`);
                    }}
                  >
                    <Text style={{ color: COLORS.danger, fontSize: 12, fontWeight: "700" }}>{w} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛍️ طلبات 58 ولاية ({codOrders.length}) · 🎙️ غرف ({audioRooms.length}) · 🛒 سوق ({marketItems.length})</Text>
              {codOrders.map((o) => (
                <View key={o.id} style={styles.itemBox}>
                  <Text style={styles.itemTitle}>
                    🛍️ {o.productTitle} — {o.priceDzd.toLocaleString("fr-DZ")} دج
                  </Text>
                  <Text style={styles.itemSub}>
                    {o.buyerName} · 📞 {o.phone} · 📍 {o.wilaya}
                  </Text>
                </View>
              ))}
              {audioRooms.map((r) => (
                <View key={r.id} style={styles.itemBox}>
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.itemTitle}>🎙️ {r.title}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        adminCloseAudioRoom(r.id);
                        showToast("🔇 تم إغلاق الغرفة الصوتية");
                      }}
                    >
                      <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 11.5 }}>إغلاق ✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {marketItems.map((m) => (
                <View key={m.id} style={styles.itemBox}>
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.itemTitle}>🛒 {m.title}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        adminDeleteMarketItem(m.id);
                        showToast("🗑️ تم حذف المنتج من السوق");
                      }}
                    >
                      <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 11.5 }}>حذف 🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* 8. DEVELOPER POWER TOOLS, STORAGE INSPECTOR, HUD & SECURITY */}
        {tab === "tools" && <DevToolsPanel onToast={showToast} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 12, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  headerRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#fff", fontSize: 17.5, fontWeight: "900", letterSpacing: 0.4 },
  subtitle: { color: COLORS.muted, fontSize: 10.5, marginTop: 2 },
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
    paddingHorizontal: 10,
    gap: 5,
  },
  tabPill: {
    width: "23.6%",
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  tabPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.muted, fontSize: 10.5, fontWeight: "700" },
  tabTextActive: { color: "#fff" },
  toastBar: {
    marginTop: 8,
    marginHorizontal: 12,
    backgroundColor: "rgba(34,197,94,0.18)",
    borderColor: COLORS.success,
    borderWidth: 0.6,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  toastText: { color: COLORS.success, fontSize: 11.5, fontWeight: "700", textAlign: "center" },
  body: { flex: 1, padding: 12 },
  kpiGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  kpiCard: {
    width: "48.6%",
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  kpiNum: { color: COLORS.primary, fontSize: 22, fontWeight: "800" },
  kpiLabel: { color: COLORS.muted, fontSize: 11.5, marginTop: 2 },
  launchCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    gap: 5,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  launchTxt: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
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
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
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
  wordPill: {
    backgroundColor: "rgba(239,68,68,0.14)",
    borderColor: COLORS.danger,
    borderWidth: 0.5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  toggleLabel: { color: COLORS.text, fontSize: 13.5, fontWeight: "700" },
  toggleSub: { color: COLORS.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  empty: { color: COLORS.muted, textAlign: "center", paddingVertical: 10, fontSize: 13 },
});
