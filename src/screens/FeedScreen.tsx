import React, { useState } from "react";
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { Post } from "../types";

export default function FeedScreen() {
  const { posts, stories, announcement, toggleLike, toggleSave, addComment, reportPost, blockUser } = useApp();
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  function openPostMenu(post: Post) {
    Alert.alert("خيارات المنشور", "اختر إجراءً لحماية تجربتك:", [
      {
        text: "🚩 الإبلاغ عن محتوى مسيء",
        style: "destructive",
        onPress: () => {
          reportPost(post.id, "محتوى غير لائق");
          Alert.alert("تم استلام البلاغ", "تم إخفاء المنشور وسيتم مراجعته خلال 24 ساعة.");
        },
      },
      {
        text: `🚫 حظر ${post.author.name}`,
        style: "destructive",
        onPress: () => {
          blockUser(post.author.id);
          Alert.alert("تم الحظر", `لن تظهر لك منشورات ${post.author.name} بعد الآن.`);
        },
      },
      { text: "إلغاء", style: "cancel" },
    ]);
  }

  return (
    <FlatList
      style={styles.list}
      data={posts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.header}>
            <Text style={styles.brand}>SHAHINAZ</Text>
            <Text style={styles.badge}>✨ جديد</Text>
          </View>
          {!!announcement && (
            <View style={{ backgroundColor: "rgba(139,92,246,0.18)", borderColor: COLORS.primary, borderWidth: 1, marginHorizontal: 12, marginBottom: 8, padding: 10, borderRadius: 12 }}>
              <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "700", textAlign: "right" }}>📢 {announcement}</Text>
            </View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
            {stories.map((st) => (
              <View key={st.id} style={styles.storyItem}>
                <View style={[styles.storyRing, !st.seen && styles.storyRingActive]}>
                  <Text style={styles.storyEmoji}>{st.avatarEmoji}</Text>
                </View>
                <Text style={styles.storyName} numberOfLines={1}>
                  {st.userName}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.authorRow}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 20 }}>{item.author.avatarEmoji}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.authorName}>
                  {item.author.name} {item.author.verified ? "☑️" : ""}
                </Text>
                <Text style={styles.meta}>
                  {item.createdAt} {item.location ? `· ${item.location}` : ""}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => openPostMenu(item)} style={styles.moreBtn}>
              <Text style={styles.moreText}>⋯</Text>
            </TouchableOpacity>
          </View>

          {!!item.content && <Text style={styles.content}>{item.content}</Text>}
          {!!item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.postImage} />}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLike(item.id)}>
              <Text style={styles.actionText}>
                {item.likedByMe ? "❤️" : "🤍"} {item.likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setCommentingPostId(commentingPostId === item.id ? null : item.id)}
            >
              <Text style={styles.actionText}>💬 {item.comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSave(item.id)}>
              <Text style={styles.actionText}>{item.savedByMe ? "🔖 محفوظ" : "📑 حفظ"}</Text>
            </TouchableOpacity>
          </View>

          {commentingPostId === item.id && (
            <View style={styles.commentsBox}>
              {item.comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{c.userName}</Text>
                  <Text style={styles.commentText}>{c.text}</Text>
                </View>
              ))}
              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="اكتب تعليقاً..."
                  placeholderTextColor={COLORS.muted}
                  value={commentText}
                  onChangeText={setCommentText}
                />
                <TouchableOpacity
                  style={styles.sendCommentBtn}
                  onPress={() => {
                    addComment(item.id, commentText);
                    setCommentText("");
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>إرسال</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brand: { fontSize: 24, fontWeight: "800", color: COLORS.primary, letterSpacing: 1.5 },
  badge: { color: COLORS.accent, fontSize: 12, fontWeight: "700" },
  storiesRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
  storyItem: { alignItems: "center", width: 68 },
  storyRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  storyRingActive: { borderColor: COLORS.accent },
  storyEmoji: { fontSize: 26 },
  storyName: { color: COLORS.text, fontSize: 11, marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHead: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  authorRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  meta: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  moreBtn: { padding: 6 },
  moreText: { color: COLORS.muted, fontSize: 20, fontWeight: "700" },
  content: { color: COLORS.text, fontSize: 14, lineHeight: 22, textAlign: "right", marginBottom: 10 },
  postImage: { width: "100%", height: 240, borderRadius: 14, marginBottom: 10, backgroundColor: COLORS.surface2 },
  actionsRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  actionBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  actionText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  commentsBox: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 8 },
  commentItem: { backgroundColor: COLORS.surface2, borderRadius: 10, padding: 8, alignItems: "flex-end" },
  commentAuthor: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  commentText: { color: COLORS.text, fontSize: 13, marginTop: 2 },
  commentInputRow: { flexDirection: "row-reverse", gap: 8, marginTop: 4 },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.text,
    textAlign: "right",
  },
  sendCommentBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
});
