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

const TodayMeals = ({ meals }: Props) => {
  const todayMeals = meals;

  if (todayMeals.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Text style={styles.emptyIcon}>🍽️</Text>
        </View>
        <Text style={styles.emptyTitle}>No meals logged today</Text>
        <Text style={styles.emptySubtitle}>
          Start tracking your nutrition by adding your first meal!
        </Text>
      </View>
    );
  }

  const totalCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs   = todayMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat     = todayMeals.reduce((sum, meal) => sum + meal.fat, 0);

  return (
    <View style={styles.container}>
      {/* Combined Header & Summary Card */}
      <View style={styles.topCard}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Today's Meals</Text>
          <View style={styles.mealCountBadge}>
            <Text style={styles.mealCountText}>{todayMeals.length}</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Track your daily nutrition intake
        </Text>

        <View style={styles.summaryRow}>
          {[ 
            { value: totalCalories.toFixed(0), label: 'Calories' },
            { value: `${totalProtein.toFixed(0)}g`, label: 'Protein' },
            { value: `${totalCarbs.toFixed(0)}g`, label: 'Carbs' },
            { value: `${totalFat.toFixed(0)}g`, label: 'Fat' },
          ].map((item, idx) => (
            <React.Fragment key={idx}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summaryLabel}>{item.label}</Text>
              </View>
              {idx < 3 && <View style={styles.summaryDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Meals List */}
      <FlatList
        data={todayMeals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.8}>
            <View style={styles.cardHeader}>
              <View style={styles.mealNumberBadge}>
                <Text style={styles.mealNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>
                  {new Date(item.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <Image
              source={{ uri: item.meal_image_url }}
              style={styles.mainImage}
            />

            <View style={styles.infoContainer}>
              <Text style={styles.caption} numberOfLines={2}>
                {item.recipe_text}
              </Text>

              <View style={styles.macrosContainer}>
                {[ 
                  { icon: "🔥", value: item.calories, label: "kcal" },
                  { icon: "🍗", value: `${item.protein}g`, label: "protein" },
                  { icon: "🍞", value: `${item.carbs}g`, label: "carbs" },
                  { icon: "🥑", value: `${item.fat}g`, label: "fat" },
                ].map((macro, idx) => (
                  <View style={styles.macroItem} key={idx}>
                    <View style={styles.macroIconContainer}>
                      <Text style={styles.macroIcon}>{macro.icon}</Text>
                    </View>
                    <Text style={styles.macroValue}>{macro.value}</Text>
                    <Text style={styles.macroLabel}>{macro.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 0,          // removed extra space
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#6C63FF",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  // Combined Top Card (Header + Summary)
  topCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 8,          // closer to top
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  mealCountBadge: {
    backgroundColor: "#6C63FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  mealCountText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 12,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "700",
    color: "#6C63FF",
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 6,
  },

  // List
  listContainer: {
    padding: 12,
    paddingBottom: 80,
    backgroundColor: "#fff",
    marginTop: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 300,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  mealNumberBadge: {
    backgroundColor: "#6C63FF",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  mealNumberText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  timeContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },

  // Image
  mainImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#f3f4f6",
  },

  // Info
  infoContainer: {
    padding: 16,
  },
  caption: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 22,
  },

  // Macros
  macrosContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: "center",
  },
  macroIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  macroIcon: {
    fontSize: 16,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 10,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

export default TodayMeals;
