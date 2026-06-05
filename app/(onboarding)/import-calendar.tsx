import { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { saveImportedActivities } from "@/src/services/activity.service";
import { importCalendarFile } from "@/src/services/calendar-import.service";
import {
  requestNotificationPermissions,
  rescheduleActivityNotifications,
} from "@/src/services/activity-notification.service";

const YELLOW = "#FFC21A";
const BLACK = "#1F1F1F";
const GRAY = "#8A8A8A";
const BORDER = "#E8E8E8";

export default function CalendarImportScreen() {
  const [loading, setLoading] = useState(false);

  async function handleImportCalendar() {
    try {
      setLoading(true);

      const activities = await importCalendarFile();

      if (!activities.length) {
        Alert.alert(
          "Sin actividades",
          "No se encontraron actividades en el archivo."
        );
        return;
      }

      const savedActivities = await saveImportedActivities(activities);

      const hasPermission = await requestNotificationPermissions();

      router.replace("/processing_calendar");

      if (hasPermission) {
        rescheduleActivityNotifications(savedActivities).catch((error) => {
          console.warn("Error rescheduling notifications:", error);
        });
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.message || "No se pudo importar el calendario."
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePasteCalendarLink() {
    Alert.alert(
      "Pegar enlace",
      "Todavía no hemos conectado la importación por enlace."
    );
  }

  function handleSkip() {
    router.replace("/homeKai");
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screen}>
        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.7}
          onPress={handleSkip}
          disabled={loading}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <Image
            source={require("../../assets/images/onboarding-import-calendar.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>
            Importa tu{"\n"}calendario académico
          </Text>

          <Text style={styles.description}>
            Importamos tus actividades y las organizamos por materia, unidad y
            fecha de entrega.
          </Text>

          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.disabledButton]}
            activeOpacity={0.9}
            onPress={handleImportCalendar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={BLACK} />
            ) : (
              <>
                <Feather name="calendar" size={16} color={BLACK} />
                <Text style={styles.primaryButtonText}>
                  Importar calendario
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, loading && styles.disabledButton]}
            activeOpacity={0.9}
            onPress={handlePasteCalendarLink}
            disabled={loading}
          >
            <Feather name="link" size={16} color={BLACK} />
            <Text style={styles.secondaryButtonText}>
              Pegar enlace de calendario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.laterButton}
            activeOpacity={0.8}
            onPress={handleSkip}
            disabled={loading}
          >
            <Text style={styles.laterText}>Lo haré después</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  skipButton: {
    alignSelf: "flex-end",
    marginTop: 48,
    marginRight: 28,
  },

  skipText: {
    fontSize: 14,
    color: BLACK,
    fontWeight: "500",
  },

  imageWrapper: {
    height: "42%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    marginTop: 4,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  content: {
    flex: 1,
    paddingHorizontal: 38,
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: BLACK,
    textAlign: "center",
    lineHeight: 30,
    marginBottom: 12,
  },

  description: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 310,
  },

  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
    marginBottom: 26,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: "#EDEDED",
  },

  activeDot: {
    backgroundColor: YELLOW,
  },

  primaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 13,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: BLACK,
  },

  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },

  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: BLACK,
  },

  laterButton: {
    marginTop: 18,
  },

  laterText: {
    fontSize: 14,
    fontWeight: "600",
    color: GRAY,
  },
});