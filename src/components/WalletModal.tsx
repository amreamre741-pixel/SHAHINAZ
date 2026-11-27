import React, { useState } from "react";
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";

const TRANSFER_AMOUNTS = [25, 50, 100, 250];

export default function WalletModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const {
    currentUser,
    allUsers,
    codOrders,
    walletTransactions,
    theme,
    transferCoins,
  } = useApp();

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [amount, setAmount] = useState<number>(50);

  const coins = currentUser?.points ?? 150;
  const estDzdValue = Math.round(coins * 1.5);
  const totalCodVolume = codOrders.reduce((sum, o) => sum + o.priceDzd, 0);
  const recipients = allUsers.filter((u) => u.id !== currentUser?.id);
  const activeRecipientId = selectedRecipientId || recipients[0]?.id || "";

  function handleSendCoins() {
    if (!activeRecipientId) {
      Alert.alert("تنبيه", "اختر مستلماً للتحويل أولاً.");
      return;
    }
    const res = transferCoins(activeRecipientId, amount);
    Alert.alert(res.ok ? "💸 تم التحويل بنجاح!" : "تعذر التحويل", res.message);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 9 }}>
              <LinearGradient colors={theme.btnGrad} style={styles.headerBadge}>
                <Ionicons name="card" size={17} color={theme.btnText} />
              </LinearGradient>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.title, { color: theme.text }]}>محفظة SHAHINAZ Pay</Text>
                <Text style={{ color: theme.muted, fontSize: 11 }}>بطاقتك الملكية · التحويلات · مبيعات 58 ولاية</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 26 }}>
            {/* Luxury Metallic SHAHINAZ BLACK VIP Card */}
            <LinearGradient
              colors={theme.isLight ? ["#1E1B16", "#3A2C14", "#12100C"] : theme.coverGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.vipCard, { borderColor: theme.borderGlow }]}
            >
              <View style={styles.cardGlowOrb} />
              <View style={styles.vipCardTop}>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6 }}>
                  <Ionicons name="diamond" size={16} color="#FDE68A" />
                  <Text style={{ color: "#FDE68A", fontWeight: "900", fontSize: 12, letterSpacing: 1.8 }}>
                    SHAHINAZ BLACK
                  </Text>
                </View>
                <View style={styles.chipMetal}>
                  <View style={styles.chipInnerLine} />
                </View>
              </View>

              <View style={{ alignItems: "flex-end", marginVertical: 14 }}>
                <Text style={{ color: "rgba(255,255,255,0.68)", fontSize: 11, fontWeight: "700" }}>الرصيد المتاح</Text>
                <Text style={{ color: "#FFFFFF", fontSize: 30, fontWeight: "900", marginTop: 2 }}>
                  🪙 {coins.toLocaleString("fr-DZ")}
                </Text>
                <Text style={{ color: "#FDE68A", fontSize: 12, fontWeight: "700", marginTop: 2 }}>
                  القيمة التقديرية: ≈ {estDzdValue.toLocaleString("fr-DZ")} دج
                </Text>
              </View>

              <View style={styles.vipCardBottom}>
                <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 11, letterSpacing: 1.5, fontWeight: "700" }}>
                  SHZ • 1994 • {(currentUser?.username || "USER").slice(0, 6).toUpperCase()}
                </Text>
                <Text style={{ color: "#FFFFFF", fontSize: 12.5, fontWeight: "800" }}>
                  {currentUser?.name || "عضو SHAHINAZ"}
                </Text>
              </View>
            </LinearGradient>

            {/* 58-Wilaya COD Commerce Summary */}
            <View style={{ flexDirection: "row-reverse", gap: 10 }}>
              <View style={[styles.statMini, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={{ color: theme.muted, fontSize: 11, fontWeight: "700" }}>طلبات 58 ولاية</Text>
                <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 4 }}>{codOrders.length}</Text>
                <Text style={{ color: theme.success, fontSize: 10.5, fontWeight: "700" }}>الدفع عند الاستلام</Text>
              </View>
              <View style={[styles.statMini, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={{ color: theme.muted, fontSize: 11, fontWeight: "700" }}>قيمة الطلبات (دج)</Text>
                <Text style={{ color: theme.primary, fontSize: 18, fontWeight: "900", marginTop: 4 }}>
                  {totalCodVolume.toLocaleString("fr-DZ")} دج
                </Text>
                <Text style={{ color: theme.muted, fontSize: 10.5 }}>محدّث تلقائياً</Text>
              </View>
            </View>

            {/* Instant Coin Transfer to Friend */}
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>💸 تحويل فوري لصديق</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {recipients.map((u) => {
                  const active = activeRecipientId === u.id;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[
                        styles.friendChip,
                        {
                          backgroundColor: active ? theme.primarySoft : theme.surface2,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setSelectedRecipientId(u.id)}
                    >
                      {u.avatarUri ? (
                        <Image source={{ uri: u.avatarUri }} style={{ width: 26, height: 26, borderRadius: 10 }} />
                      ) : (
                        <Text style={{ fontSize: 15 }}>{u.avatarEmoji}</Text>
                      )}
                      <Text style={{ color: active ? theme.primary : theme.text, fontSize: 11.5, fontWeight: "800" }}>
                        {u.name.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                {TRANSFER_AMOUNTS.map((val) => {
                  const active = amount === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.amtChip,
                        {
                          backgroundColor: active ? theme.primarySoft : theme.surface2,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setAmount(val)}
                    >
                      <Text style={{ color: active ? theme.primary : theme.text, fontWeight: "900", fontSize: 12.5 }}>
                        {val} 🪙
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity activeOpacity={0.9} onPress={handleSendCoins}>
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtn}>
                  <Ionicons name="paper-plane" size={16} color={theme.btnText} />
                  <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13.5 }}>
                    إرسال {amount} نقطة فوراً
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Live Transaction Ledger */}
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🧾 سجل العمليات المالية</Text>
              {walletTransactions.length === 0 ? (
                <Text style={{ color: theme.muted, fontSize: 12.5, textAlign: "center", paddingVertical: 12 }}>
                  لا توجد عمليات مسجلة بعد
                </Text>
              ) : (
                walletTransactions.slice(0, 12).map((tx) => (
                  <View key={tx.id} style={[styles.txRow, { borderBottomColor: theme.border }]}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                      <View style={[styles.txEmojiBox, { backgroundColor: theme.surface2 }]}>
                        <Text style={{ fontSize: 16 }}>{tx.emoji}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end", flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 12.5, fontWeight: "800", textAlign: "right" }}>
                          {tx.title}
                        </Text>
                        <Text style={{ color: theme.muted, fontSize: 10.5 }}>{tx.time}</Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        color: tx.deltaCoins >= 0 ? theme.success : theme.danger,
                        fontWeight: "900",
                        fontSize: 13,
                      }}
                    >
                      {tx.deltaCoins >= 0 ? `+${tx.deltaCoins}` : tx.deltaCoins} 🪙
                    </Text>
                  </View>
                ))
              )}
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
    marginBottom: 14,
  },
  headerBadge: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16.5, fontWeight: "900" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  vipCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.2,
    overflow: "hidden",
    position: "relative",
  },
  cardGlowOrb: {
    position: "absolute",
    top: -50,
    left: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(253,230,138,0.14)",
  },
  vipCardTop: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  chipMetal: {
    width: 36,
    height: 26,
    borderRadius: 6,
    backgroundColor: "#E5C16C",
    borderWidth: 1,
    borderColor: "#FEF08A",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  chipInnerLine: { height: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  vipCardBottom: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" },
  statMini: { flex: 1, borderRadius: 18, padding: 13, borderWidth: 1, alignItems: "flex-end" },
  sectionCard: { borderRadius: 22, padding: 15, borderWidth: 1, gap: 11 },
  sectionTitle: { fontSize: 14, fontWeight: "900", textAlign: "right" },
  friendChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  amtChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
  },
  sendBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 15,
    paddingVertical: 13,
  },
  txRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 0.5,
  },
  txEmojiBox: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
