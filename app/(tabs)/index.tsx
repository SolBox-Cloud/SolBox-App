import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Dimensions, Image, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { 
  Upload, Share2, TrendingUp, Shield, 
  Link2, FileText, Image as ImageIcon, Video, 
  Activity, Server, Lock, Download, Trash, 
  Zap, Users, Globe, Eye, Clock, BarChart3,
  Cpu, HardDrive, Wifi, ArrowUpRight, Sparkles,
  Radio, Pause, Network, Folder, Search, Filter,
  Star, MoreHorizontal, Calendar, PieChart, Play,
  Check, ArrowDown, ExternalLink
} from "lucide-react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  interpolate,
  Easing,
  withRepeat,
  withSequence
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Logo from "@/components/Logo";
import Avatar from "@/components/Avatar";
import { useFileStore, dummyFile } from "@/store/fileStore";
import { useUserStore } from "@/store/userStore";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { files, usedStorage, totalStorage } = useFileStore();
  const { username, avatarUrl, blockId } = useUserStore();

  // Animation values
  const headerOpacity = useSharedValue(0);
  const storageOpacity = useSharedValue(0);
  const networkOpacity = useSharedValue(0);
  const fileStatsOpacity = useSharedValue(0);
  const recentOpacity = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  
  // Progress animation
  const progressValue = useSharedValue(0);
  
  // Download animation states
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());
  const [downloadedFiles, setDownloadedFiles] = useState<Set<string>>(new Set());
  const downloadProgress = useSharedValue(0);
  const downloadScale = useSharedValue(1);
  const successScale = useSharedValue(0);

  useEffect(() => {
    // Staggered entrance animations
    headerOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) });
    networkOpacity.value = withDelay(100, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    storageOpacity.value = withDelay(200, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    fileStatsOpacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    recentOpacity.value = withDelay(400, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
    
    // Animate progress bar
    const usedStoragePercentage = usedStorage / totalStorage;
    progressValue.value = withTiming(usedStoragePercentage, { 
      duration: 1000, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });

    // Pulse animation for live indicators
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const usedStoragePercentage = usedStorage / totalStorage;
  const usedStorageFormatted = (usedStorage / (1024 * 1024)).toFixed(1);
  const totalStorageFormatted = (totalStorage / (1024 * 1024 * 1024)).toFixed(0);

  const handleShareFile = (file: any) => {
    router.push(`/share?id=${file.id}`);
  };

  const handleDownloadFile = async (file: any) => {
    if (downloadingFiles.has(file.id) || downloadedFiles.has(file.id)) {
      return;
    }

    // Start download animation
    setDownloadingFiles(prev => new Set([...prev, file.id]));
    downloadScale.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Simulate download progress
    downloadProgress.value = 0;
    downloadProgress.value = withTiming(1, { 
      duration: 2000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    // Simulate download completion
    setTimeout(() => {
      setDownloadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      
      setDownloadedFiles(prev => new Set([...prev, file.id]));
      
      // Success animation
      successScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );

      // Show success popup
      Alert.alert(
        "Download Complete",
        `${file.name} has been downloaded successfully!`,
        [
          {
            text: "Great!",
            style: "default"
          }
        ],
        { cancelable: true }
      );

      // Reset downloaded state after 3 seconds
      setTimeout(() => {
        setDownloadedFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(file.id);
          return newSet;
        });
        successScale.value = 0;
      }, 3000);
    }, 2000);
  };

  const formatShortId = (id: string) => {
    if (!id || id.length < 6) return id;
    return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Calculate file type distribution
  const getFileTypeStats = () => {
    const stats = { images: 0, videos: 0, documents: 0, others: 0 };
    files.forEach(file => {
      switch (file.type) {
        case 'image': stats.images++; break;
        case 'video': stats.videos++; break;
        case 'pdf': stats.documents++; break;
        default: stats.others++; break;
      }
    });
    return stats;
  };

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ 
      translateY: interpolate(headerOpacity.value, [0, 1], [-20, 0]) 
    }]
  }));

  const networkStyle = useAnimatedStyle(() => ({
    opacity: networkOpacity.value,
    transform: [{ 
      translateY: interpolate(networkOpacity.value, [0, 1], [20, 0]) 
    }]
  }));

  const storageStyle = useAnimatedStyle(() => ({
    opacity: storageOpacity.value,
    transform: [{ 
      translateY: interpolate(storageOpacity.value, [0, 1], [20, 0]) 
    }]
  }));

  const fileStatsStyle = useAnimatedStyle(() => ({
    opacity: fileStatsOpacity.value,
    transform: [{ 
      translateY: interpolate(fileStatsOpacity.value, [0, 1], [20, 0]) 
    }]
  }));

  const recentStyle = useAnimatedStyle(() => ({
    opacity: recentOpacity.value,
    transform: [{ 
      translateY: interpolate(recentOpacity.value, [0, 1], [20, 0]) 
    }]
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
  }));

  const downloadScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: downloadScale.value }]
  }));

  const successScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successScale.value }],
    opacity: successScale.value
  }));

  const downloadProgressStyle = useAnimatedStyle(() => ({
    width: `${downloadProgress.value * 100}%`
  }));

  const renderNetworkStatus = () => (
    <Animated.View style={[styles.networkCard, networkStyle]}>
      <View style={styles.networkHeader}>
        <View style={styles.networkIconContainer}>
          <Animated.View style={pulseStyle}>
            <Wifi size={20} color={Colors.success} />
          </Animated.View>
        </View>
        <Text style={styles.networkTitle}>Network Status</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>LIVE</Text>
        </View>
      </View>

      <View style={styles.networkStats}>
        <View style={styles.networkStat}>
          <Text style={styles.networkStatValue}>847</Text>
          <Text style={styles.networkStatLabel}>Active Nodes</Text>
        </View>
        <View style={styles.networkStat}>
          <Text style={styles.networkStatValue}>2.1s</Text>
          <Text style={styles.networkStatLabel}>Avg Response</Text>
        </View>
        <View style={styles.networkStat}>
          <Text style={styles.networkStatValue}>99.9%</Text>
          <Text style={styles.networkStatLabel}>Uptime</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderStorageVisualization = () => (
    <Animated.View style={[styles.storageCard, storageStyle]}>
      <View style={styles.storageHeader}>
        <View style={styles.storageIconContainer}>
          <Shield size={24} color={Colors.primary} />
        </View>
        <View style={styles.storageInfo}>
          <Text style={styles.storageTitle}>Decentralized Storage</Text>
          <Text style={styles.storageSubtitle}>
            {usedStorageFormatted} MB of {totalStorageFormatted} GB used
          </Text>
        </View>
        <Text style={styles.storagePercentage}>
          {Math.round(usedStoragePercentage * 100)}%
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, progressStyle]} />
        </View>
      </View>

      <View style={styles.storageFeatures}>
        <View style={styles.feature}>
          <Lock size={16} color={Colors.primary} />
          <Text style={styles.featureText}>Encrypted</Text>
        </View>
        <View style={styles.feature}>
          <Server size={16} color={Colors.primary} />
          <Text style={styles.featureText}>Distributed</Text>
        </View>
        <View style={styles.feature}>
          <Link2 size={16} color={Colors.primary} />
          <Text style={styles.featureText}>Immutable</Text>
        </View>
      </View>
    </Animated.View>
  );

  const renderFileManagement = () => {
    const fileStats = getFileTypeStats();
    const totalFiles = files.length;

    return (
      <Animated.View style={[styles.fileManagementContainer, fileStatsStyle]}>
        <View style={styles.fileManagementHeader}>
          <Text style={styles.sectionTitle}>File Management</Text>
          <TouchableOpacity onPress={() => router.push("/files")}>
            <MoreHorizontal size={20} color={Colors.gray} />
          </TouchableOpacity>
        </View>

        {/* File Type Distribution */}
        <View style={styles.fileStatsCard}>
          <View style={styles.fileStatsHeader}>
            <PieChart size={20} color={Colors.primary} />
            <Text style={styles.fileStatsTitle}>File Distribution</Text>
            <Text style={styles.totalFilesCount}>{totalFiles} files</Text>
          </View>
          
          <View style={styles.fileTypeGrid}>
            <View style={styles.fileTypeItem}>
              <View style={[styles.fileTypeIcon, { backgroundColor: "rgba(91, 77, 255, 0.1)" }]}>
                <ImageIcon size={20} color={Colors.primary} />
              </View>
              <Text style={styles.fileTypeCount}>{fileStats.images}</Text>
              <Text style={styles.fileTypeLabel}>Images</Text>
            </View>
            
            <View style={styles.fileTypeItem}>
              <View style={[styles.fileTypeIcon, { backgroundColor: "rgba(0, 220, 130, 0.1)" }]}>
                <Video size={20} color={Colors.success} />
              </View>
              <Text style={styles.fileTypeCount}>{fileStats.videos}</Text>
              <Text style={styles.fileTypeLabel}>Videos</Text>
            </View>
            
            <View style={styles.fileTypeItem}>
              <View style={[styles.fileTypeIcon, { backgroundColor: "rgba(0, 229, 255, 0.1)" }]}>
                <FileText size={20} color={Colors.secondary} />
              </View>
              <Text style={styles.fileTypeCount}>{fileStats.documents}</Text>
              <Text style={styles.fileTypeLabel}>Docs</Text>
            </View>
            
            <View style={styles.fileTypeItem}>
              <View style={[styles.fileTypeIcon, { backgroundColor: "rgba(255, 193, 7, 0.1)" }]}>
                <HardDrive size={20} color={Colors.warning} />
              </View>
              <Text style={styles.fileTypeCount}>{fileStats.others}</Text>
              <Text style={styles.fileTypeLabel}>Others</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderRecentActivity = () => {
    const hasRealFiles = files.length > 0;
    const filesToShow = hasRealFiles ? files.slice(0, 3) : [dummyFile];

    return (
      <Animated.View style={[styles.recentContainer, recentStyle]}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Files</Text>
          {hasRealFiles && (
            <TouchableOpacity onPress={() => router.push("/files")}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          )}
        </View>

        {filesToShow.map((file, index) => (
          <View
            key={file.id}
            style={[
              styles.activityItemCard,
              !hasRealFiles && styles.dummyActivityItem,
            ]}
          >
            <View style={styles.activityTopRow}>
              <View style={styles.activityIconCard}>
                {file.type === "video" ? (
                  <Video size={20} color={hasRealFiles ? Colors.primary : Colors.darkGray} />
                ) : file.type === "image" ? (
                  <ImageIcon size={20} color={hasRealFiles ? Colors.primary : Colors.darkGray} />
                ) : (
                  <FileText size={20} color={hasRealFiles ? Colors.primary : Colors.darkGray} />
                )}
              </View>
              
              <View style={styles.fileInfoContainer}>
                <View style={styles.fileNameRow}>
                  <Text style={[
                    styles.activityTitle,
                    !hasRealFiles && styles.dummyText
                  ]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  {hasRealFiles && (
                    <View style={styles.activityActions}>
                      <TouchableOpacity
                        style={[styles.activityAction, styles.shareAction]}
                        onPress={() => handleShareFile(file)}
                        activeOpacity={0.7}
                      >
                        <ExternalLink size={14} color={Colors.white} strokeWidth={2} />
                      </TouchableOpacity>
                      
                      <Animated.View style={downloadScaleStyle}>
                        <TouchableOpacity
                          style={[
                            styles.activityAction, 
                            downloadingFiles.has(file.id) ? styles.downloadingAction :
                            downloadedFiles.has(file.id) ? styles.downloadedAction :
                            styles.downloadAction
                          ]}
                          onPress={() => handleDownloadFile(file)}
                          activeOpacity={0.7}
                          disabled={downloadingFiles.has(file.id) || downloadedFiles.has(file.id)}
                        >
                          {downloadingFiles.has(file.id) ? (
                            <View style={styles.downloadProgressContainer}>
                              <View style={styles.downloadProgressTrack}>
                                <Animated.View style={[styles.downloadProgressFill, downloadProgressStyle]} />
                              </View>
                              <ArrowDown size={12} color={Colors.white} strokeWidth={2} />
                            </View>
                          ) : downloadedFiles.has(file.id) ? (
                            <Animated.View style={successScaleStyle}>
                              <Check size={14} color={Colors.white} strokeWidth={2.5} />
                            </Animated.View>
                          ) : (
                            <ArrowDown size={14} color={Colors.white} strokeWidth={2} />
                          )}
                        </TouchableOpacity>
                      </Animated.View>
                      
                      <TouchableOpacity
                        style={[styles.activityAction, styles.deleteAction]}
                        onPress={() => {}}
                        activeOpacity={0.7}
                      >
                        <Trash size={14} color={Colors.white} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <View style={styles.fileMetaRow}>
                  <Text style={[
                    styles.activitySubtitle,
                    !hasRealFiles && styles.dummyText
                  ]}>
                    {file.size}
                  </Text>
                  <Text style={[
                    styles.fileDate,
                    !hasRealFiles && styles.dummyText
                  ]}>
                    {hasRealFiles ? formatDate(file.modifiedDate) : "01/01/25"}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={styles.previewContainer}>
              {file.type === "image" && hasRealFiles ? (
                <Image 
                  source={{ uri: file.url }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : file.type === "video" && hasRealFiles ? (
                <View style={styles.videoPreviewContainer}>
                  <View style={styles.videoThumbnail}>
                    <Play size={32} color={Colors.white} fill={Colors.white} />
                  </View>
                </View>
              ) : file.type === "image" && !hasRealFiles ? (
                <Image 
                  source={{ uri: "image-.png" }} 
                  style={styles.dummyPreviewImage}
                  resizeMode="cover"
                />
              ) : file.type === "video" && !hasRealFiles ? (
                <View style={styles.dummyVideoPreview}>
                  <Play size={24} color={Colors.darkGray} />
                </View>
              ) : null}
            </View>
          </View>
        ))}

        {!hasRealFiles && (
          <View style={styles.emptyStateHint}>
            <Text style={styles.emptyStateText}>
              Upload your first file to see real activity
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <View style={styles.headerLeft}>
            <Logo size={36} />
            <View style={styles.headerInfo}>
              <Text style={styles.welcomeText}>Welcome back</Text>
              <Text style={styles.blockIdText}>
                {formatShortId(blockId)}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Avatar uri={avatarUrl ?? undefined} name={username} size={44} />
          </TouchableOpacity>
        </Animated.View>

        {/* Network Status */}
        {renderNetworkStatus()}

        {/* Storage Visualization */}
        {renderStorageVisualization()}

        {/* File Management */}
        {renderFileManagement()}

        {/* Recent Files */}
        {renderRecentActivity()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    marginLeft: theme.spacing.md,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.white,
  },
  blockIdText: {
    fontSize: 12,
    color: Colors.gray,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  networkCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "#1A1B22",
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  networkHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  networkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 220, 130, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  networkTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
  networkStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  networkStat: {
    alignItems: "center",
  },
  networkStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
  },
  networkStatLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  storageCard: {
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "#1A1B22",
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  storageHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  storageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  storageInfo: {
    flex: 1,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  storageSubtitle: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  storagePercentage: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.primary,
  },
  progressContainer: {
    marginBottom: theme.spacing.lg,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  storageFeatures: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.white,
    marginLeft: 4,
  },
  fileManagementContainer: {
    marginBottom: theme.spacing.xl,
  },
  fileManagementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.white,
  },
  fileStatsCard: {
    backgroundColor: "#1A1B22",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  fileStatsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  fileStatsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  totalFilesCount: {
    fontSize: 14,
    color: Colors.gray,
  },
  fileTypeGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fileTypeItem: {
    alignItems: "center",
    flex: 1,
  },
  fileTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  fileTypeCount: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 2,
  },
  fileTypeLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  recentContainer: {
    marginBottom: theme.spacing.xl,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  activityItemCard: {
    flexDirection: "column",
    alignItems: "stretch",
    backgroundColor: "#1A1B22",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.05)",
  },
  dummyActivityItem: {
    opacity: 0.6,
  },
  activityTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  activityIconCard: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
    overflow: 'hidden',
  },
  fileInfoContainer: {
    flex: 1,
  },
  fileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.white,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  activityActions: {
    flexDirection: "row",
    gap: 6,
  },
  activityAction: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  shareAction: {
    backgroundColor: "#00E5FF",
  },
  downloadAction: {
    backgroundColor: Colors.primary,
  },
  downloadingAction: {
    backgroundColor: "#FF9500",
  },
  downloadedAction: {
    backgroundColor: Colors.success,
  },
  deleteAction: {
    backgroundColor: "#FF3B30",
  },
  downloadProgressContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  downloadProgressTrack: {
    position: "absolute",
    top: -2,
    left: -10,
    right: -10,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 1,
  },
  downloadProgressFill: {
    height: "100%",
    backgroundColor: Colors.white,
    borderRadius: 1,
  },
  fileMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activitySubtitle: {
    fontSize: 12,
    color: Colors.gray,
  },
  fileDate: {
    fontSize: 12,
    color: Colors.gray,
  },
  dummyText: {
    color: Colors.darkGray,
  },
  previewContainer: {
    width: '100%',
    height: 120,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  videoPreviewContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  videoThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(91, 77, 255, 0.2)",
    alignItems: 'center',
    justifyContent: 'center',
  },
  dummyPreviewImage: {
    width: '100%',
    height: '100%',
  },
  dummyVideoPreview: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.darkGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateHint: {
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
    backgroundColor: "rgba(91, 77, 255, 0.05)",
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 13,
    color: Colors.gray,
    fontStyle: "italic",
  },
});