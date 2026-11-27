import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME_LIST } from "../theme";
import { useApp } from "../store/AppContext";
import AuroraBackground from "../components/AuroraBackground";

export default function AuthScreen() {
  const { loginWithApi, registerWithApi, allowRegistration, theme, themeId, setThemeId } = useApp();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (mode === "register" && !allowRegistration) {
      Alert.alert("التسجيل مغلق مؤقتاً", "تم إيقاف إنشاء الحسابات الجديدة مؤقتاً من طرف الإدارة.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("تنبيه", "يرجى إدخال بريد Gmail صحيح (مثال: name@gmail.com)");
      return;
    }
    if (password.length < 6) {
      Alert.alert("تنبيه", "يجب أن تكون كلمة السر 6 أحرف على الأقل");
      return;
    }
    if (mode === "register") {
      if (!name.trim()) {
        Alert.alert("تنبيه", "يرجى إدخال اسمك الكامل");
        return;
      }
      if (!acceptedTerms) {
        Alert.alert("شروط الاستخدام", "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "register") {
        const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_") + "_" + Math.floor(Math.random() * 99);
        await registerWithApi(name.trim(), username, email.trim(), password);
      } else {
        await loginWithApi(email.trim(), password);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "تعذر الاتصال بالسيرفر، حاول مجدداً";
      Alert.alert("خطأ في الدخول", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AuroraBackground theme={theme} height={400} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Royal SHAHINAZ Emblem Hero */}
        <View style={styles.hero}>
          <View style={[styles.emblemOuter, { borderColor: theme.borderGlow, shadowColor: theme.primary }]}>
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.emblemCore}>
              <Ionicons name="diamond" size={34} color={theme.btnText} />
            </LinearGradient>
          </View>
          <Text style={[styles.logo, { color: theme.text }]}>SHAHINAZ</Text>
          <View style={[styles.editionBadge, { backgroundColor: theme.primarySoft, borderColor: theme.borderGlow }]}>
            <Text style={{ color: theme.primary, fontSize: 10.5, fontWeight: "900", letterSpacing: 1.4 }}>
              ✦ OBSIDIAN COUTURE · ULTRA 4.0 ✦
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            عالمك الاجتماعي الفاخر للتواصل، الإبداع، وتجارة 58 ولاية
          </Text>
        </View>

        {/* Frosted Luxury Glass Auth Card */}
        <View style={[styles.card, { backgroundColor: theme.glass, borderColor: theme.borderGlow }]}>
          <View style={[styles.switchRow, { backgroundColor: theme.surface2 }]}>
            <TouchableOpacity style={styles.switchBtn} onPress={() => setMode("register")} activeOpacity={0.85}>
              {mode === "register" ? (
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.switchGrad}>
                  <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>حساب جديد</Text>
                </LinearGradient>
              ) : (
                <Text style={{ color: theme.muted, fontWeight: "700", fontSize: 13 }}>حساب جديد</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.switchBtn} onPress={() => setMode("login")} activeOpacity={0.85}>
              {mode === "login" ? (
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.switchGrad}>
                  <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>تسجيل الدخول</Text>
                </LinearGradient>
              ) : (
                <Text style={{ color: theme.muted, fontWeight: "700", fontSize: 13 }}>تسجيل الدخول</Text>
              )}
            </TouchableOpacity>
          </View>

          {mode === "register" && (
            <>
              <Text style={[styles.label, { color: theme.text }]}>الاسم الكامل</Text>
              <View style={[styles.inputBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                <Ionicons name="person-outline" size={18} color={theme.primary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="مثال: يوسف قرين"
                  placeholderTextColor={theme.muted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </>
          )}

          <Text style={[styles.label, { color: theme.text }]}>البريد الإلكتروني (Gmail)</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
            <Ionicons name="mail-outline" size={18} color={theme.primary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="example@gmail.com"
              placeholderTextColor={theme.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={[styles.label, { color: theme.text }]}>كلمة السر</Text>
          <View style={[styles.inputBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="••••••••"
              placeholderTextColor={theme.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {mode === "register" && (
            <TouchableOpacity
              style={styles.termsRow}
              activeOpacity={0.75}
              onPress={() => setAcceptedTerms((v) => !v)}
            >
              <View
                style={[
                  styles.checkbox,
                  { borderColor: theme.primary },
                  acceptedTerms && { backgroundColor: theme.primary },
                ]}
              >
                {acceptedTerms && <Ionicons name="checkmark" size={14} color={theme.btnText} />}
              </View>
              <Text style={[styles.termsText, { color: theme.muted }]}>
                أوافق على شروط الاستخدام وسياسة الخصوصية ومعايير سلامة المجتمع.
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.9} onPress={handleSubmit} disabled={busy} style={{ marginTop: 12 }}>
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              {busy ? (
                <ActivityIndicator color={theme.btnText} />
              ) : (
                <>
                  <Ionicons name={mode === "register" ? "sparkles" : "log-in-outline"} size={18} color={theme.btnText} />
                  <Text style={[styles.btnText, { color: theme.btnText }]}>
                    {mode === "register" ? "انضم إلى عالم SHAHINAZ" : "دخول إلى حسابك"}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Live Skin Selector on Welcome Screen */}
        <View style={styles.skinPickerRow}>
          {THEME_LIST.map((t) => {
            const active = themeId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => setThemeId(t.id)}
                style={[
                  styles.skinDotBtn,
                  {
                    backgroundColor: t.surface,
                    borderColor: active ? t.primary : t.border,
                    borderWidth: active ? 1.6 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 15 }}>{t.emoji}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: 20, paddingVertical: 30 },
  hero: { alignItems: "center", marginBottom: 24 },
  emblemOuter: {
    width: 82,
    height: 82,
    borderRadius: 28,
    padding: 5,
    borderWidth: 1.5,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 14,
  },
  emblemCore: {
    flex: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { fontSize: 32, fontWeight: "900", letterSpacing: 6 },
  editionBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.8,
  },
  subtitle: { fontSize: 12.5, marginTop: 10, textAlign: "center", lineHeight: 19 },
  card: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: "row-reverse",
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  switchBtn: { flex: 1, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  switchGrad: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 12 },
  label: { fontSize: 12.5, fontWeight: "700", marginBottom: 6, textAlign: "right" },
  inputBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderRadius: 15,
    paddingHorizontal: 13,
    marginBottom: 14,
    borderWidth: 1,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14, textAlign: "right" },
  termsRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, marginVertical: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  termsText: { flex: 1, fontSize: 12, lineHeight: 18, textAlign: "right" },
  btn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
  },
  btnText: { fontSize: 15, fontWeight: "900" },
  skinPickerRow: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    gap: 12,
    marginTop: 22,
  },
  skinDotBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
