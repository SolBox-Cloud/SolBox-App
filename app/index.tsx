import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";

export default function WelcomeScreen() {
  const router = useRouter();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation sequence
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(logoRotateAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
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
      router.push("/onboarding/screen1");
    });
  };

  const logoRotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
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
              styles.logoContainer,
              {
                transform: [{ rotate: logoRotation }],
              },
            ]}
          >
            {/* Cloud shape */}
            <View style={styles.cloudShape}>
              <View style={styles.cloudMain} />
              <View style={[styles.cloudBubble, styles.cloudBubble1]} />
              <View style={[styles.cloudBubble, styles.cloudBubble2]} />
              <View style={[styles.cloudBubble, styles.cloudBubble3]} />
              <View style={[styles.cloudBubble, styles.cloudBubble4]} />
            </View>
            
            {/* Box inside cloud */}
            <View style={styles.boxContainer}>
              <View style={styles.boxFront} />
              <View style={styles.boxTop} />
              <View style={styles.boxRight} />
            </View>
          </Animated.View>
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
            Welcome to SolBox
          </Text>
          <Text style={styles.subtitle}>
            Your decentralized storage solution
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
            title="Get Started"
            onPress={handleGetStarted}
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
  },
  logoContainer: {
    width: 300,
    height: 300,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  cloudShape: {
    position: "absolute",
    width: 240,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  cloudMain: {
    width: 180,
    height: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    position: "absolute",
  },
  cloudBubble: {
    backgroundColor: "#FFFFFF",
    borderRadius: 50,
    position: "absolute",
  },
  cloudBubble1: {
    width: 60,
    height: 60,
    top: -20,
    left: 20,
  },
  cloudBubble2: {
    width: 80,
    height: 80,
    top: -30,
    left: 60,
  },
  cloudBubble3: {
    width: 70,
    height: 70,
    top: -25,
    right: 20,
  },
  cloudBubble4: {
    width: 50,
    height: 50,
    top: -10,
    right: 40,
  },
  boxContainer: {
    position: "absolute",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  boxFront: {
    width: 60,
    height: 60,
    backgroundColor: "#000000",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    zIndex: 3,
  },
  boxTop: {
    width: 60,
    height: 20,
    backgroundColor: "#333333",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    top: -17,
    left: 3,
    transform: [{ skewX: "45deg" }],
    zIndex: 2,
  },
  boxRight: {
    width: 20,
    height: 60,
    backgroundColor: "#666666",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "absolute",
    right: -17,
    top: 3,
    transform: [{ skewY: "45deg" }],
    zIndex: 1,
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
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "400",
    color: "#AAAAAA",
    textAlign: "center",
    lineHeight: 24,
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