import { useEffect, useMemo, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import Screen from "../src/components/Screen";
import ActivityCard from "../src/components/ActivityCard";

import { getActivities } from "@/src/services/activity.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

import {
  spacing,
  radius,
} from "../src/constants/theme";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  type: string | null;
  priority: string | null;
  unit_number: number | null;
};

type ActivityStatus = "completed" | "pending" | "overdue" | "upcoming";

type PreparedActivity = Activity & {
  realStatus: ActivityStatus;
  dateLabel: string;
  dateKey: string;
  sortTime: number;
};

const NO_DATE_KEY = "sin-fecha";
const NO_DATE_SORT_TIME = 9999999999999;

function getRealStatus(activity: Activity, nowTime: number): ActivityStatus {
  if (activity.status === "completed") return "completed";
  if (!activity.due_at) return "pending";

  const dueTime = new Date(activity.due_at).getTime();

  if (dueTime < nowTime) return "overdue";

  const diffMs = dueTime - nowTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 3) return "pending";

  return "upcoming";
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";

  return new Date(date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateKey(date: string | null) {
  if (!date) return NO_DATE_KEY;

  const d = new Date(date);

  return d.toISOString().split("T")[0];
}

function formatGroupDate(dateKey: string) {
  if (dateKey === NO_DATE_KEY) return "Sin fecha";

  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function ActivitiesScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);

      const data = await getActivities();
      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando actividades:", error);
    } finally {
      setLoading(false);
    }
  }

  const preparedActivities = useMemo<PreparedActivity[]>(() => {
    const nowTime = Date.now();

    return activities.map((activity) => {
      const realStatus = getRealStatus(activity, nowTime);
      const sortTime = activity.due_at
        ? new Date(activity.due_at).getTime()
        : NO_DATE_SORT_TIME;

      return {
        ...activity,
        realStatus,
        dateLabel: formatDate(activity.due_at),
        dateKey: getDateKey(activity.due_at),
        sortTime,
      };
    });
  }, [activities]);

  const filteredActivities = useMemo<PreparedActivity[]>(() => {
    return preparedActivities
      .filter((activity) => {
        if (!filter) return true;

        if (filter === "pending") {
          return (
            activity.realStatus === "pending" ||
            activity.realStatus === "upcoming" ||
            activity.realStatus === "overdue"
          );
        }

        if (filter === "completed") {
          return activity.realStatus === "completed";
        }

        if (filter === "overdue") {
          return activity.realStatus === "overdue";
        }

        return true;
      })
      .sort((a, b) => a.sortTime - b.sortTime);
  }, [preparedActivities, filter]);

  const groupedActivities = useMemo(() => {
    const groups: Record<string, PreparedActivity[]> = {};

    for (const activity of filteredActivities) {
      if (!groups[activity.dateKey]) {
        groups[activity.dateKey] = [];
      }

      groups[activity.dateKey].push(activity);
    }

    return groups;
  }, [filteredActivities]);

  const groupKeys = useMemo(() => {
    return Object.keys(groupedActivities);
  }, [groupedActivities]);

  const title = useMemo(() => {
    if (filter === "pending") return "Pendientes";
    if (filter === "completed") return "Completadas";
    if (filter === "overdue") return "Vencidas";

    return "Todas las actividades";
  }, [filter]);

  function toggleDate(dateKey: string) {
    setExpandedDate((current) => (current === dateKey ? null : dateKey));
  }

  if (loading) {
    return (
      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />

          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Cargando actividades...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={[
        styles.screenContent,
        { backgroundColor: colors.background },
      ]}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <View style={styles.header}>
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.08,
            },
          ]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {filteredActivities.length} actividades encontradas
        </Text>
      </View>

      <View style={styles.filters}>
        <Pressable
          style={[
            styles.filterButton,
            {
              backgroundColor: !filter
                ? colors.primary
                : colors.surface,
              borderColor: !filter
                ? colors.primary
                : colors.border,
            },
          ]}
          onPress={() => router.replace("/activities")}
        >
          <Text
            style={[
              styles.filterText,
              { color: !filter ? "#11120F" : colors.muted },
            ]}
          >
            Todas
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            {
              backgroundColor:
                filter === "pending" ? colors.primary : colors.surface,
              borderColor:
                filter === "pending" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => router.replace("/activities?filter=pending")}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  filter === "pending" ? "#11120F" : colors.muted,
              },
            ]}
          >
            Pendientes
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.filterButton,
            {
              backgroundColor:
                filter === "completed" ? colors.primary : colors.surface,
              borderColor:
                filter === "completed" ? colors.primary : colors.border,
            },
          ]}
          onPress={() => router.replace("/activities?filter=completed")}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  filter === "completed" ? "#11120F" : colors.muted,
              },
            ]}
          >
            Completadas
          </Text>
        </Pressable>
      </View>

      {groupKeys.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.08,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={34}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No hay actividades
          </Text>

          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Cuando importes o completes actividades, aparecerán aquí.
          </Text>
        </View>
      ) : (
        groupKeys.map((dateKey) => {
          const isExpanded = expandedDate === dateKey;
          const group = groupedActivities[dateKey];

          return (
            <View
              key={dateKey}
              style={[
                styles.accordionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0 : 0.08,
                },
              ]}
            >
              <Pressable
                style={styles.accordionHeader}
                onPress={() => toggleDate(dateKey)}
              >
                <View>
                  <Text
                    style={[
                      styles.accordionDate,
                      { color: colors.text },
                    ]}
                  >
                    {formatGroupDate(dateKey)}
                  </Text>

                  <Text
                    style={[
                      styles.accordionMeta,
                      { color: colors.muted },
                    ]}
                  >
                    {group.length} actividad{group.length === 1 ? "" : "es"}
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={colors.subtle}
                />
              </Pressable>

              {isExpanded && (
                <View
                  style={[
                    styles.accordionContent,
                    { borderTopColor: colors.border },
                  ]}
                >
                  {group.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      id={activity.id}
                      title={activity.title}
                      subject={activity.type || "Calendario académico"}
                      date={activity.dateLabel}
                      status={activity.realStatus}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    minHeight: 520,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: spacing.md,
    fontWeight: "700",
  },

  header: {
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    shadowColor: "#000000",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.sm,
  },

  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  filterText: {
    fontWeight: "900",
    fontSize: 13,
  },

  accordionCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  accordionDate: {
    fontSize: 18,
    fontWeight: "900",
    textTransform: "capitalize",
  },

  accordionMeta: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: spacing.xs,
  },

  accordionContent: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },

  emptyCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginTop: spacing.md,
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 21,
  },
});