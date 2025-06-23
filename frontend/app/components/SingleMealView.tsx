import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  LayoutAnimation, // Import LayoutAnimation
  UIManager, // Import UIManager for Android LayoutAnimation
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const { width } = Dimensions.get('window');

// Extended MealItem to match backend's enriched data for this component
interface Comment {
  content: string;
  created_at: string;
  user_id: string;
  username?: string;
}

interface MealItem {
  id: string;
  user_id?: string;
  meal_image_url: string | null;
  recipe_text: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  created_at: string;
  cuisine: string | null;
  meal_time: string | null;
  course_type: string | null;
  diet_type: string | null;
  spice_level: string | null;
  prep_time_mins: number | null;
  serving_size: string | null;
  score: number;
  likesCount: number;
  savesCount: number;
  comments: Comment[];
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
  // --- NEW: Add location property ---
  location: string | null;
}

interface SingleMealViewProps {
  meal: MealItem;
  onLikePress: (mealId: string, isLiked: boolean) => void;
  onSavePress: (mealId: string, isSaved: boolean) => void;
  onCommentPress: (meal: MealItem) => void;
  onClose: () => void;
}

const SingleMealView: React.FC<SingleMealViewProps> = ({
  meal,
  onLikePress,
  onSavePress,
  onCommentPress,
  onClose,
}) => {
  const [imageHeight, setImageHeight] = useState(width); // Default to a square aspect ratio
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const timeAgo = formatDistanceToNowStrict(new Date(meal.created_at), { addSuffix: true });

  // Use useCallback to memoize render functions
  const handleActionPress = useCallback((action: () => void) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(action); // Call action after animation completes
  }, [scaleAnim]);

  const renderMacroCard = useCallback((value: string, label: string, color: string, icon: string) => (
    <View style={[styles.macroCard, { shadowColor: color }]} key={label}>
      <View style={[styles.macroIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={18} color="#fff" />
      </View>
      <View>
        <Text style={[styles.macroValue, { color }]}>{value}</Text>
        <Text style={styles.macroLabel}>{label}</Text>
      </View>
    </View>
  ), []); // Dependencies are stable

  const renderDetailRow = useCallback((icon: string, label: string, value: string | null | undefined) => {
    if (!value || value.trim() === '') {
      return null;
    }
    return (
      <View style={styles.detailRow} key={label}>
        <View style={styles.detailIconContainer}>
          <Ionicons name={icon as any} size={22} color="#4B5563" />
        </View>
        <View style={styles.detailTextContainer}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      </View>
    );
  }, []); // Dependencies are stable

  // Use `onLoadEnd` for image to ensure correct height is set once loaded
  const handleImageLoad = useCallback((event: any) => {
    const { width: imgWidth, height: imgHeight } = event.nativeEvent.source;
    const aspectRatio = imgHeight / imgWidth;
    setImageHeight(width * aspectRatio);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meal Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
        // Increase scroll responsiveness on iOS (optional, but can help perceived smoothness)
        scrollEventThrottle={16} // Defaults to 0, setting to 16ms (60fps)
      >
        {/* Main Image */}
        {meal.meal_image_url && (
          <Image
            source={{ uri: meal.meal_image_url }}
            style={[styles.mealImage, { height: imageHeight }]}
            onError={(e) => console.log('SingleMealView Image loading error:', e.nativeEvent.error)}
            onLoad={handleImageLoad} // Use the memoized handler
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Timestamp */}
          <View style={styles.titleSection}>
            <Text style={styles.mealTitle}>{meal.recipe_text}</Text>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>

          {/* Action Bar */}
          <View style={styles.actionBar}>
            <View style={styles.actionGroup}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPress={() => handleActionPress(() => onLikePress(meal.id, !meal.isLikedByCurrentUser))}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={meal.isLikedByCurrentUser ? 'heart' : 'heart-outline'}
                    size={28}
                    color={meal.isLikedByCurrentUser ? '#EF4444' : '#374151'}
                  />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                onPress={() => handleActionPress(() => onCommentPress(meal))}
                style={styles.actionButton}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-outline" size={28} color="#374151" />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <TouchableOpacity
                  onPress={() => handleActionPress(() => onSavePress(meal.id, !meal.isSavedByCurrentUser))}
                  style={styles.actionButton}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={meal.isSavedByCurrentUser ? 'bookmark' : 'bookmark-outline'}
                    size={28}
                    color={meal.isSavedByCurrentUser ? '#F59E0B' : '#374151'}
                  />
                </TouchableOpacity>
              </Animated.View>
            </View>
            <View style={styles.statsGroup}>
              <Text style={styles.statText}>{meal.likesCount} likes</Text>
              <Text style={styles.statText}>{meal.comments.length} comments</Text>
              <Text style={styles.statText}>{meal.savesCount} saves</Text>
            </View>
          </View>

          {/* Nutrition Cards */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>
            <View style={styles.macroGrid}>
              {renderMacroCard(meal.calories.toString(), 'Calories', '#F59E0B', 'flash-outline')}
              {renderMacroCard(`${meal.protein}g`, 'Protein', '#EF4444', 'barbell-outline')}
              {renderMacroCard(`${meal.carbs}g`, 'Carbs', '#10B981', 'leaf-outline')}
              {renderMacroCard(`${meal.fat}g`, 'Fat', '#8B5CF6', 'water-outline')}
            </View>
          </View>

          {/* Meal Details */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Meal Information</Text>
            <View style={styles.detailsCard}>
              {renderDetailRow('restaurant-outline', 'Cuisine', meal.cuisine)}
              {renderDetailRow('time-outline', 'Meal Time', meal.meal_time)}
              {renderDetailRow('pizza-outline', 'Course Type', meal.course_type)}
              {renderDetailRow('leaf-outline', 'Diet Type', meal.diet_type)}
              {renderDetailRow('flame-outline', 'Spice Level', meal.spice_level)}
              {meal.prep_time_mins !== null && meal.prep_time_mins > 0 && renderDetailRow('hourglass-outline', 'Prep Time', `${meal.prep_time_mins} minutes`)}
              {renderDetailRow('people-outline', 'Serving Size', meal.serving_size)}
              {/* --- NEW: Render Location --- */}
              {renderDetailRow('location-outline', 'Location', meal.location)}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  mealImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  content: {
    backgroundColor: '#F9FAFB',
    paddingBottom: 24,
  },
  titleSection: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    lineHeight: 32,
  },
  timestamp: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionBar: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 20,
  },
  actionButton: {
    padding: 4,
  },
  statsGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  statText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sectionContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    width: (width - 64) / 2, // Adjusted for padding and gap
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E7EB',
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});

export default SingleMealView;