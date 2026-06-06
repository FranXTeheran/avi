import { useCallback, useMemo } from "react";
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

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { typography } from "@/src/constants/typography";

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
	const { colors } = useAppTheme();

	const handleSkip = useCallback(() => {
		router.replace("/homeKai");
	}, []);

	const renderedTitle = useMemo(() => {
		if (!highlight || !title.includes(highlight)) {
			return (
				<Text
					style={[
						styles.title,
						{
							color: colors.text,
						},
					]}
				>
					{title}
				</Text>
			);
		}

		const parts = title.split(highlight);

		return (
			<Text
				style={[
					styles.title,
					{
						color: colors.text,
					},
				]}
			>
				{parts[0]}
				<Text
					style={[
						styles.highlight,
						{
							color: colors.primary,
						},
					]}
				>
					{highlight}
				</Text>
				{parts[1]}
			</Text>
		);
	}, [highlight, title, colors.text, colors.primary]);

	return (
		<SafeAreaView
			style={[
				styles.safeArea,
				{
					backgroundColor: colors.background,
				},
			]}
			edges={["left", "right", "bottom"]}
		>
			<View
				style={[
					styles.screen,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<TouchableOpacity
					style={styles.skipButton}
					activeOpacity={0.7}
					onPress={handleSkip}
				>
					<Text
						style={[
							styles.skipText,
							{
								color: colors.muted,
							},
						]}
					>
						Saltar
					</Text>
				</TouchableOpacity>

				<View style={styles.imageWrapper}>
					<Image
						source={image}
						style={[
							styles.image,
							compact && styles.imageCompact,
						]}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.content}>
					{renderedTitle}

					{!!subtitle && (
						<Text
							style={[
								styles.subtitle,
								{
									color: colors.primary,
								},
							]}
						>
							{subtitle}
						</Text>
					)}

					<Text
						style={[
							styles.description,
							{
								color: colors.muted,
							},
						]}
					>
						{description}
					</Text>

					<View style={styles.dots}>
						{[1, 2, 3].map((item) => (
							<View
								key={item}
								style={[
									styles.dot,
									{
										backgroundColor:
											progress === item
												? colors.primary
												: colors.border,
									},
									progress === item && styles.activeDot,
								]}
							/>
						))}
					</View>

					<TouchableOpacity
						style={[
							styles.primaryButton,
							{
								backgroundColor: colors.primary,
							},
						]}
						onPress={onPress}
						activeOpacity={0.9}
					>
						{primaryIcon && (
							<Feather
								name={primaryIcon}
								size={16}
								color="#FFFFFF"
							/>
						)}

						<Text style={styles.primaryButtonText}>
							{buttonText}
						</Text>
					</TouchableOpacity>

					{!!secondButtonText && !!onSecondButtonPress && (
						<TouchableOpacity
							style={[
								styles.secondaryButton,
								{
									backgroundColor: colors.surface,
									borderColor: colors.border,
								},
							]}
							onPress={onSecondButtonPress}
							activeOpacity={0.9}
						>
							<Feather
								name={secondButtonIcon}
								size={16}
								color={colors.primary}
							/>

							<Text
								style={[
									styles.secondaryButtonText,
									{
										color: colors.text,
									},
								]}
								numberOfLines={1}
							>
								{secondButtonText}
							</Text>
						</TouchableOpacity>
					)}

					{!!secondaryText && !!onSecondaryPress && (
						<TouchableOpacity
							onPress={onSecondaryPress}
							activeOpacity={0.8}
							style={styles.textButton}
						>
							<Text
								style={[
									styles.textButtonText,
									{
										color: colors.muted,
									},
								]}
							>
								{secondaryText}
							</Text>
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
	},

	screen: {
		flex: 1,
	},

	skipButton: {
		alignSelf: "flex-end",
		marginTop: 48,
		marginRight: 28,
	},

	skipText: {
		fontSize: 14,
		fontFamily: typography.medium,
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
		fontFamily: typography.extraBold,
		textAlign: "center",
		lineHeight: 38,
		marginBottom: 8,
		letterSpacing: -0.9,
	},

	highlight: {
		fontFamily: typography.extraBold,
	},

	subtitle: {
		fontSize: 14,
		fontFamily: typography.extraBold,
		textAlign: "center",
		marginBottom: 10,
	},

	description: {
		fontSize: 14,
		fontFamily: typography.medium,
		textAlign: "center",
		lineHeight: 21,
		maxWidth: 310,
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
	},

	activeDot: {
		width: 22,
	},

	primaryButton: {
		minWidth: 148,
		height: 46,
		borderRadius: 15,
		paddingHorizontal: 22,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 8,
	},

	primaryButtonText: {
		fontSize: 16,
		fontFamily: typography.extraBold,
		color: "#FFFFFF",
	},

	secondaryButton: {
		width: "100%",
		height: 50,
		borderRadius: 16,
		borderWidth: 1,
		marginTop: 14,
		paddingHorizontal: 16,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		gap: 10,
	},

	secondaryButtonText: {
		flexShrink: 1,
		fontSize: 14,
		fontFamily: typography.bold,
		textAlign: "center",
	},

	textButton: {
		marginTop: 18,
	},

	textButtonText: {
		fontSize: 14,
		fontFamily: typography.semibold,
	},
});