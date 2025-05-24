import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ChatBotScreen() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState<null | {
    calories: number;
    carbohydrates: number;
    protein: number;
    fat: number;
    sugar: number;
  }>(null);
  const [invalidInput, setInvalid] = useState("");

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setNutrition(null);
    setInvalid("");

    try {
      const res = await fetch("http://localhost:3000/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      if (!res.ok) {
        setInvalid(data.error);
        throw new Error(data.error || "Unknown backend error");
      }

      console.log(data);
      setNutrition(data);
    } catch (error) {
      console.log(invalidInput);
      console.error("Error fetching nutrition:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🥗 Nutrition Chat</Text>

      <View style={styles.inputRow}>
        <TextInput
          value={prompt}
          onChangeText={setPrompt}
          placeholder="e.g., banana"
          style={styles.input}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={loading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading && (
        <ActivityIndicator
          size="large"
          color="#4f46e5"
          style={{ marginTop: 20 }}
        />
      )}

      {invalidInput && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {invalidInput}</Text>
        </View>
      )}

      {!invalidInput && nutrition && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>
            🔥 Calories: {nutrition.calories} kcal
          </Text>
          <Text style={styles.resultText}>
            🍞 Carbs: {nutrition.carbohydrates}g
          </Text>
          <Text style={styles.resultText}>
            🍗 Protein: {nutrition.protein}g
          </Text>
          <Text style={styles.resultText}>🥑 Fat: {nutrition.fat}g</Text>
          <Text style={styles.resultText}>🍬 Sugar: {nutrition.sugar}g</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#111827",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#4f46e5",
    padding: 12,
    marginLeft: 10,
    borderRadius: 10,
  },
  resultBox: {
    marginTop: 30,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 8,
    color: "#1f2937",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
    fontSize: 14,
  },
});
