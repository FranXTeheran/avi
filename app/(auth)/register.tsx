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

import { signUp } from "@/src/services/auth.service";
import { registerPushToken } from "@/src/services/push-token.service";
import { useAppTheme } from "@/src/hooks/useAppTheme";

export default function RegisterScreen() {
	const { colors } = useAppTheme();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleTogglePassword = useCallback(() => {
		setShowPassword((current) => !current);
	}, []);

	const handleGoToLogin = useCallback(() => {
		router.push("/login");
	}, []);

	const handleRegister = useCallback(async () => {
		if (loading) return;

		const normalizedName = name.trim();
		const normalizedEmail = email.trim().toLowerCase();
		const normalizedPassword = password.trim();

		if (!normalizedName || !normalizedEmail || !normalizedPassword) {
			Alert.alert("Falta información", "Completa todos los campos.");
			return;
		}

		if (normalizedPassword.length < 8) {
			Alert.alert("Contraseña muy corta", "Usa mínimo 8 caracteres.");
			return;
		}

		try {
			setLoading(true);

			await signUp(normalizedEmail, normalizedPassword, normalizedName);
			registerPushToken().catch(console.warn);

			router.replace("/(onboarding)/welcome");
		} catch (error: any) {
			Alert.alert(
				"Error",
				error?.message ?? "No pudimos crear tu cuenta. Intenta nuevamente."
			);
		} finally {
			setLoading(false);
		}
	}, [name, email, password, loading]);

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
								Crear cuenta
							</Text>

							<Text
								style={[
									styles.subtitle,
									{
										color: colors.muted,
									},
								]}
							>
								Únete y empieza a organizar tu vida académica.
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
								Nombre completo
							</Text>

							<TextInput
								value={name}
								onChangeText={setName}
								placeholder="Ingresa tu nombre"
								placeholderTextColor={colors.subtle}
								style={[
									styles.input,
									{
										backgroundColor: colors.surfaceSoft,
										borderColor: colors.border,
										color: colors.text,
									},
								]}
								autoCapitalize="words"
								autoCorrect={false}
								textContentType="name"
								autoComplete="name"
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
								Correo electrónico
							</Text>

							<TextInput
								value={email}
								onChangeText={setEmail}
								placeholder="Ingresa correo electrónico"
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
									placeholder="Crea una contraseña"
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
									textContentType="newPassword"
									autoComplete="new-password"
									returnKeyType="done"
									onSubmitEditing={handleRegister}
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

							<Text
								style={[
									styles.helperText,
									{
										color: colors.muted,
									},
								]}
							>
								Mínimo 8 caracteres, incluye números y letras
							</Text>

							<TouchableOpacity
								style={[
									styles.primaryButton,
									{
										backgroundColor: colors.primary,
									},
									loading && styles.disabledButton,
								]}
								onPress={handleRegister}
								disabled={loading}
								activeOpacity={0.9}
							>
								{loading ? (
									<ActivityIndicator color="#FFFFFF" />
								) : (
									<Text style={styles.primaryButtonText}>
										Crear cuenta
									</Text>
								)}
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
								¿Ya tienes cuenta?
							</Text>

							<TouchableOpacity
								onPress={handleGoToLogin}
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
									{" "}Inicia sesión
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
		marginBottom: 10,
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

	helperText: {
		fontSize: 12,
		fontWeight: "700",
		marginBottom: 24,
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