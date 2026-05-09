import { useEffect } from "react";
import { Platform } from "react-native";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";

import { AuthProvider } from "@/src/context/AuthContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  ThemeProvider,
  useTheme,
} from "@/src/context/ThemeContext";

function RootNavigator() {
  const { mode, colors } = useTheme();

  const isDark = mode === "dark";

  useEffect(() => {
    async function configureNavigationBar() {
      if (Platform.OS !== "android") return;

      await NavigationBar.setButtonStyleAsync(
        isDark ? "light" : "dark"
      );

      await NavigationBar.setVisibilityAsync("visible");
    }

    configureNavigationBar();
  }, [isDark, colors.background]) ;

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        translucent={false}
        backgroundColor={colors.background}
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <AuthProvider>
      <ThemeProvider>
          <RootNavigator />
      </ThemeProvider>
    </AuthProvider>
    </SafeAreaProvider>
  );
}