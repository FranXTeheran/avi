import { memo, useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { radius, spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

type Activity = {
  id: string;
  title: string;
  subject: string;
  date: string;
  status: "pending" | "completed" | "overdue" | "upcoming";
};

type UnitAccordionProps = {
  title: string;
  pending: number;
  activities: Activity[];
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

function UnitAccordion({
  title,
  pending,
  activities,
}: UnitAccordionProps) {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [open, setOpen] = useState(false);

  const isCompleted = pending === 0;

  const handleToggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const handleOpenActivity = useCallback((id: string) => {
    router.push({
      pathname: "/activity/[id]",
      params: { id },
    });
  }, []);

  const wrapperStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowOpacity: isDark ? 0 : 0.06,
    }),
    [colors.surface, colors.border, isDark]
  );

  const iconStyle = useMemo(
    () => ({
      backgroundColor: isCompleted ? colors.successSoft : colors.primarySoft,
    }),
    [isCompleted, colors.successSoft, colors.primarySoft]
  );

  const iconColor = isCompleted ? colors.success : colors.primary;

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <Pressable
        style={styles.header}
        onPress={handleToggle}
        android_ripple={{
          color: colors.primarySoft,
          borderless: false,
        }}
      >
        <View style={styles.left}>
          <View style={[styles.iconBox, iconStyle]}>
            <Ionicons
              name={isCompleted ? "checkmark" : "book"}
              size={18}
              color={iconColor}
            />
          </View>

          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>

            <Text style={[styles.meta, { color: colors.muted }]}>
              {pending > 0 ? `${pending} pendientes` : "Sin pendientes"}
            </Text>
          </View>
        </View>

        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={21}
          color={colors.muted}
        />
      </Pressable>

      {open && (
        <View style={styles.content}>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <ActivityRow
                key={activity.id}
                activity={activity}
                colors={colors}
                onOpenActivity={handleOpenActivity}
              />
            ))
          ) : (
            <View
              style={[
                styles.emptyBox,
                { backgroundColor: colors.surfaceSoft },
              ]}
            >
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                No hay actividades en esta unidad.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const ActivityRow = memo(function ActivityRow({
  activity,
  colors,
  onOpenActivity,
}: {
  activity: Activity;
  colors: Colors;
  onOpenActivity: (id: string) => void;
}) {
  const handlePress = useCallback(() => {
    onOpenActivity(activity.id);
  }, [activity.id, onOpenActivity]);

  const dotColor = useMemo(() => {
    if (activity.status === "completed") return colors.success;
    if (activity.status === "overdue") return colors.danger;
    if (activity.status === "upcoming") return colors.primary;

    return colors.primary;
  }, [activity.status, colors.success, colors.danger, colors.primary]);

  return (
    <Pressable
      style={[
        styles.activityRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={handlePress}
      android_ripple={{
        color: colors.primarySoft,
        borderless: false,
      }}
    >
      <View style={styles.activityLeft}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />

        <View style={styles.activityText}>
          <Text
            style={[styles.activityTitle, { color: colors.text }]}
            numberOfLines={2}
          >
            {activity.title}
          </Text>

          <Text style={[styles.activityMeta, { color: colors.muted }]}>
            {activity.date}
          </Text>
        </View>
      </View>

      <Ionicons name="arrow-forward" size={16} color={colors.subtle} />
    </Pressable>
  );
});

export default memo(UnitAccordion);

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 30,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  header: {
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  titleBox: {
    flex: 1,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  meta: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  activityRow: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activityLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    marginRight: spacing.md,
  },

  activityText: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  activityMeta: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  emptyBox: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "600",
  },
});