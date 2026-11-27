import React, { useState } from "react";
import { FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function MessagesScreen() {
  const { currentUser, chats, notes, sendMessage, setMyNote } = useApp();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [noteModal, setNoteModal] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId);
  const myNote = notes.find((n) => n.userId === currentUser?.id);
  const friendsNotes = notes.filter((n) => n.userId !== currentUser?.id);

  if (activeChat) {
    return (
      <View style={styles.container}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setActiveChatId(null)} style={{ padding: 4 }}>
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
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={{ color: "#fff", fontSize: 14, lineHeight: 20 }}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.circleBtn} onPress={() => sendMessage(activeChat.id, "🎙️ رسالة صوتية (0:08)")}>
            <Ionicons name="mic-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.circleBtn} onPress={() => sendMessage(activeChat.id, "📷 صورة مرفقة")}>
            <Ionicons name="image-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="راسل..."
            placeholderTextColor={COLORS.muted}
            value={text}
            onChangeText={setText}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
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
        <TouchableOpacity
          onPress={() => {
            setNoteDraft(myNote?.text || "");
            setNoteModal(true);
          }}
        >
          <Ionicons name="create-outline" size={23} color={COLORS.text} />
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
                <View key={n.id} style={styles.noteItem}>
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
                </View>
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.threadRow} onPress={() => setActiveChatId(item.id)}>
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
  bubble: { maxWidth: "76%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, marginBottom: 8 },
  bubbleMe: { alignSelf: "flex-start", backgroundColor: COLORS.primary },
  bubbleOther: { alignSelf: "flex-end", backgroundColor: COLORS.surface2 },
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
});
