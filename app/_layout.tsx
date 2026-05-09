import { useEffect, useMemo } from "react";
import { Platform } from "react-native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/src/context/AuthContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";

function RootNavigator() {
  const { mode, colors } = useTheme();
  const isDark = mode === "dark";

  useEffect(() => {
    if (Platform.OS !== "android") return;

    async function configureSystemBars() {
      try {
        await NavigationBar.setBackgroundColorAsync(colors.background);
        await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
        await NavigationBar.setVisibilityAsync("visible");
      } catch (error) {
        console.log("Error configurando barras del sistema:", error);
      }
    }

    configureSystemBars();
  }, [colors.background, isDark]);

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      contentStyle: {
        backgroundColor: colors.background,
      },
    }),
    [colors.background]
  );

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={colors.background}
        translucent={false}
      />

      <Stack screenOptions={screenOptions} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}