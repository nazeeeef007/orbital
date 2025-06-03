// TodayMeals.tsx
import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Meal } from "@/types/meal";

type Props = {
  meals: Meal[];
};

const TodayMeals = ({ meals}: Props) => {
  const now = new Date();
  const todayMeals = meals;
  // .filter((m) => {
  //   const d = new Date(m.created_at);
  //   return (
  //     d.getFullYear() === now.getFullYear() &&
  //     d.getMonth() === now.getMonth() &&
  //     d.getDate() === now.getDate()
  //   );
  // });

  if (todayMeals.length === 0) {
    return (
      <View style={{ padding: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 16, color: "#666" }}>
          No meals logged today.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>🍽️ Meals Logged Today</Text>
        <Text style={styles.headerSubtitle}>
          Here are all the meals you've added today.
        </Text>
      </View>
      <FlatList
        data={todayMeals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
   
              <Image
                source={{ uri: item.meal_image_url }}
                style={styles.mainImage}
              />

            <View style={styles.infoContainer}>
              <Text style={styles.caption}>{item.recipe_text}</Text>

              <View style={styles.macrosRow}>
                <Text style={styles.macro}>🔥 {item.calories} kcal</Text>
                <Text style={styles.macro}>🍗 {item.protein}g</Text>
                <Text style={styles.macro}>🍞 {item.carbs}g</Text>
                <Text style={styles.macro}>🥑 {item.fat}g</Text>
              </View>
            </View>
          </View>
        )}
      />
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
mainImage: {
  width: '100%',
  height: 120, 
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
},
  infoContainer: {
    padding: 16,
  },
  caption: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  macro: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  recipeImage: {
    width: "100%",
    height: 130,
    borderRadius: 12,
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f1f1",
  },
  footerButton: {
    padding: 6,
    borderRadius: 8,
  },
  footerIcon: {
    fontSize: 22,
    opacity: 0.85,
  },
  headerContainer: {
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4338ca",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#4b5563",
  },
  
});

export default TodayMeals;
