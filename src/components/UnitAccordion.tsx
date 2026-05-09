import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import {
  colors,
  radius,
  spacing,
  shadow,
} from "../constants/theme";

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

export default function UnitAccordion({
  title,
  pending,
  activities,
}: UnitAccordionProps) {
  const [open, setOpen] = useState(false);

  const isCompleted = pending === 0;

  const goToActivity = (id: string) => {
    router.push({
      pathname: "/activity/[id]",
      params: { id },
    });
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.header}
        onPress={() => setOpen(!open)}
      >
        <View style={styles.left}>
          <View
            style={[
              styles.iconBox,
              isCompleted && styles.completedIcon,
            ]}
          >
            <Ionicons
              name={isCompleted ? "checkmark" : "book"}
              size={18}
              color={isCompleted ? "#10B981" : colors.primary}
            />
          </View>

          <View>
            <Text style={styles.title}>{title}</Text>

            <Text style={styles.meta}>
              {pending > 0
                ? `${pending} pendientes`
                : "Sin pendientes"}
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
              <Pressable
                key={activity.id}
                style={styles.activityRow}
                onPress={() => goToActivity(activity.id)}
              >
                <View style={styles.activityLeft}>
                  <View style={styles.dot} />

                  <View style={styles.activityText}>
                    <Text style={styles.activityTitle}>
                      {activity.title}
                    </Text>

                    <Text style={styles.activityMeta}>
                      {activity.date}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.subtle}
                />
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                No hay actividades en esta unidad.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.card,
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

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  completedIcon: {
    backgroundColor: colors.successSoft,
  },

  title: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.4,
  },

  meta: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
    marginTop: spacing.xs,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  activityRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },

  activityText: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },

  activityMeta: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    marginTop: spacing.xs,
  },

  emptyBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});