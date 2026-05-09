import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  Text,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "@/src/hooks/useAppTheme";

import Screen from "../../src/components/Screen";
import { getProfile } from "@/src/services/auth.service";
import { getActivities } from "@/src/services/activity.service";

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

type GreetingContext = {
  title: string;
  subtitle: string;
  cardTitle: string;
  cardDescription: string;
  image: "calm" | "attention" | "support" | "welcome";
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

const DAY_MS = 1000 * 60 * 60 * 24;
const TOP_DELIVERIES_LIMIT = 3;

const welcomeImages = {
  welcome: require("../../assets/images/home-welcome.png"),
  calm: require("../../assets/images/home-calm.png"),
  attention: require("../../assets/images/home-attention.png"),
  support: require("../../assets/images/home-support.png"),
};

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatShortDate(date: string | null): string {
  if (!date) return "Sin fecha";

  const parsedDate = new Date(date);
  if (!isValidDate(parsedDate)) return "Sin fecha";

  return parsedDate.toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function daysUntil(date: string | null): number | null {
  if (!date) return null;

  const due = new Date(date);
  if (!isValidDate(due)) return null;

  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
}

function priorityScore(activity: Activity): number {
  if (activity.priority === "high") return 0;
  if (activity.type === "evaluation") return 1;
  if (activity.type === "final_project") return 2;
  if (activity.type === "protocol") return 3;

  return 4;
}

function getGreeting(userName: string, activities: Activity[]): GreetingContext {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const hour = now.getHours();
  const timeGreeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  let overdueCount = 0;
  let pendingCount = 0;
  let dueTodayCount = 0;
  let dueTomorrowCount = 0;
  let firstToday: Activity | null = null;
  let firstTomorrow: Activity | null = null;

  for (const activity of activities) {
    if (activity.status === "completed" || !activity.due_at) continue;

    const due = new Date(activity.due_at);
    if (!isValidDate(due)) continue;

    if (due < now) {
      overdueCount += 1;
      continue;
    }

    pendingCount += 1;

    if (isSameDay(due, now)) {
      dueTodayCount += 1;
      if (!firstToday) firstToday = activity;
    }

    if (isSameDay(due, tomorrow)) {
      dueTomorrowCount += 1;
      if (!firstTomorrow) firstTomorrow = activity;
    }
  }

  if (overdueCount > 0) {
    return {
      title: `${timeGreeting}, ${userName}`,
      subtitle:
        overdueCount === 1
          ? "Tienes una actividad vencida. Una cosa a la vez."
          : `Tienes ${overdueCount} actividades vencidas. Vamos paso a paso.`,
      cardTitle: "Vamos paso a paso ",
      cardDescription: "AVI te ayuda a organizarte. Empieza por la más cercana.",
      image: "support",
    };
  }

  if (dueTodayCount > 0 && firstToday) {
    return {
      title: `${timeGreeting}, ${userName}`,
      subtitle:
        dueTodayCount === 1
          ? "Hoy vence una actividad. Puedes con esto."
          : `Hoy vencen ${dueTodayCount} actividades. Una cosa a la vez.`,
      cardTitle: "Hoy tienes entregas ",
      cardDescription:
        dueTodayCount === 1
          ? `${firstToday.title}. Todavía tienes tiempo.`
          : `${firstToday.title} y ${dueTodayCount - 1} más. Puedes organizarte con calma.`,
      image: "attention",
    };
  }

  if (dueTomorrowCount > 0 && firstTomorrow) {
    return {
      title: `${timeGreeting}, ${userName}`,
      subtitle: "Mañana tienes entregas. Buen momento para adelantar.",
      cardTitle: "Mañana vence algo ",
      cardDescription: `${firstTomorrow.title}. Buen momento para dejarlo listo hoy.`,
      image: "attention",
    };
  }

  if (pendingCount > 0) {
    return {
      title: `${timeGreeting}, ${userName}`,
      subtitle: "Tu semana se ve manejable. Sigue así.",
      cardTitle: "Todo tranquilo por ahora",
      cardDescription: "No tienes entregas urgentes. Puedes organizarte con calma.",
      image: "calm",
    };
  }

  return {
    title: `${timeGreeting}, ${userName}`,
    subtitle: "Todo al día. Buen trabajo.",
    cardTitle: "¡Todo al día!",
    cardDescription: "No tienes pendientes por ahora. Disfruta el momento.",
    image: activities.length === 0 ? "welcome" : "calm",
  };
}

const QuickCard = memo(function QuickCard({
  title,
  subtitle,
  icon,
  colors,
  isDark,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: Colors;
  isDark: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.quickCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={24} color={colors.text} />
      </View>

      <Text style={[styles.quickTitle, { color: colors.text }]}>{title}</Text>

      <Text style={[styles.quickSubtitle, { color: colors.muted }]}>
        {subtitle}
      </Text>
    </Pressable>
  );
});

const DeliveryItem = memo(function DeliveryItem({
  activity,
  isLast,
  colors,
  onPress,
}: {
  activity: Activity;
  isLast: boolean;
  colors: Colors;
  onPress: (id: string) => void;
}) {
  const days = daysUntil(activity.due_at);

  const handlePress = useCallback(() => {
    onPress(activity.id);
  }, [activity.id, onPress]);

  return (
    <Pressable
      style={[
        styles.deliveryItem,
        !isLast && [
          styles.deliveryBorder,
          { borderBottomColor: colors.border },
        ],
      ]}
      onPress={handlePress}
    >
      <View style={[styles.deliveryDateBox, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="calendar-outline" size={18} color={colors.text} />
      </View>

      <View style={styles.deliveryInfo}>
        <Text
          style={[styles.deliveryTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {activity.title}
        </Text>

        <Text style={[styles.deliveryMeta, { color: colors.muted }]}>
          {formatShortDate(activity.due_at)}
          {days !== null && ` · ${days === 0 ? "vence hoy" : `en ${days} días`}`}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </Pressable>
  );
});

export default function HomeScreen() {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("compañero");

  const profileLoadedRef = useRef(false);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);

      if (!profileLoadedRef.current) {
        const [profile, data] = await Promise.all([
          getProfile(),
          getActivities(),
        ]);

        if (profile?.name) {
          setUserName(profile.name.split(" ")[0]);
        }

        profileLoadedRef.current = true;
        setActivities(data ?? []);
        return;
      }

      const data = await getActivities();
      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando home:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

  const upcoming = useMemo(() => {
    const now = new Date();

    return activities
      .filter((activity) => {
        if (activity.status === "completed" || !activity.due_at) return false;

        const due = new Date(activity.due_at);
        return isValidDate(due) && due >= now;
      })
      .sort((a, b) => {
        const priorityA = priorityScore(a);
        const priorityB = priorityScore(b);

        if (priorityA !== priorityB) return priorityA - priorityB;

        return new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime();
      });
  }, [activities]);

  const topThree = useMemo(
    () => upcoming.slice(0, TOP_DELIVERIES_LIMIT),
    [upcoming]
  );

  const nextActivity = topThree[0];

  const completionPercent = useMemo(() => {
    if (activities.length === 0) return 0;

    let completedCount = 0;

    for (const activity of activities) {
      if (activity.status === "completed") completedCount += 1;
    }

    return Math.round((completedCount / activities.length) * 100);
  }, [activities]);

  const greeting = useMemo(
    () => getGreeting(userName, activities),
    [userName, activities]
  );

  const handleGoProfile = useCallback(() => {
    router.push("/profile" as any);
  }, []);

  const handleGoCalendar = useCallback(() => {
    router.push("/calendar" as any);
  }, []);

  const handleGoSubjects = useCallback(() => {
    router.push("/subjects" as any);
  }, []);

  const handleGoAlerts = useCallback(() => {
    router.push("/alerts" as any);
  }, []);

  const handleGoProgress = useCallback(() => {
    router.push("/activities?filter=completed" as any);
  }, []);

  const handleGoPending = useCallback(() => {
    router.push("/activities?filter=pending" as any);
  }, []);

  const handleGoImportCalendar = useCallback(() => {
    router.push("/(onboarding)/import-calendar" as any);
  }, []);

  const handleOpenActivity = useCallback((id: string) => {
    router.push({
      pathname: "/activity/[id]",
      params: { id },
    });
  }, []);

  const handleSummaryPress = useCallback(() => {
    if (nextActivity) {
      handleOpenActivity(nextActivity.id);
      return;
    }

    handleGoPending();
  }, [nextActivity, handleOpenActivity, handleGoPending]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <Screen
          contentStyle={[
            styles.loadingContent,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />

            <Text style={[styles.loadingText, { color: colors.muted }]}>
              Preparando tu día...
            </Text>
          </View>
        </Screen>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <Screen
        contentStyle={[
          styles.screenContent,
          { backgroundColor: colors.background },
        ]}
      >
        <View style={[styles.page, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.logo, { color: colors.primary }]}>AVI</Text>

              <Text style={[styles.greeting, { color: colors.text }]}>
                {greeting.title}
              </Text>

              <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
                {greeting.subtitle}
              </Text>
            </View>

            <Pressable
              style={[
                styles.profileButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowOpacity: isDark ? 0 : 0.08,
                },
              ]}
              onPress={handleGoProfile}
            >
              <Ionicons name="person-outline" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View
            style={[
              styles.welcomeCard,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <View style={styles.welcomeText}>
              <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                {greeting.cardTitle}
              </Text>

              <Text style={[styles.welcomeDescription, { color: colors.muted }]}>
                {greeting.cardDescription}
              </Text>
            </View>

            <Image
              source={welcomeImages[greeting.image]}
              style={styles.welcomeImage}
              resizeMode="contain"
            />
          </View>

          <Pressable
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowOpacity: isDark ? 0 : 0.1,
              },
            ]}
            onPress={handleSummaryPress}
          >
            <View
              style={[
                styles.summaryIconBox,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons
                name={nextActivity ? "calendar-outline" : "checkmark"}
                size={24}
                color={colors.text}
              />
            </View>

            <View style={styles.summaryTextBox}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>
                Actividades próximas
              </Text>

              <Text style={[styles.summaryTitle, { color: colors.text }]}>
                {upcoming.length} pendientes
              </Text>

              <Text
                style={[styles.summarySubtitle, { color: colors.muted }]}
                numberOfLines={2}
              >
                {nextActivity
                  ? `${nextActivity.title} · ${formatShortDate(nextActivity.due_at)}`
                  : "¡Todo al día! Sigue así."}
              </Text>
            </View>

            <View
              style={[styles.summaryCheck, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="checkmark" size={22} color="#FFFFFF" />
            </View>
          </Pressable>

          <View style={styles.quickGrid}>
            <QuickCard
              title="Agenda"
              subtitle="Ver calendario"
              icon="calendar-outline"
              colors={colors}
              isDark={isDark}
              onPress={handleGoCalendar}
            />

            <QuickCard
              title="Materias"
              subtitle="Tus cursos"
              icon="book-outline"
              colors={colors}
              isDark={isDark}
              onPress={handleGoSubjects}
            />

            <QuickCard
              title="Alertas"
              subtitle="Recordatorios"
              icon="notifications-outline"
              colors={colors}
              isDark={isDark}
              onPress={handleGoAlerts}
            />

            <QuickCard
              title="Progreso"
              subtitle={`${completionPercent}% avance`}
              icon="bar-chart-outline"
              colors={colors}
              isDark={isDark}
              onPress={handleGoProgress}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Próximas entregas
            </Text>

            <Pressable onPress={handleGoPending}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>
                Ver todas
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.deliveriesCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowOpacity: isDark ? 0 : 0.05,
              },
            ]}
          >
            {topThree.length === 0 ? (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Ionicons
                    name="file-tray-outline"
                    size={34}
                    color={colors.primary}
                  />
                </View>

                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Aún no tienes entregas próximas.
                </Text>

                <Text style={[styles.emptyText, { color: colors.muted }]}>
                  Cuando tengas actividades, aparecerán aquí.
                </Text>
              </View>
            ) : (
              topThree.map((activity, index) => (
                <DeliveryItem
                  key={activity.id}
                  activity={activity}
                  isLast={index === topThree.length - 1}
                  colors={colors}
                  onPress={handleOpenActivity}
                />
              ))
            )}
          </View>

          <Pressable
            style={[
              styles.importCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={handleGoImportCalendar}
          >
            <View
              style={[styles.importIcon, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={24}
                color={colors.text}
              />
            </View>

            <View style={styles.importText}>
              <Text style={[styles.importTitle, { color: colors.text }]}>
                Actualizar calendario
              </Text>

              <Text style={[styles.importSubtitle, { color: colors.muted }]}>
                Importa nuevas actividades cuando lo necesites.
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.subtle} />
          </Pressable>
        </View>
      </Screen>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  screenContent: {
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 120,
  },

  loadingContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 120,
  },

  page: {
    flex: 1,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 500,
  },

  loadingText: {
    marginTop: 12,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 22,
  },

  logo: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },

  greeting: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -1.5,
  },

  headerSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 28,
    fontWeight: "700",
    maxWidth: 270,
  },

  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    marginTop: 6,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  welcomeCard: {
    height: 200,
    borderRadius: 14,
    paddingTop: 16,
    paddingLeft: 24,
    marginBottom: 24,
    overflow: "hidden",
  },

  welcomeText: {
    width: "44%",
    zIndex: 2,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 28,
    letterSpacing: -1,
  },

  welcomeDescription: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 24,
    marginTop: 12,
  },

  welcomeImage: {
    position: "absolute",
    right: -48,
    bottom: -64,
    width: 300,
    height: 300,
  },

  summaryCard: {
    minHeight: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 1,
  },

  summaryIconBox: {
    width: 32,
    height: 32,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  summaryTextBox: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 12,
    fontWeight: "800",
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginTop: 2,
  },

  summarySubtitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },

  summaryCheck: {
    width: 34,
    height: 34,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 16,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 28,
  },

  quickCard: {
    width: "48%",
    height: 132,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginBottom: 14,
    shadowColor: "#000000",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  quickTitle: {
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },

  quickSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  sectionLink: {
    fontSize: 14,
    fontWeight: "900",
  },

  deliveriesCard: {
    borderRadius: 30,
    borderWidth: 1,
    minHeight: 230,
    padding: 22,
    marginBottom: 22,
    shadowColor: "#000000",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  emptyState: {
    flex: 1,
    minHeight: 178,
    alignItems: "center",
    justifyContent: "center",
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
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },

  deliveryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },

  deliveryBorder: {
    borderBottomWidth: 1,
  },

  deliveryDateBox: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  deliveryInfo: {
    flex: 1,
  },

  deliveryTitle: {
    fontSize: 15,
    fontWeight: "900",
  },

  deliveryMeta: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },

  importCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  importIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  importText: {
    flex: 1,
  },

  importTitle: {
    fontSize: 16,
    fontWeight: "900",
  },

  importSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 4,
  },
});