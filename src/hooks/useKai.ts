import { useState } from "react";
import * as Speech from "expo-speech";

import {
  getTodayActivities,
  getTomorrowActivities,
  getNextActivity,
  getWeekActivities,
  getPendingActivities,
  getExpiredActivities,
} from "@/src/services/kai.service";

export function useKai(userId?: string) {
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  function speak(text: string) {
    Speech.stop();

    Speech.speak(text, {
      language: "es-CO",
      pitch: 0.9,
      rate: 0.95,
    });
  }

  async function handleToday() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activities = await getTodayActivities(userId);

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
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleTomorrow() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activities = await getTomorrowActivities(userId);

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
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleNext() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activity = await getNextActivity(userId);

      let text = "";

      if (!activity) {
        text = "No encontré actividades próximas.";
      } else {
        text = `Tu próxima actividad es ${activity.title}.`;
      }

      setResponse(text);
      speak(text);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleWeek() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activities = await getWeekActivities(userId);

      let text = "";

      if (activities.length === 0) {
        text = "No tienes actividades esta semana.";
      } else {
        text = `Esta semana tienes ${activities.length} actividades pendientes.`;
      }

      setResponse(text);
      speak(text);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handlePending() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activities = await getPendingActivities(userId);

      const text =
        `Tienes ${activities.length} actividades pendientes.`;

      setResponse(text);
      speak(text);
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleExpired() {
    if (!userId) return;

    setIsProcessing(true);

    try {
      const activities = await getExpiredActivities(userId);

      const text =
        `Tienes ${activities.length} actividades vencidas.`;

      setResponse(text);
      speak(text);
    } finally {
      setIsProcessing(false);
    }
  }

  function clearResponse() {
    setResponse("");
  }

  return {
    response: {
      text: response,
    },

    isProcessing,

    handleToday,
    handleTomorrow,
    handleNext,
    handleWeek,
    handlePending,
    handleExpired,

    clearResponse,
  };
}