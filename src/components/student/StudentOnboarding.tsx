import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Panel } from "@/components/Panel";
import { colors } from "@/theme";

type Props = {
  consentStatus: "pending" | "granted" | "declined";
  onboardingCompletedAt?: number;
  isSaving: boolean;
  onUpdateConsent: (granted: boolean) => void;
  onCompleteOnboarding: (payload: { preferredReminderHour?: number; timezone?: string }) => void;
};

export function StudentOnboarding({ consentStatus, onboardingCompletedAt, isSaving, onUpdateConsent, onCompleteOnboarding }: Props) {
  const [preferredHour, setPreferredHour] = useState("18");
  const [timezone, setTimezone] = useState("Africa/Accra");
  const [consentChecked, setConsentChecked] = useState(consentStatus === "granted");

  const needsConsent = consentStatus !== "granted";
  const needsOnboarding = !onboardingCompletedAt;
  const showCard = needsConsent || needsOnboarding;

  const helperText = useMemo(() => {
    if (consentStatus === "granted") return "Consent captured. You can update preferences any time.";
    if (consentStatus === "declined") return "Consent is required to participate in adaptive nudges and analytics.";
    return "Before using the MVP, confirm consent and your preferred reminder window.";
  }, [consentStatus]);

  if (!showCard) return null;

  return (
    <Panel>
      <Text style={styles.title}>Onboarding and consent</Text>
      <Text style={styles.muted}>{helperText}</Text>
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.text}>I consent to participation and data usage for this MVP evaluation.</Text>
          <Text style={styles.muted}>Data includes nudge exposure, assignment interactions, and submission outcomes.</Text>
        </View>
        <Switch value={consentChecked} onValueChange={setConsentChecked} />
      </View>
      <View style={styles.buttonRow}>
        <Action label="Decline" muted onPress={() => onUpdateConsent(false)} disabled={isSaving} />
        <Action label="Grant consent" onPress={() => onUpdateConsent(true)} disabled={isSaving || !consentChecked} />
      </View>
      <Text style={styles.text}>Reminder preferences</Text>
      <TextInput value={preferredHour} onChangeText={setPreferredHour} placeholder="18" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={styles.input} />
      <TextInput value={timezone} onChangeText={setTimezone} placeholder="Africa/Accra" placeholderTextColor={colors.textMuted} style={styles.input} />
      <Action
        label="Complete onboarding"
        onPress={() => {
          const parsedHour = Number.parseInt(preferredHour, 10);
          onCompleteOnboarding({ preferredReminderHour: Number.isNaN(parsedHour) ? undefined : parsedHour, timezone });
        }}
        disabled={isSaving || consentStatus !== "granted"}
      />
    </Panel>
  );
}

function Action({ label, onPress, disabled, muted }: { label: string; onPress: () => void; disabled?: boolean; muted?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.button, muted ? styles.buttonMuted : null, disabled ? styles.buttonDisabled : null]}>
      <Text style={[styles.buttonText, muted ? styles.buttonTextMuted : null]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 4 },
  text: { color: colors.text, fontSize: 14 },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  switchRow: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 12 },
  buttonRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  button: { flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginTop: 8 },
  buttonMuted: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#07111f", fontWeight: "700", textAlign: "center" },
  buttonTextMuted: { color: colors.text },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, backgroundColor: colors.surfaceMuted, marginTop: 8 },
});
