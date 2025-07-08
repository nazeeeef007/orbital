import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mealApi } from "@/apis/mealApi";
import { Meal } from "@/types/meal";
import TodayMeals from "./components/todayMeals";

export default function ChatBotScreen() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [nutrition, setNutrition] = useState<{ calories: number; carbohydrates: number; protein: number; fat: number; sugar: number; } | null>(null);
  const [invalidInput, setInvalid] = useState("");
  const [currentMeals, setMeals] = useState<Meal[]>([]);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const meals = await mealApi.fetchMeals();
        setMeals(meals);
      } catch (err) {
        console.error("Failed to fetch meals", err);
      }
    };
    fetchMeals();
  }, []);

  const handleSend = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setNutrition(null);
    setInvalid("");

    try {
      const data = await mealApi.estimateNutrition(prompt);
      setNutrition(data);
    } catch (error: any) {
      setInvalid(error.message || "Failed to fetch nutrition info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Input & Results Card */}
      <View style={styles.card}>
        <Text style={styles.header}>🥗 Nutrition Chat</Text>
        <View style={styles.inputRow}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="e.g., banana"
            style={styles.input}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#6C63FF" style={styles.loader} />}

        {invalidInput ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {invalidInput}</Text>
          </View>
        ) : null}

        {nutrition && (
          <View style={styles.resultBox}>
            <Text style={styles.resultText}>🔥 Calories: {nutrition.calories} kcal</Text>
            <Text style={styles.resultText}>🍞 Carbs: {nutrition.carbohydrates}g</Text>
            <Text style={styles.resultText}>🍗 Protein: {nutrition.protein}g</Text>
            <Text style={styles.resultText}>🥑 Fat: {nutrition.fat}g</Text>
            <Text style={styles.resultText}>🍬 Sugar: {nutrition.sugar}g</Text>
          </View>
        )}
      </View>

      {/* Today's Meals List */}
      <TodayMeals meals={currentMeals} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
    backgroundColor: "#6C63FF",
    padding: 12,
    marginLeft: 10,
    borderRadius: 10,
  },
  loader: {
    marginVertical: 12,
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 6,
    color: "#1f2937",
  },
});
