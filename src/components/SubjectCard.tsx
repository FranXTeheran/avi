import { memo, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../hooks/useAppTheme";

type SubjectCardProps = {
  id: string;
  name: string;
  progress: number;
  pending: number;
  currentUnit: number;
};

function getSubjectIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();

  if (lower.includes("mate") || lower.includes("álgebra")) {
    return "calculator-outline";
  }

  if (lower.includes("program") || lower.includes("software")) {
    return "code-slash-outline";
  }

  if (
    lower.includes("química") ||
    lower.includes("fisica") ||
    lower.includes("física")
  ) {
    return "flask-outline";
  }

  if (lower.includes("inglés") || lower.includes("idioma")) {
    return "language-outline";
  }

  return "book-outline";
}

function SubjectCard({
  id,
  name,
  progress,
  pending,
  currentUnit,
}: SubjectCardProps) {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/subject/[id]",
      params: { id },
    });
  }, [id]);

  const iconName = useMemo(() => getSubjectIcon(name), [name]);

  const safeProgress = useMemo(() => {
    return Math.min(Math.max(progress, 0), 100);
  }, [progress]);

  const pendingLabel = useMemo(
    () => (pending === 1 ? "pendiente" : "pendientes"),
    [pending]
  );

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowOpacity: isDark ? 0 : 0.05,
    }),
    [colors.surface, colors.border, isDark]
  );

  const softStyle = useMemo(
    () => ({
      backgroundColor: colors.primarySoft,
    }),
    [colors.primarySoft]
  );

  const progressFillStyle = useMemo(
    () => ({
      width: `${safeProgress}%` as `${number}%`,
      backgroundColor: colors.primary,
    }),
    [safeProgress, colors.primary]
  );

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{
        color: colors.primarySoft,
        borderless: false,
      }}
      style={({ pressed }) => [
        styles.pressable,
        {
          opacity: pressed ? 0.94 : 1,
        },
      ]}
    >
      <View style={[styles.card, cardStyle]}>
        <View style={styles.topRow}>
          <View style={[styles.iconBox, softStyle]}>
            <Ionicons name={iconName} size={25} color={colors.text} />
          </View>

          <View style={[styles.pendingBadge, softStyle]}>
            <Text style={[styles.pendingText, { color: colors.text }]}>
              {pending} {pendingLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="albums-outline" size={15} color={colors.muted} />

            <Text style={[styles.metaText, { color: colors.muted }]}>
              Unidad {currentUnit}
            </Text>
          </View>

          <View style={[styles.metaDot, { backgroundColor: colors.border }]} />

          <Text style={[styles.metaText, { color: colors.muted }]}>
            {safeProgress}% completado
          </Text>
        </View>

        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.muted }]}>
            Progreso
          </Text>

          <Text style={[styles.progressPercent, { color: colors.primary }]}>
            {safeProgress}%
          </Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, progressFillStyle]} />
        </View>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Text style={[styles.footerText, { color: colors.text }]}>
            Ver actividades
          </Text>

          <View style={[styles.arrowBox, softStyle]}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(SubjectCard);

const styles = StyleSheet.create({
  pressable: {
    marginBottom: 14,
    borderRadius: 30,
  },

  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000000",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    overflow: "hidden",
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingBadge: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  pendingText: {
    fontSize: 12,
    fontWeight: "900",
  },

  name: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.7,
    lineHeight: 27,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "wrap",
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: 13,
    fontWeight: "700",
  },

  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 9,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 9,
  },

  progressLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  progressPercent: {
    fontSize: 14,
    fontWeight: "900",
  },

  progressBar: {
    height: 9,
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  footerText: {
    fontSize: 13,
    fontWeight: "900",
  },

  arrowBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});