import React, { useState, useEffect } from "react"; // ⬅️ Import useState and useEffect
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"; // ⬅️ Add ActivityIndicator
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import { BASE_URL } from "@/config";
import MacroHistoryChart from "../components/MacroHistoryChart";

// Define the DailyMacroHistory interface as it's used here
interface DailyMacroHistory {
  id: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [macroHistory, setMacroHistory] = useState<DailyMacroHistory[]>([]); // ⬅️ State to store macro history
  const [loading, setLoading] = useState(true); // ⬅️ State for loading indicator
  const [error, setError] = useState<string | null>(null); // ⬅️ State for error messages

  // ⬅️ useEffect to fetch macro history when the component mounts
  useEffect(() => {
    const fetchMacroHistory = async () => {
      try {
        setLoading(true);
        setError(null); // Clear previous errors

        const storedToken = await SecureStore.getItemAsync("authToken");
        if (!storedToken) {
          throw new Error("Authentication token not found.");
        }

        const historyRes = await axios.get(`${BASE_URL}/api/macro/history`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        // Assuming historyRes.data.data is an array of DailyMacroHistory
        setMacroHistory(historyRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch macro history:", err);
        setError("Failed to load macro history. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchMacroHistory();
  }, []); // Empty dependency array means this runs once on component mount

  const handleLogout = async () => {
    try {
      
      
      
      router.replace("/login");
    } catch (logoutError) {
      console.error("Logout error:", logoutError);
      // Optionally show a user-friendly message for logout error
    }
  };

  const handleStartChat = () => router.push("/chatBot");


  return (
    <ScrollView style={{flex: 1, backgroundColor: "#f9fafb"}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="home-outline" size={28} color="#fff" />
          <Text style={styles.headerText}>Welcome Home</Text>
        </View>

        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=12" }}
            style={styles.avatar}
          />
          <Text style={styles.welcomeText}>Hello, User 👋</Text>
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
            ) : (
              <MacroHistoryChart macroHistory={macroHistory} />
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
    paddingHorizontal: 24, // Consistent horizontal padding for the screen
    paddingBottom: 40, // Add some padding at the bottom for scroll comfort
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
    gap: 14, // Consistent spacing between action items
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
    marginTop: 10, // Added margin top to separate from other buttons/chart
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
  // New style for the chart wrapper
  macroChartWrapper: {
    marginVertical: 20, // Adds vertical space around the chart component
    // The MacroHistoryChart component itself handles its own background/padding
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