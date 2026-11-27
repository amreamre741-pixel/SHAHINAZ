import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import type { NoteItem } from "../types";
import AuroraBackground from "../components/AuroraBackground";
import VoiceMessagePlayer from "../components/VoiceMessagePlayer";
import FriendsModal from "../components/FriendsModal";

const QUICK_REPLIES = [
  "مرحباً! 👋",
  "السعر من فضلك؟ 💰",
  "هل التوصيل متوفر لولايتي؟ 🚚",
  "تم التأكيد، شكراً! ✨",
];

export default function MessagesScreen() {
  const {
    currentUser,
    allUsers,
    chats,
    notes,
    theme,
    markChatRead,
    startChatWithUser,
    sendMessage,
    syncChatWithPeer,
    refreshThreads,
    setMyNote,
  } = useApp();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [noteModal, setNoteModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [replyNote, setReplyNote] = useState<NoteItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingObjRef = useRef<Audio.Recording | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const myNote = notes.find((n) => n.userId === currentUser?.id);
  const friendsNotes = notes.filter((n) => n.userId !== currentUser?.id);

  useEffect(() => {
    refreshThreads();
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (recordingObjRef.current) {
        recordingObjRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

  // Poll real Neon online messages every 3.5s while a chat is open
  useEffect(() => {
    if (!activeChat) return;
    syncChatWithPeer(activeChat.id, activeChat.user.id);
    const interval = setInterval(() => {
      syncChatWithPeer(activeChat.id, activeChat.user.id);
    }, 3500);
    return () => clearInterval(interval);
  }, [activeChat?.id, activeChat?.user.id]);

  function openChat(chatId: string) {
    markChatRead(chatId);
    setActiveChatId(chatId);
  }

  async function handlePickChatImage() {
    if (!activeChat) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("الصلاحية مطلوبة", "يرجى السماح بالوصول إلى الصور لإرسال صورة في المحادثة.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.65,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      let uriToSend = res.assets[0].uri;
      try {
        const b64 = await FileSystem.readAsStringAsync(uriToSend, { encoding: FileSystem.EncodingType.Base64 });
        uriToSend = `data:image/jpeg;base64,${b64}`;
      } catch {
        // fallback local uri
      }
      sendMessage(activeChat.id, "", uriToSend);
    }
  }

  // 100% REAL MICROPHONE VOICE RECORDING VIA EXPO-AV
  async function handleToggleRecordVoice() {
    if (!activeChat) return;
    if (!recording) {
      try {
        const perm = await Audio.requestPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("صلاحية الميكروفون مطلوبة", "يرجى السماح للتطبيق باستخدام الميكروفون لتسجيل الرسائل الصوتية.");
          return;
        }
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording: rec } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recordingObjRef.current = rec;
        setRecording(true);
        setRecSeconds(1);
        recTimerRef.current = setInterval(() => {
          setRecSeconds((s) => s + 1);
        }, 1000);
      } catch {
        Alert.alert("تعذر التسجيل", "تأكد من تثبيت إصدار SHAHINAZ v2.0.0 ومنح صلاحية الميكروفون.");
      }
    } else {
      try {
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        const rec = recordingObjRef.current;
        recordingObjRef.current = null;
        const dur = Math.max(1, recSeconds);
        setRecording(false);
        setRecSeconds(0);
        if (rec) {
          await rec.stopAndUnloadAsync();
          const uri = rec.getURI();
          await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
          if (uri) {
            let audioPayload = uri;
            try {
              const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
              audioPayload = `data:audio/m4a;base64,${b64}`;
            } catch {
              // keep local file uri
            }
            sendMessage(activeChat.id, "", undefined, audioPayload, dur);
          }
        }
      } catch {
        setRecording(false);
        setRecSeconds(0);
      }
    }
  }

  function handleReplyToFriendNote() {
    if (!replyNote || !replyText.trim()) return;
    const targetUser = allUsers.find((u) => u.id === replyNote.userId) || {
      id: replyNote.userId,
      name: replyNote.userName,
      username: replyNote.userName.replace(/\s+/g, "_").toLowerCase(),
      bio: "",
      avatarEmoji: replyNote.avatarEmoji,
      avatarUri: replyNote.avatarUri,
      followers: 0,
      following: 0,
    };
    const cid = startChatWithUser(targetUser);
    sendMessage(cid, `رداً على ملاحظتك "${replyNote.text}":\n${replyText.trim()}`);
    setReplyNote(null);
    setReplyText("");
    setActiveChatId(cid);
  }

  if (activeChat) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <AuroraBackground theme={theme} height={180} />
        <View style={[styles.chatHeader, { backgroundColor: theme.glass, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => {
              if (recTimerRef.current) clearInterval(recTimerRef.current);
              if (recordingObjRef.current) {
                recordingObjRef.current.stopAndUnloadAsync().catch(() => {});
                recordingObjRef.current = null;
              }
              setRecording(false);
              setActiveChatId(null);
            }}
            style={[styles.iconCircle, { backgroundColor: theme.surface2, borderColor: theme.border }]}
          >
            <Ionicons name="arrow-forward" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            <View style={{ position: "relative" }}>
              {activeChat.user.avatarUri ? (
                <Image source={{ uri: activeChat.user.avatarUri }} style={[styles.chatAvatar, { borderColor: theme.primary }]} />
              ) : (
                <View style={[styles.chatAvatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center", borderColor: theme.primary }]}>
                  <Text style={{ fontSize: 18 }}>{activeChat.user.avatarEmoji}</Text>
                </View>
              )}
              <View style={[styles.onlineDot, { backgroundColor: theme.success, borderColor: theme.bg }]} />
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                <Text style={[styles.chatName, { color: theme.text }]}>{activeChat.user.name}</Text>
                {activeChat.user.verified && <Ionicons name="checkmark-circle" size={14} color={theme.verified} />}
              </View>
              <Text style={{ color: theme.success, fontSize: 11, fontWeight: "700" }}>متصل أونلاين ●</Text>
            </View>
          </View>
        </View>

        <FlatList
          style={{ flex: 1, paddingHorizontal: 14 }}
          contentContainerStyle={{ paddingVertical: 14 }}
          data={activeChat.messages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 64, gap: 8 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.primary} />
              <Text style={{ color: theme.muted, fontSize: 13 }}>ابدأ المحادثة مع {activeChat.user.name} الآن 👋</Text>
            </View>
          }
          renderItem={({ item }) =>
            item.fromMe ? (
              <LinearGradient
                colors={theme.btnGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.bubbleMe]}
              >
                {!!item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.chatImgBubble} resizeMode="cover" />
                )}
                {!!item.audioUri && (
                  <VoiceMessagePlayer
                    uri={item.audioUri}
                    durationSec={item.durationSec}
                    accentColor="#ffffff"
                    textColor={theme.btnText}
                  />
                )}
                {!!item.text && (
                  <Text style={{ color: theme.btnText, fontSize: 14, fontWeight: "700", lineHeight: 20, textAlign: "right" }}>
                    {item.text}
                  </Text>
                )}
                <Text style={{ color: theme.btnText, opacity: 0.72, fontSize: 10, marginTop: 4, textAlign: "left" }}>
                  {item.time} ✓✓
                </Text>
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.bubbleOther, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {!!item.imageUri && (
                  <Image source={{ uri: item.imageUri }} style={styles.chatImgBubble} resizeMode="cover" />
                )}
                {!!item.audioUri && (
                  <VoiceMessagePlayer
                    uri={item.audioUri}
                    durationSec={item.durationSec}
                    accentColor={theme.primary}
                    textColor={theme.text}
                  />
                )}
                {!!item.text && (
                  <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20, textAlign: "right" }}>{item.text}</Text>
                )}
                <Text style={{ color: theme.muted, fontSize: 10, marginTop: 4, textAlign: "left" }}>
                  {item.time}
                </Text>
              </View>
            )
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 40, marginBottom: 6 }}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 7 }}
        >
          {QUICK_REPLIES.map((qr) => (
            <TouchableOpacity
              key={qr}
              style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}
              onPress={() => sendMessage(activeChat.id, qr)}
            >
              <Text style={{ color: theme.text, fontSize: 11.5, fontWeight: "700" }}>{qr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {recording && (
          <View style={[styles.recBar, { backgroundColor: "rgba(239,68,68,0.16)", borderColor: theme.danger }]}>
            <View style={[styles.recDot, { backgroundColor: theme.danger }]} />
            <Text style={{ color: theme.danger, fontSize: 12, fontWeight: "800" }}>
              🎙️ جاري تسجيل صوت حقيقي · 0:{String(recSeconds).padStart(2, "0")} — اضغط إيقاف للإرسال
            </Text>
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
          <TouchableOpacity
            style={[styles.circleBtn, { backgroundColor: recording ? theme.danger : theme.surface2 }]}
            onPress={handleToggleRecordVoice}
          >
            <Ionicons name={recording ? "stop" : "mic"} size={19} color={recording ? "#fff" : theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.surface2 }]} onPress={handlePickChatImage}>
            <Ionicons name="image-outline" size={19} color={theme.text} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="اكتب رسالة أو سجّل فويس..."
            placeholderTextColor={theme.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => {
              if (!text.trim()) return;
              sendMessage(activeChat.id, text);
              setText("");
            }}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              if (!text.trim()) return;
              sendMessage(activeChat.id, text);
              setText("");
            }}
          >
            <LinearGradient colors={theme.btnGrad} style={styles.sendBtn}>
              <Ionicons name="send" size={16} color={theme.btnText} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <AuroraBackground theme={theme} height={240} />
      <View style={styles.inboxHead}>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.title, { color: theme.text }]}>المحادثات والأصدقاء</Text>
          <Text style={{ color: theme.muted, fontSize: 11.5 }}>دردشة أونلاين · فويس حقيقي · طلبات صداقة</Text>
        </View>
        <TouchableOpacity onPress={() => setFriendsModalOpen(true)} activeOpacity={0.88}>
          <LinearGradient colors={theme.btnGrad} style={styles.addFriendBtn}>
            <Ionicons name="person-add" size={16} color={theme.btnText} />
            <Text style={{ color: theme.btnText, fontSize: 12, fontWeight: "900" }}>إضافة صديق</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListHeaderComponent={
          <View style={styles.notesWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesRow}>
              <TouchableOpacity
                style={styles.noteItem}
                onPress={() => {
                  setNoteDraft(myNote?.text || "");
                  setNoteModal(true);
                }}
              >
                <View style={[styles.noteBubble, { backgroundColor: theme.surface2, borderColor: theme.borderGlow }]}>
                  <Text style={{ color: theme.primary, fontSize: 10.5, fontWeight: "800", textAlign: "center" }} numberOfLines={2}>
                    {myNote ? myNote.text : "ملاحظتك +"}
                  </Text>
                </View>
                <LinearGradient colors={theme.storyGrad} style={styles.noteRing}>
                  {currentUser?.avatarUri ? (
                    <Image source={{ uri: currentUser.avatarUri }} style={styles.noteAvatar} />
                  ) : (
                    <View style={[styles.noteAvatarFallback, { backgroundColor: theme.surface2 }]}>
                      <Ionicons name="person" size={24} color={theme.muted} />
                    </View>
                  )}
                </LinearGradient>
                <Text style={[styles.noteName, { color: theme.text }]}>ملاحظتك</Text>
              </TouchableOpacity>

              {friendsNotes.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={styles.noteItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    setReplyNote(n);
                    setReplyText("");
                  }}
                >
                  <View style={[styles.noteBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={{ color: theme.text, fontSize: 10.5, fontWeight: "700", textAlign: "center" }} numberOfLines={2}>
                      {n.text}
                    </Text>
                  </View>
                  <LinearGradient colors={theme.storyGrad} style={styles.noteRing}>
                    {n.avatarUri ? (
                      <Image source={{ uri: n.avatarUri }} style={styles.noteAvatar} />
                    ) : (
                      <View style={[styles.noteAvatarFallback, { backgroundColor: theme.surface2 }]}>
                        <Text style={{ fontSize: 22 }}>{n.avatarEmoji}</Text>
                      </View>
                    )}
                  </LinearGradient>
                  <Text style={[styles.noteName, { color: theme.muted }]} numberOfLines={1}>
                    {n.userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.threadCard,
              {
                backgroundColor: theme.surface,
                borderColor: item.unread > 0 ? theme.borderGlow : theme.border,
              },
            ]}
            activeOpacity={0.86}
            onPress={() => openChat(item.id)}
          >
            <View style={{ position: "relative" }}>
              {item.user.avatarUri ? (
                <Image source={{ uri: item.user.avatarUri }} style={styles.threadAvatar} />
              ) : (
                <View style={[styles.threadAvatarFallback, { backgroundColor: theme.surface2 }]}>
                  <Text style={{ fontSize: 22 }}>{item.user.avatarEmoji}</Text>
                </View>
              )}
              <View style={[styles.onlineDot, { backgroundColor: theme.success, borderColor: theme.surface }]} />
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                <Text style={[styles.threadName, { color: theme.text }]}>{item.user.name}</Text>
                {item.user.verified && <Ionicons name="checkmark-circle" size={14} color={theme.verified} />}
              </View>
              <Text style={{ color: theme.muted, fontSize: 12.5, marginTop: 3 }} numberOfLines={1}>
                {item.lastMessage} · {item.time}
              </Text>
            </View>
            {item.unread > 0 && (
              <LinearGradient colors={theme.btnGrad} style={styles.unreadPill}>
                <Text style={{ color: theme.btnText, fontSize: 11, fontWeight: "900" }}>{item.unread}</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        )}
      />

      {/* 24h Note Composer Modal */}
      <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>💬 ملاحظة لـ 24 ساعة</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
              placeholder="شارك حالتك أو فكرة قصيرة مع أصدقائك..."
              placeholderTextColor={theme.muted}
              maxLength={60}
              value={noteDraft}
              onChangeText={setNoteDraft}
            />
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  setMyNote(noteDraft);
                  setNoteModal(false);
                }}
              >
                <LinearGradient colors={theme.btnGrad} style={styles.modalPrimaryBtn}>
                  <Text style={{ color: theme.btnText, fontWeight: "900" }}>مشاركة لـ 24 ساعة</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: theme.surface2 }]} onPress={() => setNoteModal(false)}>
                <Text style={{ color: theme.muted, fontWeight: "700" }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply to Friend 24h Note Modal */}
      <Modal visible={!!replyNote} transparent animationType="fade" onRequestClose={() => setReplyNote(null)}>
        <View style={styles.modalBackdrop}>
          {replyNote && (
            <View style={[styles.modalBox, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>💬 ملاحظة {replyNote.userName}</Text>
              <View style={[styles.quotedNote, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                <Text style={{ color: theme.primary, fontSize: 14, fontWeight: "700", textAlign: "right" }}>"{replyNote.text}"</Text>
              </View>
              <TextInput
                style={[styles.modalInput, { backgroundColor: theme.surface2, color: theme.text, borderColor: theme.border }]}
                placeholder={`أرسل رداً إلى ${replyNote.userName}...`}
                placeholderTextColor={theme.muted}
                value={replyText}
                onChangeText={setReplyText}
              />
              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                <TouchableOpacity style={{ flex: 1 }} onPress={handleReplyToFriendNote}>
                  <LinearGradient colors={theme.btnGrad} style={styles.modalPrimaryBtn}>
                    <Text style={{ color: theme.btnText, fontWeight: "900" }}>إرسال الرد</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: theme.surface2 }]} onPress={() => setReplyNote(null)}>
                  <Text style={{ color: theme.muted, fontWeight: "700" }}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Real Friends & Add Friend Directory Modal */}
      <FriendsModal
        visible={friendsModalOpen}
        onClose={() => setFriendsModalOpen(false)}
        onStartChat={(user) => {
          const cid = startChatWithUser(user);
          setActiveChatId(cid);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inboxHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 21, fontWeight: "900" },
  addFriendBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 14,
  },
  notesWrap: { paddingVertical: 10, marginBottom: 6 },
  notesRow: { paddingHorizontal: 14, gap: 14 },
  noteItem: { alignItems: "center", width: 84 },
  noteBubble: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: -10,
    zIndex: 2,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: "center",
    width: 82,
  },
  noteRing: {
    width: 66,
    height: 66,
    borderRadius: 24,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  noteAvatar: { width: 61, height: 61, borderRadius: 21 },
  noteAvatarFallback: { width: 61, height: 61, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  noteName: { fontSize: 11, fontWeight: "700", marginTop: 6 },
  threadCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
  },
  threadAvatar: { width: 52, height: 52, borderRadius: 18 },
  threadAvatarFallback: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
  },
  threadName: { fontWeight: "800", fontSize: 14.5 },
  unreadPill: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chatHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  iconCircle: { width: 38, height: 38, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chatAvatar: { width: 40, height: 40, borderRadius: 15, borderWidth: 1.5 },
  chatName: { fontWeight: "900", fontSize: 15 },
  bubble: {
    maxWidth: "82%",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  bubbleMe: { alignSelf: "flex-end", borderBottomRightRadius: 6 },
  bubbleOther: { alignSelf: "flex-start", borderBottomLeftRadius: 6, borderWidth: 1 },
  chatImgBubble: { width: 210, height: 170, borderRadius: 14, marginBottom: 6 },
  quickChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, justifyContent: "center" },
  recBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  recDot: { width: 9, height: 9, borderRadius: 4.5 },
  inputBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 26,
    borderWidth: 1,
  },
  circleBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  input: { flex: 1, fontSize: 14, textAlign: "right", paddingVertical: 6 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "center", padding: 20 },
  modalBox: { borderRadius: 24, padding: 18, borderWidth: 1 },
  modalTitle: { fontSize: 16, fontWeight: "900", textAlign: "right", marginBottom: 12 },
  quotedNote: { borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1 },
  modalInput: { borderRadius: 14, padding: 12, textAlign: "right", marginBottom: 12, borderWidth: 1 },
  modalPrimaryBtn: { borderRadius: 13, padding: 12, alignItems: "center" },
  modalCancelBtn: { borderRadius: 13, paddingHorizontal: 16, justifyContent: "center" },
});
