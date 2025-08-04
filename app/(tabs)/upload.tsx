import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Platform, Dimensions, ScrollView } from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Upload, X, Check, FileText, Image as ImageIcon, Video, Archive, Cloud, Zap, Sparkles, Shield, Lock, Coins, Cpu } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";
import FileIcon from "@/components/FileIcon";
import { useFileStore } from "@/store/fileStore";
import { useUserStore } from "@/store/userStore";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from "react-native-reanimated";

const { width: screenWidth } = Dimensions.get('window');

interface SelectedFile {
  uri: string;
  name: string;
  size: number;
  type: string;
  mimeType?: string;
}

export default function UploadScreen() {
  const router = useRouter();
  const fileStore = useFileStore();
  const userStore = useUserStore();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(5);

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const rotateAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const progressAnim = useSharedValue(0);
  const completeAnim = useSharedValue(0);
  const sparkleAnim = useSharedValue(0);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Entrance animations
    fadeAnim.value = withTiming(1, { duration: 600 });
    scaleAnim.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) });
    
    // Sparkle animation
    sparkleAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (isUploading) {
      // Rotation animation during upload
      rotateAnim.value = withRepeat(
        withTiming(360, { duration: 2000, easing: Easing.linear }),
        -1,
        false
      );
      
      // Pulse animation
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    }
  }, [isUploading]);

  useEffect(() => {
    if (isComplete) {
      completeAnim.value = withTiming(1, { 
        duration: 800, 
        easing: Easing.out(Easing.back(1.5)) 
      });
      
      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/(tabs)");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      countdownRef.current = timer;
    }
    
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [isComplete, router]);

  const getFileType = (mimeType: string, name: string): "pdf" | "image" | "video" | "zip" | "default" => {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType?.includes("zip") || mimeType?.includes("archive")) return "zip";
    return "default";
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || `media_${Date.now()}`,
          size: asset.fileSize || 0,
          type: asset.type || "image",
          mimeType: asset.mimeType,
        });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          type: "document",
          mimeType: asset.mimeType,
        });
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadToDecentralizedStorage = async (file: SelectedFile): Promise<any> => {
    if (!userStore.blockId) {
      throw new Error("Block ID not found");
    }

    const pinataJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI3Yjk0NTNhNy1jNjFlLTRhNmUtYWFhMy02ODczODg1NmQzYzgiLCJlbWFpbCI6ImhlbGxvLnByYWtoYXIxNzlAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImM1NzBmYTk2NDcwNTdmOWRmYzc0Iiwic2NvcGVkS2V5U2VjcmV0IjoiZmRiMGQyN2RiYmU5NmE5YzNiNmY1ZDU1MzQ2ZDNmODNhYjNmYWVhYTU1MGUxNzcwZTUyMTc2YmRmMDI3YTU3ZiIsImV4cCI6MTc4MjE1NjczM30.mXk2sstP1TAv5Ssm8R4CIDa3ATaqTmDMQPzjFgyAioo";

    const pinataFormData = new FormData();
    
    const fileToUpload = {
      uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      type: file.mimeType || 'application/octet-stream',
      name: file.name,
    } as any;

    pinataFormData.append("file", fileToUpload);
    
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        block_id: userStore.blockId,
        file_type: file.mimeType || 'application/octet-stream',
        upload_timestamp: new Date().toISOString(),
      },
    });
    pinataFormData.append("pinataMetadata", metadata);
    
    const options = JSON.stringify({
      cidVersion: 0,
    });
    pinataFormData.append("pinataOptions", options);

    const updateProgress = (progress: number) => {
      setUploadProgress(progress);
      progressAnim.value = withTiming(progress, { duration: 200 });
    };

    updateProgress(0.1);

    try {
      const pinataResponse = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
        },
        body: pinataFormData,
      });

      updateProgress(0.6);

      if (!pinataResponse.ok) {
        const errorText = await pinataResponse.text();
        console.error("Storage error:", errorText);
        throw new Error(`Failed to upload to decentralized storage: ${errorText}`);
      }

      const pinataResult = await pinataResponse.json();
      console.log("Storage result:", pinataResult);
      
      const storageHash = pinataResult.IpfsHash;
      const pinSize = pinataResult.PinSize;
      const timestamp = pinataResult.Timestamp;
      const storageUrl = `https://indigo-urban-alpaca-627.mypinata.cloud/ipfs/${storageHash}`;

      updateProgress(0.8);

      const fileData = {
        block_id: userStore.blockId,
        filename: file.name,
        original_name: file.name,
        pinata_name: file.name,
        file_size: file.size,
        pin_size: pinSize || file.size,
        mime_type: file.mimeType || 'application/octet-stream',
        file_type: file.mimeType || 'application/octet-stream',
        ipfs_hash: storageHash,
        cid: storageHash,
        ipfs_url: storageUrl,
        pinata_id: null,
        status: "active",
        is_pinned: true,
        pinata_timestamp: timestamp ? new Date(timestamp).toISOString() : null,
        full_metadata: pinataResult,
        created_at: new Date().toISOString(),
      };

      const supabaseResponse = await fetch('.heaaden', {
        method: 'POST',
        headers: {
          'apikey': 'process.env.SUPABASE_ANON_KE ',
          'Authorization': 'process.env.SUPABASE_ANON_KE ',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(fileData)
      });

      updateProgress(0.95);

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("Database error:", errorText);
        throw new Error(`Failed to store file info: ${errorText}`);
      }

      const supabaseResult = await supabaseResponse.json();
      updateProgress(1.0);

      return {
        success: true,
        storageHash,
        storageUrl,
        fileId: supabaseResult[0]?.id,
        pinSize,
        timestamp
      };
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const result = await uploadToDecentralizedStorage(selectedFile);
      
      const fileType = getFileType(selectedFile.mimeType || "", selectedFile.name);
      fileStore.addFile({
        name: selectedFile.name,
        type: fileType,
        size: formatFileSize(selectedFile.size),
        sizeInBytes: selectedFile.size,
        folderId: null,
        url: result.storageUrl,
        isFolder: false,
        cid: result.storageHash,
        ipfsHash: result.storageHash,
        mimeType: selectedFile.mimeType,
      });
      
      setUploadedFileData(result);
      setIsUploading(false);
      setIsComplete(true);
      
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error instanceof Error ? error.message : "Unknown error occurred");
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    setIsComplete(false);
    setUploadedFileData(null);
    setCountdown(5);
  };

  const handleDone = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    router.push("/(tabs)");
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateAnim.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const completeStyle = useAnimatedStyle(() => ({
    opacity: completeAnim.value,
    transform: [{ scale: completeAnim.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sparkleAnim.value, [0, 0.5, 1], [0.3, 1, 0.3]),
    transform: [{ rotate: `${sparkleAnim.value * 360}deg` }],
  }));

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    const fileType = getFileType(selectedFile.mimeType || "", selectedFile.name);
    const isImage = fileType === "image";
    const isVideo = fileType === "video";

    return (
      <Animated.View style={[styles.filePreview, containerStyle]}>
        <View style={styles.previewContainer}>
          {isImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <LinearGradient
                    colors={["rgba(91, 77, 255, 0.95)", "rgba(0, 229, 255, 0.95)"]}
                    style={styles.overlayGradient}
                  >
                    <Animated.View style={[rotateStyle, pulseStyle]}>
                      <Cloud size={48} color={Colors.white} />
                    </Animated.View>
                    <Text style={styles.uploadingText}>Securing to blockchain...</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : isVideo ? (
            <View style={styles.videoContainer}>
              <View style={styles.videoPreview}>
                <Video size={80} color={Colors.primary} />
                <Text style={styles.videoLabel}>Video File</Text>
              </View>
              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <LinearGradient
                    colors={["rgba(91, 77, 255, 0.95)", "rgba(0, 229, 255, 0.95)"]}
                    style={styles.overlayGradient}
                  >
                    <Animated.View style={[rotateStyle, pulseStyle]}>
                      <Cloud size={48} color={Colors.white} />
                    </Animated.View>
                    <Text style={styles.uploadingText}>Securing to blockchain...</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.fileIconContainer}>
              <LinearGradient
                colors={["rgba(91, 77, 255, 0.1)", "rgba(0, 229, 255, 0.1)"]}
                style={styles.iconBackground}
              >
                <FileIcon type={fileType} size={80} />
                <Animated.View style={[styles.sparkleOverlay, sparkleStyle]}>
                  <Sparkles size={24} color={Colors.secondary} />
                </Animated.View>
              </LinearGradient>
              
              {isUploading && (
                <Animated.View style={[styles.uploadIndicator, pulseStyle]}>
                  <Shield size={32} color={Colors.primary} />
                </Animated.View>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.fileMetadata}>
          <Text style={styles.fileName} numberOfLines={2}>
            {selectedFile.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(selectedFile.size)}
          </Text>
          <Text style={styles.fileType}>
            {selectedFile.mimeType || "Unknown type"}
          </Text>
        </View>

        {!isUploading && !isComplete && (
          <View style={styles.uploadButtonContainer}>
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              style={styles.uploadButtonGradient}
            >
              <TouchableOpacity
                style={styles.uploadButtonTouch}
                onPress={handleUpload}
                activeOpacity={0.8}
              >
                <Shield size={20} color={Colors.white} />
                <Text style={styles.uploadButtonText}>Secure to Blockchain</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Encrypting & Distributing... {Math.round(uploadProgress * 100)}%
            </Text>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, progressStyle]} />
            </View>
            <View style={styles.securityFeatures}>
              <View style={styles.securityFeature}>
                <Lock size={14} color={Colors.success} />
                <Text style={styles.securityText}>Encrypted</Text>
              </View>
              <View style={styles.securityFeature}>
                <Cpu size={14} color={Colors.primary} />
                <Text style={styles.securityText}>Distributed</Text>
              </View>
              <View style={styles.securityFeature}>
                <Coins size={14} color={Colors.warning} />
                <Text style={styles.securityText}>Immutable</Text>
              </View>
            </View>
          </View>
        )}

        {isComplete && (
          <Animated.View style={[styles.completeContainer, completeStyle]}>
            <LinearGradient
              colors={[Colors.success, "#00E5FF"]}
              style={styles.completeIcon}
            >
              <Check size={32} color={Colors.white} />
            </LinearGradient>
            
            <Text style={styles.completeText}>Secured Successfully!</Text>
            <Text style={styles.completeSubtext}>
              Your file is now distributed across the decentralized network
            </Text>
            
            <View style={styles.countdownContainer}>
              <Text style={styles.countdownText}>
                Returning to home in {countdown}s
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload File</Text>
        {selectedFile && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelIcon}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        {!selectedFile ? (
          <Animated.View style={[styles.uploadOptions, containerStyle]}>
            <View style={styles.titleContainer}>
              <Animated.View style={sparkleStyle}>
                <Sparkles size={24} color={Colors.secondary} />
              </Animated.View>
              <Text style={styles.subtitle}>Select file to secure</Text>
              <Text style={styles.description}>
                Choose from your device to upload to the decentralized network
              </Text>
            </View>
            
            <View style={styles.optionCards}>
              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(91, 77, 255, 0.15)", "rgba(0, 229, 255, 0.15)"]}
                  style={styles.optionIconBg}
                >
                  <ImageIcon size={36} color={Colors.primary} />
                  <View style={styles.cryptoIndicator}>
                    <Shield size={16} color={Colors.success} />
                  </View>
                </LinearGradient>
                <Text style={styles.optionTitle}>Gallery</Text>
                <Text style={styles.optionDescription}>
                  Photos & Videos from your device
                </Text>
                <View style={styles.securityBadge}>
                  <Lock size={12} color={Colors.primary} />
                  <Text style={styles.securityBadgeText}>End-to-End Encrypted</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={pickDocument}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(0, 220, 130, 0.15)", "rgba(0, 229, 255, 0.15)"]}
                  style={styles.optionIconBg}
                >
                  <FileText size={36} color={Colors.success} />
                  <View style={styles.cryptoIndicator}>
                    <Cpu size={16} color={Colors.primary} />
                  </View>
                </LinearGradient>
                <Text style={styles.optionTitle}>Files</Text>
                <Text style={styles.optionDescription}>
                  Documents, PDFs & other files
                </Text>
                <View style={styles.securityBadge}>
                  <Coins size={12} color={Colors.warning} />
                  <Text style={styles.securityBadgeText}>Blockchain Verified</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.networkInfo}>
              <View style={styles.networkStats}>
                <View style={styles.networkStat}>
                  <Text style={styles.networkStatValue}>99.9%</Text>
                  <Text style={styles.networkStatLabel}>Uptime</Text>
                </View>
                <View style={styles.networkStat}>
                  <Text style={styles.networkStatValue}>847</Text>
                  <Text style={styles.networkStatLabel}>Active Nodes</Text>
                </View>
                <View style={styles.networkStat}>
                  <Text style={styles.networkStatValue}>256-bit</Text>
                  <Text style={styles.networkStatLabel}>Encryption</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : (
          renderFilePreview()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.card,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
  },
  cancelIcon: {
    padding: theme.spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: 120, // Extra padding for tab bar
  },
  uploadOptions: {
    flex: 1,
    justifyContent: "center",
    minHeight: 600,
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.xl * 1.5,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
  optionCards: {
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  optionCard: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.2)",
    position: "relative",
    ...Platform.select({
      android: {
        elevation: 4,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  optionIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    position: "relative",
  },
  cryptoIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.card,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.sm,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 16,
    gap: 4,
  },
  securityBadgeText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "500",
  },
  networkInfo: {
    backgroundColor: "rgba(91, 77, 255, 0.05)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  networkStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  networkStat: {
    alignItems: "center",
  },
  networkStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  networkStatLabel: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 2,
  },
  filePreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 600,
  },
  previewContainer: {
    position: "relative",
    marginBottom: theme.spacing.lg,
  },
  imageContainer: {
    position: "relative",
  },
  imagePreview: {
    width: 220,
    height: 220,
    borderRadius: theme.borderRadius.lg,
  },
  videoContainer: {
    position: "relative",
  },
  videoPreview: {
    width: 220,
    height: 220,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.2)",
  },
  videoLabel: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "500",
    marginTop: theme.spacing.sm,
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.lg,
    overflow: "hidden",
  },
  overlayGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginTop: theme.spacing.md,
  },
  fileIconContainer: {
    width: 220,
    height: 220,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 220,
    height: 220,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  sparkleOverlay: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  uploadIndicator: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(91, 77, 255, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  fileMetadata: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  fileName: {
    fontSize: 22,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  fileSize: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: theme.spacing.xs,
  },
  fileType: {
    fontSize: 14,
    color: Colors.gray,
  },
  uploadButtonContainer: {
    width: "100%",
    marginBottom: theme.spacing.lg,
  },
  uploadButtonGradient: {
    borderRadius: 25,
    padding: 2,
  },
  uploadButtonTouch: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 23,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: theme.spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  securityFeatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  securityFeature: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 12,
    gap: 4,
  },
  securityText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "500",
  },
  completeContainer: {
    alignItems: "center",
    width: "100%",
  },
  completeIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  completeText: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.success,
    marginBottom: theme.spacing.sm,
  },
  completeSubtext: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  countdownContainer: {
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.lg,
  },
  countdownText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "500",
  },
  doneButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: 25,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
  },
});