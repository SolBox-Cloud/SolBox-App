import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import FileIcon from "./FileIcon";

interface FolderGridItemProps {
  name: string;
  itemCount: number;
  onPress: () => void;
  isAddNew?: boolean;
}

export default function FolderGridItem({
  name,
  itemCount,
  onPress,
  isAddNew = false,
}: FolderGridItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <FileIcon type="folder" size={40} color={isAddNew ? Colors.secondary : Colors.primary} />
      </View>
      <Text style={styles.folderName} numberOfLines={1}>
        {name}
      </Text>
      {!isAddNew && (
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: theme.spacing.xs,
  },
  folderName: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  itemCount: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});