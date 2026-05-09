import { router } from "expo-router";
import OnboardingScreen from "@/src/components/onboarding/OnboardingScreen";

export default function WelcomeScreen() {
  return (
    <OnboardingScreen
      image={require("../../assets/images/onboarding-welcome.png")}
      title="¡Hey, Bienvenido!"
      subtitle="Soy tu compañero académico"
      description="Organiza tus actividades, recibe recordatorios inteligentes y evita olvidar entregas importantes."
      buttonText="Siguiente"
      progress={1}
      onPress={() => router.push("/(onboarding)/organization")}
      onSecondaryPress={() => router.replace("/login")}
    />
  );
}