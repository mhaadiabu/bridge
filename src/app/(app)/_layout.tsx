import { SignedIn, SignedOut, useAuth } from "@clerk/expo";
import { Redirect, Stack } from "expo-router";

import { StateScreen } from "@/components/StateScreen";

export default function ProtectedLayout() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <StateScreen title="Loading UPSA Bridge..." loading />;
  }

  return (
    <>
      <SignedIn>
        <Stack screenOptions={{ headerShown: false }} />
      </SignedIn>
      <SignedOut>
        <Redirect href="/sign-in" />
      </SignedOut>
    </>
  );
}
