import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { FileQuestion } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon || <FileQuestion size={64} color={Colors.gray} />}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "600",
    marginTop: theme.spacing.lg,
    textAlign: "center",
  },
  description: {
    color: Colors.gray,
    fontSize: 14,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  button: {
    marginTop: theme.spacing.lg,
  },
});