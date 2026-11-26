import React, { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function AuthScreen() {
  const { login } = useApp();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  function handleContinue() {
    if (!name.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال اسمك أولاً");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("شروط الاستخدام", "يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة.");
      return;
    }
    login(name, username || name.toLowerCase().replace(/\s+/g, "_"));
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>SHAHINAZ</Text>
        <Text style={styles.subtitle}>منصة اجتماعية عصرية تجمع بين الصور والتواصل السريع</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>الاسم الكامل</Text>
        <TextInput
          style={styles.input}
          placeholder="مثال: أمين بن عمر"
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>اسم المستخدم (اختياري)</Text>
        <TextInput
          style={styles.input}
          placeholder="@amine_dz"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />

        <TouchableOpacity
          style={styles.termsRow}
          activeOpacity={0.7}
          onPress={() => setAcceptedTerms((v) => !v)}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
            {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            أوافق على شروط الاستخدام وسياسة الخصوصية ومعايير سلامة المجتمع (يُمنع نشر أي محتوى مسيء).
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleContinue}>
          <Text style={styles.btnText}>دخول إلى SHAHINAZ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", padding: 20 },
  hero: { alignItems: "center", marginBottom: 28 },
  logo: { fontSize: 34, fontWeight: "800", color: COLORS.primary, letterSpacing: 2 },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 8, textAlign: "center" },
  card: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
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
  termsRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, marginVertical: 10 },
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
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 12 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
