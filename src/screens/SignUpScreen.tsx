import { isClerkAPIResponseError, useAuth } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { Screen } from "@/components/Screen";
import { colors } from "@/theme";

type SignUpScreenProps = {
  onSwitchMode: () => void;
};

export function SignUpScreen({ onSwitchMode }: SignUpScreenProps) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn } = useAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mapErrorToMessage = useCallback((error: unknown) => {
    if (isClerkAPIResponseError(error)) {
      return error.errors[0]?.longMessage ?? error.errors[0]?.message ?? "Unable to continue sign-up.";
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Unable to continue sign-up.";
  }, []);

  const finishSignUp = useCallback(
    async (sessionId: string | null) => {
      if (!setActive || !sessionId) {
        setStatusMessage("Account created but session activation failed.");
        return;
      }
      await setActive({
        session: sessionId,
      });
    },
    [setActive],
  );

  if (isSignedIn || !isLoaded || !signUp) {
    return null;
  }

  const handleSubmit = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStatusMessage(`We sent a verification code to ${emailAddress.trim()}.`);
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setStatusMessage(null);
    setIsSubmitting(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await finishSignUp(result.createdSessionId);
        return;
      }

      setStatusMessage("That code did not complete sign-up. Please try again.");
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendCode = async () => {
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setStatusMessage("A new verification code was sent.");
    } catch (error) {
      setStatusMessage(mapErrorToMessage(error));
    }
  };

  const awaitingVerification =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields.includes("email_address") &&
    signUp.missingFields.length === 0;

  return (
    <Screen scrollable={false}>
      <View style={styles.centered}>
        <Panel style={styles.card}>
          <Text style={styles.title}>{awaitingVerification ? "Verify your account" : "Create account"}</Text>
          <Text style={styles.subtitle}>
            {awaitingVerification
              ? "Enter the email verification code."
              : "Set up your UPSA Bridge profile."}
          </Text>

          {statusMessage ? <Text style={styles.message}>{statusMessage}</Text> : null}

          {awaitingVerification ? (
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
              <SecondaryButton label="Send a new code" onPress={resendCode} />
            </>
          ) : (
            <>
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="student@upsa.edu.gh"
                placeholderTextColor={colors.textMuted}
                onChangeText={setEmailAddress}
                keyboardType="email-address"
                style={styles.input}
              />
              <TextInput
                value={password}
                placeholder="Create password"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                onChangeText={setPassword}
                style={styles.input}
              />
              <PrimaryButton label={isSubmitting ? "Creating..." : "Sign up"} onPress={handleSubmit} />
              <SecondaryButton label="Already registered? Sign in" onPress={onSwitchMode} />
              <View nativeID="clerk-captcha" />
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
