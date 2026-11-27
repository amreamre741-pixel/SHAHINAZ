import React from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME_LIST } from "../theme";
import { useApp } from "../store/AppContext";

const STREAK_REWARDS = [50, 75, 100, 150, 200, 300, 500];

export default function DailyStreakModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const {
    currentUser,
    streakDays,
    claimedStreakToday,
    dailyMissions,
    theme,
    themeId,
    setThemeId,
    claimDailyStreak,
    claimMissionReward,
    redeemReward,
  } = useApp();

  const points = currentUser?.points ?? 150;
  const activeDayIdx = streakDays >= 7 ? 0 : Math.max(0, streakDays);

  const missionsList = [
    {
      id: "likes" as const,
      title: "❤️ أعجب بـ 3 منشورات اليوم",
      cur: Math.min(3, dailyMissions.likesCount),
      target: 3,
      reward: 40,
    },
    {
      id: "comments" as const,
      title: "💬 اكتب تعليقاً تفاعلياً واحداً",
      cur: Math.min(1, dailyMissions.commentsCount),
      target: 1,
      reward: 50,
    },
    {
      id: "saves" as const,
      title: "🔖 احفظ منشوراً في مفضلتك",
      cur: Math.min(1, dailyMissions.savesCount),
      target: 1,
      reward: 30,
    },
  ];

  function handleClaim() {
    const res = claimDailyStreak();
    Alert.alert(res.ok ? "🎉 مبروك!" : "تنبيه", res.message);
  }

  function handleRedeem(kind: "verify" | "vip" | "boost", cost: number) {
    const res = redeemReward(kind, cost);
    Alert.alert(res.ok ? "✨ تم التفعيل بنجاح!" : "رصيد غير كافٍ", res.message);
  }

  function handleMission(id: "likes" | "comments" | "saves") {
    const res = claimMissionReward(id);
    Alert.alert(res.ok ? "🎯 مهمة مكتملة!" : "المهمة اليومية", res.message);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
              <LinearGradient colors={theme.btnGrad} style={styles.iconPill}>
                <Ionicons name="flame" size={18} color={theme.btnText} />
              </LinearGradient>
              <Text style={[styles.title, { color: theme.text }]}>المكافآت، المهام، ومتجر النقاط</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {/* Balance Hero */}
            <LinearGradient colors={theme.coverGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.heroCard, { borderColor: theme.borderGlow }]}>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "800" }}>رصيدك الحالي في SHAHINAZ</Text>
                <Text style={{ color: theme.text, fontSize: 28, fontWeight: "900", marginTop: 2 }}>
                  🪙 {points.toLocaleString("fr-DZ")} نقطة
                </Text>
                <Text style={{ color: theme.muted, fontSize: 12, marginTop: 4 }}>
                  🔥 سلسلة الدخول المتتالية: {streakDays} يوم
                </Text>
              </View>
              <LinearGradient colors={theme.btnGrad} style={styles.trophyOrb}>
                <Ionicons name="trophy" size={28} color={theme.btnText} />
              </LinearGradient>
            </LinearGradient>

            {/* 7-Day Daily Streak Calendar */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>🔥 مكافأة الدخول اليومي (7 أيام)</Text>
              <View style={styles.daysRow}>
                {STREAK_REWARDS.map((rew, idx) => {
                  const done = idx < streakDays;
                  const isToday = idx === activeDayIdx && !claimedStreakToday;
                  return (
                    <View
                      key={idx}
                      style={[
                        styles.dayBox,
                        { backgroundColor: theme.surface2, borderColor: theme.border },
                        done && { borderColor: theme.success, backgroundColor: "rgba(16,185,129,0.15)" },
                        isToday && { borderColor: theme.primary, backgroundColor: theme.primarySoft },
                      ]}
                    >
                      <Text style={{ color: theme.muted, fontSize: 9.5 }}>يوم {idx + 1}</Text>
                      <Text style={{ color: done ? theme.success : theme.primary, fontSize: 11.5, fontWeight: "900", marginTop: 2 }}>
                        {done ? "✓" : `+${rew}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <TouchableOpacity activeOpacity={0.88} onPress={handleClaim}>
                {claimedStreakToday ? (
                  <View style={[styles.claimBtn, { backgroundColor: theme.surface2 }]}>
                    <Text style={{ color: theme.muted, fontWeight: "800", fontSize: 13 }}>
                      ✓ تم استلام مكافأة اليوم — عد غداً!
                    </Text>
                  </View>
                ) : (
                  <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.claimBtn}>
                    <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13.5 }}>
                      🎁 استلم مكافأة اليوم (+{STREAK_REWARDS[activeDayIdx]} نقطة)
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>

            {/* Auto-Tracked Live Daily Missions */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>🎯 مهامك اليومية (تُحسب تلقائياً)</Text>
              {missionsList.map((m) => {
                const claimed = dailyMissions.claimedIds.includes(m.id);
                const ready = m.cur >= m.target && !claimed;
                const pct = Math.round((m.cur / m.target) * 100);
                return (
                  <View key={m.id} style={[styles.missionBox, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: "800" }}>{m.title}</Text>
                      <TouchableOpacity onPress={() => handleMission(m.id)} disabled={claimed}>
                        {claimed ? (
                          <Text style={{ color: theme.success, fontSize: 11.5, fontWeight: "900" }}>تم الاستلام ✓</Text>
                        ) : ready ? (
                          <LinearGradient colors={theme.btnGrad} style={styles.missionClaimPill}>
                            <Text style={{ color: theme.btnText, fontSize: 11, fontWeight: "900" }}>استلم +{m.reward} 🪙</Text>
                          </LinearGradient>
                        ) : (
                          <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: "800" }}>
                            {m.cur}/{m.target} (+{m.reward}🪙)
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    <View style={{ height: 5, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden", marginTop: 7 }}>
                      <LinearGradient
                        colors={theme.btnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{ width: `${pct}%`, height: "100%" }}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Real SHAHINAZ Coin Store */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>🛍️ استبدل نقاطك بمزايا حقيقية فوراً</Text>

              {[
                { kind: "verify" as const, cost: 500, title: "☑️ شارة التوثيق الأزرق الرسمية", sub: "تظهر بجانب اسمك في الرئيسية والبروفايل والرسائل" },
                { kind: "vip" as const, cost: 350, title: "👑 ترقية حسابك إلى رتبة VIP الذهبية", sub: "شارة VIP مميزة + أولوية الترويج في SHAHINAZ" },
                { kind: "boost" as const, cost: 250, title: "🚀 ترويج آخر منشور لك (⭐ مموّل)", sub: "يثبّت ويُبرز أحدث منشور لك ليراه الجميع" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.kind}
                  style={[styles.shopItem, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                  onPress={() => handleRedeem(item.kind, item.cost)}
                >
                  <View style={[styles.costPill, { backgroundColor: theme.primarySoft, borderColor: theme.borderGlow }]}>
                    <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 12 }}>{item.cost} 🪙</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800", textAlign: "right" }}>{item.title}</Text>
                    <Text style={{ color: theme.muted, fontSize: 11, textAlign: "right", marginTop: 2 }}>{item.sub}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Full-App 6 Luxury Skins Quick Picker */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>🎨 هويات SHAHINAZ الملكية (6 ثيمات ✨)</Text>
              <View style={styles.themesRow}>
                {THEME_LIST.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.themeChip,
                      { backgroundColor: t.surface2, borderColor: themeId === t.id ? t.primary : t.border },
                      themeId === t.id && { borderWidth: 1.5 },
                    ]}
                    onPress={() => setThemeId(t.id)}
                  >
                    <Text style={{ fontSize: 13 }}>{t.emoji}</Text>
                    <Text style={{ color: t.text, fontSize: 11, fontWeight: "800" }}>{t.name.split(" ")[0]}</Text>
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
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "90%",
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
  iconPill: { width: 32, height: 32, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15.5, fontWeight: "900" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  heroCard: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
  },
  trophyOrb: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  card: { borderRadius: 20, padding: 14, borderWidth: 1, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" },
  daysRow: { flexDirection: "row-reverse", justifyContent: "space-between", gap: 4 },
  dayBox: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  claimBtn: { borderRadius: 14, padding: 13, alignItems: "center" },
  missionBox: { borderRadius: 14, padding: 11, borderWidth: 1 },
  missionClaimPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  shopItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  costPill: { borderWidth: 0.8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  themesRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 },
  themeChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
});
