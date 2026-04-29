import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { StatusBar } from "expo-status-bar";
import { type PropsWithChildren, useMemo } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { StateScreen } from "@/components/StateScreen";
import { env, envValidationError } from "@/env";

export function AppProviders({ children }: PropsWithChildren) {
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
      <GestureHandlerRootView style={styles.root}>
        <StatusBar style="light" />
        <StateScreen
          title="UPSA Bridge"
          message={
            envValidationError ??
            "App environment configuration is missing or invalid. Check EXPO_PUBLIC_CONVEX_URL and EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in EAS environment variables."
          }
          tone="danger"
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <GestureHandlerRootView style={styles.root}>
          <StatusBar style="light" />
          {children}
        </GestureHandlerRootView>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
