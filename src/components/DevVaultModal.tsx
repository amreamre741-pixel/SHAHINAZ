import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS } from "../theme";

interface DevVaultModalProps {
  visible: boolean;
  expectedPin: string;
  onClose: () => void;
  onUnlock: () => void;
}

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["clear", "0", "back"],
];

export default function DevVaultModal({
  visible,
  expectedPin,
  onClose,
  onUnlock,
}: DevVaultModalProps) {
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [failedCount, setFailedCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number>(0);
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const pinLen = Math.max(4, expectedPin.length);
  const remainingLockSec = Math.max(0, Math.ceil((lockedUntil - nowTick) / 1000));

  useEffect(() => {
    if (!visible) {
      setPin("");
      setErrorMsg("");
    }
  }, [visible]);

  useEffect(() => {
    if (remainingLockSec <= 0) return;
    const timer = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(timer);
  }, [remainingLockSec]);

  function triggerShake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }

  function handleKey(key: string) {
    if (remainingLockSec > 0) return;
    setErrorMsg("");

    if (key === "clear") {
      setPin("");
      return;
    }
    if (key === "back") {
      setPin((prev) => prev.slice(0, -1));
      return;
    }

    const next = pin + key;
    if (next.length > pinLen) return;
    setPin(next);

    if (next.length === expectedPin.length) {
      if (next === expectedPin) {
        setPin("");
        setFailedCount(0);
        setErrorMsg("");
        onClose();
        onUnlock();
      } else {
        triggerShake();
        const nextFails = failedCount + 1;
        setFailedCount(nextFails);
        setPin("");
        if (nextFails >= 5) {
          const until = Date.now() + 15000;
          setLockedUntil(until);
          setNowTick(Date.now());
          setFailedCount(0);
          setErrorMsg("تم قفل البوابة مؤقتاً لحماية النظام (15 ثانية)");
        } else {
          setErrorMsg(`رمز الوصول غير صحيح (${5 - nextFails} محاولات متبقية)`);
        }
      }
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <LinearGradient colors={["#0f0720", "#050507", "#000000"]} style={styles.vaultCard}>
          {/* Top Bar */}
          <View style={styles.topRow}>
            <View style={styles.secureBadge}>
              <View style={styles.secureDot} />
              <Text style={styles.secureText}>ENCRYPTED VAULT</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Shield Emblem */}
          <View style={styles.hero}>
            <LinearGradient colors={["#a855f7", "#ec4899", "#3897f0"]} style={styles.shieldRing}>
              <View style={styles.shieldInner}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
            </LinearGradient>
            <Text style={styles.title}>بوابة المطور المشفّرة</Text>
            <Text style={styles.subtitle}>أدخل رمز Super-Admin السري للمتابعة</Text>
          </View>

          {/* PIN Dots */}
          <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: pinLen }).map((_, idx) => {
              const filled = idx < pin.length;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    filled && styles.dotFilled,
                    !!errorMsg && styles.dotError,
                  ]}
                />
              );
            })}
          </Animated.View>

          {/* Status / Error */}
          <View style={styles.statusBox}>
            {remainingLockSec > 0 ? (
              <Text style={styles.errorText}>🔒 البوابة مقفلة مؤقتاً — انتظر {remainingLockSec} ثانية</Text>
            ) : errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : (
              <Text style={styles.hintText}>نظام الحماية الذكي نشط · SHAHINAZ Security</Text>
            )}
          </View>

          {/* Luxury Numeric Keypad */}
          <View style={styles.keypad}>
            {KEYPAD_ROWS.map((row, rIdx) => (
              <View key={rIdx} style={styles.keyRow}>
                {row.map((k) => {
                  const isSpecial = k === "clear" || k === "back";
                  return (
                    <TouchableOpacity
                      key={k}
                      activeOpacity={0.65}
                      disabled={remainingLockSec > 0}
                      style={[
                        styles.keyBtn,
                        isSpecial && styles.keyBtnSpecial,
                        remainingLockSec > 0 && { opacity: 0.35 },
                      ]}
                      onPress={() => handleKey(k)}
                    >
                      {k === "back" ? (
                        <Ionicons name="backspace-outline" size={24} color={COLORS.text} />
                      ) : k === "clear" ? (
                        <Text style={styles.specialText}>مسح</Text>
                      ) : (
                        <Text style={styles.keyText}>{k}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    padding: 18,
  },
  vaultCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
  },
  topRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(168,85,247,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: "rgba(168,85,247,0.45)",
  },
  secureDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
  },
  secureText: {
    color: "#e9d5ff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginTop: 14,
    marginBottom: 18,
  },
  shieldRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  shieldInner: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    backgroundColor: "#0a0a0d",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginBottom: 12,
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  dotError: {
    borderColor: COLORS.danger,
  },
  statusBox: {
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  hintText: {
    color: COLORS.muted,
    fontSize: 11,
  },
  keypad: {
    gap: 12,
    alignItems: "center",
    paddingBottom: 6,
  },
  keyRow: {
    flexDirection: "row",
    gap: 18,
  },
  keyBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  keyBtnSpecial: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  specialText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "700",
  },
});
