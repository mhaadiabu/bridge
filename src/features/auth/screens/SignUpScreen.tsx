import { ClerkLoaded } from "@clerk/expo";
import { StyleSheet, View } from "react-native";

import { Screen } from "@/components/Screen";

export function SignUpScreen() {
  return (
    <Screen scrollable={false}>
      <View style={styles.container}>
        <ClerkLoaded>
          <View nativeID="clerk-captcha" />
        </ClerkLoaded>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
});
