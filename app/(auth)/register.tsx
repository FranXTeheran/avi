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

import { signUp } from "@/src/services/auth.service";

const YELLOW = "#FFC21A";
const BLACK = "#1F1F1F";
const GRAY = "#8A8A8A";
const BORDER = "#E8E8E8";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    try {
      setLoading(true);
      await signUp(email.trim(), password, name.trim());
      router.replace("/(onboarding)/welcome");
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
              <Text style={styles.title}>Crear cuenta</Text>
              <Text style={styles.subtitle}>
                Únete y empieza a organizar{"\n"}tu vida académica.
              </Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nombre completo</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ingresa tu nombre"
                placeholderTextColor="#B8B8B8"
                style={styles.input}
              />

              <Text style={styles.label}>Correo electrónico</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Ingresa correo electrónico"
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
                  placeholder="Crea una contraseña"
                  placeholderTextColor="#B8B8B8"
                  style={styles.passwordInput}
                  secureTextEntry={!showPassword}
                />

                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={16}
                    color="#B0B0B0"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.helperText}>
                Mínimo 8 caracteres, incluye números y letras
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color={BLACK} />
                ) : (
                  <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>

              <TouchableOpacity onPress={() => router.push("/login")}>
                <Text style={styles.footerLink}> Inicia sesión</Text>
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
    fontSize: 14,
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
    marginBottom: 10,
  },

  passwordInput: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    paddingVertical: 0,
  },

  helperText: {
    fontSize: 12,
    color: GRAY,
    marginBottom: 30,
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