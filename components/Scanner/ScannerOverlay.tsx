import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Animated, Easing } from "react-native";

interface ScannerOverlayProps {
  isPaused: boolean;
}

export default function ScannerOverlay({ isPaused }: ScannerOverlayProps) {
  const {  height } = Dimensions.get("window");
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isPaused]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height * 0.14, height * 0.828],
  });

  return (
    !isPaused && (
      <View style={styles.container} pointerEvents="none">
        {/* Corner Markers - Reduced height area */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />

        {/* Scanning Line */}
        <Animated.View
          style={[styles.scanLine, { transform: [{ translateY }] }]}
        />
      </View>
    )
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
  corner: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: "rgba(0, 255, 204, 1)",
    borderWidth: 2,
    zIndex: 7,
  },
  topLeft: {
    top: "15%",
    left: "10%",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: "15%",
    right: "10%",
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: "10%",
    left: "10%",
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: "10%",
    right: "10%",
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    height: 1,
    backgroundColor: "rgba(0, 255, 204, 0.6)",
    width: "79%",
    alignSelf: "center",
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 2,
    zIndex: 6,
  },
});
