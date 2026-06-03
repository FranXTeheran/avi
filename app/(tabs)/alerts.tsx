import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import Screen from "../../src/components/Screen";
import { getActivities } from "@/src/services/activity.service";
import { sendTestNotification } from "@/src/services/activity-notification.service";
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

type SmartAlert = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "urgent" | "warning" | "info" | "success";
  activityId?: string;
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

const DAY_MS = 1000 * 60 * 60 * 24;
const MAX_ALERTS = 8;

function getSubjectName(activity: Activity) {
  const subjectName = activity.subject_name?.trim();
  const subjectCode = activity.subject_code?.trim();

  return subjectName || subjectCode || "Materia sin clasificar";
}

function getDaysUntil(value: string | null) {
  if (!value) return null;

  const now = new Date();
  const due = new Date(value);

  if (Number.isNaN(due.getTime())) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return Math.ceil((dueDay.getTime() - today.getTime()) / DAY_MS);
}

function formatTimeLabel(days: number | null) {
  if (days === null) return "Sin fecha";
  if (days < 0) return "Vencida";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days <= 7) return `En ${days} días`;

  return "Próximamente";
}

function getActivityTypeLabel(activity: Activity) {
  if (activity.type === "evaluation") return "Evaluación";
  if (activity.type === "protocol") return "Protocolo";
  if (activity.type === "final_project") return "Trabajo final";

  return "Actividad";
}

function buildAlerts(activities: Activity[]): SmartAlert[] {
  const activeActivities = activities
    .filter((activity) => activity.status !== "completed" && activity.due_at)
    .map((activity) => ({
      activity,
      days: getDaysUntil(activity.due_at),
      dueTime: new Date(activity.due_at || "").getTime(),
    }))
    .filter(
      (item) =>
        item.days !== null &&
        !Number.isNaN(item.dueTime)
    )
    .sort((a, b) => a.dueTime - b.dueTime);

  const overdueCount = activeActivities.filter(
    ({ days }) => days !== null && days < 0
  ).length;

  const alerts: SmartAlert[] = activeActivities
    .filter(({ days }) => days !== null && days <= 7)
    .slice(0, MAX_ALERTS)
    .map(({ activity, days }) => {
      const subject = getSubjectName(activity);
      const typeLabel = getActivityTypeLabel(activity);
      const description = `${typeLabel} · ${subject}`;

      if (days !== null && days < 0) {
        return {
          id: activity.id,
          title: "Tienes una actividad vencida",
          description,
          time: formatTimeLabel(days),
          type: "urgent",
          activityId: activity.id,
        };
      }

      if (days === 0) {
        return {
          id: activity.id,
          title: "Esta actividad vence hoy",
          description,
          time: "Hoy",
          type: "urgent",
          activityId: activity.id,
        };
      }

      if (days === 1) {
        return {
          id: activity.id,
          title: "Mañana tienes una entrega",
          description,
          time: "Mañana",
          type: "warning",
          activityId: activity.id,
        };
      }

      return {
        id: activity.id,
        title: "Próxima actividad",
        description,
        time: formatTimeLabel(days),
        type: "info",
        activityId: activity.id,
      };
    });

  if (overdueCount > 1) {
    alerts.unshift({
      id: "overdue-summary",
      title: `Tienes ${overdueCount} actividades vencidas`,
      description: "AVI te las organiza para avanzar una por una.",
      time: "Ahora",
      type: "urgent",
    });
  }

  if (alerts.length === 0 && activities.length > 0) {
    alerts.push({
      id: "calm-week",
      title: "Semana tranquila",
      description: "No tienes vencimientos urgentes en los próximos días.",
      time: "Hoy",
      type: "success",
    });
  }

  return alerts;
}

function getAlertConfig(
  type: SmartAlert["type"],
  isDark: boolean,
  colors: Colors
) {
  if (type === "urgent") {
    return {
      icon: "flame-outline",
      color: isDark ? "#FB7185" : "#EF4444",
      background: isDark ? "#3A171D" : "#FFECEC",
    };
  }

  if (type === "warning") {
    return {
      icon: "time-outline",
      color: isDark ? "#FBBF24" : "#F59E0B",
      background: isDark ? "#3A2A12" : "#FEF3C7",
    };
  }

  if (type === "success") {
    return {
      icon: "checkmark-circle-outline",
      color: colors.success,
      background: colors.successSoft,
    };
  }

  return {
    icon: "sparkles-outline",
    color: colors.primary,
    background: colors.primarySoft,
  };
}

type AlertCardProps = {
  alert: SmartAlert;
  colors: Colors;
  isDark: boolean;
  onOpenActivity: (activityId: string) => void;
};

const AlertCard = memo(function AlertCard({
  alert,
  colors,
  isDark,
  onOpenActivity,
}: AlertCardProps) {
  const config = useMemo(
    () => getAlertConfig(alert.type, isDark, colors),
    [alert.type, isDark, colors]
  );

  const handlePress = useCallback(() => {
    if (alert.activityId) {
      onOpenActivity(alert.activityId);
    }
  }, [alert.activityId, onOpenActivity]);

  return (
    <Pressable
      style={[
        styles.alertCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.05,
        },
      ]}
      onPress={handlePress}
      disabled={!alert.activityId}
    >
      <View style={[styles.leftAccent, { backgroundColor: config.color }]} />

      <View style={[styles.alertIcon, { backgroundColor: config.background }]}>
        <Ionicons name={config.icon as any} size={22} color={config.color} />
      </View>

      <View style={styles.alertContent}>
        <View style={styles.alertTop}>
          <Text
            numberOfLines={2}
            style={[styles.alertTitle, { color: colors.text }]}
          >
            {alert.title}
          </Text>

          <View style={[styles.timeBadge, { backgroundColor: config.background }]}>
            <Text style={[styles.alertTime, { color: config.color }]}>
              {alert.time}
            </Text>
          </View>
        </View>

        <Text
          numberOfLines={2}
          style={[styles.alertDescription, { color: colors.muted }]}
        >
          {alert.description}
        </Text>
      </View>
    </Pressable>
  );
});

export default function AlertsScreen() {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingNotification, setTestingNotification] = useState(false);

  const loadActivities = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getActivities();

      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando alertas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const alerts = useMemo(() => buildAlerts(activities), [activities]);

  const handleOpenActivity = useCallback((activityId: string) => {
    router.push(`/activity/${activityId}`);
  }, []);

  const handleSendTestNotification = useCallback(async () => {
    if (testingNotification) return;

    try {
      setTestingNotification(true);
      await sendTestNotification();
    } catch (error) {
      console.log("Error enviando notificación de prueba:", error);
    } finally {
      setTestingNotification(false);
    }
  }, [testingNotification]);

  if (loading) {
    return (
      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >

        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} />

          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Preparando alertas...
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

      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.primary }]}>ALERTAS</Text>

        <Text style={[styles.title, { color: colors.text }]}>
          No olvides lo importante
        </Text>

        <Text style={[styles.subtitle, { color: colors.muted }]}>
          AVI prioriza tus actividades según fecha, urgencia y estado.
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
        <View style={styles.heroLeft}>
          <View
            style={[
              styles.heroSmallIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.text}
            />
          </View>

          <View>
            <Text style={[styles.heroLabel, { color: colors.muted }]}>
              Recordatorios activos
            </Text>

            <Text style={[styles.heroText, { color: colors.text }]}>
              {alerts.length === 1 ? "alerta por revisar" : "alertas por revisar"}
            </Text>
          </View>
        </View>

        <Text style={[styles.heroNumber, { color: colors.text }]}>
          {alerts.length}
        </Text>
      </View>

      <Pressable
        style={[
          styles.testButton,
          {
            backgroundColor: colors.primarySoft,
            borderColor: colors.border,
            opacity: testingNotification ? 0.7 : 1,
          },
        ]}
        onPress={handleSendTestNotification}
        disabled={testingNotification}
      >
        {testingNotification ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <Ionicons name="paper-plane-outline" size={18} color={colors.text} />
        )}

        <Text style={[styles.testButtonText, { color: colors.text }]}>
          Probar notificación
        </Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Inteligentes
        </Text>

        <Text style={[styles.sectionCount, { color: colors.muted }]}>
          {alerts.length}
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.06,
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
              name="sparkles-outline"
              size={30}
              color={colors.primary}
            />
          </View>

          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Todo está tranquilo
          </Text>

          <Text style={[styles.emptyText, { color: colors.muted }]}>
            Cuando tengas actividades próximas o vencidas, AVI te las mostrará aquí.
          </Text>
        </View>
      ) : (
        alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            colors={colors}
            isDark={isDark}
            onOpenActivity={handleOpenActivity}
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingHorizontal: 28,
    paddingBottom: 120,
  },

  header: {
    marginBottom: spacing.xl,
  },

  label: {
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 40,
    marginTop: spacing.sm,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    marginTop: spacing.md,
  },

  heroCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 22,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  heroLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  heroSmallIcon: {
    width: 52,
    height: 52,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  heroLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  heroNumber: {
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -2,
    marginLeft: 12,
  },

  heroText: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 4,
  },

  testButton: {
    borderRadius: radius.full,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    flexDirection: "row",
    gap: 8,
  },

  testButtonText: {
    fontWeight: "900",
    fontSize: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  sectionCount: {
    fontSize: 14,
    fontWeight: "900",
  },

  alertCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 18,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
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

  alertIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  alertContent: {
    flex: 1,
  },

  alertTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  alertTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 24,
    letterSpacing: -0.4,
  },

  timeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    alignSelf: "flex-start",
  },

  alertTime: {
    fontSize: 12,
    fontWeight: "900",
  },

  alertDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
    marginTop: 6,
  },

  loadingContainer: {
    flex: 1,
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: spacing.md,
    fontWeight: "700",
  },

  emptyCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  emptyIcon: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    marginBottom: spacing.sm,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
  },
});
