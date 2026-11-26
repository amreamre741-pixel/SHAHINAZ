import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
          <TouchableOpacity onPress={() => setActiveChatId(null)}>
            <Text style={{ color: COLORS.primary, fontWeight: "700" }}>← رجوع</Text>
          </TouchableOpacity>
          <Text style={styles.chatName}>
            {activeChat.user.avatarEmoji} {activeChat.user.name}
          </Text>
        </View>
        <FlatList
          style={{ flex: 1, padding: 12 }}
          data={activeChat.messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.fromMe ? styles.bubbleMe : styles.bubbleOther]}>
              <Text style={{ color: "#fff", fontSize: 14 }}>{item.text}</Text>
            </View>
          )}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="اكتب رسالة..."
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
            <Text style={{ color: "#fff", fontWeight: "700" }}>إرسال</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💬 الرسائل</Text>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.threadCard} onPress={() => setActiveChatId(item.id)}>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>{item.user.avatarEmoji}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Text style={styles.threadName}>{item.user.name}</Text>
              <Text style={styles.threadLast} numberOfLines={1}>
                {item.lastMessage}
              </Text>
            </View>
            <Text style={styles.time}>{item.time}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 14 },
  title: { fontSize: 20, fontWeight: "700", color: COLORS.text, textAlign: "right", marginBottom: 12 },
  threadCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  threadName: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  threadLast: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
  time: { color: COLORS.muted, fontSize: 11 },
  chatHeader: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chatName: { color: COLORS.text, fontSize: 16, fontWeight: "700" },
  bubble: { maxWidth: "78%", padding: 10, borderRadius: 14, marginBottom: 8 },
  bubbleMe: { alignSelf: "flex-start", backgroundColor: COLORS.primary },
  bubbleOther: { alignSelf: "flex-end", backgroundColor: COLORS.surface2 },
  inputRow: { flexDirection: "row-reverse", gap: 8, paddingTop: 8 },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    textAlign: "right",
  },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, justifyContent: "center" },
});
