import React, { useState } from "react";
import { Modal, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";

type AiTool = "ad" | "reels" | "hashtags" | "profit";

export default function ShahinazAiModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme } = useApp();
  const [tool, setTool] = useState<AiTool>("ad");
  const [topic, setTopic] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [deliveryCost, setDeliveryCost] = useState("600");
  const [output, setOutput] = useState("");

  function generateAi() {
    const clean = topic.trim() || "ساعة ذكية Ultra";
    if (tool === "ad") {
      setOutput(
        `🔥 عرض خاص وحصري في الجزائر 🇩🇿!\n✨ ${clean} — جودة ممتازة وسعر لا يُنافس!\n\n✅ التوصيل السريع متوفر لـ 58 ولاية 🚚\n💵 الدفع عند الاستلام بكل أمان وثقة\n⚡ الكمية محدودة — احجز طلبك الآن عبر زر الطلب أو في الرسائل الخاصة 👇\n\n#الجزائر #تسوق_أونلاين #توصيل_58_ولاية #SHAHINAZ`
      );
    } else if (tool === "reels") {
      setOutput(
        `🎬 3 أفكار ريلز ترند حول "${clean}":\n\n1️⃣ [أول 3 ثوانٍ خطّافة]: "أغلب الناس ما يعرفوش هذه الميزة في ${clean}!" ثم استعرض النتيجة بسرعة.\n2️⃣ [مقارنة سريعة]: قبل / بعد تجربة ${clean} مع موسيقى حماسية وسؤال للمتابعين في النهاية.\n3️⃣ [تحدي الولاية]: صوّر ${clean} في مكان مشهور بولايتك واطلب من الناس يكتبوا ولايتهم في التعليقات 👇`
      );
    } else if (tool === "hashtags") {
      const slug = clean.replace(/\s+/g, "_");
      setOutput(
        `🏷️ أفضل هاشتاقات لزيادة المشاهدات في الجزائر:\n\n#${slug} #SHAHINAZ #الجزائر #وهران #سطيف #قسنطينة #تجارة_الكترونية_في_الجزائر #توصيل_58_ولاية #ترند_الجزائر #تحدي_الأسبوع`
      );
    } else {
      const buy = Number(buyPrice) || 0;
      const sell = Number(sellPrice) || 0;
      const ship = Number(deliveryCost) || 0;
      const net = sell - buy - ship;
      const margin = sell > 0 ? Math.round((net / sell) * 100) : 0;
      setOutput(
        `💰 تحليل الربح لمنتج "${clean}":\n• سعر الشراء: ${buy.toLocaleString("fr-DZ")} دج\n• سعر البيع: ${sell.toLocaleString("fr-DZ")} دج\n• التوصيل/المصاريف: ${ship.toLocaleString("fr-DZ")} دج\n━━━━━━━━━━━━━━━\n${net >= 0 ? "✅" : "⚠️"} الربح الصافي للقطعة: ${net.toLocaleString("fr-DZ")} دج (${margin}%)\n📈 ربح 30 طلب شهرياً: ${(net * 30).toLocaleString("fr-DZ")} دج`
      );
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <LinearGradient colors={theme.btnGrad} style={styles.aiIcon}>
                <Ionicons name="sparkles" size={16} color={theme.btnText} />
              </LinearGradient>
              <Text style={[styles.title, { color: theme.text }]}>استوديو SHAHINAZ AI الذكي</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            <View style={styles.toolsGrid}>
              {[
                { key: "ad", label: "✍️ كاتب إعلانات" },
                { key: "reels", label: "🎬 أفكار ريلز" },
                { key: "hashtags", label: "🏷️ هاشتاقات" },
                { key: "profit", label: "💰 حاسبة ربح دج" },
              ].map((t) => {
                const active = tool === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[
                      styles.toolChip,
                      {
                        backgroundColor: active ? theme.primarySoft : theme.surface,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    onPress={() => {
                      setTool(t.key as AiTool);
                      setOutput("");
                    }}
                  >
                    <Text style={{ color: active ? theme.primary : theme.muted, fontSize: 12.5, fontWeight: "800" }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
              placeholder={tool === "profit" ? "اسم المنتج (مثال: ساعة ذكية)" : "اكتب اسم المنتج أو الفكرة هنا..."}
              placeholderTextColor={theme.muted}
              value={topic}
              onChangeText={setTopic}
            />

            {tool === "profit" && (
              <View style={{ gap: 8 }}>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="سعر الشراء بالجملة (دج)"
                  placeholderTextColor={theme.muted}
                  keyboardType="number-pad"
                  value={buyPrice}
                  onChangeText={setBuyPrice}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="سعر البيع للزبون (دج)"
                  placeholderTextColor={theme.muted}
                  keyboardType="number-pad"
                  value={sellPrice}
                  onChangeText={setSellPrice}
                />
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                  placeholder="تكلفة التوصيل / الإعلان للطلب (دج)"
                  placeholderTextColor={theme.muted}
                  keyboardType="number-pad"
                  value={deliveryCost}
                  onChangeText={setDeliveryCost}
                />
              </View>
            )}

            <TouchableOpacity onPress={generateAi} activeOpacity={0.88}>
              <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.genBtn}>
                <Ionicons name="sparkles" size={17} color={theme.btnText} />
                <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13.5 }}>توليد النتيجة فوراً ⚡</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!!output && (
              <View style={[styles.outCard, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
                <Text style={[styles.outText, { color: theme.text }]}>{output}</Text>
                <TouchableOpacity
                  style={[styles.shareBtn, { backgroundColor: theme.primarySoft, borderColor: theme.borderGlow }]}
                  onPress={() => Share.share({ message: output })}
                >
                  <Ionicons name="share-social-outline" size={16} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 12.5 }}>نسخ / مشاركة النتيجة</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "86%",
    borderTopWidth: 1.2,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  aiIcon: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "900" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  toolsGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  toolChip: {
    width: "48.5%",
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlign: "right",
    borderWidth: 1,
  },
  genBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 15,
    padding: 14,
  },
  outCard: {
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    gap: 12,
  },
  outText: { fontSize: 13.5, lineHeight: 22, textAlign: "right" },
  shareBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
  },
});
