import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";

interface VoiceMessagePlayerProps {
  uri: string;
  durationSec?: number;
  accentColor: string;
  textColor: string;
}

const WAVE_BARS = [10, 18, 14, 24, 16, 22, 12, 20, 15, 23, 13, 19, 11];

export default function VoiceMessagePlayer({
  uri,
  durationSec = 0,
  accentColor,
  textColor,
}: VoiceMessagePlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [posSec, setPosSec] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  async function resolvePlayableUri(raw: string): Promise<string> {
    if (raw.startsWith("data:audio")) {
      const b64 = raw.replace(/^data:[^;]+;base64,/, "");
      const outPath = `${FileSystem.cacheDirectory}voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.m4a`;
      await FileSystem.writeAsStringAsync(outPath, b64, { encoding: FileSystem.EncodingType.Base64 });
      return outPath;
    }
    return raw;
  }

  async function togglePlay() {
    try {
      if (playing && soundRef.current) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }

      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.didJustFinish || (status.durationMillis && status.positionMillis >= status.durationMillis - 150)) {
            await soundRef.current.setPositionAsync(0);
          }
          await soundRef.current.playAsync();
          setPlaying(true);
          return;
        }
      }

      setLoading(true);
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const playableUri = await resolvePlayableUri(uri);
      const { sound } = await Audio.Sound.createAsync(
        { uri: playableUri },
        { shouldPlay: true },
        (st) => {
          if (!st.isLoaded) return;
          setPosSec(Math.floor((st.positionMillis || 0) / 1000));
          if (st.didJustFinish) {
            setPlaying(false);
            setPosSec(0);
          }
        }
      );
      soundRef.current = sound;
      setPlaying(true);
    } catch {
      Alert.alert("تعذر التشغيل", "تعذر تشغيل هذه الرسالة الصوتية على جهازك.");
      setPlaying(false);
    } finally {
      setLoading(false);
    }
  }

  const displaySec = playing ? posSec : durationSec;
  const mins = Math.floor(displaySec / 60);
  const secs = String(displaySec % 60).padStart(2, "0");

  return (
    <TouchableOpacity style={styles.wrap} activeOpacity={0.85} onPress={togglePlay}>
      <View style={[styles.playOrb, { backgroundColor: accentColor }]}>
        {loading ? (
          <ActivityIndicator size="small" color="#090A0F" />
        ) : (
          <Ionicons name={playing ? "pause" : "play"} size={16} color="#090A0F" />
        )}
      </View>

      <View style={styles.waveRow}>
        {WAVE_BARS.map((h, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: h,
                backgroundColor: textColor,
                opacity: playing ? (i % 2 === 0 ? 0.95 : 0.65) : 0.5,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.dur, { color: textColor }]}>
        {mins}:{secs}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    minWidth: 195,
    paddingVertical: 4,
  },
  playOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  waveRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 26,
    gap: 2.5,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  dur: {
    fontSize: 11.5,
    fontWeight: "800",
    minWidth: 34,
    textAlign: "left",
  },
});
