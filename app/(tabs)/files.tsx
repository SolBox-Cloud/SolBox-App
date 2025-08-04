import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Dimensions, FlatList, Pressable } from "react-native";
import React, { useRef, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HardDrive, Server, Smartphone, Tablet, Laptop, ArrowUpRight, Wallet, ChevronRight, ChevronLeft, Circle, Activity, Zap, Database, TrendingUp } from "lucide-react-native";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  Easing,
  interpolate,
  useAnimatedScrollHandler,
  runOnJS
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DEVICE_ITEM_WIDTH = SCREEN_WIDTH * 0.75;
const DEVICE_ITEM_SPACING = 16;

// Mock data for devices
const rentedDevices: DeviceType[] = [
  {
    id: "1",
    name: "MacBook Pro",
    type: "laptop",
    storage: { used: 156, total: 512 },
    earnings: 25.50,
    status: "active",
    retrievals: 51,
    lastActive: "2 minutes ago",
    location: "San Francisco, CA",
    nodeId: "node_mbp_sf_01",
    uptime: "99.7%",
    networkSpeed: "250 Mbps"
  },
  {
    id: "2",
    name: "iPhone 15 Pro",
    type: "phone",
    storage: { used: 45, total: 256 },
    earnings: 12.75,
    status: "active",
    retrievals: 25,
    lastActive: "5 minutes ago",
    location: "New York, NY",
    nodeId: "node_iphone_ny_02",
    uptime: "98.2%",
    networkSpeed: "120 Mbps"
  },
  {
    id: "3",
    name: "Home Server",
    type: "server",
    storage: { used: 2048, total: 4096 },
    earnings: 156.25,
    status: "active",
    retrievals: 312,
    lastActive: "Just now",
    location: "Austin, TX",
    nodeId: "node_server_atx_01",
    uptime: "99.9%",
    networkSpeed: "1 Gbps"
  },
  {
    id: "4",
    name: "iPad Pro",
    type: "tablet",
    storage: { used: 78, total: 256 },
    earnings: 8.35,
    status: "active",
    retrievals: 17,
    lastActive: "1 hour ago",
    location: "Seattle, WA",
    nodeId: "node_ipad_sea_01",
    uptime: "97.5%",
    networkSpeed: "180 Mbps"
  }
];

// Mock data for recent retrievals
const recentRetrievals: RetrievalType[] = [
  {
    id: "1",
    filename: "e7b124f8...3a9d.enc",
    size: "25.4 MB",
    date: "2025-07-15",
    time: "14:32",
    earnings: 0.5,
    device: "MacBook Pro"
  },
  {
    id: "2",
    filename: "c9d834a2...7b2c.enc",
    size: "156.7 MB",
    date: "2025-07-15",
    time: "13:45",
    earnings: 1.2,
    device: "Home Server"
  },
  {
    id: "3",
    filename: "f5a912b7...4e8d.enc",
    size: "78.2 MB",
    date: "2025-07-15",
    time: "11:20",
    earnings: 0.7,
    device: "iPhone 15 Pro"
  },
  {
    id: "4",
    filename: "a1b2c3d4...5e6f.enc",
    size: "215.9 MB",
    date: "2025-07-14",
    time: "22:15",
    earnings: 1.8,
    device: "Home Server"
  },
  {
    id: "5",
    filename: "b8c5d2e1...9f3a.enc",
    size: "89.3 MB",
    date: "2025-07-14",
    time: "19:42",
    earnings: 0.9,
    device: "MacBook Pro"
  },
  {
    id: "6",
    filename: "d4f7a9b2...1c8e.enc",
    size: "342.1 MB",
    date: "2025-07-14",
    time: "16:28",
    earnings: 2.1,
    device: "Home Server"
  },
  {
    id: "7",
    filename: "g2h5j8k1...4m7n.enc",
    size: "67.8 MB",
    date: "2025-07-14",
    time: "14:55",
    earnings: 0.6,
    device: "iPad Pro"
  },
  {
    id: "8",
    filename: "p9q2r5s8...3t6u.enc",
    size: "128.4 MB",
    date: "2025-07-14",
    time: "12:33",
    earnings: 1.0,
    device: "iPhone 15 Pro"
  }
];

const DeviceIcon = ({ type, size = 24, color = Colors.white }: { type: string; size?: number; color?: string }) => {
  switch (type) {
    case "laptop":
      return <Laptop size={size} color={color} />;
    case "phone":
      return <Smartphone size={size} color={color} />;
    case "tablet":
      return <Tablet size={size} color={color} />;
    case "server":
      return <Server size={size} color={color} />;
    default:
      return <HardDrive size={size} color={color} />;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Define types for our data
type DeviceType = {
  id: string;
  name: string;
  type: string;
  storage: { used: number; total: number };
  earnings: number;
  status: string;
  retrievals: number;
  lastActive: string;
  location: string;
  nodeId?: string;
  uptime?: string;
  networkSpeed?: string;
};

type RetrievalType = {
  id: string;
  filename: string;
  size: string;
  date: string;
  time: string;
  earnings: number;
  device: string;
  blockHeight?: number;
  txHash?: string;
};

export default function FilesScreen() {
  const router = useRouter();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const deviceScrollRef = useRef<FlatList>(null);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);
  
  // Animation values
  const scrollY = useSharedValue(0);
  const statsScale = useSharedValue(1);
  const deviceCardScale = useSharedValue(1);
  const retrievalItemOpacity = useSharedValue(0.3);
  
  // Disabled state
  const isDisabled = true;
  
  // Calculate total earnings and storage
  const totalEarnings = rentedDevices.reduce((sum, device) => sum + device.earnings, 0);
  const totalStorageRented = rentedDevices.reduce((sum, device) => sum + device.storage.total, 0);
  const totalStorageUsed = rentedDevices.reduce((sum, device) => sum + device.storage.used, 0);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  const formatStorage = (gb: number): string => {
    return gb >= 1024 ? `${(gb/1024).toFixed(1)} TB` : `${gb} GB`;
  };
  
  const handleDeviceScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (DEVICE_ITEM_WIDTH + DEVICE_ITEM_SPACING));
    setActiveDeviceIndex(index);
  };
  
  const scrollToDevice = (index: number) => {
    if (deviceScrollRef.current) {
      deviceScrollRef.current.scrollToOffset({
        offset: index * (DEVICE_ITEM_WIDTH + DEVICE_ITEM_SPACING),
        animated: true
      });
    }
  };

  const handleStatsPress = () => {
    if (isDisabled) return;
    statsScale.value = withSpring(0.95, { duration: 100 }, () => {
      statsScale.value = withSpring(1, { duration: 200 });
    });
  };

  const handleDevicePress = () => {
    if (isDisabled) return;
    deviceCardScale.value = withSpring(0.98, { duration: 100 }, () => {
      deviceCardScale.value = withSpring(1, { duration: 200 });
    });
  };
  
  // Animated styles
  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statsScale.value }],
    opacity: isDisabled ? 0.4 : 1
  }));
  
  const deviceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: deviceCardScale.value }],
    opacity: isDisabled ? 0.4 : 1
  }));
  
  const scrollAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [isDisabled ? 0.4 : 1, isDisabled ? 0.35 : 0.95]
    );
    
    return {
      opacity,
    };
  });
  
  const renderDeviceItem = ({ item, index }: { item: DeviceType; index: number }) => {
    const usagePercent = (item.storage.used / item.storage.total) * 100;
    const deviceColors: Record<string, string> = {
      laptop: Colors.primary,
      phone: Colors.success,
      server: "#FF6B6B",
      tablet: Colors.secondary
    };
    const deviceColor = deviceColors[item.type] || Colors.primary;
    
    return (
      <AnimatedPressable 
        style={[styles.deviceCard, deviceAnimatedStyle]}
        onPress={isDisabled ? undefined : handleDevicePress}
        disabled={isDisabled}
      >
        <View style={styles.deviceCardHeader}>
          <View style={[styles.deviceIconBg, { backgroundColor: `${deviceColor}15` }]}>
            <DeviceIcon type={item.type} size={24} color={deviceColor} />
          </View>
          
          <View style={styles.deviceHeaderInfo}>
            <Text style={styles.deviceName}>{item.name}</Text>
            <View style={styles.deviceStatusContainer}>
              <View style={[styles.statusIndicator, { backgroundColor: deviceColor }]} />
              <Text style={styles.deviceStatus}>{item.status}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.deviceMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>${item.earnings.toFixed(2)}</Text>
            <Text style={styles.metricLabel}>Earned</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.retrievals}</Text>
            <Text style={styles.metricLabel}>Requests</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{item.uptime}</Text>
            <Text style={styles.metricLabel}>Uptime</Text>
          </View>
        </View>
        
        <View style={styles.storageContainer}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageLabel}>Storage</Text>
            <Text style={styles.storageValue}>
              {formatStorage(item.storage.used)} / {formatStorage(item.storage.total)}
            </Text>
          </View>
          <View style={styles.storageBar}>
            <Animated.View 
              style={[
                styles.storageUsed, 
                { 
                  width: `${usagePercent}%`,
                  backgroundColor: deviceColor
                }
              ]} 
            />
          </View>
        </View>
      </AnimatedPressable>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Animated.ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={scrollAnimatedStyle}
      >
        {/* Network Overview */}
        <View style={styles.networkOverview}>
          <View style={styles.primaryMetrics}>
            <AnimatedPressable 
              style={[styles.metricCard, styles.earningsCard, statsAnimatedStyle]}
              onPress={isDisabled ? undefined : handleStatsPress}
              disabled={isDisabled}
            >
              <View style={styles.metricCardIcon}>
                <Wallet size={18} color={Colors.primary} />
              </View>
              <Text style={styles.metricCardValue}>${totalEarnings.toFixed(2)}</Text>
              <Text style={styles.metricCardLabel}>Total Earnings</Text>
              <View style={styles.metricCardChange}>
                <TrendingUp size={12} color={Colors.success} />
                <Text style={styles.metricCardChangeText}>+12.5%</Text>
              </View>
            </AnimatedPressable>
            
            <AnimatedPressable 
              style={[styles.metricCard, styles.storageCard, statsAnimatedStyle]}
              onPress={isDisabled ? undefined : handleStatsPress}
              disabled={isDisabled}
            >
              <View style={styles.metricCardIcon}>
                <Database size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.metricCardValue}>{formatStorage(totalStorageRented)}</Text>
              <Text style={styles.metricCardLabel}>Storage Provided</Text>
              <View style={styles.storageUtilization}>
                <View style={styles.utilizationBar}>
                  <View 
                    style={[
                      styles.utilizationFill,
                      { width: `${Math.round((totalStorageUsed/totalStorageRented)*100)}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.utilizationText}>{Math.round((totalStorageUsed/totalStorageRented)*100)}% used</Text>
              </View>
            </AnimatedPressable>
          </View>
          
          <View style={styles.networkStats}>
            <View style={styles.networkStatItem}>
              <View style={styles.networkStatIcon}>
                <Activity size={16} color={Colors.success} />
              </View>
              <View style={styles.networkStatContent}>
                <Text style={styles.networkStatValue}>{rentedDevices.length}</Text>
                <Text style={styles.networkStatLabel}>Active Nodes</Text>
              </View>
            </View>
            
            <View style={styles.networkStatDivider} />
            
            <View style={styles.networkStatItem}>
              <View style={styles.networkStatIcon}>
                <Zap size={16} color={Colors.primary} />
              </View>
              <View style={styles.networkStatContent}>
                <Text style={styles.networkStatValue}>99.8%</Text>
                <Text style={styles.networkStatLabel}>Network Uptime</Text>
              </View>
            </View>
            
            <View style={styles.networkStatDivider} />
            
            <View style={styles.networkStatItem}>
              <View style={styles.networkStatIcon}>
                <Server size={16} color={Colors.secondary} />
              </View>
              <View style={styles.networkStatContent}>
                <Text style={styles.networkStatValue}>1.2k</Text>
                <Text style={styles.networkStatLabel}>Total Requests</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Devices Section */}
        <View style={styles.devicesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Connected Devices</Text>
            <View style={styles.deviceCount}>
              <Zap size={14} color={Colors.success} />
              <Text style={styles.deviceCountText}>{rentedDevices.length} online</Text>
            </View>
          </View>
          
          <FlatList
            ref={deviceScrollRef}
            data={rentedDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={DEVICE_ITEM_WIDTH + DEVICE_ITEM_SPACING}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.devicesList}
            onScroll={handleDeviceScroll}
            scrollEventThrottle={16}
          />
          
          <View style={styles.deviceIndicators}>
            {rentedDevices.map((_, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.deviceIndicator,
                  activeDeviceIndex === index && styles.deviceIndicatorActive,
                  isDisabled && styles.deviceIndicatorDisabled
                ]}
                onPress={isDisabled ? undefined : () => scrollToDevice(index)}
                disabled={isDisabled}
              />
            ))}
          </View>
        </View>
        
        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Retrievals</Text>
          </View>
          
          <View style={styles.activityContainer}>
            {recentRetrievals.slice(0, 8).map((retrieval, index) => (
              <Animated.View 
                key={retrieval.id} 
                style={[
                  styles.activityItem,
                  { opacity: isDisabled ? 0.3 : retrievalItemOpacity.value }
                ]}
              >
                <View style={styles.activityIndicator}>
                  <View style={styles.activityDot} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{retrieval.size} retrieved</Text>
                  <Text style={styles.activityTime}>{retrieval.time} • {retrieval.device}</Text>
                </View>
                <Text style={styles.activityEarning}>+${retrieval.earnings.toFixed(2)}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 120,
  },
  
  // Network Overview Section
  networkOverview: {
    marginBottom: theme.spacing.xl,
  },
  primaryMetrics: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  earningsCard: {
    // Using consistent card background
  },
  storageCard: {
    // Using consistent card background
  },
  metricCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  metricCardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 4,
  },
  metricCardLabel: {
    fontSize: 13,
    color: Colors.gray,
    marginBottom: theme.spacing.sm,
  },
  metricCardChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metricCardChangeText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: "600",
  },
  storageUtilization: {
    width: "100%",
    alignItems: "center",
    gap: 6,
  },
  utilizationBar: {
    width: "100%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  utilizationFill: {
    height: "100%",
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },
  utilizationText: {
    fontSize: 11,
    color: Colors.gray,
    fontWeight: "500",
  },
  networkStats: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  networkStatItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  networkStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  networkStatContent: {
    flex: 1,
  },
  networkStatValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
    marginBottom: 1,
  },
  networkStatLabel: {
    fontSize: 11,
    color: Colors.gray,
  },
  networkStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: theme.spacing.sm,
  },
  
  // Devices Section
  devicesSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.white,
  },
  deviceCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  deviceCountText: {
    fontSize: 13,
    color: Colors.success,
    fontWeight: "500",
  },
  devicesList: {
    paddingLeft: theme.spacing.lg,
    paddingRight: theme.spacing.lg,
  },
  deviceCard: {
    width: DEVICE_ITEM_WIDTH,
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginRight: DEVICE_ITEM_SPACING,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  deviceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  deviceIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  deviceHeaderInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 4,
  },
  deviceStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  deviceStatus: {
    fontSize: 12,
    color: Colors.gray,
    textTransform: "capitalize",
  },
  deviceMetrics: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.gray,
  },
  metricDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: theme.spacing.sm,
  },
  storageContainer: {
    marginTop: theme.spacing.sm,
  },
  storageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 12,
    color: Colors.gray,
  },
  storageValue: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: "500",
  },
  storageBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  storageUsed: {
    height: "100%",
    borderRadius: 2,
  },
  deviceIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: theme.spacing.lg,
    gap: 8,
  },
  deviceIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  deviceIndicatorActive: {
    backgroundColor: Colors.primary,
    width: 20,
  },
  deviceIndicatorDisabled: {
    opacity: 0.3,
  },
  
  // Activity Section
  activitySection: {
    marginBottom: theme.spacing.xl,
  },
  activityContainer: {
    backgroundColor: Colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  activityIndicator: {
    width: 20,
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "500",
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.gray,
  },
  activityEarning: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
});