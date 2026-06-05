import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { brandTokens } from "../constants/theme";

type KaiIllustrationPlaceholderProps = {
  label?: string;
  compact?: boolean;
};

function KaiIllustrationPlaceholder({
  label = "Ilustración Kai",
  compact = false,
}: KaiIllustrationPlaceholderProps) {
  return (
    <View style={[styles.frame, compact && styles.frameCompact]}>
      <View style={styles.star}>
        <Text style={styles.starText}>✦</Text>
      </View>

      <View style={styles.ticket}>
        <Text style={styles.ticketText}>KAI</Text>
      </View>

      <View style={styles.arrowShape}>
        <Feather name="arrow-up-right" size={34} color={brandTokens.midnight} />
      </View>

      <View style={styles.panelShape} />
      <View style={styles.cutShape} />

      <View style={styles.caption}>
        <Feather name="image" size={15} color={brandTokens.softWhite} />
        <Text style={styles.captionText}>{label}</Text>
      </View>
    </View>
  );
}

export default memo(KaiIllustrationPlaceholder);

const styles = StyleSheet.create({
  frame: {
    height: 260,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#26314A",
    backgroundColor: brandTokens.surfaceDark,
    overflow: "hidden",
    position: "relative",
  },

  frameCompact: {
    height: 210,
  },

  star: {
    position: "absolute",
    top: 20,
    right: 24,
  },

  starText: {
    color: "#8B7CFF",
    fontSize: 30,
    fontWeight: "900",
  },

  ticket: {
    position: "absolute",
    left: -32,
    top: 82,
    width: 190,
    height: 70,
    borderRadius: 18,
    backgroundColor: brandTokens.purple,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-18deg" }],
  },

  ticketText: {
    color: brandTokens.softWhite,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
  },

  arrowShape: {
    position: "absolute",
    right: 34,
    top: 100,
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: brandTokens.lime,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-14deg" }],
  },

  panelShape: {
    position: "absolute",
    right: -58,
    bottom: -48,
    width: 190,
    height: 190,
    borderTopLeftRadius: 72,
    backgroundColor: brandTokens.indigo,
  },

  cutShape: {
    position: "absolute",
    left: 30,
    bottom: -34,
    width: 116,
    height: 116,
    borderRadius: 32,
    backgroundColor: "#CDBBFF",
    transform: [{ rotate: "32deg" }],
  },

  caption: {
    position: "absolute",
    left: 18,
    bottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(11, 16, 32, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(248, 250, 252, 0.14)",
  },

  captionText: {
    color: brandTokens.softWhite,
    fontSize: 12,
    fontWeight: "800",
  },
});
