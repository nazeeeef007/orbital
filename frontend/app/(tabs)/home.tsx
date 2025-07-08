import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { BASE_URL } from "@/config";
import MacroHistoryChart from "../components/MacroHistoryChart";
import { useAuth } from "../../hooks/useAuth";

// Define the DailyMacroHistory interface as it's used here
interface DailyMacroHistory {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Define the UserProfile interface to match your 'profiles' table structure
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  location: string;
  website: string;
  avatar_url: string;
  calories_goal: number;
  protein_goal: number;
  carbs_goal: number;
  fat_goal: number;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  // Add other fields from your profiles table if needed
}

export default function HomeScreen() {
  const router = useRouter();
  const { logout: authLogout } = useAuth();
  const [macroHistory, setMacroHistory] = useState<DailyMacroHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loggedInUserDisplayName, setLoggedInUserDisplayName] = useState<string>("User");
  const [loggedInUserAvatar, setLoggedInUserAvatar] = useState<string>("https://i.pravatar.cc/150?img=12");
  // Optional: State to store full profile data if you need to display other fields later
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchUserDataAndMacroHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const storedToken = await SecureStore.getItemAsync("authToken");
      if (!storedToken) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // 1. Fetch logged-in user's basic ID from auth endpoint
      const authRes = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      let userAuthInfo: { id: string } | null = null;
      if (authRes.data && authRes.data.user && typeof authRes.data.user.id === 'string') {
        userAuthInfo = authRes.data.user;
      } else if (authRes.data && typeof authRes.data.id === 'string') {
        userAuthInfo = authRes.data;
      }

      if (!userAuthInfo || !userAuthInfo.id) {
        throw new Error("Could not verify user. Please log in again.");
      }

      // 2. Fetch full profile data using the user's ID
      const profileRes = await axios.get<UserProfile>(`${BASE_URL}/api/profile/${userAuthInfo.id}`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const profileData = profileRes.data;

      // Update states with data from the full profile
      setLoggedInUserDisplayName(profileData.display_name || profileData.username || "User");
      if (profileData.avatar_url) {
        setLoggedInUserAvatar(profileData.avatar_url);
      } else {
        setLoggedInUserAvatar("https://i.pravatar.cc/150?img=12"); // Default avatar if none is set
      }
      setUserProfile(profileData); // Store full profile data

      // 3. Fetch macro history using the user's ID
      const historyRes = await axios.get< { data: DailyMacroHistory[] } >(`${BASE_URL}/api/macro/${userAuthInfo.id}/history`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      setMacroHistory(historyRes.data.data || []);

    } catch (err: any) {
      console.error("Failed to fetch user data or macro history:", err);
      if (err.response) {
        console.error("API Response Error Data:", err.response.data);
        console.error("API Response Status:", err.response.status);
      }
      setError(err.message || "Failed to load data. Please try again.");
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.", [
          { text: "OK", onPress: authLogout }
        ]);
      }
    } finally {
      setLoading(false);
    }
  }, [authLogout]);

  useEffect(() => {
    fetchUserDataAndMacroHistory();
  }, [fetchUserDataAndMacroHistory]);

  const handleLogout = async () => {
    await authLogout();
  };

  const handleStartChat = () => router.push("/chatBot");

  // New handler to navigate to the user's profile
  const handleViewProfile = () => {
    if (userProfile?.id) {
      router.push(`/profile`);
    } else {
      Alert.alert("Profile Not Loaded", "Could not load profile information. Please try again later.");
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="home-outline" size={28} color="#fff" />
          <Text style={styles.headerText}>Welcome Home</Text>
        </View>

        <View style={styles.profileSection}>
          {/* Wrap the Image with TouchableOpacity */}
          <TouchableOpacity onPress={handleViewProfile}>
            <Image
              source={{ uri: loggedInUserAvatar }}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <Text style={styles.welcomeText}>Hello, {loggedInUserDisplayName} 👋</Text>
          <Text style={styles.subText}>Glad to see you again.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleStartChat}
          >
            <Ionicons name="chatbox-ellipses-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Start Chat</Text>
          </TouchableOpacity>

          {/* Conditional rendering for Macro History Chart */}
          <View style={styles.macroChartWrapper}>
            {loading ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.chartLoadingText}>Loading macro history...</Text>
              </View>
            ) : error ? (
              <View style={styles.chartErrorContainer}>
                <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
                <Text style={styles.chartErrorText}>{error}</Text>
              </View>
            ) : macroHistory.length > 0 ? (
              <MacroHistoryChart macroHistory={macroHistory} />
            ) : (
              <View style={styles.chartErrorContainer}>
                <Ionicons name="stats-chart-outline" size={30} color="#6b7280" />
                <Text style={styles.chartErrorText}>No macro history available. Start logging your daily macros!</Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    justifyContent: "center",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#1f2937",
  },
  subText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  actions: {
    gap: 14,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    justifyContent: "center",
  },
  primaryButton: {
    backgroundColor: '#6C63FF',
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    marginTop: 10,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: "#7c3aed",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 8,
    fontWeight: "600",
  },
  outlineText: {
    color: "#7c3aed",
    fontSize: 15,
    marginLeft: 8,
    fontWeight: "600",
  },
  macroChartWrapper: {
    marginVertical: 20,
  },
  chartLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  chartLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6b7280',
  },
  chartErrorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  chartErrorText: {
    marginTop: 10,
    fontSize: 14,
    color: '#ef4444',
    textAlign: 'center',
    marginHorizontal: 20,
  },
});