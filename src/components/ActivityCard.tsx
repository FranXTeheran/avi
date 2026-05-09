import { memo, useCallback, useMemo } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../hooks/useAppTheme";

type ActivityStatus = "pending" | "upcoming" | "completed" | "overdue";

type ActivityCardProps = {
  id: string;
  title: string;
  subject: string;
  date: string;
  status: ActivityStatus | string;
};

type StatusConfig = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
};

const lightConfigs: Record<ActivityStatus, StatusConfig> = {
  pending: {
    label: "Urgente",
    icon: "flame-outline",
    color: "#FF7A59",
    soft: "#FFF0EA",
  },
  upcoming: {
    label: "Próxima",
    icon: "time-outline",
    color: "#4A90E2",
    soft: "#EEF5FF",
  },
  completed: {
    label: "Completada",
    icon: "checkmark-circle-outline",
    color: "#22C55E",
    soft: "#EAF9EF",
  },
  overdue: {
    label: "Vencida",
    icon: "alert-circle-outline",
    color: "#EF4444",
    soft: "#FFECEC",
  },
};

const darkConfigs: Record<ActivityStatus, StatusConfig> = {
  pending: {
    label: "Urgente",
    icon: "flame-outline",
    color: "#FF9B7A",
    soft: "#3A2119",
  },
  upcoming: {
    label: "Próxima",
    icon: "time-outline",
    color: "#7DB7FF",
    soft: "#172A42",
  },
  completed: {
    label: "Completada",
    icon: "checkmark-circle-outline",
    color: "#4ADE80",
    soft: "#14351F",
  },
  overdue: {
    label: "Vencida",
    icon: "alert-circle-outline",
    color: "#FB7185",
    soft: "#3A171D",
  },
};

function ActivityCard({
  id,
  title,
  subject,
  date,
  status,
}: ActivityCardProps) {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const config = useMemo(() => {
    const source = isDark ? darkConfigs : lightConfigs;
    return source[status as ActivityStatus] ?? source.pending;
  }, [status, isDark]);

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowOpacity: isDark ? 0 : 0.05,
    }),
    [colors.surface, colors.border, isDark]
  );

  const arrowStyle = useMemo(
    () => ({
      backgroundColor: colors.primarySoft,
    }),
    [colors.primarySoft]
  );

  const handlePress = useCallback(() => {
    router.push({
      pathname: "/activity/[id]",
      params: { id },
    });
  }, [id]);

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{
        color: config.soft,
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
        <View style={[styles.leftAccent, { backgroundColor: config.color }]} />

        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.soft },
          ]}
        >
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text
              numberOfLines={2}
              style={[styles.title, { color: colors.text }]}
            >
              {title}
            </Text>

            <View style={[styles.badge, { backgroundColor: config.soft }]}>
              <Text style={[styles.badgeText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.subject, { color: colors.muted }]}
          >
            {subject}
          </Text>

          <View style={styles.footer}>
            <View style={styles.dateContainer}>
              <Ionicons
                name="calendar-outline"
                size={15}
                color={colors.muted}
              />

              <Text style={[styles.date, { color: colors.muted }]}>
                {date}
              </Text>
            </View>

            <View style={[styles.arrow, arrowStyle]}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.text}
              />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default memo(ActivityCard);

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 28,
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },

  leftAccent: {
    position: "absolute",
    left: 0,
    top: 18,
    bottom: 18,
    width: 4,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },

  content: {
    flex: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 24,
    letterSpacing: -0.5,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  subject: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "700",
  },

  footer: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  date: {
    marginLeft: 7,
    fontSize: 13,
    fontWeight: "800",
  },

  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
});