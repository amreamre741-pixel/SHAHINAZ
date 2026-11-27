import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../theme";
import { useApp } from "../../store/AppContext";
import { apiFetch } from "../../services/api";
import { devTelemetry } from "../../services/devTelemetry";
import {
  applyOtaUpdateNow,
  checkAndDownloadOtaUpdate,
  getOtaMetadata,
} from "../../services/otaUpdates";

interface StorageRow {
  key: string;
  value: string;
  bytes: number;
}

export default function DevToolsPanel({ onToast }: { onToast: (msg: string) => void }) {
  const {
    maintenanceMode,
    allowRegistration,
    marketEnabled,
    audioRoomsEnabled,
    devHudEnabled,
    adminPin,
    adminToggleMaintenance,
    adminToggleRegistration,
    adminToggleMarket,
    adminToggleAudioRooms,
    adminToggleDevHud,
    adminChangePin,
    adminResetSystemSettings,
  } = useApp();

  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [storageRows, setStorageRows] = useState<StorageRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [checkingOta, setCheckingOta] = useState(false);
  const [otaStatusMsg, setOtaStatusMsg] = useState("");
  const [otaReadyToReload, setOtaReadyToReload] = useState(false);
  const [remoteVer, setRemoteVer] = useState("1.0.0");
  const [remoteNotes, setRemoteNotes] = useState("تحديث جديد وميزات رائعة في SHAHINAZ 🚀");
  const [remoteForce, setRemoteForce] = useState(false);
  const [savingRemoteVer, setSavingRemoteVer] = useState(false);

  const specs = devTelemetry.getDeviceSpecs();
  const otaMeta = getOtaMetadata();

  async function handleCheckOtaNow() {
    setCheckingOta(true);
    setOtaStatusMsg("");
    const res = await checkAndDownloadOtaUpdate();
    setOtaStatusMsg(res.message);
    setOtaReadyToReload(res.status === "ready");
    onToast(res.status === "ready" ? "⚡ تم تحميل التحديث وجاهز للتثبيت!" : res.message);
    setCheckingOta(false);
  }

  async function handlePublishRemoteVersion() {
    if (!remoteVer.trim()) return;
    setSavingRemoteVer(true);
    try {
      await apiFetch("/api/admin/app/version", null, {
        method: "POST",
        headers: { "x-admin-pin": adminPin },
        body: JSON.stringify({
          latestVersion: remoteVer.trim(),
          minVersion: remoteForce ? remoteVer.trim() : "1.0.0",
          forceUpdate: remoteForce,
          releaseNotes: remoteNotes.trim(),
        }),
      });
      onToast(`🚀 تم نشر إشعار الإصدار v${remoteVer.trim()} على السيرفر!`);
    } catch (e) {
      Alert.alert("تنبيه", e instanceof Error ? e.message : "تعذر تحديث رقم الإصدار على السيرفر");
    } finally {
      setSavingRemoteVer(false);
    }
  }

  async function scanStorage() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      if (!keys.length) {
        setStorageRows([]);
        return;
      }
      const pairs = await AsyncStorage.multiGet(keys);
      const rows: StorageRow[] = pairs.map(([k, v]) => {
        const val = v || "";
        return { key: k, value: val, bytes: val.length };
      });
      setStorageRows(rows);
    } catch {
      onToast("⚠️ تعذر قراءة التخزين المحلي");
    }
  }

  useEffect(() => {
    scanStorage();
  }, []);

  const totalBytes = storageRows.reduce((s, r) => s + r.bytes, 0);

  return (
    <View style={{ gap: 12 }}>
      {/* Live Automatic OTA Updates & Remote Version Control */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🚀 نظام التحديث التلقائي (OTA Auto-Update)</Text>
        <View style={styles.specsGrid}>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{otaMeta.channel}</Text>
            <Text style={styles.specLbl}>قناة التحديث</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>v{otaMeta.runtimeVersion}</Text>
            <Text style={styles.specLbl}>Runtime</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{otaMeta.isEmbeddedLaunch ? "APK أساسي" : "تحديث OTA ⚡"}</Text>
            <Text style={styles.specLbl}>مصدر التشغيل</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{otaMeta.updateId}</Text>
            <Text style={styles.specLbl}>معرّف النسخة</Text>
          </View>
        </View>

        {!!otaStatusMsg && (
          <Text style={{ color: otaReadyToReload ? COLORS.success : COLORS.verified, fontSize: 12, fontWeight: "700", textAlign: "right" }}>
            {otaStatusMsg}
          </Text>
        )}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckOtaNow} disabled={checkingOta}>
          {checkingOta ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>🔄 فحص وتحميل التحديث التلقائي الآن</Text>
          )}
        </TouchableOpacity>

        {otaReadyToReload && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: COLORS.success }]}
            onPress={applyOtaUpdateNow}
          >
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>⚡ تطبيق التحديث وإعادة التشغيل فوراً</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sub, { marginTop: 4 }]}>
          📢 إشعار نسخة APK / Google Play كبرى (يظهر لجميع المستخدمين):
        </Text>
        <TextInput
          style={styles.input}
          placeholder="رقم الإصدار الجديد (مثال: 1.1.0)"
          placeholderTextColor={COLORS.muted}
          value={remoteVer}
          onChangeText={setRemoteVer}
        />
        <TextInput
          style={styles.input}
          placeholder="ما الجديد في هذا الإصدار؟"
          placeholderTextColor={COLORS.muted}
          value={remoteNotes}
          onChangeText={setRemoteNotes}
        />
        <TouchableOpacity activeOpacity={0.75} style={styles.toggleRow} onPress={() => setRemoteForce((v) => !v)}>
          <Switch value={remoteForce} onValueChange={setRemoteForce} />
          <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
            <Text style={styles.toggleLabel}>تحديث إجباري (إخفاء زر لاحقاً)</Text>
            <Text style={styles.toggleSub}>يطلب من المستخدم تحميل النسخة الجديدة فوراً</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: COLORS.verified }]}
          onPress={handlePublishRemoteVersion}
          disabled={savingRemoteVer}
        >
          {savingRemoteVer ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 12.5 }}>نشر إشعار النسخة الجديدة على السيرفر 🚀</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Live Floating Developer HUD Toggle + Kill Switches */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⚡ مفاتيح التحكم الحية وشريط المطور</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.toggleRow}
          onPress={() => {
            adminToggleDevHud();
            onToast(!devHudEnabled ? "🖥️ تم تفعيل شريط مراقبة المطور العائم (HUD)" : "تم إخفاء شريط المطور العائم");
          }}
        >
          <Switch
            value={devHudEnabled}
            onValueChange={() => {
              adminToggleDevHud();
              onToast(!devHudEnabled ? "🖥️ تم تفعيل شريط مراقبة المطور العائم (HUD)" : "تم إخفاء شريط المطور العائم");
            }}
          />
          <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
            <Text style={styles.toggleLabel}>🖥️ شريط المراقبة العائم (Dev HUD)</Text>
            <Text style={styles.toggleSub}>يعرض FPS والأخطاء وسرعة API وزر دخول سريع أعلى كل شاشة</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.toggleRow}
          onPress={() => {
            adminToggleMaintenance();
            onToast(!maintenanceMode ? "⚡ تم تفعيل وضع الصيانة (توقف النشر)" : "✅ تم إيقاف الصيانة وعودة النشر");
          }}
        >
          <Switch
            value={maintenanceMode}
            onValueChange={() => {
              adminToggleMaintenance();
              onToast(!maintenanceMode ? "⚡ تم تفعيل وضع الصيانة (توقف النشر)" : "✅ تم إيقاف الصيانة وعودة النشر");
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
            onToast(!allowRegistration ? "✅ تم فتح التسجيل للحسابات الجديدة" : "🔒 تم إغلاق التسجيل الجديد مؤقتاً");
          }}
        >
          <Switch
            value={allowRegistration}
            onValueChange={() => {
              adminToggleRegistration();
              onToast(!allowRegistration ? "✅ تم فتح التسجيل للحسابات الجديدة" : "🔒 تم إغلاق التسجيل الجديد مؤقتاً");
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
            onToast(!marketEnabled ? "🛒 تم تفعيل قسم السوق" : "🔒 تم إيقاف قسم السوق مؤقتاً");
          }}
        >
          <Switch
            value={marketEnabled}
            onValueChange={() => {
              adminToggleMarket();
              onToast(!marketEnabled ? "🛒 تم تفعيل قسم السوق" : "🔒 تم إيقاف قسم السوق مؤقتاً");
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
            onToast(!audioRoomsEnabled ? "🎙️ تم تفعيل الغرف الصوتية" : "🔇 تم إيقاف الغرف الصوتية مؤقتاً");
          }}
        >
          <Switch
            value={audioRoomsEnabled}
            onValueChange={() => {
              adminToggleAudioRooms();
              onToast(!audioRoomsEnabled ? "🎙️ تم تفعيل الغرف الصوتية" : "🔇 تم إيقاف الغرف الصوتية مؤقتاً");
            }}
          />
          <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
            <Text style={styles.toggleLabel}>تفعيل الغرف الصوتية 🎙️</Text>
            <Text style={styles.toggleSub}>تشغيل أو إيقاف القعدات الصوتية</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* AsyncStorage Live Key Inspector */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.cardTitle}>
            💾 متصفح التخزين المحلي ({storageRows.length} مفاتيح · {(totalBytes / 1024).toFixed(1)} KB)
          </Text>
          <TouchableOpacity onPress={scanStorage}>
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        {storageRows.length === 0 ? (
          <Text style={styles.empty}>التخزين المحلي فارغ.</Text>
        ) : (
          storageRows.map((row) => {
            const open = expandedKey === row.key;
            return (
              <View key={row.key} style={styles.storageBox}>
                <TouchableOpacity
                  style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                  onPress={() => setExpandedKey(open ? null : row.key)}
                >
                  <Text style={{ color: COLORS.muted, fontSize: 10.5 }}>{row.bytes} B</Text>
                  <Text style={{ color: COLORS.verified, fontSize: 12, fontWeight: "700" }}>{row.key}</Text>
                </TouchableOpacity>
                {open && (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <Text style={styles.codePreview} numberOfLines={8}>
                      {row.key.includes("token") || row.key.includes("pin")
                        ? "🔒 [قيمة محمية ومشفّرة]"
                        : row.value}
                    </Text>
                    <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                      <TouchableOpacity
                        style={styles.miniOutline}
                        onPress={() => Share.share({ message: `${row.key}:\n${row.value}` })}
                      >
                        <Text style={{ color: COLORS.text, fontSize: 11, fontWeight: "700" }}>📤 مشاركة</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.miniOutline, { borderColor: COLORS.danger }]}
                        onPress={() =>
                          Alert.alert("حذف مفتاح", `هل تريد حذف ${row.key} من التخزين المحلي؟`, [
                            { text: "إلغاء", style: "cancel" },
                            {
                              text: "حذف",
                              style: "destructive",
                              onPress: async () => {
                                await AsyncStorage.removeItem(row.key);
                                scanStorage();
                                onToast(`🗑️ تم حذف المفتاح ${row.key}`);
                              },
                            },
                          ])
                        }
                      >
                        <Text style={{ color: COLORS.danger, fontSize: 11, fontWeight: "700" }}>🗑️ حذف</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Device & Runtime Telemetry Specs */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 مواصفات الجهاز وبيئة التشغيل</Text>
        <View style={styles.specsGrid}>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{specs.os.toUpperCase()} {specs.osVersion}</Text>
            <Text style={styles.specLbl}>النظام</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{specs.screenSize}</Text>
            <Text style={styles.specLbl}>أبعاد الشاشة</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>@{specs.pixelRatio}x · x{specs.fontScale}</Text>
            <Text style={styles.specLbl}>الكثافة والخط</Text>
          </View>
          <View style={styles.specBox}>
            <Text style={styles.specVal}>{specs.sessionUptimeSec} ثانية</Text>
            <Text style={styles.specLbl}>مدة الجلسة</Text>
          </View>
        </View>
      </View>

      {/* Vault Security PIN */}
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
        <Text style={styles.sub}>
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
            onToast("🔐 تم تحديث رمز البوابة السري وحفظه بنجاح!");
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>تحديث رمز البوابة السري</Text>
        </TouchableOpacity>
      </View>

      {/* Factory Reset System Settings */}
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
                onToast("🔄 تمت إعادة ضبط جميع الإعدادات للوضع الافتراضي");
              },
            },
          ])
        }
      >
        <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 12.5 }}>
          🔄 إعادة ضبط إعدادات النظام للوضع الافتراضي
        </Text>
      </TouchableOpacity>
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
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
  sub: { color: COLORS.muted, fontSize: 11.5, textAlign: "right", lineHeight: 18 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5 },
  toggleLabel: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  toggleSub: { color: COLORS.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  storageBox: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  codePreview: {
    backgroundColor: "#060609",
    color: "#93c5fd",
    fontSize: 10.5,
    padding: 8,
    borderRadius: 8,
    fontFamily: "monospace",
  },
  miniOutline: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  specsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 6 },
  specBox: {
    width: "48.5%",
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  specVal: { color: COLORS.text, fontSize: 12.5, fontWeight: "800" },
  specLbl: { color: COLORS.muted, fontSize: 10.5, marginTop: 2 },
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
  primaryBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 11, alignItems: "center" },
  dangerBtn: {
    backgroundColor: "rgba(239,68,68,0.14)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.danger,
  },
  empty: { color: COLORS.muted, textAlign: "center", fontSize: 12.5 },
});
