import { StyleSheet, View } from "react-native";
import React from "react";
import { File, FileImage, FileText, FileVideo, FolderArchive } from "lucide-react-native";
import Colors from "@/constants/colors";

interface FileIconProps {
  type: "pdf" | "image" | "video" | "zip" | "folder" | "default";
  size?: number;
  color?: string;
}

export default function FileIcon({
  type,
  size = 32,
  color = Colors.primary,
}: FileIconProps) {
  const renderIcon = () => {
    switch (type) {
      case "pdf":
        return <FileText size={size} color={color} />;
      case "image":
        return <FileImage size={size} color={color} />;
      case "video":
        return <FileVideo size={size} color={color} />;
      case "zip":
        return <FolderArchive size={size} color={color} />;
      case "folder":
        return <FolderArchive size={size} color={color} />;
      default:
        return <File size={size} color={color} />;
    }
  };

  return <View style={styles.container}>{renderIcon()}</View>;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});