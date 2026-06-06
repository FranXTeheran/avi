import { useCallback, useState } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	Alert,
	TouchableWithoutFeedback,
	Keyboard,
	ActivityIndicator,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { signIn } from "@/src/services/auth.service";
import { registerPushToken } from "@/src/services/push-token.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

export default function LoginScreen() {
	const { colors } = useAppTheme();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleTogglePassword = useCallback(() => {
		setShowPassword((current) => !current);
	}, []);

	const handleToggleRemember = useCallback(() => {
		setRemember((current) => !current);
	}, []);

	const handleGoToRegister = useCallback(() => {
		router.push("/(auth)/register");
	}, []);

	const handleLogin = useCallback(async () => {
		if (loading) return;

		const normalizedEmail = email.trim().toLowerCase();
		const normalizedPassword = password.trim();

		if (!normalizedEmail || !normalizedPassword) {
			Alert.alert("Falta información", "Ingresa tu correo y contraseña.");
			return;
		}

		try {
			setLoading(true);

			await signIn(normalizedEmail, normalizedPassword);
			registerPushToken().catch(console.warn);

			router.replace("/homeKai");
		} catch (error: any) {
			Alert.alert(
				"Error",
				error?.message ?? "No pudimos iniciar sesión. Intenta nuevamente."
			);
		} finally {
			setLoading(false);
		}
	}, [email, password, loading]);

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
			<TouchableWithoutFeedback
				onPress={Keyboard.dismiss}
				accessible={false}
			>
				<View
					style={[
						styles.screen,
						{
							backgroundColor: colors.background,
						},
					]}
				>
					<View style={styles.container}>
						<View style={styles.header}>
							

							<Text
								style={[
									styles.title,
									{
										color: colors.text,
									},
								]}
							>
								Bienvenido de vuelta
							</Text>

							<Text
								style={[
									styles.subtitle,
									{
										color: colors.muted,
									},
								]}
							>
								Inicia sesión para continuar organizando tu semestre.
							</Text>
						</View>

						<View
							style={[
								styles.formCard,
								{
									backgroundColor: colors.surface,
									borderColor: colors.border,
								},
							]}
						>
							<Text
								style={[
									styles.label,
									{
										color: colors.text,
									},
								]}
							>
								Correo electrónico
							</Text>

							<TextInput
								value={email}
								onChangeText={setEmail}
								placeholder="Ingresa tu correo electrónico"
								placeholderTextColor={colors.subtle}
								style={[
									styles.input,
									{
										backgroundColor: colors.surfaceSoft,
										borderColor: colors.border,
										color: colors.text,
									},
								]}
								autoCapitalize="none"
								autoCorrect={false}
								keyboardType="email-address"
								textContentType="emailAddress"
								autoComplete="email"
								returnKeyType="next"
								editable={!loading}
							/>

							<Text
								style={[
									styles.label,
									{
										color: colors.text,
									},
								]}
							>
								Contraseña
							</Text>

							<View
								style={[
									styles.passwordBox,
									{
										backgroundColor: colors.surfaceSoft,
										borderColor: colors.border,
									},
								]}
							>
								<TextInput
									value={password}
									onChangeText={setPassword}
									placeholder="Ingresa tu contraseña"
									placeholderTextColor={colors.subtle}
									style={[
										styles.passwordInput,
										{
											color: colors.text,
										},
									]}
									secureTextEntry={!showPassword}
									autoCapitalize="none"
									autoCorrect={false}
									textContentType="password"
									autoComplete="password"
									returnKeyType="done"
									onSubmitEditing={handleLogin}
									editable={!loading}
								/>

								<TouchableOpacity
									onPress={handleTogglePassword}
									activeOpacity={0.7}
									disabled={loading}
									style={styles.eyeButton}
								>
									<Feather
										name={showPassword ? "eye" : "eye-off"}
										size={18}
										color={colors.subtle}
									/>
								</TouchableOpacity>
							</View>

							<View style={styles.optionsRow}>
								<TouchableOpacity
									style={styles.rememberRow}
									onPress={handleToggleRemember}
									activeOpacity={0.8}
									disabled={loading}
								>
									<View
										style={[
											styles.checkbox,
											{
												borderColor: remember
													? colors.primary
													: colors.border,
												backgroundColor: remember
													? colors.primary
													: "transparent",
											},
										]}
									>
										{remember ? (
											<Feather
												name="check"
												size={11}
												color="#FFFFFF"
											/>
										) : null}
									</View>

									<Text
										style={[
											styles.rememberText,
											{
												color: colors.muted,
											},
										]}
									>
										Recuérdame
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									activeOpacity={0.7}
									disabled={loading}
								>
									<Text
										style={[
											styles.forgotText,
											{
												color: colors.primary,
											},
										]}
									>
										¿Olvidaste tu contraseña?
									</Text>
								</TouchableOpacity>
							</View>

							<TouchableOpacity
								style={[
									styles.primaryButton,
									{
										backgroundColor: colors.primary,
									},
									loading && styles.disabledButton,
								]}
								onPress={handleLogin}
								disabled={loading}
								activeOpacity={0.9}
							>
								{loading ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text style={styles.primaryButtonText}>
										Iniciar sesión
									</Text>
								)}
							</TouchableOpacity>

							<View style={styles.dividerRow}>
								<View
									style={[
										styles.dividerLine,
										{
											backgroundColor: colors.border,
										},
									]}
								/>

								<Text
									style={[
										styles.dividerText,
										{
											color: colors.muted,
										},
									]}
								>
									o
								</Text>

								<View
									style={[
										styles.dividerLine,
										{
											backgroundColor: colors.border,
										},
									]}
								/>
							</View>

							<TouchableOpacity
								style={[
									styles.googleButton,
									{
										backgroundColor: colors.surfaceSoft,
										borderColor: colors.border,
									},
								]}
								activeOpacity={0.9}
								disabled={loading}
							>
								<Text style={styles.googleIcon}>G</Text>

								<Text
									style={[
										styles.googleText,
										{
											color: colors.text,
										},
									]}
								>
									Continuar con Google
								</Text>
							</TouchableOpacity>
						</View>

						<View style={styles.footer}>
							<Text
								style={[
									styles.footerText,
									{
										color: colors.muted,
									},
								]}
							>
								¿No tienes cuenta?
							</Text>

							<TouchableOpacity
								onPress={handleGoToRegister}
								disabled={loading}
							>
								<Text
									style={[
										styles.footerLink,
										{
											color: colors.primary,
										},
									]}
								>
									{" "}Regístrate
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
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

	container: {
		flex: 1,
		paddingHorizontal: 28,
		paddingTop: 74,
		paddingBottom: 28,
		justifyContent: "center",
	},

	header: {
		alignItems: "center",
		marginBottom: 30,
	},

	logoMark: {
		width: 64,
		height: 64,
		borderRadius: 22,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 18,
	},

	title: {
		fontSize: 32,
		fontWeight: "900",
		textAlign: "center",
		letterSpacing: -0.8,
	},

	subtitle: {
		fontSize: 14,
		fontWeight: "700",
		textAlign: "center",
		lineHeight: 21,
		marginTop: 8,
		maxWidth: 300,
	},

	formCard: {
		width: "100%",
		borderRadius: 28,
		borderWidth: 1,
		padding: 22,

		shadowColor: "#000000",
		shadowOpacity: 0.08,
		shadowRadius: 18,
		shadowOffset: {
			width: 0,
			height: 10,
		},
		elevation: 4,
	},

	label: {
		fontSize: 14,
		fontWeight: "800",
		marginBottom: 8,
	},

	input: {
		height: 50,
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 16,
		fontSize: 14,
		fontWeight: "700",
		marginBottom: 18,
	},

	passwordBox: {
		height: 50,
		borderWidth: 1,
		borderRadius: 16,
		paddingHorizontal: 16,
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 16,
	},

	passwordInput: {
		flex: 1,
		fontSize: 14,
		fontWeight: "700",
		paddingVertical: 0,
	},

	eyeButton: {
		width: 34,
		height: 34,
		alignItems: "center",
		justifyContent: "center",
	},

	optionsRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 24,
	},

	rememberRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	checkbox: {
		width: 17,
		height: 17,
		borderRadius: 5,
		borderWidth: 1,
		marginRight: 7,
		alignItems: "center",
		justifyContent: "center",
	},

	rememberText: {
		fontSize: 12,
		fontWeight: "700",
	},

	forgotText: {
		fontSize: 12,
		fontWeight: "900",
	},

	primaryButton: {
		width: "100%",
		height: 52,
		borderRadius: 18,
		alignItems: "center",
		justifyContent: "center",
	},

	disabledButton: {
		opacity: 0.7,
	},

	primaryButtonText: {
		fontSize: 16,
		fontWeight: "900",
		color: "#FFFFFF",
	},

	dividerRow: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 24,
	},

	dividerLine: {
		flex: 1,
		height: 1,
	},

	dividerText: {
		marginHorizontal: 12,
		fontSize: 12,
		fontWeight: "800",
	},

	googleButton: {
		height: 50,
		borderRadius: 16,
		borderWidth: 1,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
	},

	googleIcon: {
		fontSize: 17,
		fontWeight: "900",
		color: "#4285F4",
	},

	googleText: {
		fontSize: 14,
		fontWeight: "800",
	},

	footer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 26,
	},

	footerText: {
		fontSize: 14,
		fontWeight: "700",
	},

	footerLink: {
		fontSize: 14,
		fontWeight: "900",
	},
});