import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Cloud, Upload, Download, Share2, Globe, FileText, Users, ArrowRight } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";

export default function OnboardingScreen2() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
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
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Continuous floating animation for decorative elements
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Arrow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(arrowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleNext = () => {
    // Exit animation before navigation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.push("/onboarding/screen3");
    });
  };

  const floatTransform = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const arrowTransform = arrowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Animated.View 
          style={[
            styles.illustrationContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Animated.View 
            style={[
              styles.decorativeElements,
              {
                transform: [{ translateY: floatTransform }],
              },
            ]}
          >
            <View style={styles.uploadIcon}>
              <Upload size={24} color="#00E5FF" />
            </View>
            <View style={styles.downloadIcon}>
              <Download size={20} color="#00E5FF" />
            </View>
            <View style={styles.globeIcon}>
              <Globe size={28} color="#FFD700" />
            </View>
            <View style={styles.fileIcon}>
              <FileText size={18} color="#FFFFFF" />
            </View>
          </Animated.View>
          
          <View style={styles.cloudContainer}>
            <Cloud size={180} color="#FFFFFF" strokeWidth={1.5} fill="rgba(255,255,255,0.1)" />
            <View style={styles.cloudContent}>
              <View style={styles.shareContainer}>
                <Share2 size={36} color="#304FFE" strokeWidth={2} />
              </View>
              <View style={styles.usersContainer}>
                <Users size={32} color="#FFFFFF" strokeWidth={1.5} />
              </View>
              <Animated.View 
                style={[
                  styles.arrowContainer,
                  {
                    transform: [{ translateX: arrowTransform }],
                  },
                ]}
              >
                <ArrowRight size={24} color="#00E5FF" strokeWidth={2} />
              </Animated.View>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          style={[
            styles.indicatorContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={[styles.indicator, styles.inactiveIndicator]} />
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={[styles.indicator, styles.inactiveIndicator]} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>
            Share files with anyone, anywhere in the world
          </Text>
        </Animated.View>

        <Animated.View 
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="large"
            style={styles.button}
          />
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "space-between",
    alignItems: "center",
  },
  illustrationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: theme.spacing.xxl,
    position: "relative",
    width: "100%",
  },
  decorativeElements: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  uploadIcon: {
    position: "absolute",
    top: 30,
    left: 40,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderRadius: 20,
    padding: 8,
  },
  downloadIcon: {
    position: "absolute",
    top: 80,
    right: 30,
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderRadius: 16,
    padding: 6,
  },
  globeIcon: {
    position: "absolute",
    bottom: 40,
    left: 30,
  },
  fileIcon: {
    position: "absolute",
    bottom: 80,
    right: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 4,
  },
  cloudContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  cloudContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 20,
    top: "40%",
  },
  shareContainer: {
    backgroundColor: "rgba(48, 79, 254, 0.2)",
    borderRadius: 20,
    padding: 8,
  },
  usersContainer: {
    marginTop: -10,
  },
  arrowContainer: {
    marginTop: 10,
  },
  indicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  indicator: {
    height: 8,
    borderRadius: 19,
  },
  activeIndicator: {
    width: 16,
    backgroundColor: "#304FFE",
  },
  inactiveIndicator: {
    width: 37,
    backgroundColor: "#EAEBFF",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 34,
    fontWeight: "600",
    color: "#F7F7F7",
    textAlign: "center",
    lineHeight: 41,
  },
  buttonContainer: {
    width: "100%",
    marginBottom: theme.spacing.xl,
  },
  button: {
    width: "100%",
    backgroundColor: "#304FFE",
    borderRadius: 50,
    height: 56,
  },
});