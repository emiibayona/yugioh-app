import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  AppState,
  AppStateStatus,
} from "react-native";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { Suspense } from "react";
import { StatusBar } from "expo-status-bar";

import * as FileSystem from "expo-file-system";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "@/context/AuthContext";
import { BindersProvider } from "@/context/BinderContext";
import { Camera } from "react-native-vision-camera";
import * as ExpoMediaLibrary from "expo-media-library";

import Config from "@/constants/Config";
import "@/locales/i18n";
import { useTranslation } from "react-i18next";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const segments = useSegments();
  const appState = useRef(AppState.currentState);
  const { t } = useTranslation();

  const apiUrl = Config.API_URL;
  const versionKey = "db_version_tag";

  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const checkPermissions = async () => {
    const cameraStatus = Camera.getCameraPermissionStatus();
    const mediaStatus = await ExpoMediaLibrary.getPermissionsAsync();

    const allGranted = cameraStatus === "granted" && mediaStatus.granted;

    console.log("🔍 Checking Permissions:", {
      cameraStatus,
      mediaGranted: mediaStatus.granted,
    });
    setHasPermissions(allGranted);
  };

  // Check permissions on mount and when segments change
  useEffect(() => {
    if ("(tabs)" === segments[0] && segments.length === 1) {
      checkPermissions();
    }
    // checkPermissions();
  }, [segments]);

  // Handle AppState changes (e.g. returning from Settings)
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        console.log("🚀 ~ RootLayout ~ nextAppState:", nextAppState);
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          console.log(
            "📱 App has come to the foreground, re-checking permissions...",
          );
          checkPermissions();
        }
        appState.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

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
      const download = await FileSystem.downloadAsync(url, tempPath);
      if (download.status !== 200)
        throw new Error(`Download failed: ${download.status}`);
      await FileSystem.moveAsync({ from: tempPath, to: dbPath });
      console.log("✅ PROTOCOL COMPLETE: Database updated.");
      return true;
    } catch (error: any) {
      console.error("🚨 SYNC FAILED:", error || "");
      const tempCheck = await FileSystem.getInfoAsync(tempPath);
      if (tempCheck.exists) await FileSystem.deleteAsync(tempPath);
      return false;
    }
  }

  useEffect(() => {
    async function initializeGeartownDb() {
      // ONLY initialize if permissions are granted and DB isn't loaded yet
      if (isDbLoaded || hasPermissions !== true) return;

      console.log("🚀 Initializing database...", dbPath);
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      const isFileBroken = !fileInfo.exists || fileInfo.size === 0;
      console.log("🚀 ~ initializeGeartownDb ~ fileInfo:", fileInfo);
      console.log("🚀 ~ initializeGeartownDb ~ isFileBroken:", isFileBroken);

      try {
        const vRes = await fetch(`${apiUrl}/version`);
        const vData = await vRes.json();
        const needUpdateVersion = await checkVersion(vData.version);

        if (isFileBroken || needUpdateVersion) {
          await downloadDatabase();
        }
      } catch (e) {
        console.error("Failed to check version/download", e);
      }
      setIsDbLoaded(true);
      console.log("✅ DATABASE READY !!!")
    }

    initializeGeartownDb();
  }, [isDbLoaded, hasPermissions]);

  if (!loaded || hasPermissions === null) {
    return <LoadingScreen label={t("common.loading")} />;
  }

  // If we have permissions but DB is still loading, show loading screen
  // UNLESS we are already on the permissions screen
  const isPermissionsScreen = segments[0] === "permissions";
  if (hasPermissions === true && !isDbLoaded && !isPermissionsScreen) {
    return <LoadingScreen label={t("common.settingUpDb")} />;
  }

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
            <Suspense fallback={<LoadingScreen label={t("common.loading")} />}>
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

function LoadingScreen({ label }: { label: string }) {
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
      <Text style={{ marginTop: 20, color: "white" }}>{label}</Text>
    </View>
  );
}
