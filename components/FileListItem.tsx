import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import { MoreVertical } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import FileIcon from "./FileIcon";

interface FileListItemProps {
  name: string;
  type: "pdf" | "image" | "video" | "zip" | "folder" | "default";
  size?: string;
  modifiedDate?: string;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export default function FileListItem({
  name,
  type,
  size,
  modifiedDate,
  onPress,
  onOptionsPress,
}: FileListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.iconContainer}>
        <FileIcon type={type} size={32} />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.fileInfo}>
          {size && `${size} • `}
          {modifiedDate || ""}
        </Text>
      </View>
      {onOptionsPress && (
        <TouchableOpacity style={styles.optionsButton} onPress={onOptionsPress}>
          <MoreVertical size={20} color={Colors.gray} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    height: 60,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  infoContainer: {
    flex: 1,
  },
  fileName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  fileInfo: {
    color: Colors.gray,
    fontSize: 12,
    marginTop: 2,
  },
  optionsButton: {
    padding: theme.spacing.xs,
  },
});