import React from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

const STREAK_REWARDS = [50, 75, 100, 150, 200, 300, 500];

const ACCENT_THEMES = [
  { name: "بنفسجي نيوون", color: "#a855f7" },
  { name: "أزرق سماوي", color: "#3897f0" },
  { name: "أخضر زمردي", color: "#22c55e" },
  { name: "ذهبي ملكي", color: "#f59e0b" },
  { name: "وردي فائق", color: "#ec4899" },
];

export default function DailyStreakModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const {
    currentUser,
    streakDays,
    claimedStreakToday,
    accentColor,
    claimDailyStreak,
    redeemReward,
    setAccentColor,
  } = useApp();

  const points = currentUser?.points ?? 150;
  const activeDayIdx = streakDays >= 7 ? 0 : Math.max(0, streakDays);

  function handleClaim() {
    const res = claimDailyStreak();
    Alert.alert(res.ok ? "🎉 مبروك!" : "تنبيه", res.message);
  }

  function handleRedeem(kind: "verify" | "vip" | "boost", cost: number) {
    const res = redeemReward(kind, cost);
    Alert.alert(res.ok ? "✨ تم التفعيل بنجاح!" : "رصيد غير كافٍ", res.message);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <Ionicons name="flame" size={22} color={COLORS.warn} />
              <Text style={styles.title}>المكافآت اليومية ومتجر النقاط</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
            {/* Balance Hero */}
            <LinearGradient colors={["#581c87", "#9d174d"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: "#fde68a", fontSize: 12, fontWeight: "700" }}>رصيدك الحالي في SHAHINAZ</Text>
                <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 2 }}>
                  🪙 {points.toLocaleString("fr-DZ")} نقطة
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, marginTop: 4 }}>
                  🔥 سلسلة الدخول المتتالية: {streakDays} يوم
                </Text>
              </View>
              <Ionicons name="trophy" size={44} color="#fde68a" />
            </LinearGradient>

            {/* 7-Day Daily Streak Calendar */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🔥 مكافأة الدخول اليومي (7 أيام)</Text>
              <View style={styles.daysRow}>
                {STREAK_REWARDS.map((rew, idx) => {
                  const done = idx < streakDays;
                  const isToday = idx === activeDayIdx && !claimedStreakToday;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.dayBox,
                        done && { borderColor: COLORS.success, backgroundColor: "rgba(34,197,94,0.14)" },
                        isToday && { borderColor: COLORS.warn, backgroundColor: "rgba(245,158,11,0.18)" },
                      ]}
                    >
                      <Text style={{ color: COLORS.muted, fontSize: 10 }}>يوم {idx + 1}</Text>
                      <Text style={{ color: done ? COLORS.success : COLORS.warn, fontSize: 12, fontWeight: "800", marginTop: 2 }}>
                        {done ? "✓" : `+${rew}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity
                style={[styles.claimBtn, claimedStreakToday && { backgroundColor: COLORS.surface2 }]}
                onPress={handleClaim}
              >
                <Text style={{ color: claimedStreakToday ? COLORS.muted : "#fff", fontWeight: "800", fontSize: 13.5 }}>
                  {claimedStreakToday
                    ? "✓ تم استلام مكافأة اليوم — عد غداً!"
                    : `🎁 استلم مكافأة اليوم (+${STREAK_REWARDS[activeDayIdx]} نقطة)`}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Real SHAHINAZ Coin Store */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🛍️ استبدل نقاطك بمزايا حقيقية فوراً</Text>

              <TouchableOpacity style={styles.shopItem} onPress={() => handleRedeem("verify", 500)}>
                <View style={styles.costPill}>
                  <Text style={styles.costTxt}>500 🪙</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.itemTitle}>☑️ شارة التوثيق الأزرق الرسمية</Text>
                  <Text style={styles.itemSub}>تظهر بجانب اسمك في الرئيسية والبروفايل والرسائل</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shopItem} onPress={() => handleRedeem("vip", 350)}>
                <View style={styles.costPill}>
                  <Text style={styles.costTxt}>350 🪙</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.itemTitle}>👑 ترقية حسابك إلى رتبة VIP الذهبية</Text>
                  <Text style={styles.itemSub}>شارة VIP مميزة + أولوية الترويج في SHAHINAZ</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.shopItem} onPress={() => handleRedeem("boost", 250)}>
                <View style={styles.costPill}>
                  <Text style={styles.costTxt}>250 🪙</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.itemTitle}>🚀 ترويج آخر منشور لك (⭐ مموّل)</Text>
                  <Text style={styles.itemSub}>يثبّت ويُبرز أحدث منشور لك ليراه الجميع</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Neon Accent Color Picker */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎨 لون التمييز الخاص بك (مجاناً ✨)</Text>
              <View style={styles.themesRow}>
                {ACCENT_THEMES.map((t) => (
                  <TouchableOpacity
                    key={t.color}
                    style={[
                      styles.themeChip,
                      accentColor === t.color && { borderColor: t.color, backgroundColor: "rgba(255,255,255,0.1)" },
                    ]}
                    onPress={() => setAccentColor(t.color)}
                  >
                    <View style={[styles.swatchDot, { backgroundColor: t.color }]} />
                    <Text style={{ color: COLORS.text, fontSize: 11, fontWeight: "700" }}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0b0b0e",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "88%",
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  handle: {
    width: 42,
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
  title: { color: "#fff", fontSize: 16.5, fontWeight: "800" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 18,
    padding: 18,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    gap: 10,
  },
  cardTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800", textAlign: "right" },
  daysRow: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 4 },
  dayBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  claimBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  costPill: {
    backgroundColor: "rgba(245,158,11,0.18)",
    borderColor: COLORS.warn,
    borderWidth: 0.6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  costTxt: { color: COLORS.warn, fontWeight: "800", fontSize: 12 },
  itemTitle: { color: COLORS.text, fontWeight: "700", fontSize: 13 },
  itemSub: { color: COLORS.muted, fontSize: 11, marginTop: 2, textAlign: "right" },
  themesRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  themeChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  swatchDot: { width: 12, height: 12, borderRadius: 6 },
});
