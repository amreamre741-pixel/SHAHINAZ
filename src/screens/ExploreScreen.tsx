import React, { useMemo, useState } from "react";
import { Alert, FlatList, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

const TRENDING_TAGS = ["#الجزائر", "#SHAHINAZ", "#وهران", "#تجارة", "#تقنية"];

const DEMO_REELS = [
  { id: "r_1", author: "ياسين بن علي 🧔🏻", title: "جولة مسائية في الجزائر العاصمة 🇩🇿✨", likes: 420, bg: "#4c1d95" },
  { id: "r_2", author: "سارة منصوري 👩🏻‍🎨", title: "أفضل 3 أفكار لتنظيم يومك بفعالية 💡", likes: 890, bg: "#9d174d" },
  { id: "r_3", author: "كريم تكنولوجي 👨🏻‍💻", title: "أسرار النجاح في التجارة الإلكترونية في الجزائر 🚀", likes: 1250, bg: "#065f46" },
];

export default function ExploreScreen() {
  const { posts, marketItems, addMarketItem } = useApp();
  const [mode, setMode] = useState<"explore" | "reels" | "market">("explore");
  const [q, setQ] = useState("");
  const [likedReels, setLikedReels] = useState<string[]>([]);
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
      <View style={styles.switchRow}>
        <TouchableOpacity
          style={[styles.switchBtn, mode === "explore" && styles.switchActive]}
          onPress={() => setMode("explore")}
        >
          <Text style={[styles.switchText, mode === "explore" && styles.switchTextActive]}>🔍 استكشاف</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, mode === "reels" && styles.switchActive]}
          onPress={() => setMode("reels")}
        >
          <Text style={[styles.switchText, mode === "reels" && styles.switchTextActive]}>🎬 ريلز</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, mode === "market" && styles.switchActive]}
          onPress={() => setMode("market")}
        >
          <Text style={[styles.switchText, mode === "market" && styles.switchTextActive]}>🛒 السوق</Text>
        </TouchableOpacity>
      </View>

      {mode !== "reels" && (
        <TextInput
          style={styles.search}
          placeholder={mode === "explore" ? "🔍 ابحث عن أشخاص أو هاشتاق..." : "🔍 ابحث عن منتج أو ولاية..."}
          placeholderTextColor={COLORS.muted}
          value={q}
          onChangeText={setQ}
        />
      )}

      {mode === "explore" && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 42, marginBottom: 10 }} contentContainerStyle={{ gap: 8 }}>
            {TRENDING_TAGS.map((tag) => (
              <TouchableOpacity key={tag} style={styles.tagPill} onPress={() => setQ(q === tag ? "" : tag)}>
                <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 12 }}>🔥 {tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.author}>
                  {item.author.avatarEmoji} {item.author.name}
                </Text>
                <Text style={styles.text} numberOfLines={3}>
                  {item.content}
                </Text>
              </View>
            )}
          />
        </>
      )}

      {mode === "reels" && (
        <FlatList
          data={DEMO_REELS}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => {
            const liked = likedReels.includes(item.id);
            return (
              <View style={[styles.reelCard, { backgroundColor: item.bg }]}>
                <Text style={{ fontSize: 48, marginBottom: 14 }}>🎬</Text>
                <Text style={styles.reelTitle}>{item.title}</Text>
                <Text style={styles.reelAuthor}>{item.author}</Text>
                <TouchableOpacity
                  style={styles.reelLikeBtn}
                  onPress={() =>
                    setLikedReels((prev) => (prev.includes(item.id) ? prev.filter((x) => x !== item.id) : [...prev, item.id]))
                  }
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                    {liked ? "❤️" : "🤍"} {item.likes + (liked ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {mode === "market" && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddingProduct((v) => !v)}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              {addingProduct ? "إغلاق" : "+ اعرض منتجك للبيع مجاناً"}
            </Text>
          </TouchableOpacity>

          {addingProduct && (
            <View style={styles.card}>
              <TextInput style={styles.input} placeholder="اسم المنتج" placeholderTextColor={COLORS.muted} value={pTitle} onChangeText={setPTitle} />
              <TextInput style={styles.input} placeholder="السعر (دج)" placeholderTextColor={COLORS.muted} keyboardType="number-pad" value={pPrice} onChangeText={setPPrice} />
              <TextInput style={styles.input} placeholder="الولاية (مثال: سطيف)" placeholderTextColor={COLORS.muted} value={pCity} onChangeText={setPCity} />
              <TextInput style={styles.input} placeholder="رقم الهاتف (لواتساب)" placeholderTextColor={COLORS.muted} keyboardType="phone-pad" value={pPhone} onChangeText={setPPhone} />
              <TouchableOpacity style={styles.addBtn} onPress={handleAddProduct}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>نشر المنتج في السوق 🚀</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={filteredMarket}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.author}>
                    {item.emoji} {item.title}
                  </Text>
                  <Text style={{ color: COLORS.success, fontWeight: "800", fontSize: 15 }}>
                    {item.priceDzd.toLocaleString("fr-DZ")} دج
                  </Text>
                </View>
                <Text style={styles.meta}>
                  📍 {item.city} · البائع: {item.sellerName} · {item.createdAt}
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
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>📲 تواصل مع البائع عبر واتساب</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 14 },
  switchRow: {
    flexDirection: "row-reverse",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  switchActive: { backgroundColor: COLORS.primary },
  switchText: { color: COLORS.muted, fontWeight: "700", fontSize: 12 },
  switchTextActive: { color: "#fff" },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: "center",
  },
  reelCard: {
    borderRadius: 20,
    padding: 28,
    minHeight: 280,
    marginBottom: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  reelTitle: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center", lineHeight: 28 },
  reelAuthor: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 8 },
  reelLikeBtn: {
    marginTop: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 12, alignItems: "center", marginBottom: 10 },
  input: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  author: { color: COLORS.text, fontWeight: "700", textAlign: "right", fontSize: 14 },
  text: { color: COLORS.text, fontSize: 13, textAlign: "right", lineHeight: 20, marginTop: 4 },
  meta: { color: COLORS.muted, fontSize: 12, textAlign: "right", marginTop: 6 },
  waBtn: { backgroundColor: "#16a34a", borderRadius: 10, padding: 9, alignItems: "center", marginTop: 10 },
});
