import { memo } from "react";
import {
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
} from "react-native";

import { spacing } from "../constants/theme";
import { useAppTheme } from "../hooks/useAppTheme";

type SectionTitleProps = {
  title: string;
  style?: StyleProp<TextStyle>;
};

function SectionTitle({
  title,
  style,
}: SectionTitleProps) {
  const { colors } = useAppTheme();

  return (
    <Text
      style={[
        styles.title,
        { color: colors.text },
        style,
      ]}
    >
      {title}
    </Text>
  );
}

export default memo(SectionTitle);

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.8,
    marginBottom: spacing.md,
  },
});