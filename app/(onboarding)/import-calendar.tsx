import { useState } from "react";
import {
	Alert,
	ActivityIndicator,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { saveImportedActivities } from "@/src/services/activity.service";
import { importCalendarFile } from "@/src/services/calendar-import.service";
import {
	requestNotificationPermissions,
	rescheduleActivityNotifications,
} from "@/src/services/activity-notification.service";

import { useAppTheme } from "@/src/hooks/useAppTheme";
import { typography } from "@/src/constants/typography";

export default function CalendarImportScreen() {
	const { colors } = useAppTheme();
	const [loading, setLoading] = useState(false);

	async function handleImportCalendar() {
		try {
			setLoading(true);

			const activities = await importCalendarFile();

			if (!activities.length) {
				Alert.alert(
					"Sin actividades",
					"No se encontraron actividades en el archivo."
				);
				return;
			}

			const savedActivities = await saveImportedActivities(activities);
			const hasPermission = await requestNotificationPermissions();

			router.replace("/processing_calendar");

			if (hasPermission) {
				rescheduleActivityNotifications(savedActivities).catch((error) => {
					console.warn("Error rescheduling notifications:", error);
				});
			}
		} catch (error: any) {
			Alert.alert(
				"Error",
				error?.message || "No se pudo importar el calendario."
			);
		} finally {
			setLoading(false);
		}
	}

	function handlePasteCalendarLink() {
		Alert.alert(
			"Pegar enlace",
			"Todavía no hemos conectado la importación por enlace."
		);
	}

	function handleSkip() {
		router.replace("/homeKai");
	}

	return (
		<SafeAreaView
			style={[
				styles.safeArea,
				{
					backgroundColor: colors.background,
				},
			]}
			edges={["top"]}
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
					disabled={loading}
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
						source={require("../../assets/images/onboarding-import-calendar.png")}
						style={styles.image}
						resizeMode="contain"
					/>
				</View>

				<View style={styles.content}>
					<Text
						style={[
							styles.title,
							{
								color: colors.text,
							},
						]}
					>
						Importa tu{"\n"}calendario académico
					</Text>

					<Text
						style={[
							styles.description,
							{
								color: colors.muted,
							},
						]}
					>
						Importamos tus actividades y las organizamos por materia, unidad y
						fecha de entrega.
					</Text>

					<View style={styles.dots}>
						<View
							style={[
								styles.dot,
								{
									backgroundColor: colors.border,
								},
							]}
						/>
						<View
							style={[
								styles.dot,
								{
									backgroundColor: colors.border,
								},
							]}
						/>
						<View
							style={[
								styles.dot,
								styles.activeDot,
								{
									backgroundColor: colors.primary,
								},
							]}
						/>
					</View>

					<TouchableOpacity
						style={[
							styles.primaryButton,
							{
								backgroundColor: colors.primary,
							},
							loading && styles.disabledButton,
						]}
						activeOpacity={0.9}
						onPress={handleImportCalendar}
						disabled={loading}
					>
						{loading ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<>
								<Feather
									name="calendar"
									size={16}
									color="#FFFFFF"
								/>
								<Text style={styles.primaryButtonText}>
									Importar calendario
								</Text>
							</>
						)}
					</TouchableOpacity>

					<TouchableOpacity
						style={[
							styles.secondaryButton,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
							},
							loading && styles.disabledButton,
						]}
						activeOpacity={0.9}
						onPress={handlePasteCalendarLink}
						disabled={loading}
					>
						<Feather
							name="link"
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
						>
							Pegar enlace de calendario
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						style={styles.laterButton}
						activeOpacity={0.8}
						onPress={handleSkip}
						disabled={loading}
					>
						<Text
							style={[
								styles.laterText,
								{
									color: colors.muted,
								},
							]}
						>
							Lo haré después
						</Text>
					</TouchableOpacity>
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
		height: "42%",
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 28,
		marginTop: 4,
	},

	image: {
		width: "100%",
		height: "100%",
	},

	content: {
		flex: 1,
		paddingHorizontal: 38,
		alignItems: "center",
	},

	title: {
		fontSize: 25,
		fontFamily: typography.extraBold,
		textAlign: "center",
		lineHeight: 31,
		marginBottom: 12,
		letterSpacing: -0.5,
	},

	description: {
		fontSize: 14,
		fontFamily: typography.medium,
		textAlign: "center",
		lineHeight: 21,
		maxWidth: 315,
	},

	dots: {
		flexDirection: "row",
		gap: 8,
		marginTop: 22,
		marginBottom: 26,
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
		width: "100%",
		height: 50,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 10,
	},

	disabledButton: {
		opacity: 0.7,
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
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		gap: 10,
	},

	secondaryButtonText: {
		fontSize: 14,
		fontFamily: typography.bold,
	},

	laterButton: {
		marginTop: 18,
	},

	laterText: {
		fontSize: 14,
		fontFamily: typography.semibold,
	},
});