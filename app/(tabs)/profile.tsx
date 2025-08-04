import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Platform } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Copy, Bell, Shield, Info, LogOut, ChevronRight, AlertTriangle, FileText, Users } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Avatar from "@/components/Avatar";
import ToggleSwitch from "@/components/ToggleSwitch";
import { useUserStore } from "@/store/userStore";
import { useFileStore } from "@/store/fileStore";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    username,
    blockId,
    avatarUrl,
    notificationsEnabled,
    biometricsEnabled,
    pinEnabled,
    toggleNotifications,
    toggleBiometrics,
    togglePin,
    logout,
  } = useUserStore();
  
  const { clearFiles } = useFileStore();
  const [shareId, setShareId] = React.useState("");
  const [showCopyBlockSuccess, setShowCopyBlockSuccess] = React.useState(false);
  const [showCopyShareSuccess, setShowCopyShareSuccess] = React.useState(false);

  React.useEffect(() => {
    const fetchShareId = async () => {
      if (!blockId) return;
      
      try {
        const response = await fetch(`https://jrdauvpldrfybetybrox.supabase.co/rest/v1/share_ids?block_id=eq.${encodeURIComponent(blockId)}&select=share_id`, {
          headers: {
            'apikey': '.Hidden',
            'Authorization': ' Bearer .Hidden',
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setShareId(data[0].share_id);
          }
        }
      } catch (error) {
        console.error('Error fetching Share ID:', error);
      }
    };

    fetchShareId();
  }, [blockId]);

  const handleCopyBlockId = async () => {
    if (!blockId) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(blockId);
        setShowCopyBlockSuccess(true);
        setTimeout(() => setShowCopyBlockSuccess(false), 2000);
      } else {
        // For mobile, show alert with the ID
        Alert.alert(
          "Block ID", 
          blockId, 
          [
            { 
              text: "OK", 
              onPress: () => {
                setShowCopyBlockSuccess(true);
                setTimeout(() => setShowCopyBlockSuccess(false), 2000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error copying Block ID:", error);
      Alert.alert("Block ID", blockId);
    }
  };

  const handleCopyShareId = async () => {
    if (!shareId) return;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(shareId);
        setShowCopyShareSuccess(true);
        setTimeout(() => setShowCopyShareSuccess(false), 2000);
      } else {
        // For mobile, show alert with the ID
        Alert.alert(
          "Share ID", 
          shareId, 
          [
            { 
              text: "OK", 
              onPress: () => {
                setShowCopyShareSuccess(true);
                setTimeout(() => setShowCopyShareSuccess(false), 2000);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error copying Share ID:", error);
      Alert.alert("Share ID", shareId);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            logout();
            clearFiles();
            router.replace("/");
          }
        }
      ]
    );
  };

  const maskId = (id: string) => {
    if (!id) return "";
    return id.length > 10 ? `${id.substring(0, 3)}..${id.substring(id.length - 2)}` : id;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.profileHeader}>
          <Avatar uri={avatarUrl ?? undefined} name={username} size={80} />
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{username}</Text>
            <View style={styles.idContainer}>
              <Text style={styles.idAddress}>
                {maskId(blockId)}
              </Text>
              <TouchableOpacity onPress={handleCopyBlockId} style={styles.copyButton}>
                <Copy size={16} color={Colors.gray} />
              </TouchableOpacity>
            </View>
            <Text style={styles.idLabel}>Block ID</Text>
            {showCopyBlockSuccess && (
              <Text style={styles.copySuccess}>Block ID copied!</Text>
            )}
          </View>
        </View>

        {/* Security Warning */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <AlertTriangle size={20} color={Colors.warning} />
            <Text style={styles.warningTitle}>Security Notice</Text>
          </View>
          <Text style={styles.warningText}>
            Your Block ID is like a private key. Sharing it can cause unauthorized access to your files. 
            Keep it safe and secure. Losing it means you won't be able to access your files. 
            SolBox doesn't store your Block ID - only you have access to it.
          </Text>
        </View>

        {shareId.length > 0 && (
          <View style={styles.shareIdSection}>
            <Text style={styles.sectionTitle}>Share ID</Text>
            <View style={styles.shareIdCard}>
              <View style={styles.shareIdHeader}>
                <Text style={styles.shareIdTitle}>Your Share ID</Text>
                <TouchableOpacity onPress={handleCopyShareId} style={styles.copyIconButton}>
                  <Copy size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.shareIdText}>{maskId(shareId)}</Text>
              <Text style={styles.shareIdDescription}>
                Share this ID with others so they can send you files directly
              </Text>
              {showCopyShareSuccess && (
                <Text style={styles.copySuccess}>Share ID copied!</Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Bell size={20} color={Colors.primary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <ToggleSwitch
              value={notificationsEnabled}
              onToggle={toggleNotifications}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
            </View>
            <ToggleSwitch value={biometricsEnabled} onToggle={toggleBiometrics} />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Shield size={20} color={Colors.primary} />
              <Text style={styles.settingLabel}>PIN Lock</Text>
            </View>
            <ToggleSwitch value={pinEnabled} onToggle={togglePin} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Info size={20} color={Colors.primary} />
              <Text style={styles.menuItemLabel}>About SolBox</Text>
            </View>
            <ChevronRight size={20} color={Colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <FileText size={20} color={Colors.primary} />
              <Text style={styles.menuItemLabel}>Read Documents</Text>
            </View>
            <ChevronRight size={20} color={Colors.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Users size={20} color={Colors.primary} />
              <Text style={styles.menuItemLabel}>Connect with Community</Text>
            </View>
            <ChevronRight size={20} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  profileInfo: {
    marginLeft: theme.spacing.lg,
  },
  username: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
    marginBottom: theme.spacing.xs,
  },
  idContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  idAddress: {
    fontSize: 14,
    color: Colors.primary,
    marginRight: theme.spacing.xs,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
  },
  copyButton: {
    padding: 4,
  },
  idLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  copySuccess: {
    fontSize: 12,
    color: Colors.success,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 193, 7, 0.2)",
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.warning,
    marginLeft: theme.spacing.sm,
  },
  warningText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 20,
    opacity: 0.9,
  },
  shareIdSection: {
    marginBottom: theme.spacing.xl,
  },
  shareIdCard: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  shareIdHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  shareIdTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  copyIconButton: {
    padding: theme.spacing.xs,
    borderRadius: 4,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
  },
  shareIdText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      default: 'monospace'
    }),
    marginBottom: theme.spacing.sm,
  },
  shareIdDescription: {
    fontSize: 12,
    color: Colors.gray,
    lineHeight: 16,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
    }),
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: theme.spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
    ...Platform.select({
      android: {
        elevation: 1,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
    }),
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: theme.spacing.md,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(244,67,54,0.1)",
    borderRadius: 25,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.2)",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
    }),
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.error,
    marginLeft: theme.spacing.sm,
  },
});