import React, { useState } from "react";
import { Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { Post, Story } from "../types";

export default function FeedScreen() {
  const {
    posts,
    stories,
    notifications,
    announcement,
    toggleLike,
    toggleSave,
    addComment,
    addStory,
    markStorySeen,
    markAllNotificationsRead,
    reportPost,
    blockUser,
  } = useApp();

  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [newStoryOpen, setNewStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImg, setStoryImg] = useState<string | undefined>(undefined);
  const [notifOpen, setNotifOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.read).length;

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

  async function pickStoryImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) setStoryImg(res.assets[0].uri);
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <FlatList
        style={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.brand}>SHAHINAZ</Text>
              <TouchableOpacity
                style={styles.bellBtn}
                onPress={() => {
                  setNotifOpen(true);
                  markAllNotificationsRead();
                }}
              >
                <Text style={{ fontSize: 18 }}>🔔</Text>
                {unreadNotifs > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>{unreadNotifs}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {!!announcement && (
              <View style={styles.announceBox}>
                <Text style={styles.announceText}>📢 {announcement}</Text>
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
              <TouchableOpacity style={styles.storyItem} onPress={() => setNewStoryOpen(true)}>
                <View style={[styles.storyRing, { borderColor: COLORS.primary }]}>
                  <Text style={styles.storyEmoji}>➕</Text>
                </View>
                <Text style={styles.storyName}>قصتك</Text>
              </TouchableOpacity>

              {stories.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={styles.storyItem}
                  onPress={() => {
                    markStorySeen(st.id);
                    setActiveStory(st);
                  }}
                >
                  <View style={[styles.storyRing, !st.seen && styles.storyRingActive]}>
                    <Text style={styles.storyEmoji}>{st.avatarEmoji}</Text>
                  </View>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {st.userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View style={styles.authorRow}>
                <View style={styles.avatar}>
                  {item.author.avatarUri ? (
                    <Image source={{ uri: item.author.avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{item.author.avatarEmoji}</Text>
                  )}
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

      {/* Story Viewer Modal */}
      <Modal visible={!!activeStory} transparent animationType="fade" onRequestClose={() => setActiveStory(null)}>
        <TouchableOpacity style={styles.storyModal} activeOpacity={1} onPress={() => setActiveStory(null)}>
          {activeStory && (
            <View style={styles.storyCard}>
              <Text style={{ color: COLORS.primary, fontWeight: "700", fontSize: 16, marginBottom: 12 }}>
                {activeStory.avatarEmoji} {activeStory.userName}
              </Text>
              {!!activeStory.imageUri && <Image source={{ uri: activeStory.imageUri }} style={styles.storyModalImg} />}
              {!!activeStory.text && <Text style={styles.storyModalText}>{activeStory.text}</Text>}
              <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 18 }}>اضغط في أي مكان للإغلاق</Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* New Story Modal */}
      <Modal visible={newStoryOpen} transparent animationType="slide" onRequestClose={() => setNewStoryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✨ نشر قصة جديدة</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="اكتب نص قصتك..."
              placeholderTextColor={COLORS.muted}
              value={storyText}
              onChangeText={setStoryText}
            />
            {storyImg && <Image source={{ uri: storyImg }} style={{ width: "100%", height: 150, borderRadius: 12, marginBottom: 10 }} />}
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity style={styles.outlineBtn} onPress={pickStoryImage}>
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>🖼️ صورة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  addStory(storyText, storyImg);
                  setStoryText("");
                  setStoryImg(undefined);
                  setNewStoryOpen(false);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>نشر القصة</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 10, alignItems: "center" }} onPress={() => setNewStoryOpen(false)}>
              <Text style={{ color: COLORS.muted }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notifOpen} transparent animationType="slide" onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🔔 الإشعارات</Text>
            {notifications.map((n) => (
              <View key={n.id} style={styles.notifRow}>
                <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: COLORS.text, fontSize: 13 }}>{n.text}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{n.time}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={() => setNotifOpen(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  bellBtn: { position: "relative", padding: 6 },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  announceBox: {
    backgroundColor: "rgba(139,92,246,0.18)",
    borderColor: COLORS.primary,
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
  },
  announceText: { color: COLORS.text, fontSize: 13, fontWeight: "700", textAlign: "right" },
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
  sendCommentBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, justifyContent: "center" },
  storyModal: { flex: 1, backgroundColor: "rgba(0,0,0,0.9)", justifyContent: "center", alignItems: "center", padding: 20 },
  storyCard: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  storyModalImg: { width: "100%", height: 260, borderRadius: 14, marginBottom: 12 },
  storyModalText: { color: COLORS.text, fontSize: 18, fontWeight: "700", textAlign: "center", lineHeight: 28 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", textAlign: "right", marginBottom: 12 },
  modalInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 10,
  },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 12, alignItems: "center" },
  outlineBtn: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notifRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
});
