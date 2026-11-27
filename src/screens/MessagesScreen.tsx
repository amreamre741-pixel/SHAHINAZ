import React, { useState } from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { useApp } from "../store/AppContext";

export default function MessagesScreen() {
  const { chats, sendMessage } = useApp();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [text, setText] = useState("");

  const activeChat = chats.find((c) => c.id === activeChatId);

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
        <Ionicons name="create-outline" size={23} color={COLORS.text} />
      </View>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
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
});
