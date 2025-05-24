import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.replace("/login");
  };

  const handleReportIncident = () => {
    router.push("/reportIncident");
  };

  const handleIncidentFeed = () => {
    router.push("/incidentFeed");
  };

  const handleStartChat = () => {
    router.push("/chatBot");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="home-outline" size={32} color="#fff" />
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
          style={[styles.button, styles.reportButton]}
          onPress={handleStartChat}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Start Chat</Text>
        </TouchableOpacity>
        {/* Report Incident Button */}
        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={handleReportIncident}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}>Report Incident</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={handleIncidentFeed}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle-outline" size={22} color="#fff" />
          <Text style={styles.buttonText}> View Incident Feed</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Ionicons name="person-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>View Profile</Text>
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
    backgroundColor: "#f3f4f6",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4f46e5",
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    justifyContent: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 12,
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
    color: "#111827",
  },
  subText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  actions: {
    gap: 16,
  },
  button: {
    backgroundColor: "#6366f1",
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 10,
    justifyContent: "center",
  },
  reportButton: {
    backgroundColor: "#dc2626", // A bold red color for urgency
  },
  logoutButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 8,
    fontWeight: "500",
  },
});
