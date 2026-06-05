import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import {
  Text,
  StyleSheet,
  View,
  Pressable,
  ActivityIndicator,
  Image,
  Animated,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { useAuth } from "@/src/context/AuthContext";
import { useKai } from "@/src/hooks/useKai";

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

type Colors = ReturnType<typeof useAppTheme>["colors"];

const DAY_MS = 1000 * 60 * 60 * 24;
const TOP_DELIVERIES_LIMIT = 3;

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

function formatTime(date: string | null): string {
  if (!date) return "";
  const parsedDate = new Date(date);
  if (!isValidDate(parsedDate)) return "";
  return parsedDate.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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

function priorityLabel(priority: string | null): string {
  if (priority === "high") return "Alta prioridad";
  if (priority === "medium") return "Prioridad media";
  return "Prioridad baja";
}

// ─── KaiQuickCard ─────────────────────────────────────────────────────────────
const KaiQuickCard = ({
  title,
  icon,
  onPress,
  colors,
  active,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  colors: Colors;
  active?: boolean;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.kaiQuickCard,
      {
        backgroundColor: active ? colors.primary : colors.surface,
        borderColor: active ? colors.primary : colors.border,
        borderWidth: 1,
      },
    ]}
  >
    <View style={styles.kaiQuickContent}>
      <Ionicons
        name={icon}
        size={28}
        color={active ? "#fff" : colors.text}
      />
      <Text
        style={[
          styles.kaiQuickTitle,
          { color: active ? "#fff" : colors.text },
        ]}
      >
        {title}
      </Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={20}
      color={active ? "rgba(255,255,255,0.7)" : colors.subtle}
    />
  </Pressable>
);

// ─── UrgentCard ───────────────────────────────────────────────────────────────
const UrgentCard = memo(function UrgentCard({
  activity,
  colors,
  onPress,
}: {
  activity: Activity | null;
  colors: Colors;
  onPress: (id: string) => void;
}) {
  const handlePress = useCallback(() => {
    if (activity) onPress(activity.id);
  }, [activity, onPress]);

  if (!activity) {
    return (
      <View
        style={[
          styles.urgentCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.urgentIconBox, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
        </View>
        <View style={styles.urgentInfo}>
          <Text style={[styles.urgentTitle, { color: colors.text }]}>
            Sin entregas urgentes
          </Text>
          <Text style={[styles.urgentCalmText, { color: colors.muted }]}>
            Hoy no tienes nada que venza. Puedes organizarte con calma.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.urgentCard, { backgroundColor: "#FFF0F0", borderColor: "#FFCCCC" }]}
      onPress={handlePress}
    >
      <View style={[styles.urgentIconBox, { backgroundColor: "#E8453C" }]}>
        <Ionicons name="calendar-outline" size={28} color="#fff" />
        <View style={styles.urgentBadge}>
          <Ionicons name="alert-circle" size={16} color="#fff" />
        </View>
      </View>

      <View style={styles.urgentInfo}>
        <Text style={[styles.urgentTitle, { color: colors.text }]}>
          {activity.title}
        </Text>
        <Text style={styles.urgentVence}>Vence hoy</Text>
        <View style={styles.urgentMeta}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={[styles.urgentMetaText, { color: colors.muted }]}>
            {" "}{formatTime(activity.due_at)}
          </Text>
        </View>
        <View style={[styles.urgentPriorityBadge, { backgroundColor: "#FFE0E0" }]}>
          <Text style={styles.urgentPriorityText}>
            {priorityLabel(activity.priority)}
          </Text>
        </View>
      </View>

      <View style={styles.urgentChevron}>
        <Ionicons name="chevron-forward" size={20} color="#fff" />
      </View>
    </Pressable>
  );
});

// ─── DeliveryItem ─────────────────────────────────────────────────────────────
const DeliveryItem = memo(function DeliveryItem({
  activity,
  colors,
  onPress,
}: {
  activity: Activity;
  colors: Colors;
  onPress: (id: string) => void;
}) {
  const days = daysUntil(activity.due_at);
  const handlePress = useCallback(() => onPress(activity.id), [activity.id, onPress]);

  const metaText = useMemo(() => {
    if (days === null) return formatShortDate(activity.due_at);
    if (days === 0) return `Hoy • ${formatTime(activity.due_at)}`;
    if (days === 1) return `Mañana • ${formatTime(activity.due_at)}`;
    return `En ${days} días • ${formatShortDate(activity.due_at)}`;
  }, [days, activity.due_at]);

  return (
    <Pressable
      style={[
        styles.deliveryItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.deliveryIconBox, { backgroundColor: colors.text }]}>
        <Ionicons name="calendar-outline" size={20} color={colors.surface} />
      </View>

      <View style={styles.deliveryInfo}>
        <Text style={[styles.deliveryTitle, { color: colors.text }]} numberOfLines={1}>
          {activity.title}
        </Text>
        <View style={styles.deliveryMetaRow}>
          <Ionicons name="time-outline" size={13} color={colors.muted} />
          <Text style={[styles.deliveryMeta, { color: colors.muted }]}>
            {" "}{metaText}
          </Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.priorityText, { color: colors.text }]}>
            {priorityLabel(activity.priority)}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
    </Pressable>
  );
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors } = useAppTheme();
  const { session } = useAuth();

  const userId = session?.user.id;
  const kai = useKai(userId);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("compañero");
  const [activeQuery, setActiveQuery] = useState<
    "today" | "tomorrow" | "next" | "week" | null
  >(null);

  const profileLoadedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      if (!profileLoadedRef.current) {
        const [profile, data] = await Promise.all([getProfile(), getActivities()]);
        if (profile?.name) setUserName(profile.name.split(" ")[0]);
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

  useEffect(() => {
    if (!kai.response.text) return;

    fadeAnim.setValue(0);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      kai.clearResponse();
    });
  }, [kai.response.text]);

  const now = useMemo(() => new Date(), []);

  const upcoming = useMemo(() => {
    return activities
      .filter((a) => {
        if (a.status === "completed" || !a.due_at) return false;
        const due = new Date(a.due_at);
        return isValidDate(due) && due >= now;
      })
      .sort((a, b) => {
        const pa = priorityScore(a);
        const pb = priorityScore(b);
        if (pa !== pb) return pa - pb;
        return new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime();
      });
  }, [activities, now]);

  const urgentActivity = useMemo(() => {
    return (
      upcoming.find((a) => {
        if (!a.due_at) return false;
        return isSameDay(new Date(a.due_at), now);
      }) ?? null
    );
  }, [upcoming, now]);

  const topDeliveries = useMemo(() => {
    return upcoming
      .filter((a) => a.id !== urgentActivity?.id)
      .slice(0, TOP_DELIVERIES_LIMIT);
  }, [upcoming, urgentActivity]);

  const handleGoPending = useCallback(() => {
    router.push("/activities?filter=pending" as any);
  }, []);

  const handleGoImportCalendar = useCallback(() => {
    router.push("/(onboarding)/import-calendar" as any);
  }, []);

  const handleOpenActivity = useCallback((id: string) => {
    router.push({ pathname: "/activity/[id]", params: { id } });
  }, []);

  const handleQuickToday = useCallback(async () => {
    setActiveQuery("today");
    await kai.handleToday();
    setTimeout(() => setActiveQuery(null), 300);
  }, [kai]);

  const handleQuickTomorrow = useCallback(async () => {
    setActiveQuery("tomorrow");
    await kai.handleTomorrow();
    setTimeout(() => setActiveQuery(null), 300);
  }, [kai]);

  const handleQuickNext = useCallback(async () => {
    setActiveQuery("next");
    await kai.handleNext();
    setTimeout(() => setActiveQuery(null), 300);
  }, [kai]);

  const handleQuickWeek = useCallback(async () => {
    setActiveQuery("week");
    await kai.handleWeek();
    setTimeout(() => setActiveQuery(null), 300);
  }, [kai]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <Screen contentStyle={[styles.loadingContent, { backgroundColor: colors.background }]}>
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
      {/* ── Burbuja flotante de Kai ── */}
      {kai.response.text ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.kaiBubble,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/home-kai.png")}
            style={styles.kaiBubbleAvatar}
          />
          <Text style={[styles.kaiBubbleText, { color: colors.text }]}>
            {kai.response.text}
          </Text>
        </Animated.View>
      ) : null}

      <Screen contentStyle={[styles.screenContent, { backgroundColor: colors.background }]}>
        <View style={[styles.page, { backgroundColor: colors.background }]}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/home-kai.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={[styles.heroTitle, { color: colors.text }]}>
              Hola,{" "}
              <Text style={{ color: colors.primary }}>{userName}</Text>
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
              Tienes {upcoming.length} actividades pendientes
            </Text>
          </View>

          {/* ── Consultas rápidas ── */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              ⚡ CONSULTAS RÁPIDAS
            </Text>
          </View>

          <View style={styles.kaiQuickGrid}>
            <KaiQuickCard
              title="¿Qué tengo hoy?"
              icon="calendar-outline"
              colors={colors}
              active={activeQuery === "today"}
              onPress={handleQuickToday}
            />
            <KaiQuickCard
              title="¿Qué tengo mañana?"
              icon="calendar-outline"
              colors={colors}
              active={activeQuery === "tomorrow"}
              onPress={handleQuickTomorrow}
            />
            <KaiQuickCard
              title="Próxima entrega"
              icon="time-outline"
              colors={colors}
              active={activeQuery === "next"}
              onPress={handleQuickNext}
            />
            <KaiQuickCard
              title="Esta semana"
              icon="stats-chart-outline"
              colors={colors}
              active={activeQuery === "week"}
              onPress={handleQuickWeek}
            />
          </View>

          {/* ── Entrega urgente ── */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              ⚠️ ENTREGA URGENTE
            </Text>
          </View>
          <UrgentCard
            activity={urgentActivity}
            colors={colors}
            onPress={handleOpenActivity}
          />

          {/* ── Próximas entregas ── */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              📅 PRÓXIMAS ENTREGAS
            </Text>
            <Pressable onPress={handleGoPending}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>
                Ver todas  ›
              </Text>
            </Pressable>
          </View>

          {topDeliveries.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons name="file-tray-outline" size={34} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Sin entregas próximas
              </Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                Cuando tengas actividades, aparecerán aquí.
              </Text>
            </View>
          ) : (
            <View style={styles.deliveriesList}>
              {topDeliveries.map((activity) => (
                <DeliveryItem
                  key={activity.id}
                  activity={activity}
                  colors={colors}
                  onPress={handleOpenActivity}
                />
              ))}
            </View>
          )}

          {/* ── Importar calendario ── */}
          <Pressable
            style={[
              styles.importCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleGoImportCalendar}
          >
            <View style={[styles.importIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="cloud-upload-outline" size={24} color={colors.text} />
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1 },

  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  loadingContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },

  page: { flex: 1 },

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
    alignItems: "center",
    marginBottom: 24,
  },

  heroImage: {
    width: 220,
    height: 160,
    marginBottom: -8,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: -0.5,
  },

  heroSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },

  sectionLink: {
    fontSize: 14,
    fontWeight: "800",
  },

  // ── KaiQuickGrid ──
  kaiQuickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  kaiQuickCard: {
    width: "48%",
    height: 100,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  kaiQuickContent: {
    flex: 1,
    flexDirection: "column",
  },

  kaiQuickTitle: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    lineHeight: 20,
  },

  // ── KaiBubble ──
  kaiBubble: {
    position: "absolute",
    top: 70,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.97)",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  kaiBubbleAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
  },

  kaiBubbleText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },

  // ── UrgentCard ──
  urgentCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  urgentIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    position: "relative",
  },

  urgentBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8453C",
    alignItems: "center",
    justifyContent: "center",
  },

  urgentInfo: { flex: 1 },

  urgentTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  urgentCalmText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    lineHeight: 18,
  },

  urgentVence: {
    fontSize: 14,
    fontWeight: "800",
    color: "#E8453C",
    marginTop: 2,
  },

  urgentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  urgentMetaText: {
    fontSize: 13,
    fontWeight: "700",
  },

  urgentPriorityBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },

  urgentPriorityText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#E8453C",
  },

  urgentChevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8453C",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  // ── DeliveryItem ──
  deliveriesList: {
    gap: 10,
    marginBottom: 24,
  },

  deliveryItem: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  deliveryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  deliveryInfo: { flex: 1 },

  deliveryTitle: {
    fontSize: 15,
    fontWeight: "900",
  },

  deliveryMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  deliveryMeta: {
    fontSize: 12,
    fontWeight: "700",
  },

  priorityBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 6,
  },

  priorityText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // ── EmptyState ──
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 140,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginBottom: 24,
    gap: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── ImportCard ──
  importCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  importIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  importText: { flex: 1 },

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