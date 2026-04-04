import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useBoundaries } from "@/hooks/useBoundaries";
import CardSample from "./CardSample";
import ZoomSlider from "./ZoomSlider";

interface BoundariesScreenProps {
  showSample: boolean;
  onExternalLayout: (event: any) => void;
  onUpdateZoom: (zoom: number) => void;
}

export default function BoundariesScreen({
  showSample,
  onExternalLayout,
  onUpdateZoom,
}: BoundariesScreenProps) {
  const { boundaries } = useBoundaries();
  const [showBoundaries, setShowBoundaries] = useState(true);

  const toggleBoundaries = () => {
    setShowBoundaries(!showBoundaries);
  };

  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    onExternalLayout({ width, height });
  };

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: showBoundaries
        ? "rgba(255, 255, 255, 0.3)"
        : "rgba(0,0,0,0)",
      borderColor: "white",
      borderStyle: "solid",
      borderBottomWidth: showBoundaries ? boundaries.height : 0,
      borderTopWidth: showBoundaries ? boundaries.height : 0,
      borderLeftWidth: showBoundaries ? boundaries.width : 0,
      borderRightWidth: showBoundaries ? boundaries.width : 0,
    },
    text: {
      fontSize: 18,
      fontWeight: "bold",
    },
    cross: {
      position: "absolute",
      top: showBoundaries ? -boundaries.height + 40 : 40,
      left: 20,
      fontSize: 18,
      fontWeight: "bold",
      color: "white",
      backgroundColor: "rgba(0,0,0,0.5)",
      padding: 5,
      borderRadius: 5,
      zIndex: 10,
    },
    sliderContainer: {
        position: 'absolute',
        top: showBoundaries ? -boundaries.height + 80 : 80,
        zIndex: 10,
    }
  });

  return (
    <View style={styles.container} onLayout={handleLayout} pointerEvents="box-none">
      <View style={styles.sliderContainer}>
        <ZoomSlider onUpdateZoom={onUpdateZoom} />
      </View>
      
      <Text style={styles.cross} onPress={toggleBoundaries}>
        {showBoundaries ? "Quitar reglas" : "Mostrar reglas"}
      </Text>
      {showSample && showBoundaries && (
        <CardSample onLayout={onExternalLayout} />
      )}
    </View>
  );
}
