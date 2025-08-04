import { Image, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import Colors from "@/constants/colors";
import { theme } from "@/constants/theme";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export default function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const getInitials = () => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Updated SolBox avatar image URL
  const solboxAvatar = "https://i.ibb.co/PZQ3sF02/solbox-avatar.png";

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Image
        source={{
          uri: imageError || !uri ? solboxAvatar : uri
        }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        onError={(error) => {
          console.log("Avatar image load error:", error.nativeEvent.error);
          setImageError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  initials: {
    color: Colors.white,
    fontWeight: "bold",
  },
});