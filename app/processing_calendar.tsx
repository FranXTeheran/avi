import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import { useAppTheme } from "@/src/hooks/useAppTheme";

export default function ProcessingCalendarScreen() {
  const { mode, colors } = useAppTheme();

  const isDark = mode === "dark";

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (!mounted) return;

      router.replace("/home");
    }, 900);

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <View style={styles.container}>
        <View
          style={[
            styles.mainIcon,
            {
              backgroundColor: colors.primarySoft,
            },
          ]}
        >
          <Feather
            name="calendar"
            size={42}
            color={colors.text}
          />
        </View>

        <ActivityIndicator
          color={colors.primary}
          style={styles.loader}
        />

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Organizando tu semestre
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.muted,
            },
          ]}
        >
          Estamos preparando tus actividades,
          entregas y recordatorios.
        </Text>

        <View style={styles.steps}>
          <Step
            icon="check"
            text="Calendario importado"
            colors={colors}
          />

          <Step
            icon="file-text"
            text="Actividades detectadas"
            colors={colors}
          />

          <Step
            icon="bell"
            text="Recordatorios listos"
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

function Step({
  icon,
  text,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.step,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
      ]}
    >
      <View
        style={[
          styles.stepIcon,
          {
            backgroundColor: colors.primarySoft,
          },
        ]}
      >
        <Feather
          name={icon}
          size={16}
          color={colors.text}
        />
      </View>

      <Text
        style={[
          styles.stepText,
          {
            color: colors.text,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    flex: 1,
    paddingHorizontal: 38,
    alignItems: "center",
    justifyContent: "center",
  },

  mainIcon: {
    width: 104,
    height: 104,
    borderRadius: 32,
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
    textAlign: "center",
    lineHeight: 36,
    letterSpacing: -0.8,
  },

  description: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
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
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 2,
  },

  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  stepText: {
    fontSize: 14,
    fontWeight: "800",
  },
});