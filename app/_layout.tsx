import { useEffect, useMemo } from "react";
import { Platform, StatusBar as NativeStatusBar } from "react-native";
import { useFonts } from "expo-font";

import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import * as SystemUI from "expo-system-ui";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AuthProvider } from "@/src/context/AuthContext";
import { ThemeProvider, useTheme } from "@/src/context/ThemeContext";
import { registerPushToken } from "@/src/services/push-token.service";

function RootNavigator() {
  const { mode, colors } = useTheme();
  const isDark = mode === "dark";
  
  useEffect(() => {
    registerPushToken().catch(console.warn);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    async function configureSystemBars() {
      try {
        NativeStatusBar.setTranslucent(false);
        NativeStatusBar.setBackgroundColor(colors.background, true);
        NativeStatusBar.setBarStyle(isDark ? "light-content" : "dark-content", true);

        await SystemUI.setBackgroundColorAsync(colors.background);
        await NavigationBar.setBackgroundColorAsync(colors.surface);
        await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
        await NavigationBar.setVisibilityAsync("visible");
      } catch (error) {
        console.log("Error configurando barras del sistema:", error);
      }
    }

    configureSystemBars();
  }, [colors.background, colors.surface, isDark]);

  useEffect(() => {
      function openNotificationTarget(
        response: Notifications.NotificationResponse
      ) {
        const data = response.notification.request.content.data;

        const type = data?.type;

        if (type === "daily_summary") {
          router.push("/alerts" as any);
          return;
        }

        if (type === "weekly-calm") {
          router.push("/alerts" as any);
          return;
        }

        const activityId = data?.activityId;

        if (typeof activityId === "string" && activityId.length > 0) {
          router.push({
            pathname: "/activity/[id]",
            params: {
              id: activityId,
            },
          });
        }
      }

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        openNotificationTarget(response);
      }
    });

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        openNotificationTarget(response);
      });

    return () => {
      subscription.remove();
    };
  }, []);

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
  const [fontsLoaded] = useFonts({
    MertaSansRegular: require("../assets/fonts/MertaSansDemo-Regular-BF69f4d6568f537.ttf"),
    MertaSansMedium: require("../assets/fonts/MertaSansDemo-Medium-BF69f4d657c03e7.ttf"),
    MertaSansSemiBold: require("../assets/fonts/MertaSansDemo-SemiBold-BF69f4d6568e850.ttf"),
    MertaSansBold: require("../assets/fonts/MertaSansDemo-Bold-BF69f4d657c213d.ttf"),
    MertaSansExtraBold: require("../assets/fonts/MertaSansDemo-ExtraBold-BF69f4d6568eef7.ttf"),
    MertaSansBlack: require("../assets/fonts/MertaSansDemo-Black-BF69f4d657c03e3.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

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
