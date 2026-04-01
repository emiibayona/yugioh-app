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

import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { ActivityIndicator, Text, View } from 'react-native';
import { Suspense } from 'react';


import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';



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

  if (!loaded) {
    return null;
  }

  
  const dbName = "yugioh-scanner.db";

  const [isDbLoaded, setIsDbLoaded] = useState(false);

  // useEffect(() => {
  async function loadDatabase() {

    try {
      const dbDbDirectory = `${FileSystem.documentDirectory}SQLite`;
      console.log("FileSystem.documentDirectory", FileSystem.documentDirectory)
      console.log("Database directory:", dbDbDirectory);
      const dbPath = `${dbDbDirectory}/${dbName}`;
      console.log("Database path:", dbPath);
      const dbExists = await FileSystem.getInfoAsync(dbPath);

      if (!dbExists.exists) {
        // Create the SQLite directory if it doesn't exist
        await FileSystem.makeDirectoryAsync(dbDbDirectory, { intermediates: true });
        // Copy the file from assets to the internal app folder
        const asset = await Asset.fromModule(require(`../assets/${dbName}`)).downloadAsync();
        if (asset.localUri) {
          await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
        }
      }
      setIsDbLoaded(true);
    } catch (error) {
      console.error("Error loading database:", error);
    }


    // }
    // loadDatabase();
  }
  // }, [isDbLoaded]);

  // if (!isDbLoaded) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" />
  //       <Text style={{ marginTop: 10 }}>Preparing Database...</Text>
  //     </View>
  //   );
  // }

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={DarkTheme}>
        <Suspense fallback={<LoadingScreen />}>
          <SQLiteProvider databaseName={dbName} useSuspense>


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
              <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}