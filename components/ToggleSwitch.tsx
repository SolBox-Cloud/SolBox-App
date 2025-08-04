import { StyleSheet, TouchableOpacity, View, Platform } from "react-native";
import React from "react";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";

interface ToggleSwitchProps {
  value: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function ToggleSwitch({
  value,
  onToggle,
  disabled = false,
}: ToggleSwitchProps) {
  // Use simple animated styles for better Android compatibility
  const trackStyle = [
    styles.track,
    {
      backgroundColor: value ? Colors.primary : Colors.darkGray,
    }
  ];

  const thumbStyle = [
    styles.thumb,
    {
      transform: [{ translateX: value ? 20 : 0 }],
    }
  ];

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      <View style={trackStyle}>
        <View style={thumbStyle} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  track: {
    width: 46,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.white,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
    }),
  },
  disabled: {
    opacity: 0.5,
  },
});