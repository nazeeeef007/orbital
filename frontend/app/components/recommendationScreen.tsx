import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Image,
  StatusBar // Import StatusBar for optional control
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import RecommendationCard from './recommendationCard';
import { BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

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
}

export default function RecommendationScreen() {
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(0);

  const flatListRef = useRef<FlatList<MealItem>>(null);

  const fetchRecommendedMeals = useCallback(async () => {
    setRefreshing(true);
    if (recommendedMeals.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      const response = await fetch(`${BASE_URL}/api/search/recommendation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Failed to fetch recommended meals.');
      }

      const data = await response.json();
      setRecommendedMeals(data.recommendations || []);

    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Could not load recommendations. Please try again.');
      Alert.alert('Error', err.message || 'Failed to load recommended meals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [recommendedMeals.length]);

  useEffect(() => {
    fetchRecommendedMeals();
  }, [fetchRecommendedMeals]);

  // Adjust status bar style based on view mode
  useEffect(() => {
    if (viewMode === 'single') {
      StatusBar.setBarStyle('light-content', true); // White text for single view
    } else {
      StatusBar.setBarStyle('dark-content', true); // Dark text for grid view
    }
  }, [viewMode]);

  const handleCardPress = (meal: MealItem) => {
    const index = recommendedMeals.findIndex(item => item.id === meal.id);
    if (index !== -1) {
      setSelectedMealIndex(index);
      setViewMode('single');
    }
  };

  const renderGridItem = ({ item }: { item: MealItem }) => (
    <RecommendationCard
      item={item}
      onPress={handleCardPress}
    />
  );

  const renderSingleItem = ({ item }: { item: MealItem }) => (
    <View style={styles.singleMealContainer}>
      <Image
        source={item.meal_image_url ? { uri: item.meal_image_url } : require('@/assets/images/favicon.png')}
        style={styles.singleMealImage}
      />
      {/* Darker, more prominent overlay for better text readability */}
      <View style={styles.gradientOverlay} />

      <View style={styles.singleMealContent}>
        <Text style={styles.singleMealRecipeText}>{item.recipe_text}</Text>

        <View style={styles.detailRowWrapper}> {/* New wrapper for detail rows */}
          <View style={styles.detailItem}>
            <Ionicons name="pizza-outline" size={18} color="#C0C0C0" />
            <Text style={styles.singleMealDetailText}>{item.cuisine || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={18} color="#C0C0C0" />
            <Text style={styles.singleMealDetailText}>{item.meal_time || 'N/A'}</Text>
          </View>
          {item.prep_time_mins !== null && (
            <View style={styles.detailItem}>
              <Ionicons name="hourglass-outline" size={18} color="#C0C0C0" />
              <Text style={styles.singleMealDetailText}>{item.prep_time_mins} mins</Text>
            </View>
          )}
          {item.serving_size && (
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={18} color="#C0C0C0" />
              <Text style={styles.singleMealDetailText}>{item.serving_size}</Text>
            </View>
          )}
        </View>

        <View style={styles.macrosContainerSingle}>
          <Text style={styles.macroPill}>🔥 {item.calories} kcal</Text>
          <Text style={styles.macroPill}>🍗 {item.protein}g P</Text>
          {item.carbs !== undefined && <Text style={styles.macroPill}>🍚 {item.carbs}g C</Text>}
          {item.fat !== undefined && <Text style={styles.macroPill}>🥑 {item.fat}g F</Text>}
        </View>

        {item.score !== undefined && (
          <Text style={styles.singleMealScoreText}>
            Taste Score: <Text style={styles.scoreValue}>{item.score.toFixed(1)}</Text>
          </Text>
        )}
      </View>
    </View>
  );

  useEffect(() => {
    if (viewMode === 'single' && flatListRef.current && selectedMealIndex !== null) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: selectedMealIndex, animated: false });
      }, 100);
    }
  }, [viewMode, selectedMealIndex]);

  // Conditional Rendering Logic for different states
  if (loading && recommendedMeals.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FE2C55" />
        <Text style={styles.loadingText}>Loading delicious meals...</Text>
      </View>
    );
  }

  if (error && recommendedMeals.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="warning-outline" size={48} color="#FFD700" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendedMeals}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (recommendedMeals.length === 0 && !loading && !error) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="sad-outline" size={48} color="#888" />
        <Text style={styles.emptyText}>No recommended meals found. Try uploading some meals!</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRecommendedMeals}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fullScreenContainer}>
      {viewMode === 'grid' && (
        <View style={styles.gridContainer}>
          <Text style={styles.sectionTitle}>For You</Text>
          <FlatList
            data={recommendedMeals}
            keyExtractor={(item) => item.id}
            renderItem={renderGridItem}
            numColumns={2}
            columnWrapperStyle={styles.row}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={fetchRecommendedMeals}
                tintColor="#FE2C55"
              />
            }
          />
        </View>
      )}

      {viewMode === 'single' && (
        <View style={styles.singleViewWrapper}>
          <FlatList
            ref={flatListRef}
            data={recommendedMeals}
            keyExtractor={(item) => item.id}
            renderItem={renderSingleItem}
            snapToInterval={height}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onScrollToIndexFailed={info => {
                console.warn('Scroll to index failed:', info);
            }}
            getItemLayout={(data, index) => (
                { length: height, offset: height * index, index }
            )}
            initialScrollIndex={selectedMealIndex}
          />
          <TouchableOpacity style={styles.backButton} onPress={() => setViewMode('grid')}>
            <Ionicons name="arrow-back" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  gridContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#212121',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 16,
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  row: {
    flex: 1,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#616161',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#FE2C55',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 15,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // --- Styles for Single Meal View (Vertical TikTok/Reels Style) ---
  singleViewWrapper: {
    flex: 1,
    backgroundColor: 'black',
  },
  backButton: {
    position: 'absolute',
    top: 50, // Adjust for notch/safe area
    left: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 8,
  },
  singleMealContainer: {
    width: width,
    height: height,
    justifyContent: 'flex-end',
    backgroundColor: 'black',
  },
  singleMealImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%', // Increased height for stronger overlay
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Stronger black tint
    // For a real gradient, consider using 'react-native-linear-gradient'
    // This will currently be a solid block of color for visibility.
  },
  singleMealContent: {
    padding: 25, // Increased padding
    paddingBottom: 80, // More padding for bottom clarity, pushes content up
    zIndex: 1,
  },
  singleMealRecipeText: {
    fontSize: 30, // Even larger title
    fontWeight: '900', // Even bolder for strong impact
    color: 'white',
    marginBottom: 20, // More space below title
    textShadowColor: 'rgba(0, 0, 0, 0.8)', // Slightly stronger shadow
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4, // Softer shadow
  },
  detailRowWrapper: { // New style for the wrapper around all detail items
    marginBottom: 20, // Space below all details
  },
  detailItem: { // Style for each individual detail (cuisine, time, etc.)
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, // Space between each detail item
  },
  singleMealDetailText: {
    fontSize: 16, // Larger detail text
    color: '#F0F0F0', // Brighter white/grey
    marginLeft: 10, // Space between icon and text
    flexShrink: 1,
    fontWeight: '500', // Medium weight for good readability
  },
  macrosContainerSingle: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20, // More space above macro pills
    marginBottom: 15, // More space below macro pills
  },
  macroPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Slightly more opaque
    borderRadius: 20, // More rounded for a pill shape
    paddingVertical: 8, // Increased padding
    paddingHorizontal: 15, // Increased padding
    marginRight: 10,
    marginBottom: 10,
    fontSize: 15, // Larger font for macros
    color: 'white',
    fontWeight: '700', // Bolder macro text
  },
  singleMealScoreText: {
    fontSize: 18, // Larger score text
    color: '#E0E0E0',
    fontWeight: '700', // Bolder
    textAlign: 'left', // Align left for better flow
    marginTop: 15,
  },
  scoreValue: {
    color: '#FE2C55', // Accent color for the score number
    fontWeight: '900', // Extra bold score value
    fontSize: 20, // Make the score value even larger
  },
});