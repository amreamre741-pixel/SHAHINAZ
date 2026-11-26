import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { COLORS } from "./src/theme";
import { AppProvider, useApp } from "./src/store/AppContext";
import AuthScreen from "./src/screens/AuthScreen";
import FeedScreen from "./src/screens/FeedScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

type Tab = "feed" | "explore" | "create" | "messages" | "profile";

function MainApp() {
  const { currentUser } = useApp();
  const [tab, setTab] = useState<Tab>("feed");

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.body}>
        {tab === "feed" && <FeedScreen />}
        {tab === "explore" && <ExploreScreen />}
        {tab === "create" && <CreatePostScreen onDone={() => setTab("feed")} />}
        {tab === "messages" && <MessagesScreen />}
        {tab === "profile" && <ProfileScreen />}
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("feed")}>
          <Text style={[styles.tabIcon, tab === "feed" && styles.active]}>🏠</Text>
          <Text style={[styles.tabLabel, tab === "feed" && styles.active]}>الرئيسية</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("explore")}>
          <Text style={[styles.tabIcon, tab === "explore" && styles.active]}>🔍</Text>
          <Text style={[styles.tabLabel, tab === "explore" && styles.active]}>استكشاف</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("create")}>
          <Text style={[styles.tabIcon, tab === "create" && styles.active]}>➕</Text>
          <Text style={[styles.tabLabel, tab === "create" && styles.active]}>نشر</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("messages")}>
          <Text style={[styles.tabIcon, tab === "messages" && styles.active]}>💬</Text>
          <Text style={[styles.tabLabel, tab === "messages" && styles.active]}>الرسائل</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("profile")}>
          <Text style={[styles.tabIcon, tab === "profile" && styles.active]}>👤</Text>
          <Text style={[styles.tabLabel, tab === "profile" && styles.active]}>حسابي</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  body: { flex: 1 },
  tabBar: {
    flexDirection: "row-reverse",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
  },
  tabBtn: { flex: 1, alignItems: "center", gap: 2 },
  tabIcon: { fontSize: 19, opacity: 0.6 },
  tabLabel: { fontSize: 11, color: COLORS.muted, fontWeight: "600" },
  active: { opacity: 1, color: COLORS.primary },
});
