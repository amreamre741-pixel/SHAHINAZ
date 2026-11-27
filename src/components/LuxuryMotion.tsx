import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { AppTheme } from "../theme";

/**
 * Silky 1.15s Flagship Royal Entrance Splash Reveal
 */
export function AnimatedSplashGate({ theme }: { theme: AppTheme }) {
  const [done, setDone] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.65)).current;
  const ringScale = useRef(new Animated.Value(0.6)).current;
  const ringOpacity = useRef(new Animated.Value(0.85)).current;
  const textSlide = useRef(new Animated.Value(14)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const rootOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
        Animated.timing(ringScale, { toValue: 1.55, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 0, duration: 720, useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 480, useNativeDriver: true }),
      ]),
      Animated.delay(340),
      Animated.timing(rootOpacity, { toValue: 0, duration: 320, useNativeDriver: true }),
    ]).start(() => setDone(true));
  }, []);

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        styles.splashRoot,
        { backgroundColor: theme.bg, opacity: rootOpacity },
      ]}
    >
      <LinearGradient colors={theme.auroraTop} style={StyleSheet.absoluteFillObject} />
      <View style={styles.emblemStack}>
        <Animated.View
          style={[
            styles.haloRing,
            {
              borderColor: theme.primary,
              opacity: ringOpacity,
              transform: [{ scale: ringScale }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient colors={theme.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.crestBox}>
            <Ionicons name="diamond" size={38} color={theme.btnText} />
          </LinearGradient>
        </Animated.View>
      </View>

      <Animated.View style={{ alignItems: "center", opacity: textOpacity, transform: [{ translateY: textSlide }] }}>
        <Text style={[styles.wordmark, { color: theme.text }]}>SHAHINAZ</Text>
        <Text style={[styles.edition, { color: theme.primary }]}>✦ ROYAL PLATINUM · ULTRA 5.0 ✦</Text>
      </Animated.View>
    </Animated.View>
  );
}

/**
 * Breathing Live Indicator Dot (60fps native driver)
 */
export function PulseDot({ color = "#EF4444", size = 8 }: { color?: string; size?: number }) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 650, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: pulse,
        transform: [{ scale: pulse }],
      }}
    />
  );
}

const styles = StyleSheet.create({
  splashRoot: {
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  emblemStack: {
    alignItems: "center",
    justifyContent: "center",
    width: 110,
    height: 110,
  },
  haloRing: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 34,
    borderWidth: 2,
  },
  crestBox: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { fontSize: 30, fontWeight: "900", letterSpacing: 7 },
  edition: { fontSize: 10.5, fontWeight: "900", letterSpacing: 1.8, marginTop: 6 },
});
