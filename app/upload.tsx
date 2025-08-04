import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, Platform, Dimensions } from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Upload, X, Check, FileText, Image as ImageIcon, Video, Archive, Cloud, Zap, Sparkles } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";
import FileIcon from "@/components/FileIcon";
import { useFileStore } from "@/store/fileStore";
import { useUserStore } from "@/store/userStore";
import { LinearGradient } from "expo-linear-gradient";

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
  const { addFile } = useFileStore();
  const { blockId } = useUserStore();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [uploadedFileData, setUploadedFileData] = useState<any>(null);

  const getFileType = (mimeType: string, name: string): "pdf" | "image" | "video" | "zip" | "default" => {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType?.includes("zip") || mimeType?.includes("archive")) return "zip";
    return "default";
  };

  const pickImage = async () => {
    try {
      // Request permissions first
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

  const uploadToIPFS = async (file: SelectedFile): Promise<any> => {
    if (!blockId) {
      throw new Error("Block ID not found");
    }

    // Pinata JWT token
    const pinataJwt = "process.env._ANON_KEY";

    const pinataFormData = new FormData();
    
    // Create file object for React Native FormData with Android compatibility
    const fileToUpload = {
      uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      type: file.mimeType || 'application/octet-stream',
      name: file.name,
    } as any;

    pinataFormData.append("file", fileToUpload);
    
    // Add metadata using the older API format
    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        block_id: blockId,
        file_type: file.mimeType || 'application/octet-stream',
        upload_timestamp: new Date().toISOString(),
      },
    });
    pinataFormData.append("pinataMetadata", metadata);
    
    // Add options using the older API format
    const options = JSON.stringify({
      cidVersion: 0,
    });
    pinataFormData.append("pinataOptions", options);

    // Update progress during upload
    const updateProgress = (progress: number) => {
      setUploadProgress(progress);
    };

    updateProgress(0.1);

    try {
      // Use the older, more stable Pinata API endpoint
      const pinataResponse = await fetch("https://api.SOLBOX.cloud", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${pinataJwt}`,
          // Do not set Content-Type manually for FormData in React Native
        },
        body: pinataFormData,
      });

      updateProgress(0.6);

      if (!pinataResponse.ok) {
        const errorText = await pinataResponse.text();
        console.error("Pinata error:", errorText);
        throw new Error(`Failed to upload to IPFS: ${errorText}`);
      }

      const pinataResult = await pinataResponse.json();
      console.log("Pinata result:", pinataResult);
      
      // Handle older API response structure
      const ipfsHash = pinataResult.IpfsHash;
      const pinSize = pinataResult.PinSize;
      const timestamp = pinataResult.Timestamp;
      const ipfsUrl = `https://solbox.cloud/ipfs/${ipfsHash}`;

      updateProgress(0.8);

      // Store in Supabase
      const fileData = {
        block_id: blockId,
        filename: file.name,
        original_name: file.name,
        pinata_name: file.name,
        file_size: file.size,
        pin_size: pinSize || file.size,
        mime_type: file.mimeType || 'application/octet-stream',
        file_type: file.mimeType || 'application/octet-stream',
        ipfs_hash: ipfsHash,
        cid: ipfsHash,
        ipfs_url: ipfsUrl,
        pinata_id: null,
        status: "active",
        is_pinned: true,
        pinata_timestamp: timestamp ? new Date(timestamp).toISOString() : null,
        full_metadata: pinataResult,
        created_at: new Date().toISOString(),
      };

      console.log("Saving to Supabase:", fileData);

      const supabaseResponse = await fetch('https://solbox.supabase.co/rest/v1/ipfs_files', {
        method: 'POST',
        headers: {
          'apikey': 'process.env._ANON_KEY',
          'Authorization': 'Bearer process.env._ANON_KEY',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(fileData)
      });

      updateProgress(0.95);

      if (!supabaseResponse.ok) {
        const errorText = await supabaseResponse.text();
        console.error("Supabase error:", errorText);
        throw new Error(`Failed to store file info: ${errorText}`);
      }

      const supabaseResult = await supabaseResponse.json();
      console.log("Supabase result:", supabaseResult);

      updateProgress(1.0);

      return {
        success: true,
        ipfsHash,
        ipfsUrl,
        fileId: supabaseResult[0]?.id,
        pinSize,
        timestamp
      };
    } catch (error) {
      console.error("Upload to IPFS error:", error);
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    
    try {
      const result = await uploadToIPFS(selectedFile);
      
      // Add file to local store
      const fileType = getFileType(selectedFile.mimeType || "", selectedFile.name);
      addFile({
        name: selectedFile.name,
        type: fileType,
        size: formatFileSize(selectedFile.size),
        sizeInBytes: selectedFile.size,
        folderId: null,
        url: result.ipfsUrl,
        isFolder: false,
        cid: result.ipfsHash,
        ipfsHash: result.ipfsHash,
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
    if (isUploading) {
      setIsUploading(false);
    }
    router.back();
  };

  const handleDone = () => {
    router.back();
  };

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    const fileType = getFileType(selectedFile.mimeType || "", selectedFile.name);
    const isImage = fileType === "image";

    return (
      <View style={styles.filePreview}>
        <View style={styles.previewContainer}>
          {isImage ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.imagePreview}
                resizeMode="cover"
                onError={(error) => {
                  console.log("Image load error:", error.nativeEvent.error);
                }}
              />
              {isUploading && (
                <View style={styles.uploadOverlay}>
                  <LinearGradient
                    colors={["rgba(91, 77, 255, 0.9)", "rgba(0, 229, 255, 0.9)"]}
                    style={styles.overlayGradient}
                  >
                    <Cloud size={48} color={Colors.white} />
                    <Text style={styles.uploadingText}>Uploading to IPFS...</Text>
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
              </LinearGradient>
              
              {isUploading && (
                <View style={styles.uploadIndicator}>
                  <Cloud size={32} color={Colors.primary} />
                </View>
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

        {isUploading && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              Uploading to IPFS... {Math.round(uploadProgress * 100)}%
            </Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${uploadProgress * 100}%` }]} />
            </View>
          </View>
        )}

        {isComplete && (
          <View style={styles.completeContainer}>
            <LinearGradient
              colors={[Colors.success, "#00E5FF"]}
              style={styles.completeIcon}
            >
              <Check size={32} color={Colors.white} />
            </LinearGradient>
            
            <Text style={styles.completeText}>Uploaded to IPFS!</Text>
            {uploadedFileData?.ipfsHash && (
              <Text style={styles.completeSubtext}>
                CID: {uploadedFileData.ipfsHash.substring(0, 12)}...
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        {!selectedFile ? (
          <View style={styles.uploadOptions}>
            <Text style={styles.title}>Select a file to upload</Text>
            
            <View style={styles.optionCards}>
              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(91, 77, 255, 0.1)", "rgba(0, 229, 255, 0.1)"]}
                  style={styles.optionIconBg}
                >
                  <ImageIcon size={32} color={Colors.primary} />
                </LinearGradient>
                <Text style={styles.optionTitle}>Photos & Videos</Text>
                <Text style={styles.optionDescription}>
                  Select from your gallery
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionCard} 
                onPress={pickDocument}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["rgba(0, 220, 130, 0.1)", "rgba(0, 229, 255, 0.1)"]}
                  style={styles.optionIconBg}
                >
                  <FileText size={32} color={Colors.success} />
                </LinearGradient>
                <Text style={styles.optionTitle}>Documents</Text>
                <Text style={styles.optionDescription}>
                  PDFs, text files, and more
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.browseButton} 
              onPress={pickDocument}
              activeOpacity={0.8}
            >
              <Upload size={20} color={Colors.primary} />
              <Text style={styles.browseButtonText}>Browse All Files</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderFilePreview()
        )}
      </View>

      <View style={styles.footer}>
        {!isComplete ? (
          <>
            <Button
              title="Cancel"
              onPress={handleCancel}
              variant="text"
              style={styles.cancelButton}
            />
            <Button
              title={isUploading ? "Uploading..." : "Upload to IPFS"}
              onPress={handleUpload}
              disabled={!selectedFile || isUploading}
              style={styles.uploadButton}
            />
          </>
        ) : (
          <Button
            title="Done"
            onPress={handleDone}
            style={styles.doneButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.white,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  uploadOptions: {
    flex: 1,
    justifyContent: "center",
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
    borderColor: "rgba(91, 77, 255, 0.1)",
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
  optionIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: theme.spacing.sm,
  },
  optionDescription: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: "center",
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.primary,
    marginLeft: theme.spacing.sm,
  },
  filePreview: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  previewContainer: {
    position: "relative",
    marginBottom: theme.spacing.lg,
  },
  imageContainer: {
    position: "relative",
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.lg,
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
    fontSize: 14,
    fontWeight: "500",
    marginTop: theme.spacing.sm,
  },
  fileIconContainer: {
    width: 200,
    height: 200,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBackground: {
    width: 200,
    height: 200,
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
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
    marginBottom: theme.spacing.xl,
  },
  fileName: {
    fontSize: 20,
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
  progressContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "500",
    color: Colors.white,
    marginBottom: theme.spacing.md,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: Colors.card,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  completeContainer: {
    alignItems: "center",
    position: "relative",
  },
  completeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  completeText: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.success,
    marginBottom: theme.spacing.xs,
  },
  completeSubtext: {
    fontSize: 14,
    color: Colors.gray,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  footer: {
    flexDirection: "row",
    padding: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.card,
    gap: theme.spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  uploadButton: {
    flex: 2,
  },
  doneButton: {
    flex: 1,
  },
});