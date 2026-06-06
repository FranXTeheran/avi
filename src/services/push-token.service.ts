import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "@/src/lib/supabase";

export async function registerPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Permiso de notificaciones denegado");
      return;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "dbd24a43-d12e-473e-a2a6-b3dd5c9fa97d",
    });

    const token = tokenData.data;
    console.log("Push token:", token);

    if (!token) return;

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

    console.log("Token guardado en Supabase");
  } catch (error) {
    console.warn("Error registrando push token:", error);
  }
}