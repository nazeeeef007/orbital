import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

// --- Consistent Color Palette (Refined slightly for sleekness) ---
const Colors = {
  primary: '#4f46e5', // Deeper Indigo for primary actions and key elements
  secondary: '#8b5cf6', // Violet for secondary actions/accents
  background: '#F0F2F5', // Light grey for a clean background
  cardBackground: '#FFFFFF', // White for card-like elements
  textPrimary: '#1F2937', // Darker text for main content (almost black)
  textSecondary: '#6B7280', // Medium grey for secondary info
  border: '#E5E7EB', // Subtle border color
  highlightBorder: '#D1D5DB', // Slightly darker border for active states or separators
  success: '#10B981', // Green for success/positive
  error: '#EF4444', // Red for errors/alerts
  warning: '#F59E0B', // Orange for warnings
  placeholder: '#9CA3AF', // Placeholder text color
  // Accents for nutrition icons - ensure good contrast
  accentCalories: '#F472B6', // Pinkish for calories (different from previous orange)
  accentProtein: '#3B82F6', // Brighter Blue for protein
  accentCarbs: '#8B5CF6', // Reusing secondary violet for carbs
  accentFat: '#FBBF24', // Amber for fat
  icon: '#6B7280', // Default icon color (secondary text)
};
// --- End Color Palette ---

type Props = {
  item: any; // Ideally, define specific interfaces for User and Meal here
  type: 'users' | 'meals';
  onPress?: (item: any, type: 'users' | 'meals') => void; // Keep this prop for potential external handlers
};

export default function SearchResultCard({ item, type, onPress }: Props) {
  const navigation = useNavigation(); // Get the navigation object

  const handlePress = () => {
    if (type === 'users') {
      // Navigate to the Profile screen, passing the user's ID as a parameter
      // The 'profile' screen in app/(tabs)/_layout.tsx is configured to handle this.
      // It will navigate to the 'profile' tab and the Profile component will pick up the 'id' param.
      navigation.navigate('profile', { id: item.id });
    } else if (onPress) {
      // If it's a meal or any other type, and an external onPress handler is provided, use it.
      onPress(item, type);
    }
  };

  const renderUserCard = () => (
    <View style={styles.userContent}>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarPlaceholderText}>
            {item.display_name ? item.display_name.charAt(0).toUpperCase() : (item.username ? item.username.charAt(0).toUpperCase() : '?')}
          </Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">
          {item.username}
        </Text>
        {item.display_name && item.display_name !== item.username && ( // Only show if different from username
          <Text style={styles.displayName} numberOfLines={1} ellipsizeMode="tail">
            {item.display_name}
          </Text>
        )}
        {item.bio && <Text style={styles.userBio} numberOfLines={2}>{item.bio}</Text>} {/* Allow more lines for bio */}

        {(item.location || item.followers_count !== undefined) && (
          <View style={styles.userMetaRow}>
            {item.location && (
              <View style={styles.userMetaItem}>
                <Ionicons name="location-outline" size={13} color={Colors.icon} />
                <Text style={styles.userMetaText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
            {item.followers_count !== undefined && (
              <View style={styles.userMetaItem}>
                <Ionicons name="people-outline" size={13} color={Colors.icon} />
                <Text style={styles.userMetaText}>{item.followers_count} Followers</Text>
              </View>
            )}
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward-outline" size={24} color={Colors.placeholder} />
    </View>
  );

  const renderMealCard = () => (
    <View style={styles.mealContainer}>
      {item.meal_image_url && (
        <Image
          source={{ uri: item.meal_image_url }}
          style={styles.mealImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.mealDetails}>
        <Text style={styles.mealRecipeText} numberOfLines={2} ellipsizeMode="tail">
          {item.recipe_text}
        </Text>

        <View style={styles.nutritionGrid}>
          {item.calories !== null && (
            <View style={styles.nutritionItem}>
              <Ionicons name="flash" size={18} color={Colors.accentCalories} /> {/* Changed icon to flash */}
              <Text style={styles.nutritionValue}>{item.calories}</Text>
              <Text style={styles.nutritionLabel}>kcal</Text>
            </View>
          )}
          {item.protein !== null && (
            <View style={styles.nutritionItem}>
              <Ionicons name="egg" size={18} color={Colors.accentProtein} /> {/* Changed icon to egg */}
              <Text style={styles.nutritionValue}>{item.protein}</Text>
              <Text style={styles.nutritionLabel}>g Protein</Text>
            </View>
          )}
          {item.carbs !== null && (
            <View style={styles.nutritionItem}>
              <Ionicons name="happy" size={18} color={Colors.accentCarbs} /> {/* Changed icon to happy */}
              <Text style={styles.nutritionValue}>{item.carbs}</Text>
              <Text style={styles.nutritionLabel}>g Carbs</Text>
            </View>
          )}
          {item.fat !== null && (
            <View style={styles.nutritionItem}>
              <Ionicons name="water" size={18} color={Colors.accentFat} /> {/* Changed icon to water */}
              <Text style={styles.nutritionValue}>{item.fat}</Text>
              <Text style={styles.nutritionLabel}>g Fat</Text>
            </View>
          )}
        </View>

        <View style={styles.mealMetaGrid}> {/* Changed to Grid for better wrapping */}
          {item.cuisine && (
            <View style={styles.metaTag}>
              <Ionicons name="restaurant-outline" size={14} color={Colors.icon} />
              <Text style={styles.mealMetaText}>{item.cuisine}</Text>
            </View>
          )}
          {item.meal_time && (
            <View style={styles.metaTag}>
              <Ionicons name="time-outline" size={14} color={Colors.icon} />
              <Text style={styles.mealMetaText}>{item.meal_time}</Text>
            </View>
          )}
          {item.diet_type && (
            <View style={styles.metaTag}>
              <Ionicons name="leaf-outline" size={14} color={Colors.success} /> {/* Green for diet type */}
              <Text style={styles.mealMetaText}>{item.diet_type}</Text>
            </View>
          )}
          {item.spice_level && item.spice_level !== '0' && (
            <View style={styles.metaTag}>
              <Ionicons name="flame-outline" size={14} color={Colors.warning} />
              <Text style={styles.mealMetaText}>Spice: {item.spice_level}/5</Text>
            </View>
          )}
          {item.prep_time_mins !== null && (
            <View style={styles.metaTag}>
              <Ionicons name="hourglass-outline" size={14} color={Colors.icon} />
              <Text style={styles.mealMetaText}>{item.prep_time_mins} mins</Text>
            </View>
          )}
          {item.price !== null && (
            <View style={styles.metaTag}>
              <Ionicons name="cash-outline" size={14} color={Colors.success} />
              <Text style={styles.mealMetaText}>${parseFloat(item.price).toFixed(2)}</Text>
            </View>
          )}
            {item.location && (
              <View style={styles.metaTag}>
                <Ionicons name="navigate-outline" size={14} color={Colors.primary} />
                <Text style={styles.mealMetaText}>{item.location}</Text>
              </View>
            )}
        </View>

        <View style={styles.interactionStats}>
          <View style={styles.statGroup}>
            {item.meal_likes?.count > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="heart" size={16} color={Colors.error} />
                <Text style={styles.statText}>{item.meal_likes.count}</Text>
              </View>
            )}
            {item.meal_saves?.count > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="bookmark" size={16} color={Colors.secondary} />
                <Text style={styles.statText}>{item.meal_saves.count}</Text>
              </View>
            )}
          </View>
          {item.created_at && (
            <Text style={styles.timeAgo}>
              <Ionicons name="calendar-outline" size={14} color={Colors.icon} />{' '}
              {formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: true })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      style={type === 'users' ? styles.userListItem : styles.mealCard}
      onPress={handlePress}
      activeOpacity={0.8} // Slightly less aggressive active opacity
    >
      {type === 'users' ? renderUserCard() : renderMealCard()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // --- General Card / List Item Styles ---
  mealCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    marginHorizontal: 16, // Consistent with general screen padding
    marginVertical: 8, // More compact vertical spacing
    padding: 16, // Increased padding for content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, // Softer shadow
    shadowOpacity: 0.05, // Very subtle shadow
    shadowRadius: 5,
    elevation: 3, // Android shadow
  },
  userListItem: {
    backgroundColor: Colors.cardBackground,
    paddingHorizontal: 16, // Match screen horizontal padding
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    // Removed marginHorizontal here to make it full width list item
  },

  // --- User specific styles ---
  userContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8, // Internal padding for list item content
  },
  avatar: {
    height: 56, // Slightly larger avatar for better visual weight
    width: 56,
    borderRadius: 28, // Perfect circle
    marginRight: 15,
    borderWidth: 1.5, // Slightly thicker, clearer border
    borderColor: Colors.border,
  },
  avatarPlaceholder: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: Colors.cardBackground,
    fontSize: 22, // Adjusted font size
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 10, // Space before chevron icon
  },
  username: {
    fontWeight: '600', // Slightly less bold than '700' but still strong
    fontSize: 17,
    color: Colors.textPrimary,
  },
  displayName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userBio: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18, // Improved readability
  },
  userMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow wrapping for multiple meta items
    marginTop: 6,
    // gap: 10, // React Native doesn't support 'gap' directly in all versions, use margin for spacing
  },
  userMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15, // Spacing between meta items
    marginBottom: 4, // If they wrap
  },
  userMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4, // Smaller margin for icon text
  },

  // --- Meal specific styles ---
  mealContainer: {
    // No specific styles here, mealCard handles the container
  },
  mealImage: {
    height: 180, // Slightly smaller image height for better balance
    width: '100%',
    borderRadius: 12, // More rounded corners
    marginBottom: 15,
  },
  mealDetails: {
    // No specific styles here, content padding is handled by mealCard
  },
  mealRecipeText: {
    fontWeight: '700', // Stronger title
    fontSize: 20,
    color: Colors.textPrimary,
    marginBottom: 12, // Increased spacing
    lineHeight: 28, // Better readability for multi-line title
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: Colors.background, // Light background for the grid
    borderRadius: 10,
    paddingVertical: 12, // Increased padding
    paddingHorizontal: 8, // Increased padding
    marginBottom: 18, // Increased spacing
  },
  nutritionItem: {
    width: '24%', // Adjust for 4 items per row with slight spacing
    alignItems: 'center',
    paddingVertical: 5, // Internal padding for each item
  },
  nutritionValue: {
    fontSize: 15, // Slightly smaller value text
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  nutritionLabel: {
    fontSize: 11, // Smaller label text
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'center', // Ensure label centers if it wraps
  },
  mealMetaGrid: { // Changed from mealMetaRow to indicate wrapping capability
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10, // Increased spacing
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background, // Lighter background for tags
    borderRadius: 18, // More rounded, pill-like tags
    paddingVertical: 6, // Increased vertical padding
    paddingHorizontal: 12, // Increased horizontal padding
    marginRight: 8,
    marginBottom: 8, // For wrapping
    // No shadow on tags, keep them flat and clean
  },
  mealMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6, // Increased spacing for icon text
    fontWeight: '500',
  },
  interactionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15, // Increased spacing
    borderTopWidth: 0.5, // Thinner, more subtle border
    borderTopColor: Colors.border,
    paddingTop: 12, // Increased padding
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20, // Increased spacing between stats
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 6, // Increased spacing
  },
  timeAgo: {
    fontSize: 12, // Slightly smaller time ago text
    color: Colors.textSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    fontStyle: 'italic', // Make it slightly italic
  },
});
