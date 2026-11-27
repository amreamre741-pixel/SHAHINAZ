import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME_LIST } from "../theme";
import { useApp } from "../store/AppContext";

export default function ThemeStudioModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { theme, themeId, setThemeId } = useApp();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.bgAlt, borderColor: theme.borderGlow }]}>
          <View style={[styles.handle, { backgroundColor: theme.muted, opacity: 0.35 }]} />

          <View style={styles.header}>
            <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
              <LinearGradient colors={theme.btnGrad} style={styles.iconBadge}>
                <Ionicons name="color-palette" size={18} color={theme.btnText} />
              </LinearGradient>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.title, { color: theme.text }]}>استوديو المظهر الملكي</Text>
                <Text style={{ color: theme.muted, fontSize: 11.5 }}>
                  اختر الهوية الكاملة لتطبيق SHAHINAZ بضغطة واحدة
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {THEME_LIST.map((t) => {
              const selected = themeId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.88}
                  onPress={() => setThemeId(t.id)}
                  style={[
                    styles.skinCard,
                    {
                      backgroundColor: t.surface,
                      borderColor: selected ? t.primary : t.border,
                      borderWidth: selected ? 1.8 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={t.coverGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.previewBanner}
                  >
                    <View style={{ flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center" }}>
                      <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                        <Text style={{ fontSize: 22 }}>{t.emoji}</Text>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ color: t.text, fontSize: 15, fontWeight: "900" }}>{t.name}</Text>
                          <Text style={{ color: t.muted, fontSize: 11, marginTop: 2 }}>{t.tagline}</Text>
                        </View>
                      </View>
                      {selected ? (
                        <LinearGradient colors={t.btnGrad} style={styles.activeTag}>
                          <Ionicons name="checkmark" size={14} color={t.btnText} />
                          <Text style={{ color: t.btnText, fontSize: 11, fontWeight: "900" }}>مفعّل</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.inactiveTag, { borderColor: t.borderGlow }]}>
                          <Text style={{ color: t.primary, fontSize: 11, fontWeight: "800" }}>تطبيق</Text>
                        </View>
                      )}
                    </View>

                    {/* Mini Live UI Swatch Bar */}
                    <View style={styles.miniUiRow}>
                      <LinearGradient colors={t.btnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.miniPill} />
                      <LinearGradient colors={t.storyGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.miniDot} />
                      <View style={[styles.miniSwatch, { backgroundColor: t.bg }]} />
                      <View style={[styles.miniSwatch, { backgroundColor: t.surface2 }]} />
                      <View style={[styles.miniSwatch, { backgroundColor: t.primary }]} />
                      <View style={[styles.miniSwatch, { backgroundColor: t.accent }]} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "86%",
    borderTopWidth: 1.2,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16.5, fontWeight: "900" },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  skinCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  previewBanner: {
    padding: 15,
    gap: 12,
  },
  activeTag: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  inactiveTag: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  miniUiRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
  },
  miniPill: { height: 10, width: 58, borderRadius: 5 },
  miniDot: { height: 14, width: 14, borderRadius: 7 },
  miniSwatch: { height: 14, width: 14, borderRadius: 4, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.2)" },
});
