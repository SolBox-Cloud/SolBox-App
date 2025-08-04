import { StyleSheet, TextInput, View } from "react-native";
import React from "react";
import { Search } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChangeText,
  placeholder = "Search files...",
}: SearchInputProps) {
  return (
    <View style={styles.container}>
      <Search size={20} color={Colors.gray} style={styles.icon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.gray}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    height: 48,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
    height: "100%",
  },
});