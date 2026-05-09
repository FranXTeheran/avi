import { useMemo } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAppTheme } from "@/src/hooks/useAppTheme";

const TAB_ICON_SIZE = 27;

export default function TabsLayout() {
  const { colors, mode } = useAppTheme();
  const insets = useSafeAreaInsets();

  const isDark = mode === "dark";

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      sceneStyle: {
        backgroundColor: colors.background,
      },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.subtle,
      tabBarShowLabel: true,
      tabBarHideOnKeyboard: true,
      tabBarStyle: {
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        height: 72 + insets.bottom,
        paddingTop: 6,
        paddingBottom: 6 + insets.bottom,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        shadowColor: "#000000",
        shadowOpacity: isDark ? 0 : 0.08,
        shadowRadius: 2,
        shadowOffset: {
          width: 0,
          height: -4,
        },
        elevation: isDark ? 0 : 8,
      },
      tabBarItemStyle: {
        paddingVertical: 2,
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: "900" as const,
        marginTop: 0,
      },
      tabBarIconStyle: {
        marginTop: 0,
      },
    }),
    [
      colors.background,
      colors.primary,
      colors.subtle,
      colors.surface,
      colors.border,
      insets.bottom,
      isDark,
    ]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "calendar" : "calendar-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="subjects"
        options={{
          title: "Materias",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={TAB_ICON_SIZE}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}