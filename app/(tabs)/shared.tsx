import { StyleSheet, Text, View, FlatList, TouchableOpacity } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Link, Copy, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import EmptyState from "@/components/EmptyState";
import ToggleSwitch from "@/components/ToggleSwitch";
import { useFileStore } from "@/store/fileStore";

export default function SharedScreen() {
  const router = useRouter();
  const { files, shares, removeShare } = useFileStore();

  const sharedFiles = shares.map((share) => {
    const file = files.find((f) => f.id === share.fileId);
    return {
      ...share,
      fileName: file?.name || "Unknown file",
      fileType: file?.type || "default",
    };
  });

  const handleCopyLink = (link: string) => {
    // In a real app, you would copy to clipboard
    console.log("Copied link:", link);
  };

  const handleDeleteShare = (id: string) => {
    removeShare(id);
  };

  if (sharedFiles.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Text style={styles.title}>Shared Files</Text>
        <EmptyState
          title="No shared files"
          description="Share your files with others to see them here"
          icon={<Link size={64} color={Colors.gray} />}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Shared Files</Text>
      
      <FlatList
        data={sharedFiles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.shareCard}>
            <View style={styles.shareHeader}>
              <Text style={styles.fileName}>{item.fileName}</Text>
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionLabel}>Read-only</Text>
                <ToggleSwitch
                  value={!item.isReadOnly}
                  onToggle={() => console.log("Toggle permission")}
                />
              </View>
            </View>
            
            <View style={styles.linkContainer}>
              <Text style={styles.link} numberOfLines={1}>
                {item.link}
              </Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={() => handleCopyLink(item.link)}
              >
                <Copy size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
            
            {item.expirationDate && (
              <Text style={styles.expiration}>
                Expires on {item.expirationDate}
              </Text>
            )}
            
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/share?id=${item.fileId}`)}
              >
                <Text style={styles.actionButtonText}>Manage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteShare(item.id)}
              >
                <Trash2 size={16} color={Colors.error} />
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                  Revoke
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: theme.spacing.lg,
  },
  shareCard: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  shareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  fileName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    flex: 1,
  },
  permissionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  permissionLabel: {
    fontSize: 14,
    color: Colors.gray,
    marginRight: theme.spacing.sm,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  link: {
    flex: 1,
    color: Colors.primary,
    fontSize: 14,
  },
  copyButton: {
    padding: theme.spacing.xs,
  },
  expiration: {
    fontSize: 12,
    color: Colors.warning,
    marginBottom: theme.spacing.md,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
    backgroundColor: "rgba(0,191,255,0.1)",
  },
  actionButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "rgba(244,67,54,0.1)",
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButtonText: {
    color: Colors.error,
    marginLeft: 4,
  },
});