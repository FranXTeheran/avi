import { ReactNode } from "react";
import {
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
  View,
} from "react-native";

import { spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

type ScreenProps = {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

export default function Screen({
  children,
  contentStyle,
  scroll = true,
}: ScreenProps) {
  const { colors } = useAppTheme();

  if (!scroll) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
      contentContainerStyle={[styles.content, contentStyle]}
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