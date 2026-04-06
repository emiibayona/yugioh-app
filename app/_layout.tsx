import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { useColorScheme } from "@/hooks/useColorScheme";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// import { SQLiteDatabase, SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator, Text, View } from "react-native";
import { Suspense } from "react";

import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import * as SQLite from "expo-sqlite";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const apiUrl =
    process?.env?.EXPO_PUBLIC_API_URL || "http://192.168.1.49:8082/api";
  const versionKey = "db_version_tag";

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const [isDbLoaded, setIsDbLoaded] = useState(false);

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
      console.warn("Could not fetch version after initial download.");
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

      // 2. CRITICAL: Close existing connections if they exist
      // If you use expo-sqlite (new API), ensure you aren't holding a lock.
      // Some developers use a 'db.closeSync()' if available.

      // 3. Move the temp file to the live path (Overwrites safely)
      await FileSystem.moveAsync({
        from: tempPath,
        to: dbPath,
      });

      // 4. Set permissions to Read-Write
      // await FileSystem.setPermissionsAsync(dbPath, { read: true, write: true });

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
      if (isDbLoaded) return;
      // 1. Check if the file exists and has actual data
      // await FileSystem.deleteAsync(dbPath); // UNCOMMENT, RUN ONCE, THEN REMOVE
      // return;
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      const lastSync = await AsyncStorage.getItem("last_db_sync");

      // 🚨 THE GUARD: Only download if it's missing, empty, or 7 days old
      const isFileBroken = !fileInfo.exists || fileInfo.size === 0;
      const isOld =
        !lastSync || Date.now() - Number(lastSync) > 7 * 24 * 60 * 60 * 1000;
      const vRes = await fetch(`${apiUrl}/version`);
      const vData = await vRes.json();
      const needUpdateVersion = await checkVersion(vData.version);

      if (isFileBroken || isOld || needUpdateVersion) {
        console.log("📥 Syncing database (Missing/Broken/Old)...");

        // Perform your download from Vercel Blob here
        const success = await downloadDatabase();

        if (success) {
          // Record the success so we don't do it again tomorrow
          await AsyncStorage.setItem("last_db_sync", Date.now().toString());
          console.log("✅ Database persisted. Next check in 7 days.");
        }
      } else {
        console.log(
          "📦 Using local database (Size:",
          fileInfo.size,
          "bytes). No download needed.",
        );
      }
      setIsDbLoaded(true);
    }

    //   async function loadDatabase() {
    //     try {
    //       if (isDbLoaded) return;
    //       console.log("INIT LOAD DB");

    //

    //       // 1. Ensure the directory exists
    //       await FileSystem.makeDirectoryAsync(dbFolder, {
    //         intermediates: true,
    //       }).catch(() => {});

    //       const fileInfo = await FileSystem.getInfoAsync(dbPath);

    //       // 1. If the DB not exists, then download
    //       if (!fileInfo.exists && apiUrl) {
    //         console.log("📂 Database missing. Initial download...");
    //         try {
    //           await AsyncStorage.setItem(versionKey, "0.0.0");
    //         } catch (e) {
    //           console.warn("Could not fetch version after initial download.");
    //         }
    //       } else {
    //         // 1.2 If exists, force to copy always to the sqllite folder from assets
    //         console.log("📂 Database exists. Syncing with assets as baseline...");
    //         // const item = require(
    //         //   `${FileSystem.documentDirectory}SQLite/${dbName}`,
    //         // );
    //         // const asset = await Asset.fromModule(item).downloadAsync();
    //         const asset = {
    //           localUri: dbPath,
    //         }; // Mock asset for testing
    //         if (asset.localUri) {
    //           await FileSystem.copyAsync({
    //             from: asset.localUri,
    //             to: dbPath,
    //           });
    //           // Reset version tag after asset overwrite to ensure update check if needed
    //         }
    //       }

    //       ///var/mobile/Containers/Data/Application/4AC40604-CCE3-4AFD-A205-081B85D0C2F0/Documents/SQLite/yugioh_database.sqlite

    //       // 1.1 Logic to re-download if X.Y version changes

    //       file: try {
    //         const remoteVersion = vData.version;

    //         const localVersion =
    //           (await AsyncStorage.getItem(versionKey)) || "0.0.0";

    //         const rParts = remoteVersion.split(".");
    //         const lParts = localVersion.split(".");

    //         const rX = parseInt(rParts[0] || "0");
    //         const rY = parseInt(rParts[1] || "0");
    //         const lX = parseInt(lParts[0] || "0");
    //         const lY = parseInt(lParts[1] || "0");

    //         if (rX !== lX || rY !== lY) {
    //           console.log(
    //             `📂 API version changed (${localVersion} -> ${remoteVersion}). Updating DB...`,
    //           );
    //           await downloadDatabase();
    //           await AsyncStorage.setItem(versionKey, remoteVersion);
    //         }
    //         setIsDbLoaded(true);
    //       } catch (e) {
    //         console.log("Version check skipped or failed.");
    //       }
    //     } catch (error) {
    //       console.error("Error loading database:", error);
    //       setIsDbLoaded(true);
    //     }
    //   }

    // loadDatabase();
    initializeGeartownDb();
  }, [isDbLoaded]);

  if (!loaded || !isDbLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={DarkTheme}>
        <Suspense fallback={<LoadingScreen />}>
          <SQLite.SQLiteProvider databaseName={dbName} useSuspense>
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
              <Stack.Screen
                name="+not-found"
                options={{ presentation: "modal" }}
              />
            </Stack>
          </SQLite.SQLiteProvider>
        </Suspense>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 20, color: "white" }}>Loading...</Text>
    </View>
  );
}
