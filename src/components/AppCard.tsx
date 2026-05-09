import { ReactNode } from "react";
import { View, StyleSheet } from "react-native";

import { radius, spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

type AppCardProps = {
  children: ReactNode;
};

export default function AppCard({ children }: AppCardProps) {
  const { mode, colors } = useAppTheme();
  const isDark = mode === "dark";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowOpacity: isDark ? 0 : 0.06,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
});