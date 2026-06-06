import { useRef, useState } from "react";
import {
	Image,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from "react-native";

import * as Speech from "expo-speech";
import { Ionicons } from "@expo/vector-icons";

import {
	ExpoSpeechRecognitionModule,
	useSpeechRecognitionEvent,
} from "expo-speech-recognition";

import {
	getTodayActivities,
	getTomorrowActivities,
	getNextActivity,
	getWeekActivities,
	getPendingActivities,
	getExpiredActivities,
} from "@/src/services/kai.service";

import { useAuth } from "@/src/context/AuthContext";
import { useAppTheme } from "@/src/hooks/useAppTheme";

type Colors = ReturnType<typeof useAppTheme>["colors"];

type SuggestionCardProps = {
	title: string;
	description: string;
	icon: keyof typeof Ionicons.glyphMap;
	colors: Colors;
	onPress: () => void;
};

function SuggestionCard({
	title,
	description,
	icon,
	colors,
	onPress,
}: SuggestionCardProps) {
	return (
		<Pressable
			onPress={onPress}
			style={[
				styles.suggestionCard,
				{
					backgroundColor: colors.surface,
					borderColor: colors.border,
				},
			]}
		>
			<View
				style={[
					styles.suggestionIcon,
					{
						backgroundColor: colors.primarySoft,
					},
				]}
			>
				<Ionicons
					name={icon}
					size={22}
					color={colors.primary}
				/>
			</View>

			<Text
				style={[
					styles.suggestionTitle,
					{
						color: colors.text,
					},
				]}
			>
				{title}
			</Text>

			<Text
				style={[
					styles.suggestionDescription,
					{
						color: colors.muted,
					},
				]}
			>
				{description}
			</Text>
		</Pressable>
	);
}

export default function KaiScreen() {
	const { session } = useAuth();
	const { colors } = useAppTheme();

	const [response, setResponse] = useState("");
	const [transcript, setTranscript] = useState("");
	const [isListening, setIsListening] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);

	const transcriptRef = useRef("");

	function speak(text: string) {
		Speech.stop();

		Speech.speak(text, {
			language: "es-CO",
			pitch: 0.9,
			rate: 0.95,
		});
	}

	async function handleToday() {
		if (!session?.user.id) return;

		const activities = await getTodayActivities(session.user.id);

		let text = "";

		if (activities.length === 0) {
			text = "No tienes actividades para hoy.";
		} else {
			text = `Hoy tienes ${activities.length} actividades.`;

			activities.slice(0, 3).forEach((activity: any) => {
				text += ` ${activity.title}.`;
			});
		}

		setResponse(text);
		speak(text);
	}

	async function handleTomorrow() {
		if (!session?.user.id) return;

		const activities = await getTomorrowActivities(session.user.id);

		let text = "";

		if (activities.length === 0) {
			text = "No tienes actividades para mañana.";
		} else {
			text = `Mañana tienes ${activities.length} actividades.`;

			activities.slice(0, 3).forEach((activity: any) => {
				text += ` ${activity.title}.`;
			});
		}

		setResponse(text);
		speak(text);
	}

	async function handleNext() {
		if (!session?.user.id) return;

		const activity = await getNextActivity(session.user.id);

		let text = "";

		if (!activity) {
			text = "No encontré actividades próximas.";
		} else {
			text = `Tu próxima actividad es ${activity.title}.`;
		}

		setResponse(text);
		speak(text);
	}

	async function handleWeek() {
		if (!session?.user.id) return;

		const activities = await getWeekActivities(session.user.id);

		let text = "";

		if (activities.length === 0) {
			text = "No tienes actividades esta semana.";
		} else {
			text = `Esta semana tienes ${activities.length} actividades pendientes.`;
		}

		setResponse(text);
		speak(text);
	}

	async function handlePending() {
		if (!session?.user.id) return;

		const activities = await getPendingActivities(session.user.id);

		const text = `Tienes ${activities.length} actividades pendientes.`;

		setResponse(text);
		speak(text);
	}

	async function handleExpired() {
		if (!session?.user.id) return;

		const activities = await getExpiredActivities(session.user.id);

		const text = `Tienes ${activities.length} actividades vencidas.`;

		setResponse(text);
		speak(text);
	}

	async function processVoiceCommand(text: string) {
		if (isProcessing) return;

		setIsProcessing(true);

		try {
			const query = text.toLowerCase();

			if (query.includes("hoy")) {
				await handleToday();
				return;
			}

			if (query.includes("mañana")) {
				await handleTomorrow();
				return;
			}

			if (
				query.includes("próxima") ||
				query.includes("proxima") ||
				query.includes("siguiente")
			) {
				await handleNext();
				return;
			}

			if (query.includes("semana")) {
				await handleWeek();
				return;
			}

			if (query.includes("pendiente") || query.includes("pendientes")) {
				await handlePending();
				return;
			}

			if (
				query.includes("vencida") ||
				query.includes("vencidas") ||
				query.includes("venció") ||
				query.includes("vencieron")
			) {
				await handleExpired();
				return;
			}

			const answer =
				"Todavía no puedo responder eso. Pregúntame sobre tus actividades, entregas o pendientes.";

			setResponse(answer);
			speak(answer);
		} finally {
			setTimeout(() => {
				setIsProcessing(false);
			}, 2000);
		}
	}

	async function startListening() {
		const permission =
			await ExpoSpeechRecognitionModule.requestPermissionsAsync();

		if (!permission.granted) return;

		setTranscript("");
		transcriptRef.current = "";

		ExpoSpeechRecognitionModule.start({
			lang: "es-ES",
			interimResults: true,
			continuous: false,
		});
	}

	async function stopListening() {
		await ExpoSpeechRecognitionModule.stop();
	}

	useSpeechRecognitionEvent("start", () => {
		setIsListening(true);
	});

	useSpeechRecognitionEvent("end", async () => {
		setIsListening(false);

		const text = transcriptRef.current;

		if (!text.trim()) return;

		await processVoiceCommand(text);
	});

	useSpeechRecognitionEvent("result", (event) => {
		const text = event.results?.[0]?.transcript ?? "";

		setTranscript(text);
		transcriptRef.current = text;
	});

	return (
		<ScrollView
			style={[
				styles.screen,
				{
					backgroundColor: colors.background,
				},
			]}
			contentContainerStyle={styles.content}
			showsVerticalScrollIndicator={false}
		>
			<View style={styles.header}>
				<Image
					source={require("../../assets/images/home-kai.png")}
					style={styles.kaiImage}
					resizeMode="contain"
				/>

				<Text
					style={[
						styles.title,
						{
							color: colors.text,
						},
					]}
				>
					Pregúntame lo que necesites
				</Text>

				<Text
					style={[
						styles.subtitle,
						{
							color: colors.muted,
						},
					]}
				>
					Puedo ayudarte con tus entregas, pendientes y actividades próximas.
				</Text>
			</View>

			<View
				style={[
					styles.voiceCard,
					{
						backgroundColor: colors.surface,
						borderColor: colors.border,
					},
				]}
			>
				<Pressable
					onPress={isListening ? stopListening : startListening}
					style={[
						styles.micButton,
						{
							backgroundColor: isListening
								? colors.danger
								: colors.primary,
						},
					]}
				>
					<Ionicons
						name={isListening ? "stop" : "mic"}
						size={30}
						color="#FFFFFF"
					/>
				</Pressable>

				<View style={styles.voiceInfo}>
					<Text
						style={[
							styles.voiceTitle,
							{
								color: colors.text,
							},
						]}
					>
						{isListening ? "Te escucho..." : "Habla con Kai"}
					</Text>

					<Text
						style={[
							styles.voiceSubtitle,
							{
								color: colors.muted,
							},
						]}
					>
						{isListening
							? "Di algo como: ¿qué tengo hoy?"
							: "Toca el micrófono para hacer una consulta."}
					</Text>
				</View>
			</View>

			{transcript ? (
				<View
					style={[
						styles.transcriptCard,
						{
							backgroundColor: colors.primarySoft,
						},
					]}
				>
					<Text
						style={[
							styles.transcriptLabel,
							{
								color: colors.primary,
							},
						]}
					>
						Escuché:
					</Text>

					<Text
						style={[
							styles.transcriptText,
							{
								color: colors.text,
							},
						]}
					>
						{transcript}
					</Text>
				</View>
			) : null}

			<View style={styles.sectionHeader}>
				<Text
					style={[
						styles.sectionTitle,
						{
							color: colors.text,
						},
					]}
				>
					Sugerencias
				</Text>
			</View>

			<View style={styles.suggestionsGrid}>
				<SuggestionCard
					title="Hoy"
					description="Revisa tus actividades del día."
					icon="calendar-outline"
					colors={colors}
					onPress={handleToday}
				/>

				<SuggestionCard
					title="Mañana"
					description="Mira lo que viene después."
					icon="sunny-outline"
					colors={colors}
					onPress={handleTomorrow}
				/>

				<SuggestionCard
					title="Próxima"
					description="Encuentra tu entrega más cercana."
					icon="time-outline"
					colors={colors}
					onPress={handleNext}
				/>

				<SuggestionCard
					title="Semana"
					description="Resume tus pendientes semanales."
					icon="stats-chart-outline"
					colors={colors}
					onPress={handleWeek}
				/>

				<SuggestionCard
					title="Pendientes"
					description="Cuenta lo que aún falta."
					icon="list-outline"
					colors={colors}
					onPress={handlePending}
				/>

				<SuggestionCard
					title="Vencidas"
					description="Revisa lo atrasado."
					icon="alert-circle-outline"
					colors={colors}
					onPress={handleExpired}
				/>
			</View>

			<View
				style={[
					styles.responseCard,
					{
						backgroundColor: colors.surface,
						borderColor: colors.border,
					},
				]}
			>
				<View
					style={[
						styles.responseIcon,
						{
							backgroundColor: colors.primarySoft,
						},
					]}
				>
					<Ionicons
						name="sparkles"
						size={20}
						color={colors.primary}
					/>
				</View>

				<View style={styles.responseInfo}>
					<Text
						style={[
							styles.responseTitle,
							{
								color: colors.text,
							},
						]}
					>
						Respuesta de Kai
					</Text>

					<Text
						style={[
							styles.responseText,
							{
								color: response ? colors.muted : colors.subtle,
							},
						]}
					>
						{response || "Haz una consulta para ver la respuesta aquí."}
					</Text>
				</View>
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},

	content: {
		paddingHorizontal: 24,
		paddingTop: 32,
		paddingBottom: 130,
	},

	header: {
		alignItems: "center",
		marginBottom: 26,
	},

	kaiImage: {
		width: 210,
		height: 150,
		marginBottom: -4,
	},

	title: {
		fontSize: 29,
		fontWeight: "900",
		textAlign: "center",
		letterSpacing: -0.8,
		lineHeight: 35,
	},

	subtitle: {
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
		lineHeight: 21,
		marginTop: 8,
		maxWidth: 315,
	},

	voiceCard: {
		width: "100%",
		borderRadius: 24,
		borderWidth: 1,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 18,
		shadowColor: "#000000",
		shadowOpacity: 0.06,
		shadowRadius: 16,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		elevation: 3,
	},

	micButton: {
		width: 62,
		height: 62,
		borderRadius: 31,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},

	voiceInfo: {
		flex: 1,
	},

	voiceTitle: {
		fontSize: 17,
		fontWeight: "900",
	},

	voiceSubtitle: {
		fontSize: 13,
		fontWeight: "700",
		lineHeight: 18,
		marginTop: 4,
	},

	transcriptCard: {
		width: "100%",
		borderRadius: 18,
		padding: 14,
		marginBottom: 20,
	},

	transcriptLabel: {
		fontSize: 12,
		fontWeight: "900",
		marginBottom: 4,
	},

	transcriptText: {
		fontSize: 14,
		fontWeight: "700",
		lineHeight: 20,
	},

	sectionHeader: {
		width: "100%",
		marginBottom: 12,
	},

	sectionTitle: {
		fontSize: 18,
		fontWeight: "900",
		letterSpacing: -0.4,
	},

	suggestionsGrid: {
		width: "100%",
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 12,
		marginBottom: 22,
	},

	suggestionCard: {
		width: "48%",
		minHeight: 132,
		borderRadius: 22,
		borderWidth: 1,
		padding: 14,
		shadowColor: "#000000",
		shadowOpacity: 0.05,
		shadowRadius: 12,
		shadowOffset: {
			width: 0,
			height: 6,
		},
		elevation: 2,
	},

	suggestionIcon: {
		width: 42,
		height: 42,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},

	suggestionTitle: {
		fontSize: 15,
		fontWeight: "900",
		marginBottom: 5,
	},

	suggestionDescription: {
		fontSize: 12,
		fontWeight: "700",
		lineHeight: 17,
	},

	responseCard: {
		width: "100%",
		borderRadius: 24,
		borderWidth: 1,
		padding: 18,
		flexDirection: "row",
		alignItems: "flex-start",
		shadowColor: "#000000",
		shadowOpacity: 0.06,
		shadowRadius: 16,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		elevation: 3,
	},

	responseIcon: {
		width: 42,
		height: 42,
		borderRadius: 15,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 13,
	},

	responseInfo: {
		flex: 1,
	},

	responseTitle: {
		fontSize: 16,
		fontWeight: "900",
		marginBottom: 5,
	},

	responseText: {
		fontSize: 14,
		fontWeight: "700",
		lineHeight: 21,
	},
});