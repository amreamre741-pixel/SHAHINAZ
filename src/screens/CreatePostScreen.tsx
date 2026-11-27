import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import AuroraBackground from "../components/AuroraBackground";

const BG_SWATCHES: { id: string; colors: [string, string]; label?: string }[] = [
  { id: "", colors: ["#161B2B", "#0E111C"], label: "عادي" },
  { id: "#D97706", colors: ["#F59E0B", "#78350F"] },
  { id: "#7C3AED", colors: ["#8B5CF6", "#312E81"] },
  { id: "#E11D48", colors: ["#FB7185", "#881337"] },
  { id: "#059669", colors: ["#10B981", "#064E3B"] },
  { id: "#0284C7", colors: ["#38BDF8", "#1E3A8A"] },
];

const AI_TEMPLATES = {
  product: (seed: string) =>
    `🔥 عرض حصري متوفر الآن! ${seed || "منتج أصلي بجودة عالية وسعر منافس"}\n🚚 التوصيل السريع متوفر لـ 58 ولاية 🇩🇿\n💵 الدفع عند الاستلام بكل أمان\n👇 اطلب الآن أو تواصل معنا في الرسائل!\n#الجزائر #تجارة #SHAHINAZ`,
  daily: (seed: string) =>
    `✨ ${seed || "لحظات جميلة تستحق المشاركة معكم اليوم"} 🤍\nما رأيكم أنتم؟ شاركوني في التعليقات 👇\n#SHAHINAZ #الجزائر #يوميات`,
  challenge: (seed: string) =>
    `🏆 مشاركتي في تحدي الأسبوع على SHAHINAZ! ${seed || "أجمل لقطة من ولايتي 🇩🇿📸"}\nادعموني بـ ❤️ ورأيكم في التعليقات!\n#تحدي_الأسبوع #الجزائر #SHAHINAZ`,
};

export default function CreatePostScreen({ onDone }: { onDone: () => void }) {
  const { currentUser, theme, createPost, maintenanceMode, bannedWords, rolePermissions } = useApp();
  const [content, setContent] = useState("");
  const [location, setLocation] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [bgColor, setBgColor] = useState("");
  const [showPoll, setShowPoll] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [opt1, setOpt1] = useState("");
  const [opt2, setOpt2] = useState("");
  const [opt3, setOpt3] = useState("");

  const activeSwatch = BG_SWATCHES.find((s) => s.id === bgColor) || BG_SWATCHES[0];

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
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AuroraBackground theme={theme} height={240} />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Studio Header */}
        <View style={styles.headRow}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.title, { color: theme.text }]}>استوديو الإبداع</Text>
            <Text style={{ color: theme.muted, fontSize: 11.5 }}>اصنع منشوراً فاخراً يليق بجمهورك</Text>
          </View>
          <TouchableOpacity onPress={() => setShowAI((v) => !v)} activeOpacity={0.85}>
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.aiPill}>
              <Ionicons name="sparkles" size={14} color={theme.btnText} />
              <Text style={{ color: theme.btnText, fontSize: 12, fontWeight: "900" }}>مساعد AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {maintenanceMode && (
          <View style={[styles.warnBox, { backgroundColor: "rgba(245,158,11,0.14)", borderColor: theme.warn }]}>
            <Text style={{ color: theme.warn, fontSize: 12.5, fontWeight: "700", textAlign: "right" }}>
              ⚡ وضع الصيانة مُفعّل حالياً من طرف المطور — النشر متوقف مؤقتاً.
            </Text>
          </View>
        )}

        {/* SHAHINAZ AI Smart Caption Assistant */}
        {showAI && (
          <View style={[styles.aiBox, { backgroundColor: theme.glass, borderColor: theme.borderGlow }]}>
            <Text style={[styles.aiTitle, { color: theme.primary }]}>✦ اختر قالباً ليجهّزه الذكاء الاصطناعي فوراً:</Text>
            <View style={styles.aiChips}>
              <TouchableOpacity style={[styles.aiChip, { backgroundColor: theme.surface2, borderColor: theme.border }]} onPress={() => applyAi("product")}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700" }}>🛍️ إعلان 58 ولاية</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.aiChip, { backgroundColor: theme.surface2, borderColor: theme.border }]} onPress={() => applyAi("daily")}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700" }}>✨ منشور يومي راقٍ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.aiChip, { backgroundColor: theme.surface2, borderColor: theme.border }]} onPress={() => applyAi("challenge")}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700" }}>🏆 تحدي الأسبوع</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Composer Canvas Card */}
        <LinearGradient
          colors={bgColor ? activeSwatch.colors : [theme.surface, theme.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.canvasCard,
            { borderColor: bgColor ? "rgba(255,255,255,0.22)" : theme.borderGlow },
          ]}
        >
          <TextInput
            style={[
              styles.textarea,
              { color: bgColor ? "#ffffff" : theme.text },
              bgColor ? { textAlign: "center", fontSize: 20, fontWeight: "900", minHeight: 190 } : null,
            ]}
            multiline
            placeholder="شارك فكرتك، منتجك، أو لحظتك المميزة..."
            placeholderTextColor={bgColor ? "rgba(255,255,255,0.72)" : theme.muted}
            value={content}
            onChangeText={setContent}
          />
        </LinearGradient>

        {/* Gradient Background Swatches */}
        {!imageUri && (
          <View style={[styles.swatchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ color: theme.muted, fontSize: 12, fontWeight: "700" }}>خلفية فاخرة:</Text>
            <View style={{ flexDirection: "row-reverse", gap: 9, flexWrap: "wrap" }}>
              {BG_SWATCHES.map((s) => {
                const active = bgColor === s.id;
                return (
                  <TouchableOpacity
                    key={s.id || "none"}
                    onPress={() => setBgColor(s.id)}
                    style={[
                      styles.swatchRing,
                      { borderColor: active ? theme.primary : "transparent" },
                    ]}
                  >
                    <LinearGradient colors={s.colors} style={styles.swatchInner}>
                      {s.label && <Text style={{ color: theme.muted, fontSize: 9.5, fontWeight: "800" }}>{s.label}</Text>}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Quick Tools Row */}
        <View style={{ flexDirection: "row-reverse", gap: 10, marginBottom: 12 }}>
          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: showPoll ? theme.primary : theme.border }]}
            onPress={() => setShowPoll((v) => !v)}
          >
            <Ionicons name="bar-chart-outline" size={17} color={showPoll ? theme.primary : theme.text} />
            <Text style={{ color: showPoll ? theme.primary : theme.text, fontWeight: "700", fontSize: 12.5 }}>
              {showPoll ? "إلغاء الاستطلاع" : "إضافة استطلاع"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: theme.surface, borderColor: imageUri ? theme.primary : theme.border }]}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={17} color={imageUri ? theme.primary : theme.text} />
            <Text style={{ color: imageUri ? theme.primary : theme.text, fontWeight: "700", fontSize: 12.5 }}>
              {imageUri ? "تغيير الصورة" : "إرفاق صورة"}
            </Text>
          </TouchableOpacity>
        </View>

        {showPoll && (
          <View style={[styles.pollCard, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "800", textAlign: "right", marginBottom: 4 }}>
              🗳️ خيارات الاستطلاع التفاعلي
            </Text>
            <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]} placeholder="الخيار الأول" placeholderTextColor={theme.muted} value={opt1} onChangeText={setOpt1} />
            <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]} placeholder="الخيار الثاني" placeholderTextColor={theme.muted} value={opt2} onChangeText={setOpt2} />
            <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border, marginBottom: 0 }]} placeholder="الخيار الثالث (اختياري)" placeholderTextColor={theme.muted} value={opt3} onChangeText={setOpt3} />
          </View>
        )}

        <View style={[styles.locInputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="location-outline" size={18} color={theme.primary} />
          <TextInput
            style={{ flex: 1, color: theme.text, textAlign: "right", paddingVertical: 12, fontSize: 13.5 }}
            placeholder="الولاية أو الموقع (مثال: وهران الباهية)"
            placeholderTextColor={theme.muted}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {imageUri && (
          <View style={styles.previewWrap}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImgBtn} onPress={() => setImageUri(undefined)}>
              <Ionicons name="close" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity activeOpacity={0.9} onPress={handlePublish} style={{ marginTop: 6 }}>
          <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.publishBtn}>
            <Ionicons name="paper-plane" size={18} color={theme.btnText} />
            <Text style={{ color: theme.btnText, fontSize: 15, fontWeight: "900" }}>نشر الآن على SHAHINAZ</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  headRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "900" },
  aiPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  warnBox: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 12 },
  aiBox: { borderWidth: 1, borderRadius: 20, padding: 14, marginBottom: 14, gap: 10 },
  aiTitle: { fontSize: 12.5, fontWeight: "800", textAlign: "right" },
  aiChips: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  aiChip: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  canvasCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    minHeight: 160,
    justifyContent: "center",
  },
  textarea: {
    minHeight: 130,
    fontSize: 15,
    lineHeight: 24,
    textAlign: "right",
    textAlignVertical: "top",
  },
  swatchCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  swatchRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    padding: 2.5,
    borderWidth: 2,
  },
  swatchInner: {
    flex: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  pollCard: { borderRadius: 20, padding: 14, borderWidth: 1, marginBottom: 12, gap: 8 },
  input: {
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 10,
    textAlign: "right",
    borderWidth: 1,
    marginBottom: 4,
  },
  locInputWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  previewWrap: { position: "relative", marginBottom: 14, borderRadius: 22, overflow: "hidden" },
  preview: { width: "100%", height: 240, borderRadius: 22 },
  removeImgBtn: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.68)",
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    paddingVertical: 15,
  },
});
