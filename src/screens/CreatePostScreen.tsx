import React, { useState } from "react";
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function CreatePostScreen({ onDone }: { onDone: () => void }) {
  const { createPost } = useApp();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);

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
    }
  }

  function handlePublish() {
    if (!content.trim() && !imageUri) {
      Alert.alert("تنبيه", "اكتب شيئاً أو اختر صورة للنشر.");
      return;
    }
    createPost(content, imageUri, location);
    setContent("");
    setLocation("");
    setImageUri(undefined);
    onDone();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ منشور جديد</Text>
      <TextInput
        style={styles.textarea}
        multiline
        placeholder="بماذا تفكر اليوم؟ شارك صورتك أو فكرتك مع مجتمع SHAHINAZ..."
        placeholderTextColor={COLORS.muted}
        value={content}
        onChangeText={setContent}
      />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text, textAlign: "right", marginBottom: 14 },
  textarea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    minHeight: 130,
    color: COLORS.text,
    textAlign: "right",
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  preview: { width: "100%", height: 200, borderRadius: 14, marginBottom: 12 },
  row: { flexDirection: "row-reverse", gap: 10 },
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
