import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { cancelActivityNotifications } from "@/src/services/activity-notification.service";

import Screen from "../../src/components/Screen";
import { useAppTheme } from "@/src/hooks/useAppTheme";

import {
  completeActivity,
  getActivities,
} from "../../src/services/activity.service";

import { spacing, radius } from "../../src/constants/theme";

const SIMA_URL = "https://sima.unicartagena.edu.co/landingPage/";
const DAY_MS = 1000 * 60 * 60 * 24;

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

function formatDate(date: string | null) {
  if (!date) return "Sin fecha";

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Sin fecha";

  return parsedDate.toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getSubjectName(activity: Activity) {
  const subjectName = activity.subject_name?.trim();
  const subjectCode = activity.subject_code?.trim();

  return subjectName || subjectCode || "Materia sin clasificar";
}

function getTypeLabel(type?: string | null) {
  if (type === "evaluation") return "Evaluación";
  if (type === "protocol") return "Protocolo";
  if (type === "final_project") return "Trabajo final";

  return "Actividad académica";
}

function getStatusLabel(status?: string | null) {
  if (status === "completed") return "Completada";
  if (status === "overdue") return "Vencida";
  if (status === "upcoming") return "Próxima";

  return "Pendiente";
}

function getCompanionMessage(activity: Activity) {
  if (activity.status === "completed") {
    return "Ya está completada. Buen avance.";
  }

  if (!activity.due_at) {
    return "Esta actividad aún no tiene una fecha clara.";
  }

  const now = new Date();
  const due = new Date(activity.due_at);

  if (Number.isNaN(due.getTime())) {
    return "Esta actividad aún no tiene una fecha clara.";
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffDays = Math.ceil((dueDay.getTime() - today.getTime()) / DAY_MS);

  if (diffDays < 0) {
    return "Esta actividad ya venció. Vamos con calma, una cosa a la vez.";
  }

  if (diffDays === 0) {
    return "Esta actividad vence hoy. Puedes resolverla paso a paso.";
  }

  if (diffDays === 1) {
    return "Vence mañana. Buen momento para dejarla lista.";
  }

  return `Faltan ${diffDays} días. Todavía tienes margen para organizarte.`;
}

function getTone(activity: Activity, colors: Colors) {
  if (activity.status === "completed") {
    return {
      color: colors.success,
      soft: colors.successSoft,
      icon: "checkmark-circle-outline" as const,
    };
  }

  if (activity.status === "overdue") {
    return {
      color: colors.danger,
      soft: colors.dangerSoft,
      icon: "alert-circle-outline" as const,
    };
  }

  return {
    color: colors.primary,
    soft: colors.primarySoft,
    icon: "calendar-outline" as const,
  };
}

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const loadActivity = useCallback(async () => {
    try {
      setLoading(true);

      const activities = await getActivities();
      const found = activities.find((item) => String(item.id) === String(id));

      setActivity(found || null);
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "No pudimos cargar la actividad.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const isCompleted = activity?.status === "completed";

  const subjectName = useMemo(
    () => (activity ? getSubjectName(activity) : "Materia sin clasificar"),
    [activity]
  );

  const typeLabel = useMemo(
    () => getTypeLabel(activity?.type),
    [activity?.type]
  );

  const statusLabel = useMemo(
    () => getStatusLabel(activity?.status),
    [activity?.status]
  );

  const formattedDate = useMemo(
    () => formatDate(activity?.due_at ?? null),
    [activity?.due_at]
  );

  const companionMessage = useMemo(
    () => (activity ? getCompanionMessage(activity) : ""),
    [activity]
  );

  const tone = useMemo(
    () => (activity ? getTone(activity, colors) : null),
    [activity, colors]
  );

  const handleComplete = useCallback(async () => {
    if (!activity?.id || completing) return;

    const previousStatus = activity.status;

    try {
      setCompleting(true);

      setActivity((prev) =>
        prev ? { ...prev, status: "completed" } : prev
      );

      cancelActivityNotifications(activity.id).catch((error) => {
        console.warn("Error cancelling notifications:", error);
      });

      await completeActivity(activity.id);
    } catch (error: any) {
      setActivity((prev) =>
        prev ? { ...prev, status: previousStatus } : prev
      );

      Alert.alert(
        "Error",
        error?.message ?? "No pudimos marcar la actividad como completada."
      );
    } finally {
      setCompleting(false);
    }
  }, [activity, completing]);

  const handleOpenPlatform = useCallback(async () => {
    try {
      const canOpen = await Linking.canOpenURL(SIMA_URL);

      if (!canOpen) {
        Alert.alert(
          "No se pudo abrir SIMA",
          "Intenta ingresar manualmente desde tu navegador."
        );
        return;
      }

      await Linking.openURL(SIMA_URL);
    } catch {
      Alert.alert(
        "No se pudo abrir SIMA",
        "Intenta ingresar manualmente desde tu navegador."
      );
    }
  }, []);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

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
            Cargando actividad...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!activity || !tone) {
    return (
      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >

        <View style={styles.center}>
          <View
            style={[
              styles.notFoundIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={34}
              color={colors.text}
            />
          </View>

          <Text style={[styles.notFound, { color: colors.text }]}>
            Actividad no encontrada
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

        <Text style={[styles.headerLabel, { color: colors.primary }]}>
          ACTIVIDAD
        </Text>
      </View>

      <View
        style={[
          styles.hero,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <View style={styles.heroTop}>
          <View style={[styles.iconCircle, { backgroundColor: tone.soft }]}>
            <Ionicons name={tone.icon} size={30} color={tone.color} />
          </View>

          <View style={[styles.statusPill, { backgroundColor: tone.soft }]}>
            <Text style={[styles.statusPillText, { color: tone.color }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {activity.title}
        </Text>

        <Text style={[styles.meta, { color: colors.muted }]}>
          {typeLabel} · {subjectName}
        </Text>
      </View>

      <View style={[styles.companionCard, { backgroundColor: colors.primarySoft }]}>
        <View style={[styles.companionIcon, { backgroundColor: colors.surface }]}>
          <Ionicons name="sparkles-outline" size={22} color={colors.text} />
        </View>

        <Text style={[styles.companionText, { color: colors.text }]}>
          {companionMessage}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Descripción
        </Text>

        <Text style={[styles.description, { color: colors.muted }]}>
          {activity.description || "Sin descripción disponible."}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Información
        </Text>

        <InfoRow label="Estado" value={statusLabel} colors={colors} />
        <InfoRow
          label="Prioridad"
          value={activity.priority || "Normal"}
          colors={colors}
        />
        <InfoRow label="Materia" value={subjectName} colors={colors} />
        <InfoRow
          label="Unidad"
          value={activity.unit_number ? `Unidad ${activity.unit_number}` : "-"}
          colors={colors}
        />
        <InfoRow label="Fecha" value={formattedDate} colors={colors} />
      </View>

      {!isCompleted ? (
        <Pressable
          style={[
            styles.completeButton,
            {
              backgroundColor: colors.primary,
              shadowOpacity: isDark ? 0 : 0.08,
            },
            completing && styles.disabledButton,
          ]}
          onPress={handleComplete}
          disabled={completing}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color="#11120F"
          />

          <Text style={[styles.completeText, { color: "#11120F" }]}>
            {completing ? "Marcando..." : "Marcar completada"}
          </Text>
        </Pressable>
      ) : (
        <View
          style={[
            styles.completedCard,
            {
              backgroundColor: colors.successSoft,
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={22}
            color={colors.success}
          />

          <Text style={[styles.completedText, { color: colors.success }]}>
            Esta actividad ya está completada
          </Text>
        </View>
      )}

      <Pressable
        style={[
          styles.platformButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowOpacity: isDark ? 0 : 0.06,
          },
        ]}
        onPress={handleOpenPlatform}
      >
        <Ionicons name="open-outline" size={20} color={colors.text} />

        <Text style={[styles.platformText, { color: colors.text }]}>
          Ir a la plataforma oficial
        </Text>
      </Pressable>
    </Screen>
  );
}

const InfoRow = memo(function InfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: Colors;
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
    </View>
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
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    fontWeight: "700",
    marginTop: spacing.md,
  },

  notFoundIcon: {
    width: 66,
    height: 66,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  notFound: {
    fontSize: 18,
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

  header: {
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

  hero: {
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  statusPill: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: radius.full,
  },

  statusPillText: {
    fontSize: 12,
    fontWeight: "900",
  },

  title: {
    fontSize: 31,
    fontWeight: "900",
    lineHeight: 38,
    letterSpacing: -1,
  },

  meta: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: spacing.md,
    lineHeight: 22,
  },

  companionCard: {
    borderRadius: 24,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  companionIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  companionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },

  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: spacing.md,
  },

  description: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 23,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: 16,
  },

  infoLabel: {
    fontSize: 14,
    fontWeight: "700",
  },

  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "right",
  },

  completeButton: {
    borderRadius: radius.xl,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  disabledButton: {
    opacity: 0.65,
  },

  completeText: {
    fontSize: 16,
    fontWeight: "900",
    marginLeft: spacing.sm,
  },

  completedCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: 17,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: spacing.md,
  },

  completedText: {
    fontSize: 15,
    fontWeight: "900",
    marginLeft: spacing.sm,
  },

  platformButton: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  platformText: {
    fontSize: 16,
    fontWeight: "900",
    marginLeft: spacing.sm,
  },
});