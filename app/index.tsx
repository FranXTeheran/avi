import { useEffect } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import { router } from "expo-router";

import { supabase } from "@/src/lib/supabase";
import { useAppTheme } from "@/src/hooks/useAppTheme";

export default function IndexScreen() {
  const { colors } = useAppTheme();

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/home");
      } else {
        router.replace("/(auth)/login");
      }
    }

    checkSession();
  }, []);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.loaderBox,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loaderBox: {
    width: 72,
    height: 72,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});