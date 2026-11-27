import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { useDevTelemetry } from "../services/devTelemetry";

interface DevHudOverlayProps {
  visible: boolean;
  onOpenAdmin: () => void;
  onHideHud: () => void;
}

export default function DevHudOverlay({ visible, onOpenAdmin, onHideHud }: DevHudOverlayProps) {
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
    <View style={styles.bar}>
      <TouchableOpacity onPress={onHideHud} style={styles.miniBtn}>
        <Ionicons name="close" size={14} color={COLORS.muted} />
      </TouchableOpacity>

      <View style={styles.metrics}>
        <View style={styles.chip}>
          <View style={[styles.dot, { backgroundColor: fps >= 45 ? COLORS.success : COLORS.warn }]} />
          <Text style={styles.txt}>{fps} FPS</Text>
        </View>
        <View style={styles.chip}>
          <View style={[styles.dot, { backgroundColor: errCount > 0 ? COLORS.danger : COLORS.success }]} />
          <Text style={[styles.txt, errCount > 0 && { color: COLORS.danger }]}>{errCount} ERR</Text>
        </View>
        <View style={styles.chip}>
          <Text style={styles.txt}>{lastNet ? `${lastNet.durationMs}ms` : "API OK"}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={onOpenAdmin} style={styles.openBtn}>
        <Ionicons name="shield-checkmark" size={13} color="#fff" />
        <Text style={styles.openTxt}>DevOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(18,12,32,0.95)",
    borderBottomWidth: 0.7,
    borderBottomColor: "rgba(168,85,247,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  miniBtn: { padding: 4 },
  metrics: { flexDirection: "row", alignItems: "center", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  txt: { color: "#e5e7eb", fontSize: 10.5, fontWeight: "700" },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  openTxt: { color: "#fff", fontSize: 10.5, fontWeight: "800" },
});
