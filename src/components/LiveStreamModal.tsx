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
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import { apiFetch } from "../services/api";
import { PulseDot } from "./LuxuryMotion";

interface LiveRoomItem {
  id: string;
  host: string;
  title: string;
  viewers: number;
  avatarUri?: string;
  coverUri?: string;
  isReal?: boolean;
  pinnedProduct?: { title: string; priceDzd: number };
}

const FALLBACK_CHANNELS: LiveRoomItem[] = [
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
];

export default function LiveStreamModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { currentUser, token, theme, sendLiveGift, placeCodOrder } = useApp();
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [micMuted, setMicMuted] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [liveSeconds, setLiveSeconds] = useState(0);

  const [channels, setChannels] = useState<LiveRoomItem[]>(FALLBACK_CHANNELS);
  const [channelIdx, setChannelIdx] = useState(0);
  const [isHosting, setIsHosting] = useState(false);
  const [activeLiveRoomId, setActiveLiveRoomId] = useState<string | null>(null);
  const [hostTitle, setHostTitle] = useState("بثي المباشر على SHAHINAZ 🔴✨");

  useEffect(() => {
    if (!isHosting) {
      setLiveSeconds(0);
      setTorchOn(false);
      return;
    }
    const timer = setInterval(() => setLiveSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [isHosting]);

  const formattedLiveTime = `${String(Math.floor(liveSeconds / 60)).padStart(2, "0")}:${String(liveSeconds % 60).padStart(2, "0")}`;
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<{ id: string; user: string; text: string }[]>([
    { id: "m1", user: "SHAHINAZ LIVE", text: "أهلاً بك في البث المباشر — الكاميرا والدردشة جاهزة! 🔴" },
  ]);
  const [giftBanner, setGiftBanner] = useState("");
  const [floatingEmoji, setFloatingEmoji] = useState("❤️");

  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;

  const activeChannel = channels[channelIdx] || channels[0];

  async function loadRealLiveRooms() {
    if (!token) return;
    try {
      const rows = await apiFetch<any[]>("/api/rooms?kind=LIVE", token);
      if (Array.isArray(rows) && rows.length > 0) {
        const mapped: LiveRoomItem[] = rows.map((r) => ({
          id: r.id,
          host: r.host?.name || "مذيع SHAHINAZ",
          title: r.title,
          viewers: r.viewers || 1,
          avatarUri: r.host?.avatarUrl || undefined,
          coverUri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1000&q=85",
          isReal: true,
        }));
        setChannels([...mapped, ...FALLBACK_CHANNELS]);
      }
    } catch {
      // keep fallback channels if offline
    }
  }

  useEffect(() => {
    if (visible) {
      loadRealLiveRooms();
    }
  }, [visible]);

  // Poll real live room chat every 3s
  useEffect(() => {
    const roomId = isHosting ? activeLiveRoomId : activeChannel?.isReal ? activeChannel.id : null;
    if (!visible || !token || !roomId) return;

    async function fetchMsgs() {
      try {
        const rows = await apiFetch<any[]>(`/api/rooms/${roomId}/messages`, token);
        if (Array.isArray(rows)) {
          setMessages(
            rows.map((m) => ({
              id: m.id,
              user: m.user?.name || "مشاهد",
              text: m.text,
            }))
          );
        }
      } catch {
        // ignore polling errors
      }
    }
    fetchMsgs();
    const t = setInterval(fetchMsgs, 3000);
    return () => clearInterval(t);
  }, [visible, isHosting, activeLiveRoomId, activeChannel?.id]);

  async function handleToggleGoLive() {
    if (isHosting) {
      if (token && activeLiveRoomId) {
        apiFetch(`/api/rooms/${activeLiveRoomId}/end`, token, { method: "POST" }).catch(() => {});
      }
      setIsHosting(false);
      setActiveLiveRoomId(null);
      return;
    }

    const camRes = cameraPerm?.granted ? cameraPerm : await requestCameraPerm();
    const micRes = await Audio.requestPermissionsAsync();
    if (!camRes.granted || !micRes.granted) {
      Alert.alert(
        "صلاحية الكاميرا والميكروفون مطلوبة",
        "يرجى منح صلاحية الكاميرا والميكروفون لفتح البث المباشر الحقيقي."
      );
      return;
    }

    setIsHosting(true);
    if (token) {
      try {
        const created = await apiFetch<{ id: string }>("/api/rooms", token, {
          method: "POST",
          body: JSON.stringify({ title: hostTitle, topic: "بث مباشر", kind: "LIVE" }),
        });
        if (created?.id) setActiveLiveRoomId(created.id);
      } catch {
        // continue local camera broadcast
      }
    }
  }

  function triggerHeartBurst(em: string) {
    setFloatingEmoji(em);
    floatY.setValue(0);
    floatOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(floatY, { toValue: -210, duration: 950, useNativeDriver: true }),
      Animated.timing(floatOpacity, { toValue: 0, duration: 950, useNativeDriver: true }),
    ]).start();
  }

  async function handleSendChat() {
    const clean = chatMsg.trim();
    if (!clean) return;
    setChatMsg("");
    setMessages((prev) => [
      { id: `me_${Date.now()}`, user: currentUser?.name || "أنت", text: clean },
      ...prev.slice(0, 14),
    ]);
    const roomId = isHosting ? activeLiveRoomId : activeChannel?.isReal ? activeChannel.id : null;
    if (token && roomId) {
      apiFetch(`/api/rooms/${roomId}/messages`, token, {
        method: "POST",
        body: JSON.stringify({ text: clean }),
      }).catch(() => {});
    }
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
    if (!activeChannel?.pinnedProduct) return;
    placeCodOrder({
      productTitle: activeChannel.pinnedProduct.title,
      priceDzd: activeChannel.pinnedProduct.priceDzd,
      buyerName: currentUser?.name || "زبون SHAHINAZ",
      phone: "0550000000",
      wilaya: "16 - الجزائر العاصمة",
    });
    Alert.alert("🛍️ تم حجز العرض المباشر!", `تم تسجيل طلبك لـ "${activeChannel.pinnedProduct.title}" ويمكنك تتبعه من (طلباتي)!`);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        {/* 100% REAL PHONE CAMERA WHEN HOSTING LIVE */}
        {isHosting ? (
          <CameraView style={StyleSheet.absoluteFillObject} facing={facing} enableTorch={torchOn} />
        ) : activeChannel?.coverUri ? (
          <Image source={{ uri: activeChannel.coverUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <LinearGradient colors={theme.coverGrad} style={StyleSheet.absoluteFillObject} />
        )}

        <LinearGradient
          colors={["rgba(5,6,11,0.72)", "rgba(5,6,11,0.08)", "rgba(5,6,11,0.92)"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.hostPill}>
            {isHosting ? (
              <View style={[styles.hostAvatar, { backgroundColor: "rgba(239,68,68,0.28)", alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="videocam" size={18} color="#FCA5A5" />
              </View>
            ) : activeChannel?.avatarUri ? (
              <Image source={{ uri: activeChannel.avatarUri }} style={styles.hostAvatar} />
            ) : (
              <View style={[styles.hostAvatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }]}>
                <Ionicons name="person" size={18} color="#fff" />
              </View>
            )}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13 }}>
                {isHosting ? currentUser?.name || "بثك المباشر" : activeChannel?.host}
              </Text>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                <PulseDot color="#EF4444" size={7} />
                <Text style={{ color: "#FCA5A5", fontSize: 11, fontWeight: "800" }}>
                  {isHosting ? `مباشر الآن · ${formattedLiveTime}` : `مباشر · 👁️ ${activeChannel?.viewers || 1}`}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {isHosting && (
              <>
                <TouchableOpacity
                  onPress={() => setFacing((f) => (f === "front" ? "back" : "front"))}
                  style={styles.closeOrb}
                >
                  <Ionicons name="camera-reverse-outline" size={21} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTorchOn((t) => !t)} style={styles.closeOrb}>
                  <Ionicons name={torchOn ? "flash" : "flash-outline"} size={20} color={torchOn ? "#FDE047" : "#fff"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setMicMuted((m) => !m)} style={styles.closeOrb}>
                  <Ionicons name={micMuted ? "mic-off" : "mic"} size={20} color={micMuted ? "#FCA5A5" : "#fff"} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              onPress={() => {
                if (isHosting && token && activeLiveRoomId) {
                  apiFetch(`/api/rooms/${activeLiveRoomId}/end`, token, { method: "POST" }).catch(() => {});
                }
                setIsHosting(false);
                setActiveLiveRoomId(null);
                onClose();
              }}
              style={styles.closeOrb}
            >
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Channel Switcher + Real Camera Go Live Button */}
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
            onPress={handleToggleGoLive}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 11.5 }}>
              {isHosting ? "⏹️ إنهاء البث" : "🔴 افتح لايف بالكاميرا"}
            </Text>
          </TouchableOpacity>

          {channels.map((c, idx) => (
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
                {c.isReal ? "🔴 " : ""}
                {c.host}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Center Overlay */}
        <View style={styles.centerStage}>
          {isHosting ? (
            <TextInput
              style={styles.hostTitleInput}
              value={hostTitle}
              onChangeText={setHostTitle}
              placeholder="عنوان بثك المباشر..."
              placeholderTextColor="rgba(255,255,255,0.7)"
            />
          ) : (
            <TouchableOpacity onPress={handleToggleGoLive} activeOpacity={0.9} style={{ width: "86%" }}>
              <LinearGradient
                colors={["#EF4444", "#B91C1C"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: "row-reverse",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  paddingVertical: 15,
                  paddingHorizontal: 20,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: "rgba(254,202,202,0.55)",
                }}
              >
                <Ionicons name="videocam" size={22} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15 }}>
                  ابدأ بثك المباشر الآن بالكاميرا 🔴
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {!!giftBanner && (
            <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.giftAlertPill}>
              <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>{giftBanner}</Text>
            </LinearGradient>
          )}

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

        {/* Bottom Interactive Area */}
        <View style={styles.bottomWrap}>
          {!isHosting && activeChannel?.pinnedProduct && (
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
  centerStage: { flex: 1, justifyContent: "flex-start", alignItems: "center", paddingHorizontal: 20, paddingTop: 14 },
  hostTitleInput: {
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: "#fff",
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
  },
  giftAlertPill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginTop: 14 },
  floatingEmojiWrap: { position: "absolute", left: 26, bottom: 20 },
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
