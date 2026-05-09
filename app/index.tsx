import { useEffect } from "react";
import {
  ActivityIndicator,
  View,
} from "react-native";

import { router } from "expo-router";

import { supabase } from "@/src/lib/supabase";

export default function IndexScreen() {
  useEffect(() => {
    async function checkSession() {
      const { data } =
        await supabase.auth.getSession();

      if (data.session) {
        // Usuario logueado
        // Mandamos al HOME REAL
        router.replace("/home");
      } else {
        // Usuario no autenticado
        router.replace("/(auth)/login");
      }
    }

    checkSession();
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F5FF",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator color="#5B3FF2" />
    </View>
  );
}