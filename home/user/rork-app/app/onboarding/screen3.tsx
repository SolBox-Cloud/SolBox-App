import { StyleSheet, Text, View, Animated } from "react-native";
import React, { useRef, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Coins, Zap, TrendingUp, Database, Link, Cpu, DollarSign } from "lucide-react-native";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";
import Button from "@/components/Button";
import { useUserStore } from "@/store/userStore";

export default function OnboardingScreen3() {
  const router = useRouter();
  const setOnboarded = useUserStore((state) => state.setOnboarded);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const coinsAnim = useRef(new Animated.Value(0)).current;

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

    // Continuous pulse animation for central hub
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Rotation animation for blockchain nodes
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Coins floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(coinsAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(coinsAnim, {
          toValue: 0,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    ).start();
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
      setOnboarded(true);
      router.replace("/login");
    });
  };

  const nodeRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coinsFloat = coinsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
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
                transform: [{ translateY: coinsFloat }],
              },
            ]}
          >
            <View style={styles.coinTop}>
              <Coins size={20} color="#FFD700" />
            </View>
            <View style={styles.trendingIcon}>
              <TrendingUp size={24} color="#00DC82" />
            </View>
            <View style={styles.zapIcon}>
              <Zap size={18} color="#FFD700" fill="#FFD700" />
            </View>
            <View style={styles.dollarIcon}>
              <DollarSign size={22} color="#00DC82" />
            </View>
          </Animated.View>
          
          <View style={styles.blockchainContainer}>
            <Animated.View 
              style={[
                styles.centralHub,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Database size={48} color="#304FFE" strokeWidth={1.5} />
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.blockchainNodes,
                {
                  transform: [{ rotate: nodeRotation }],
                },
              ]}
            >
              <View style={[styles.node, styles.nodeTop]}>
                <Link size={24} color="#FFFFFF" />
              </View>
              <View style={[styles.node, styles.nodeLeft]}>
                <Cpu size={24} color="#FFFFFF" />
              </View>
              <View style={[styles.node, styles.nodeRight]}>
                <Coins size={24} color="#FFD700" />
              </View>
              <View style={[styles.node, styles.nodeBottom]}>
                <TrendingUp size={24} color="#00DC82" />
              </View>
            </Animated.View>
            
            <Animated.View 
              style={[
                styles.connectionLines,
                {
                  opacity: fadeAnim,
                },
              ]}
            >
              <View style={[styles.line, styles.lineTop]} />
              <View style={[styles.line, styles.lineLeft]} />
              <View style={[styles.line, styles.lineRight]} />
              <View style={[styles.line, styles.lineBottom]} />
            </Animated.View>
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
          <View style={[styles.indicator, styles.inactiveIndicator]} />
          <View style={[styles.indicator, styles.activeIndicator]} />
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
            Earn rewards by sharing your storage space
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
    position: "relative",
    width: "100%",
  },
  decorativeElements: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  coinTop: {
    position: "absolute",
    top: 20,
    right: 40,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    borderRadius: 16,
    padding: 8,
  },
  trendingIcon: {
    position: "absolute",
    top: 60,
    left: 20,
    backgroundColor: "rgba(0, 220, 130, 0.1)",
    borderRadius: 16,
    padding: 6,
  },
  zapIcon: {
    position: "absolute",
    bottom: 30,
    right: 30,
  },
  dollarIcon: {
    position: "absolute",
    bottom: 70,
    left: 40,
    backgroundColor: "rgba(0, 220, 130, 0.1)",
    borderRadius: 16,
    padding: 4,
  },
  blockchainContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 200,
    height: 200,
  },
  centralHub: {
    position: "absolute",
    backgroundColor: "rgba(48, 79, 254, 0.2)",
    borderRadius: 40,
    padding: 16,
    borderWidth: 2,
    borderColor: "#304FFE",
  },
  blockchainNodes: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  node: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  nodeTop: {
    top: 0,
    left: "50%",
    marginLeft: -20,
  },
  nodeLeft: {
    left: 0,
    top: "50%",
    marginTop: -20,
  },
  nodeRight: {
    right: 0,
    top: "50%",
    marginTop: -20,
  },
  nodeBottom: {
    bottom: 0,
    left: "50%",
    marginLeft: -20,
  },
  connectionLines: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  line: {
    position: "absolute",
    backgroundColor: "rgba(48, 79, 254, 0.3)",
  },
  lineTop: {
    top: 40,
    left: "50%",
    width: 2,
    height: 60,
    marginLeft: -1,
  },
  lineLeft: {
    left: 40,
    top: "50%",
    width: 60,
    height: 2,
    marginTop: -1,
  },
  lineRight: {
    right: 40,
    top: "50%",
    width: 60,
    height: 2,
    marginTop: -1,
  },
  lineBottom: {
    bottom: 40,
    left: "50%",
    width: 2,
    height: 60,
    marginLeft: -1,
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