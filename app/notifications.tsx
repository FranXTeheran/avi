import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import * as Notifications from "expo-notifications";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { useAppTheme } from "@/src/hooks/useAppTheme";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
  NotificationSound,
  VibrationMode,
} from "../src/types/notifications";

import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from "../src/services/notification-preferences.service";

import {
  sendTestNotification,
  rescheduleActivityNotifications,
} from "../src/services/activity-notification.service";

import { getActivities } from "../src/services/activity.service";

type Colors = ReturnType<typeof useAppTheme>["colors"];

function arePreferencesEqual(
  a: NotificationPreferences,
  b: NotificationPreferences
) {
  return (
    a.enabled === b.enabled &&
    a.sound === b.sound &&
    a.vibration === b.vibration
  );
}

export default function NotificationSettingsScreen() {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadPreferences = useCallback(async () => {
    try {
      const stored = await getNotificationPreferences();
      setPreferences(stored);
    } catch {
      setPreferences(DEFAULT_NOTIFICATION_PREFERENCES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const updatePreferences = useCallback(
    async (nextPreferences: NotificationPreferences) => {
      if (saving || arePreferencesEqual(preferences, nextPreferences)) return;

      const previousPreferences = preferences;

      setPreferences(nextPreferences);
      setSaving(true);

      try {
        await saveNotificationPreferences(nextPreferences);

        if (!nextPreferences.enabled) {
          await Notifications.cancelAllScheduledNotificationsAsync();
          return;
        }

        const activities = await getActivities();
        rescheduleActivityNotifications(activities).catch((error) => {
          console.warn("Error rescheduling notifications:", error);
        });
      } catch {
        setPreferences(previousPreferences);

        Alert.alert(
          "No se pudo guardar",
          "Intenta actualizar tus preferencias nuevamente."
        );
      } finally {
        setSaving(false);
      }
    },
    [preferences, saving]
  );

  const handleToggleEnabled = useCallback(
    (enabled: boolean) => {
      updatePreferences({
        ...preferences,
        enabled,
      });
    },
    [preferences, updatePreferences]
  );

  const handleTestNotification = useCallback(async () => {
    if (testing) return;

    try {
      setTesting(true);
      await sendTestNotification();
    } catch {
      Alert.alert(
        "No se pudo enviar",
        "Intenta probar la notificación nuevamente."
      );
    } finally {
      setTesting(false);
    }
  }, [testing]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, []);

  const setSound = useCallback(
    (sound: NotificationSound) => {
      updatePreferences({
        ...preferences,
        sound,
      });
    },
    [preferences, updatePreferences]
  );

  const setVibration = useCallback(
    (vibration: VibrationMode) => {
      updatePreferences({
        ...preferences,
        vibration,
      });
    },
    [preferences, updatePreferences]
  );

  const isBusy = saving || testing;

  const soundOptions = useMemo(
    () => [
      {
        title: "AVI suave",
        subtitle: "Tu sonido personalizado.",
        value: "avi_soft.wav" as NotificationSound,
      },
      {
        title: "Sistema",
        subtitle: "Usar sonido estándar del teléfono.",
        value: "default" as NotificationSound,
      },
      {
        title: "Sin sonido",
        subtitle: "Solo mostrar notificación.",
        value: "silent" as NotificationSound,
      },
    ],
    []
  );

  const vibrationOptions = useMemo(
    () => [
      {
        title: "Suave",
        subtitle: "Una vibración ligera.",
        value: "soft" as VibrationMode,
      },
      {
        title: "Desactivada",
        subtitle: "Sin vibración.",
        value: "off" as VibrationMode,
      },
    ],
    []
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <StatusBar style={isDark ? "light" : "dark"} translucent />

        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator color={colors.primary} />

          <Text style={[styles.loadingText, { color: colors.muted }]}>
            Cargando recordatorios...
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.85}
            onPress={handleGoBack}
            disabled={isBusy}
          >
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={[styles.logo, { color: colors.primary }]}>AVI</Text>

            <Text style={[styles.title, { color: colors.text }]}>
              Recordatorios
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Ajusta cómo quieres que AVI te acompañe, sin ruido ni ansiedad.
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.05,
            },
          ]}
        >
          <View style={styles.mainRow}>
            <View
              style={[
                styles.mainIcon,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Feather name="bell" size={20} color={colors.text} />
            </View>

            <View style={styles.mainTextBox}>
              <Text style={[styles.mainTitle, { color: colors.text }]}>
                Recordatorios inteligentes
              </Text>

              <Text style={[styles.mainSubtitle, { color: colors.muted }]}>
                Evaluaciones, protocolos y entregas importantes.
              </Text>
            </View>

            <Switch
              value={preferences.enabled}
              onValueChange={handleToggleEnabled}
              disabled={saving}
              trackColor={{
                false: colors.border,
                true: colors.primarySoft,
              }}
              thumbColor={preferences.enabled ? colors.primary : colors.subtle}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Sonido
          </Text>

          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            AVI usará tu sonido suave personalizado.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.05,
            },
          ]}
        >
          {soundOptions.map((option) => (
            <OptionRow
              key={option.title}
              title={option.title}
              subtitle={option.subtitle}
              selected={preferences.sound === option.value}
              disabled={saving}
              onPress={() => setSound(option.value)}
              colors={colors}
            />
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vibración
          </Text>

          <Text style={[styles.sectionSubtitle, { color: colors.muted }]}>
            Mantén el aviso sutil y tranquilo.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowOpacity: isDark ? 0 : 0.05,
            },
          ]}
        >
          {vibrationOptions.map((option) => (
            <OptionRow
              key={option.value}
              title={option.title}
              subtitle={option.subtitle}
              selected={preferences.vibration === option.value}
              disabled={saving}
              onPress={() => setVibration(option.value)}
              colors={colors}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.testButton,
            {
              backgroundColor: colors.primary,
              shadowOpacity: isDark ? 0 : 0.08,
            },
            isBusy && styles.disabledButton,
          ]}
          activeOpacity={0.9}
          onPress={handleTestNotification}
          disabled={isBusy}
        >
          {isBusy ? (
            <ActivityIndicator size="small" color="#11120F" />
          ) : (
            <Text style={styles.testButtonText}>Enviar prueba</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const OptionRow = memo(function OptionRow({
  title,
  subtitle,
  selected,
  disabled,
  onPress,
  colors,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  colors: Colors;
}) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, disabled && styles.disabledOption]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.optionTextBox}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>
          {title}
        </Text>

        <Text style={[styles.optionSubtitle, { color: colors.muted }]}>
          {subtitle}
        </Text>
      </View>

      <View
        style={[
          styles.radio,
          { borderColor: selected ? colors.primary : colors.border },
        ]}
      >
        {selected && (
          <View
            style={[styles.radioDot, { backgroundColor: colors.primary }]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontWeight: "700",
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 28,
    paddingTop: 44,
    paddingBottom: 130,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  headerTextBox: {
    flex: 1,
  },

  logo: {
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 8,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1.4,
    lineHeight: 40,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "700",
  },

  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 8,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowRadius: 18,
    elevation: 3,
  },

  mainRow: {
    minHeight: 82,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  mainIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  mainTextBox: {
    flex: 1,
  },

  mainTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },

  mainSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },

  optionRow: {
    minHeight: 76,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  optionTextBox: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
  },

  optionSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "700",
  },

  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 14,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  testButton: {
    height: 58,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  disabledButton: {
    opacity: 0.6,
  },



  testButtonText: {
    color: "#11120F",
    fontSize: 15,
    fontWeight: "900",
  },

    disabledOption: {
    opacity: 0.65,
  },

});