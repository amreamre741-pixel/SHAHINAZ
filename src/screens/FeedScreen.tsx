import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
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
import AdminScreen from "./AdminScreen";
import DevVaultModal from "../components/DevVaultModal";

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
    allUsers,
    stories,
    notifications,
    announcement,
    adminPin,
    bannedWords,
    rolePermissions,
    followingUserIds,
    blockedUserIds,
    toggleFollowUser,
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
    unblockUser,
    togglePrivateAccount,
    logout,
    deleteAccount,
  } = useApp();

  const [refreshing, setRefreshing] = useState(false);
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [newStoryOpen, setNewStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImg, setStoryImg] = useState<string | undefined>(undefined);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devVaultOpen, setDevVaultOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [storyReactionMsg, setStoryReactionMsg] = useState("");

  const selectedAuthor = allUsers.find((u) => u.id === selectedAuthorId) || null;

  const versionTapCountRef = useRef(0);
  const versionTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  function handleSecretVersionTap() {
    versionTapCountRef.current += 1;
    if (versionTapTimerRef.current) clearTimeout(versionTapTimerRef.current);
    if (versionTapCountRef.current >= 5) {
      versionTapCountRef.current = 0;
      setSettingsOpen(false);
      setTimeout(() => setDevVaultOpen(true), 220);
      return;
    }
    versionTapTimerRef.current = setTimeout(() => {
      versionTapCountRef.current = 0;
    }, 2500);
  }

  function confirmDeleteFromSettings() {
    Alert.alert(
      "حذف الحساب نهائياً",
      "هل أنت متأكد؟ سيتم حذف حسابك وجميع منشوراتك وبياناتك بشكل نهائي ولا يمكن التراجع عن ذلك.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "نعم، احذف حسابي",
          style: "destructive",
          onPress: () => {
            setSettingsOpen(false);
            deleteAccount();
            Alert.alert("تم الحذف", "تم حذف حسابك وبياناتك بنجاح.");
          },
        },
      ]
    );
  }

  function handleSendComment(postId: string) {
    const clean = commentText.trim();
    if (!clean) return;
    const role = currentUser?.role || "USER";
    if (!rolePermissions[role]?.canComment) {
      Alert.alert("الصلاحيات", "التعليق غير مفعّل لرتبتك الحالية من طرف الإدارة.");
      return;
    }
    const foundBanned = bannedWords.find((w) => clean.toLowerCase().includes(w.toLowerCase()));
    if (foundBanned) {
      Alert.alert("محتوى غير مسموح", "يحتوي تعليقك على كلمة محظورة من فلتر الأمان التلقائي.");
      return;
    }
    addComment(postId, clean);
    setCommentText("");
  }

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
              <TouchableOpacity
                activeOpacity={0.9}
                delayLongPress={1400}
                onLongPress={() => setDevVaultOpen(true)}
              >
                <Text style={styles.brand}>SHAHINAZ</Text>
              </TouchableOpacity>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setSettingsOpen(true)}
                  accessibilityLabel="الإعدادات"
                >
                  <Ionicons name="settings-outline" size={23} color={COLORS.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => {
                    setNotifOpen(true);
                    markAllNotificationsRead();
                  }}
                  accessibilityLabel="الإشعارات"
                >
                  <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
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
              <TouchableOpacity
                style={styles.authorRow}
                activeOpacity={0.8}
                onPress={() => setSelectedAuthorId(item.author.id)}
              >
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
                    {item.isPinned && (
                      <View style={styles.pinnedPill}>
                        <Text style={styles.pinnedPillText}>📌 مثبّت</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.postSub}>
                    {item.location ? `${item.location} · ` : ""}
                    {item.createdAt}
                    {item.isSponsored ? " · مموّل" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
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
                    <TouchableOpacity onPress={() => handleSendComment(item.id)}>
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

            {/* Story Caption Overlay + Quick Emoji Reactions */}
            <View style={styles.fullStoryCaptionBox}>
              {!!activeStory?.text && <Text style={styles.fullStoryCaption}>{activeStory.text}</Text>}
              {!!storyReactionMsg && (
                <Text style={{ color: "#fde68a", textAlign: "center", fontWeight: "700", fontSize: 13, marginTop: 8 }}>
                  {storyReactionMsg}
                </Text>
              )}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 14 }}>
                {["❤️", "🔥", "👏", "😍"].map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "rgba(255,255,255,0.16)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => {
                      setStoryReactionMsg(`تم إرسال ${em} إلى ${activeStory?.userName}`);
                      setTimeout(() => setStoryReactionMsg(""), 1400);
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
                  if (!storyText.trim() && !storyImg) {
                    Alert.alert("تنبيه", "اكتب تعليقاً أو اختر صورة لقصتك أولاً.");
                    return;
                  }
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
            <Text style={styles.modalTitle}>🔔 النشاط والإشعارات</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {notifications.map((n) => (
                <View key={n.id} style={styles.notifRow}>
                  <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: COLORS.text, fontSize: 13, textAlign: "right" }}>{n.text}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11 }}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.primaryBtn, { flex: 0, marginTop: 14 }]} onPress={() => setNotifOpen(false)}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Author Quick-Profile Modal (Opened by tapping any creator avatar/name) */}
      <Modal visible={!!selectedAuthor} transparent animationType="fade" onRequestClose={() => setSelectedAuthorId(null)}>
        <View style={styles.modalBackdrop}>
          {selectedAuthor && (
            <View style={styles.modalBox}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>@{selectedAuthor.username}</Text>
                <TouchableOpacity onPress={() => setSelectedAuthorId(null)}>
                  <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", gap: 8 }}>
                {selectedAuthor.avatarUri ? (
                  <Image source={{ uri: selectedAuthor.avatarUri }} style={{ width: 76, height: 76, borderRadius: 38 }} />
                ) : (
                  <View style={{ width: 76, height: 76, borderRadius: 38, backgroundColor: COLORS.surface2, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontSize: 32 }}>{selectedAuthor.avatarEmoji}</Text>
                  </View>
                )}
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                  <Text style={{ color: COLORS.text, fontSize: 17, fontWeight: "800" }}>{selectedAuthor.name}</Text>
                  {selectedAuthor.verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.verified} />}
                </View>
                {!!selectedAuthor.bio && (
                  <Text style={{ color: COLORS.muted, fontSize: 13, textAlign: "center" }}>{selectedAuthor.bio}</Text>
                )}
                <View style={{ flexDirection: "row-reverse", gap: 24, marginVertical: 8 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}>
                      {selectedAuthor.followers.toLocaleString("fr-DZ")}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11.5 }}>متابِع</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 16 }}>{selectedAuthor.following}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11.5 }}>يتابِع</Text>
                  </View>
                </View>

                {selectedAuthor.id !== currentUser?.id && (
                  <View style={{ flexDirection: "row-reverse", gap: 8, width: "100%", marginTop: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        {
                          backgroundColor: followingUserIds.includes(selectedAuthor.id)
                            ? COLORS.surface2
                            : COLORS.verified,
                        },
                      ]}
                      onPress={() => toggleFollowUser(selectedAuthor.id)}
                    >
                      <Text style={{ color: "#fff", fontWeight: "800" }}>
                        {followingUserIds.includes(selectedAuthor.id) ? "متابَع ✓" : "متابعة +"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.outlineBtn, { borderWidth: 0.8, borderColor: COLORS.danger }]}
                      onPress={() => {
                        blockUser(selectedAuthor.id);
                        setSelectedAuthorId(null);
                        Alert.alert("تم الحظر", `تم حظر ${selectedAuthor.name} بنجاح.`);
                      }}
                    >
                      <Text style={{ color: COLORS.danger, fontWeight: "700" }}>حظر 🚫</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* AMOLED Quick Settings Sheet (Opened from ⚙️ next to Notifications Bell) */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={styles.settingsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.settingsHeader}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
                <Text style={styles.settingsTitle}>الإعدادات والخصوصية</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsOpen(false)} style={styles.sheetCloseBtn}>
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 14 }}>
              {/* User Mini Card */}
              {currentUser && (
                <View style={styles.accountMiniCard}>
                  {currentUser.avatarUri ? (
                    <Image source={{ uri: currentUser.avatarUri }} style={styles.miniAvatar} />
                  ) : (
                    <View style={styles.miniAvatarFallback}>
                      <Ionicons name="person" size={22} color={COLORS.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                      <Text style={{ color: COLORS.text, fontWeight: "800", fontSize: 15 }}>{currentUser.name}</Text>
                      {currentUser.verified && <Ionicons name="checkmark-circle" size={15} color={COLORS.verified} />}
                    </View>
                    <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                      @{currentUser.username} · 🏆 {currentUser.points ?? 150} نقطة
                    </Text>
                  </View>
                </View>
              )}

              {/* Private Account Toggle (Full-row tappable) */}
              <TouchableOpacity activeOpacity={0.8} style={styles.settingRow} onPress={togglePrivateAccount}>
                <Switch value={!!currentUser?.isPrivate} onValueChange={togglePrivateAccount} />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={styles.settingTitle}>حساب خاص (Private)</Text>
                  <Text style={styles.settingSub}>فقط المتابعون الموافق عليهم يشاهدون منشوراتك</Text>
                </View>
              </TouchableOpacity>

              {/* Privacy Policy & Safety Standards */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.settingRow}
                onPress={() =>
                  Linking.openURL("https://amreamre741-pixel.github.io/SHAHINAZ/privacy.html").catch(() =>
                    Alert.alert("سياسة الخصوصية", "نحمي بياناتك بالكامل وفق معايير Google Play ومعايير سلامة المجتمع.")
                  )
                }
              >
                <Ionicons name="chevron-back" size={18} color={COLORS.muted} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.settingTitle}>سياسة الخصوصية وشروط الاستخدام</Text>
                  <Text style={styles.settingSub}>معايير الأمان وحماية البيانات (Google Play)</Text>
                </View>
              </TouchableOpacity>

              {/* App Theme & Connection Status */}
              <View style={styles.settingRow}>
                <View style={styles.onlinePill}>
                  <View style={styles.onlineDot} />
                  <Text style={{ color: COLORS.success, fontSize: 11, fontWeight: "700" }}>متصل</Text>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={styles.settingTitle}>المظهر الليلي AMOLED</Text>
                  <Text style={styles.settingSub}>أسود فاحم موفّر للبطارية · جودة عالية</Text>
                </View>
              </View>

              {/* Blocked Users */}
              <View style={styles.settingBlockCard}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.settingTitle}>المستخدمون المحظورون</Text>
                  <Text style={{ color: COLORS.muted, fontWeight: "700", fontSize: 13 }}>{blockedUserIds.length}</Text>
                </View>
                {blockedUserIds.length > 0 && (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {blockedUserIds.map((uid) => {
                      const u = allUsers.find((x) => x.id === uid);
                      return (
                        <View key={uid} style={styles.blockedItem}>
                          <TouchableOpacity onPress={() => unblockUser(uid)}>
                            <Text style={{ color: COLORS.verified, fontSize: 12, fontWeight: "700" }}>إلغاء الحظر</Text>
                          </TouchableOpacity>
                          <Text style={{ color: COLORS.text, fontSize: 12.5 }}>{u ? u.name : uid}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Logout & Delete Account */}
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setSettingsOpen(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={COLORS.text} />
                <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 14 }}>تسجيل الخروج</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dangerBtn} onPress={confirmDeleteFromSettings}>
                <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                <Text style={{ color: COLORS.danger, fontWeight: "700", fontSize: 14 }}>حذف الحساب نهائياً</Text>
              </TouchableOpacity>

              {/* Stealth 5-Tap Developer Entry Footer (100% invisible to normal users) */}
              <TouchableOpacity activeOpacity={0.7} onPress={handleSecretVersionTap} style={styles.versionFooter}>
                <Text style={styles.versionText}>SHAHINAZ Ultra · v1.0.0</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Encrypted Developer Vault PIN Keypad */}
      <DevVaultModal
        visible={devVaultOpen}
        expectedPin={adminPin}
        onClose={() => setDevVaultOpen(false)}
        onUnlock={() => setAdminOpen(true)}
      />

      {/* Full-Screen Super-Admin Command Center */}
      <Modal visible={adminOpen} animationType="slide" onRequestClose={() => setAdminOpen(false)}>
        <AdminScreen onClose={() => setAdminOpen(false)} />
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { position: "relative", padding: 5 },
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
  pinnedPill: {
    backgroundColor: "rgba(56,151,240,0.16)",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  pinnedPillText: { color: COLORS.verified, fontSize: 10, fontWeight: "800" },
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
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.78)",
    justifyContent: "flex-end",
  },
  settingsSheet: {
    backgroundColor: "#0c0c0f",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "82%",
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 12,
  },
  settingsHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  settingsTitle: { color: COLORS.text, fontSize: 17, fontWeight: "800" },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  accountMiniCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  miniAvatar: { width: 44, height: 44, borderRadius: 22 },
  miniAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  settingBlockCard: {
    backgroundColor: COLORS.surface,
    padding: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  settingTitle: { color: COLORS.text, fontSize: 13.5, fontWeight: "700" },
  settingSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(34,197,94,0.14)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.success },
  blockedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  logoutBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface2,
    borderRadius: 13,
    padding: 13,
  },
  dangerBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: COLORS.danger,
    borderWidth: 0.8,
    borderRadius: 13,
    padding: 13,
  },
  versionFooter: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
  },
  versionText: {
    color: COLORS.muted,
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
});
