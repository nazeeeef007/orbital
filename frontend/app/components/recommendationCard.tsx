import React, { useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper'; // Assuming useTheme is from react-native-paper
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// --- Centralized Spacing Constants ---
const OUTER_HORIZONTAL_PADDING = 16;
const COLUMN_GAP = 12;

const ITEM_WIDTH = (width - (2 * OUTER_HORIZONTAL_PADDING) - COLUMN_GAP) / 2;

// --- Interface consistent with your meals schema ---
interface RecommendationCardProps {
  item: {
    id: string; // uuid
    user_id: string; // uuid
    meal_image_url: string | null;
    recipe_text: string;
    recipe_image_url: string | null; // Added based on schema
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    created_at: string; // timestamp with time zone
    cuisine?: string | null;
    meal_time?: string | null;
    diet_type?: string | null; // Added based on schema
    spice_level?: string | null; // Added based on schema
    prep_time_mins?: number | null; // integer
    price?: number | null; // numeric
    location?: string | null; // character varying

    // Client-side / derived properties
    score?: number; // Score from your recommendation logic
    likesCount: number;
    savesCount: number;
    commentsCount: number; // <--- This is the key property to use
    comments: any[]; // The actual comment objects (might be partial or empty)
    isLikedByCurrentUser?: boolean; // Client-side state
    isSavedByCurrentUser?: boolean; // Client-side state
  };
  onPress?: (item: any) => void;
  onLikePress: (mealId: string, isLiked: boolean) => void;
  onSavePress: (mealId: string, isSaved: boolean) => void;
  onCommentPress: (meal: any) => void;
  // These props are directly passed to prevent prop drilling issues if the parent re-renders
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onPress,
  onLikePress,
  onSavePress,
  onCommentPress,
  isLikedByCurrentUser, // Used directly from props
  isSavedByCurrentUser, // Used directly from props
}) => {
  const theme = useTheme(); // Assuming you have a theme provider set up with react-native-paper

  const handleCardPress = useCallback(() => {
    if (onPress) {
      onPress(item);
    }
  }, [onPress, item]);

  const handleLikePress = useCallback(() => {
    onLikePress(item.id, isLikedByCurrentUser || false);
  }, [item.id, isLikedByCurrentUser, onLikePress]);

  const handleSavePress = useCallback(() => {
    onSavePress(item.id, isSavedByCurrentUser || false);
  }, [item.id, isSavedByCurrentUser, onSavePress]);

  const handleCommentPress = useCallback(() => {
    onCommentPress(item);
  }, [item, onCommentPress]);

  // Determine if it's a homecooked meal based on schema (prep_time_mins presence implies homecooked)
  const isHomecooked = item.prep_time_mins !== null && item.prep_time_mins !== undefined;

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handleCardPress} activeOpacity={0.7}>
      <Image
        source={item.meal_image_url ? { uri: item.meal_image_url } : require('@/assets/images/icon.png')} // Fallback to a proper placeholder image
        style={styles.cardImage}
        onError={(e) => console.log('Image loading error:', e.nativeEvent.error)} // Log image errors
      />
      <View style={styles.cardContent}>
        <Text style={styles.recipeText} numberOfLines={2}>
          {item.recipe_text}
        </Text>

        {/* Display Cuisine and Meal Time if available */}
        {(item.cuisine || item.meal_time) && (
          <View style={styles.tagsContainer}>
            {item.cuisine && <Text style={styles.tagText}>{item.cuisine}</Text>}
            {item.meal_time && <Text style={styles.tagText}>{item.meal_time}</Text>}
          </View>
        )}

        <View style={styles.macrosContainer}>
          <Text style={styles.macroText}>🔥 {item.calories} kcal</Text>
          <Text style={styles.macroText}>🍗 {item.protein}g P</Text>
          <Text style={styles.macroText}>🍚 {item.carbs}g C</Text>
          <Text style={styles.macroText}>🥑 {item.fat}g F</Text>
        </View>

        {/* Display Score, Prep Time, Price, or Location conditionally */}
        <View style={styles.additionalInfoContainer}>
          {item.score !== undefined && (
            <Text style={styles.scoreText}>Score: {item.score.toFixed(1)}</Text>
          )}

          {isHomecooked ? (
            item.prep_time_mins !== undefined && item.prep_time_mins !== null && (
              <Text style={styles.locationPriceText}>⏱️ {item.prep_time_mins} mins</Text>
            )
          ) : (
            <>
              {item.price !== undefined && item.price !== null && item.price > 0 && (
                <Text style={styles.locationPriceText}>
                  💲 {item.price.toFixed(2)}{' '}
                  {/* Assuming USD, adjust currency symbol as needed */}
                </Text>
              )}
              {item.location && item.location !== 'Homecooked' && ( // Don't show 'Homecooked' as location here
                <Text style={styles.locationPriceText}>📍 {item.location}</Text>
              )}
            </>
          )}
        </View>

        {/* Interaction Buttons */}
        <View style={styles.interactionContainer}>
          <TouchableOpacity onPress={handleLikePress} style={styles.interactionButton}>
            <Ionicons
              name={isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={20}
              color={isLikedByCurrentUser ? '#FE2C55' : '#757575'} // Deeper grey for outline
            />
            <Text style={styles.interactionCount}>{item.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSavePress} style={styles.interactionButton}>
            <Ionicons
              name={isSavedByCurrentUser ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isSavedByCurrentUser ? '#4CAF50' : '#757575'}
            />
            <Text style={styles.interactionCount}>{item.savesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleCommentPress} style={styles.interactionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#757575" />
            {/* CORRECTED LINE: Use item.commentsCount here */}
            <Text style={styles.interactionCount}>{item.commentsCount || 0}</Text> 
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
    borderRadius: 16, // More rounded corners
    overflow: 'hidden',
    marginBottom: 20, // Increased margin for better spacing between rows
    elevation: 6, // Stronger shadow for more pop
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, // Slightly more opaque shadow
    shadowRadius: 8, // Larger shadow radius
  },
  cardImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.9, // Slightly taller image proportion
    resizeMode: 'cover',
    backgroundColor: '#F5F5F5', // Lighter background for placeholder
    borderTopLeftRadius: 16, // Match container radius
    borderTopRightRadius: 16, // Match container radius
  },
  cardContent: {
    padding: 12,
  },
  recipeText: {
    fontSize: 16, // Slightly larger font
    fontWeight: '700', // Bolder for main title
    color: '#333333',
    marginBottom: 6, // Slightly reduced margin
    minHeight: 40, // Ensure consistent height for two lines
    lineHeight: 20, // Improve readability for multi-line text
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    marginTop: 4,
  },
  tagText: {
    fontSize: 10, // Smaller for tags
    fontWeight: '600',
    color: '#5C6BC0', // A nice blue for tags
    backgroundColor: '#E8EAF6', // Light blue background for tags
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
    overflow: 'hidden', // Ensure text stays within rounded background
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8, // More space below macros
  },
  macroText: {
    fontSize: 13, // Slightly larger macro text
    color: '#616161', // Darker grey for better contrast
    marginRight: 10,
    marginBottom: 4,
    fontWeight: '500', // Medium weight
  },
  additionalInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align right
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '600',
    marginRight: 'auto', // Pushes score to the left
  },
  locationPriceText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
    marginLeft: 8,
  },
  interactionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12, // Increased margin
    paddingTop: 10, // Increased padding
    borderTopWidth: StyleSheet.hairlineWidth, // Thinner, subtle line
    borderTopColor: '#ECEFF1', // Very light grey
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8, // More horizontal padding for touch target
    paddingVertical: 4,
  },
  interactionCount: {
    fontSize: 14, // Slightly larger count
    color: '#616161', // Darker grey for count
    marginLeft: 6, // More space from icon
    fontWeight: '600',
  },
});

export default RecommendationCard;