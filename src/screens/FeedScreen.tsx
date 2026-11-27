import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { Post, Story } from "../types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function PostMediaWithDoubleTap({
  imageUri,
  onDoubleTapLike,
}: {
  imageUri: string;
  onDoubleTapLike: () => void;
}) {
  const lastTapRef = useRef<number>(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  function handlePress() {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      onDoubleTapLike();
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(1);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1.15, friction: 4, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(450),
          Animated.timing(opacityAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
      ]).start();
    }
    lastTapRef.current = now;
  }

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={styles.mediaWrap}>
        <Image source={{ uri: imageUri }} style={styles.postImage} resizeMode="cover" />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.heartBurst,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons name="heart" size={96} color="#ffffff" />
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

export default function FeedScreen() {
  const {
    currentUser,
    posts,
    stories,
    notifications,
    announcement,
    toggleLike,
    toggleSave,
    addComment,
    votePoll,
    addStory,
    markStorySeen,
    markAllNotificationsRead,
    refreshPosts,
    reportPost,
    blockUser,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [newStoryOpen, setNewStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImg, setStoryImg] = useState<string | undefined>(undefined);
  const [notifOpen, setNotifOpen] = useState(false);

  const storyProgress = useRef(new Animated.Value(0)).current;
  const unreadNotifs = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!activeStory) return;
    storyProgress.setValue(0);
    const anim = Animated.timing(storyProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) setActiveStory(null);
    });
    return () => anim.stop();
  }, [activeStory]);

  async function onRefresh() {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }

  function openPostMenu(post: Post) {
    Alert.alert("خيارات المنشور", "اختر إجراءً:", [
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
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) setStoryImg(res.assets[0].uri);
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        ListHeaderComponent={
          <View>
            {/* Ultra-clean Instagram-grade Top Header */}
            <View style={styles.header}>
              <Text style={styles.brand}>SHAHINAZ</Text>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setNotifOpen(true);
                    markAllNotificationsRead();
                  }}
                >
                  <Ionicons name="heart-outline" size={25} color={COLORS.text} />
                  {unreadNotifs > 0 && <View style={styles.redDot} />}
                </TouchableOpacity>
              </View>
            </View>

            {!!announcement && (
              <View style={styles.announceBox}>
                <Ionicons name="megaphone-outline" size={16} color={COLORS.primary} />
                <Text style={styles.announceText}>{announcement}</Text>
              </View>
            )}

            {/* Stories Strip with Real Portraits & Gradient Rings */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesRow}
              style={styles.storiesBar}
            >
              <TouchableOpacity style={styles.storyItem} onPress={() => setNewStoryOpen(true)}>
                <View style={styles.myStoryWrap}>
                  {currentUser?.avatarUri ? (
                    <Image source={{ uri: currentUser.avatarUri }} style={styles.storyAvatarImg} />
                  ) : (
                    <View style={styles.storyAvatarFallback}>
                      <Ionicons name="person" size={28} color={COLORS.muted} />
                    </View>
                  )}
                  <View style={styles.myStoryPlus}>
                    <Ionicons name="add" size={15} color="#fff" />
                  </View>
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
                  <LinearGradient
                    colors={!st.seen ? ["#feda75", "#fa7e1e", "#d62976", "#962fbf"] : ["#2e2e33", "#2e2e33"]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.storyRingGrad}
                  >
                    <View style={styles.storyRingInner}>
                      {st.avatarUri ? (
                        <Image source={{ uri: st.avatarUri }} style={styles.storyAvatarImg} />
                      ) : (
                        <Text style={{ fontSize: 24 }}>{st.avatarEmoji}</Text>
                      )}
                    </View>
                  </LinearGradient>
                  <Text style={styles.storyName} numberOfLines={1}>
                    {st.userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postContainer}>
            {/* Post Header */}
            <View style={styles.postHeader}>
              <View style={styles.authorRow}>
                <LinearGradient
                  colors={["#feda75", "#d62976", "#962fbf"]}
                  style={styles.miniRing}
                >
                  {item.author.avatarUri ? (
                    <Image source={{ uri: item.author.avatarUri }} style={styles.postAvatar} />
                  ) : (
                    <View style={styles.postAvatarFallback}>
                      <Text style={{ fontSize: 16 }}>{item.author.avatarEmoji}</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                    <Text style={styles.authorName}>{item.author.name}</Text>
                    {item.author.verified && <Ionicons name="checkmark-circle" size={14} color={COLORS.verified} />}
                  </View>
                  <Text style={styles.postSub}>
                    {item.location ? `${item.location} · ` : ""}
                    {item.createdAt}
                    {item.isSponsored ? " · مموّل" : ""}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => openPostMenu(item)} style={styles.moreBtn}>
                <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.muted} />
              </TouchableOpacity>
            </View>

            {/* Full-Bleed Edge-to-Edge Media OR Gradient Text Card */}
            {!!item.imageUri ? (
              <PostMediaWithDoubleTap
                imageUri={item.imageUri}
                onDoubleTapLike={() => {
                  if (!item.likedByMe) toggleLike(item.id);
                }}
              />
            ) : item.bgColor ? (
              <LinearGradient
                colors={[item.bgColor, "#111827"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coloredPostBox}
              >
                <Text style={styles.coloredPostText}>{item.content}</Text>
              </LinearGradient>
            ) : null}

            {/* Clean Instagram Action Bar */}
            <View style={styles.actionBar}>
              <View style={styles.actionLeft}>
                <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionIconBtn}>
                  <Ionicons
                    name={item.likedByMe ? "heart" : "heart-outline"}
                    size={26}
                    color={item.likedByMe ? COLORS.heart : COLORS.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCommentingPostId(commentingPostId === item.id ? null : item.id)}
                  style={styles.actionIconBtn}
                >
                  <Ionicons name="chatbubble-outline" size={23} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => Share.share({ message: `${item.author.name} على SHAHINAZ:\n${item.content}` })}
                  style={styles.actionIconBtn}
                >
                  <Ionicons name="paper-plane-outline" size={23} color={COLORS.text} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => toggleSave(item.id)} style={styles.actionIconBtn}>
                <Ionicons
                  name={item.savedByMe ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={item.savedByMe ? COLORS.text : COLORS.text}
                />
              </TouchableOpacity>
            </View>

            {/* Likes & Caption */}
            <View style={styles.captionWrap}>
              <Text style={styles.likesText}>{item.likes.toLocaleString("fr-DZ")} إعجاب</Text>

              {!!item.content && !item.bgColor && (
                <Text style={styles.captionText}>
                  <Text style={styles.captionAuthor}>{item.author.name}  </Text>
                  {item.content}
                </Text>
              )}

              {/* Interactive Poll if present */}
              {item.poll && (
                <View style={styles.pollWrap}>
                  {(() => {
                    const totalVotes = item.poll!.options.reduce((s, o) => s + o.votes, 0);
                    return item.poll!.options.map((opt) => {
                      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      const voted = item.poll!.votedOptionId === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.pollOpt, voted && styles.pollOptVoted]}
                          onPress={() => votePoll(item.id, opt.id)}
                        >
                          <Text style={styles.pollOptText}>
                            {voted ? "✓ " : ""}
                            {opt.label}
                          </Text>
                          {item.poll!.votedOptionId && <Text style={styles.pollPct}>{pct}%</Text>}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              )}

              {item.comments.length > 0 && commentingPostId !== item.id && (
                <TouchableOpacity onPress={() => setCommentingPostId(item.id)}>
                  <Text style={styles.viewComments}>عرض كل التعليقات ({item.comments.length})</Text>
                </TouchableOpacity>
              )}

              {/* Inline Comments */}
              {commentingPostId === item.id && (
                <View style={styles.commentsBox}>
                  {item.comments.map((c) => (
                    <Text key={c.id} style={styles.commentLine}>
                      <Text style={styles.commentUser}>{c.userName} </Text>
                      {c.text}
                    </Text>
                  ))}
                  <View style={styles.commentInputRow}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="أضف تعليقاً..."
                      placeholderTextColor={COLORS.muted}
                      value={commentText}
                      onChangeText={setCommentText}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        addComment(item.id, commentText);
                        setCommentText("");
                      }}
                    >
                      <Text style={{ color: COLORS.verified, fontWeight: "700", fontSize: 13 }}>نشر</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {/* Full-Screen Animated Instagram Story Viewer */}
      <Modal visible={!!activeStory} animationType="fade" onRequestClose={() => setActiveStory(null)}>
        <TouchableWithoutFeedback onPress={() => setActiveStory(null)}>
          <View style={styles.fullStoryScreen}>
            {activeStory?.imageUri ? (
              <Image source={{ uri: activeStory.imageUri }} style={styles.fullStoryBg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={["#6d28d9", "#ec4899"]} style={styles.fullStoryBg} />
            )}
            <LinearGradient
              colors={["rgba(0,0,0,0.65)", "transparent", "rgba(0,0,0,0.8)"]}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Animated Progress Bar */}
            <View style={styles.storyProgressTrack}>
              <Animated.View
                style={[
                  styles.storyProgressFill,
                  {
                    width: storyProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

            {/* Story Top Author */}
            {activeStory && (
              <View style={styles.fullStoryTop}>
                <View style={styles.authorRow}>
                  {activeStory.avatarUri ? (
                    <Image source={{ uri: activeStory.avatarUri }} style={styles.postAvatar} />
                  ) : (
                    <Text style={{ fontSize: 22 }}>{activeStory.avatarEmoji}</Text>
                  )}
                  <Text style={styles.fullStoryName}>{activeStory.userName}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveStory(null)}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {/* Story Caption Overlay */}
            {!!activeStory?.text && (
              <View style={styles.fullStoryCaptionBox}>
                <Text style={styles.fullStoryCaption}>{activeStory.text}</Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* New Story Composer Modal */}
      <Modal visible={newStoryOpen} transparent animationType="slide" onRequestClose={() => setNewStoryOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✨ إضافة قصة جديدة</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="اكتب تعليقاً لقصتك..."
              placeholderTextColor={COLORS.muted}
              value={storyText}
              onChangeText={setStoryText}
            />
            {storyImg && <Image source={{ uri: storyImg }} style={{ width: "100%", height: 180, borderRadius: 12, marginBottom: 10 }} />}
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity style={styles.outlineBtn} onPress={pickStoryImage}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>🖼️ صورة</Text>
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
            <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => setNewStoryOpen(false)}>
              <Text style={{ color: COLORS.muted }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Sheet */}
      <Modal visible={notifOpen} transparent animationType="slide" onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>النشاط والإشعارات</Text>
            {notifications.map((n) => (
              <View key={n.id} style={styles.notifRow}>
                <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={{ color: COLORS.text, fontSize: 13 }}>{n.text}</Text>
                  <Text style={{ color: COLORS.muted, fontSize: 11 }}>{n.time}</Text>
                </View>
              </View>
            ))}
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 14 }]} onPress={() => setNotifOpen(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  brand: { fontSize: 23, fontWeight: "900", color: COLORS.text, letterSpacing: 1.8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { position: "relative", padding: 4 },
  redDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.heart,
  },
  announceBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  announceText: { color: COLORS.text, fontSize: 12, fontWeight: "600", flex: 1, textAlign: "right" },
  storiesBar: { borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  storiesRow: { paddingHorizontal: 12, paddingVertical: 10, gap: 14 },
  storyItem: { alignItems: "center", width: 72 },
  myStoryWrap: { width: 68, height: 68, position: "relative", alignItems: "center", justifyContent: "center" },
  myStoryPlus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.verified,
    borderWidth: 2,
    borderColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  storyRingGrad: { width: 70, height: 70, borderRadius: 35, padding: 2.5, alignItems: "center", justifyContent: "center" },
  storyRingInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: COLORS.bg,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarImg: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.surface2 },
  storyAvatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  storyName: { color: COLORS.text, fontSize: 11, marginTop: 5 },
  postContainer: {
    backgroundColor: COLORS.bg,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 14,
  },
  postHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authorRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  miniRing: { width: 38, height: 38, borderRadius: 19, padding: 2, alignItems: "center", justifyContent: "center" },
  postAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.surface2 },
  postAvatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: { color: COLORS.text, fontWeight: "700", fontSize: 13.5 },
  postSub: { color: COLORS.muted, fontSize: 11, marginTop: 1 },
  moreBtn: { padding: 6 },
  mediaWrap: { position: "relative", width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.1, backgroundColor: COLORS.surface },
  postImage: { width: "100%", height: "100%" },
  heartBurst: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -48,
    marginLeft: -48,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  coloredPostBox: { width: SCREEN_WIDTH, minHeight: 240, padding: 28, justifyContent: "center", alignItems: "center" },
  coloredPostText: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center", lineHeight: 34 },
  actionBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  actionLeft: { flexDirection: "row-reverse", alignItems: "center", gap: 16 },
  actionIconBtn: { padding: 2 },
  captionWrap: { paddingHorizontal: 14, gap: 5 },
  likesText: { color: COLORS.text, fontWeight: "700", fontSize: 13, textAlign: "right" },
  captionText: { color: COLORS.text, fontSize: 13.5, lineHeight: 20, textAlign: "right" },
  captionAuthor: { fontWeight: "700", color: COLORS.text },
  viewComments: { color: COLORS.muted, fontSize: 12.5, textAlign: "right", marginTop: 2 },
  pollWrap: { gap: 8, marginTop: 8 },
  pollOpt: {
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pollOptVoted: { borderColor: COLORS.primary, backgroundColor: "rgba(168,85,247,0.18)" },
  pollOptText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  pollPct: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  commentsBox: { marginTop: 8, gap: 8 },
  commentLine: { color: COLORS.text, fontSize: 13, textAlign: "right" },
  commentUser: { fontWeight: "700", color: COLORS.text },
  commentInputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  commentInput: { flex: 1, color: COLORS.text, fontSize: 13, textAlign: "right", paddingVertical: 4 },
  fullStoryScreen: { flex: 1, backgroundColor: "#000", justifyContent: "space-between" },
  fullStoryBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  storyProgressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginTop: 48,
    marginHorizontal: 12,
    borderRadius: 2,
    overflow: "hidden",
  },
  storyProgressFill: { height: "100%", backgroundColor: "#ffffff" },
  fullStoryTop: {
    position: "absolute",
    top: 62,
    left: 14,
    right: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fullStoryName: { color: "#fff", fontWeight: "700", fontSize: 15 },
  fullStoryCaptionBox: { paddingHorizontal: 20, paddingBottom: 48 },
  fullStoryCaption: { color: "#fff", fontSize: 17, fontWeight: "700", textAlign: "center", lineHeight: 26 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", textAlign: "right", marginBottom: 12 },
  modalInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 10,
  },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 12, alignItems: "center" },
  outlineBtn: { flex: 1, backgroundColor: COLORS.surface2, borderRadius: 12, padding: 12, alignItems: "center" },
  notifRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
});
