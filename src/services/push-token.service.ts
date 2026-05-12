import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "@/src/lib/supabase";

export async function registerPushToken(): Promise<void> {
  try {
    // Solo funciona en dispositivo real, no emulador
    if (!Device.isDevice) return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return;

    // Obtener el Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "dbd24a43-d12e-473e-a2a6-b3dd5c9fa97d",
    });

    const token = tokenData.data;

    if (!token) return;

    // Guardar en Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: user.id,
          token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

  } catch (error) {
    console.warn("Error registrando push token:", error);
  }
}