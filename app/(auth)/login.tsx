import { useState } from "react";
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

const YELLOW = "#FFC21A";
const BLACK = "#1F1F1F";
const GRAY = "#8A8A8A";
const LIGHT_GRAY = "#F4F4F4";
const BORDER = "#E8E8E8";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);

      await signIn(email.trim(), password);

      router.replace("/home");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.screen}>
          <View style={styles.topBar} />

          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Iniciar sesión</Text>
              <Text style={styles.subtitle}>
                Bienvenido de vuelta{"\n"}¡Organiza tu semestre!
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa tu correo electrónico"
                placeholderTextColor="#B8B8B8"
                style={styles.input}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />

              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.passwordBox}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ingresa tu contraseña"
                  placeholderTextColor="#B8B8B8"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={16}
                    color="#B0B0B0"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity
                  style={styles.rememberRow}
                  onPress={() => setRemember(!remember)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                    {remember && <Feather name="check" size={10} color={BLACK} />}
                  </View>

                  <Text style={styles.rememberText}>Recuérdame</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity style={styles.googleButton} activeOpacity={0.9}>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleText}>Continuar con Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>

              <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.footerLink}> Regístrate</Text>
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
    backgroundColor: YELLOW,
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  topBar: {
    height: 8,
    backgroundColor: YELLOW,
  },

  container: {
    flex: 1,
    paddingHorizontal: 38,
    paddingTop: 88,
    paddingBottom: 28,
  },

  header: {
    alignItems: "center",
    marginBottom: 42,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: BLACK,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: GRAY,
    textAlign: "center",
    lineHeight: 18,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: BLACK,
    marginBottom: 7,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 14,
    fontSize: 12,
    color: BLACK,
    backgroundColor: "#FFFFFF",
    marginBottom: 18,
  },

  passwordBox: {
    height: 46,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 9,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginBottom: 14,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    paddingVertical: 0,
  },

  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "#A9A9A9",
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  checkboxActive: {
    backgroundColor: YELLOW,
    borderColor: YELLOW,
  },

  rememberText: {
    fontSize: 12,
    color: GRAY,
  },

  forgotText: {
    fontSize: 12,
    fontWeight: "700",
    color: YELLOW,
  },

  primaryButton: {
    width: 142,
    height: 44,
    borderRadius: 13,
    backgroundColor: YELLOW,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: BLACK,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
  },

  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: "#A5A5A5",
  },

  googleButton: {
    height: 48,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  googleIcon: {
    fontSize: 16,
    fontWeight: "900",
    color: "#4285F4",
  },

  googleText: {
    fontSize: 14,
    fontWeight: "700",
    color: BLACK,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 34,
  },

  footerText: {
    fontSize: 14,
    color: GRAY,
  },

  footerLink: {
    fontSize: 14,
    fontWeight: "800",
    color: YELLOW,
  },
});