import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

const BG_SWATCHES = ["", "#6d28d9", "#be123c", "#0f766e", "#d97706", "#1d4ed8"];

const AI_TEMPLATES = {
  product: (seed: string) =>
    `🔥 عرض حصري متوفر الآن! ${seed || "منتج أصلي بجودة عالية وسعر منافس"}\n🚚 التوصيل السريع متوفر لـ 58 ولاية 🇩🇿\n💵 الدفع عند الاستلام بكل أمان\n👇 اطلب الآن أو تواصل معنا في الرسائل!\n#الجزائر #تجارة #SHAHINAZ`,
  daily: (seed: string) =>
    `✨ ${seed || "لحظات جميلة تستحق المشاركة معكم اليوم"} 🤍\nما رأيكم أنتم؟ شاركوني في التعليقات 👇\n#SHAHINAZ #الجزائر #يوميات`,
  challenge: (seed: string) =>
    `🏆 مشاركتي في تحدي الأسبوع على SHAHINAZ! ${seed || "أجمل لقطة من ولايتي 🇩🇿📸"}\nادعموني بـ ❤️ ورأيكم في التعليقات!\n#تحدي_الأسبوع #الجزائر #SHAHINAZ`,
};

export default function CreatePostScreen({ onDone }: { onDone: () => void }) {
  const { currentUser, createPost, maintenanceMode, bannedWords, rolePermissions } = useApp();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [bgColor, setBgColor] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [showAI, setShowAI] = useState(false);
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
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
      setBgColor("");
    }
  }

  function applyAi(kind: "product" | "daily" | "challenge") {
    setContent(AI_TEMPLATES[kind](content.trim()));
    setShowAI(false);
  }

  function handlePublish() {
    if (maintenanceMode) {
      Alert.alert("وضع الصيانة نشط ⚡", "النشر متوقف مؤقتاً من طرف الإدارة لإجراء تحديثات.");
      return;
    }
    const role = currentUser?.role || "USER";
    if (!rolePermissions[role]?.canPost) {
      Alert.alert("الصلاحيات", "صلاحية النشر غير مفعّلة لرتبتك الحالية من طرف الإدارة.");
      return;
    }
    if (!content.trim() && !imageUri) {
      Alert.alert("تنبيه", "اكتب شيئاً أو اختر صورة للنشر.");
      return;
    }
    const foundBanned = bannedWords.find((w) => content.toLowerCase().includes(w.toLowerCase()));
    if (foundBanned) {
      Alert.alert("فلتر الأمان التلقائي 🛡️", "يحتوي منشورك على كلمة محظورة من إدارة التطبيق. يرجى تعديل النص.");
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
      <View style={styles.headRow}>
        <Text style={styles.title}>منشور جديد</Text>
        <TouchableOpacity onPress={() => setShowAI((v) => !v)}>
          <LinearGradient colors={["#8b5cf6", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.aiPill}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>SHAHINAZ AI</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {maintenanceMode && (
        <View style={{ backgroundColor: "rgba(245,158,11,0.15)", borderColor: COLORS.warn, borderWidth: 0.5, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <Text style={{ color: COLORS.warn, fontSize: 12.5, fontWeight: "700", textAlign: "right" }}>
            ⚡ وضع الصيانة مُفعّل حالياً من طرف المطور — النشر متوقف مؤقتاً.
          </Text>
        </View>
      )}

      {/* SHAHINAZ AI Smart Caption Assistant */}
      {showAI && (
        <View style={styles.aiBox}>
          <Text style={styles.aiTitle}>🤖 اختر نوع الوصف ليجهّزه لك الذكاء الاصطناعي فوراً:</Text>
          <View style={styles.aiChips}>
            <TouchableOpacity style={styles.aiChip} onPress={() => applyAi("product")}>
              <Text style={styles.aiChipText}>🛍️ إعلان منتج (58 ولاية)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiChip} onPress={() => applyAi("daily")}>
              <Text style={styles.aiChipText}>✨ منشور يومي جذاب</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.aiChip} onPress={() => applyAi("challenge")}>
              <Text style={styles.aiChipText}>🏆 مشاركة تحدي الأسبوع</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TextInput
        style={[
          styles.textarea,
          bgColor ? { backgroundColor: bgColor, textAlign: "center", fontSize: 19, fontWeight: "800" } : null,
        ]}
        multiline
        placeholder="اكتب فكرتك هنا أو اضغط SHAHINAZ AI لكتابة وصف احترافي..."
        placeholderTextColor={bgColor ? "rgba(255,255,255,0.75)" : COLORS.muted}
        value={content}
        onChangeText={setContent}
      />

      {!imageUri && (
        <View style={styles.swatchesRow}>
          <Text style={{ color: COLORS.muted, fontSize: 12 }}>خلفية:</Text>
          {BG_SWATCHES.map((c) => (
            <TouchableOpacity
              key={c || "none"}
              style={[styles.swatch, { backgroundColor: c || COLORS.surface2 }, bgColor === c && styles.swatchActive]}
              onPress={() => setBgColor(c)}
            >
              {!c && <Text style={{ color: COLORS.muted, fontSize: 10 }}>عادي</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.pollToggle} onPress={() => setShowPoll((v) => !v)}>
        <Text style={{ color: COLORS.verified, fontWeight: "700", fontSize: 13 }}>
          {showPoll ? "✕ إلغاء الاستطلاع" : "🗳️ إضافة استطلاع رأي (Poll)"}
        </Text>
      </TouchableOpacity>

      {showPoll && (
        <View style={{ marginBottom: 8 }}>
          <TextInput style={styles.input} placeholder="الخيار 1" placeholderTextColor={COLORS.muted} value={opt1} onChangeText={setOpt1} />
          <TextInput style={styles.input} placeholder="الخيار 2" placeholderTextColor={COLORS.muted} value={opt2} onChangeText={setOpt2} />
          <TextInput style={styles.input} placeholder="الخيار 3 (اختياري)" placeholderTextColor={COLORS.muted} value={opt3} onChangeText={setOpt3} />
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder="📍 الولاية أو الموقع (مثال: الجزائر العاصمة)"
        placeholderTextColor={COLORS.muted}
        value={location}
        onChangeText={setLocation}
      />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.preview} />}

      <View style={styles.row}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
          <Ionicons name="images-outline" size={18} color={COLORS.text} />
          <Text style={styles.secondaryText}>اختيار صورة</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handlePublish}>
          <Text style={styles.primaryText}>نشر الآن</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  headRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  aiPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  aiBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  aiTitle: { color: COLORS.text, fontSize: 12, fontWeight: "600", textAlign: "right" },
  aiChips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  aiChip: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  aiChipText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  textarea: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    color: COLORS.text,
    textAlign: "right",
    textAlignVertical: "top",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  swatchesRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" },
  swatch: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
  swatchActive: { borderColor: "#ffffff" },
  pollToggle: { alignItems: "flex-end", marginBottom: 10 },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  preview: { width: "100%", height: 220, borderRadius: 14, marginBottom: 12 },
  row: { flexDirection: "row-reverse", gap: 10, marginBottom: 30 },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    padding: 14,
  },
  secondaryText: { color: COLORS.text, fontWeight: "700" },
  primaryBtn: { flex: 1, backgroundColor: COLORS.verified, borderRadius: 14, padding: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
});
