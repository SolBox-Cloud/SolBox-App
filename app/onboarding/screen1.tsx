import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Shield, Users, Handshake, CheckCircle, Star } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";

export default function OnboardingScreen1() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const starsAnim = useRef(new Animated.Value(0)).current;

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
      Animated.timing(starsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous star animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(starsAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(starsAnim, {
          toValue: 1,
          duration: 2000,
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
      router.push("/onboarding/screen2");
    });
  };

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
                transform: [{ scale: starsAnim }],
              },
            ]}
          >
            <View style={styles.starTop}>
              <Star size={16} color="#FFD700" fill="#FFD700" />
            </View>
            <View style={styles.starTopSmall}>
              <Star size={12} color="#FFD700" fill="#FFD700" />
            </View>
            <View style={styles.checkmark}>
              <CheckCircle size={32} color="#304FFE" fill="#304FFE" />
            </View>
            <View style={styles.starBottom}>
              <Star size={20} color="#FFD700" fill="#FFD700" />
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.shieldContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Shield size={200} color="#FFFFFF" strokeWidth={1.5} />
            <View style={styles.shieldContent}>
              <Users size={40} color="#FFFFFF" strokeWidth={1.5} />
              <View style={styles.handshakeContainer}>
                <Handshake size={36} color="#FFFFFF" strokeWidth={1.5} />
              </View>
            </View>
          </Animated.View>
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
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={[styles.indicator, styles.inactiveIndicator]} />
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
            Trusted by millions of people, part of one part
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
  starTop: {
    position: "absolute",
    top: 40,
    left: 60,
  },
  starTopSmall: {
    position: "absolute",
    top: 60,
    left: 80,
  },
  checkmark: {
    position: "absolute",
    top: 30,
    right: 40,
  },
  starBottom: {
    position: "absolute",
    bottom: 60,
    right: 50,
  },
  shieldContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldContent: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    top: "35%",
  },
  handshakeContainer: {
    marginTop: 20,
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