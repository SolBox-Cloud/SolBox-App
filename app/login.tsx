import { StyleSheet, Text, View, TextInput, Alert, KeyboardAvoidingView, Platform, Animated } from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield, Key, Plus, Sparkles } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";
import { useFileStore } from "@/store/fileStore";
import { LinearGradient } from "expo-linear-gradient";

export default function LoginScreen() {
  const router = useRouter();
  const [blockId, setBlockId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  
  const { setBlockId: setUserBlockId, setLoggedIn } = useUserStore();
  const { loadUserFiles } = useFileStore();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Sparkle animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isGenerating]);

  const validateBlockId = (id: string): boolean => {
    const trimmedId = id.trim();
    if (trimmedId.length < 8) {
      setError("Block ID must be at least 8 characters long");
      return false;
    }
    return true;
  };

  const generateBlockId = (): string => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateShareId = (blockId: string): string => {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    let result = "";
    const seed = blockId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    for (let i = 0; i < 44; i++) {
      const index = (seed + i + Math.floor(Math.random() * 100)) % chars.length;
      result += chars.charAt(index);
    }
    return result;
  };

  const checkBlockIdExists = async (blockId: string): Promise<boolean> => {
    try {
      const response = await fetch(`https://jrdauvpldrfybetybrox.supabase.co/rest/v1/ipfs_files?block_id=eq.${encodeURIComponent(blockId)}&select=id&limit=1`, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGF1dnBsZHJmeWJldHlicm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDQzNDQsImV4cCI6MjA2MzUyMDM0NH0.4agDpMubI1pBNa2vwIkTKOXxK6ELTkScsKL6Qc5Nbbk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGF1dnBsZHJmeWJldHlicm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDQzNDQsImV4cCI6MjA2MzUyMDM0NH0.4agDpMubI1pBNa2vwIkTKOXxK6ELTkScsKL6Qc5Nbbk'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check Block ID');
      }

      const data = await response.json();
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking Block ID:', error);
      return false;
    }
  };

  const saveBlockIdToDatabase = async (blockId: string, shareId: string): Promise<boolean> => {
    try {
      const response = await fetch('https://jrdauvpldrfybetybrox.supabase.co/rest/v1/share_ids', {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGF1dnBsZHJmeWJldHlicm94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NDQzNDQsImV4cCI6MjA2MzUyMDM0NH0.4agDpMubI1pBNa2vwIkTKOXxK6ELTkScsKL6Qc5Nbbk',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZGF1dnBsZHJmeWJldHlicm94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk0NDM0NCwiZXhwIjoyMDYzNTIwMzQ0fQ.dXLhA2X69GujxWHDr5p1caWEPxgju-_3ySwymaTvYQM',
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          block_id: blockId,
          share_id: shareId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error saving Block ID to database:', error);
      return false;
    }
  };

  const fetchUserFiles = async (blockId: string) => {
    try {
      const response = await fetch(`process.env._ANON_KEY`, {
        headers: {
          'apikey': 'process.env._ANON_KEY',
          'Authorization': 'process.env._ANON_KEY'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user files');
      }

      const files = await response.json();
      
      const transformedFiles = files.map((file: any) => ({
        id: file.id.toString(),
        name: file.filename,
        type: getFileTypeFromMime(file.mime_type),
        size: formatFileSize(file.file_size),
        sizeInBytes: file.file_size,
        modifiedDate: new Date(file.created_at).toISOString().split('T')[0],
        folderId: null,
        url: file.ipfs_url || `https://SOLBOX.CLOUD/ipfs/${file.cid}`,
        isFolder: false,
        cid: file.cid,
        ipfsHash: file.ipfs_hash,
        mimeType: file.mime_type
      }));

      loadUserFiles(transformedFiles);
      return transformedFiles;
    } catch (error) {
      console.error('Error fetching user files:', error);
      throw error;
    }
  };

  const getFileTypeFromMime = (mimeType: string): "pdf" | "image" | "video" | "zip" | "default" => {
    if (mimeType?.startsWith("image/")) return "image";
    if (mimeType?.startsWith("video/")) return "video";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType?.includes("zip") || mimeType?.includes("archive")) return "zip";
    return "default";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleLogin = async () => {
    const trimmedBlockId = blockId.trim();
    
    if (!validateBlockId(trimmedBlockId)) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const exists = await checkBlockIdExists(trimmedBlockId);
      
      if (!exists) {
        setError("Block ID not found. Please check your ID and try again.");
        setIsLoading(false);
        return;
      }

      await fetchUserFiles(trimmedBlockId);
      setUserBlockId(trimmedBlockId);
      setLoggedIn(true);
      router.replace("/(tabs)");
      
    } catch (error) {
      console.error("Login error:", error);
      setError("Failed to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBlockId = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const newBlockId = generateBlockId();
      const newShareId = generateShareId(newBlockId);

      const saved = await saveBlockIdToDatabase(newBlockId, newShareId);
      
      if (!saved) {
        setError("Failed to save Block ID. Please try again.");
        setIsGenerating(false);
        return;
      }

      setBlockId(newBlockId);
      setUserBlockId(newBlockId);
      setLoggedIn(true);
      router.replace("/(tabs)");
      
    } catch (error) {
      console.error("Generate Block ID error:", error);
      setError("Failed to generate Block ID. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const sparkleRotation = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Animated.View 
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(91, 77, 255, 0.2)", "rgba(0, 229, 255, 0.2)"]}
                style={styles.iconGradient}
              >
                <Shield size={48} color={Colors.primary} />
                <Animated.View
                  style={[
                    styles.sparkle,
                    {
                      transform: [{ rotate: sparkleRotation }],
                      opacity: sparkleOpacity,
                    },
                  ]}
                >
                  <Sparkles size={20} color={Colors.secondary} />
                </Animated.View>
              </LinearGradient>
            </Animated.View>
            
            <Text style={styles.title}>Welcome to SolBox</Text>
            <Text style={styles.subtitle}>
              Connect with your Block ID or create a new one to get started
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Key size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={styles.input}
                value={blockId}
                onChangeText={(text) => {
                  setBlockId(text);
                  setError("");
                }}
                placeholder="Enter your Block ID"
                placeholderTextColor={Colors.gray}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading && !isGenerating}
              />
            </View>
            
            {error ? (
              <Animated.View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.buttonContainer}>
              <Button
                title={isLoading ? "Connecting..." : "Continue"}
                onPress={handleLogin}
                disabled={isLoading || isGenerating || !blockId.trim()}
                style={styles.primaryButton}
              />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                title={isGenerating ? "Creating..." : "Create New Block ID"}
                onPress={handleGenerateBlockId}
                disabled={isLoading || isGenerating}
                variant="outline"
                style={styles.secondaryButton}
                icon={<Plus size={20} color={Colors.primary} />}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your Block ID is like a private key. Keep it safe and secure.
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xxl * 1.5,
  },
  iconContainer: {
    marginBottom: theme.spacing.xl,
    position: "relative",
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.3)",
  },
  sparkle: {
    position: "absolute",
    top: -5,
    right: -5,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.white,
    textAlign: "center",
    marginBottom: theme.spacing.md,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: theme.spacing.md,
  },
  form: {
    marginBottom: theme.spacing.xxl,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(91, 77, 255, 0.2)",
    marginBottom: theme.spacing.lg,
    height: 56,
  },
  inputIconContainer: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    paddingRight: theme.spacing.lg,
    color: Colors.white,
    fontSize: 16,
    height: "100%",
  },
  errorContainer: {
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(255, 77, 77, 0.1)",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 77, 77, 0.2)",
  },
  buttonContainer: {
    gap: theme.spacing.lg,
  },
  primaryButton: {
    borderRadius: 25,
    height: 56,
  },
  secondaryButton: {
    borderRadius: 25,
    height: 56,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  dividerText: {
    color: Colors.gray,
    fontSize: 14,
    marginHorizontal: theme.spacing.lg,
    fontWeight: "500",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: Colors.gray,
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
  },
});