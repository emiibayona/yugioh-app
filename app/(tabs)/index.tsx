import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useCameraPermission } from "react-native-vision-camera";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import ScannerComponent from "@/components/Scanner/ScannerComponent";

export default function EscanerScreen() {
  const { hasPermission } = useCameraPermission();

  const redirectToPermissions = !hasPermission;

  if (redirectToPermissions) return <Redirect href={"/permissions"} />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.scannerWrapper}>
        <ScannerComponent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  scannerWrapper: {
    flex: 1,
    zIndex: 1,
  },
});
