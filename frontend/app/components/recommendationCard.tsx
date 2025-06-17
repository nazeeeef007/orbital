import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper'; // If you're using react-native-paper theme

const { width } = Dimensions.get('window');

// --- Centralized Spacing Constants ---
const OUTER_HORIZONTAL_PADDING = 16; // Padding on the sides of the FlatList content in RecommendationScreen
const COLUMN_GAP = 12; // Space *between* the two columns of cards

// Calculate ITEM_WIDTH precisely
const ITEM_WIDTH = (width - (2 * OUTER_HORIZONTAL_PADDING) - COLUMN_GAP) / 2;

// Renamed interface for clarity and convention (PascalCase for interfaces)
interface RecommendationCardProps {
  item: {
    id: string;
    recipe_text: string;
    meal_image_url: string | null; // Can be string | null
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    cuisine?: string | null;
    meal_time?: string | null;
    score?: number;
  };
  onPress?: (item: any) => void; // Optional onPress handler
}

// Renamed the component function to follow PascalCase convention
const RecommendationCard: React.FC<RecommendationCardProps> = ({ item, onPress }) => {
  const theme = useTheme(); // For consistent theming (if used for colors, etc.)

  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress} activeOpacity={0.8}>
      <Image
        source={item.meal_image_url ? { uri: item.meal_image_url } : require('@/assets/images/favicon.png')}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.recipeText} numberOfLines={2}>
          {item.recipe_text}
        </Text>
        <View style={styles.macrosContainer}>
          <Text style={styles.macroText}>🔥 {item.calories} kcal</Text>
          <Text style={styles.macroText}>🍗 {item.protein}g P</Text>
          {item.carbs !== undefined && <Text style={styles.macroText}>🍚 {item.carbs}g C</Text>}
          {item.fat !== undefined && <Text style={styles.macroText}>🥑 {item.fat}g F</Text>}
        </View>
        {item.score !== undefined && (
          <Text style={styles.scoreText}>Score: {item.score.toFixed(1)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF', // Clean white background
    borderRadius: 12, // Slightly smaller radius for a sharper look
    overflow: 'hidden',
    marginBottom: 16,

    // Refined shadows for a subtle lift
    elevation: 4, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, // Reduced opacity
    shadowRadius: 6, // Softer radius
  },
  cardImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.8,
    resizeMode: 'cover',
    backgroundColor: '#E0E0E0', // Muted placeholder background
  },
  cardContent: {
    padding: 12,
  },
  recipeText: {
    fontSize: 15, // Slightly smaller for a more refined feel
    fontWeight: '600', // Medium bold
    color: '#333333', // Darker grey for primary text
    marginBottom: 8,
    minHeight: 40,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  macroText: {
    fontSize: 12, // Smaller and more subtle
    color: '#666666', // Muted grey for secondary info
    marginRight: 10,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11, // Even smaller for tertiary info
    color: '#888888',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default RecommendationCard;