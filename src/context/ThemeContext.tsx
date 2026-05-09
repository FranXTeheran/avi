import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  ReactNode,
} from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  lightColors,
  darkColors,
  AppColors,
} from "../constants/theme";

type ThemeMode = "light" | "dark";

type ThemeContextType = {
  mode: ThemeMode;
  colors: AppColors;
  toggleTheme: () => void;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  colors: lightColors,
  toggleTheme: () => {},
  isReady: false,
});

const STORAGE_KEY = "@avi-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "dark" || saved === "light") {
          setMode(saved);
        }
      } catch (error) {
        console.log("Error cargando tema:", error);
      } finally {
        setIsReady(true);
      }
    }

    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    try {
      const next = mode === "light" ? "dark" : "light";
      setMode(next);
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.log("Error guardando tema:", error);
    }
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      toggleTheme,
      isReady,
    }),
    [mode, isReady, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}