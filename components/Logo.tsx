import { Image, StyleSheet, View, Platform } from "react-native";
import React, { useState } from "react";

interface LogoProps {
  size?: number;
}

export default function Logo({ size = 80 }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // SolBox logo URL
  const solboxLogo = "https://i.ibb.co/W4Hkprb7/solbox-logo.png";
  const fallbackImage = "https://placehold.co/600x400/5B4DFF/FFFFFF/png?text=SolBox&font=montserrat";
  
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageError ? fallbackImage : solboxLogo }}
        style={[styles.logo, { width: size, height: size }]}
        resizeMode="contain"
        onError={(error) => {
          console.log("Logo image load error:", error.nativeEvent.error);
          setImageError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 80,
    height: 80,
  },
});