import { type PropsWithChildren } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";

import { colors } from "@/theme";

type PanelProps = PropsWithChildren<
  ViewProps & {
    compact?: boolean;
  }
>;

export function Panel({ children, compact = false, style, ...props }: PanelProps) {
  return (
    <View style={[styles.base, compact ? styles.compact : styles.regular, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  regular: {
    padding: 16,
  },
  compact: {
    padding: 12,
  },
});
