import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from 'expo-secure-store'; // ⬅️ add this at the top
import axios from "axios";
import { BASE_URL } from "@/config";


export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const token = await SecureStore.getItemAsync("authToken");
      if (!token) throw new Error("No token found");

      // Call backend to invalidate session
      await axios.post(`http://${BASE_URL}:3000/api/auth/logout`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Clear local token AFTER backend confirms
      console.log("logging out token: ", token)
      await SecureStore.deleteItemAsync("authToken");
      
      console.log(await SecureStore.getItemAsync("authToken"));
      // Navigate to login
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleViewMeals = () => router.push("/meal");
  const handleUpload = () => router.push("/upload");
  const handleStartChat = () => router.push("/chatBot");
  const handleViewProfile = () => router.push("/profile");
  const handleSearch = () => router.push("/search");

  return (
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

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleViewMeals}
        >
          <Ionicons name="restaurant-outline" size={20} color="#7c3aed" />
          <Text style={styles.outlineText}>View Meals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleUpload}
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#7c3aed" />
          <Text style={styles.outlineText}>Upload Meal</Text>
        </TouchableOpacity>

         <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleViewProfile}
        >
          <Ionicons name="person-outline" size={20} color="#7c3aed" />
          <Text style={styles.outlineText}>View Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleSearch}
        >
          <Ionicons name="person-outline" size={20} color="#7c3aed" />
          <Text style={styles.outlineText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7c3aed",
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
    backgroundColor: "#7c3aed",
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
});
