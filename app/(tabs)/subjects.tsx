import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import SubjectCard from "../../src/components/SubjectCard";
import { getActivities } from "@/src/services/activity.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

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

type Subject = {
  id: string;
  name: string;
  progress: number;
  pending: number;
  currentUnit: number;
};

function getSubjectName(activity: Activity) {
  if (activity.subject_name?.trim()) return activity.subject_name.trim();
  if (activity.subject_code?.trim()) return activity.subject_code.trim();

  return "Materia sin clasificar";
}

function createSubjectId(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9áéíóúñü-]/gi, "");
}

export default function SubjectsScreen() {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      setLoading(true);
      const data = await getActivities();
      setActivities(data ?? []);
    } catch (error) {
      console.log("Error cargando materias:", error);
    } finally {
      setLoading(false);
    }
  }

  const pendingCount = useMemo(() => {
    let count = 0;

    for (const activity of activities) {
      if (activity.status !== "completed") {
        count++;
      }
    }

    return count;
  }, [activities]);

  const subjects = useMemo<Subject[]>(() => {
    const grouped = activities.reduce<Record<string, Activity[]>>(
      (acc, activity) => {
        const subjectName = getSubjectName(activity);

        if (!acc[subjectName]) {
          acc[subjectName] = [];
        }

        acc[subjectName].push(activity);
        return acc;
      },
      {}
    );

    return Object.entries(grouped)
      .map(([name, subjectActivities]) => {
        let completed = 0;
        let pending = 0;
        let currentUnit = 1;

        for (const activity of subjectActivities) {
          if (activity.status === "completed") {
            completed++;
          } else {
            pending++;
          }

          if (
            typeof activity.unit_number === "number" &&
            activity.unit_number > currentUnit
          ) {
            currentUnit = activity.unit_number;
          }
        }

        const progress =
          subjectActivities.length === 0
            ? 0
            : Math.round((completed / subjectActivities.length) * 100);

        return {
          id: createSubjectId(name),
          name,
          progress,
          pending,
          currentUnit,
        };
      })
      .sort((a, b) => {
        if (a.name === "Materia sin clasificar") return 1;
        if (b.name === "Materia sin clasificar") return -1;

        return a.name.localeCompare(b.name);
      });
  }, [activities]);

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <View
          style={[
            styles.loading,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} />

          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Cargando materias...
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
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>
              MATERIAS
            </Text>

            <Text style={[styles.title, { color: colors.text }]}>
              Tus cursos
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              AVI organiza tus actividades por asignatura.
            </Text>
          </View>

          <View
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowOpacity: isDark ? 0 : 0.08,
              },
            ]}
          >
            <Ionicons name="book-outline" size={24} color={colors.text} />
          </View>
        </View>

        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.05,
            },
          ]}
        >
          <View
            style={[
              styles.summaryIcon,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Ionicons name="layers-outline" size={24} color={colors.text} />
          </View>

          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              Materias activas
            </Text>

            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {subjects.length}
            </Text>
          </View>

          <View
            style={[
              styles.summaryPill,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Text style={[styles.summaryPillText, { color: colors.text }]}>
              {pendingCount} pendientes
            </Text>
          </View>
        </View>

        {subjects.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowOpacity: isDark ? 0 : 0.05,
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
                name="file-tray-outline"
                size={34}
                color={colors.primary}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No hay materias todavía
            </Text>

            <Text style={[styles.emptyText, { color: colors.muted }]}>
              Importa tu calendario para que AVI pueda organizar tus actividades.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {subjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                id={subject.id}
                name={subject.name}
                progress={subject.progress}
                pending={subject.pending}
                currentUnit={subject.currentUnit}
              />
            ))}
          </View>
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
  },

  loadingText: {
    marginTop: 12,
    fontWeight: "700",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    shadowColor: "#000000",
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  summaryCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  summaryIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  summaryInfo: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  summaryTitle: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },

  summaryPill: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },

  summaryPillText: {
    fontSize: 12,
    fontWeight: "900",
  },

  list: {
    gap: 14,
  },

  emptyCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000000",
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
    lineHeight: 21,
  },
});