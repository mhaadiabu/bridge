import { isClerkAPIResponseError, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { Screen } from "@/components/Screen";
import { StateScreen } from "@/components/StateScreen";
import { colors } from "@/theme";

export function SignInScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresEmailCode, setRequiresEmailCode] = useState(false);

  useEffect(() => {
    if (!isLoaded || !signIn) {
      return;
    }

    if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
      setRequiresEmailCode(true);
    }
  }, [isLoaded, signIn]);

  const mapErrorToMessage = useCallback((error: unknown) => {
    if (isClerkAPIResponseError(error)) {
      return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? "Authentication failed.";
    }

    if (error instanceof Error) {
      return error.message;
    }

    return "Authentication failed.";
  }, []);

  const finishSignIn = useCallback(
    async (sessionId: string | null) => {
      if (!setActive || !sessionId) {
        setStatusMessage("Session could not be activated. Please try again.");
        return;
      }

      await setActive({
        session: sessionId,
      });
      router.replace("/");
    },
    [router, setActive],
  );

  if (!isLoaded || !signIn) {
    return <StateScreen title="Loading sign-in..." loading />;
  }

  const handleSubmit = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (result.status === "complete") {
        await finishSignIn(result.createdSessionId);
        return;
      }

      if (result.status === "needs_second_factor" || result.status === "needs_client_trust") {
        const emailCodeFactor = result.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (!emailCodeFactor) {
          setStatusMessage("Second factor is required, but email code is not enabled for this account.");
          return;
        }

        const prep = await signIn.prepareSecondFactor({ strategy: "email_code" });
        if (prep.status === "needs_second_factor" || prep.status === "needs_client_trust") {
          setRequiresEmailCode(true);
          setStatusMessage(`We sent a verification code to ${emailCodeFactor.safeIdentifier}.`);
          return;
        }
      }

      setStatusMessage(`Sign-in requires an unsupported step: ${result.status}.`);
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await signIn.prepareSecondFactor({ strategy: "email_code" });
      setStatusMessage("A new verification code was sent.");
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    }
  };

  const handleVerify = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code,
      });

      if (result.status === "complete") {
        await finishSignIn(result.createdSessionId);
        return;
      }

      setStatusMessage("Sign-in could not be completed. Please try again.");
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen scrollable={false}>
      <View style={styles.centered}>
        <Panel style={styles.card}>
          <Text style={styles.title}>{requiresEmailCode ? "Verify your account" : "Sign in"}</Text>
          <Text style={styles.subtitle}>
            {requiresEmailCode
              ? "Enter the code sent to your email."
              : "Continue to the UPSA Bridge dashboard."}
          </Text>

          {statusMessage ? <Text style={styles.message}>{statusMessage}</Text> : null}

          {requiresEmailCode ? (
            <>
              <TextInput
                value={code}
                placeholder="Verification code"
                placeholderTextColor={colors.textMuted}
                onChangeText={setCode}
                keyboardType="numeric"
                style={styles.input}
              />
              <PrimaryButton label={isSubmitting ? "Verifying..." : "Verify"} onPress={handleVerify} />
              <SecondaryButton label="Send a new code" onPress={handleResendCode} />
            </>
          ) : (
            <>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                value={emailAddress}
                placeholder="student@upsa.edu.gh"
                placeholderTextColor={colors.textMuted}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={password}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                onChangeText={setPassword}
                style={styles.input}
              />
              <PrimaryButton label={isSubmitting ? "Signing in..." : "Sign in"} onPress={handleSubmit} />
              <Link href="/sign-up" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Create account</Text>
                </Pressable>
              </Link>
            </>
          )}
        </Panel>
      </View>
    </Screen>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.primaryButton}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    backgroundColor: colors.surfaceMuted,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#07111f",
    fontWeight: "700",
    textAlign: "center",
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
});
