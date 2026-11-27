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
import { useApp } from "../store/AppContext";
import type { Post, ReactionEmoji, Story } from "../types";
import AdminScreen from "./AdminScreen";
import DevVaultModal from "../components/DevVaultModal";
import DailyStreakModal from "../components/DailyStreakModal";
import ShahinazAiModal from "../components/ShahinazAiModal";
import ThemeStudioModal from "../components/ThemeStudioModal";
import AuroraBackground from "../components/AuroraBackground";
import LiveStreamModal from "../components/LiveStreamModal";
import WalletModal from "../components/WalletModal";
import { PulseDot } from "../components/LuxuryMotion";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_MEDIA_HEIGHT = Math.min(390, (SCREEN_WIDTH - 44) * 1.05);
const REACTIONS: ReactionEmoji[] = ["❤️", "🔥", "😂", "😮", "😢"];
const GIFT_TIERS = [
  { emoji: "🌹", label: "وردة", cost: 10 },
  { emoji: "🔥", label: "نار", cost: 25 },
  { emoji: "👑", label: "تاج ملكي", cost: 100 },
];

function PostMediaWithDoubleTap({
  imageUri,
  location,
  createdAt,
  isSponsored,
  onDoubleTapLike,
}: {
  imageUri: string;
  location?: string;
  createdAt: string;
  isSponsored?: boolean;
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
          Animated.delay(420),
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
        <LinearGradient
          colors={["rgba(0,0,0,0.42)", "transparent", "rgba(0,0,0,0.52)"]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {(!!location || isSponsored) && (
          <View style={styles.mediaFloatingTag}>
            <Ionicons name={isSponsored ? "sparkles" : "location"} size={11} color="#FDE68A" />
            <Text style={styles.mediaFloatingTagText}>
              {location ? `${location}` : "مموّل ⭐"}
              {isSponsored && location ? " · مموّل" : ""}
            </Text>
          </View>
        )}
        <View style={styles.mediaTimeBadge}>
          <Text style={styles.mediaTimeText}>{createdAt}</Text>
        </View>
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
          <Ionicons name="heart" size={92} color="#ffffff" />
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
    theme,
    streakDays,
    claimedStreakToday,
    adminPin,
    bannedWords,
    rolePermissions,
    followingUserIds,
    blockedUserIds,
    toggleFollowUser,
    toggleLike,
    setReaction,
    sendPostGift,
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
  const [feedMode, setFeedMode] = useState<"foryou" | "following" | "trending">("foryou");
  const [commentingPostId, setCommentingPostId] = useState<string | null>(null);
  const [reactionPostId, setReactionPostId] = useState<string | null>(null);
  const [giftPostId, setGiftPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [newStoryOpen, setNewStoryOpen] = useState(false);
  const [storyText, setStoryText] = useState("");
  const [storyImg, setStoryImg] = useState<string | undefined>(undefined);
  const [notifOpen, setNotifOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [streakOpen, setStreakOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [devVaultOpen, setDevVaultOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);
  const [storyReactionMsg, setStoryReactionMsg] = useState("");

  const selectedAuthor = allUsers.find((u) => u.id === selectedAuthorId) || null;

  const displayedPosts = React.useMemo(() => {
    if (feedMode === "following") {
      const f = posts.filter((p) => followingUserIds.includes(p.author.id) || p.author.id === currentUser?.id);
      return f.length > 0 ? f : posts;
    }
    if (feedMode === "trending") {
      return [...posts].sort((a, b) => b.likes - a.likes);
    }
    return posts;
  }, [posts, feedMode, followingUserIds, currentUser]);

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

  async function onRefresh() {
    setRefreshing(true);
    await refreshPosts();
    setRefreshing(false);
  }

  function handleSendComment(postId: string) {
    const role = currentUser?.role || "USER";
    if (!rolePermissions[role]?.canComment) {
      Alert.alert("الصلاحيات", "صلاحية التعليق غير مفعّلة لرتبتك الحالية من طرف الإدارة.");
      return;
    }
    if (!commentText.trim()) return;
    const foundBanned = bannedWords.find((w) => commentText.toLowerCase().includes(w.toLowerCase()));
    if (foundBanned) {
      Alert.alert("فلتر الأمان التلقائي 🛡️", "يحتوي تعليقك على كلمة محظورة من إدارة التطبيق.");
      return;
    }
    addComment(postId, commentText);
    setCommentText("");
  }

  function openPostMenu(post: Post) {
    Alert.alert("خيارات المنشور", `منشور بواسطة ${post.author.name}`, [
      {
        text: "🚩 إبلاغ عن محتوى مخالف",
        onPress: () => {
          reportPost(post.id, "محتوى مخالف");
          Alert.alert("شكراً لك", "تم استلام بلاغك وسيتم مراجعته فوراً.");
        },
      },
      {
        text: "🚫 حظر المستخدم",
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
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <AuroraBackground theme={theme} height={300} />

      <FlatList
        data={displayedPosts}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 18 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View>
            {/* SHAHINAZ Obsidian Couture Signature Top Header */}
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.9}
                delayLongPress={1400}
                onLongPress={() => setDevVaultOpen(true)}
                style={styles.brandGroup}
              >
                <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.brandCrest}>
                  <Ionicons name="diamond" size={16} color={theme.btnText} />
                </LinearGradient>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.brand, { color: theme.text }]}>SHAHINAZ</Text>
                  <Text style={{ color: theme.primary, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, marginTop: -2 }}>
                    ROYAL 5.0
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.headerRight}>
                <TouchableOpacity
                  style={[
                    styles.streakPill,
                    {
                      backgroundColor: theme.primarySoft,
                      borderColor: claimedStreakToday ? theme.border : theme.borderGlow,
                    },
                  ]}
                  onPress={() => setStreakOpen(true)}
                >
                  <Ionicons name="flame" size={13} color={theme.primary} />
                  <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: "900" }}>{streakDays}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.glassIconBtn, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
                  onPress={() => setThemeOpen(true)}
                >
                  <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.glassIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setWalletOpen(true)}
                >
                  <Ionicons name="card-outline" size={18} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.glassIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setSettingsOpen(true)}
                  accessibilityLabel="الإعدادات"
                >
                  <Ionicons name="settings-outline" size={18} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.glassIconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => {
                    setNotifOpen(true);
                    markAllNotificationsRead();
                  }}
                  accessibilityLabel="الإشعارات"
                >
                  <Ionicons name="notifications-outline" size={18} color={theme.text} />
                  {unreadNotifs > 0 && <View style={[styles.redDot, { backgroundColor: theme.heart }]} />}
                </TouchableOpacity>
              </View>
            </View>

            {!!announcement && (
              <LinearGradient
                colors={theme.cardHighlight}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.announceBox, { borderColor: theme.borderGlow }]}
              >
                <Ionicons name="megaphone" size={15} color={theme.primary} />
                <Text style={[styles.announceText, { color: theme.text }]}>{announcement}</Text>
              </LinearGradient>
            )}

            {/* Signature SHAHINAZ Tall Squircle Portrait Story Cards + LIVE Card */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesRow}
            >
              {/* SHAHINAZ LIVE Broadcast Card */}
              <TouchableOpacity activeOpacity={0.88} onPress={() => setLiveOpen(true)}>
                <LinearGradient
                  colors={["#EF4444", "#F97316", "#F59E0B"]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.storyCardFrame}
                >
                  <View style={[styles.storyCardInner, { backgroundColor: "#14070B" }]}>
                    <LinearGradient colors={["rgba(239,68,68,0.45)", "rgba(5,6,11,0.9)"]} style={StyleSheet.absoluteFillObject} />
                    <View
                      style={{
                        position: "absolute",
                        top: 7,
                        flexDirection: "row-reverse",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: "rgba(220,38,38,0.92)",
                        paddingHorizontal: 7,
                        paddingVertical: 2.5,
                        borderRadius: 999,
                      }}
                    >
                      <PulseDot color="#fff" size={6} />
                      <Text style={{ color: "#fff", fontSize: 9, fontWeight: "900" }}>LIVE</Text>
                    </View>
                    <Ionicons name="videocam" size={24} color="#FCA5A5" style={{ marginBottom: 4 }} />
                    <Text style={styles.storyCardLabel}>بث مباشر</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Add My Story Luxury Card */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.storyCardOuter, { borderColor: theme.borderGlow, backgroundColor: theme.surface }]}
                onPress={() => setNewStoryOpen(true)}
              >
                <View style={styles.storyCardInner}>
                  {currentUser?.avatarUri ? (
                    <Image source={{ uri: currentUser.avatarUri }} style={styles.storyCardBg} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={theme.coverGrad} style={styles.storyCardBg} />
                  )}
                  <LinearGradient
                    colors={["rgba(0,0,0,0.15)", "rgba(0,0,0,0.82)"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <LinearGradient colors={theme.btnGrad} style={styles.myStoryPlusOrb}>
                    <Ionicons name="add" size={18} color={theme.btnText} />
                  </LinearGradient>
                  <Text style={styles.storyCardLabel}>قصتك</Text>
                </View>
              </TouchableOpacity>

              {stories.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  activeOpacity={0.88}
                  onPress={() => {
                    markStorySeen(st.id);
                    setActiveStory(st);
                  }}
                >
                  <LinearGradient
                    colors={!st.seen ? theme.storyGrad : [theme.border, theme.border]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.storyCardFrame}
                  >
                    <View style={[styles.storyCardInner, { backgroundColor: theme.bgAlt }]}>
                      {st.imageUri ? (
                        <Image source={{ uri: st.imageUri }} style={styles.storyCardBg} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={theme.coverGrad} style={styles.storyCardBg} />
                      )}
                      <LinearGradient
                        colors={["rgba(0,0,0,0.22)", "transparent", "rgba(0,0,0,0.85)"]}
                        style={StyleSheet.absoluteFillObject}
                      />
                      <View style={[styles.storyMiniAvatarWrap, { borderColor: !st.seen ? theme.primary : theme.border }]}>
                        {st.avatarUri ? (
                          <Image source={{ uri: st.avatarUri }} style={styles.storyMiniAvatar} />
                        ) : (
                          <Text style={{ fontSize: 13 }}>{st.avatarEmoji}</Text>
                        )}
                      </View>
                      <Text style={styles.storyCardLabel} numberOfLines={1}>
                        {st.userName}
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Luxury Feature Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 14, gap: 8, paddingTop: 4, paddingBottom: 4 }}
            >
              <TouchableOpacity
                style={[styles.quickHubPill, { backgroundColor: "rgba(239,68,68,0.14)", borderColor: "rgba(239,68,68,0.45)" }]}
                onPress={() => setLiveOpen(true)}
              >
                <PulseDot color="#EF4444" size={7} />
                <Text style={{ color: "#FCA5A5", fontSize: 11.5, fontWeight: "900" }}>بث مباشر</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickHubPill, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
                onPress={() => setWalletOpen(true)}
              >
                <Ionicons name="card-outline" size={14} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 11.5, fontWeight: "800" }}>
                  محفظتي ({currentUser?.points ?? 150} 🪙)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickHubPill, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setAiOpen(true)}
              >
                <Ionicons name="sparkles" size={13} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 11.5, fontWeight: "800" }}>استوديو AI</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickHubPill, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => setThemeOpen(true)}
              >
                <Ionicons name="color-palette" size={14} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: 11.5, fontWeight: "800" }}>6 ثيمات ملكية</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Floating Frosted Segmented Feed Switcher */}
            <View style={[styles.feedTabsCapsule, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {(
                [
                  { id: "foryou", label: "لك ✨" },
                  { id: "following", label: "المتابَعون" },
                  { id: "trending", label: "ترند 🔥" },
                ] as const
              ).map((tab) => {
                const active = feedMode === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.feedTabTouch}
                    activeOpacity={0.85}
                    onPress={() => setFeedMode(tab.id)}
                  >
                    {active ? (
                      <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.feedTabActiveGrad}>
                        <Text style={{ color: theme.btnText, fontSize: 12.5, fontWeight: "900" }}>{tab.label}</Text>
                      </LinearGradient>
                    ) : (
                      <Text style={{ color: theme.muted, fontSize: 12.5, fontWeight: "700" }}>{tab.label}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.postCard,
              {
                backgroundColor: theme.surface,
                borderColor: item.isPinned || item.isSponsored ? theme.borderGlow : theme.border,
              },
            ]}
          >
            {/* Card Author Header */}
            <View style={styles.postHeader}>
              <TouchableOpacity
                style={styles.authorRow}
                activeOpacity={0.8}
                onPress={() => setSelectedAuthorId(item.author.id)}
              >
                <LinearGradient colors={theme.storyGrad} style={styles.miniRing}>
                  {item.author.avatarUri ? (
                    <Image source={{ uri: item.author.avatarUri }} style={styles.postAvatar} />
                  ) : (
                    <View style={[styles.postAvatarFallback, { backgroundColor: theme.surface2 }]}>
                      <Text style={{ fontSize: 16 }}>{item.author.avatarEmoji}</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                    <Text style={[styles.authorName, { color: theme.text }]}>{item.author.name}</Text>
                    {item.author.verified && <Ionicons name="checkmark-circle" size={14} color={theme.verified} />}
                    {item.isPinned && (
                      <View style={[styles.pinnedPill, { backgroundColor: theme.primarySoft }]}>
                        <Text style={{ color: theme.primary, fontSize: 9.5, fontWeight: "900" }}>📌 مثبّت</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: theme.muted, fontSize: 11, marginTop: 1 }}>
                    @{item.author.username} · {item.createdAt}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => openPostMenu(item)}
                style={[styles.moreBtn, { backgroundColor: theme.surface2 }]}
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={theme.muted} />
              </TouchableOpacity>
            </View>

            {/* Caption above media if short or clean below — let's keep crisp caption below media, or full gradient card */}
            {!!item.imageUri ? (
              <PostMediaWithDoubleTap
                imageUri={item.imageUri}
                location={item.location}
                createdAt={item.createdAt}
                isSponsored={item.isSponsored}
                onDoubleTapLike={() => {
                  if (!item.likedByMe) toggleLike(item.id);
                }}
              />
            ) : item.bgColor ? (
              <LinearGradient
                colors={[item.bgColor, "#0B0E17"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.coloredPostBox}
              >
                <Text style={styles.coloredPostText}>{item.content}</Text>
              </LinearGradient>
            ) : null}

            {/* Caption & Interactive Poll */}
            <View style={styles.captionWrap}>
              {!!item.content && !item.bgColor && (
                <Text style={[styles.captionText, { color: theme.text }]}>
                  <Text style={{ fontWeight: "900", color: theme.primary }}>{item.author.name}  </Text>
                  {item.content}
                </Text>
              )}

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
                          style={[
                            styles.pollOpt,
                            { backgroundColor: theme.surface2, borderColor: voted ? theme.primary : theme.border },
                          ]}
                          onPress={() => votePoll(item.id, opt.id)}
                        >
                          {item.poll!.votedOptionId && (
                            <View
                              style={[
                                StyleSheet.absoluteFillObject,
                                { width: `${pct}%`, backgroundColor: theme.primarySoft, borderRadius: 12 },
                              ]}
                            />
                          )}
                          <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700" }}>
                            {voted ? "✓ " : ""}
                            {opt.label}
                          </Text>
                          {item.poll!.votedOptionId && (
                            <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 12 }}>{pct}%</Text>
                          )}
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              )}
            </View>

            {/* Tactile Luxury Frosted Action Pills Bar */}
            <View style={styles.actionBar}>
              <View style={styles.actionLeft}>
                <TouchableOpacity
                  onPress={() => toggleLike(item.id)}
                  onLongPress={() => {
                    setGiftPostId(null);
                    setReactionPostId(reactionPostId === item.id ? null : item.id);
                  }}
                  delayLongPress={250}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: item.likedByMe ? "rgba(251,55,91,0.16)" : theme.surface2,
                      borderColor: item.likedByMe ? "rgba(251,55,91,0.45)" : theme.border,
                    },
                  ]}
                >
                  {item.myReaction && item.myReaction !== "❤️" ? (
                    <Text style={{ fontSize: 16 }}>{item.myReaction}</Text>
                  ) : (
                    <Ionicons
                      name={item.likedByMe ? "heart" : "heart-outline"}
                      size={18}
                      color={item.likedByMe ? theme.heart : theme.text}
                    />
                  )}
                  <Text style={{ color: item.likedByMe ? theme.heart : theme.text, fontSize: 12, fontWeight: "800" }}>
                    {item.likes.toLocaleString("fr-DZ")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setCommentingPostId(commentingPostId === item.id ? null : item.id)}
                  style={[styles.actionPill, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: "800" }}>{item.comments.length}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setReactionPostId(null);
                    setGiftPostId(giftPostId === item.id ? null : item.id);
                  }}
                  style={[
                    styles.actionPill,
                    {
                      backgroundColor: giftPostId === item.id ? theme.primarySoft : theme.surface2,
                      borderColor: giftPostId === item.id ? theme.borderGlow : theme.border,
                    },
                  ]}
                >
                  <Ionicons name="gift-outline" size={17} color={theme.primary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => Share.share({ message: `${item.author.name} على SHAHINAZ:\n${item.content}` })}
                  style={[styles.actionPill, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                >
                  <Ionicons name="paper-plane-outline" size={16} color={theme.text} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => toggleSave(item.id)}
                style={[
                  styles.actionPill,
                  {
                    backgroundColor: item.savedByMe ? theme.primarySoft : theme.surface2,
                    borderColor: item.savedByMe ? theme.borderGlow : theme.border,
                  },
                ]}
              >
                <Ionicons
                  name={item.savedByMe ? "bookmark" : "bookmark-outline"}
                  size={17}
                  color={item.savedByMe ? theme.primary : theme.text}
                />
              </TouchableOpacity>
            </View>

            {/* Floating 5-Emoji Multi-Reaction Picker */}
            {reactionPostId === item.id && (
              <View style={[styles.reactionPill, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
                {REACTIONS.map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={[styles.reactionItem, item.myReaction === em && { backgroundColor: theme.primarySoft }]}
                    onPress={() => {
                      setReaction(item.id, em);
                      setReactionPostId(null);
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{em}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Creator Gift Strip */}
            {giftPostId === item.id && (
              <View style={[styles.giftStrip, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
                <Text style={{ color: theme.primary, fontSize: 11.5, fontWeight: "800", textAlign: "right", marginBottom: 8 }}>
                  🎁 ادعم {item.author.name} بهدية فورية (رصيدك: {currentUser?.points ?? 150} 🪙)
                </Text>
                <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                  {GIFT_TIERS.map((g) => (
                    <TouchableOpacity
                      key={g.emoji}
                      style={[styles.giftBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                      onPress={() => {
                        const res = sendPostGift(item.id, g.emoji, g.cost);
                        setGiftPostId(null);
                        if (!res.ok) {
                          Alert.alert("رصيد النقاط غير كافٍ", res.message, [
                            { text: "إغلاق", style: "cancel" },
                            { text: "اجمع نقاط مجانية 🔥", onPress: () => setStreakOpen(true) },
                          ]);
                        } else {
                          Alert.alert("تم الإرسال 🎉", res.message);
                        }
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
                      <Text style={{ color: theme.text, fontSize: 11, fontWeight: "800" }}>{g.label}</Text>
                      <Text style={{ color: theme.primary, fontSize: 10.5, fontWeight: "900" }}>{g.cost} 🪙</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Inline Comments Section */}
            {commentingPostId === item.id && (
              <View style={[styles.commentsBox, { borderTopColor: theme.border }]}>
                {item.comments.map((c) => (
                  <Text key={c.id} style={[styles.commentLine, { color: theme.text }]}>
                    <Text style={{ fontWeight: "900", color: theme.primary }}>{c.userName} </Text>
                    {c.text}
                  </Text>
                ))}
                <View style={[styles.commentInputRow, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                  <TextInput
                    style={[styles.commentInput, { color: theme.text }]}
                    placeholder="اكتب تعليقاً راقياً..."
                    placeholderTextColor={theme.muted}
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity onPress={() => handleSendComment(item.id)}>
                    <Text style={{ color: theme.primary, fontWeight: "900", fontSize: 13 }}>نشر</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
      />

      {/* Full-Screen Animated Story Viewer */}
      <Modal visible={!!activeStory} animationType="fade" onRequestClose={() => setActiveStory(null)}>
        <TouchableWithoutFeedback onPress={() => setActiveStory(null)}>
          <View style={styles.fullStoryScreen}>
            {activeStory?.imageUri ? (
              <Image source={{ uri: activeStory.imageUri }} style={styles.fullStoryBg} resizeMode="cover" />
            ) : (
              <LinearGradient colors={theme.coverGrad} style={styles.fullStoryBg} />
            )}
            <LinearGradient
              colors={["rgba(0,0,0,0.65)", "transparent", "rgba(0,0,0,0.84)"]}
              style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.storyProgressTrack}>
              <Animated.View
                style={[
                  styles.storyProgressFill,
                  {
                    backgroundColor: theme.primary,
                    width: storyProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>

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

            <View style={styles.fullStoryCaptionBox}>
              {!!activeStory?.text && <Text style={styles.fullStoryCaption}>{activeStory.text}</Text>}
              {!!storyReactionMsg && (
                <Text style={{ color: theme.primary, textAlign: "center", fontWeight: "800", fontSize: 13, marginTop: 8 }}>
                  {storyReactionMsg}
                </Text>
              )}
              <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginTop: 14 }}>
                {["❤️", "🔥", "👏", "😍"].map((em) => (
                  <TouchableOpacity
                    key={em}
                    style={styles.storyReactBtn}
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
          <View style={[styles.modalBox, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>✨ إضافة قصة جديدة</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="اكتب تعليقاً لقصتك..."
              placeholderTextColor={theme.muted}
              value={storyText}
              onChangeText={setStoryText}
            />
            {storyImg && <Image source={{ uri: storyImg }} style={{ width: "100%", height: 180, borderRadius: 16, marginBottom: 10 }} />}
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity style={[styles.outlineBtn, { backgroundColor: theme.surface2 }]} onPress={pickStoryImage}>
                <Text style={{ color: theme.text, fontWeight: "800" }}>🖼️ صورة</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
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
                <LinearGradient colors={theme.btnGrad} style={styles.primaryBtn}>
                  <Text style={{ color: theme.btnText, fontWeight: "900" }}>نشر القصة</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: 12, alignItems: "center" }} onPress={() => setNewStoryOpen(false)}>
              <Text style={{ color: theme.muted, fontWeight: "700" }}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Sheet */}
      <Modal visible={notifOpen} transparent animationType="slide" onRequestClose={() => setNotifOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>🔔 النشاط والإشعارات</Text>
            <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
              {notifications.map((n) => (
                <View key={n.id} style={[styles.notifRow, { borderBottomColor: theme.border }]}>
                  <Text style={{ fontSize: 18 }}>{n.emoji}</Text>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: theme.text, fontSize: 13, textAlign: "right" }}>{n.text}</Text>
                    <Text style={{ color: theme.muted, fontSize: 11 }}>{n.time}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity activeOpacity={0.88} onPress={() => setNotifOpen(false)} style={{ marginTop: 14 }}>
              <LinearGradient colors={theme.btnGrad} style={[styles.primaryBtn, { flex: 0 }]}>
                <Text style={{ color: theme.btnText, fontWeight: "900" }}>إغلاق</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Author Quick-Profile Modal */}
      <Modal visible={!!selectedAuthor} transparent animationType="fade" onRequestClose={() => setSelectedAuthorId(null)}>
        <View style={styles.modalBackdrop}>
          {selectedAuthor && (
            <View style={[styles.modalBox, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ color: theme.primary, fontSize: 12.5, fontWeight: "800" }}>@{selectedAuthor.username}</Text>
                <TouchableOpacity onPress={() => setSelectedAuthorId(null)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>
              <View style={{ alignItems: "center", gap: 8 }}>
                <LinearGradient colors={theme.storyGrad} style={{ width: 82, height: 82, borderRadius: 28, padding: 3 }}>
                  {selectedAuthor.avatarUri ? (
                    <Image source={{ uri: selectedAuthor.avatarUri }} style={{ width: "100%", height: "100%", borderRadius: 25 }} />
                  ) : (
                    <View style={{ flex: 1, borderRadius: 25, backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ fontSize: 32 }}>{selectedAuthor.avatarEmoji}</Text>
                    </View>
                  )}
                </LinearGradient>
                <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{selectedAuthor.name}</Text>
                  {selectedAuthor.verified && <Ionicons name="checkmark-circle" size={16} color={theme.verified} />}
                </View>
                {!!selectedAuthor.bio && (
                  <Text style={{ color: theme.muted, fontSize: 13, textAlign: "center" }}>{selectedAuthor.bio}</Text>
                )}
                <View style={{ flexDirection: "row-reverse", gap: 28, marginVertical: 8 }}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>
                      {selectedAuthor.followers.toLocaleString("fr-DZ")}
                    </Text>
                    <Text style={{ color: theme.muted, fontSize: 11.5 }}>متابِع</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: theme.text, fontWeight: "900", fontSize: 16 }}>{selectedAuthor.following}</Text>
                    <Text style={{ color: theme.muted, fontSize: 11.5 }}>يتابِع</Text>
                  </View>
                </View>

                {selectedAuthor.id !== currentUser?.id && (
                  <View style={{ flexDirection: "row-reverse", gap: 8, width: "100%", marginTop: 6 }}>
                    <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleFollowUser(selectedAuthor.id)}>
                      {followingUserIds.includes(selectedAuthor.id) ? (
                        <View style={[styles.outlineBtn, { backgroundColor: theme.surface2 }]}>
                          <Text style={{ color: theme.text, fontWeight: "800" }}>متابَع ✓</Text>
                        </View>
                      ) : (
                        <LinearGradient colors={theme.btnGrad} style={styles.primaryBtn}>
                          <Text style={{ color: theme.btnText, fontWeight: "900" }}>متابعة +</Text>
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.outlineBtn, { backgroundColor: theme.surface2, borderWidth: 0.8, borderColor: theme.danger }]}
                      onPress={() => {
                        blockUser(selectedAuthor.id);
                        setSelectedAuthorId(null);
                        Alert.alert("تم الحظر", `تم حظر ${selectedAuthor.name} بنجاح.`);
                      }}
                    >
                      <Text style={{ color: theme.danger, fontWeight: "800" }}>حظر 🚫</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Luxury Quick Settings Sheet */}
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={styles.sheetBackdrop}>
          <View style={[styles.settingsSheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.settingsHeader}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                <Ionicons name="settings-outline" size={20} color={theme.primary} />
                <Text style={[styles.settingsTitle, { color: theme.text }]}>الإعدادات والخصوصية</Text>
              </View>
              <TouchableOpacity onPress={() => setSettingsOpen(false)} style={[styles.sheetCloseBtn, { backgroundColor: theme.surface2 }]}>
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 14 }}>
              {currentUser && (
                <View style={[styles.accountMiniCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {currentUser.avatarUri ? (
                    <Image source={{ uri: currentUser.avatarUri }} style={styles.miniAvatar} />
                  ) : (
                    <View style={[styles.miniAvatarFallback, { backgroundColor: theme.surface2 }]}>
                      <Ionicons name="person" size={22} color={theme.muted} />
                    </View>
                  )}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 5 }}>
                      <Text style={{ color: theme.text, fontWeight: "900", fontSize: 15 }}>{currentUser.name}</Text>
                      {currentUser.verified && <Ionicons name="checkmark-circle" size={15} color={theme.verified} />}
                    </View>
                    <Text style={{ color: theme.muted, fontSize: 12 }}>
                      @{currentUser.username} · 🪙 {currentUser.points ?? 150} نقطة
                    </Text>
                  </View>
                </View>
              )}

              {/* Direct Luxury Skin Selector */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
                onPress={() => {
                  setSettingsOpen(false);
                  setTimeout(() => setThemeOpen(true), 220);
                }}
              >
                <Ionicons name="chevron-back" size={18} color={theme.primary} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>🎨 استوديو المظهر والألوان الملكية</Text>
                  <Text style={[styles.settingSub, { color: theme.primary }]}>
                    الحالي: {theme.emoji} {theme.name}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={togglePrivateAccount}
              >
                <Switch value={!!currentUser?.isPrivate} onValueChange={togglePrivateAccount} />
                <View style={{ flex: 1, alignItems: "flex-end", paddingLeft: 10 }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>حساب خاص (Private)</Text>
                  <Text style={[styles.settingSub, { color: theme.muted }]}>فقط المتابعون الموافق عليهم يشاهدون منشوراتك</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.settingRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() =>
                  Linking.openURL("https://amreamre741-pixel.github.io/SHAHINAZ/privacy.html").catch(() =>
                    Alert.alert("سياسة الخصوصية", "نحمي بياناتك بالكامل وفق معايير Google Play ومعايير سلامة المجتمع.")
                  )
                }
              >
                <Ionicons name="chevron-back" size={18} color={theme.muted} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>سياسة الخصوصية وشروط الاستخدام</Text>
                  <Text style={[styles.settingSub, { color: theme.muted }]}>معايير الأمان وحماية البيانات (Google Play)</Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.settingBlockCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>المستخدمون المحظورون</Text>
                  <Text style={{ color: theme.muted, fontWeight: "700", fontSize: 13 }}>{blockedUserIds.length}</Text>
                </View>
                {blockedUserIds.length > 0 && (
                  <View style={{ marginTop: 8, gap: 6 }}>
                    {blockedUserIds.map((uid) => {
                      const u = allUsers.find((x) => x.id === uid);
                      return (
                        <View key={uid} style={[styles.blockedItem, { borderTopColor: theme.border }]}>
                          <TouchableOpacity onPress={() => unblockUser(uid)}>
                            <Text style={{ color: theme.primary, fontSize: 12, fontWeight: "800" }}>إلغاء الحظر</Text>
                          </TouchableOpacity>
                          <Text style={{ color: theme.text, fontSize: 12.5 }}>{u ? u.name : uid}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.logoutBtn, { backgroundColor: theme.surface2 }]}
                onPress={() => {
                  setSettingsOpen(false);
                  logout();
                }}
              >
                <Ionicons name="log-out-outline" size={18} color={theme.text} />
                <Text style={{ color: theme.text, fontWeight: "800", fontSize: 14 }}>تسجيل الخروج</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.dangerBtn, { borderColor: theme.danger }]} onPress={confirmDeleteFromSettings}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
                <Text style={{ color: theme.danger, fontWeight: "800", fontSize: 14 }}>حذف الحساب نهائياً</Text>
              </TouchableOpacity>

              {/* Stealth 5-Tap Developer Entry Footer */}
              <TouchableOpacity activeOpacity={0.7} onPress={handleSecretVersionTap} style={styles.versionFooter}>
                <Text style={[styles.versionText, { color: theme.muted }]}>SHAHINAZ Ultra 5.0 · Royal Platinum</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <DailyStreakModal visible={streakOpen} onClose={() => setStreakOpen(false)} />
      <ShahinazAiModal visible={aiOpen} onClose={() => setAiOpen(false)} />
      <ThemeStudioModal visible={themeOpen} onClose={() => setThemeOpen(false)} />
      <LiveStreamModal visible={liveOpen} onClose={() => setLiveOpen(false)} />
      <WalletModal visible={walletOpen} onClose={() => setWalletOpen(false)} />

      <DevVaultModal
        visible={devVaultOpen}
        expectedPin={adminPin}
        onClose={() => setDevVaultOpen(false)}
        onUnlock={() => setAdminOpen(true)}
      />

      <Modal visible={adminOpen} animationType="slide" onRequestClose={() => setAdminOpen(false)}>
        <AdminScreen onClose={() => setAdminOpen(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  brandGroup: { flexDirection: "row-reverse", alignItems: "center", gap: 9 },
  brandCrest: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 19, fontWeight: "900", letterSpacing: 2.2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 7 },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    paddingHorizontal: 9,
    height: 35,
    borderRadius: 13,
  },
  glassIconBtn: {
    position: "relative",
    width: 35,
    height: 35,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  redDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
  },
  announceBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  announceText: { fontSize: 12, fontWeight: "700", flex: 1, textAlign: "right" },
  storiesRow: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  storyCardOuter: {
    width: 78,
    height: 104,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 2.5,
    overflow: "hidden",
  },
  storyCardFrame: {
    width: 78,
    height: 104,
    borderRadius: 24,
    padding: 2.4,
  },
  storyCardInner: {
    flex: 1,
    borderRadius: 21,
    overflow: "hidden",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 7,
  },
  storyCardBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  myStoryPlusOrb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  storyMiniAvatarWrap: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  storyMiniAvatar: { width: "100%", height: "100%" },
  storyCardLabel: { color: "#fff", fontSize: 10.5, fontWeight: "800", paddingHorizontal: 4 },
  feedTabsCapsule: {
    flexDirection: "row-reverse",
    marginHorizontal: 14,
    marginTop: 6,
    marginBottom: 14,
    padding: 4,
    borderRadius: 18,
    borderWidth: 1,
    gap: 4,
  },
  feedTabTouch: { flex: 1, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  feedTabActiveGrad: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 14 },
  postCard: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 26,
    borderWidth: 1,
    paddingBottom: 12,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  authorRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  miniRing: { width: 42, height: 42, borderRadius: 15, padding: 2, alignItems: "center", justifyContent: "center" },
  postAvatar: { width: 38, height: 38, borderRadius: 13 },
  postAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  authorName: { fontWeight: "900", fontSize: 14 },
  pinnedPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
  moreBtn: { width: 32, height: 32, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mediaWrap: {
    position: "relative",
    marginHorizontal: 10,
    height: CARD_MEDIA_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#0a0c12",
  },
  postImage: { width: "100%", height: "100%" },
  mediaFloatingTag: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(5,6,11,0.68)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  mediaFloatingTagText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  mediaTimeBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(5,6,11,0.62)",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  mediaTimeText: { color: "rgba(255,255,255,0.85)", fontSize: 10.5, fontWeight: "700" },
  heartBurst: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -46,
    marginLeft: -46,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  coloredPostBox: {
    marginHorizontal: 10,
    minHeight: 220,
    borderRadius: 20,
    padding: 26,
    justifyContent: "center",
    alignItems: "center",
  },
  coloredPostText: { color: "#fff", fontSize: 21, fontWeight: "900", textAlign: "center", lineHeight: 33 },
  captionWrap: { paddingHorizontal: 14, paddingTop: 10, gap: 6 },
  captionText: { fontSize: 13.5, lineHeight: 21, textAlign: "right" },
  pollWrap: { gap: 8, marginTop: 6 },
  pollOpt: {
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    borderWidth: 1,
    overflow: "hidden",
  },
  actionBar: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 11,
  },
  actionLeft: { flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  actionPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    height: 36,
    paddingHorizontal: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  reactionPill: {
    flexDirection: "row-reverse",
    alignSelf: "flex-end",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
  },
  reactionItem: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  giftStrip: {
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 18,
    padding: 11,
    borderWidth: 1,
  },
  giftBtn: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 9,
    alignItems: "center",
    gap: 2,
    borderWidth: 1,
  },
  commentsBox: { marginHorizontal: 14, marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, gap: 8 },
  commentLine: { fontSize: 13, textAlign: "right", lineHeight: 19 },
  commentInputRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 2,
  },
  commentInput: { flex: 1, fontSize: 13, textAlign: "right", paddingVertical: 5 },
  fullStoryScreen: { flex: 1, backgroundColor: "#000", justifyContent: "space-between" },
  fullStoryBg: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  storyProgressTrack: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.28)",
    marginTop: 48,
    marginHorizontal: 14,
    borderRadius: 2,
    overflow: "hidden",
  },
  storyProgressFill: { height: "100%" },
  fullStoryTop: {
    position: "absolute",
    top: 62,
    left: 14,
    right: 14,
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fullStoryName: { color: "#fff", fontWeight: "800", fontSize: 15 },
  fullStoryCaptionBox: { paddingHorizontal: 20, paddingBottom: 48 },
  fullStoryCaption: { color: "#fff", fontSize: 17, fontWeight: "800", textAlign: "center", lineHeight: 26 },
  storyReactBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", padding: 20 },
  modalBox: { borderRadius: 26, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: "900", textAlign: "right", marginBottom: 12 },
  modalInput: { borderRadius: 14, padding: 12, textAlign: "right", marginBottom: 10, borderWidth: 1 },
  primaryBtn: { flex: 1, borderRadius: 14, padding: 13, alignItems: "center" },
  outlineBtn: { flex: 1, borderRadius: 14, padding: 13, alignItems: "center" },
  notifRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  settingsSheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "84%",
    borderTopWidth: 1.2,
  },
  sheetHandle: {
    width: 44,
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
  settingsTitle: { fontSize: 17, fontWeight: "900" },
  sheetCloseBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  accountMiniCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 18,
    borderWidth: 1,
  },
  miniAvatar: { width: 46, height: 46, borderRadius: 16 },
  miniAvatarFallback: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  settingBlockCard: { padding: 14, borderRadius: 18, borderWidth: 1 },
  settingTitle: { fontSize: 13.5, fontWeight: "800" },
  settingSub: { fontSize: 11.5, marginTop: 2 },
  blockedItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
    borderTopWidth: 0.5,
  },
  logoutBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    padding: 14,
  },
  dangerBtn: {
    flexDirection: "row-reverse",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  versionFooter: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  versionText: { fontSize: 11.5, letterSpacing: 0.5 },
  quickHubPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
});
