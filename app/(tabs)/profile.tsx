import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [lastname, setLastname] = useState(user?.lastname || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const pickImage = async () => {
    if (!isEditing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ name, lastname, imageUri });
      setIsEditing(false);
      setImageUri(null);
      Alert.alert("Success", "Profile updated successfully");
    } catch (e: any) {
      Alert.alert("Error", "Failed to update profile > " + e?.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00FFCC" />
      </View>
    );
  }

  if (!user) {
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
            onPress={() => router.push("/login")}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          onPress={pickImage}
          disabled={!isEditing}
          style={styles.avatarContainer}
        >
          <Image
            source={{
              uri:
                imageUri || user?.picture || "https://via.placeholder.com/150",
            }}
            style={styles.avatar}
          />
          {isEditing && (
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera" size={24} color="#FFF" />
            </View>
          )}
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.editInput}
              value={name}
              onChangeText={setName}
              placeholder="First Name"
              placeholderTextColor="#666"
            />
            <TextInput
              style={styles.editInput}
              value={lastname}
              onChangeText={setLastname}
              placeholder="Last Name"
              placeholderTextColor="#666"
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.userName}>
              {user?.name} {user?.lastname}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <TouchableOpacity
              style={styles.editProfileBtn}
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.editProfileBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>207</Text>
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
      </View> */}

      {/* <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>

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
      </View> */}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF5555" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
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
    paddingTop: 80,
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 15,
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#00FFCC",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
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
  editProfileBtn: {
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00FFCC",
  },
  editProfileBtnText: {
    color: "#00FFCC",
    fontSize: 12,
    fontWeight: "bold",
  },
  editForm: {
    width: "100%",
    paddingHorizontal: 40,
    alignItems: "center",
  },
  editInput: {
    width: "100%",
    height: 45,
    backgroundColor: "#111",
    borderRadius: 10,
    color: "#FFF",
    paddingHorizontal: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  editActions: {
    flexDirection: "row",
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
  },
  cancelBtnText: {
    color: "#AAA",
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: "#00FFCC",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 100,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "bold",
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
    marginTop: 300,
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
