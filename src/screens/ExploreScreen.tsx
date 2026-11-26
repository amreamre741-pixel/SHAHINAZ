import React, { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function ExploreScreen() {
  const { posts } = useApp();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return posts;
    return posts.filter(
      (p) => p.content.toLowerCase().includes(s) || p.author.name.toLowerCase().includes(s)
    );
  }, [posts, q]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="🔍 ابحث عن أشخاص أو منشورات..."
        placeholderTextColor={COLORS.muted}
        value={q}
        onChangeText={setQ}
      />
      <FlatList
        data={filtered}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 14 },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  author: { color: COLORS.primary, fontWeight: "700", textAlign: "right", marginBottom: 4 },
  text: { color: COLORS.text, fontSize: 13, textAlign: "right", lineHeight: 20 },
});
