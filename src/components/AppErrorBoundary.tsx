import React from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../theme";
import { devTelemetry } from "../services/devTelemetry";

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack: string;
}

export default class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "", errorStack: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || "حدث خطأ غير متوقع في الواجهة",
      errorStack: error?.stack || "",
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    devTelemetry.recordError(
      "crash",
      "React.ErrorBoundary",
      error?.message || "Render crash",
      `${error?.stack || ""}\n${info?.componentStack || ""}`
    );
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <Ionicons name="bug" size={44} color={COLORS.danger} />
          <Text style={styles.title}>تم رصد عطل وحماية التطبيق 🛡️</Text>
          <Text style={styles.sub}>
            قام نظام الحماية التلقائي (SHAHINAZ Error Guard) بالتقاط الخطأ وتسجيله للمطور:
          </Text>
          <ScrollView style={styles.box}>
            <Text style={styles.errText}>{this.state.errorMessage}</Text>
            {!!this.state.errorStack && (
              <Text style={styles.stackText}>{this.state.errorStack.slice(0, 450)}</Text>
            )}
          </ScrollView>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => this.setState({ hasError: false, errorMessage: "", errorStack: "" })}
            >
              <Text style={styles.btnText}>إعادة تشغيل الواجهة 🔄</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() =>
                Share.share({
                  message: devTelemetry.buildDiagnosticReport({ crash: this.state.errorMessage }),
                })
              }
            >
              <Text style={styles.btnText}>مشاركة التقرير</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000", justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "800", textAlign: "center" },
  sub: { color: COLORS.muted, fontSize: 12.5, textAlign: "center", lineHeight: 19 },
  box: {
    width: "100%",
    maxHeight: 170,
    backgroundColor: "#08080b",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  errText: { color: COLORS.danger, fontSize: 13, fontWeight: "700" },
  stackText: { color: COLORS.muted, fontSize: 10.5, marginTop: 6 },
  row: { flexDirection: "row-reverse", gap: 8, width: "100%", marginTop: 6 },
  primaryBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 12, padding: 12, alignItems: "center" },
  outlineBtn: { flex: 1, backgroundColor: COLORS.surface2, borderRadius: 12, padding: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
