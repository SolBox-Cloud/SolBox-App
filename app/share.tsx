import { StyleSheet, Text, View, TouchableOpacity, Switch } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Copy, Share2, Trash2 } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";
import FileIcon from "@/components/FileIcon";
import { useFileStore } from "@/store/fileStore";

export default function ShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const fileId = params.id as string;
  
  const { files, shares, shareFile, removeShare } = useFileStore();
  const file = files.find((f) => f.id === fileId);
  const existingShare = shares.find((s) => s.fileId === fileId);
  
  const [isReadOnly, setIsReadOnly] = useState(existingShare?.isReadOnly ?? true);
  const [shareLink, setShareLink] = useState(existingShare?.link ?? "");
  
  const handleCreateShare = () => {
    if (!file) return;
    
    if (existingShare) {
      removeShare(existingShare.id);
    }
    
    const shareId = shareFile(file.id, isReadOnly);
    const newShare = shares.find((s) => s.id === shareId);
    if (newShare) {
      setShareLink(newShare.link);
    }
  };
  
  const handleCopyLink = () => {
    // In a real app, you would copy to clipboard
    console.log("Copied link:", shareLink);
  };
  

  
  const handleShareViaWallet = () => {
    // In a real app, you would share via wallet
    console.log("Share via wallet:", shareLink);
  };
  
  if (!file) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Text style={styles.errorText}>File not found</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.fileInfo}>
        <FileIcon type={file.type} size={48} />
        <Text style={styles.fileName}>{file.name}</Text>
        <Text style={styles.fileSize}>{file.size}</Text>
      </View>
      
      <View style={styles.permissionSection}>
        <Text style={styles.sectionTitle}>Permissions</Text>
        <View style={styles.permissionToggle}>
          <Text style={styles.permissionLabel}>
            {isReadOnly ? "Read Only" : "Can Edit"}
          </Text>
          <Switch
            value={!isReadOnly}
            onValueChange={(value) => setIsReadOnly(!value)}
            trackColor={{ false: Colors.card, true: Colors.primary }}
            thumbColor={Colors.white}
          />
        </View>
        <Text style={styles.permissionDescription}>
          {isReadOnly
            ? "Recipients can only view this file"
            : "Recipients can edit this file"}
        </Text>
      </View>
      
      {shareLink ? (
        <View style={styles.linkSection}>
          <Text style={styles.sectionTitle}>Share Link</Text>
          <View style={styles.linkContainer}>
            <Text style={styles.link} numberOfLines={1}>
              {shareLink}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyLink}
            >
              <Copy size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.shareOptions}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleCopyLink}
            >
              <View style={styles.shareIconContainer}>
                <Copy size={24} color={Colors.primary} />
              </View>
              <Text style={styles.shareOptionText}>Copy Link</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleShareViaWallet}
            >
              <View style={styles.shareIconContainer}>
                <Share2 size={24} color={Colors.primary} />
              </View>
              <Text style={styles.shareOptionText}>Via Wallet</Text>
            </TouchableOpacity>
          </View>
          
          {existingShare && (
            <TouchableOpacity
              style={styles.revokeButton}
              onPress={() => {
                removeShare(existingShare.id);
                setShareLink("");
              }}
            >
              <Trash2 size={20} color={Colors.error} />
              <Text style={styles.revokeButtonText}>Revoke Access</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <Button
          title="Generate Share Link"
          onPress={handleCreateShare}
          style={styles.generateButton}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: theme.spacing.lg,
  },
  fileInfo: {
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  fileName: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginTop: theme.spacing.md,
    textAlign: "center",
  },
  fileSize: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: theme.spacing.xs,
  },
  permissionSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  permissionToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  permissionLabel: {
    fontSize: 16,
    color: Colors.white,
  },
  permissionDescription: {
    fontSize: 14,
    color: Colors.gray,
  },
  linkSection: {
    marginBottom: theme.spacing.xl,
  },
  linkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.md,
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
  shareOptions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: theme.spacing.lg,
  },
  shareOption: {
    alignItems: "center",
    width: "45%",
  },
  shareIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,191,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  shareOptionText: {
    fontSize: 14,
    color: Colors.white,
    textAlign: "center",
  },
  revokeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,67,54,0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  revokeButtonText: {
    fontSize: 16,
    color: Colors.error,
    marginLeft: theme.spacing.sm,
  },
  generateButton: {
    marginTop: theme.spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
});