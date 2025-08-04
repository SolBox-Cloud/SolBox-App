import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useUserStore } from "@/store/userStore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const unstable_settings = {
  initialRouteName: "index",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { isOnboarded, isLoggedIn, setOnboarded, setLoggedIn } = useUserStore();

  useEffect(() => {
    async function prepare() {
      try {
        console.log("RootLayout: Initializing app on platform:", Platform.OS);
        // Check persisted state to ensure correct initialization
        const onboarded = await AsyncStorage.getItem("solbox-user");
        if (onboarded) {
          const parsed = JSON.parse(onboarded);
          console.log("RootLayout: Loaded persisted state:", parsed);
          setOnboarded(parsed.state?.isOnboarded || false);
          setLoggedIn(parsed.state?.isLoggedIn || false);
        } else {
          console.log("RootLayout: No persisted state found, setting defaults to false");
          setOnboarded(false);
          setLoggedIn(false);
        }
      } catch (e) {
        console.warn("RootLayout: Error during app preparation:", e);
      } finally {
        setAppIsReady(true);
        console.log("RootLayout: App is ready, hiding splash screen...");
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [setOnboarded, setLoggedIn]);

  if (!appIsReady) {
    return null;
  }

  console.log("RootLayout: Rendering layout with platform:", Platform.OS);

  return (
    <>
      <StatusBar style="light" />
      <RootLayoutNav />
    </>
  );
}

function RootLayoutNav() {
  const { isOnboarded, isLoggedIn } = useUserStore();
  
  console.log("RootLayoutNav: Current state:", { isOnboarded, isLoggedIn, platform: Platform.OS });
  
  // Determine initial route based on user state
  let initialRoute = "index";
  if (!isOnboarded) {
    initialRoute = "index";
  } else if (!isLoggedIn) {
    initialRoute = "login";
  } else {
    initialRoute = "(tabs)";
  }
  
  console.log("RootLayoutNav: Setting initial route to:", initialRoute);

  return (
    <Stack
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D0E14" },
        animation: Platform.OS === 'android' ? 'slide_from_right' : 'fade_from_bottom',
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="onboarding/screen1" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="onboarding/screen2" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="onboarding/screen3" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="login" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="upload" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          headerTitle: "Upload File",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#0D0E14" },
        }} 
      />
      <Stack.Screen 
        name="share" 
        options={{ 
          presentation: "modal",
          headerShown: true,
          headerTitle: "Share File",
          headerTintColor: "#FFFFFF",
          headerStyle: { backgroundColor: "#0D0E14" },
        }} 
      />
    </Stack>
  );
}