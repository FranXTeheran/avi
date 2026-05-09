import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Feather } from "@expo/vector-icons";

import { signOut } from "@/src/services/auth.service";
import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/hooks/useAppTheme";

type Colors = ReturnType<typeof useAppTheme>["colors"];

export default function ProfileScreen() {
  const [fullName, setFullName] = useState("Estudiante");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const { mode, toggleTheme, colors } = useAppTheme();
  const isDark = mode === "dark";

  const avatarLetter = useMemo(() => {
    return fullName.trim().charAt(0).toUpperCase() || "E";
  }, [fullName]);

  const loadProfile = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) return;

      setEmail(user.email ?? "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (error) {
        console.log("Profile error:", error.message);
        return;
      }

      if (data?.full_name) {
        setFullName(data.full_name);
      }
    } catch (error) {
      console.log("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = useCallback(async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await signOut();
      router.replace("/(auth)/login");
    } catch (error: any) {
      Alert.alert("Error", error?.message ?? "No pudimos cerrar sesión.");
      setLoggingOut(false);
    }
  }, [loggingOut]);

  const handleGoNotifications = useCallback(() => {
    router.push("/notifications" as any);
  }, []);

  const handleGoImportCalendar = useCallback(() => {
    router.push("/(onboarding)/import-calendar" as any);
  }, []);

  const themeOption = useMemo(
    () => ({
      icon: (isDark ? "sun" : "moon") as keyof typeof Feather.glyphMap,
      title: isDark ? "Modo claro" : "Modo oscuro",
      subtitle: isDark
        ? "Volver a una interfaz clara y luminosa."
        : "Usar una interfaz más suave para estudiar de noche.",
    }),
    [isDark]
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
            Cargando perfil...
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
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>PERFIL</Text>

            <Text style={[styles.title, { color: colors.text }]}>
              Tu espacio en AVI
            </Text>

            <Text style={[styles.subtitle, { color: colors.muted }]}>
              Administra tu cuenta y preferencias académicas.
            </Text>
          </View>

          <View
            style={[
              styles.headerButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Feather name="user" size={23} color={colors.text} />
          </View>
        </View>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {avatarLetter}
            </Text>
          </View>

          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {fullName}
          </Text>

          {!!email && (
            <Text style={[styles.email, { color: colors.muted }]} numberOfLines={1}>
              {email}
            </Text>
          )}

          <View
            style={[styles.profileBadge, { backgroundColor: colors.primarySoft }]}
          >
            <Feather name="check-circle" size={15} color={colors.text} />

            <Text style={[styles.profileBadgeText, { color: colors.text }]}>
              Cuenta activa
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Configuración
          </Text>
        </View>

        <View
          style={[
            styles.section,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <ProfileOption
            icon="user"
            title="Datos personales"
            subtitle="Nombre, correo y preferencias básicas."
            colors={colors}
          />

          <ProfileOption
            icon="bell"
            title="Notificaciones"
            subtitle="Sonido, vibración y recordatorios suaves."
            colors={colors}
            onPress={handleGoNotifications}
          />

          <ProfileOption
            icon="calendar"
            title="Calendario académico"
            subtitle="Actualiza o vuelve a importar tu calendario."
            colors={colors}
            onPress={handleGoImportCalendar}
          />

          <ProfileOption
            icon={themeOption.icon}
            title={themeOption.title}
            subtitle={themeOption.subtitle}
            colors={colors}
            onPress={toggleTheme}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.logoutButton,
            {
              backgroundColor: colors.surface,
              borderColor: isDark ? "#4A2028" : "#FFD5DC",
              opacity: loggingOut ? 0.7 : 1,
            },
          ]}
          onPress={handleLogout}
          activeOpacity={0.9}
          disabled={loggingOut}
        >
          <View
            style={[
              styles.logoutIcon,
              {
                backgroundColor: isDark ? "#3A171D" : "#FFECEF",
              },
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#E5485D" />
            ) : (
              <Feather name="log-out" size={18} color="#E5485D" />
            )}
          </View>

          <Text style={styles.logoutText}>
            {loggingOut ? "Cerrando..." : "Cerrar sesión"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const ProfileOption = memo(function ProfileOption({
  icon,
  title,
  subtitle,
  onPress,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  colors: Pick<Colors, "primarySoft" | "text" | "muted">;
}) {
  return (
    <TouchableOpacity
      style={styles.option}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.optionIcon, { backgroundColor: colors.primarySoft }]}>
        <Feather name={icon} size={20} color={colors.text} />
      </View>

      <View style={styles.optionTextBox}>
        <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>

        <Text style={[styles.optionSubtitle, { color: colors.muted }]}>
          {subtitle}
        </Text>
      </View>

      <View style={[styles.optionArrow, { backgroundColor: colors.primarySoft }]}>
        <Feather name="chevron-right" size={20} color={colors.text} />
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
    paddingBottom: 30,
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
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.5,
    lineHeight: 40,
    maxWidth: 270,
  },

  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "700",
    maxWidth: 270,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  profileCard: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: "900",
  },

  name: {
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.6,
  },

  email: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  profileBadge: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  profileBadgeText: {
    fontSize: 12,
    fontWeight: "900",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  section: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 8,
    marginBottom: 22,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },

  option: {
    minHeight: 78,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
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

  optionArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  logoutButton: {
    height: 58,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  logoutIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  logoutText: {
    color: "#E5485D",
    fontWeight: "900",
    fontSize: 15,
  },
});