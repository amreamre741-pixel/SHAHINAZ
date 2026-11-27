import React, { useMemo, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { AudioRoom } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

const TRENDING_TAGS = ["#الجزائر", "#تحدي_الأسبوع", "#SHAHINAZ", "#وهران", "#تجارة"];

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
    posts,
    marketItems,
    audioRooms,
    marketEnabled,
    audioRoomsEnabled,
    rolePermissions,
    addMarketItem,
    createAudioRoom,
    placeCodOrder,
    toggleLike,
    toggleSave,
  } = useApp();

  const [mode, setMode] = useState<"explore" | "reels" | "rooms" | "market">("explore");
  const [q, setQ] = useState("");
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [reelComments, setReelComments] = useState(INITIAL_REEL_COMMENTS);
  const [commentReelId, setCommentReelId] = useState<string | null>(null);
  const [reelCommentDraft, setReelCommentDraft] = useState("");

  const previewPost = useMemo(
    () => posts.find((p) => p.id === previewPostId) || null,
    [posts, previewPostId]
  );

  // Weekly Challenge modal
  const [challengeOpen, setChallengeOpen] = useState(false);

  // TikTok Shop COD Order Sheet
  const [codProduct, setCodProduct] = useState<{ title: string; priceDzd: number; phone: string } | null>(null);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerWilaya, setBuyerWilaya] = useState("16 - الجزائر العاصمة");

  // Live Audio Room Stage
  const [activeRoom, setActiveRoom] = useState<AudioRoom | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [newRoomOpen, setNewRoomOpen] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomTopic, setRoomTopic] = useState("");

  // Marketplace add form
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

  const filteredMarket = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return marketItems;
    return marketItems.filter((m) => m.title.toLowerCase().includes(s) || m.city.toLowerCase().includes(s));
  }, [marketItems, q]);

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
    <View style={styles.container}>
      {/* Sleek Segmented Top Tabs */}
      <View style={styles.topTabs}>
        {[
          { key: "explore", label: "استكشاف" },
          { key: "reels", label: "ريلز تسوّق" },
          { key: "rooms", label: "🎙️ صوتي" },
          { key: "market", label: "السوق" },
        ].map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabPill, mode === t.key && styles.tabPillActive]}
            onPress={() => setMode(t.key as any)}
          >
            <Text style={[styles.tabPillText, mode === t.key && styles.tabPillTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode !== "reels" && mode !== "rooms" && (
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder={mode === "market" ? "ابحث عن منتج أو ولاية..." : "ابحث في SHAHINAZ..."}
            placeholderTextColor={COLORS.muted}
            value={q}
            onChangeText={setQ}
          />
        </View>
      )}

      {/* EXPLORE: Weekly Challenge Banner + Instagram 3-Column Photo Grid */}
      {mode === "explore" && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={() => setChallengeOpen(true)} activeOpacity={0.85} style={{ marginHorizontal: 12, marginBottom: 10 }}>
            <LinearGradient colors={["#6d28d9", "#db2777"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.challengeBanner}>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={{ color: "#fde68a", fontSize: 11, fontWeight: "800" }}>🏆 تحدي الأسبوع في SHAHINAZ</Text>
                <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "800", marginTop: 2 }}>
                  أجمل صورة في ولايتك — الجائزة: تاج ذهبي 👑 وتوثيق!
                </Text>
              </View>
              <Ionicons name="trophy" size={26} color="#fde68a" />
            </LinearGradient>
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxHeight: 40, marginBottom: 8 }}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          >
            {TRENDING_TAGS.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[styles.tagChip, q === tag && { borderColor: COLORS.primary, backgroundColor: "rgba(168,85,247,0.16)" }]}
                onPress={() => setQ(q === tag ? "" : tag)}
              >
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredPosts}
            numColumns={3}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={{ gap: 2 }}
            contentContainerStyle={{ gap: 2 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.gridTile} onPress={() => setPreviewPostId(item.id)}>
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.gridImg} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={[item.bgColor || "#6d28d9", "#111827"]} style={styles.gridImg}>
                    <Text style={styles.gridTextOnly} numberOfLines={3}>
                      {item.content}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* REELS + TIKTOK SHOP (58 WILAYA COD ORDER) */}
      {mode === "reels" && (
        <FlatList
          data={SHOP_REELS}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20, gap: 12 }}
          renderItem={({ item }) => {
            const liked = likedReels.includes(item.id);
            const extraComments = (reelComments[item.id]?.length ?? 0) - (INITIAL_REEL_COMMENTS[item.id]?.length ?? 0);
            return (
              <View style={styles.reelFull}>
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <LinearGradient colors={["transparent", "rgba(0,0,0,0.88)"]} style={StyleSheet.absoluteFillObject} />

                <View style={styles.reelActions}>
                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() =>
                      setLikedReels((prev) =>
                        prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]
                      )
                    }
                  >
                    <Ionicons name={liked ? "heart" : "heart-outline"} size={30} color={liked ? COLORS.heart : "#fff"} />
                    <Text style={styles.reelStat}>{(item.likes + (liked ? 1 : 0)).toLocaleString("fr-DZ")}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reelActionBtn}
                    onPress={() => {
                      setCommentReelId(item.id);
                      setReelCommentDraft("");
                    }}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
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
                    <Ionicons name="paper-plane-outline" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <View style={styles.reelFooter}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Image source={{ uri: item.avatarUri }} style={{ width: 34, height: 34, borderRadius: 17 }} />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{item.author}</Text>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />
                  </View>
                  <Text style={styles.reelCaption}>{item.title}</Text>

                  {item.priceDzd > 0 && (
                    <TouchableOpacity
                      style={styles.codCtaBtn}
                      onPress={() =>
                        setCodProduct({
                          title: item.productTitle,
                          priceDzd: item.priceDzd,
                          phone: item.sellerPhone,
                        })
                      }
                    >
                      <Ionicons name="bag-handle" size={16} color="#fff" />
                      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
                        اطلب الآن · {item.priceDzd.toLocaleString("fr-DZ")} دج (توصيل 58 ولاية)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* LIVE AUDIO ROOMS (غرف القعدة الصوتية) */}
      {mode === "rooms" && (
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          {!audioRoomsEnabled ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 }}>
              <Ionicons name="mic-off-outline" size={44} color={COLORS.muted} />
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "800", textAlign: "center" }}>
                الغرف الصوتية متوقفة مؤقتاً
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12.5, textAlign: "center" }}>
                تم إيقاف قسم القعدات الصوتية مؤقتاً من طرف إدارة SHAHINAZ.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.sellBtn}
                onPress={() => {
                  const role = currentUser?.role || "USER";
                  if (!rolePermissions[role]?.canCreateAudioRoom) {
                    Alert.alert("الصلاحيات", "فتح الغرف الصوتية غير مفعّل لرتبتك الحالية من طرف الإدارة.");
                    return;
                  }
                  setNewRoomOpen(true);
                }}
              >
                <Ionicons name="mic" size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>+ افتح غرفة صوتية مباشرة الآن</Text>
              </TouchableOpacity>

              <FlatList
                data={audioRooms}
                keyExtractor={(r) => r.id}
                contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.roomCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setMicOn(false);
                      setHandRaised(false);
                      setActiveRoom(item);
                    }}
                  >
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>مباشر · {item.listeners} مستمع</Text>
                      </View>
                      <Text style={{ color: COLORS.primary, fontSize: 11, fontWeight: "700" }}>{item.topic}</Text>
                    </View>
                    <Text style={styles.roomTitle}>{item.title}</Text>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
                      <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                        {item.speakers.map((sp, idx) => (
                          <View key={idx} style={{ alignItems: "center" }}>
                            {sp.avatarUri ? (
                              <Image
                                source={{ uri: sp.avatarUri }}
                                style={[styles.speakerSmall, sp.speaking && { borderColor: COLORS.success, borderWidth: 2 }]}
                              />
                            ) : (
                              <View style={styles.speakerSmallFallback}>
                                <Ionicons name="person" size={16} color={COLORS.muted} />
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text style={{ color: COLORS.verified, fontWeight: "700", fontSize: 12 }}>دخول للاستماع ←</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </>
          )}
        </View>
      )}

      {/* MARKETPLACE */}
      {mode === "market" && (
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          {!marketEnabled ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 24 }}>
              <Ionicons name="storefront-outline" size={44} color={COLORS.muted} />
              <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "800", textAlign: "center" }}>
                السوق متوقف مؤقتاً
              </Text>
              <Text style={{ color: COLORS.muted, fontSize: 12.5, textAlign: "center" }}>
                تم إيقاف قسم البيع والشراء مؤقتاً من طرف إدارة SHAHINAZ.
              </Text>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.sellBtn}
                onPress={() => {
                  const role = currentUser?.role || "USER";
                  if (!addingProduct && !rolePermissions[role]?.canSellMarket) {
                    Alert.alert("الصلاحيات", "عرض المنتجات في السوق غير مفعّل لرتبتك الحالية من طرف الإدارة.");
                    return;
                  }
                  setAddingProduct((v) => !v);
                }}
              >
                <Ionicons name={addingProduct ? "close" : "add-circle-outline"} size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
                  {addingProduct ? "إغلاق" : "اعرض منتجك للبيع مجاناً"}
                </Text>
              </TouchableOpacity>

              {addingProduct && (
                <View style={styles.formCard}>
                  <TextInput style={styles.input} placeholder="اسم المنتج" placeholderTextColor={COLORS.muted} value={pTitle} onChangeText={setPTitle} />
                  <TextInput style={styles.input} placeholder="السعر (دج)" placeholderTextColor={COLORS.muted} keyboardType="number-pad" value={pPrice} onChangeText={setPPrice} />
                  <TextInput style={styles.input} placeholder="الولاية (مثال: سطيف)" placeholderTextColor={COLORS.muted} value={pCity} onChangeText={setPCity} />
                  <TextInput style={styles.input} placeholder="رقم الهاتف (لواتساب)" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" value={pPhone} onChangeText={setPPhone} />
                  <TouchableOpacity style={styles.sellBtn} onPress={handleAddProduct}>
                    <Text style={{ color: "#fff", fontWeight: "700" }}>نشر المنتج الآن</Text>
                  </TouchableOpacity>
                </View>
              )}

          <FlatList
            data={filteredMarket}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: 12, paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={styles.marketCard}>
                {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.marketImg} resizeMode="cover" />}
                <View style={{ padding: 12 }}>
                  <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={{ color: COLORS.success, fontWeight: "800", fontSize: 15 }}>
                      {item.priceDzd.toLocaleString("fr-DZ")} دج
                    </Text>
                  </View>
                  <Text style={styles.cardSub}>
                    📍 {item.city} · {item.sellerName} · {item.createdAt}
                  </Text>
                  <TouchableOpacity
                    style={styles.waBtn}
                    onPress={() =>
                      setCodProduct({
                        title: item.title,
                        priceDzd: item.priceDzd,
                        phone: item.phone,
                      })
                    }
                  >
                    <Ionicons name="bag-handle-outline" size={16} color="#fff" />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>اطلب الآن — الدفع عند الاستلام</Text>
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
            <View style={styles.modalSheet}>
              <Text style={styles.sheetTitle}>🛍️ طلب سريع — الدفع عند الاستلام</Text>
              <Text style={{ color: COLORS.primary, fontWeight: "700", textAlign: "right", marginBottom: 10 }}>
                {codProduct.title} · {codProduct.priceDzd.toLocaleString("fr-DZ")} دج
              </Text>
              <TextInput style={styles.input} placeholder="الاسم واللقب" placeholderTextColor={COLORS.muted} value={buyerName} onChangeText={setBuyerName} />
              <TextInput style={styles.input} placeholder="رقم الهاتف (مثال: 0550...)" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" value={buyerPhone} onChangeText={setBuyerPhone} />
              <TextInput style={styles.input} placeholder="الولاية (58 ولاية)" placeholderTextColor={COLORS.muted} value={buyerWilaya} onChangeText={setBuyerWilaya} />
              <View style={{ flexDirection: "row-reverse", gap: 8, marginTop: 6 }}>
                <TouchableOpacity style={[styles.sellBtn, { flex: 1, marginBottom: 0 }]} onPress={handleConfirmCod}>
                  <Text style={{ color: "#fff", fontWeight: "800" }}>تأكيد الطلب ✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setCodProduct(null)}>
                  <Text style={{ color: COLORS.muted, fontWeight: "700" }}>إلغاء</Text>
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
            <View style={styles.modalSheet}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>مباشر · {activeRoom.listeners + 1} متواجد</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveRoom(null)}>
                  <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 13 }}>مغادرة الغرفة ✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.sheetTitle}>{activeRoom.title}</Text>

              <View style={styles.stageGrid}>
                {activeRoom.speakers.map((sp, i) => (
                  <View key={i} style={{ alignItems: "center", width: 80 }}>
                    {sp.avatarUri ? (
                      <Image
                        source={{ uri: sp.avatarUri }}
                        style={[styles.stageAvatar, sp.speaking && { borderColor: COLORS.success, borderWidth: 3 }]}
                      />
                    ) : (
                      <View style={styles.stageAvatarFallback}>
                        <Ionicons name="person" size={28} color={COLORS.muted} />
                      </View>
                    )}
                    <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "600", marginTop: 6 }}>{sp.name}</Text>
                    <Text style={{ color: sp.speaking ? COLORS.success : COLORS.muted, fontSize: 10 }}>
                      {sp.speaking ? "🎙️ يتحدث" : "مستمع"}
                    </Text>
                  </View>
                ))}

                {/* Current User Live on Stage */}
                {currentUser && !activeRoom.speakers.some((s) => s.name === currentUser.name) && (
                  <View style={{ alignItems: "center", width: 80 }}>
                    {currentUser.avatarUri ? (
                      <Image
                        source={{ uri: currentUser.avatarUri }}
                        style={[
                          styles.stageAvatar,
                          micOn && { borderColor: COLORS.success, borderWidth: 3 },
                          handRaised && !micOn && { borderColor: COLORS.warn, borderWidth: 2 },
                        ]}
                      />
                    ) : (
                      <View
                        style={[
                          styles.stageAvatarFallback,
                          micOn && { borderColor: COLORS.success, borderWidth: 3 },
                        ]}
                      >
                        <Ionicons name="person" size={28} color="#fff" />
                      </View>
                    )}
                    <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "700", marginTop: 6 }} numberOfLines={1}>
                      أنت
                    </Text>
                    <Text style={{ color: micOn ? COLORS.success : handRaised ? COLORS.warn : COLORS.muted, fontSize: 10 }}>
                      {micOn ? "🎙️ تتحدث" : handRaised ? "✋ تطلب الكلمة" : "مستمع"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: "row-reverse", gap: 10, marginTop: 18 }}>
                <TouchableOpacity
                  style={[styles.sellBtn, { flex: 1, marginBottom: 0, backgroundColor: micOn ? COLORS.success : COLORS.surface2 }]}
                  onPress={() => setMicOn((v) => !v)}
                >
                  <Ionicons name={micOn ? "mic" : "mic-off"} size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{micOn ? "الميكروفون مفتوح" : "كتم الصوت"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sellBtn, { flex: 1, marginBottom: 0, backgroundColor: handRaised ? COLORS.warn : COLORS.surface2 }]}
                  onPress={() => setHandRaised((v) => !v)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>{handRaised ? "✋ يدك مرفوعة" : "✋ اطلب الكلمة"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Create Live Audio Room Modal */}
      <Modal visible={newRoomOpen} transparent animationType="fade" onRequestClose={() => setNewRoomOpen(false)}>
        <View style={styles.lightbox}>
          <View style={styles.modalSheet}>
            <Text style={styles.sheetTitle}>🎙️ افتح غرفة صوتية جديدة</Text>
            <TextInput style={styles.input} placeholder="عنوان الغرفة (مثال: سهرة التجارة والعمل)" placeholderTextColor={COLORS.muted} value={roomTitle} onChangeText={setRoomTitle} />
            <TextInput style={styles.input} placeholder="الموضوع (تجارة، كرة، تسلية...)" placeholderTextColor={COLORS.muted} value={roomTopic} onChangeText={setRoomTopic} />
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity
                style={[styles.sellBtn, { flex: 1, marginBottom: 0 }]}
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
                <Text style={{ color: "#fff", fontWeight: "700" }}>بدء الغرفة الآن</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewRoomOpen(false)}>
                <Text style={{ color: COLORS.muted }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Weekly Challenge & Top 3 Leaderboard Modal */}
      <Modal visible={challengeOpen} transparent animationType="fade" onRequestClose={() => setChallengeOpen(false)}>
        <View style={styles.lightbox}>
          <View style={styles.modalSheet}>
            <Text style={styles.sheetTitle}>🏆 متصدرو تحدي الأسبوع</Text>
            <Text style={{ color: COLORS.muted, fontSize: 12, textAlign: "right", marginBottom: 14 }}>
              انشر صورة من ولايتك بهاشتاق #تحدي_الأسبوع لتربح تاج 👑 وتوثيقاً مجانياً!
            </Text>
            {LEADERBOARD.map((u) => (
              <View key={u.rank} style={styles.leaderRow}>
                <Text style={{ color: COLORS.warn, fontWeight: "800", fontSize: 16 }}>#{u.rank}</Text>
                <Image source={{ uri: u.avatarUri }} style={{ width: 42, height: 42, borderRadius: 21 }} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: COLORS.text, fontWeight: "700" }}>
                    {u.rank === 1 ? "👑 " : ""}
                    {u.name}
                  </Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{u.wilaya}</Text>
                </View>
                <Text style={{ color: COLORS.primary, fontWeight: "800" }}>{u.points} نقطة</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.sellBtn, { marginTop: 12, marginBottom: 0 }]} onPress={() => setChallengeOpen(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>حسناً</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Interactive Reel Comments Sheet Modal */}
      <Modal visible={!!commentReelId} transparent animationType="slide" onRequestClose={() => setCommentReelId(null)}>
        <View style={styles.lightbox}>
          {commentReelId && (
            <View style={styles.modalSheet}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Text style={styles.sheetTitle}>💬 تعليقات الريل</Text>
                <TouchableOpacity onPress={() => setCommentReelId(null)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 240, marginBottom: 10 }}>
                {(reelComments[commentReelId] || []).map((c) => (
                  <View key={c.id} style={{ paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: COLORS.border }}>
                    <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 12.5, textAlign: "right" }}>{c.user}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: "right", marginTop: 2 }}>{c.text}</Text>
                  </View>
                ))}
              </ScrollView>
              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="أضف تعليقاً..."
                  placeholderTextColor={COLORS.muted}
                  value={reelCommentDraft}
                  onChangeText={setReelCommentDraft}
                />
                <TouchableOpacity
                  style={[styles.sellBtn, { marginBottom: 0, paddingHorizontal: 16 }]}
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
                  <Text style={{ color: "#fff", fontWeight: "700" }}>نشر</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Grid Photo Lightbox Modal (Live State!) */}
      <Modal visible={!!previewPost} transparent animationType="fade" onRequestClose={() => setPreviewPostId(null)}>
        <View style={styles.lightbox}>
          {previewPost && (
            <View style={styles.lightboxCard}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", padding: 12 }}>
                <Text style={styles.cardTitle}>{previewPost.author.name}</Text>
                <TouchableOpacity onPress={() => setPreviewPostId(null)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              {previewPost.imageUri && <Image source={{ uri: previewPost.imageUri }} style={styles.lightboxImg} />}
              <View style={{ padding: 14 }}>
                <Text style={{ color: COLORS.text, fontSize: 13, textAlign: "right" }}>{previewPost.content}</Text>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 16 }}>
                    <TouchableOpacity
                      style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}
                      onPress={() => toggleLike(previewPost.id)}
                    >
                      <Ionicons
                        name={previewPost.likedByMe ? "heart" : "heart-outline"}
                        size={22}
                        color={previewPost.likedByMe ? COLORS.heart : COLORS.text}
                      />
                      <Text style={{ color: COLORS.text, fontWeight: "700" }}>{previewPost.likes} إعجاب</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        Share.share({ message: `${previewPost.author.name} على SHAHINAZ:\n${previewPost.content}` })
                      }
                    >
                      <Ionicons name="paper-plane-outline" size={21} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity onPress={() => toggleSave(previewPost.id)}>
                    <Ionicons
                      name={previewPost.savedByMe ? "bookmark" : "bookmark-outline"}
                      size={22}
                      color={COLORS.text}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topTabs: { flexDirection: "row-reverse", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, gap: 6 },
  tabPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  tabPillActive: { backgroundColor: COLORS.text, borderColor: COLORS.text },
  tabPillText: { color: COLORS.muted, fontSize: 11.5, fontWeight: "700" },
  tabPillTextActive: { color: "#000000" },
  searchWrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface2,
    marginHorizontal: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  searchInput: { flex: 1, color: COLORS.text, paddingVertical: 9, fontSize: 13.5, textAlign: "right" },
  challengeBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  tagChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  tagText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  gridTile: { width: GRID_SIZE, height: GRID_SIZE, backgroundColor: COLORS.surface },
  gridImg: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 8 },
  gridTextOnly: { color: "#fff", fontSize: 11, fontWeight: "700", textAlign: "center" },
  reelFull: { height: 530, borderRadius: 20, overflow: "hidden", backgroundColor: COLORS.surface, justifyContent: "flex-end" },
  reelActions: { position: "absolute", left: 14, bottom: 32, alignItems: "center", gap: 18 },
  reelActionBtn: { alignItems: "center", gap: 4 },
  reelStat: { color: "#fff", fontSize: 12, fontWeight: "700" },
  reelFooter: { padding: 16, paddingLeft: 64, alignItems: "flex-end" },
  reelCaption: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "right", lineHeight: 21 },
  codCtaBtn: {
    marginTop: 12,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  roomCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  liveBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.danger },
  roomTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", textAlign: "right", marginTop: 10 },
  speakerSmall: { width: 38, height: 38, borderRadius: 19 },
  speakerSmallFallback: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.surface2, alignItems: "center", justifyContent: "center" },
  stageGrid: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 12 },
  stageAvatar: { width: 64, height: 64, borderRadius: 32 },
  stageAvatarFallback: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.surface2, alignItems: "center", justifyContent: "center" },
  cardTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14, textAlign: "right" },
  cardSub: { color: COLORS.muted, fontSize: 12, textAlign: "right", marginTop: 3 },
  sellBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cancelBtn: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  formCard: { backgroundColor: COLORS.surface, padding: 12, borderRadius: 14, marginBottom: 12, borderWidth: 0.5, borderColor: COLORS.border },
  input: { backgroundColor: COLORS.surface2, borderRadius: 10, padding: 11, color: COLORS.text, textAlign: "right", marginBottom: 8 },
  marketCard: { backgroundColor: COLORS.surface, borderRadius: 16, overflow: "hidden", borderWidth: 0.5, borderColor: COLORS.border },
  marketImg: { width: "100%", height: 190 },
  waBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#16a34a",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  lightbox: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 18 },
  lightboxCard: { backgroundColor: COLORS.surface, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: COLORS.border },
  lightboxImg: { width: "100%", height: 320 },
  modalSheet: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, borderWidth: 0.5, borderColor: COLORS.border },
  sheetTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800", textAlign: "right", marginBottom: 10 },
  leaderRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
});
