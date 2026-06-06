import {
	memo,
	useCallback,
	useMemo,
	useRef,
	useState,
	useEffect,
} from "react";

import { typography } from "@/src/constants/typography";
import {
	Text,
	StyleSheet,
	View,
	Pressable,
	ActivityIndicator,
	Image,
	Animated,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useAppTheme } from "@/src/hooks/useAppTheme";
import { useAuth } from "@/src/context/AuthContext";
import { useKai } from "@/src/hooks/useKai";

import Screen from "../../src/components/Screen";
import { getProfile } from "@/src/services/auth.service";
import { getActivities } from "@/src/services/activity.service";

type Activity = {
	id: string;
	title: string;
	description: string | null;
	due_at: string | null;
	status: string;
	type: string | null;
	priority: string | null;
	unit_number: number | null;
};

type Colors = ReturnType<typeof useAppTheme>["colors"];

const DAY_MS = 1000 * 60 * 60 * 24;
const TOP_DELIVERIES_LIMIT = 3;

function isValidDate(date: Date) {
	return !Number.isNaN(date.getTime());
}

function isSameDay(a: Date, b: Date) {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	);
}

function formatShortDate(date: string | null): string {
	if (!date) return "Sin fecha";

	const parsedDate = new Date(date);

	if (!isValidDate(parsedDate)) return "Sin fecha";

	return parsedDate.toLocaleDateString("es-CO", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});
}

function formatTime(date: string | null): string {
	if (!date) return "";

	const parsedDate = new Date(date);

	if (!isValidDate(parsedDate)) return "";

	return parsedDate.toLocaleTimeString("es-CO", {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
}

function daysUntil(date: string | null): number | null {
	if (!date) return null;

	const due = new Date(date);

	if (!isValidDate(due)) return null;

	const now = new Date();

	return Math.ceil((due.getTime() - now.getTime()) / DAY_MS);
}

function priorityScore(activity: Activity): number {
	if (activity.priority === "high") return 0;
	if (activity.type === "evaluation") return 1;
	if (activity.type === "final_project") return 2;
	if (activity.type === "protocol") return 3;

	return 4;
}

function priorityLabel(priority: string | null): string {
	if (priority === "high") return "Alta prioridad";
	if (priority === "medium") return "Prioridad media";

	return "Prioridad baja";
}

function getPriorityTone(priority: string | null, colors: Colors) {
	if (priority === "high") {
		return {
			color: colors.danger,
			soft: colors.dangerSoft,
			border: colors.dangerSoft,
		};
	}

	if (priority === "medium") {
		return {
			color: "#F59E0B",
			soft: "#FFF4D6",
			border: "#FDE68A",
		};
	}

	return {
		color: colors.success,
		soft: colors.successSoft,
		border: colors.successSoft,
	};
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const KaiQuickCard = ({
	title,
	icon,
	onPress,
	colors,
	active,
}: {
	title: string;
	icon: keyof typeof Ionicons.glyphMap;
	onPress: () => void;
	colors: Colors;
	active?: boolean;
}) => {
	const scaleAnim = useRef(new Animated.Value(1)).current;
	const opacityAnim = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		Animated.parallel([
			Animated.timing(scaleAnim, {
				toValue: 0.97,
				duration: 120,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnim, {
				toValue: 0.9,
				duration: 120,
				useNativeDriver: true,
			}),
		]).start();
	};

	const handlePressOut = () => {
		Animated.parallel([
			Animated.timing(scaleAnim, {
				toValue: 1,
				duration: 220,
				useNativeDriver: true,
			}),
			Animated.timing(opacityAnim, {
				toValue: 1,
				duration: 220,
				useNativeDriver: true,
			}),
		]).start();
	};

	return (
		<AnimatedPressable
			onPress={onPress}
			onPressIn={handlePressIn}
			onPressOut={handlePressOut}
			style={[
				styles.kaiQuickCard,
				styles.softShadow,
				{
					backgroundColor: active ? colors.primary : colors.surface,
					borderColor: active ? colors.primary : colors.border,
					opacity: opacityAnim,
					transform: [
						{
							scale: scaleAnim,
						},
					],
				},
			]}
		>
			<View
				style={[
					styles.kaiQuickIcon,
					{
						backgroundColor: active
							? "rgba(255,255,255,0.18)"
							: colors.primarySoft,
					},
				]}
			>
				<Ionicons
					name={icon}
					size={22}
					color={active ? "#FFFFFF" : colors.primary}
				/>
			</View>

			<Text
				style={[
					styles.kaiQuickTitle,
					{
						color: active ? "#FFFFFF" : colors.text,
					},
				]}
				numberOfLines={2}
			>
				{title}
			</Text>
		</AnimatedPressable>
	);
};

const UrgentCard = memo(function UrgentCard({
	activity,
	colors,
	onPress,
}: {
	activity: Activity | null;
	colors: Colors;
	onPress: (id: string) => void;
}) {
	const handlePress = useCallback(() => {
		if (activity) onPress(activity.id);
	}, [activity, onPress]);

	const priorityTone = activity
		? getPriorityTone(activity.priority, colors)
		: null;

	if (!activity) {
		return (
			<View
				style={[
					styles.urgentCard,
					styles.cardShadow,
					{
						backgroundColor: colors.surface,
						borderColor: colors.border,
					},
				]}
			>
				<View
					style={[
						styles.urgentIconBox,
						{
							backgroundColor: colors.primarySoft,
						},
					]}
				>
					<Ionicons
						name="checkmark-circle-outline"
						size={28}
						color={colors.primary}
					/>
				</View>

				<View style={styles.urgentInfo}>
					<Text style={[styles.urgentTitle, { color: colors.text }]}>
						Sin entregas urgentes
					</Text>

					<Text style={[styles.urgentCalmText, { color: colors.muted }]}>
						Hoy no tienes nada que venza. Puedes organizarte con calma.
					</Text>
				</View>
			</View>
		);
	}

	return (
		<Pressable
			style={[
				styles.urgentCard,
				styles.cardShadow,
				{
					backgroundColor: colors.surface,
					borderColor: colors.dangerSoft,
				},
			]}
			onPress={handlePress}
		>
			<View
				style={[
					styles.urgentIconBox,
					{
						backgroundColor: colors.dangerSoft,
					},
				]}
			>
				<Ionicons
					name="alert-circle-outline"
					size={30}
					color={colors.danger}
				/>
			</View>

			<View style={styles.urgentInfo}>
				<Text
					style={[
						styles.urgentTitle,
						{
							color: colors.text,
						},
					]}
					numberOfLines={2}
				>
					{activity.title}
				</Text>

				<Text
					style={[
						styles.urgentVence,
						{
							color: colors.danger,
						},
					]}
				>
					Vence hoy
				</Text>

				<View style={styles.urgentMeta}>
					<Ionicons
						name="time-outline"
						size={14}
						color={colors.muted}
					/>

					<Text style={[styles.urgentMetaText, { color: colors.muted }]}>
						{" "}
						{formatTime(activity.due_at)}
					</Text>
				</View>

				<View
					style={[
						styles.urgentPriorityBadge,
						{
							backgroundColor: priorityTone?.soft,
						},
					]}
				>
					<Text
						style={[
							styles.urgentPriorityText,
							{
								color: priorityTone?.color,
							},
						]}
					>
						{priorityLabel(activity.priority)}
					</Text>
				</View>
			</View>

			<View
				style={[
					styles.urgentChevron,
					{
						backgroundColor: colors.danger,
					},
				]}
			>
				<Ionicons
					name="chevron-forward"
					size={20}
					color="#FFFFFF"
				/>
			</View>
		</Pressable>
	);
});

const DeliveryItem = memo(function DeliveryItem({
	activity,
	colors,
	onPress,
}: {
	activity: Activity;
	colors: Colors;
	onPress: (id: string) => void;
}) {
	const days = daysUntil(activity.due_at);

	const handlePress = useCallback(() => {
		onPress(activity.id);
	}, [activity.id, onPress]);

	const metaText = useMemo(() => {
		if (days === null) return formatShortDate(activity.due_at);
		if (days === 0) return `Hoy • ${formatTime(activity.due_at)}`;
		if (days === 1) return `Mañana • ${formatTime(activity.due_at)}`;

		return `En ${days} días • ${formatShortDate(activity.due_at)}`;
	}, [days, activity.due_at]);

	const priorityTone = getPriorityTone(activity.priority, colors);

	return (
		<Pressable
			style={[
				styles.deliveryItem,
				styles.softShadow,
				{
					backgroundColor: colors.surface,
					borderColor: priorityTone.border,
				},
			]}
			onPress={handlePress}
		>
			<View
				style={[
					styles.deliveryIconBox,
					{
						backgroundColor: priorityTone.soft,
					},
				]}
			>
				<Ionicons
					name="calendar-outline"
					size={20}
					color={priorityTone.color}
				/>
			</View>

			<View style={styles.deliveryInfo}>
				<Text
					style={[
						styles.deliveryTitle,
						{
							color: colors.text,
						},
					]}
					numberOfLines={1}
				>
					{activity.title}
				</Text>

				<View style={styles.deliveryMetaRow}>
					<Ionicons
						name="time-outline"
						size={13}
						color={colors.muted}
					/>

					<Text style={[styles.deliveryMeta, { color: colors.muted }]}>
						{" "}
						{metaText}
					</Text>
				</View>

				<View
					style={[
						styles.priorityBadge,
						{
							backgroundColor: priorityTone.soft,
						},
					]}
				>
					<Text
						style={[
							styles.priorityText,
							{
								color: priorityTone.color,
							},
						]}
					>
						{priorityLabel(activity.priority)}
					</Text>
				</View>
			</View>

			<Ionicons
				name="chevron-forward"
				size={18}
				color={colors.subtle}
			/>
		</Pressable>
	);
});

export default function HomeScreen() {
	const { colors } = useAppTheme();
	const { session } = useAuth();

	const userId = session?.user.id;
	const kai = useKai(userId);

	const [activities, setActivities] = useState<Activity[]>([]);
	const [loading, setLoading] = useState(true);
	const [userName, setUserName] = useState("compañero");
	const [activeQuery, setActiveQuery] = useState<
		"today" | "tomorrow" | "next" | "week" | null
	>(null);

	const profileLoadedRef = useRef(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const [showKaiBubble, setShowKaiBubble] = useState(false);
	const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loadHomeData = useCallback(async () => {
		try {
			setLoading(true);

			if (!profileLoadedRef.current) {
				const [profile, data] = await Promise.all([
					getProfile(),
					getActivities(),
				]);

				if (profile?.name) setUserName(profile.name.split(" ")[0]);

				profileLoadedRef.current = true;
				setActivities(data ?? []);

				return;
			}

			const data = await getActivities();

			setActivities(data ?? []);
		} catch (error) {
			console.log("Error cargando home:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			loadHomeData();
		}, [loadHomeData])
	);

useEffect(() => {
	if (!kai.response.text) return;

	if (bubbleTimerRef.current) {
		clearTimeout(bubbleTimerRef.current);
	}

	setShowKaiBubble(true);

	Animated.timing(fadeAnim, {
		toValue: 1,
		duration: 450,
		useNativeDriver: true,
	}).start();

	bubbleTimerRef.current = setTimeout(() => {
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 700,
			useNativeDriver: true,
		}).start(() => {
			setShowKaiBubble(false);
			kai.clearResponse();
		});
	}, 5200);

	return () => {
		if (bubbleTimerRef.current) {
			clearTimeout(bubbleTimerRef.current);
		}
	};
}, [kai.response.text]);

	const now = useMemo(() => new Date(), []);

	const upcoming = useMemo(() => {
		return activities
			.filter((activity) => {
				if (activity.status === "completed" || !activity.due_at) return false;

				const due = new Date(activity.due_at);

				return isValidDate(due) && due >= now;
			})
			.sort((a, b) => {
				const priorityA = priorityScore(a);
				const priorityB = priorityScore(b);

				if (priorityA !== priorityB) return priorityA - priorityB;

				return new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime();
			});
	}, [activities, now]);

	const urgentActivity = useMemo(() => {
		return (
			upcoming.find((activity) => {
				if (!activity.due_at) return false;

				return isSameDay(new Date(activity.due_at), now);
			}) ?? null
		);
	}, [upcoming, now]);

	const topDeliveries = useMemo(() => {
		return upcoming
			.filter((activity) => activity.id !== urgentActivity?.id)
			.slice(0, TOP_DELIVERIES_LIMIT);
	}, [upcoming, urgentActivity]);

	const handleGoPending = useCallback(() => {
		router.push("/activities?filter=pending" as any);
	}, []);

	const handleGoImportCalendar = useCallback(() => {
		router.push("/(onboarding)/import-calendar" as any);
	}, []);

	const handleOpenActivity = useCallback((id: string) => {
		router.push({
			pathname: "/activity/[id]",
			params: {
				id,
			},
		});
	}, []);

	const handleQuickToday = useCallback(async () => {
	setActiveQuery("today");
	await kai.handleToday();

	setTimeout(() => {
		setActiveQuery(null);
	}, 1000);
}, [kai]);

const handleQuickTomorrow = useCallback(async () => {
	setActiveQuery("tomorrow");
	await kai.handleTomorrow();

	setTimeout(() => {
		setActiveQuery(null);
	}, 1000);
}, [kai]);

const handleQuickNext = useCallback(async () => {
	setActiveQuery("next");
	await kai.handleNext();

	setTimeout(() => {
		setActiveQuery(null);
	}, 1000);
}, [kai]);

const handleQuickWeek = useCallback(async () => {
	setActiveQuery("week");
	await kai.handleWeek();

	setTimeout(() => {
		setActiveQuery(null);
	}, 1000);
}, [kai]);

	if (loading) {
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
				<Screen
					contentStyle={[
						styles.loadingContent,
						{
							backgroundColor: colors.background,
						},
					]}
				>
					<View style={styles.loading}>
						<View
							style={[
								styles.loadingBox,
								{
									backgroundColor: colors.surface,
									borderColor: colors.border,
								},
							]}
						>
							<ActivityIndicator color={colors.primary} />
						</View>

						<Text
							style={[
								styles.loadingText,
								{
									color: colors.muted,
								},
							]}
						>
							Preparando tu día...
						</Text>
					</View>
				</Screen>
			</SafeAreaView>
		);
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
			{showKaiBubble && kai.response.text ?  (
				<Animated.View
					pointerEvents="none"
					style={[
						styles.kaiBubble,
						styles.cardShadow,
						{
							backgroundColor: colors.surface,
							borderColor: colors.border,
							opacity: fadeAnim,
							transform: [
								{
									translateY: fadeAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [-16, 0],
									}),
								},
							],
						},
					]}
				>
					<Image
						source={require("../../assets/images/icon-avatar.png")}
						style={styles.kaiBubbleAvatar}
					/>

					<Text
						style={[
							styles.kaiBubbleText,
							{
								color: colors.text,
							},
						]}
					>
						{kai.response.text}
					</Text>
				</Animated.View>
			) : null}

			<Screen
				contentStyle={[
					styles.screenContent,
					{
						backgroundColor: colors.background,
					},
				]}
			>
				<View
					style={[
						styles.page,
						{
							backgroundColor: colors.background,
						},
					]}
				>
                    <View style={styles.header}>
                    <View style={styles.heroImageGlow}>
                        <Image
                        source={require("../../assets/images/home-kai.png")}
                        style={styles.heroImage}
                        resizeMode="contain"
                        />
                    </View>

                    <Text style={[styles.heroTitle, { color: colors.text }]}>
                        Hola, <Text style={{ color: colors.primary }}>{userName}</Text>
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: colors.muted }]}>
                        Tienes {upcoming.length} actividades pendientes
                    </Text>
                    </View>

					<View style={styles.sectionHeader}>
						<View style={styles.sectionTitleRow}>
							<Ionicons
								name="flash"
								size={18}
								color={colors.primary}
							/>

							<Text
								style={[
									styles.sectionLabel,
									{
										color: colors.text,
									},
								]}
							>
								Consultas rápidas
							</Text>
						</View>

						<Text
							style={[
								styles.sectionHint,
								{
									color: colors.muted,
								},
							]}
						>
							Kai te habla
						</Text>
					</View>

					<View style={styles.kaiQuickGrid}>
						<KaiQuickCard
							title="Hoy"
							icon="calendar-outline"
							colors={colors}
							active={activeQuery === "today"}
							onPress={handleQuickToday}
						/>

						<KaiQuickCard
							title="Mañana"
							icon="sunny-outline"
							colors={colors}
							active={activeQuery === "tomorrow"}
							onPress={handleQuickTomorrow}
						/>

						<KaiQuickCard
							title="Próxima"
							icon="time-outline"
							colors={colors}
							active={activeQuery === "next"}
							onPress={handleQuickNext}
						/>

						<KaiQuickCard
							title="Semana"
							icon="stats-chart-outline"
							colors={colors}
							active={activeQuery === "week"}
							onPress={handleQuickWeek}
						/>
					</View>

					<View style={[styles.sectionHeader, { marginTop: 22 }]}>
						<View style={styles.sectionTitleRow}>
							<Ionicons
								name="alert-circle"
								size={18}
								color={urgentActivity ? colors.danger : colors.primary}
							/>

							<Text
								style={[
									styles.sectionLabel,
									{
										color: colors.text,
									},
								]}
							>
								Entrega urgente
							</Text>
						</View>
					</View>

					<UrgentCard
						activity={urgentActivity}
						colors={colors}
						onPress={handleOpenActivity}
					/>

					<View style={[styles.sectionHeader, { marginTop: 24 }]}>
						<View style={styles.sectionTitleRow}>
							<Ionicons
								name="calendar"
								size={18}
								color={colors.primary}
							/>

							<Text
								style={[
									styles.sectionLabel,
									{
										color: colors.text,
									},
								]}
							>
								Próximas entregas
							</Text>
						</View>

						<Pressable onPress={handleGoPending}>
							<Text
								style={[
									styles.sectionLink,
									{
										color: colors.primary,
									},
								]}
							>
								Ver todas ›
							</Text>
						</Pressable>
					</View>

					{topDeliveries.length === 0 ? (
						<View
							style={[
								styles.emptyState,
								styles.cardShadow,
								{
									backgroundColor: colors.surface,
									borderColor: colors.border,
								},
							]}
						>
							<View
								style={[
									styles.emptyIcon,
									{
										backgroundColor: colors.primarySoft,
									},
								]}
							>
								<Ionicons
									name="file-tray-outline"
									size={30}
									color={colors.primary}
								/>
							</View>

							<Text
								style={[
									styles.emptyTitle,
									{
										color: colors.text,
									},
								]}
							>
								Sin entregas próximas
							</Text>

							<Text
								style={[
									styles.emptyText,
									{
										color: colors.muted,
									},
								]}
							>
								Cuando tengas actividades, aparecerán aquí.
							</Text>
						</View>
					) : (
						<View style={styles.deliveriesList}>
							{topDeliveries.map((activity) => (
								<DeliveryItem
									key={activity.id}
									activity={activity}
									colors={colors}
									onPress={handleOpenActivity}
								/>
							))}
						</View>
					)}

					<Pressable
						style={[
							styles.importCard,
							styles.cardShadow,
							{
								backgroundColor: colors.surface,
								borderColor: colors.border,
							},
						]}
						onPress={handleGoImportCalendar}
					>
						<View
							style={[
								styles.importIcon,
								{
									backgroundColor: colors.primarySoft,
								},
							]}
						>
							<Ionicons
								name="cloud-upload-outline"
								size={24}
								color={colors.primary}
							/>
						</View>

						<View style={styles.importText}>
							<Text
								style={[
									styles.importTitle,
									{
										color: colors.text,
									},
								]}
							>
								Actualizar calendario
							</Text>

							<Text
								style={[
									styles.importSubtitle,
									{
										color: colors.muted,
									},
								]}
							>
								Importa nuevas actividades cuando lo necesites.
							</Text>
						</View>

						<Ionicons
							name="chevron-forward"
							size={20}
							color={colors.subtle}
						/>
					</Pressable>
				</View>
			</Screen>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},

	screenContent: {
		paddingHorizontal: 20,
		paddingTop: 14,
		paddingBottom: 120,
	},

	loadingContent: {
		flexGrow: 1,
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 120,
	},

	page: {
		flex: 1,
	},

	cardShadow: {
		shadowColor: "#000000",
		shadowOpacity: 0.06,
		shadowRadius: 18,
		shadowOffset: {
			width: 0,
			height: 8,
		},
		elevation: 3,
	},

	softShadow: {
		shadowColor: "#000000",
		shadowOpacity: 0.035,
		shadowRadius: 12,
		shadowOffset: {
			width: 0,
			height: 5,
		},
		elevation: 2,
	},

	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		minHeight: 500,
	},

	loadingBox: {
		width: 72,
		height: 72,
		borderRadius: 26,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},

	loadingText: {
		marginTop: 14,
		fontSize: 14,
		fontWeight: "800",
	},

	header: {
		alignItems: "center",
		marginBottom: 30,
		paddingTop: 20,
	},

	heroImageGlow: {
		width: 176,
		height: 126,
		borderRadius: 44,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 8,
		overflow: "visible",
	},

	heroImage: {
		width: 210,
		height: 150,
	},

	heroTitle: {
		fontSize: 30,
		fontFamily: typography.extraBold,
		textAlign: "center",
		letterSpacing: -1.2,
		lineHeight: 40,
	},

	heroSubtitle: {
		fontSize: 15,
		fontFamily: typography.medium,
		textAlign: "center",
		marginTop: 6,
		lineHeight: 22,
	},

	sectionHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 12,
	},

	sectionTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},

	sectionLabel: {
		fontSize: 16,
		fontFamily: typography.extraBold,
		letterSpacing: -0.4,
	},

	sectionHint: {
		fontSize: 13,
		fontFamily: typography.medium,

	},

	sectionLink: {
		fontSize: 14,
		fontFamily: typography.extraBold,
	},

	kaiQuickGrid: {
	flexDirection: "row",
	justifyContent: "space-between",
	marginTop: 6,
},

	kaiQuickCard: {
		width: "23%",
		height: 84,
		borderRadius: 16,
		paddingHorizontal: 6,
		paddingVertical: 10,
		alignItems: "center",
		justifyContent: "center",
	},

	kaiQuickIcon: {
		width: 34,
		height: 34,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 6,
	},

	kaiQuickTitle: {
		fontSize: 12,
		fontFamily: typography.bold,
		textAlign: "center",
		lineHeight: 14,
	},

	kaiBubble: {
		position: "absolute",
		top: 70,
		left: 16,
		right: 16,
		zIndex: 9999,
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 13,
		borderRadius: 22,
		borderWidth: 1,
	},

	kaiBubbleAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		marginRight: 11,
	},

	kaiBubbleText: {
		flex: 1,
		fontSize: 14,
		fontFamily: typography.medium,
		lineHeight: 20,
	},

	urgentCard: {
		borderRadius: 24,
		borderWidth: 1,
		padding: 16,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},

	urgentIconBox: {
		width: 58,
		height: 58,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},

	urgentInfo: {
		flex: 1,
	},

	urgentTitle: {
		fontSize: 17,
		fontFamily: typography.extraBold,
		letterSpacing: -0.3,
		lineHeight: 22,
	},

	urgentCalmText: {
		fontSize: 13,
		fontFamily: typography.medium,
		marginTop: 5,
		lineHeight: 19,
	},

	urgentVence: {
		fontSize: 14,
		fontFamily: typography.extraBold,
		marginTop: 4,
	},

	urgentMeta: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 5,
	},

	urgentMetaText: {
		fontSize: 13,
		fontFamily: typography.medium,
	},

	urgentPriorityBadge: {
		alignSelf: "flex-start",
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
		marginTop: 8,
	},

	urgentPriorityText: {
		fontSize: 12,
		fontFamily: typography.extraBold,
	},

	urgentChevron: {
		width: 34,
		height: 34,
		borderRadius: 17,
		alignItems: "center",
		justifyContent: "center",
		marginLeft: 10,
	},

	deliveriesList: {
		gap: 10,
		marginBottom: 24,
	},

	deliveryItem: {
		borderRadius: 22,
		borderWidth: 1,
		padding: 14,
		flexDirection: "row",
		alignItems: "center",
	},

	deliveryIconBox: {
		width: 46,
		height: 46,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},

	deliveryInfo: {
		flex: 1,
	},

	deliveryTitle: {
		fontSize: 15,
		fontFamily: typography.extraBold,
	},

	deliveryMetaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},

	deliveryMeta: {
		fontSize: 12,
		fontFamily: typography.medium,
	},

	priorityBadge: {
		alignSelf: "flex-start",
		borderRadius: 999,
		paddingHorizontal: 10,
		paddingVertical: 5,
		marginTop: 8,
	},

	priorityText: {
		fontSize: 11,
		fontFamily: typography.extraBold,
	},

	emptyState: {
		borderRadius: 26,
		borderWidth: 1,
		minHeight: 156,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
		marginBottom: 24,
	},

	emptyIcon: {
		width: 58,
		height: 58,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 12,
	},

	emptyTitle: {
		fontSize: 17,
		fontWeight: "900",
		textAlign: "center",
	},

	emptyText: {
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
		marginTop: 6,
		lineHeight: 19,
	},

	importCard: {
		borderRadius: 24,
		borderWidth: 1,
		padding: 18,
		flexDirection: "row",
		alignItems: "center",
		marginTop: 4,
	},

	importIcon: {
		width: 50,
		height: 50,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 14,
	},

	importText: {
		flex: 1,
	},

	importTitle: {
		fontSize: 16,
		fontWeight: "900",
	},

	importSubtitle: {
		fontSize: 13,
		lineHeight: 19,
		fontWeight: "700",
		marginTop: 4,
	},
});
