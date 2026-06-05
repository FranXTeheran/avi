import { View, Text, TouchableOpacity } from "react-native";
import * as Speech from "expo-speech";

export default function KaiScreen() {
  const handleSpeak = () => {
    Speech.stop();

    Speech.speak(
      "Que tienes hoy?",
      {
        language: "es-CO",
        pitch: 1,
        rate: 0.95,
      }
    );
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          marginBottom: 12,
        }}
      >
        Kai
      </Text>

      <Text
        style={{
          fontSize: 16,
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        Tu asistente académico
      </Text>

      <TouchableOpacity
        onPress={handleSpeak}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: "#FFC21A",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 40 }}>🎤</Text>
      </TouchableOpacity>
    </View>
  );
}