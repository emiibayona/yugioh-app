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
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  const dbName = "yugioh-scanner.db";

  const [isDbLoaded, setIsDbLoaded] = useState(false);

  useEffect(() => {
    async function loadDatabase() {
      try {
        //     if (isDbLoaded) return; // Prevent re-loading if already loaded
        //     const dbDbDirectory = `${FileSystem.documentDirectory}SQLite`;
        //     const dbPath = `${dbDbDirectory}/${dbName}`;
        //     const dbExists = await FileSystem.getInfoAsync(dbPath);
        //     console.log("🚀 ~ loadDatabase ~ dbExists:", dbExists);

        //     if (!dbExists.exists) {
        //       await FileSystem.makeDirectoryAsync(dbDbDirectory, {
        //         intermediates: true,
        //       });
        //       const asset = await Asset.fromModule(
        //         require("../assets/yugioh-scanner.db"),
        //       ).downloadAsync();
        //       if (asset.localUri) {
        //         await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
        //       }
        //     } else {
        //       const db = await SQLite.openDatabaseAsync(dbName);
        //       console.log("Database opened successfully in RootLayout", db);
        //       const result = await db.getAllAsync(
        //         "SELECT name FROM sqlite_master;",
        //       );
        //       console.log("Tables found:", result); // Should now show cardPoolNames
        //     }
        //     setIsDbLoaded(true);

        const dbName = "yugioh-scanner.db";
        // SQLite MUST be capitalized in the path
        const dbFolder = `${FileSystem.documentDirectory}SQLite/`;
        const dbPath = `${dbFolder}${dbName}`;

        // 1. Ensure the directory exists
        await FileSystem.makeDirectoryAsync(dbFolder, {
          intermediates: true,
        }).catch(() => {});

        // 2. Load and Force Copy (Overwrite every time for this test)
        const asset = await Asset.fromModule(
          require("../assets/yugioh-scanner.db"),
        ).downloadAsync();

        if (asset.localUri) {
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: dbPath,
          });
          console.log("📂 Database copied to:", dbPath);
        }

        // 3. Open it using the SAME name
        // const db = await SQLite.openDatabaseAsync(dbName);
        // const tables = await db.getAllAsync(
        //   "SELECT name FROM sqlite_master WHERE type='table';",
        // );
        // console.log("🛠️ VERIFIED TABLES:", JSON.stringify(tables));
        setIsDbLoaded(true);
      } catch (error) {
        console.error("Error loading database:", error);
      }
    }

    loadDatabase();
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
              <Stack.Screen name="index" options={{ headerShown: false }} />
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
