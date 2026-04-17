import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t("login.appName")}</Text>
          <Text style={styles.subtitle}>{t("home.welcome", "Welcome, Duelist!")}</Text>
        </View>

        <View style={styles.instructionsContainer}>
          <Text style={styles.sectionTitle}>{t("home.howToUse", "How to use")}</Text>
          
          <View style={styles.instructionItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="scan" size={24} color="#00FFCC" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>{t("home.step1Title", "Scan your cards")}</Text>
              <Text style={styles.instructionDescription}>
                {t("home.step1Desc", "Go to the Scanner tab and point your camera at a Yu-Gi-Oh! card.")}
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="library" size={24} color="#00FFCC" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>{t("home.step2Title", "Manage Collection")}</Text>
              <Text style={styles.instructionDescription}>
                {t("home.step2Desc", "Organize your scanned cards into different binders.")}
              </Text>
            </View>
          </View>

          <View style={styles.instructionItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="sync" size={24} color="#00FFCC" />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>{t("home.step3Title", "Keep it Synced")}</Text>
              <Text style={styles.instructionDescription}>
                {t("home.step3Desc", "Your collection is automatically synced with your account.")}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => router.push("/(tabs)/scanner")}
        >
          <Text style={styles.startButtonText}>{t("home.startScanning", "Start Scanning")}</Text>
          <Ionicons name="arrow-forward" size={20} color="#000" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    paddingTop: 80,
    paddingHorizontal: 25,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#00FFCC",
    marginTop: 5,
  },
  instructionsContainer: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#222",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(0, 255, 204, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: "#AAA",
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: "#00FFCC",
    flexDirection: "row",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "bold",
    marginRight: 10,
  },
});
