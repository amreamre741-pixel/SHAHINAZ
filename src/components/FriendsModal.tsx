import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import { apiFetch } from "../services/api";
import type { User } from "../types";

interface DirectoryUser {
  id: string;
  name: string;
  username: string;
  bio: string;
  avatarUrl?: string;
  verified?: boolean;
  friendStatus: "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS";
  requestId?: string | null;
}

interface FriendEntry {
  requestId: string;
  user: {
    id: string;
    name: string;
    username: string;
    bio: string;
    avatarUrl?: string;
    verified?: boolean;
  };
}

interface FriendsModalProps {
  visible: boolean;
  onClose: () => void;
  onStartChat?: (user: User) => void;
}

export default function FriendsModal({ visible, onClose, onStartChat }: FriendsModalProps) {
  const { token, theme, startChatWithUser } = useApp();
  const [tab, setTab] = useState<"search" | "requests" | "friends">("search");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [incoming, setIncoming] = useState<FriendEntry[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadAll(searchQuery = q) {
    if (!token) {
      setErrorMsg("يرجى تسجيل الدخول بحساب أونلاين لإضافة الأصدقاء الحقيقيين.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const [usersRes, friendsRes] = await Promise.all([
        apiFetch<DirectoryUser[]>(`/api/users?q=${encodeURIComponent(searchQuery.trim())}`, token),
        apiFetch<{ friends: FriendEntry[]; incoming: FriendEntry[]; outgoing: FriendEntry[] }>("/api/friends", token),
      ]);
      setDirectory(Array.isArray(usersRes) ? usersRes : []);
      setFriends(friendsRes?.friends || []);
      setIncoming(friendsRes?.incoming || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "تعذر جلب قائمة الأعضاء من السيرفر");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (visible) {
      loadAll("");
    }
  }, [visible]);

  async function handleSendRequest(userId: string) {
    if (!token) return;
    setBusyId(userId);
    try {
      const res = await apiFetch<{ ok: boolean; status: string }>(`/api/friends/request/${userId}`, token, {
        method: "POST",
      });
      await loadAll();
      if (res.status === "FRIENDS") {
        Alert.alert("🎉 أصبحتما صديقين!", "يمكنك الآن مراسلته مباشرة وإرسال رسائل صوتية.");
      }
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "تعذر إرسال طلب الصداقة");
    } finally {
      setBusyId(null);
    }
  }

  async function handleAccept(requestId: string) {
    if (!token) return;
    setBusyId(requestId);
    try {
      await apiFetch(`/api/friends/accept/${requestId}`, token, { method: "POST" });
      await loadAll();
      Alert.alert("🎉 تم قبول الصداقة!", "أصبح بإمكانكما التواصل المباشر الآن.");
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "تعذر قبول الطلب");
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveOrCancel(userId: string) {
    if (!token) return;
    setBusyId(userId);
    try {
      await apiFetch(`/api/friends/${userId}`, token, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      Alert.alert("خطأ", err instanceof Error ? err.message : "تعذر تنفيذ العملية");
    } finally {
      setBusyId(null);
    }
  }

  function openChatWith(u: { id: string; name: string; username: string; bio?: string; avatarUrl?: string; verified?: boolean }) {
    const mapped: User = {
      id: u.id,
      name: u.name,
      username: u.username,
      bio: u.bio || "",
      avatarEmoji: "👤",
      avatarUri: u.avatarUrl || undefined,
      verified: !!u.verified,
      followers: 0,
      following: 0,
    };
    startChatWithUser(mapped);
    onClose();
    if (onStartChat) onStartChat(mapped);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
          <View style={[styles.handle, { backgroundColor: theme.muted, opacity: 0.35 }]} />

          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 9 }}>
              <LinearGradient colors={theme.btnGrad} style={styles.iconPill}>
                <Ionicons name="people" size={18} color={theme.btnText} />
              </LinearGradient>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.title, { color: theme.text }]}>الأصدقاء وطلبات الصداقة</Text>
                <Text style={{ color: theme.muted, fontSize: 11 }}>متصل مباشرة بقاعدة بيانات SHAHINAZ الحقيقية</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 3-Tab Switcher */}
          <View style={[styles.tabsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {[
              { id: "search" as const, label: "🔍 إضافة صديق" },
              { id: "requests" as const, label: `📩 الطلبات (${incoming.length})` },
              { id: "friends" as const, label: `👥 أصدقائي (${friends.length})` },
            ].map((t) => {
              const active = tab === t.id;
              return (
                <TouchableOpacity key={t.id} style={styles.tabBtn} onPress={() => setTab(t.id)}>
                  {active ? (
                    <LinearGradient colors={theme.btnGrad} style={styles.tabGrad}>
                      <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>{t.label}</Text>
                    </LinearGradient>
                  ) : (
                    <Text style={{ color: theme.muted, fontSize: 11.5, fontWeight: "700" }}>{t.label}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {tab === "search" && (
            <View style={[styles.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.primary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="ابحث بالاسم أو @username..."
                placeholderTextColor={theme.muted}
                value={q}
                onChangeText={setQ}
                onSubmitEditing={() => loadAll(q)}
              />
              <TouchableOpacity onPress={() => loadAll(q)}>
                <LinearGradient colors={theme.btnGrad} style={styles.searchGoBtn}>
                  <Text style={{ color: theme.btnText, fontSize: 12, fontWeight: "900" }}>بحث</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {!!errorMsg && (
            <View style={[styles.errBox, { borderColor: theme.danger }]}>
              <Text style={{ color: theme.danger, fontSize: 12, textAlign: "right", fontWeight: "700" }}>{errorMsg}</Text>
            </View>
          )}

          {loading ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={{ color: theme.muted, fontSize: 12, marginTop: 10 }}>جاري الاتصال بقاعدة Neon...</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
              {tab === "search" &&
                (directory.length === 0 ? (
                  <Text style={{ color: theme.muted, textAlign: "center", paddingVertical: 30 }}>
                    لا يوجد أعضاء مطابقون للبحث حالياً.
                  </Text>
                ) : (
                  directory.map((u) => (
                    <View key={u.id} style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                        {u.avatarUrl ? (
                          <Image source={{ uri: u.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }]}>
                            <Ionicons name="person" size={20} color={theme.primary} />
                          </View>
                        )}
                        <View style={{ flex: 1, alignItems: "flex-end" }}>
                          <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 4 }}>
                            <Text style={{ color: theme.text, fontWeight: "900", fontSize: 13.5 }}>{u.name}</Text>
                            {u.verified && <Ionicons name="checkmark-circle" size={14} color={theme.verified} />}
                          </View>
                          <Text style={{ color: theme.muted, fontSize: 11.5 }}>@{u.username}</Text>
                        </View>
                      </View>

                      {u.friendStatus === "FRIENDS" ? (
                        <TouchableOpacity onPress={() => openChatWith(u)}>
                          <LinearGradient colors={theme.btnGrad} style={styles.actionPill}>
                            <Ionicons name="chatbubble" size={13} color={theme.btnText} />
                            <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>مراسلة</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : u.friendStatus === "PENDING_SENT" ? (
                        <TouchableOpacity
                          style={[styles.secondaryPill, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                          disabled={busyId === u.id}
                          onPress={() => handleRemoveOrCancel(u.id)}
                        >
                          <Text style={{ color: theme.muted, fontSize: 11, fontWeight: "800" }}>مُرسل ⏳ (إلغاء)</Text>
                        </TouchableOpacity>
                      ) : u.friendStatus === "PENDING_RECEIVED" && u.requestId ? (
                        <TouchableOpacity disabled={busyId === u.requestId} onPress={() => handleAccept(u.requestId!)}>
                          <LinearGradient colors={theme.btnGrad} style={styles.actionPill}>
                            <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>قبول ✓</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity disabled={busyId === u.id} onPress={() => handleSendRequest(u.id)}>
                          <LinearGradient colors={theme.btnGrad} style={styles.actionPill}>
                            <Ionicons name="person-add" size={13} color={theme.btnText} />
                            <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>إضافة</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                ))}

              {tab === "requests" &&
                (incoming.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 36, gap: 8 }}>
                    <Ionicons name="mail-open-outline" size={40} color={theme.muted} />
                    <Text style={{ color: theme.muted, fontSize: 13 }}>لا توجد طلبات صداقة واردة حالياً</Text>
                  </View>
                ) : (
                  incoming.map((req) => (
                    <View key={req.requestId} style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.borderGlow }]}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                        <View style={[styles.avatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }]}>
                          <Ionicons name="person" size={20} color={theme.primary} />
                        </View>
                        <View style={{ alignItems: "flex-end", flex: 1 }}>
                          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 13.5 }}>{req.user.name}</Text>
                          <Text style={{ color: theme.muted, fontSize: 11.5 }}>@{req.user.username}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity onPress={() => handleAccept(req.requestId)}>
                          <LinearGradient colors={theme.btnGrad} style={styles.actionPill}>
                            <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>قبول ✓</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryPill, { backgroundColor: theme.surface2, borderColor: theme.danger }]}
                          onPress={() => handleRemoveOrCancel(req.user.id)}
                        >
                          <Text style={{ color: theme.danger, fontSize: 11.5, fontWeight: "800" }}>رفض</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ))}

              {tab === "friends" &&
                (friends.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 36, gap: 8 }}>
                    <Ionicons name="people-outline" size={40} color={theme.muted} />
                    <Text style={{ color: theme.muted, fontSize: 13 }}>لم تضف أصدقاء بعد — ابحث عن أصدقائك وأضفهم الآن!</Text>
                  </View>
                ) : (
                  friends.map((f) => (
                    <View key={f.requestId} style={[styles.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10, flex: 1 }}>
                        {f.user.avatarUrl ? (
                          <Image source={{ uri: f.user.avatarUrl }} style={styles.avatar} />
                        ) : (
                          <View style={[styles.avatar, { backgroundColor: theme.surface2, alignItems: "center", justifyContent: "center" }]}>
                            <Ionicons name="person" size={20} color={theme.primary} />
                          </View>
                        )}
                        <View style={{ alignItems: "flex-end", flex: 1 }}>
                          <Text style={{ color: theme.text, fontWeight: "900", fontSize: 13.5 }}>{f.user.name}</Text>
                          <Text style={{ color: theme.muted, fontSize: 11.5 }}>@{f.user.username}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: "row", gap: 6 }}>
                        <TouchableOpacity onPress={() => openChatWith(f.user)}>
                          <LinearGradient colors={theme.btnGrad} style={styles.actionPill}>
                            <Ionicons name="chatbubble" size={13} color={theme.btnText} />
                            <Text style={{ color: theme.btnText, fontSize: 11.5, fontWeight: "900" }}>دردشة</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.secondaryPill, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                          onPress={() => handleRemoveOrCancel(f.user.id)}
                        >
                          <Ionicons name="person-remove-outline" size={15} color={theme.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: "90%",
    minHeight: "65%",
    borderTopWidth: 1.2,
  },
  handle: { width: 44, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 10 },
  header: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  iconPill: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "900" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  tabsRow: { flexDirection: "row-reverse", padding: 4, borderRadius: 16, borderWidth: 1, gap: 4, marginBottom: 12 },
  tabBtn: { flex: 1, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  tabGrad: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", borderRadius: 12 },
  searchRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, textAlign: "right", paddingVertical: 6, fontSize: 13.5 },
  searchGoBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 11 },
  errBox: { backgroundColor: "rgba(239,68,68,0.12)", borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 10 },
  userCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 16 },
  actionPill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
