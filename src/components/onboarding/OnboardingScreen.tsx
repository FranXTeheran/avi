import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

const YELLOW = "#FFC21A";
const BLACK = "#1F1F1F";
const GRAY = "#8A8A8A";
const LIGHT_GRAY = "#EDEDED";

type Props = {
  image: ImageSourcePropType;
  title: string;
  highlight?: string;
  subtitle?: string;
  description: string;
  buttonText: string;
  progress: 1 | 2 | 3;
  onPress: () => void;
  compact?: boolean;
  secondaryText?: string;
  onSecondaryPress?: () => void;
  secondButtonText?: string;
  onSecondButtonPress?: () => void;
  secondButtonIcon?: keyof typeof Feather.glyphMap;
  primaryIcon?: keyof typeof Feather.glyphMap;
};

export default function OnboardingScreen({
  image,
  title,
  highlight,
  subtitle,
  description,
  buttonText,
  progress,
  onPress,
  compact = false,
  secondaryText,
  onSecondaryPress,
  secondButtonText,
  onSecondButtonPress,
  secondButtonIcon = "link",
  primaryIcon,
}: Props) {
  function renderTitle() {
    if (!highlight || !title.includes(highlight)) {
      return <Text style={styles.title}>{title}</Text>;
    }

    const parts = title.split(highlight);

    return (
      <Text style={styles.title}>
        {parts[0]}
        <Text style={styles.highlight}>{highlight}</Text>
        {parts[1]}
      </Text>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topBar} />

        <TouchableOpacity
          style={styles.skipButton}
          activeOpacity={0.7}
          onPress={() => router.replace("/home")}
        >
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <Image
            source={image}
            style={[styles.image, compact && styles.imageCompact]}
            resizeMode="contain"
          />
        </View>

        <View style={styles.content}>
          {renderTitle()}

          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          <Text style={styles.description}>{description}</Text>

          <View style={styles.dots}>
            {[1, 2, 3].map((item) => (
              <View
                key={item}
                style={[styles.dot, progress === item && styles.activeDot]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onPress}
            activeOpacity={0.9}
          >
            {primaryIcon && (
              <Feather name={primaryIcon} size={16} color={BLACK} />
            )}

            <Text style={styles.primaryButtonText}>{buttonText}</Text>
          </TouchableOpacity>

          {secondButtonText && onSecondButtonPress && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onSecondButtonPress}
              activeOpacity={0.9}
            >
              <Feather name={secondButtonIcon} size={16} color={BLACK} />
              <Text style={styles.secondaryButtonText} numberOfLines={1}>
                {secondButtonText}
              </Text>
            </TouchableOpacity>
          )}

          {secondaryText && onSecondaryPress && (
            <TouchableOpacity
              onPress={onSecondaryPress}
              activeOpacity={0.8}
              style={styles.textButton}
            >
              <Text style={styles.textButtonText}>{secondaryText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: YELLOW,
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topBar: {
    height: 0,
    backgroundColor: YELLOW,
  },

  skipButton: {
    alignSelf: "flex-end",
    marginTop: 48,
    marginRight: 28,
  },

  skipText: {
    fontSize: 14,
    color: BLACK,
    fontWeight: "500",
  },

  imageWrapper: {
    height: "48%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imageCompact: {
    height: "96%",
  },

  content: {
    flex: 1,
    paddingHorizontal: 38,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: BLACK,
    textAlign: "center",
    lineHeight: 38,
    marginBottom: 8,
  },

  highlight: {
    color: BLACK,
  },

  subtitle: {
    fontSize: 14,
    fontWeight: "800",
    color: YELLOW,
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },

  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
    marginBottom: 28,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 8,
    backgroundColor: LIGHT_GRAY,
  },

  activeDot: {
    backgroundColor: YELLOW,
  },

  primaryButton: {
    width: 142,
    height: 44,
    borderRadius: 13,
    backgroundColor: YELLOW,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: BLACK,
  },

  secondaryButton: {
    width: "100%",
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    marginTop: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  secondaryButtonText: {
    flexShrink: 1,
    color: BLACK,
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },

  textButton: {
    marginTop: 18,
  },

  textButtonText: {
    color: GRAY,
    fontSize: 14,
    fontWeight: "600",
  },
});