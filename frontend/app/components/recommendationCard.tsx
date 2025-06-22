import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native'; // Removed Alert
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Centralized Spacing Constants ---
const OUTER_HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 12;

const ITEM_WIDTH = (width - (2 * OUTER_HORIZONTAL_PADDING) - COLUMN_GAP) / 2;

interface RecommendationCardProps {
  item: {
    id: string;
    recipe_text: string;
    meal_image_url: string | null;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    cuisine?: string | null;
    meal_time?: string | null;
    score?: number;
    likesCount: number; // Added from backend
    savesCount: number; // Added from backend
    comments: any[]; // Added from backend (can be an empty array)
    isLikedByCurrentUser?: boolean; // Client-side state
    isSavedByCurrentUser?: boolean; // Client-side state
  };
  onPress?: (item: any) => void;
  // userId: string | null; // <-- REMOVED THIS PROP
  onLikePress: (mealId: string, isLiked: boolean) => void;
  onSavePress: (mealId: string, isSaved: boolean) => void;
  onCommentPress: (meal: any) => void; // Pass the whole meal object for comments
  isLikedByCurrentUser?: boolean; // Re-declare for direct prop access
  isSavedByCurrentUser?: boolean; // Re-declare for direct prop access
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onPress,
  // userId, // <-- REMOVED FROM DESTRUCTURING
  onLikePress,
  onSavePress,
  onCommentPress,
  isLikedByCurrentUser,
  isSavedByCurrentUser,
}) => {
  const theme = useTheme();

  const handleCardPress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  // useCallback for action handlers to prevent unnecessary re-renders of icons
  const handleLikePress = useCallback(() => {
    // --- REMOVED THE userId CHECK HERE ---
    console.log(`RecommendationCard: Like button pressed for meal ID: ${item.id}`); // Debug log
    onLikePress(item.id, isLikedByCurrentUser || false);
  }, [item.id, isLikedByCurrentUser, onLikePress]); // Removed userId from dependencies

  const handleSavePress = useCallback(() => {
    // --- REMOVED THE userId CHECK HERE ---
    console.log(`RecommendationCard: Save button pressed for meal ID: ${item.id}`); // Debug log
    onSavePress(item.id, isSavedByCurrentUser || false);
  }, [item.id, isSavedByCurrentUser, onSavePress]); // Removed userId from dependencies

  const handleCommentPress = useCallback(() => {
    // --- REMOVED THE userId CHECK HERE ---
    console.log(`RecommendationCard: Comment button pressed for meal ID: ${item.id}`); // Debug log
    onCommentPress(item);
  }, [item, onCommentPress]); // Removed userId from dependencies

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handleCardPress} activeOpacity={0.8}>
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

        {/* Interaction Buttons */}
        <View style={styles.interactionContainer}>
          <TouchableOpacity onPress={handleLikePress} style={styles.interactionButton}>
            <Ionicons name={isLikedByCurrentUser ? "heart" : "heart-outline"} size={20} color={isLikedByCurrentUser ? "#FE2C55" : "#666666"} />
            <Text style={styles.interactionCount}>{item.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSavePress} style={styles.interactionButton}>
            <Ionicons name={isSavedByCurrentUser ? "bookmark" : "bookmark-outline"} size={20} color={isSavedByCurrentUser ? "#4CAF50" : "#666666"} />
            <Text style={styles.interactionCount}>{item.savesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCommentPress} style={styles.interactionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#666666" />
            <Text style={styles.interactionCount}>{item.comments?.length || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: ITEM_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.8,
    resizeMode: 'cover',
    backgroundColor: '#E0E0E0',
  },
  cardContent: {
    padding: 12,
  },
  recipeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    minHeight: 40,
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  macroText: {
    fontSize: 12,
    color: '#666666',
    marginRight: 10,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'right',
    marginTop: 4,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  interactionCount: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 5,
  },
});

export default RecommendationCard;