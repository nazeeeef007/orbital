import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { BASE_URL } from "@/config";
import MacroHistoryChart from "../components/MacroHistoryChart";
import { useAuth } from "../../hooks/useAuth"; // Make sure this path is correct

// --- Interfaces ---
interface DailyMacroHistory {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// UserProfile interface is no longer needed here if it's imported from useAuth or a shared types file
// but kept for clarity if you have other local uses of it.
// Ideally, it would be a shared type.
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  calories_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
}


// --- HomeScreen Component ---
export default function HomeScreen() {
  const router = useRouter();
  // Destructure `user`, `logout`, `authToken`, and `loading` from useAuth
  const { user, logout: authLogout, authToken, loading: authLoading } = useAuth(); // Access user profile and auth state from context

  const [macroHistory, setMacroHistory] = useState<DailyMacroHistory[]>([]);
  const [loadingMacroHistory, setLoadingMacroHistory] = useState(true); // Separate loading state for history
  const [errorMacroHistory, setErrorMacroHistory] = useState<string | null>(null); // Separate error for history

  // Derive display name and avatar directly from the `user` object from useAuth
  const loggedInUserDisplayName = user?.display_name || user?.username || "User";
  const loggedInUserAvatar = user?.avatar_url || "https://i.pravatar.cc/150?img=12";

  // Function to fetch only macro history now
  const fetchMacroHistory = useCallback(async () => {
    setLoadingMacroHistory(true);
    setErrorMacroHistory(null);

    // Ensure we have a user ID and token from the global context before fetching history
    if (!user?.id || !authToken) {
      setErrorMacroHistory("User not authenticated or profile not loaded.");
      setLoadingMacroHistory(false);
      return;
    }

    try {
      const historyRes = await axios.get<{ data: DailyMacroHistory[] }>(`${BASE_URL}/api/macro/${user.id}/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      setMacroHistory(historyRes.data.data || []);

    } catch (err: any) {
      console.error("Failed to fetch macro history:", err);
      if (err.response) {
        console.error("API Response Error Data:", err.response.data);
        console.error("API Response Status:", err.response.status);
      }
      setErrorMacroHistory(err.message || "Failed to load macro history. Please try again.");
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.", [
          { text: "OK", onPress: authLogout }
        ]);
      }
    } finally {
      setLoadingMacroHistory(false);
    }
  }, [user?.id, authToken, authLogout]); // Depend on user.id, authToken, and authLogout

  // Effect to fetch macro history when user/token changes or component mounts
  useEffect(() => {
    // Only fetch macro history if user and authToken are available and auth context is not globally loading
    if (!authLoading && user && authToken) {
      fetchMacroHistory();
    }
  }, [authLoading, user, authToken, fetchMacroHistory]); // Re-run when these dependencies change

  const handleLogout = async () => {
    await authLogout();
  };

  const handleStartChat = () => router.push("/chatBot");

  const handleViewProfile = () => {
    // Navigate to profile using the user's ID from the global state
    if (user?.id) {
      router.push(`/profile`); // Assuming your profile route can fetch its own data or takes user ID as param
      // If /profile needs the user ID, you might do: router.push(`/profile/${user.id}`);
    } else {
      Alert.alert("Profile Not Loaded", "Could not load profile information. Please try again later.");
    }
  };

  // If the AuthContext is still determining the auth state, show a global loading indicator
  // This is usually handled by the _layout.tsx wrapping AuthProvider
  if (authLoading) {
    // You might not need this if _layout.tsx handles a full splash screen
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Loading app data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="home-outline" size={28} color="#fff" />
          <Text style={styles.headerText}>Welcome Home</Text>
        </View>

        <View style={styles.profileSection}>
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
            {loadingMacroHistory ? (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={styles.chartLoadingText}>Loading macro history...</Text>
              </View>
            ) : errorMacroHistory ? (
              <View style={styles.chartErrorContainer}>
                <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
                <Text style={styles.chartErrorText}>{errorMacroHistory}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
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