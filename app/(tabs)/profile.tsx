import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // Mock User Data
  const user = {
    name: "Duelist Master",
    email: "duelist@yugioh.com",
    // avatar: 'https://images.ygoprodeck.com/images/cards_small/46986414.jpg', // Dark Magician as avatar
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS-Rwkzsfm1EXLlcgLInjlSBJ9ALIb9OAyTPQ&s",
    memberSince: "Jan 2024",
    totalCards: 207,
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    // In the future: handle logout logic with API
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.loginContainer}>
          <Ionicons name="person-circle-outline" size={100} color="#00FFCC" />
          <Text style={styles.loginTitle}>Welcome Back</Text>
          <Text style={styles.loginSubtitle}>
            Sign in to sync your collection
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => setIsLoggedIn(true)}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <Text style={styles.memberDate}>Member since {user.memberSince}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user.totalCards}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Binders</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>Decks</Text>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name="notifications-outline" size={20} color="#FFF" />
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: "#333", true: "#00FFCC" }}
          />
        </View>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
            <Text style={styles.settingLabel}>Sync Database</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingLabelGroup}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" />
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF5555" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 80,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 20,
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#AAA",
    marginTop: 10,
    marginBottom: 30,
    textAlign: "center",
  },
  loginBtn: {
    backgroundColor: "#00FFCC",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  loginBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00FFCC",
    marginBottom: 15,
  },
  userName: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  userEmail: {
    color: "#AAA",
    fontSize: 14,
    marginTop: 4,
  },
  memberDate: {
    color: "#666",
    fontSize: 12,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#111",
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#222",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    color: "#00FFCC",
    fontSize: 20,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#333",
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "#666",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 15,
    letterSpacing: 1,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    color: "#FFF",
    fontSize: 16,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 40,
    paddingVertical: 15,
  },
  logoutText: {
    color: "#FF5555",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
});
