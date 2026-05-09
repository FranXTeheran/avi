import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

const SOFT_YELLOW = "#FFF4D2";
const BLACK = "#1F1F1F";
const GRAY = "#7A7A7A";
const BORDER = "#EFEFEF";

export default function ProcessingCalendarScreen() {
  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 900);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.mainIcon}>
          <Feather name="calendar" size={42} color={BLACK} />
        </View>

        <ActivityIndicator color={BLACK} style={styles.loader} />

        <Text style={styles.title}>Organizando tu semestre</Text>

        <Text style={styles.description}>
          Estamos preparando tus actividades, entregas y recordatorios.
        </Text>

        <View style={styles.steps}>
          <Step icon="check" text="Calendario importado" />
          <Step icon="file-text" text="Actividades detectadas" />
          <Step icon="bell" text="Recordatorios listos" />
        </View>
      </View>
    </View>
  );
}

function Step({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIcon}>
        <Feather name={icon} size={16} color={BLACK} />
      </View>

      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  mainIcon: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: SOFT_YELLOW,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },

  loader: {
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: BLACK,
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: GRAY,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 300,
  },

  steps: {
    width: "100%",
    marginTop: 36,
    gap: 12,
  },

  step: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: SOFT_YELLOW,
    alignItems: "center",
    justifyContent: "center",
  },

  stepText: {
    fontSize: 14,
    fontWeight: "800",
    color: BLACK,
  },
});