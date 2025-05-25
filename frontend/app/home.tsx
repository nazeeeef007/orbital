import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => router.replace("/login");
  const handleViewMeals = () => router.push("/meal");
  const handleUpload = () => router.push("/upload");
  const handleStartChat = () => router.push("/chatBot");
  const handleViewProfile = () => router.push("/profile");

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
