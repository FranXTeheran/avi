import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { getActivities } from "@/src/services/activity.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

type ActivityStatus = "pending" | "upcoming" | "overdue" | "completed";

type Activity = {
  id: string;
  title: string;
  description?: string | null;
  due_at: string | null;
  status: string;
  type?: string | null;
  priority?: string | null;
  unit_number?: number | null;
};

type ActivityTone = {
  color: string;
  soft: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

const WEEK_DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const FALLBACK_TIME = 9999999999999;
const TAB_ACTIVITY_LIMIT = 3;

function getLocalDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getMonthDays(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

function formatSelectedDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatTime(value: string | null) {
  if (!value) return "Sin hora";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin hora";

  return date.toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string | null | undefined): ActivityStatus {
  if (status === "completed") return "completed";
  if (status === "overdue") return "overdue";
  if (status === "upcoming") return "upcoming";

  return "pending";
}

function getStatusLabel(status: ActivityStatus) {
  if (status === "completed") return "Lista";
  if (status === "overdue") return "Alta";
  if (status === "upcoming") return "Media";

  return "Pendiente";
}

function getActivityTone(status: ActivityStatus, isDark: boolean, colors: Colors): ActivityTone {
  if (status === "completed") {
    return {
      color: colors.success,
      soft: colors.successSoft,
      icon: "checkmark-circle-outline",
    };
  }

  if (status === "overdue") {
    return {
      color: colors.danger,
      soft: colors.dangerSoft,
      icon: "alert-circle-outline",
    };
  }

  if (status === "upcoming") {
    return {
      color: isDark ? "#7DB7FF" : "#3B82F6",
      soft: isDark ? "#172A42" : "#EEF5FF",
      icon: "book-outline",
    };
  }

  return {
    color: colors.primary,
    soft: colors.primarySoft,
    icon: "document-text-outline",
  };
}

type DayCellProps = {
  date: Date | null;
  selectedDate: string;
  todayKey: string;
  activities: Activity[];
  colors: Colors;
  isDark: boolean;
  onSelectDate: (dateKey: string) => void;
  index: number;
};

const DayCell = memo(function DayCell({
  date,
  selectedDate,
  todayKey,
  activities,
  colors,
  isDark,
  onSelectDate,
  index,
}: DayCellProps) {
  if (!date) {
    return <View key={`empty-${index}`} style={styles.dayCell} />;
  }

  const dateKey = getLocalDateKey(date);
  const selected = dateKey === selectedDate;
  const today = dateKey === todayKey;

  const handlePress = () => {
    onSelectDate(dateKey);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.dayCell,
        today && !selected && { backgroundColor: colors.primarySoft },
        selected && { backgroundColor: colors.primary },
      ]}
    >
      <Text
        style={[
          styles.dayText,
          {
            color: selected ? "#FFFFFF" : colors.text,
            fontWeight: selected ? "900" : "700",
          },
        ]}
      >
        {date.getDate()}
      </Text>

      <View style={styles.dotsRow}>
        {activities.slice(0, TAB_ACTIVITY_LIMIT).map((activity) => {
          const tone = getActivityTone(normalizeStatus(activity.status), isDark, colors);

          return (
            <View
              key={activity.id}
              style={[
                styles.dot,
                {
                  backgroundColor: selected ? "#FFFFFF" : tone.color,
                },
              ]}
            />
          );
        })}
      </View>
    </Pressable>
  );
});

type ActivityCardProps = {
  item: Activity;
  colors: Colors;
  isDark: boolean;
  onOpenActivity: (id: string) => void;
};

const ActivityCard = memo(function ActivityCard({
  item,
  colors,
  isDark,
  onOpenActivity,
}: ActivityCardProps) {
  const normalizedStatus = normalizeStatus(item.status);
  const tone = getActivityTone(normalizedStatus, isDark, colors);

  const handlePress = () => {
    onOpenActivity(item.id);
  };

  return (
    <Pressable
      style={[
        styles.activityCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      onPress={handlePress}
    >
      <View style={[styles.leftAccent, { backgroundColor: tone.color }]} />

      <View style={[styles.activityIcon, { backgroundColor: tone.soft }]}>
        <Ionicons name={tone.icon} size={24} color={tone.color} />
      </View>

      <View style={styles.activityInfo}>
        <Text
          style={[styles.activityTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </Text>

        <Text
          style={[styles.activityMeta, { color: colors.muted }]}
          numberOfLines={1}
        >
          {item.type || "Actividad académica"}
          {item.unit_number ? ` · Unidad ${item.unit_number}` : ""}
        </Text>

        <View style={styles.timeRow}>
          <Ionicons name="time-outline" size={15} color={colors.muted} />

          <Text style={[styles.activityTime, { color: colors.muted }]}>
            {formatTime(item.due_at)}
          </Text>
        </View>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: tone.soft }]}>
        <Text style={[styles.statusText, { color: tone.color }]}>
          {getStatusLabel(normalizedStatus)}
        </Text>
      </View>
    </Pressable>
  );
});

export default function CalendarScreen() {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateKey(new Date()));

  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);

  const loadActivities = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getActivities();
      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando calendario:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  useFocusEffect(
    useCallback(() => {
      loadActivities(true);
    }, [loadActivities])
  );

  const activitiesByDate = useMemo(() => {
    return activities.reduce<Record<string, Activity[]>>((acc, activity) => {
      if (!activity.due_at) return acc;

      const key = getLocalDateKey(activity.due_at);
      if (!key) return acc;

      if (!acc[key]) acc[key] = [];
      acc[key].push(activity);

      return acc;
    }, {});
  }, [activities]);

  const selectedActivities = useMemo(() => {
    return [...(activitiesByDate[selectedDate] ?? [])].sort((a, b) => {
      const timeA = a.due_at ? new Date(a.due_at).getTime() : FALLBACK_TIME;
      const timeB = b.due_at ? new Date(b.due_at).getTime() : FALLBACK_TIME;

      return timeA - timeB;
    });
  }, [activitiesByDate, selectedDate]);

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);

  const monthLabel = useMemo(() => formatMonth(currentMonth), [currentMonth]);

  const selectedDateLabel = useMemo(
    () => formatSelectedDate(selectedDate),
    [selectedDate]
  );

  const handlePreviousMonth = useCallback(() => {
    setCurrentMonth((month) => {
      return new Date(month.getFullYear(), month.getMonth() - 1, 1);
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((month) => {
      return new Date(month.getFullYear(), month.getMonth() + 1, 1);
    });
  }, []);

  const handleSelectDate = useCallback((dateKey: string) => {
    setSelectedDate(dateKey);
  }, []);

  const handleGoToday = useCallback(() => {
    setSelectedDate(getLocalDateKey(new Date()));
  }, []);

  const handleOpenActivity = useCallback((id: string) => {
    router.push({
      pathname: "/activity/[id]",
      params: { id },
    });
  }, []);

  const renderActivity = useCallback(
    ({ item }: { item: Activity }) => (
      <ActivityCard
        item={item}
        colors={colors}
        isDark={isDark}
        onOpenActivity={handleOpenActivity}
      />
    ),
    [colors, isDark, handleOpenActivity]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <View style={[styles.loading, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />

          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Preparando tu calendario...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <StatusBar style={isDark ? "light" : "dark"} translucent />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { backgroundColor: colors.background },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadActivities(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>AGENDA</Text>

            <Text style={[styles.title, { color: colors.text }]}>
              Calendario
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Organiza tu tiempo y no te pierdas nada.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.calendarCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.monthHeader}>
            <Pressable
              style={[styles.monthButton, { backgroundColor: colors.primarySoft }]}
              onPress={handlePreviousMonth}
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>

            <Text style={[styles.monthTitle, { color: colors.text }]}>
              {monthLabel}
            </Text>

            <Pressable
              style={[styles.monthButton, { backgroundColor: colors.primarySoft }]}
              onPress={handleNextMonth}
            >
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={[styles.weekDay, { color: colors.muted }]}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {monthDays.map((date, index) => {
              const dateKey = date ? getLocalDateKey(date) : "";
              const dayActivities = dateKey ? activitiesByDate[dateKey] ?? [] : [];

              return (
                <DayCell
                  key={dateKey || `empty-${index}`}
                  date={date}
                  selectedDate={selectedDate}
                  todayKey={todayKey}
                  activities={dayActivities}
                  colors={colors}
                  isDark={isDark}
                  onSelectDate={handleSelectDate}
                  index={index}
                />
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedDateLabel}
          </Text>

          <Pressable
            style={[styles.todayBadge, { backgroundColor: colors.primarySoft }]}
            onPress={handleGoToday}
          >
            <Ionicons name="calendar-outline" size={16} color={colors.text} />

            <Text style={[styles.todayBadgeText, { color: colors.text }]}>
              Hoy
            </Text>
          </Pressable>
        </View>

        {selectedActivities.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons
                name="sparkles-outline"
                size={30}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Día despejado
            </Text>

            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No hay actividades para este día.
            </Text>
          </View>
        ) : (
          <FlatList
            data={selectedActivities}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={renderActivity}
            initialNumToRender={6}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 130,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingText: {
    marginTop: 12,
    fontWeight: "700",
  },

  header: {
    marginBottom: 24,
  },

  logo: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },

  title: {
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: -1.6,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "700",
    maxWidth: 260,
  },

  calendarCard: {
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 22,
    marginBottom: 28,
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  monthHeader: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  monthTitle: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.6,
    textTransform: "capitalize",
  },

  weekRow: {
    flexDirection: "row",
    marginBottom: 12,
  },

  weekDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900",
  },

  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: `${100 / 7}%`,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    marginVertical: 2,
  },

  dayText: {
    fontSize: 18,
  },

  dotsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    minHeight: 6,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.6,
    textTransform: "capitalize",
  },

  todayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginLeft: 12,
  },

  todayBadgeText: {
    fontSize: 14,
    fontWeight: "900",
  },

  list: {
    gap: 12,
  },

  activityCard: {
    minHeight: 92,
    borderRadius: 24,
    borderWidth: 1,
    paddingVertical: 14,
    paddingLeft: 18,
    paddingRight: 14,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  leftAccent: {
    position: "absolute",
    left: 0,
    top: 16,
    bottom: 16,
    width: 3,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },

  activityIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  activityInfo: {
    flex: 1,
    paddingRight: 8,
  },

  activityTitle: {
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },

  activityMeta: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  activityTime: {
    fontSize: 13,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "900",
  },

  emptyCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
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
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 8,
  },
});