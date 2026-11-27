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
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";
import type { NoteItem } from "../types";

export default function MessagesScreen() {
  const {
    currentUser,
    allUsers,
    chats,
    notes,
    markChatRead,
    startChatWithUser,
    sendMessage,
    setMyNote,
  } = useApp();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [noteModal, setNoteModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [newChatModal, setNewChatModal] = useState(false);
  const [replyNote, setReplyNote] = useState<NoteItem | null>(null);
  const [replyText, setReplyText] = useState("");
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId);
  const myNote = notes.find((n) => n.userId === currentUser?.id);
  const friendsNotes = notes.filter((n) => n.userId !== currentUser?.id);
  const otherUsers = allUsers.filter((u) => u.id !== currentUser?.id);

  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
    };
  }, []);

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
      quality: 0.8,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      sendMessage(activeChat.id, "", res.assets[0].uri);
    }
  }

  function handleToggleRecordVoice() {
    if (!activeChat) return;
    if (!recording) {
      setRecording(true);
      setRecSeconds(1);
      recTimerRef.current = setInterval(() => {
        setRecSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      const mins = Math.floor(recSeconds / 60);
      const secs = String(recSeconds % 60).padStart(2, "0");
      sendMessage(activeChat.id, `🎙️ رسالة صوتية (${mins}:${secs})`);
      setRecording(false);
      setRecSeconds(0);
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
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity
            onPress={() => {
              if (recTimerRef.current) clearInterval(recTimerRef.current);
              setRecording(false);
              setActiveChatId(null);
            }}
            style={{ padding: 4 }}
          >
            <Ionicons name="arrow-forward" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
            {activeChat.user.avatarUri ? (
              <Image source={{ uri: activeChat.user.avatarUri }} style={styles.chatAvatar} />
            ) : (
              <Text style={{ fontSize: 22 }}>{activeChat.user.avatarEmoji}</Text>
            )}
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.chatName}>{activeChat.user.name}</Text>
              <Text style={{ color: COLORS.success, fontSize: 11 }}>نشط الآن</Text>
            </View>
          </View>
        </View>

        <FlatList
          style={{ flex: 1, paddingHorizontal: 14 }}
          contentContainerStyle={{ paddingVertical: 14 }}
          data={activeChat.messages}
          keyExtractor={(m) => m.id}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 60, gap: 8 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={38} color={COLORS.muted} />
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>ابدأ المحادثة مع {activeChat.user.name} الآن 👋</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleOther]}>
              {!!item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={styles.chatImgBubble} resizeMode="cover" />
              )}
              {!!item.text && <Text style={{ color: "#fff", fontSize: 14, lineHeight: 20 }}>{item.text}</Text>}
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, marginTop: 4, textAlign: "left" }}>
                {item.time}
              </Text>
            </View>
          )}
        />

        {recording && (
          <View style={styles.recBar}>
            <View style={styles.recDot} />
            <Text style={{ color: "#fff", fontSize: 12.5, fontWeight: "700" }}>
              جاري تسجيل رسالة صوتية · 0:{String(recSeconds).padStart(2, "0")} — اضغط على الميكروفون للإرسال
            </Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.circleBtn, recording && { backgroundColor: COLORS.danger }]}
            onPress={handleToggleRecordVoice}
          >
            <Ionicons name={recording ? "stop" : "mic-outline"} size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={handlePickChatImage}>
            <Ionicons name="image-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالة..."
            placeholderTextColor={COLORS.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => {
              if (!text.trim()) return;
              sendMessage(activeChat.id, text);
              setText("");
            }}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              if (!text.trim()) return;
              sendMessage(activeChat.id, text);
              setText("");
            }}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inboxHead}>
        <Text style={styles.title}>الرسائل</Text>
        <TouchableOpacity onPress={() => setNewChatModal(true)} style={{ padding: 4 }}>
          <Ionicons name="create-outline" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          /* Instagram 24h Notes Floating Bubbles Strip */
          <View style={styles.notesWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.notesRow}>
              <TouchableOpacity
                style={styles.noteItem}
                onPress={() => {
                  setNoteDraft(myNote?.text || "");
                  setNoteModal(true);
                }}
              >
                <View style={styles.noteBubble}>
                  <Text style={styles.noteBubbleText} numberOfLines={2}>
                    {myNote ? myNote.text : "ملاحظتك +"}
                  </Text>
                </View>
                {currentUser?.avatarUri ? (
                  <Image source={{ uri: currentUser.avatarUri }} style={styles.noteAvatar} />
                ) : (
                  <View style={styles.noteAvatarFallback}>
                    <Ionicons name="person" size={26} color={COLORS.muted} />
                  </View>
                )}
                <Text style={styles.noteName}>ملاحظتك</Text>
              </TouchableOpacity>

              {friendsNotes.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={styles.noteItem}
                  activeOpacity={0.8}
                  onPress={() => {
                    setReplyNote(n);
                    setReplyText("");
                  }}
                >
                  <View style={styles.noteBubble}>
                    <Text style={styles.noteBubbleText} numberOfLines={2}>
                      {n.text}
                    </Text>
                  </View>
                  {n.avatarUri ? (
                    <Image source={{ uri: n.avatarUri }} style={styles.noteAvatar} />
                  ) : (
                    <View style={styles.noteAvatarFallback}>
                      <Text style={{ fontSize: 22 }}>{n.avatarEmoji}</Text>
                    </View>
                  )}
                  <Text style={styles.noteName} numberOfLines={1}>
                    {n.userName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.threadRow} onPress={() => openChat(item.id)}>
            {item.user.avatarUri ? (
              <Image source={{ uri: item.user.avatarUri }} style={styles.threadAvatar} />
            ) : (
              <View style={styles.threadAvatarFallback}>
                <Text style={{ fontSize: 22 }}>{item.user.avatarEmoji}</Text>
              </View>
            )}
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.threadName}>{item.user.name}</Text>
              <Text style={styles.threadLast} numberOfLines={1}>
                {item.lastMessage} · {item.time}
              </Text>
            </View>
            {item.unread > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
      />

      {/* 24h Note Composer Modal */}
      <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💬 ملاحظة لـ 24 ساعة (Notes)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="شارك حالتك أو فكرة قصيرة مع أصدقائك..."
              placeholderTextColor={COLORS.muted}
              maxLength={60}
              value={noteDraft}
              onChangeText={setNoteDraft}
            />
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setMyNote(noteDraft);
                  setNoteModal(false);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>مشاركة لـ 24 ساعة</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setNoteModal(false)}>
                <Text style={{ color: COLORS.muted, fontWeight: "600" }}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reply to Friend 24h Note Modal */}
      <Modal visible={!!replyNote} transparent animationType="fade" onRequestClose={() => setReplyNote(null)}>
        <View style={styles.modalBackdrop}>
          {replyNote && (
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>💬 ملاحظة {replyNote.userName}</Text>
              <View style={styles.quotedNote}>
                <Text style={{ color: COLORS.text, fontSize: 14, textAlign: "right" }}>"{replyNote.text}"</Text>
              </View>
              <TextInput
                style={styles.modalInput}
                placeholder={`أرسل رداً إلى ${replyNote.userName}...`}
                placeholderTextColor={COLORS.muted}
                value={replyText}
                onChangeText={setReplyText}
              />
              <View style={{ flexDirection: "row-reverse", gap: 8 }}>
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleReplyToFriendNote}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>إرسال الرد</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReplyNote(null)}>
                  <Text style={{ color: COLORS.muted, fontWeight: "600" }}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* Start New Chat Modal */}
      <Modal visible={newChatModal} transparent animationType="slide" onRequestClose={() => setNewChatModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>✉️ محادثة جديدة</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {otherUsers.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.newChatUserRow}
                  onPress={() => {
                    const cid = startChatWithUser(u);
                    setNewChatModal(false);
                    setActiveChatId(cid);
                  }}
                >
                  {u.avatarUri ? (
                    <Image source={{ uri: u.avatarUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                  ) : (
                    <Text style={{ fontSize: 20 }}>{u.avatarEmoji}</Text>
                  )}
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 14 }}>{u.name}</Text>
                    <Text style={{ color: COLORS.muted, fontSize: 11.5 }}>@{u.username}</Text>
                  </View>
                  <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { marginTop: 12, paddingVertical: 11, alignItems: "center" }]}
              onPress={() => setNewChatModal(false)}
            >
              <Text style={{ color: COLORS.text, fontWeight: "700" }}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inboxHead: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  notesWrap: { paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  notesRow: { paddingHorizontal: 14, gap: 16 },
  noteItem: { alignItems: "center", width: 82 },
  noteBubble: {
    backgroundColor: COLORS.surface2,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: -10,
    zIndex: 2,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    minWidth: 74,
    alignItems: "center",
  },
  noteBubbleText: { color: COLORS.text, fontSize: 10.5, fontWeight: "600", textAlign: "center" },
  noteAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: COLORS.surface2 },
  noteAvatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  noteName: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  threadRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  threadAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surface2 },
  threadAvatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  threadName: { color: COLORS.text, fontWeight: "700", fontSize: 14.5 },
  threadLast: { color: COLORS.muted, fontSize: 12.5, marginTop: 3 },
  unreadDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: COLORS.verified },
  chatHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  chatAvatar: { width: 38, height: 38, borderRadius: 19 },
  chatName: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  bubble: { maxWidth: "78%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginBottom: 8 },
  bubbleMe: { alignSelf: "flex-start", backgroundColor: COLORS.primary },
  bubbleOther: { alignSelf: "flex-end", backgroundColor: COLORS.surface2 },
  chatImgBubble: { width: 200, height: 160, borderRadius: 12, marginBottom: 4 },
  recBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.2)",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.danger },
  inputBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: COLORS.text,
    textAlign: "right",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.78)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: COLORS.surface, borderRadius: 18, padding: 18, borderWidth: 0.5, borderColor: COLORS.border },
  modalTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", textAlign: "right", marginBottom: 12 },
  quotedNote: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  modalInput: {
    backgroundColor: COLORS.surface2,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    textAlign: "right",
    marginBottom: 14,
  },
  modalPrimaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 12, alignItems: "center" },
  modalCancelBtn: { backgroundColor: COLORS.surface2, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
  newChatUserRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
});
