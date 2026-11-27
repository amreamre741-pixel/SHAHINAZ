import React, { useEffect, useState } from "react";
import { Modal, Platform, StatusBar as RNStatusBar, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "./src/theme";
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
  const { currentUser, devHudEnabled, adminToggleDevHud } = useApp();
  const [tab, setTab] = useState<Tab>("feed");
  const [hudAdminOpen, setHudAdminOpen] = useState(false);

  useEffect(() => {
    devTelemetry.installGlobalHooks();
  }, []);

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
        <StatusBar style="light" backgroundColor={COLORS.bg} translucent={false} />
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
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="light" backgroundColor={COLORS.bg} translucent={false} />
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

      {/* Ultra-Clean Instagram AMOLED Bottom Navigation Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("feed")}>
          <Ionicons name={tab === "feed" ? "home" : "home-outline"} size={25} color={tab === "feed" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("explore")}>
          <Ionicons name={tab === "explore" ? "search" : "search-outline"} size={26} color={tab === "explore" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("create")}>
          <Ionicons name={tab === "create" ? "add-circle" : "add-circle-outline"} size={29} color={tab === "create" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("messages")}>
          <Ionicons
            name={tab === "messages" ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
            size={24}
            color={tab === "messages" ? COLORS.text : COLORS.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabBtn} onPress={() => setTab("profile")}>
          <Ionicons name={tab === "profile" ? "person-circle" : "person-circle-outline"} size={27} color={tab === "profile" ? COLORS.text : COLORS.muted} />
        </TouchableOpacity>
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
    backgroundColor: COLORS.bg,
    paddingTop: Platform.OS === "android" ? (RNStatusBar.currentHeight ?? 0) * 0.15 : 0,
  },
  body: { flex: 1 },
  tabBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: "#000000",
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
    paddingVertical: 10,
  },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
});
