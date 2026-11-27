import React, { useState } from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

      <View style={styles.tabBarWrap}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("feed")}>
            <Ionicons name={tab === "feed" ? "home" : "home-outline"} size={23} color={tab === "feed" ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.tabLabel, tab === "feed" && styles.active]}>الرئيسية</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("explore")}>
            <Ionicons name={tab === "explore" ? "compass" : "compass-outline"} size={24} color={tab === "explore" ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.tabLabel, tab === "explore" && styles.active]}>استكشاف</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.centerBtnWrap} activeOpacity={0.85} onPress={() => setTab("create")}>
            <LinearGradient colors={["#8b5cf6", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.centerBtn}>
              <Ionicons name="add" size={28} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("messages")}>
            <Ionicons
              name={tab === "messages" ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
              size={23}
              color={tab === "messages" ? COLORS.primary : COLORS.muted}
            />
            <Text style={[styles.tabLabel, tab === "messages" && styles.active]}>الرسائل</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("profile")}>
            <Ionicons name={tab === "profile" ? "person" : "person-outline"} size={23} color={tab === "profile" ? COLORS.primary : COLORS.muted} />
            <Text style={[styles.tabLabel, tab === "profile" && styles.active]}>حسابي</Text>
          </TouchableOpacity>
        </View>
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
  tabBarWrap: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.96)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBtn: { flex: 1, alignItems: "center", gap: 3 },
  tabLabel: { fontSize: 10, color: COLORS.muted, fontWeight: "600" },
  active: { color: COLORS.primary },
  centerBtnWrap: { marginTop: -22, paddingHorizontal: 6 },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ec4899",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
});
