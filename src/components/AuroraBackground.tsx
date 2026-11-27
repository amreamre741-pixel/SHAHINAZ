import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { AppTheme } from "../theme";

export default function AuroraBackground({ theme, height = 280 }: { theme: AppTheme; height?: number }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { overflow: "hidden" }]}>
      <LinearGradient
        colors={theme.auroraTop}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={{ width: "100%", height }}
      />
      <View
        style={{
          position: "absolute",
          top: -70,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: theme.primarySoft,
          opacity: 0.55,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 40,
          left: -90,
          width: 190,
          height: 190,
          borderRadius: 95,
          backgroundColor: theme.accent,
          opacity: 0.08,
        }}
      />
    </View>
  );
}
