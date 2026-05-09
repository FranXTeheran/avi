import { ReactNode } from "react";

import {
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";

import { spacing } from "../constants/theme";

import { useAppTheme } from "../hooks/useAppTheme";

type ScreenProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export default function Screen({
  children,
  contentStyle,
}: ScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={[
        styles.content,
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
    paddingBottom: 120,
  },
});