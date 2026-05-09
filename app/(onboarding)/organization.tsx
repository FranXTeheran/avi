import { router } from "expo-router";
import OnboardingScreen from "@/src/components/onboarding/OnboardingScreen";

export default function OrganizationScreen() {
  return (
    <OnboardingScreen
      image={require("../../assets/images/onboarding-organization.png")}
      title="Tus materias organizadas automáticamente"
      highlight="organizadas"
      description="Importamos tus actividades y las organizamos por materia, unidad y fecha de entrega."
      buttonText="Continuar"
      progress={2}
      onPress={() => router.push("/(onboarding)/import-calendar")}
    />
  );
}