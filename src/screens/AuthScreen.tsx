import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function AuthScreen() {
  const { login } = useApp();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleSubmit() {
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
    const displayName = name.trim() || email.split("@")[0];
    const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
    login(displayName, username);
  }

  function handleGoogleQuickSignIn() {
    if (!acceptedTerms && mode === "register") {
      Alert.alert("شروط الاستخدام", "يرجى تفعيل الموافقة على شروط الاستخدام وسياسة الخصوصية أولاً.");
      return;
    }
    const cleanEmail = email.trim().includes("@") ? email.trim() : "user@gmail.com";
    const displayName = name.trim() || cleanEmail.split("@")[0];
    login(displayName, cleanEmail.split("@")[0]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.logo}>SHAHINAZ</Text>
        <Text style={styles.subtitle}>منصة اجتماعية عصرية تجمع بين الصور والتواصل السريع</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <TouchableOpacity
            style={[styles.switchBtn, mode === "register" && styles.switchActive]}
            onPress={() => setMode("register")}
          >
            <Text style={[styles.switchText, mode === "register" && styles.switchTextActive]}>حساب جديد</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.switchBtn, mode === "login" && styles.switchActive]}
            onPress={() => setMode("login")}
          >
            <Text style={[styles.switchText, mode === "login" && styles.switchTextActive]}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>

        {mode === "register" && (
          <>
            <Text style={styles.label}>الاسم الكامل</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: يوسف قرين"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
            />
          </>
        )}

        <Text style={styles.label}>البريد الإلكتروني (Gmail)</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          placeholderTextColor={COLORS.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>كلمة السر</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {mode === "register" && (
          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.7}
            onPress={() => setAcceptedTerms((v) => !v)}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              أوافق على شروط الاستخدام وسياسة الخصوصية ومعايير سلامة المجتمع.
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleSubmit}>
          <Text style={styles.btnText}>
            {mode === "register" ? "إنشاء حساب بـ Gmail" : "دخول إلى SHAHINAZ"}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleQuickSignIn}>
          <Text style={styles.googleBtnText}>G  المتابعة السريعة بحساب Google (Gmail)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 20 },
  hero: { alignItems: "center", marginBottom: 24 },
  logo: { fontSize: 34, fontWeight: "800", color: COLORS.primary, letterSpacing: 2 },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 8, textAlign: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  switchRow: {
    flexDirection: "row-reverse",
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  switchBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  switchActive: { backgroundColor: COLORS.primary },
  switchText: { color: COLORS.muted, fontWeight: "700", fontSize: 13 },
  switchTextActive: { color: "#fff" },
  label: { color: COLORS.text, fontSize: 13, fontWeight: "600", marginBottom: 6, textAlign: "right" },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    marginBottom: 14,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  termsRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, marginVertical: 8 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: COLORS.primary },
  checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },
  termsText: { flex: 1, color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: "right" },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 10 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 12 },
  googleBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
  },
  googleBtnText: { color: "#0f172a", fontSize: 14, fontWeight: "700" },
});
