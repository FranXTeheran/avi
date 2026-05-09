import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

import Screen from "../../src/components/Screen";
import { getActivities } from "@/src/services/activity.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

import { spacing, radius } from "../../src/constants/theme";

type Activity = {
  id: string;
  title: string;
  description: string | null;
  due_at: string | null;
  status: string;
  type: string | null;
  priority: string | null;
  unit_number: number | null;
  subject_name?: string | null;
  subject_code?: string | null;
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

type UnitGroup = {
  title: string;
  activities: Activity[];
  pending: number;
};

const FALLBACK_TIME = 9999999999999;

function createSubjectId(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9áéíóúñü-]/gi, "");
}

function getSubjectName(activity: Activity) {
  const subjectName = activity.subject_name?.trim();
  const subjectCode = activity.subject_code?.trim();

  return subjectName || subjectCode || "Materia sin clasificar";
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDueTime(value: string | null) {
  if (!value) return FALLBACK_TIME;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return FALLBACK_TIME;

  return date.getTime();
}

function getActivityTone(status: string, isDark: boolean, colors: Colors) {
  if (status === "completed") {
    return {
      color: colors.success,
      soft: colors.successSoft,
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (status === "overdue") {
    return {
      color: colors.danger,
      soft: colors.dangerSoft,
      icon: "alert-circle-outline" as const,
    };
  }

  if (status === "upcoming") {
    return {
      color: isDark ? "#7DB7FF" : "#2F80ED",
      soft: isDark ? "#172A42" : "#EAF3FF",
      icon: "time-outline" as const,
    };
  }

  return {
    color: colors.primary,
    soft: colors.primarySoft,
    icon: "document-text-outline" as const,
  };
}

function getSubjectIcon(name: string) {
  const lower = name.toLowerCase();

  if (lower.includes("mate") || lower.includes("álgebra")) {
    return "calculator-outline" as const;
  }

  if (lower.includes("program") || lower.includes("software")) {
    return "code-slash-outline" as const;
  }

  if (
    lower.includes("química") ||
    lower.includes("fisica") ||
    lower.includes("física")
  ) {
    return "flask-outline" as const;
  }

  if (lower.includes("inglés") || lower.includes("idioma")) {
    return "language-outline" as const;
  }

  return "book-outline" as const;
}

function buildSubjectSummary(activities: Activity[], subjectId?: string) {
  const subjectActivities: Activity[] = [];

  for (const activity of activities) {
    const name = getSubjectName(activity);

    if (createSubjectId(name) === subjectId) {
      subjectActivities.push(activity);
    }
  }

  if (subjectActivities.length === 0) {
    return {
      subjectActivities,
      subjectName: "Materia",
      completed: 0,
      pending: 0,
      progress: 0,
      safeProgress: 0,
      units: [] as UnitGroup[],
    };
  }

  const subjectName = getSubjectName(subjectActivities[0]);
  const grouped = new Map<string, Activity[]>();

  let completed = 0;
  let pending = 0;

  for (const activity of subjectActivities) {
    if (activity.status === "completed") {
      completed += 1;
    } else {
      pending += 1;
    }

    const unitLabel = activity.unit_number
      ? `Unidad ${activity.unit_number}`
      : "Sin unidad";

    const current = grouped.get(unitLabel) ?? [];
    current.push(activity);
    grouped.set(unitLabel, current);
  }

  const units: UnitGroup[] = Array.from(grouped.entries()).map(
    ([title, unitActivities]) => {
      const sortedActivities = [...unitActivities].sort(
        (a, b) => getDueTime(a.due_at) - getDueTime(b.due_at)
      );

      let unitPending = 0;

      for (const activity of sortedActivities) {
        if (activity.status !== "completed") {
          unitPending += 1;
        }
      }

      return {
        title,
        activities: sortedActivities,
        pending: unitPending,
      };
    }
  );

  const progress =
    subjectActivities.length === 0
      ? 0
      : Math.round((completed / subjectActivities.length) * 100);

  const safeProgress = Math.min(Math.max(progress, 0), 100);

  return {
    subjectActivities,
    subjectName,
    completed,
    pending,
    progress,
    safeProgress,
    units,
  };
}

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const subjectId = Array.isArray(id) ? id[0] : id;

  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getActivities();

      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando detalle de materia:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const {
    subjectActivities,
    subjectName,
    completed,
    pending,
    safeProgress,
    units,
  } = useMemo(
    () => buildSubjectSummary(activities, subjectId),
    [activities, subjectId]
  );

  const subjectIcon = useMemo(() => getSubjectIcon(subjectName), [subjectName]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const handleOpenActivity = useCallback((activityId: string) => {
    router.push(`/activity/${activityId}`);
  }, []);

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
            Cargando materia...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!subjectActivities.length) {
    return (
      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <View style={styles.center}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color={colors.text}
            />
          </View>

          <Text style={[styles.error, { color: colors.text }]}>
            Materia no encontrada
          </Text>

          <Pressable
            style={[styles.backLargeButton, { backgroundColor: colors.primary }]}
            onPress={handleGoBack}
          >
            <Text style={[styles.backLargeButtonText, { color: "#11120F" }]}>
              Volver
            </Text>
          </Pressable>
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

      <View style={styles.topHeader}>
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

        <Text style={[styles.headerLabel, { color: colors.primary }]}>
          MATERIA
        </Text>
      </View>

      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={[styles.iconBox, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={subjectIcon} size={30} color={colors.text} />
          </View>

          <View style={[styles.pendingBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.pendingBadgeText, { color: colors.text }]}>
              {pending} pendientes
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {subjectName}
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          {subjectActivities.length} actividades · {completed} completadas
        </Text>
      </View>

      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <View>
            <Text style={[styles.progressLabel, { color: colors.text }]}>
              Progreso académico
            </Text>

            <Text style={[styles.progressSubtitle, { color: colors.muted }]}>
              Avance general de esta materia
            </Text>
          </View>

          <Text style={[styles.progressNumber, { color: colors.primary }]}>
            {safeProgress}%
          </Text>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${safeProgress}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {pending}
            </Text>

            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Pendientes
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {completed}
            </Text>

            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Completadas
            </Text>
          </View>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {units.length}
            </Text>

            <Text style={[styles.statLabel, { color: colors.muted }]}>
              Unidades
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Unidades
        </Text>

        <Text style={[styles.sectionMeta, { color: colors.primary }]}>
          {units.length} bloques
        </Text>
      </View>

      {units.map((unit) => (
        <UnitCard
          key={unit.title}
          unit={unit}
          colors={colors}
          isDark={isDark}
          onOpenActivity={handleOpenActivity}
        />
      ))}
    </Screen>
  );
}

const UnitCard = memo(function UnitCard({
  unit,
  colors,
  isDark,
  onOpenActivity,
}: {
  unit: UnitGroup;
  colors: Colors;
  isDark: boolean;
  onOpenActivity: (activityId: string) => void;
}) {
  return (
    <View
      style={[
        styles.unitCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
        },
      ]}
    >
      <View style={styles.unitHeader}>
        <View>
          <Text style={[styles.unitTitle, { color: colors.text }]}>
            {unit.title}
          </Text>

          <Text style={[styles.unitMeta, { color: colors.muted }]}>
            {unit.activities.length} actividad
            {unit.activities.length === 1 ? "" : "es"}
          </Text>
        </View>

        <View style={[styles.unitBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.unitBadgeText, { color: colors.text }]}>
            {unit.pending} pendientes
          </Text>
        </View>
      </View>

      {unit.activities.map((activity) => (
        <ActivityRow
          key={activity.id}
          activity={activity}
          colors={colors}
          isDark={isDark}
          onOpenActivity={onOpenActivity}
        />
      ))}
    </View>
  );
});

const ActivityRow = memo(function ActivityRow({
  activity,
  colors,
  isDark,
  onOpenActivity,
}: {
  activity: Activity;
  colors: Colors;
  isDark: boolean;
  onOpenActivity: (activityId: string) => void;
}) {
  const tone = useMemo(
    () => getActivityTone(activity.status, isDark, colors),
    [activity.status, isDark, colors]
  );

  const formattedDate = useMemo(
    () => formatDate(activity.due_at),
    [activity.due_at]
  );

  const handlePress = useCallback(() => {
    onOpenActivity(activity.id);
  }, [activity.id, onOpenActivity]);

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
    >
      <View style={[styles.activityAccent, { backgroundColor: tone.color }]} />

      <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
        <Ionicons name={tone.icon} size={20} color={tone.color} />
      </View>

      <View style={styles.activityContent}>
        <Text
          style={[styles.activityTitle, { color: colors.text }]}
          numberOfLines={2}
        >
          {activity.title}
        </Text>

        <Text style={[styles.activityDate, { color: colors.muted }]}>
          {formattedDate}
        </Text>
      </View>

      <View style={[styles.activityArrow, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="chevron-forward" size={17} color={colors.text} />
      </View>
    </Pressable>
  );
});


const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingTop: 44,
    paddingHorizontal: 28,
    paddingBottom: 120,
  },

  center: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: spacing.md,
    fontWeight: "700",
  },

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  headerLabel: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },

  heroCard: {
    borderRadius: 34,
    borderWidth: 1,
    padding: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  pendingBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  pendingBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -1,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: spacing.md,
  },

  progressCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
    marginBottom: spacing.md,
  },

  progressLabel: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  progressSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  progressNumber: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.4,
  },

  progressBar: {
    height: 10,
    borderRadius: radius.full,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },

  statDivider: {
    width: 1,
    height: 34,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  sectionMeta: {
    fontSize: 13,
    fontWeight: "900",
  },

  unitCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  unitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
    gap: spacing.md,
  },

  unitTitle: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  unitMeta: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  unitBadge: {
    borderRadius: radius.full,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  unitBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  activityRow: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },

  activityAccent: {
    position: "absolute",
    left: 0,
    top: 14,
    bottom: 14,
    width: 3,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },

  activityIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
  },

  activityDate: {
    fontSize: 13,
    marginTop: 5,
    fontWeight: "700",
  },

  activityArrow: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  error: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  backLargeButton: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

  backLargeButtonText: {
    fontWeight: "900",
  },
});