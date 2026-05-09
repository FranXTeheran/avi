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
    let mounted = true;

    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);

        if (!mounted) return;

        if (saved === "dark" || saved === "light") {
          setMode(saved);
        }
      } catch (error) {
        console.log("Error cargando tema:", error);
      } finally {
        if (mounted) {
          setIsReady(true);
        }
      }
    }

    loadTheme();

    return () => {
      mounted = false;
    };
  }, []);

  const colors = useMemo(() => {
    return mode === "dark" ? darkColors : lightColors;
  }, [mode]);

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === "light" ? "dark" : "light";

      AsyncStorage.setItem(STORAGE_KEY, nextMode).catch((error) => {
        console.log("Error guardando tema:", error);
      });

      return nextMode;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors,
      toggleTheme,
      isReady,
    }),
    [mode, colors, toggleTheme, isReady]
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