import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import { PulseDot } from "./LuxuryMotion";

interface LiveChannel {
  id: string;
  host: string;
  title: string;
  viewers: number;
  avatarUri: string;
  coverUri: string;
  pinnedProduct?: { title: string; priceDzd: number };
}

const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: "live_1",
    host: "كريم تكنولوجي",
    title: "تخفيضات الساعات الذكية والهواتف — توصيل 58 ولاية ⌚🔥",
    viewers: 1420,
    avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&q=85",
    pinnedProduct: { title: "ساعة Ultra Pro مقاومة للماء + هدية", priceDzd: 4500 },
  },
  {
    id: "live_2",
    host: "سارة منصوري",
    title: "بث مباشر من كورنيش وهران — تحدي الأسبوع 🌊✨",
    viewers: 985,
    avatarUri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&q=85",
  },
  {
    id: "live_3",
    host: "ياسين بن علي",
    title: "ورشة تصميم وتصوير احترافي بالهاتف 📸🇩🇿",
    viewers: 614,
    avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    coverUri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&q=85",
  },
];

const SIM_MESSAGES = [
  { user: "أمين_وهران", text: "ما شاء الله جودة البث خرافية 🔥🇩🇿" },
  { user: "نسرين_16", text: "هل التوصيل متوفر للجزائر العاصمة في 24 ساعة؟" },
  { user: "وليد_سطيف", text: "أجمل تطبيق جزائري بصراحة 👏👑" },
  { user: "مريم_قسنطينة", text: "تم الطلب بنجاح شكراً على التخفيض ✨" },
];

export default function LiveStreamModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { currentUser, theme, sendLiveGift, placeCodOrder } = useApp();
  const [channelIdx, setChannelIdx] = useState(0);
  const [isHosting, setIsHosting] = useState(false);
  const [hostTitle, setHostTitle] = useState("بثي المباشر على SHAHINAZ 🔴✨");
  const [viewers, setViewers] = useState(LIVE_CHANNELS[0].viewers);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<{ id: string; user: string; text: string }[]>([
    { id: "m1", user: "سارة_DZ", text: "أهلاً بالجميع في بث SHAHINAZ LIVE! ✨🔥" },
    { id: "m2", user: "مراد_31", text: "تحية كبيرة من وهران الباهية 🇩🇿" },
  ]);
  const [giftBanner, setGiftBanner] = useState("");
  const [floatingEmoji, setFloatingEmoji] = useState("❤️");

  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;

  const activeChannel = LIVE_CHANNELS[channelIdx] || LIVE_CHANNELS[0];

  useEffect(() => {
    if (!visible) return;
    setViewers(isHosting ? 48 : activeChannel.viewers);
    const interval = setInterval(() => {
      setViewers((v) => Math.max(12, v + Math.floor(Math.random() * 11) - 3));
      const pick = SIM_MESSAGES[Math.floor(Math.random() * SIM_MESSAGES.length)];
      setMessages((prev) => [{ id: `sim_${Date.now()}`, ...pick }, ...prev.slice(0, 14)]);
    }, 4200);
    return () => clearInterval(interval);
  }, [visible, channelIdx, isHosting]);

  function triggerHeartBurst(em: string) {
    setFloatingEmoji(em);
    floatY.setValue(0);
    floatOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(floatY, { toValue: -210, duration: 950, useNativeDriver: true }),
      Animated.timing(floatOpacity, { toValue: 0, duration: 950, useNativeDriver: true }),
    ]).start();
  }

  function handleSendChat() {
    const clean = chatMsg.trim();
    if (!clean) return;
    setMessages((prev) => [
      { id: `me_${Date.now()}`, user: currentUser?.name || "أنت", text: clean },
      ...prev.slice(0, 14),
    ]);
    setChatMsg("");
  }

  function handleSendGift(emoji: string, label: string, cost: number) {
    const res = sendLiveGift(isHosting ? "البث المباشر" : activeChannel.host, emoji, cost);
    if (!res.ok) {
      Alert.alert("رصيد النقاط", res.message);
      return;
    }
    triggerHeartBurst(emoji);
    setGiftBanner(`🎁 أرسل ${currentUser?.name || "أنت"} ${label} ${emoji} (+${cost} 🪙)!`);
    setMessages((prev) => [
      { id: `gf_${Date.now()}`, user: currentUser?.name || "أنت", text: `أرسل هدية ${label} ${emoji} 🎁` },
      ...prev.slice(0, 14),
    ]);
    setTimeout(() => setGiftBanner(""), 2600);
  }

  function handleQuickLiveOrder() {
    if (!activeChannel.pinnedProduct) return;
    placeCodOrder({
      productTitle: activeChannel.pinnedProduct.title,
      priceDzd: activeChannel.pinnedProduct.priceDzd,
      buyerName: currentUser?.name || "زبون SHAHINAZ",
      phone: "0550000000",
      wilaya: "16 - الجزائر العاصمة",
    });
    Alert.alert("🛍️ تم حجز العرض المباشر!", `تم تسجيل طلبك لـ "${activeChannel.pinnedProduct.title}" ويمكنك تتبعه من زر (طلباتي) في السوق!`);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* Full-Screen Stage Visual */}
        {isHosting ? (
          <LinearGradient colors={theme.coverGrad} style={StyleSheet.absoluteFillObject} />
        ) : (
          <Image source={{ uri: activeChannel.coverUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        )}
        <LinearGradient
          colors={["rgba(5,6,11,0.78)", "rgba(5,6,11,0.18)", "rgba(5,6,11,0.95)"]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Top Bar: Host Info + Live Viewers + Close */}
        <View style={styles.topBar}>
          <View style={styles.hostPill}>
            {isHosting ? (
              <View style={[styles.hostAvatar, { backgroundColor: theme.primarySoft, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="videocam" size={18} color={theme.primary} />
              </View>
            ) : (
              <Image source={{ uri: activeChannel.avatarUri }} style={styles.hostAvatar} />
            )}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
                {isHosting ? currentUser?.name || "بثك المباشر" : activeChannel.host}
              </Text>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                <PulseDot color="#EF4444" size={7} />
                <Text style={{ color: "#FCA5A5", fontSize: 11, fontWeight: "800" }}>
                  مباشر · 👁️ {viewers.toLocaleString("fr-DZ")}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeOrb}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Channel Switcher + Go Live Toggle */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 42, marginTop: 10 }}
          contentContainerStyle={{ paddingHorizontal: 14, gap: 8 }}
        >
          <TouchableOpacity
            style={[
              styles.chanChip,
              isHosting && { backgroundColor: "#DC2626", borderColor: "#FCA5A5" },
            ]}
            onPress={() => setIsHosting((v) => !v)}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11.5 }}>
              {isHosting ? "⏹️ إيقاف بثي" : "🔴 ابدأ بثك الآن"}
            </Text>
          </TouchableOpacity>

          {LIVE_CHANNELS.map((c, idx) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chanChip,
                !isHosting && channelIdx === idx && { borderColor: theme.primary, backgroundColor: "rgba(0,0,0,0.72)" },
              ]}
              onPress={() => {
                setIsHosting(false);
                setChannelIdx(idx);
              }}
            >
              <Text style={{ color: !isHosting && channelIdx === idx ? theme.primary : "#fff", fontWeight: "800", fontSize: 11.5 }}>
                {c.host}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Center Stage Banner / Hosting Title */}
        <View style={styles.centerStage}>
          {isHosting && (
            <View style={[styles.hostingBox, { borderColor: theme.borderGlow }]}>
              <PulseDot color="#EF4444" size={14} />
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", textAlign: "center" }}>
                أنت الآن على الهواء مباشرة! 🎙️
              </Text>
              <TextInput
                style={styles.hostTitleInput}
                value={hostTitle}
                onChangeText={setHostTitle}
                placeholder="عنوان بثك المباشر..."
                placeholderTextColor="rgba(255,255,255,0.6)"
              />
            </View>
          )}

          {!!giftBanner && (
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.giftAlertPill}>
              <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>{giftBanner}</Text>
            </LinearGradient>
          )}

          {/* Animated Floating Hearts Burst */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.floatingEmojiWrap,
              {
                opacity: floatOpacity,
                transform: [{ translateY: floatY }],
              },
            ]}
          >
            <Text style={{ fontSize: 44 }}>{floatingEmoji}</Text>
          </Animated.View>
        </View>

        {/* Bottom Interactive Area: Pinned Live Product + Scrolling Chat + Gifts + Composer */}
        <View style={styles.bottomWrap}>
          {!isHosting && activeChannel.pinnedProduct && (
            <View style={[styles.pinnedShopCard, { borderColor: theme.borderGlow }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={handleQuickLiveOrder}>
                <LinearGradient colors={theme.btnGrad} style={styles.liveBuyBtn}>
                  <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 12 }}>اطلب الآن</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: theme.primary, fontSize: 10.5, fontWeight: "900" }}>🛍️ عرض حصري في البث</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }} numberOfLines={1}>
                  {activeChannel.pinnedProduct.title}
                </Text>
                <Text style={{ color: "#34D399", fontSize: 12.5, fontWeight: "900" }}>
                  {activeChannel.pinnedProduct.priceDzd.toLocaleString("fr-DZ")} دج (توصيل 58 ولاية)
                </Text>
              </View>
            </View>
          )}

          {/* Live Chat Feed */}
          <View style={styles.chatBox}>
            {messages.slice(0, 4).map((m) => (
              <View key={m.id} style={styles.liveChatLine}>
                <Text style={{ color: "#fff", fontSize: 12.5, textAlign: "right" }}>
                  <Text style={{ color: theme.primary, fontWeight: "900" }}>{m.user}: </Text>
                  {m.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Gift & Reaction Quick Row */}
          <View style={styles.giftsBar}>
            <TouchableOpacity style={styles.heartTapBtn} onPress={() => triggerHeartBurst("❤️")}>
              <Text style={{ fontSize: 20 }}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.giftPillBtn} onPress={() => handleSendGift("🌹", "وردة", 10)}>
              <Text style={styles.giftPillTxt}>🌹 10🪙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.giftPillBtn} onPress={() => handleSendGift("🔥", "شعلة", 25)}>
              <Text style={styles.giftPillTxt}>🔥 25🪙</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.giftPillBtn} onPress={() => handleSendGift("👑", "تاج ملكي", 100)}>
              <Text style={styles.giftPillTxt}>👑 100🪙</Text>
            </TouchableOpacity>
          </View>

          {/* Live Chat Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="اكتب تعليقاً في البث المباشر..."
              placeholderTextColor="rgba(255,255,255,0.65)"
              value={chatMsg}
              onChangeText={setChatMsg}
              onSubmitEditing={handleSendChat}
            />
            <TouchableOpacity onPress={handleSendChat}>
              <LinearGradient colors={theme.btnGrad} style={styles.sendOrb}>
                <Ionicons name="send" size={16} color={theme.btnText} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#05060B", paddingTop: 46, paddingBottom: 24 },
  topBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  hostPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(5,6,11,0.68)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  hostAvatar: { width: 36, height: 36, borderRadius: 14 },
  closeOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  chanChip: {
    backgroundColor: "rgba(0,0,0,0.5)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    paddingHorizontal: 13,
    borderRadius: 999,
    justifyContent: "center",
  },
  centerStage: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  hostingBox: {
    width: "100%",
    backgroundColor: "rgba(5,6,11,0.72)",
    borderWidth: 1.2,
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  hostTitleInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#fff",
    textAlign: "right",
  },
  giftAlertPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 14,
  },
  floatingEmojiWrap: {
    position: "absolute",
    left: 26,
    bottom: 20,
  },
  bottomWrap: { paddingHorizontal: 14, gap: 10 },
  pinnedShopCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(10,12,20,0.85)",
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  liveBuyBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  chatBox: { gap: 6 },
  liveChatLine: {
    alignSelf: "flex-end",
    backgroundColor: "rgba(0,0,0,0.54)",
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    maxWidth: "90%",
  },
  giftsBar: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  heartTapBtn: {
    width: 42,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(251,55,91,0.28)",
    borderWidth: 1,
    borderColor: "rgba(251,55,91,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftPillBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftPillTxt: { color: "#fff", fontSize: 11.5, fontWeight: "900" },
  inputRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: "#fff",
    textAlign: "right",
  },
  sendOrb: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
});
