import React, { useEffect, useState } from "react";
import { AppState, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  applyOtaUpdateNow,
  checkAndDownloadOtaUpdate,
  checkServerVersionUpdate,
  type ServerVersionInfo,
} from "../services/otaUpdates";

import { useApp } from "../store/AppContext";

export default function UpdateBanner() {
  const { theme } = useApp();
  const [otaReady, setOtaReady] = useState(false);
  const [storeUpdate, setStoreUpdate] = useState<ServerVersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function runSilentChecks() {
    const ota = await checkAndDownloadOtaUpdate();
    if (ota.status === "ready") {
      setOtaReady(true);
      setDismissed(false);
    }
    const srv = await checkServerVersionUpdate();
    if (srv) {
      setStoreUpdate(srv);
    }
  }

  useEffect(() => {
    runSilentChecks();
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        runSilentChecks();
      }
    });
    return () => sub.remove();
  }, []);

  if (dismissed && !storeUpdate?.forceUpdate) return null;

  if (otaReady) {
    return (
      <LinearGradient
        colors={theme.coverGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.banner, { borderWidth: 1, borderColor: theme.borderGlow }]}
      >
        <View style={styles.row}>
          <Ionicons name="sparkles" size={18} color={theme.primary} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.title, { color: theme.text }]}>يتوفر تحديث جديد لـ SHAHINAZ ⚡</Text>
            <Text style={[styles.sub, { color: theme.muted }]}>تم تحميله تلقائياً — اضغط لتطبيقه في ثانية واحدة</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={{ flex: 1 }} onPress={applyOtaUpdateNow}>
            <LinearGradient colors={theme.btnGrad} style={styles.applyBtn}>
              <Text style={[styles.applyTxt, { color: theme.btnText }]}>تحديث الآن ⚡</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.laterBtn} onPress={() => setDismissed(true)}>
            <Text style={styles.laterTxt}>لاحقاً</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (storeUpdate) {
    return (
      <LinearGradient colors={["#0f766e", "#1d4ed8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.banner}>
        <View style={styles.row}>
          <Ionicons name="cloud-download-outline" size={20} color="#fff" />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.title}>إصدار جديد v{storeUpdate.latestVersion} متاح الآن 🚀</Text>
            {!!storeUpdate.releaseNotes && (
              <Text style={styles.sub} numberOfLines={2}>
                {storeUpdate.releaseNotes}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.applyBtn}
            onPress={() => Linking.openURL(storeUpdate.downloadUrl).catch(() => {})}
          >
            <Text style={styles.applyTxt}>تحميل التحديث ⬇️</Text>
          </TouchableOpacity>
          {!storeUpdate.forceUpdate && (
            <TouchableOpacity style={styles.laterBtn} onPress={() => setDismissed(true)}>
              <Text style={styles.laterTxt}>لاحقاً</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 10,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 10 },
  title: { color: "#fff", fontSize: 13.5, fontWeight: "800", textAlign: "right" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: 11.5, textAlign: "right", marginTop: 2 },
  actions: { flexDirection: "row-reverse", gap: 8 },
  applyBtn: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  applyTxt: { color: "#111827", fontWeight: "800", fontSize: 12.5 },
  laterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.28)",
    justifyContent: "center",
  },
  laterTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
