import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  width?: number | string;
  showPercentage?: boolean;
  color?: string;
}

export default function ProgressBar({
  progress,
  height = 6,
  width = "100%",
  showPercentage = false,
  color = Colors.primary,
}: ProgressBarProps) {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      {showPercentage && (
        <Text style={styles.percentageText}>{percentage}%</Text>
      )}
      <View style={[styles.progressContainer, { height, width }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.spacing.sm,
  },
  progressContainer: {
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
  },
  percentageText: {
    color: Colors.white,
    fontSize: 12,
    marginBottom: 4,
  },
});