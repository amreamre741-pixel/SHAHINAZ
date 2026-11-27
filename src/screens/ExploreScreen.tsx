import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import { apiFetch } from "../services/api";
import { uploadMediaFile } from "../services/mediaUpload";
import type { AudioRoom } from "../types";
import ShahinazAiModal from "../components/ShahinazAiModal";
import AuroraBackground from "../components/AuroraBackground";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 36) / 3;

const TRENDING_TAGS = ["#الجزائر", "#تحدي_الأسبوع", "#SHAHINAZ", "#وهران", "#تجارة"];
const WILAYA_FILTERS = ["الكل", "الجزائر", "وهران", "سطيف", "قسنطينة", "عنابة"];

const SHOP_REELS = [
  {
    id: "r_1",
    author: "كريم تكنولوجي",
    avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&q=85",
    title: "ساعة ذكية Ultra مقاومة للماء + شاحن مغناطيسي ⌚🔥 التوصيل لـ 58 ولاية!",
    productTitle: "ساعة ذكية Ultra مقاومة للماء",
    priceDzd: 4900,
    sellerPhone: "0550123456",
    likes: 12500,
    comments: 510,
  },
  {
    id: "r_2",
    author: "سارة منصوري",
    avatarUri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85",
    title: "أجمل شواطئ وهران الصافية هذا الصباح 🌊☀️ #تحدي_الأسبوع",
    productTitle: "",
    priceDzd: 0,
    sellerPhone: "",
    likes: 8920,
    comments: 318,
  },
  {
    id: "r_3",
    author: "ياسين بن علي",
    avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=900&q=85",
    title: "سماعات بلوتوث عازلة للصوت — عرض خاص لمتابعي SHAHINAZ 🎧⚡",
    productTitle: "سماعات بلوتوث عازلة للصوت",
    priceDzd: 3200,
    sellerPhone: "0661234567",
    likes: 4280,
    comments: 142,
  },
];

const INITIAL_REEL_COMMENTS: Record<string, { id: string; user: string; text: string }[]> = {
  r_1: [
    { id: "rc1", user: "أمين فوتو", text: "السعر ممتاز جداً! هل التوصيل متوفر لوهران؟ 🔥" },
    { id: "rc2", user: "سارة منصوري", text: "طلبت واحدة ووصلت في 24 ساعة 👏" },
  ],
  r_2: [{ id: "rc3", user: "ياسين بن علي", text: "ما شاء الله على جمال وهران 🌊🇩🇿" }],
  r_3: [{ id: "rc4", user: "كريم تكنولوجي", text: "جودة الصوت رائعة مقارنة بالسعر 🎧" }],
};

const LEADERBOARD = [
  { rank: 1, name: "سارة منصوري", wilaya: "وهران", points: 2840, avatarUri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
  { rank: 2, name: "ياسين بن علي", wilaya: "الجزائر", points: 2190, avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  { rank: 3, name: "كريم تكنولوجي", wilaya: "سطيف", points: 1750, avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80" },
];

export default function ExploreScreen() {
  const {
    currentUser,
    token,
    allUsers,
    posts,
    marketItems,
    audioRooms,
    codOrders,
    followingUserIds,
    marketEnabled,
    audioRoomsEnabled,
    rolePermissions,
    theme,
    toggleFollowUser,
    addMarketItem,
    createAudioRoom,
    placeCodOrder,
    toggleLike,
    toggleSave,
  } = useApp();

  const [mode, setMode] = useState<"explore" | "reels" | "rooms" | "market">("explore");
  const [q, setQ] = useState("");
  const [wilayaFilter, setWilayaFilter] = useState("الكل");
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [reelComments, setReelComments] = useState(INITIAL_REEL_COMMENTS);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [reelCommentDraft, setReelCommentDraft] = useState("");

  const previewPost = useMemo(
    () => posts.find((p) => p.id === previewPostId) || null,
    [posts, previewPostId]
  );

  const [challengeOpen, setChallengeOpen] = useState(false);
  const [codProduct, setCodProduct] = useState<{ title: string; priceDzd: number; phone: string } | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerWilaya, setBuyerWilaya] = useState("16 - الجزائر العاصمة");

  const [activeRoom, setActiveRoom] = useState<AudioRoom | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [roomRecSec, setRoomRecSec] = useState(0);
  const [roomVoiceClips, setRoomVoiceClips] = useState<
    { id: string; user: string; audioUri: string; durationSec: number; time: string }[]
  >([]);
  const roomRecRef = useRef<Audio.Recording | null>(null);
  const roomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomTopic, setRoomTopic] = useState("");

  useEffect(() => {
    return () => {
      if (roomTimerRef.current) clearInterval(roomTimerRef.current);
      if (roomRecRef.current) roomRecRef.current.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  async function handleToggleRoomMic() {
    if (!activeRoom) return;
    if (!micOn) {
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("صلاحية الميكروفون", "يرجى منح صلاحية الميكروفون للتحدث بصوتك الحقيقي في الغرفة.");
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        roomRecRef.current = recording;
        setMicOn(true);
        setRoomRecSec(1);
        roomTimerRef.current = setInterval(() => setRoomRecSec((s) => s + 1), 1000);
      } catch {
        Alert.alert("تنبيه", "تعذر تشغيل الميكروفون — تأكد من تثبيت إصدار v2.0.0.");
      }
    } else {
      if (roomTimerRef.current) clearInterval(roomTimerRef.current);
      const rec = roomRecRef.current;
      roomRecRef.current = null;
      const dur = Math.max(1, roomRecSec);
      setMicOn(false);
      setRoomRecSec(0);
      if (rec) {
        try {
          await rec.stopAndUnloadAsync();
          const uri = rec.getURI();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          if (uri) {
            const payload = await uploadMediaFile(uri, "audio/m4a", token);
            setRoomVoiceClips((prev) => [
              { id: `rv_${Date.now()}`, user: currentUser?.name || "أنت", audioUri: payload, durationSec: dur, time: "الآن" },
              ...prev,
            ]);
            if (token && !activeRoom.id.startsWith("ar_")) {
              apiFetch(`/api/rooms/${activeRoom.id}/messages`, token, {
                method: "POST",
                body: JSON.stringify({ audioUrl: payload, durationSec: dur }),
              }).catch(() => {});
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const [addingProduct, setAddingProduct] = useState(false);
  const [pTitle, setPTitle] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pCity, setPCity] = useState("");
  const [pPhone, setPPhone] = useState("");

  const filteredPosts = useMemo(() => {
    const s = q.trim().replace(/^#/, "").toLowerCase();
    if (!s) return posts;
    return posts.filter(
      (p) =>
        p.content.toLowerCase().includes(s) ||
        p.author.name.toLowerCase().includes(s) ||
        (p.location || "").toLowerCase().includes(s)
    );
  }, [posts, q]);

  const featuredCreators = useMemo(() => {
    const s = q.trim().toLowerCase();
    return allUsers
      .filter((u) => u.id !== currentUser?.id)
      .filter((u) => !s || u.name.toLowerCase().includes(s) || u.username.toLowerCase().includes(s));
  }, [allUsers, currentUser, q]);

  const filteredMarket = useMemo(() => {
    const s = q.trim().toLowerCase();
    return marketItems.filter((m) => {
      const matchWilaya = wilayaFilter === "الكل" || m.city.includes(wilayaFilter);
      const matchQuery = !s || m.title.toLowerCase().includes(s) || m.city.toLowerCase().includes(s);
      return matchWilaya && matchQuery;
    });
  }, [marketItems, q, wilayaFilter]);

  function handleConfirmCod() {
    if (!codProduct) return;
    if (!buyerName.trim() || !buyerPhone.trim()) {
      Alert.alert("بيانات ناقصة", "يرجى إدخال اسمك ورقم هاتفك لتأكيد الطلب.");
      return;
    }
    placeCodOrder({
      productTitle: codProduct.title,
      priceDzd: codProduct.priceDzd,
      buyerName: buyerName.trim(),
      phone: buyerPhone.trim(),
      wilaya: buyerWilaya.trim() || "الجزائر",
    });
    const sellerDigits = (codProduct.phone || "").replace(/\D/g, "");
    const intl = sellerDigits.startsWith("0") ? `213${sellerDigits.slice(1)}` : sellerDigits;
    const msg = `🛍️ طلب جديد من SHAHINAZ:\nالمنتج: ${codProduct.title}\nالسعر: ${codProduct.priceDzd} دج (الدفع عند الاستلام)\nالاسم: ${buyerName}\nالهاتف: ${buyerPhone}\nالولاية: ${buyerWilaya}`;
    setCodProduct(null);
    setBuyerName("");
    setBuyerPhone("");
    Alert.alert("🎉 تم تسجيل طلبك!", "هل تريد إرسال تفاصيل الطلب للتاجر على واتساب للتوصيل السريع؟", [
      { text: "لا، شكراً", style: "cancel" },
      { text: "📲 إرسال لواتساب", onPress: () => Linking.openURL(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`) },
    ]);
  }

  function handleAddProduct() {
    const price = Number(pPrice);
    if (!pTitle.trim() || !price || price <= 0) {
      Alert.alert("تنبيه", "يرجى إدخال اسم المنتج والسعر بالدينار.");
      return;
    }
    addMarketItem({
      title: pTitle.trim(),
      priceDzd: price,
      city: pCity.trim() || "الجزائر",
      phone: pPhone.trim(),
      emoji: "🛍️",
    });
    setPTitle("");
    setPPrice("");
    setPCity("");
    setPPhone("");
    setAddingProduct(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AuroraBackground theme={theme} height={240} />

      {/* Frosted Floating Segment Capsule */}
      <View style={[styles.topTabsCapsule, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {[
          { key: "explore", label: "استكشاف" },
          { key: "reels", label: "ريلز 🎬" },
          { key: "rooms", label: "صوتي 🎙️" },
          { key: "market", label: "السوق 🛍️" },
        ].map((t) => {
          const active = mode === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tabTouch}
              activeOpacity={0.85}
              onPress={() => setMode(t.key as any)}
            >
              {active ? (
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.tabActiveGrad}>
                  <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>{t.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={{ color: theme.muted, fontSize: 11.5, fontWeight: "700" }}>{t.label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {mode !== "reels" && mode !== "rooms" && (
        <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={18} color={theme.primary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={mode === "market" ? "ابحث عن منتج أو ولاية..." : "ابحث عن مبدعين، هاشتاقات، أو صور..."}
            placeholderTextColor={theme.muted}
            value={q}
            onChangeText={setQ}
          />
          {!!q && (
            <TouchableOpacity onPress={() => setQ("")}>
              <Ionicons name="close-circle" size={18} color={theme.muted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* EXPLORE HUB */}
      {mode === "explore" && (
        <FlatList
          data={filteredPosts}
          numColumns={3}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={{ gap: 6, paddingHorizontal: 12 }}
          contentContainerStyle={{ gap: 6, paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={{ marginBottom: 6 }}>
              {/* Luxury Weekly Challenge Card */}
              <TouchableOpacity onPress={() => setChallengeOpen(true)} activeOpacity={0.88} style={{ marginHorizontal: 12, marginBottom: 10 }}>
                <LinearGradient
                  colors={theme.coverGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.challengeBanner, { borderColor: theme.borderGlow }]}
                >
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "900" }}>🏆 تحدي الأسبوع في SHAHINAZ</Text>
                    <Text style={{ color: theme.text, fontSize: 13.5, fontWeight: "900", marginTop: 2, textAlign: "right" }}>
                      أجمل صورة في ولايتك — الجائزة: تاج 👑 وتوثيق رسمي!
                    </Text>
                  </View>
                  <LinearGradient colors={theme.btnGrad} style={styles.trophyMini}>
                    <Ionicons name="trophy" size={20} color={theme.btnText} />
                  </LinearGradient>
                </LinearGradient>
              </TouchableOpacity>

              {/* Luminous AI Studio Card */}
              <TouchableOpacity
                onPress={() => setAiOpen(true)}
                activeOpacity={0.88}
                style={[styles.aiBanner, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
              >
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                  <View style={[styles.aiMiniOrb, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name="sparkles" size={18} color={theme.primary} />
                  </View>
                  <View style={{ alignItems: "flex-end", flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: "900" }}>
                      استوديو SHAHINAZ AI للتجار والمبدعين ✨
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: 11 }}>
                      كاتب إعلانات 58 ولاية · أفكار ريلز · حاسبة ربح دج
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-back" size={18} color={theme.primary} />
              </TouchableOpacity>

              {/* Featured Creators Horizontal Discovery */}
              {featuredCreators.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 12, gap: 10, paddingBottom: 10 }}
                >
                  {featuredCreators.map((u) => {
                    const isFollowing = followingUserIds.includes(u.id);
                    return (
                      <View
                        key={u.id}
                        style={[styles.creatorChipCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                      >
                        {u.avatarUri ? (
                          <Image source={{ uri: u.avatarUri }} style={styles.creatorMiniAvatar} />
                        ) : (
                          <View style={[styles.creatorMiniAvatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }]}>
                            <Text style={{ fontSize: 18 }}>{u.avatarEmoji}</Text>
                          </View>
                        )}
                        <View style={{ alignItems: "flex-end", maxWidth: 92 }}>
                          <Text style={{ color: theme.text, fontSize: 11.5, fontWeight: "800" }} numberOfLines={1}>
                            {u.name}
                          </Text>
                          <Text style={{ color: theme.muted, fontSize: 10 }} numberOfLines={1}>
                            @{u.username}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={() => toggleFollowUser(u.id)}>
                          {isFollowing ? (
                            <View style={[styles.followMiniBtn, { backgroundColor: theme.surface2 }]}>
                              <Text style={{ color: theme.muted, fontSize: 10.5, fontWeight: "800" }}>متابَع</Text>
                            </View>
                          ) : (
                            <LinearGradient colors={theme.btnGrad} style={styles.followMiniBtn}>
                              <Text style={{ color: theme.btnText, fontSize: 10.5, fontWeight: "900" }}>متابعة</Text>
                            </LinearGradient>
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              {/* Trending Hashtags */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, gap: 8, paddingBottom: 6 }}
              >
                {TRENDING_TAGS.map((tag) => {
                  const active = q === tag;
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: active ? theme.primarySoft : theme.surface,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setQ(active ? "" : tag)}
                    >
                      <Text style={{ color: active ? theme.primary : theme.text, fontSize: 12, fontWeight: "700" }}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.gridTile, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setPreviewPostId(item.id)}
              activeOpacity={0.86}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.gridImg} resizeMode="cover" />
              ) : (
                <LinearGradient colors={[item.bgColor || "#7C3AED", "#0B0E17"]} style={styles.gridImg}>
                  <Text style={styles.gridTextOnly} numberOfLines={3}>
                    {item.content}
                  </Text>
                </LinearGradient>
              )}
              <View style={styles.gridCornerLike}>
                <Ionicons name="heart" size={10} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 9.5, fontWeight: "800" }}>{item.likes}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* CINEMA REELS + 58-WILAYA COD SHOP */}
      {mode === "reels" && (
        <FlatList
          data={SHOP_REELS}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20, gap: 14 }}
          renderItem={({ item }) => {
            const liked = likedReels.includes(item.id);
            const extraComments = (reelComments[item.id]?.length ?? 0) - (INITIAL_REEL_COMMENTS[item.id]?.length ?? 0);
            return (
              <View style={[styles.reelFull, { borderColor: theme.borderGlow }]}>
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <LinearGradient colors={["rgba(0,0,0,0.22)", "transparent", "rgba(5,6,11,0.94)"]} style={StyleSheet.absoluteFillObject} />

                {/* Floating Glass Vertical Action Rail */}
                <View style={styles.reelGlassRail}>
                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() =>
                      setLikedReels((prev) =>
                        prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                      )
                    }
                  >
                    <Ionicons name={liked ? "heart" : "heart-outline"} size={28} color={liked ? theme.heart : "#fff"} />
                    <Text style={styles.reelStat}>{(item.likes + (liked ? 1 : 0)).toLocaleString("fr-DZ")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() => {
                      setCommentReelId(item.id);
                      setReelCommentDraft("");
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
                    <Text style={styles.reelStat}>{item.comments + Math.max(0, extraComments)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() =>
                      Share.share({
                        message: `شاهد هذا الريل على SHAHINAZ من ${item.author}:\n${item.title}`,
                      })
                    }
                  >
                    <Ionicons name="paper-plane-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.reelFooter}>
                  <View style={styles.reelAuthorPill}>
                    <Image source={{ uri: item.avatarUri }} style={{ width: 32, height: 32, borderRadius: 12 }} />
                    <Text style={{ color: "#fff", fontWeight: "900", fontSize: 13.5 }}>{item.author}</Text>
                    <Ionicons name="checkmark-circle" size={14} color={theme.verified} />
                  </View>
                  <Text style={styles.reelCaption}>{item.title}</Text>

                  {item.priceDzd > 0 && (
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() =>
                        setCodProduct({
                          title: item.productTitle,
                          priceDzd: item.priceDzd,
                          phone: item.sellerPhone,
                        })
                      }
                      style={{ marginTop: 12, width: "100%" }}
                    >
                      <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.codCtaBtn}>
                        <Ionicons name="bag-handle" size={16} color={theme.btnText} />
                        <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>
                          اطلب الآن · {item.priceDzd.toLocaleString("fr-DZ")} دج (58 ولاية)
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* LIVE AUDIO ROOMS */}
      {mode === "rooms" && (
        <View style={{ flex: 1, paddingHorizontal: 14 }}>
          {!audioRoomsEnabled ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 }}>
              <Ionicons name="mic-off-outline" size={44} color={theme.muted} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", textAlign: "center" }}>
                الغرف الصوتية متوقفة مؤقتاً
              </Text>
              <Text style={{ color: theme.muted, fontSize: 12.5, textAlign: "center" }}>
                تم إيقاف قسم القعدات الصوتية مؤقتاً من طرف إدارة SHAHINAZ.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                activeOpacity={0.9}
                style={{ marginBottom: 12 }}
                onPress={() => {
                  const role = currentUser?.role || "USER";
                  if (!rolePermissions[role]?.canCreateAudioRoom) {
                    Alert.alert("الصلاحيات", "فتح الغرف الصوتية غير مفعّل لرتبتك الحالية من طرف الإدارة.");
                    return;
                  }
                  setNewRoomOpen(true);
                }}
              >
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sellBtn}>
                  <Ionicons name="mic" size={18} color={theme.btnText} />
                  <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13.5 }}>+ افتح غرفة صوتية مباشرة الآن</Text>
                </LinearGradient>
              </TouchableOpacity>

              <FlatList
                data={audioRooms}
                keyExtractor={(r) => r.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.roomCard, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
                    activeOpacity={0.86}
                    onPress={() => {
                      setMicOn(false);
                      setHandRaised(false);
                      setActiveRoom(item);
                    }}
                  >
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={styles.liveBadge}>
                        <View style={[styles.liveDot, { backgroundColor: theme.danger }]} />
                        <Text style={{ color: theme.danger, fontSize: 10.5, fontWeight: "900" }}>مباشر · {item.listeners} مستمع</Text>
                      </View>
                      <View style={{ backgroundColor: theme.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
                        <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "800" }}>{item.topic}</Text>
                      </View>
                    </View>
                    <Text style={[styles.roomTitle, { color: theme.text }]}>{item.title}</Text>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                        {item.speakers.map((sp, idx) => (
                          <View key={idx} style={{ alignItems: "center" }}>
                            {sp.avatarUri ? (
                              <Image
                                source={{ uri: sp.avatarUri }}
                                style={[styles.speakerSmall, sp.speaking && { borderColor: theme.success, borderWidth: 2 }]}
                              />
                            ) : (
                              <View style={[styles.speakerSmallFallback, { backgroundColor: theme.surface2 }]}>
                                <Ionicons name="person" size={16} color={theme.muted} />
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 12.5 }}>دخول للمنصة ←</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      )}

      {/* LUXURY 58-WILAYA MARKETPLACE */}
      {mode === "market" && (
        <View style={{ flex: 1, paddingHorizontal: 14 }}>
          {!marketEnabled ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 }}>
              <Ionicons name="storefront-outline" size={44} color={theme.muted} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", textAlign: "center" }}>
                السوق متوقف مؤقتاً
              </Text>
              <Text style={{ color: theme.muted, fontSize: 12.5, textAlign: "center" }}>
                تم إيقاف قسم البيع والشراء مؤقتاً من طرف إدارة SHAHINAZ.
              </Text>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 10 }}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  activeOpacity={0.9}
                  onPress={() => {
                    const role = currentUser?.role || "USER";
                    if (!addingProduct && !rolePermissions[role]?.canSellMarket) {
                      Alert.alert("الصلاحيات", "عرض المنتجات في السوق غير مفعّل لرتبتك الحالية من طرف الإدارة.");
                      return;
                    }
                    setAddingProduct((v) => !v);
                  }}
                >
                  <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sellBtn, { marginBottom: 0 }]}>
                    <Ionicons name={addingProduct ? "close" : "add-circle-outline"} size={18} color={theme.btnText} />
                    <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 12.5 }}>
                      {addingProduct ? "إغلاق" : "اعرض منتجك للبيع"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.myOrdersBtn,
                    {
                      backgroundColor: theme.surface,
                      borderColor: codOrders.length > 0 ? theme.success : theme.borderGlow,
                    },
                  ]}
                  onPress={() => setOrdersOpen(true)}
                >
                  <Ionicons name="cube-outline" size={17} color={codOrders.length > 0 ? theme.success : theme.primary} />
                  <Text style={{ color: theme.text, fontWeight: "800", fontSize: 12 }}>
                    طلباتي ({codOrders.length})
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ maxHeight: 38, marginBottom: 10 }}
                contentContainerStyle={{ gap: 7 }}
              >
                {WILAYA_FILTERS.map((w) => {
                  const active = wilayaFilter === w;
                  return (
                    <TouchableOpacity
                      key={w}
                      style={[
                        styles.tagChip,
                        {
                          backgroundColor: active ? theme.primarySoft : theme.surface,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => setWilayaFilter(w)}
                    >
                      <Text style={{ color: active ? theme.primary : theme.text, fontSize: 12, fontWeight: active ? "900" : "700" }}>
                        {w === "الكل" ? "🇩🇿 كل الولايات" : `📍 ${w}`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {addingProduct && (
                <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
                  <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="اسم المنتج" placeholderTextColor={theme.muted} value={pTitle} onChangeText={setPTitle} />
                  <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="السعر (دج)" placeholderTextColor={theme.muted} keyboardType="number-pad" value={pPrice} onChangeText={setPPrice} />
                  <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="الولاية (مثال: سطيف)" placeholderTextColor={theme.muted} value={pCity} onChangeText={setPCity} />
                  <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="رقم الهاتف (لواتساب)" placeholderTextColor={theme.muted} keyboardType="phone-pad" value={pPhone} onChangeText={setPPhone} />
                  <TouchableOpacity activeOpacity={0.9} onPress={handleAddProduct}>
                    <LinearGradient colors={theme.btnGrad} style={[styles.sellBtn, { marginBottom: 0 }]}>
                      <Text style={{ color: theme.btnText, fontWeight: "900" }}>نشر المنتج الآن</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              <FlatList
                data={filteredMarket}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <View style={[styles.marketCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    {item.imageUri && (
                      <View style={{ position: "relative" }}>
                        <Image source={{ uri: item.imageUri }} style={styles.marketImg} resizeMode="cover" />
                        <LinearGradient
                          colors={["rgba(0,0,0,0.35)", "transparent", "rgba(0,0,0,0.75)"]}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <LinearGradient colors={theme.btnGrad} style={styles.priceOverlayPill}>
                          <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 13 }}>
                            {item.priceDzd.toLocaleString("fr-DZ")} دج
                          </Text>
                        </LinearGradient>
                        <View style={styles.cityOverlayPill}>
                          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>📍 {item.city}</Text>
                        </View>
                      </View>
                    )}
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[styles.cardTitle, { color: theme.text, flex: 1 }]}>{item.title}</Text>
                        {!item.imageUri && (
                          <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 15 }}>
                            {item.priceDzd.toLocaleString("fr-DZ")} دج
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: theme.muted, fontSize: 12, textAlign: "right", marginTop: 4 }}>
                        🛍️ {item.sellerName} · 📍 {item.city} · {item.createdAt}
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.9}
                        style={{ marginTop: 12 }}
                        onPress={() =>
                          setCodProduct({
                            title: item.title,
                            priceDzd: item.priceDzd,
                            phone: item.phone,
                          })
                        }
                      >
                        <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.waBtn}>
                          <Ionicons name="bag-handle" size={16} color={theme.btnText} />
                          <Text style={{ color: theme.btnText, fontWeight: "900", fontSize: 12.5 }}>
                            اطلب الآن — الدفع عند الاستلام (58 ولاية)
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </>
          )}
        </View>
      )}

      {/* 58-Wilaya COD Order Modal */}
      <Modal visible={!!codProduct} transparent animationType="slide" onRequestClose={() => setCodProduct(null)}>
        <View style={styles.lightbox}>
          {codProduct && (
            <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>🛍️ طلب سريع — الدفع عند الاستلام</Text>
              <Text style={{ color: theme.primary, fontWeight: "800", textAlign: "right", marginBottom: 10 }}>
                {codProduct.title} · {codProduct.priceDzd.toLocaleString("fr-DZ")} دج
              </Text>
              <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="الاسم واللقب" placeholderTextColor={theme.muted} value={buyerName} onChangeText={setBuyerName} />
              <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="رقم الهاتف (مثال: 0550...)" placeholderTextColor={theme.muted} keyboardType="phone-pad" value={buyerPhone} onChangeText={setBuyerPhone} />
              <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="الولاية (58 ولاية)" placeholderTextColor={theme.muted} value={buyerWilaya} onChangeText={setBuyerWilaya} />
              <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 6 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirmCod}>
                  <LinearGradient colors={theme.btnGrad} style={[styles.sellBtn, { marginBottom: 0 }]}>
                    <Text style={{ color: theme.btnText, fontWeight: "900" }}>تأكيد الطلب ✓</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.surface2 }]} onPress={() => setCodProduct(null)}>
                  <Text style={{ color: theme.muted, fontWeight: "700" }}>إلغاء</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Live Audio Room Interactive Stage Modal */}
      <Modal visible={!!activeRoom} transparent animationType="slide" onRequestClose={() => setActiveRoom(null)}>
        <View style={styles.lightbox}>
          {activeRoom && (
            <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={styles.liveBadge}>
                  <View style={[styles.liveDot, { backgroundColor: theme.danger }]} />
                  <Text style={{ color: theme.danger, fontSize: 10.5, fontWeight: "900" }}>مباشر · {activeRoom.listeners + 1} متواجد</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveRoom(null)}>
                  <Text style={{ color: theme.danger, fontWeight: "800", fontSize: 13 }}>مغادرة الغرفة ✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.sheetTitle, { color: theme.text }]}>{activeRoom.title}</Text>

              <View style={styles.stageGrid}>
                {activeRoom.speakers.map((sp, i) => (
                  <View key={i} style={{ alignItems: "center", width: 80 }}>
                    {sp.avatarUri ? (
                      <Image
                        source={{ uri: sp.avatarUri }}
                        style={[styles.stageAvatar, sp.speaking && { borderColor: theme.success, borderWidth: 3 }]}
                      />
                    ) : (
                      <View style={[styles.stageAvatarFallback, { backgroundColor: theme.surface2 }]}>
                        <Ionicons name="person" size={28} color={theme.muted} />
                      </View>
                    )}
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: "700", marginTop: 6 }}>{sp.name}</Text>
                    <Text style={{ color: sp.speaking ? theme.success : theme.muted, fontSize: 10 }}>
                      {sp.speaking ? "🎙️ يتحدث" : "مستمع"}
                    </Text>
                  </View>
                ))}

                {currentUser && !activeRoom.speakers.some((s) => s.name === currentUser.name) && (
                  <View style={{ alignItems: "center", width: 80 }}>
                    {currentUser.avatarUri ? (
                      <Image
                        source={{ uri: currentUser.avatarUri }}
                        style={[
                          styles.stageAvatar,
                          micOn && { borderColor: theme.success, borderWidth: 3 },
                          handRaised && !micOn && { borderColor: theme.primary, borderWidth: 2 },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.stageAvatarFallback,
                          { backgroundColor: theme.surface2 },
                          micOn && { borderColor: theme.success, borderWidth: 3 },
                        ]}
                      >
                        <Ionicons name="person" size={28} color={theme.text} />
                      </View>
                    )}
                    <Text style={{ color: theme.text, fontSize: 12, fontWeight: "800", marginTop: 6 }} numberOfLines={1}>
                      أنت
                    </Text>
                    <Text style={{ color: micOn ? theme.success : handRaised ? theme.primary : theme.muted, fontSize: 10 }}>
                      {micOn ? "🎙️ تتحدث" : handRaised ? "✋ تطلب الكلمة" : "مستمع"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Real Voice Clips Stream inside Audio Room */}
              {roomVoiceClips.length > 0 && (
                <ScrollView style={{ maxHeight: 150, marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
                  {roomVoiceClips.map((clip) => (
                    <View
                      key={clip.id}
                      style={{
                        backgroundColor: theme.surface,
                        borderRadius: 14,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                    >
                      <Text style={{ color: theme.primary, fontSize: 11, fontWeight: "800", textAlign: "right" }}>
                        🎙️ {clip.user} · {clip.time}
                      </Text>
                      <VoiceMessagePlayer
                        uri={clip.audioUri}
                        durationSec={clip.durationSec}
                        accentColor={theme.primary}
                        textColor={theme.text}
                      />
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.sellBtn, { flex: 1, marginBottom: 0, backgroundColor: micOn ? theme.danger : theme.success }]}
                  onPress={handleToggleRoomMic}
                >
                  <Ionicons name={micOn ? "stop" : "mic"} size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12.5 }}>
                    {micOn ? `إرسال صوتك (0:${String(roomRecSec).padStart(2, "0")})` : "🎙️ اضغط للتحدث الآن"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sellBtn, { flex: 0.75, marginBottom: 0, backgroundColor: handRaised ? theme.primary : theme.surface2 }]}
                  onPress={() => setHandRaised((v) => !v)}
                >
                  <Text style={{ color: handRaised ? theme.btnText : theme.text, fontWeight: "800", fontSize: 12 }}>
                    {handRaised ? "✋ مرفوعة" : "✋ طلب كلمة"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Create Live Audio Room Modal */}
      <Modal visible={newRoomOpen} transparent animationType="fade" onRequestClose={() => setNewRoomOpen(false)}>
        <View style={styles.lightbox}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>🎙️ افتح غرفة صوتية جديدة</Text>
            <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="عنوان الغرفة (مثال: سهرة التجارة والعمل)" placeholderTextColor={theme.muted} value={roomTitle} onChangeText={setRoomTitle} />
            <TextInput style={[styles.input, { backgroundColor: theme.surface2, color: theme.text }]} placeholder="الموضوع (تجارة، كرة، تسلية...)" placeholderTextColor={theme.muted} value={roomTopic} onChangeText={setRoomTopic} />
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  if (!roomTitle.trim()) {
                    Alert.alert("تنبيه", "يرجى كتابة عنوان للغرفة الصوتية.");
                    return;
                  }
                  const titleClean = roomTitle.trim();
                  const topicClean = roomTopic.trim() || "دردشة مباشرة";
                  createAudioRoom(titleClean, topicClean);
                  setRoomTitle("");
                  setRoomTopic("");
                  setNewRoomOpen(false);
                  setMicOn(true);
                  setHandRaised(false);
                  setActiveRoom({
                    id: `ar_now_${Date.now()}`,
                    title: titleClean,
                    hostName: currentUser?.name || "أنت",
                    hostAvatarUri: currentUser?.avatarUri,
                    topic: topicClean,
                    listeners: 1,
                    speakers: [{ name: currentUser?.name || "أنت", avatarUri: currentUser?.avatarUri, speaking: true }],
                  });
                }}
              >
                <LinearGradient colors={theme.btnGrad} style={[styles.sellBtn, { marginBottom: 0 }]}>
                  <Text style={{ color: theme.btnText, fontWeight: "900" }}>بدء الغرفة الآن</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.surface2 }]} onPress={() => setNewRoomOpen(false)}>
                <Text style={{ color: theme.muted }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weekly Challenge Leaderboard Modal */}
      <Modal visible={challengeOpen} transparent animationType="fade" onRequestClose={() => setChallengeOpen(false)}>
        <View style={styles.lightbox}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <Text style={[styles.sheetTitle, { color: theme.text }]}>🏆 متصدرو تحدي الأسبوع</Text>
            <Text style={{ color: theme.muted, fontSize: 12, textAlign: "right", marginBottom: 14 }}>
              انشر صورة من ولايتك بهاشتاق #تحدي_الأسبوع لتربح تاج 👑 وتوثيقاً مجانياً!
            </Text>
            {LEADERBOARD.map((u) => (
              <View key={u.rank} style={[styles.leaderRow, { borderBottomColor: theme.border }]}>
                <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 16 }}>#{u.rank}</Text>
                <Image source={{ uri: u.avatarUri }} style={{ width: 42, height: 42, borderRadius: 15 }} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: theme.text, fontWeight: "800" }}>
                    {u.rank === 1 ? "👑 " : ""}
                    {u.name}
                  </Text>
                  <Text style={{ color: theme.muted, fontSize: 11 }}>{u.wilaya}</Text>
                </View>
                <Text style={{ color: theme.primary, fontWeight: "900" }}>{u.points} نقطة</Text>
              </View>
            ))}
            <TouchableOpacity activeOpacity={0.9} style={{ marginTop: 14 }} onPress={() => setChallengeOpen(false)}>
              <LinearGradient colors={theme.btnGrad} style={[styles.sellBtn, { marginBottom: 0 }]}>
                <Text style={{ color: theme.btnText, fontWeight: "900" }}>حسناً</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interactive Reel Comments Sheet */}
      <Modal visible={!!commentReelId} transparent animationType="slide" onRequestClose={() => setCommentReelId(null)}>
        <View style={styles.lightbox}>
          {commentReelId && (
            <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={[styles.sheetTitle, { color: theme.text, marginBottom: 0 }]}>💬 تعليقات الريل</Text>
                <TouchableOpacity onPress={() => setCommentReelId(null)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 240, marginBottom: 10 }}>
                {(reelComments[commentReelId] || []).map((c) => (
                  <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: theme.border }}>
                    <Text style={{ color: theme.primary, fontWeight: "800", fontSize: 12.5, textAlign: "right" }}>{c.user}</Text>
                    <Text style={{ color: theme.text, fontSize: 13, textAlign: "right", marginTop: 2 }}>{c.text}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, backgroundColor: theme.surface2, color: theme.text }]}
                  placeholder="أضف تعليقك هنا..."
                  placeholderTextColor={theme.muted}
                  value={reelCommentDraft}
                  onChangeText={setReelCommentDraft}
                />
                <TouchableOpacity
                  onPress={() => {
                    const clean = reelCommentDraft.trim();
                    if (!clean) return;
                    setReelComments((prev) => ({
                      ...prev,
                      [commentReelId]: [
                        ...(prev[commentReelId] || []),
                        { id: `rc_${Date.now()}`, user: currentUser?.name || "أنت", text: clean },
                      ],
                    }));
                    setReelCommentDraft("");
                  }}
                >
                  <LinearGradient colors={theme.btnGrad} style={[styles.sellBtn, { marginBottom: 0, paddingHorizontal: 16 }]}>
                    <Text style={{ color: theme.btnText, fontWeight: "900" }}>نشر</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Grid Photo Lightbox Modal */}
      <Modal visible={!!previewPost} transparent animationType="fade" onRequestClose={() => setPreviewPostId(null)}>
        <View style={styles.lightbox}>
          {previewPost && (
            <View style={[styles.lightboxCard, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", padding: 14 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{previewPost.author.name}</Text>
                <TouchableOpacity onPress={() => setPreviewPostId(null)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              {previewPost.imageUri && <Image source={{ uri: previewPost.imageUri }} style={styles.lightboxImg} />}
              <View style={{ padding: 14 }}>
                <Text style={{ color: theme.text, fontSize: 13.5, textAlign: "right", lineHeight: 20 }}>{previewPost.content}</Text>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 16 }}>
                    <TouchableOpacity
                      style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}
                      onPress={() => toggleLike(previewPost.id)}
                    >
                      <Ionicons
                        name={previewPost.likedByMe ? "heart" : "heart-outline"}
                        size={22}
                        color={previewPost.likedByMe ? theme.heart : theme.text}
                      />
                      <Text style={{ color: theme.text, fontWeight: "800" }}>{previewPost.likes} إعجاب</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Share.share({ message: `${previewPost.author.name} على SHAHINAZ:\n${previewPost.content}` })}
                    >
                      <Ionicons name="paper-plane-outline" size={21} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(previewPost.id)}>
                    <Ionicons
                      name={previewPost.savedByMe ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color={previewPost.savedByMe ? theme.primary : theme.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* My 58-Wilaya COD Orders Tracker Modal */}
      <Modal visible={ordersOpen} transparent animationType="slide" onRequestClose={() => setOrdersOpen(false)}>
        <View style={styles.lightbox}>
          <View style={[styles.modalSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow, maxHeight: "82%" }]}>
            <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={[styles.sheetTitle, { color: theme.text, marginBottom: 0 }]}>📦 تتبع طلباتي (58 ولاية)</Text>
              <TouchableOpacity onPress={() => setOrdersOpen(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {codOrders.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 28, gap: 8 }}>
                <Ionicons name="cube-outline" size={44} color={theme.primary} />
                <Text style={{ color: theme.text, fontWeight: "900", fontSize: 15 }}>لا توجد طلبات حالياً</Text>
                <Text style={{ color: theme.muted, fontSize: 12.5, textAlign: "center", lineHeight: 19 }}>
                  عند طلب أي منتج من السوق أو ريلز التسوق بنظام الدفع عند الاستلام (COD)، سيظهر هنا مع تتبع التوصيل المباشر.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 8 }}>
                {codOrders.map((ord, idx) => (
                  <View
                    key={ord.id}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: 18,
                      padding: 13,
                      borderWidth: 1,
                      borderColor: theme.border,
                      gap: 8,
                    }}
                  >
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ color: theme.text, fontWeight: "900", fontSize: 13.5, flex: 1, textAlign: "right" }}>
                        {ord.productTitle}
                      </Text>
                      <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 13 }}>
                        {ord.priceDzd.toLocaleString("fr-DZ")} دج
                      </Text>
                    </View>
                    <Text style={{ color: theme.muted, fontSize: 11.5, textAlign: "right" }}>
                      👤 {ord.buyerName} · 📍 {ord.wilaya} · 📞 {ord.phone}
                    </Text>

                    <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.success, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="checkmark" size={14} color="#fff" />
                        </View>
                        <Text style={{ color: theme.success, fontSize: 10, fontWeight: "800", marginTop: 3 }}>تم التأكيد</Text>
                      </View>
                      <View style={{ height: 2, flex: 0.6, backgroundColor: theme.success }} />
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="cube" size={12} color={theme.btnText} />
                        </View>
                        <Text style={{ color: theme.primary, fontSize: 10, fontWeight: "800", marginTop: 3 }}>قيد التجهيز</Text>
                      </View>
                      <View style={{ height: 2, flex: 0.6, backgroundColor: idx > 0 ? theme.warn : theme.border }} />
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <View
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 11,
                            backgroundColor: idx > 0 ? theme.warn : theme.surface2,
                            borderWidth: 1,
                            borderColor: idx > 0 ? theme.warn : theme.border,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="car-outline" size={13} color={idx > 0 ? "#000" : theme.muted} />
                        </View>
                        <Text style={{ color: idx > 0 ? theme.warn : theme.muted, fontSize: 10, fontWeight: "700", marginTop: 3 }}>
                          التوصيل للولاية
                        </Text>
                      </View>
                    </View>
                    <Text style={{ color: theme.muted, fontSize: 10.5, textAlign: "left" }}>🕒 {ord.createdAt} · الدفع عند الاستلام</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ShahinazAiModal visible={aiOpen} onClose={() => setAiOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topTabsCapsule: {
    flexDirection: "row-reverse",
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 10,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  tabTouch: { flex: 1, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tabActiveGrad: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 14 },
  searchWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13.5, textAlign: "right" },
  challengeBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
  },
  trophyMini: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aiBanner: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  aiMiniOrb: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  creatorChipCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
  },
  creatorMiniAvatar: { width: 38, height: 38, borderRadius: 14 },
  followMiniBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 11 },
  tagChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 7,
    justifyContent: "center",
  },
  gridTile: {
    width: GRID_SIZE,
    height: GRID_SIZE * 1.15,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.8,
    position: "relative",
  },
  gridImg: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 8 },
  gridTextOnly: { color: "#fff", fontSize: 11, fontWeight: "800", textAlign: "center" },
  gridCornerLike: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  reelFull: {
    height: 540,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#0a0c12",
    justifyContent: "flex-end",
    borderWidth: 1,
  },
  reelGlassRail: {
    position: "absolute",
    left: 12,
    bottom: 92,
    backgroundColor: "rgba(8,10,18,0.62)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 16,
  },
  reelActionBtn: { alignItems: "center", gap: 4 },
  reelStat: { color: "#fff", fontSize: 11.5, fontWeight: "800" },
  reelFooter: { padding: 16, alignItems: "flex-end" },
  reelAuthorPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(8,10,18,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 8,
  },
  reelCaption: { color: "#fff", fontSize: 14, fontWeight: "700", textAlign: "right", lineHeight: 21, paddingLeft: 58 },
  codCtaBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  roomCard: { borderRadius: 22, padding: 16, borderWidth: 1 },
  liveBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5 },
  roomTitle: { fontSize: 16, fontWeight: "900", textAlign: "right", marginTop: 10 },
  speakerSmall: { width: 40, height: 40, borderRadius: 14 },
  speakerSmallFallback: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stageGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 12 },
  stageAvatar: { width: 64, height: 64, borderRadius: 22 },
  stageAvatarFallback: { width: 64, height: 64, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontWeight: "900", fontSize: 14.5, textAlign: "right" },
  sellBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
  },
  myOrdersBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 13,
    justifyContent: "center",
  },
  cancelBtn: { borderRadius: 14, paddingHorizontal: 16, justifyContent: "center" },
  formCard: { padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  input: { borderRadius: 13, padding: 11, textAlign: "right", marginBottom: 8 },
  marketCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1 },
  marketImg: { width: "100%", height: 205 },
  priceOverlayPill: {
    position: "absolute",
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cityOverlayPill: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(5,6,11,0.68)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  waBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    borderRadius: 14,
    paddingVertical: 11,
  },
  lightbox: { flex: 1, backgroundColor: "rgba(0,0,0,0.84)", justifyContent: "center", padding: 18 },
  lightboxCard: { borderRadius: 24, overflow: "hidden", borderWidth: 1 },
  lightboxImg: { width: "100%", height: 320 },
  modalSheet: { borderRadius: 26, padding: 18, borderWidth: 1 },
  sheetTitle: { fontSize: 17, fontWeight: "900", textAlign: "right", marginBottom: 10 },
  leaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
});
