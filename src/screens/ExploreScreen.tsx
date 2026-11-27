import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
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
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { Post } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SIZE = (SCREEN_WIDTH - 4) / 3;

const TRENDING_TAGS = ["#الجزائر", "#SHAHINAZ", "#وهران", "#تجارة", "#تقنية"];

const DEMO_REELS = [
  {
    id: "r_1",
    author: "ياسين بن علي",
    avatarUri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=900&q=85",
    title: "جولة ليلية ساحرة تحت النجوم في الجزائر 🇩🇿✨",
    likes: 4280,
    comments: 142,
  },
  {
    id: "r_2",
    author: "سارة منصوري",
    avatarUri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=85",
    title: "أجمل شواطئ وهران الصافية هذا الصباح 🌊☀️",
    likes: 8920,
    comments: 318,
  },
  {
    id: "r_3",
    author: "كريم تكنولوجي",
    avatarUri: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    imageUri: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=85",
    title: "كيف تبدأ مشروعك الرقمي في الجزائر بأقل تكلفة 🚀💻",
    likes: 12500,
    comments: 510,
  },
];

export default function ExploreScreen() {
  const { posts, marketItems, groups, addMarketItem, toggleJoinGroup, toggleLike } = useApp();
  const [mode, setMode] = useState<"explore" | "reels" | "groups" | "market">("explore");
  const [q, setQ] = useState("");
  const [likedReels, setLikedReels] = useState<string[]>([]);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
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
          { key: "reels", label: "ريلز" },
          { key: "groups", label: "مجموعات" },
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

      {mode !== "reels" && (
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

      {/* EXPLORE: Instagram 3-Column Photo Grid */}
      {mode === "explore" && (
        <View style={{ flex: 1 }}>
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
              <TouchableOpacity style={styles.gridTile} onPress={() => setPreviewPost(item)}>
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

      {/* REELS: Full-Screen Immersive TikTok/Instagram Style */}
      {mode === "reels" && (
        <FlatList
          data={DEMO_REELS}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 20, gap: 12 }}
          renderItem={({ item }) => {
            const liked = likedReels.includes(item.id);
            return (
              <View style={styles.reelFull}>
                <Image source={{ uri: item.imageUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.85)"]}
                  style={StyleSheet.absoluteFillObject}
                />
                {/* Floating Left Action Column */}
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
                  <View style={styles.reelActionBtn}>
                    <Ionicons name="chatbubble-ellipses-outline" size={28} color="#fff" />
                    <Text style={styles.reelStat}>{item.comments}</Text>
                  </View>
                  <View style={styles.reelActionBtn}>
                    <Ionicons name="paper-plane-outline" size={26} color="#fff" />
                  </View>
                </View>

                {/* Bottom Author & Caption */}
                <View style={styles.reelFooter}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Image source={{ uri: item.avatarUri }} style={{ width: 34, height: 34, borderRadius: 17 }} />
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>{item.author}</Text>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />
                  </View>
                  <Text style={styles.reelCaption}>{item.title}</Text>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* GROUPS */}
      {mode === "groups" && (
        <FlatList
          data={groups}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.darkRowCard}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 12, flex: 1 }}>
                <View style={styles.groupBadge}>
                  <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
                </View>
                <View style={{ alignItems: "flex-end", flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.members.toLocaleString("fr-DZ")} عضو</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.joinBtn, item.joined && styles.joinedBtn]}
                onPress={() => toggleJoinGroup(item.id)}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                  {item.joined ? "منضم ✓" : "انضمام"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* MARKETPLACE */}
      {mode === "market" && (
        <View style={{ flex: 1, paddingHorizontal: 12 }}>
          <TouchableOpacity style={styles.sellBtn} onPress={() => setAddingProduct((v) => !v)}>
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
                  {!!item.phone && (
                    <TouchableOpacity
                      style={styles.waBtn}
                      onPress={() => {
                        const d = item.phone.replace(/\D/g, "");
                        const intl = d.startsWith("0") ? `213${d.slice(1)}` : d;
                        Linking.openURL(`https://wa.me/${intl}?text=${encodeURIComponent(`مرحباً، أنا مهتم بـ ${item.title} في SHAHINAZ`)}`);
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>تواصل عبر واتساب</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Grid Photo Lightbox Modal */}
      <Modal visible={!!previewPost} transparent animationType="fade" onRequestClose={() => setPreviewPost(null)}>
        <TouchableOpacity style={styles.lightbox} activeOpacity={1} onPress={() => setPreviewPost(null)}>
          {previewPost && (
            <View style={styles.lightboxCard}>
              {previewPost.imageUri && <Image source={{ uri: previewPost.imageUri }} style={styles.lightboxImg} />}
              <View style={{ padding: 14 }}>
                <Text style={styles.cardTitle}>{previewPost.author.name}</Text>
                <Text style={{ color: COLORS.text, fontSize: 13, textAlign: "right", marginTop: 4 }}>{previewPost.content}</Text>
                <TouchableOpacity
                  style={{ flexDirection: "row-reverse", alignItems: "center", gap: 6, marginTop: 10 }}
                  onPress={() => toggleLike(previewPost.id)}
                >
                  <Ionicons name="heart" size={20} color={COLORS.heart} />
                  <Text style={{ color: COLORS.text, fontWeight: "700" }}>{previewPost.likes} إعجاب</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topTabs: {
    flexDirection: "row-reverse",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
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
  tabPillText: { color: COLORS.muted, fontSize: 12, fontWeight: "700" },
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
  reelFull: {
    height: 520,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    justifyContent: "flex-end",
  },
  reelActions: { position: "absolute", left: 14, bottom: 26, alignItems: "center", gap: 18 },
  reelActionBtn: { alignItems: "center", gap: 4 },
  reelStat: { color: "#fff", fontSize: 12, fontWeight: "700" },
  reelFooter: { padding: 18, paddingLeft: 64, alignItems: "flex-end" },
  reelCaption: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "right", lineHeight: 22 },
  darkRowCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  groupBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { color: COLORS.text, fontWeight: "700", fontSize: 14, textAlign: "right" },
  cardSub: { color: COLORS.muted, fontSize: 12, textAlign: "right", marginTop: 3 },
  joinBtn: { backgroundColor: COLORS.verified, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  joinedBtn: { backgroundColor: COLORS.surface2 },
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
  formCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 8,
  },
  marketCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
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
  lightbox: { flex: 1, backgroundColor: "rgba(0,0,0,0.88)", justifyContent: "center", padding: 18 },
  lightboxCard: { backgroundColor: COLORS.surface, borderRadius: 18, overflow: "hidden", borderWidth: 0.5, borderColor: COLORS.border },
  lightboxImg: { width: "100%", height: 320 },
});
