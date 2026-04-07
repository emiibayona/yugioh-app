import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_LOGIN_URL || "https://api.colomardo.space/api";

const TOKEN_KEY = "auth_token";

interface UserInfo {
  name: string;
  lastname: string;
  picture: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  userInfo: UserInfo;
  name: string;
  lastname: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  uploadImage: (uri: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tenant = process.env.TENANT || "yugioh-scanner-app";

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        await fetchProfile(storedToken);
      }
    } catch (e) {
      console.error("Failed to load auth state", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchProfile(authToken: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/profile/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const profileData = await response.json();
        setUser({ ...profileData, tenant: profileData.tenant || tenant });
      } else if (response.status === 401) {
        await logout();
      }
    } catch (e) {
      console.error("Failed to fetch profile", e);
    }
  }

  async function login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, tenant }),
    });

    const data = await response.json();
    if (response.ok && data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      await fetchProfile(data.token);
    } else {
      throw new Error(JSON.stringify(data) || "Login failed");
    }
  }

  async function register(data: any) {
    // 1. Upload image if exists
    let imageUrl = data.imageUrl || "";
    if (data.imageUri && !imageUrl) {
      imageUrl = await uploadImage(data.imageUri);
    }

    const payload = {
      username: `${data.name} ${data.lastname}`,
      email: data.email,
      password_hash: data.password,
      password: data.password,
      type: "USER",
      tenant: tenant,
      userInfo: {
        name: data.name,
        lastname: data.lastname,
        picture: imageUrl,
      },
    };

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Registration failed");
    }

    // Secondary call if needed by the backend architecture
    try {
      await fetch(`${API_BASE_URL}/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn("Secondary registration call failed, but primary succeeded");
    }

    // Usually auto-login after register or just return
    await login(data.email, data.password);
  }

  async function uploadImage(uri: string): Promise<string> {
    const formData = new FormData();
    // @ts-ignore
    formData.append("file", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/files/image`,
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.ok) throw new Error("Image upload failed");
    const data = await response.json();
    return data.url; // Assuming API returns { url: "..." }
  }

  async function updateProfile(data: any) {
    if (!token) return;
    console.log("On updateProfile:", data);
    let imageUrl = user?.picture;
    if (data.imageUri) {
      imageUrl = await uploadImage(data.imageUri);
    }

    const payload = {
      ...user,
      ...data,
      picture: imageUrl,
    };

    const response = await fetch(`${API_BASE_URL}/auth/user/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    console.log("Update profile response:", response);
    if (response.ok) {
      const updatedUser = await response.json();
      setUser(updatedUser);
    } else {
      throw new Error("Update failed");
    }
  }

  async function logout() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        uploadImage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
