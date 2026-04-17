import React from "react";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
// import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  // const { token, isLoading } = useAuth();
  const { t } = useTranslation();

  // if (isLoading) {
  //   return (
  //     <View
  //       style={{
  //         flex: 1,
  //         justifyContent: "center",
  //         alignItems: "center",
  //         backgroundColor: "#000",
  //       }}
  //     >
  //       <ActivityIndicator size="large" color="#00FFCC" />
  //     </View>
  //   );
  // }

  // if (!token) {
  //   return <Redirect href="/login" />;
  // }

  // ...
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00FFCC",
        tabBarInactiveTintColor: "#AAA",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#000",
          borderTopWidth: 1,
          borderTopColor: "#333",
          paddingBottom: 1,
          height: 44,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home", "Home"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: t("tabs.scanner"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "scan" : "scan-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          headerShown: false,
          title: t("tabs.collection"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "library" : "library-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
