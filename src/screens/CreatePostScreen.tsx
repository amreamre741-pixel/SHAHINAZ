import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

const BG_SWATCHES = ["", "#6d28d9", "#be123c", "#0f766e", "#d97706", "#1d4ed8"];

export default function CreatePostScreen({ onDone }: { onDone: () => void }) {
  const { createPost } = useApp();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [bgColor, setBgColor] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");

  async function pickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الصلاحية مطلوبة", "يرجى السماح بالوصول إلى الصور لاختيار صورة.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setBgColor("");
    }
  }

  function handlePublish() {
    if (!content.trim() && !imageUri) {
      Alert.alert("تنبيه", "اكتب شيئاً أو اختر صورة للنشر.");
      return;
    }
    createPost(content, imageUri, location, bgColor || undefined, showPoll ? [opt1, opt2, opt3] : undefined);
    setContent("");
    setLocation("");
    setImageUri(undefined);
    setBgColor("");
    setShowPoll(false);
    setOpt1("");
    setOpt2("");
    setOpt3("");
    onDone();
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>✨ منشور جديد</Text>

      <TextInput
        style={[
          styles.textarea,
          bgColor ? { backgroundColor: bgColor, textAlign: "center", fontSize: 18, fontWeight: "700" } : null,
        ]}
        multiline
        placeholder="بماذا تفكر اليوم؟ شارك صورتك أو استطلاع رأي مع مجتمع SHAHINAZ..."
        placeholderTextColor={bgColor ? "rgba(255,255,255,0.75)" : COLORS.muted}
        value={content}
        onChangeText={setContent}
      />

      {/* Colored background swatches */}
      {!imageUri && (
        <View style={styles.swatchesRow}>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>🎨 خلفية:</Text>
          {BG_SWATCHES.map((c) => (
            <TouchableOpacity
              key={c || "none"}
              style={[
                styles.swatch,
                { backgroundColor: c || COLORS.surface2 },
                bgColor === c && styles.swatchActive,
              ]}
              onPress={() => setBgColor(c)}
            >
              {!c && <Text style={{ color: COLORS.muted, fontSize: 10 }}>عادي</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Optional Poll Builder */}
      <TouchableOpacity style={styles.pollToggle} onPress={() => setShowPoll((v) => !v)}>
        <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 13 }}>
          {showPoll ? "✕ إلغاء استطلاع الرأي" : "🗳️ إضافة استطلاع رأي (Poll)"}
        </Text>
      </TouchableOpacity>

      {showPoll && (
        <View style={styles.pollBox}>
          <TextInput style={styles.input} placeholder="الخيار 1" placeholderTextColor={COLORS.muted} value={opt1} onChangeText={setOpt1} />
          <TextInput style={styles.input} placeholder="الخيار 2" placeholderTextColor={COLORS.muted} value={opt2} onChangeText={setOpt2} />
          <TextInput style={styles.input} placeholder="الخيار 3 (اختياري)" placeholderTextColor={COLORS.muted} value={opt3} onChangeText={setOpt3} />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="📍 الموقع (اختياري — مثال: الجزائر العاصمة)"
        placeholderTextColor={COLORS.muted}
        value={location}
        onChangeText={setLocation}
      />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
          <Text style={styles.secondaryText}>🖼️ اختيار صورة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePublish}>
          <Text style={styles.primaryText}>نشر الآن 🚀</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text, textAlign: "right", marginBottom: 14 },
  textarea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 130,
    color: COLORS.text,
    textAlign: "right",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  swatchesRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchActive: { borderColor: "#ffffff" },
  pollToggle: { alignItems: "flex-end", marginBottom: 10 },
  pollBox: { marginBottom: 8 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  preview: { width: "100%", height: 200, borderRadius: 14, marginBottom: 12 },
  row: { flexDirection: "row-reverse", gap: 10, marginBottom: 30 },
  secondaryBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryText: { color: COLORS.text, fontWeight: "700" },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, padding: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
});
