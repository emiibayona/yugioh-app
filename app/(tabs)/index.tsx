import * as React from "react";
import {
  StyleSheet,
  Platform,
  View,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Redirect } from "expo-router";
import { useCameraPermission } from "react-native-vision-camera";
import { useState } from "react";
import ScannerComponent from "@/components/Scanner/ScannerComponent";

export default function EscanerScreen() {
  const { hasPermission } = useCameraPermission();
  const [detectedCard, setDetectedCard] = useState<any>(null);

  const redirectToPermissions = !hasPermission;

  const handleCardDetected = (card: any) => {
    setDetectedCard(card);
  };

  if (redirectToPermissions) return <Redirect href={"/permissions"} />;

  return (
    <>
      <StatusBar barStyle={"light-content"} />
      <SafeAreaView style={styles.container}>
        <View style={styles.scannerWrapper}>
          <ScannerComponent onCardDetected={handleCardDetected} />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scannerWrapper: {
    flex: 1,
    zIndex: 1,
  },
});
