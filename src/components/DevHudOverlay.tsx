import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../store/AppContext";
import { useDevTelemetry } from "../services/devTelemetry";

interface DevHudOverlayProps {
  visible: boolean;
  onOpenAdmin: () => void;
  onHideHud: () => void;
}

export default function DevHudOverlay({ visible, onOpenAdmin, onHideHud }: DevHudOverlayProps) {
  const { theme } = useApp();
  const { errors, networkLogs } = useDevTelemetry();
  const [fps, setFps] = useState(60);
  const framesRef = useRef(0);
  const lastSecRef = useRef(Date.now());

  useEffect(() => {
    if (!visible) return;
    let rafId = 0;
    const loop = () => {
      framesRef.current += 1;
      const now = Date.now();
      if (now - lastSecRef.current >= 1000) {
        setFps(Math.min(120, Math.round((framesRef.current * 1000) / (now - lastSecRef.current))));
        framesRef.current = 0;
        lastSecRef.current = now;
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [visible]);

  if (!visible) return null;

  const lastNet = networkLogs[0];
  const errCount = errors.length;

  return (
    <View style={[styles.bar, { backgroundColor: theme.dockBg, borderBottomColor: theme.borderGlow }]}>
      <TouchableOpacity onPress={onHideHud} style={styles.miniBtn}>
        <Ionicons name="close" size={14} color={theme.muted} />
      </TouchableOpacity>

      <View style={styles.metrics}>
        <View style={[styles.chip, { backgroundColor: theme.surface2 }]}>
          <View style={[styles.dot, { backgroundColor: fps >= 45 ? theme.success : theme.warn }]} />
          <Text style={[styles.txt, { color: theme.text }]}>{fps} FPS</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: theme.surface2 }]}>
          <View style={[styles.dot, { backgroundColor: errCount > 0 ? theme.danger : theme.success }]} />
          <Text style={[styles.txt, { color: errCount > 0 ? theme.danger : theme.text }]}>{errCount} ERR</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: theme.surface2 }]}>
          <Text style={[styles.txt, { color: theme.primary }]}>{lastNet ? `${lastNet.durationMs}ms` : "API OK"}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onOpenAdmin} activeOpacity={0.85}>
        <LinearGradient colors={theme.btnGrad} style={styles.openBtn}>
          <Ionicons name="shield-checkmark" size={12} color={theme.btnText} />
          <Text style={[styles.openTxt, { color: theme.btnText }]}>DevOS</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniBtn: { padding: 4 },
  metrics: { flexDirection: "row", alignItems: "center", gap: 7 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { fontSize: 10.5, fontWeight: "800" },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openTxt: { fontSize: 10.5, fontWeight: "900" },
});
