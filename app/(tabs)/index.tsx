import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Redirect } from "expo-router";
import { useCameraPermission } from "react-native-vision-camera";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import ScannerComponent from "@/components/Scanner/ScannerComponent";

export default function EscanerScreen() {
  const { hasPermission } = useCameraPermission();
  console.log("EscanerScreen: hasPermission =", hasPermission);

  const redirectToPermissions = !hasPermission;

  if (redirectToPermissions) {
    console.log("Redirecting to permissions...");
    return <Redirect href={"/permissions"} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.scannerWrapper}>
        <ScannerComponent key={hasPermission ? "granted" : "not-granted"} />
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
