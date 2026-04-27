import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { env, envValidationError } from "@/env";
import { RootApp } from "@/RootApp";
import { colors } from "@/theme";

export default function App() {
  const convex = useMemo(() => {
    if (!env) {
      return null;
    }
    return new ConvexReactClient(env.EXPO_PUBLIC_CONVEX_URL, {
      unsavedChangesWarning: false,
    });
  }, []);

  if (!env || !convex) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            gap: 10,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "700" }}>UPSA Bridge</Text>
          <Text style={{ color: colors.danger, textAlign: "center", fontSize: 13 }}>
            App environment configuration is missing or invalid.
          </Text>
          <Text style={{ color: colors.textMuted, textAlign: "center", fontSize: 12 }}>
            {envValidationError ?? "Check EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in EAS environment variables."}
          </Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootApp />
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
