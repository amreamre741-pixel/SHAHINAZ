import React, { useEffect, useState } from "react";
import { Modal, Platform, StatusBar as RNStatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { AppProvider, useApp } from "./src/store/AppContext";
import { devTelemetry } from "./src/services/devTelemetry";
import AppErrorBoundary from "./src/components/AppErrorBoundary";
import DevHudOverlay from "./src/components/DevHudOverlay";
import UpdateBanner from "./src/components/UpdateBanner";
import AdminScreen from "./src/screens/AdminScreen";
import AuthScreen from "./src/screens/AuthScreen";
import FeedScreen from "./src/screens/FeedScreen";
import ExploreScreen from "./src/screens/ExploreScreen";
import CreatePostScreen from "./src/screens/CreatePostScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

type Tab = "feed" | "explore" | "create" | "messages" | "profile";

function MainApp() {
  const { currentUser, chats, theme, devHudEnabled, adminToggleDevHud } = useApp();
  const [tab, setTab] = useState<Tab>("feed");
  const [hudAdminOpen, setHudAdminOpen] = useState(false);
  const unreadMessages = chats.reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    devTelemetry.installGlobalHooks();
  }, []);

  if (!currentUser) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={theme.bg} translucent={false} />
        <DevHudOverlay
          visible={devHudEnabled}
          onOpenAdmin={() => setHudAdminOpen(true)}
          onHideHud={adminToggleDevHud}
        />
        <UpdateBanner />
        <AuthScreen />
        <Modal visible={hudAdminOpen} animationType="slide" onRequestClose={() => setHudAdminOpen(false)}>
          <AdminScreen onClose={() => setHudAdminOpen(false)} />
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.bg }]} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={theme.bg} translucent={false} />
      <DevHudOverlay
        visible={devHudEnabled}
        onOpenAdmin={() => setHudAdminOpen(true)}
        onHideHud={adminToggleDevHud}
      />
      <UpdateBanner />

      <View style={styles.body}>
        {tab === "feed" && <FeedScreen />}
        {tab === "explore" && <ExploreScreen />}
        {tab === "create" && <CreatePostScreen onDone={() => setTab("feed")} />}
        {tab === "messages" && <MessagesScreen />}
        {tab === "profile" && <ProfileScreen />}
      </View>

      {/* SHAHINAZ Obsidian Couture — Floating Glass Capsule Navigation Dock */}
      <View style={[styles.dockOuter, { backgroundColor: theme.bg }]}>
        <View
          style={[
            styles.dockCapsule,
            {
              backgroundColor: theme.dockBg,
              borderColor: theme.borderGlow,
              shadowColor: theme.primary,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.dockBtn, tab === "feed" && { backgroundColor: theme.primarySoft }]}
            onPress={() => setTab("feed")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab === "feed" ? "home" : "home-outline"}
              size={22}
              color={tab === "feed" ? theme.primary : theme.muted}
            />
            {tab === "feed" && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, tab === "explore" && { backgroundColor: theme.primarySoft }]}
            onPress={() => setTab("explore")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab === "explore" ? "compass" : "compass-outline"}
              size={24}
              color={tab === "explore" ? theme.primary : theme.muted}
            />
            {tab === "explore" && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>

          {/* Elevated Signature Center Create Orb */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => setTab("create")}
            style={[styles.orbWrap, { borderColor: theme.bg, shadowColor: theme.primary }]}
          >
            <LinearGradient
              colors={theme.btnGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.orbGrad}
            >
              <Ionicons name={tab === "create" ? "sparkles" : "add"} size={27} color={theme.btnText} />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, tab === "messages" && { backgroundColor: theme.primarySoft }]}
            onPress={() => setTab("messages")}
            activeOpacity={0.8}
          >
            <View style={{ position: "relative" }}>
              <Ionicons
                name={tab === "messages" ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                size={22}
                color={tab === "messages" ? theme.primary : theme.muted}
              />
              {unreadMessages > 0 && (
                <View style={[styles.unreadBadge, { backgroundColor: theme.heart, borderColor: theme.dockBg }]}>
                  <Text style={styles.unreadTxt}>{unreadMessages > 9 ? "9+" : unreadMessages}</Text>
                </View>
              )}
            </View>
            {tab === "messages" && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockBtn, tab === "profile" && { backgroundColor: theme.primarySoft }]}
            onPress={() => setTab("profile")}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab === "profile" ? "person" : "person-outline"}
              size={22}
              color={tab === "profile" ? theme.primary : theme.muted}
            />
            {tab === "profile" && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={hudAdminOpen} animationType="slide" onRequestClose={() => setHudAdminOpen(false)}>
        <AdminScreen onClose={() => setHudAdminOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <AppProvider>
          <MainApp />
        </AppProvider>
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 0) * 0.12 : 0,
  },
  body: { flex: 1 },
  dockOuter: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
  },
  dockCapsule: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-around",
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 14,
  },
  dockBtn: {
    width: 48,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  orbWrap: {
    marginTop: -22,
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 16,
  },
  orbGrad: {
    flex: 1,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 17,
    height: 17,
    borderRadius: 8.5,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadTxt: { color: "#fff", fontSize: 9.5, fontWeight: "900" },
});
