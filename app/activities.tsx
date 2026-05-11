import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../src/components/Screen";
import ActivityCard from "../src/components/ActivityCard";

import { getActivities } from "@/src/services/activity.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

import { spacing, radius } from "../src/constants/theme";

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

type ActivitySection = {
  title: string;
  dateKey: string;
  count: number;
  data: PreparedActivity[];
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

const NO_DATE_KEY = "sin-fecha";
const NO_DATE_SORT_TIME = 9999999999999;
const DAY_MS = 1000 * 60 * 60 * 24;

function getRealStatus(activity: Activity, nowTime: number): ActivityStatus {
  if (activity.status === "completed") return "completed";
  if (!activity.due_at) return "pending";

  const dueTime = new Date(activity.due_at).getTime();

  if (Number.isNaN(dueTime)) return "pending";
  if (dueTime < nowTime) return "overdue";

  const diffDays = (dueTime - nowTime) / DAY_MS;

  if (diffDays <= 3) return "pending";

  return "upcoming";
}

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Sin fecha";

  return parsedDate.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateKey(date: string | null) {
  if (!date) return NO_DATE_KEY;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return NO_DATE_KEY;

  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function prepareSections(
  activities: Activity[],
  filter?: string
): {
  sections: ActivitySection[];
  total: number;
} {
  const nowTime = Date.now();
  const grouped = new Map<string, PreparedActivity[]>();

  for (const activity of activities) {
    const realStatus = getRealStatus(activity, nowTime);

    const shouldInclude =
      !filter ||
      (filter === "pending" &&
        (realStatus === "pending" ||
          realStatus === "upcoming" ||
          realStatus === "overdue")) ||
      (filter === "completed" && realStatus === "completed") ||
      (filter === "overdue" && realStatus === "overdue");

    if (!shouldInclude) continue;

    const sortTime = activity.due_at
      ? new Date(activity.due_at).getTime()
      : NO_DATE_SORT_TIME;

    const prepared: PreparedActivity = {
      ...activity,
      realStatus,
      dateLabel: formatDate(activity.due_at),
      dateKey: getDateKey(activity.due_at),
      sortTime: Number.isNaN(sortTime) ? NO_DATE_SORT_TIME : sortTime,
    };

    const current = grouped.get(prepared.dateKey) ?? [];
    current.push(prepared);
    grouped.set(prepared.dateKey, current);
  }

  const sections = Array.from(grouped.entries())
    .map(([dateKey, data]) => {
      const sortedData = [...data].sort((a, b) => a.sortTime - b.sortTime);

      return {
        title: formatGroupDate(dateKey),
        dateKey,
        count: sortedData.length,
        data: sortedData,
      };
    })
    .sort((a, b) => {
      const aTime = a.data[0]?.sortTime ?? NO_DATE_SORT_TIME;
      const bTime = b.data[0]?.sortTime ?? NO_DATE_SORT_TIME;

      return aTime - bTime;
    });

  const total = sections.reduce((acc, section) => acc + section.count, 0);

  return { sections, total };
}

function getTitle(filter?: string) {
  if (filter === "pending") return "Pendientes";
  if (filter === "completed") return "Completadas";
  if (filter === "overdue") return "Vencidas";

  return "Todas las actividades";
}

export default function ActivitiesScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getActivities();

      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando actividades:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const { sections, total } = useMemo(
    () => prepareSections(activities, filter),
    [activities, filter]
  );

  const title = useMemo(() => getTitle(filter), [filter]);

  const toggleDate = useCallback((dateKey: string) => {
    setExpandedDate((current) => (current === dateKey ? null : dateKey));
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const handleFilterAll = useCallback(() => {
    router.replace("/activities");
  }, []);

  const handleFilterPending = useCallback(() => {
    router.replace("/activities?filter=pending");
  }, []);

  const handleFilterCompleted = useCallback(() => {
    router.replace("/activities?filter=completed");
  }, []);

  const renderSectionHeader = useCallback(
    ({ section }: { section: ActivitySection }) => (
      <AccordionHeader
        section={section}
        colors={colors}
        isDark={isDark}
        expanded={expandedDate === section.dateKey}
        onToggle={toggleDate}
      />
    ),
    [colors, isDark, expandedDate, toggleDate]
  );

  const renderItem = useCallback(
    ({ item, section }: { item: PreparedActivity; section: ActivitySection }) => {
      if (expandedDate !== section.dateKey) return null;

      return (
        <View style={styles.accordionItemWrapper}>
          <ActivityCard
            id={item.id}
            title={item.title}
            subject={item.type || "Calendario académico"}
            date={item.dateLabel}
            status={item.realStatus}
          />
        </View>
      );
    },
    [expandedDate]
  );

  const ListHeader = useMemo(
    () => (
      <>
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
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {total} actividades encontradas
          </Text>
        </View>

        <View style={styles.filters}>
          <FilterButton
            label="Todas"
            active={!filter}
            colors={colors}
            onPress={handleFilterAll}
          />

          <FilterButton
            label="Pendientes"
            active={filter === "pending"}
            colors={colors}
            onPress={handleFilterPending}
          />

          <FilterButton
            label="Completadas"
            active={filter === "completed"}
            colors={colors}
            onPress={handleFilterCompleted}
          />
        </View>
      </>
    ),
    [
      colors,
      isDark,
      title,
      total,
      filter,
      handleGoBack,
      handleFilterAll,
      handleFilterPending,
      handleFilterCompleted,
    ]
  );

  const ListEmpty = useMemo(
    () => (
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
        <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="calendar-outline" size={34} color={colors.primary} />
        </View>

        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          No hay actividades
        </Text>

        <Text style={[styles.emptyText, { color: colors.muted }]}>
          Cuando importes o completes actividades, aparecerán aquí.
        </Text>
      </View>
    ),
    [
      colors.surface,
      colors.border,
      colors.primarySoft,
      colors.primary,
      colors.text,
      colors.muted,
      isDark,
    ]
  );

  if (loading) {
    return (
      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >

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
      scroll={false}
      contentStyle={[
        styles.screenContent,
        { backgroundColor: colors.background },
      ]}
    >

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={false}
        contentContainerStyle={styles.listContent}
      />
    </Screen>
  );
}

const FilterButton = memo(function FilterButton({
  label,
  active,
  colors,
  onPress,
}: {
  label: string;
  active: boolean;
  colors: Colors;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.filterButton,
        {
          backgroundColor: active ? colors.primary : colors.surface,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterText,
          { color: active ? "#11120F" : colors.muted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const AccordionHeader = memo(function AccordionHeader({
  section,
  colors,
  isDark,
  expanded,
  onToggle,
}: {
  section: ActivitySection;
  colors: Colors;
  isDark: boolean;
  expanded: boolean;
  onToggle: (dateKey: string) => void;
}) {
  const handlePress = useCallback(() => {
    onToggle(section.dateKey);
  }, [section.dateKey, onToggle]);

  return (
    <View
      style={[
        styles.accordionCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.08,
        },
      ]}
    >
      <Pressable style={styles.accordionHeader} onPress={handlePress}>
        <View>
          <Text style={[styles.accordionDate, { color: colors.text }]}>
            {section.title}
          </Text>

          <Text style={[styles.accordionMeta, { color: colors.muted }]}>
            {section.count} actividad{section.count === 1 ? "" : "es"}
          </Text>
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22}
          color={colors.subtle}
        />
      </Pressable>

      {expanded && (
        <View
          style={[
            styles.accordionContent,
            { borderTopColor: colors.border },
          ]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingTop: 44,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },

  listContent: {
    paddingBottom: 12,
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

  accordionItemWrapper: {
    marginTop: -12,
    marginBottom: 12,
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