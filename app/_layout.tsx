import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ActivityIndicator, Text, View } from "react-native";
import { Suspense } from "react";
import { StatusBar } from "expo-status-bar";

import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "@/context/AuthContext";
import { BindersProvider } from "@/context/BinderContext";
import { Camera } from "react-native-vision-camera";
import * as ExpoMediaLibrary from "expo-media-library";

import "@/locales/i18n";
import { useTranslation } from "react-i18next";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const segments = useSegments();
  const router = useRouter();
  const apiUrl =
    process?.env?.EXPO_PUBLIC_API_URL || "http://192.168.1.62:8082/api";
  const versionKey = "db_version_tag";
  console.log("🚀 RootLayout started. API URL:", apiUrl);

  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // 1. Check permissions first
  useEffect(() => {
    async function checkPermissions() {
      const cameraStatus = Camera.getCameraPermissionStatus();
      const microStatus = Camera.getMicrophonePermissionStatus();
      const mediaStatus = await ExpoMediaLibrary.getPermissionsAsync();

      const allGranted =
        cameraStatus === "granted" &&
        microStatus === "granted" &&
        mediaStatus.granted;

      console.log("Permissions status:", {
        cameraStatus,
        microStatus,
        mediaGranted: mediaStatus.granted,
      });
      setHasPermissions(allGranted);
    }

    // Check every time we might have come back from permissions screen
    checkPermissions();
  }, [segments]);

  const dbName = "yugioh_database.sqlite";
  const dbFolder = `${FileSystem.documentDirectory}SQLite/`;
  const dbPath = `${dbFolder}${dbName}`;

  async function checkVersion(remoteVersion: string) {
    try {
      const localVersion = (await AsyncStorage.getItem(versionKey)) || "0.0.0";

      const rParts = remoteVersion.split(".");
      const lParts = localVersion.split(".");

      const rX = parseInt(rParts[0] || "0");
      const rY = parseInt(rParts[1] || "0");
      const lX = parseInt(lParts[0] || "0");
      const lY = parseInt(lParts[1] || "0");

      await AsyncStorage.setItem(versionKey, remoteVersion);

      return rX !== lX || rY !== lY;
    } catch (e) {
      console.warn("Could not fetch version after initial download.", e);
      return true;
    }
  }

  async function downloadDatabase() {
    const tempPath = `${FileSystem.cacheDirectory}${dbName}.tmp`;

    try {
      console.log("⚙️ SYNCING DATA FROM ARCHIVE...");

      const response = await fetch(`${apiUrl}/files/database.sqlite`);
      const { url } = await response.json();

      console.log("🔗 Direct Blob URL:", url);

      // 2. Download directly from Vercel (Bypassing the redirect issue)
      const download = await FileSystem.downloadAsync(url, tempPath);

      // 1. Download to CACHE first (Not the live SQLite folder)

      if (download.status !== 200) {
        throw new Error(`Download failed with status ${download.status}`);
      } else if (download.status === 200) {
        console.log("✅ DATABASE SYNCED FROM VERCEL BLOB");
      }

      // 3. Move the temp file to the live path (Overwrites safely)
      await FileSystem.moveAsync({
        from: tempPath,
        to: dbPath,
      });

      console.log("✅ PROTOCOL COMPLETE: Database updated.");
      return true;
    } catch (error: any) {
      console.error("🚨 SYNC FAILED:", error.message || "");

      // Cleanup temp file if it failed
      const tempCheck = await FileSystem.getInfoAsync(tempPath);
      if (tempCheck.exists) await FileSystem.deleteAsync(tempPath);
      return false;
    }
  }

  useEffect(() => {
    async function initializeGeartownDb() {
      if (isDbLoaded || hasPermissions !== true) return;

      console.log("Initializing database (Permissions granted)...");

      const fileInfo = await FileSystem.getInfoAsync(dbPath);

      // 🚨 THE GUARD: Only download if it's missing, empty, or needs version update
      const isFileBroken = !fileInfo.exists || fileInfo.size === 0;
      try {
        console.log("Checking database version from server...", apiUrl);
        const vRes = await fetch(`${apiUrl}/version`);
        const vData = await vRes.json();
        const needUpdateVersion = await checkVersion(vData.version);

        if (isFileBroken || needUpdateVersion) {
          console.log("📥 Syncing database (Missing/Broken/Update)...");
          const success = await downloadDatabase();
          if (success) {
            console.log("✅ Database persisted.");
          }
        } else {
          console.log(
            "📦 Using local database (Size:",
            fileInfo.size,
            "bytes).",
          );
        }
      } catch (e) {
        console.error("Failed to check version", e);
      }
      setIsDbLoaded(true);
    }

    initializeGeartownDb();
  }, [isDbLoaded, hasPermissions]);

  if (!loaded || hasPermissions === null) {
    return <LoadingScreen />;
  }

  // If permissions are not granted, we show the stack which will handle redirection to permissions
  // but we DON'T show the SQLiteProvider yet.
  const stackContent = (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="permissions"
        options={{ presentation: "modal", headerShown: true }}
      />
      <Stack.Screen
        name="media"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
    </Stack>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AuthProvider>
        <BindersProvider>
          <ThemeProvider value={DarkTheme}>
            <Suspense fallback={<LoadingScreen />}>
              {isDbLoaded ? (
                <SQLite.SQLiteProvider databaseName={dbName} useSuspense>
                  {stackContent}
                </SQLite.SQLiteProvider>
              ) : (
                stackContent
              )}
            </Suspense>
          </ThemeProvider>
        </BindersProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <ActivityIndicator size="large" color="#00FFCC" />
      <Text style={{ marginTop: 20, color: "white" }}>
        {t("common.initializing")}
      </Text>
    </View>
  );
}
