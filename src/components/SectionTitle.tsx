import { Text, StyleSheet } from "react-native";
import { colors, spacing } from "../constants/theme";

type SectionTitleProps = {
  title: string;
};

export default function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
title: {
  fontSize: 24,
  fontWeight: "900",
  color: colors.text,
  letterSpacing: -0.8,
  marginBottom: spacing.md,
},
});