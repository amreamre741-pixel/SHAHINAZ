import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ViewToken,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface ReelItem {
  id: string;
  authorName: string;
  username: string;
  verified: boolean;
  caption: string;
  videoUri: string;
  likes: number;
  likedByMe: boolean;
  location?: string;
  isRealPost?: boolean;
}

const SHOWCASE_REELS: ReelItem[] = [
  {
    id: "reel_dz_1",
    authorName: "ياسين بن علي",
    username: "yassine_dz",
    verified: true,
    caption: "أجواء خيالية في شوارع الجزائر العاصمة مع غروب الشمس 🇩🇿✨ #SHAHINAZ #ريلز #الجزائر",
    videoUri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    likes: 1842,
    likedByMe: false,
    location: "الجزائر العاصمة",
  },
  {
    id: "reel_dz_2",
    authorName: "سارة منصوري",
    username: "sara_style",
    verified: true,
    caption: "إطلالة اليوم الفاخرة — شاركوني رأيكم في التعليقات 💎🤍 #ستايل #وهران #SHAHINAZ",
    videoUri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    likes: 2310,
    likedByMe: false,
    location: "وهران",
  },
  {
    id: "reel_dz_3",
    authorName: "كريم تكنولوجي",
    username: "karim_tech",
    verified: true,
    caption: "مراجعة سريعة لأحدث الإكسسوارات الذكية — التوصيل متوفر لـ 58 ولاية 🔥📦 #تكنولوجيا #DZ",
    videoUri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    likes: 964,
    likedByMe: false,
    location: "قسنطينة",
  },
];

function ReelSlide({
  item,
  isActive,
  muted,
  onToggleMute,
  onLike,
  onGift,
  onShare,
}: {
  item: ReelItem;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onLike: () => void;
  onGift: () => void;
  onShare: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const lastTapRef = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  function handleTap() {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      if (!item.likedByMe) onLike();
      heartScale.setValue(0.3);
      heartOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, friction: 4 }),
        Animated.timing(heartOpacity, { toValue: 0, duration: 750, delay: 180, useNativeDriver: true }),
      ]).start();
    } else {
      setPaused((p) => !p);
    }
    lastTapRef.current = now;
  }

  return (
    <View style={styles.slide}>
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={StyleSheet.absoluteFillObject}>
          <Video
            source={{ uri: item.videoUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode={ResizeMode.COVER}
            shouldPlay={isActive && !paused}
            isLooping
            isMuted={muted}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.88)"]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {paused && (
            <View style={styles.pauseCenter} pointerEvents="none">
              <View style={styles.pauseOrb}>
                <Ionicons name="play" size={38} color="#fff" />
              </View>
            </View>
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartBurst,
              { opacity: heartOpacity, transform: [{ scale: heartScale }] },
            ]}
          >
            <Ionicons name="heart" size={96} color="#F43F5E" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Right Floating Glass Action Rail */}
      <View style={styles.actionRail}>
        <TouchableOpacity style={styles.railBtn} onPress={onLike} activeOpacity={0.8}>
          <View style={[styles.railOrb, item.likedByMe && { backgroundColor: "rgba(244,63,94,0.32)", borderColor: "#F43F5E" }]}>
            <Ionicons name={item.likedByMe ? "heart" : "heart-outline"} size={26} color={item.likedByMe ? "#F43F5E" : "#fff"} />
          </View>
          <Text style={styles.railCount}>{item.likes}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.railBtn} onPress={onGift} activeOpacity={0.8}>
          <View style={[styles.railOrb, { backgroundColor: "rgba(245,158,11,0.25)", borderColor: "rgba(251,191,36,0.55)" }]}>
            <Ionicons name="gift" size={24} color="#FDE68A" />
          </View>
          <Text style={styles.railCount}>هدية</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.railBtn} onPress={onShare} activeOpacity={0.8}>
          <View style={styles.railOrb}>
            <Ionicons name="share-social-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.railCount}>مشاركة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.railBtn} onPress={onToggleMute} activeOpacity={0.8}>
          <View style={styles.railOrb}>
            <Ionicons name={muted ? "volume-mute" : "volume-high"} size={23} color="#fff" />
          </View>
          <Text style={styles.railCount}>{muted ? "صامت" : "صوت"}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Creator & Caption Overlay */}
      <View style={styles.bottomInfo} pointerEvents="box-none">
        <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <Text style={styles.creatorName}>@{item.username}</Text>
          {item.verified && <Ionicons name="checkmark-circle" size={15} color="#38BDF8" />}
          {!!item.location && (
            <View style={styles.locPill}>
              <Ionicons name="location" size={11} color="#FDE68A" />
              <Text style={styles.locText}>{item.location}</Text>
            </View>
          )}
        </View>
        <Text style={styles.caption} numberOfLines={3}>
          {item.caption}
        </Text>
      </View>
    </View>
  );
}

export default function ReelsModal({
  visible,
  onClose,
  onCreateReel,
}: {
  visible: boolean;
  onClose: () => void;
  onCreateReel?: () => void;
}) {
  const { posts, toggleLike, sendLiveGift } = useApp();
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [localLikes, setLocalLikes] = useState<Record<string, boolean>>({});

  const reels = useMemo<ReelItem[]>(() => {
    const realVideos: ReelItem[] = posts
      .filter((p) => !!p.videoUri)
      .map((p) => ({
        id: p.id,
        authorName: p.author.name,
        username: p.author.username,
        verified: !!p.author.verified,
        caption: p.content || "فيديو جديد على SHAHINAZ 🎬",
        videoUri: p.videoUri!,
        likes: p.likes,
        likedByMe: p.likedByMe,
        location: p.location,
        isRealPost: true,
      }));
    return [...realVideos, ...SHOWCASE_REELS];
  }, [posts]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;

  function handleLikeReel(item: ReelItem) {
    if (item.isRealPost) {
      toggleLike(item.id);
    } else {
      setLocalLikes((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    }
  }

  function handleGiftReel(item: ReelItem) {
    const res = sendLiveGift(item.authorName, "👑", 30);
    Alert.alert(res.ok ? "تم إرسال الهدية 👑" : "تنبيه", res.message);
  }

  async function handleShareReel(item: ReelItem) {
    try {
      await Share.share({
        message: `شاهد هذا الريلز على SHAHINAZ من @${item.username}:\n${item.caption}`,
      });
    } catch {
      // cancelled
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <FlatList
          data={reels}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={SCREEN_H}
          snapToAlignment="start"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item, index }) => {
            const isLiked = item.isRealPost ? item.likedByMe : !!localLikes[item.id];
            const likeCount = item.isRealPost
              ? item.likes
              : item.likes + (localLikes[item.id] ? 1 : 0);
            return (
              <ReelSlide
                item={{ ...item, likedByMe: isLiked, likes: likeCount }}
                isActive={visible && index === activeIndex}
                muted={muted}
                onToggleMute={() => setMuted((m) => !m)}
                onLike={() => handleLikeReel(item)}
                onGift={() => handleGiftReel(item)}
                onShare={() => handleShareReel(item)}
              />
            );
          }}
        />

        {/* Top Floating Header */}
        <View style={styles.topHeader} pointerEvents="box-none">
          <TouchableOpacity onPress={onClose} style={styles.topOrb}>
            <Ionicons name="close" size={23} color="#fff" />
          </TouchableOpacity>

          <View style={styles.titlePill}>
            <Ionicons name="film" size={14} color="#FDE68A" />
            <Text style={styles.titleText}>SHAHINAZ REELS</Text>
          </View>

          <TouchableOpacity
            onPress={() => {
              onClose();
              onCreateReel?.();
            }}
            style={styles.uploadBtn}
          >
            <Ionicons name="videocam" size={15} color="#090B12" />
            <Text style={styles.uploadBtnText}>رفع ريلز</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  slide: { width: SCREEN_W, height: SCREEN_H, backgroundColor: "#05070D" },
  topHeader: {
    position: "absolute",
    top: 46,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topOrb: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  titlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(253,230,138,0.35)",
  },
  titleText: { color: "#fff", fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  uploadBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F5C451",
  },
  uploadBtnText: { color: "#090B12", fontWeight: "900", fontSize: 11.5 },
  pauseCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
  },
  heartBurst: {
    position: "absolute",
    top: SCREEN_H * 0.4,
    alignSelf: "center",
  },
  actionRail: {
    position: "absolute",
    left: 14,
    bottom: 105,
    gap: 16,
    alignItems: "center",
  },
  railBtn: { alignItems: "center", gap: 4 },
  railOrb: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(15,18,28,0.58)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  railCount: { color: "#fff", fontSize: 11.5, fontWeight: "800" },
  bottomInfo: {
    position: "absolute",
    right: 16,
    left: 78,
    bottom: 42,
    alignItems: "flex-end",
  },
  creatorName: { color: "#fff", fontWeight: "900", fontSize: 15 },
  locPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  locText: { color: "#FDE68A", fontSize: 10.5, fontWeight: "800" },
  caption: { color: "#F8FAFC", fontSize: 13.5, lineHeight: 20, textAlign: "right", fontWeight: "600" },
});
