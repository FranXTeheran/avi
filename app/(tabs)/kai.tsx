import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Speech from "expo-speech";

import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import {
  getTodayActivities,
  getTomorrowActivities,
  getNextActivity,
  getWeekActivities,
  getPendingActivities,
  getExpiredActivities,
} from "@/src/services/kai.service";

import { useAuth } from "@/src/context/AuthContext";

const YELLOW = "#FFC21A";

export default function KaiScreen() {
  const { session } = useAuth();

  const [response, setResponse] = useState("");

  const [transcript, setTranscript] = useState("");
  const [lastTranscript, setLastTranscript] = useState("");

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const transcriptRef = useRef("");

  function speak(text: string) {
    Speech.stop();

    Speech.speak(text, {
      language: "es-CO",
      pitch: 0.9,
      rate: 0.95,
    });
  }

  async function handleToday() {
    if (!session?.user.id) return;

    const activities = await getTodayActivities(
      session.user.id
    );

    let text = "";

    if (activities.length === 0) {
      text = "No tienes actividades para hoy.";
    } else {
      text = `Hoy tienes ${activities.length} actividades.`;

      activities.slice(0, 3).forEach((activity: any) => {
        text += ` ${activity.title}.`;
      });
    }

    setResponse(text);
    speak(text);
  }

  async function handleTomorrow() {
    if (!session?.user.id) return;

    const activities = await getTomorrowActivities(
      session.user.id
    );

    let text = "";

    if (activities.length === 0) {
      text = "No tienes actividades para mañana.";
    } else {
      text = `Mañana tienes ${activities.length} actividades.`;

      activities.slice(0, 3).forEach((activity: any) => {
        text += ` ${activity.title}.`;
      });
    }

    setResponse(text);
    speak(text);
  }

  async function handleNext() {
    if (!session?.user.id) return;

    const activity = await getNextActivity(
      session.user.id
    );

    let text = "";

    if (!activity) {
      text = "No encontré actividades próximas.";
    } else {
      text = `Tu próxima actividad es ${activity.title}.`;
    }

    setResponse(text);
    speak(text);
  }

  async function handleWeek() {
    if (!session?.user.id) return;

    const activities = await getWeekActivities(
      session.user.id
    );

    let text = "";

    if (activities.length === 0) {
      text = "No tienes actividades esta semana.";
    } else {
      text = `Esta semana tienes ${activities.length} actividades pendientes.`;
    }

    setResponse(text);
    speak(text);
  }

  async function handlePending() {
    if (!session?.user.id) return;

    const activities = await getPendingActivities(
      session.user.id
    );

    const text =
      `Tienes ${activities.length} actividades pendientes.`;

    setResponse(text);
    speak(text);
  }

  async function handleExpired() {
    if (!session?.user.id) return;

    const activities = await getExpiredActivities(
      session.user.id
    );

    const text =
      `Tienes ${activities.length} actividades vencidas.`;

    setResponse(text);
    speak(text);
  }

  async function processVoiceCommand(text: string) {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const query = text.toLowerCase();

      if (query.includes("hoy")) {
        await handleToday();
        return;
      }

      if (query.includes("mañana")) {
        await handleTomorrow();
        return;
      }

      if (
        query.includes("próxima") ||
        query.includes("proxima") ||
        query.includes("siguiente")
      ) {
        await handleNext();
        return;
      }

      if (query.includes("semana")) {
        await handleWeek();
        return;
      }

      const answer =
        "Todavía no puedo responder eso. Pregúntame sobre tus actividades.";

      setResponse(answer);

      Speech.stop();

      Speech.speak(answer, {
        language: "es-CO",
      });
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
      }, 2000);
    }
  }

  async function startListening() {
    const permission =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    setTranscript("");
    setLastTranscript("");
    transcriptRef.current = "";

    ExpoSpeechRecognitionModule.start({
      lang: "es-ES",
      interimResults: true,
      continuous: false,
    });
  }

  async function stopListening() {
    await ExpoSpeechRecognitionModule.stop();
  }

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", async () => {
    setIsListening(false);

    const text = transcriptRef.current;

    if (!text.trim()) return;

    await processVoiceCommand(text);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results?.[0]?.transcript ?? "";

    setTranscript(text);
    setLastTranscript(text);

    transcriptRef.current = text;
  });

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <Text
        style={{
          fontSize: 32,
          fontWeight: "800",
          marginBottom: 10,
        }}
      >
        Kai
      </Text>

      <TouchableOpacity
        onPress={
          isListening
            ? stopListening
            : startListening
        }
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: "#FFC21A",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 42 }}>
          {isListening ? "⏹️" : "🎤"}
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        {isListening
          ? "Te escucho..."
          : "Toca para hablar"}
      </Text>

      <Text
        style={{
          fontSize: 16,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        {transcript}
      </Text>

      <Text
        style={{
          fontSize: 16,
          marginBottom: 30,
          textAlign: "center",
        }}
      >
        Tu asistente académico
      </Text>

      <TouchableOpacity
        onPress={handleToday}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Qué tengo hoy?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleTomorrow}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Qué tengo mañana?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleNext}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Cuál es mi próxima actividad?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleWeek}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Qué tengo esta semana?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handlePending}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
          marginBottom: 12,
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Cuántas actividades tengo pendientes?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleExpired}
        style={{
          backgroundColor: YELLOW,
          padding: 18,
          borderRadius: 16,
          width: "100%",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontWeight: "700",
          }}
        >
          ¿Qué actividades se vencieron?
        </Text>
      </TouchableOpacity>

      <View
        style={{
          marginTop: 30,
          width: "100%",
        }}
      >
        <Text
          style={{
            textAlign: "center",
            fontSize: 16,
            lineHeight: 24,
          }}
        >
          {response}
        </Text>
      </View>
    </ScrollView>
  );
}