import { ReactNode, memo, useMemo } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

import { radius, spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

type AppCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
};

function AppCard({
  children,
  style,
  noPadding = false,
}: AppCardProps) {
  const { mode, colors } = useAppTheme();

  const isDark = mode === "dark";

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.border,
      shadowOpacity: isDark ? 0 : 0.06,
      padding: noPadding ? 0 : spacing.lg,
    }),
    [
      colors.surface,
      colors.border,
      isDark,
      noPadding,
    ]
  );

  return (
    <View style={[styles.card, cardStyle, style]}>
      {children}
    </View>
  );
}

export default memo(AppCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,

    shadowColor: "#000000",
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 2,

    overflow: "hidden",
  },
});