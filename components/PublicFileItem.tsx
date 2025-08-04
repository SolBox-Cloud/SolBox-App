import { StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Eye, Heart, Download, ExternalLink, ChevronDown, ChevronUp } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import FileIcon from "./FileIcon";
import { PublicBlockchainFile, formatFileSize, formatDate, getFilePreviewUrl, isPreviewableFile, usePublicFileStore } from "@/store/publicFileStore";

interface PublicFileItemProps {
  file: PublicBlockchainFile;
  onPress: () => void;
  onExpand?: (file: PublicBlockchainFile) => void;
}

export default function PublicFileItem({
  file,
  onPress,
  onExpand,
}: PublicFileItemProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const { incrementLikes, downloadFile, isFileLiked, isFileDownloading } = usePublicFileStore();
  const previewUrl = getFilePreviewUrl(file);
  const isPreviewable = isPreviewableFile(file.file_type);
  const isLiked = isFileLiked(file.file_id);
  const isDownloading = isFileDownloading(file.file_id);
  
  const getFileTypeForIcon = (mimeType: string): "pdf" | "image" | "video" | "zip" | "default" => {
    const type = mimeType.toLowerCase();
    if (type.startsWith("image/")) return "image";
    if (type.startsWith("video/")) return "video";
    if (type.includes("pdf")) return "pdf";
    if (type.includes("zip") || type.includes("archive")) return "zip";
    return "default";
  };

  const formatTransactionSignature = (signature: string, full: boolean = false) => {
    if (full || signature.length <= 12) return signature;
    return `${signature.substring(0, 6)}...${signature.substring(signature.length - 6)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    console.log('Formatting timestamp:', timestamp, 'type:', typeof timestamp);
    
    // Handle different timestamp formats
    let dateValue: number;
    
    // Convert to number if it's a string
    const numTimestamp = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
    
    if (numTimestamp > 9999999999) {
      // Already in milliseconds (13 digits)
      dateValue = numTimestamp;
      console.log('Using milliseconds timestamp:', dateValue);
    } else if (numTimestamp > 1000000000) {
      // Unix timestamp in seconds (10 digits), convert to milliseconds
      dateValue = numTimestamp * 1000;
      console.log('Converting seconds to milliseconds:', numTimestamp, '->', dateValue);
    } else {
      // Invalid timestamp, use current time
      console.warn('Invalid timestamp, using current time:', numTimestamp);
      dateValue = Date.now();
    }
    
    const date = new Date(dateValue);
    
    // Validate the date
    if (isNaN(date.getTime())) {
      console.warn('Invalid date created, using current time');
      return new Date().toLocaleString();
    }
    
    console.log('Formatted date:', date.toLocaleString());
    return date.toLocaleString();
  };

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
    if (onExpand && !isExpanded) {
      onExpand(file);
    }
  };

  const handleLike = async () => {
    if (!isLiked) {
      await incrementLikes(file.file_id);
    }
  };

  const handleDownload = async () => {
    if (!isDownloading) {
      await downloadFile(file);
    }
  };

  return (
    <View style={styles.container}>
      {/* Preview Section - Only this should trigger view increment */}
      <TouchableOpacity style={styles.previewContainer} onPress={onPress}>
        {isPreviewable && previewUrl ? (
          <Image 
            source={{ uri: previewUrl }}
            style={styles.previewImage}
            cachePolicy="disk"
            contentFit="cover"
          />
        ) : (
          <View style={styles.iconContainer}>
            <FileIcon 
              type={getFileTypeForIcon(file.file_type)} 
              size={32} 
            />
          </View>
        )}
        
        {/* Overlay with file type badge */}
        <View style={styles.overlay}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {file.file_type.split('/')[0].toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* File Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.fileName} numberOfLines={2}>
          {file.file_name}
        </Text>
        
        <View style={styles.metaRow}>
          <Text style={styles.fileSize}>
            {formatFileSize(file.file_size)}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.fileDate}>
            {formatDate(file.created_at)}
          </Text>
        </View>

        <View style={styles.transactionRow}>
          <ExternalLink size={12} color={Colors.gray} />
          <Text style={styles.transactionText} numberOfLines={1}>
            {formatTransactionSignature(file.transaction_signature)}
          </Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statsLeft}>
            <View style={styles.statButton}>
              <Eye size={14} color={Colors.gray} />
              <Text style={styles.statText}>{file.views}</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.statButton,
                isLiked && styles.likedButton
              ]}
              onPress={handleLike}
              disabled={isLiked}
            >
              <Heart 
                size={14} 
                color={isLiked ? Colors.white : Colors.error} 
                fill={isLiked ? Colors.white : "none"}
              />
              <Text style={[
                styles.statText,
                isLiked && styles.likedText
              ]}>{file.likes}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.downloadButton,
                isDownloading && styles.downloadingButton
              ]}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <ActivityIndicator size={14} color={Colors.white} />
              ) : (
                <Download size={14} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={handleExpandToggle}
          >
            {isExpanded ? (
              <ChevronUp size={16} color={Colors.primary} />
            ) : (
              <ChevronDown size={16} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={styles.expandedContainer}>
            <View style={styles.divider} />
            
            {/* Blockchain Verification Badge */}
            <View style={styles.verificationBadge}>
              <View style={styles.verificationIcon}>
                <Text style={styles.verificationCheckmark}>✓</Text>
              </View>
              <Text style={styles.verificationText}>Blockchain Verified</Text>
            </View>

            {/* File Information */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>File Information</Text>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Size:</Text>
                <Text style={styles.detailValue}>{formatFileSize(file.file_size)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Type:</Text>
                <Text style={styles.detailValue}>{file.file_type}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Uploaded:</Text>
                <Text style={styles.detailValue}>{formatDate(file.created_at)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Views:</Text>
                <Text style={styles.detailValue}>{file.views.toLocaleString()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Likes:</Text>
                <Text style={styles.detailValue}>{file.likes.toLocaleString()}</Text>
              </View>
            </View>

            {/* Blockchain Details */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Blockchain Details</Text>
              
              {file.owner_share_id && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Owner Share ID:</Text>
                  <TouchableOpacity>
                    <Text style={styles.detailValueLink} numberOfLines={1}>
                      {file.owner_share_id}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Transaction Signature:</Text>
                <TouchableOpacity>
                  <Text style={styles.detailValueLink} numberOfLines={1}>
                    {formatTransactionSignature(file.transaction_signature, true)}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Slot:</Text>
                <Text style={styles.detailValue}>{file.slot.toLocaleString()}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Block Time:</Text>
                <Text style={styles.detailValue}>{formatTimestamp(file.block_time)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{file.confirmation_status}</Text>
                </View>
              </View>
              
              {file.cid && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>IPFS CID:</Text>
                  <TouchableOpacity>
                    <Text style={styles.detailValueLink} numberOfLines={1}>
                      {file.cid}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.1)",
  },
  previewContainer: {
    height: 160,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  iconContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(91, 77, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  typeBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  infoContainer: {
    padding: theme.spacing.md,
  },
  fileName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  fileSize: {
    color: Colors.gray,
    fontSize: 12,
  },
  separator: {
    color: Colors.gray,
    fontSize: 12,
    marginHorizontal: theme.spacing.xs,
  },
  fileDate: {
    color: Colors.gray,
    fontSize: 12,
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    gap: 4,
  },
  transactionText: {
    color: Colors.gray,
    fontSize: 11,
    fontFamily: "monospace",
    flex: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  statText: {
    color: Colors.gray,
    fontSize: 12,
    fontWeight: "500",
  },
  downloadButton: {
    padding: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
  },
  downloadingButton: {
    backgroundColor: Colors.primary,
  },
  likedButton: {
    backgroundColor: Colors.error,
  },
  likedText: {
    color: Colors.white,
  },
  expandButton: {
    padding: theme.spacing.sm,
    borderRadius: 12,
    backgroundColor: "rgba(91, 77, 255, 0.1)",
  },
  expandedContainer: {
    marginTop: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: theme.spacing.md,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    alignSelf: "flex-start",
  },
  verificationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.sm,
  },
  verificationCheckmark: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  verificationText: {
    color: "#22c55e",
    fontSize: 12,
    fontWeight: "600",
  },
  detailSection: {
    marginBottom: theme.spacing.lg,
  },
  detailSectionTitle: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: theme.spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
    minHeight: 20,
  },
  detailLabel: {
    color: Colors.gray,
    fontSize: 12,
    width: 120,
    fontWeight: "500",
  },
  detailValue: {
    color: Colors.white,
    fontSize: 12,
    flex: 1,
    fontFamily: "monospace",
  },
  detailValueLink: {
    color: Colors.primary,
    fontSize: 12,
    flex: 1,
    fontFamily: "monospace",
    textDecorationLine: "underline",
  },
  statusBadge: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    color: "#22c55e",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});