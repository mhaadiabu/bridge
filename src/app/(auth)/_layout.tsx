import { useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

import { StateScreen } from "@/components/StateScreen";

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <StateScreen title="Loading UPSA Bridge..." loading />;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
