// app/(tabs)/RecommendationScreen.tsx (or adjust path based on your structure, e.g., components/RecommendationScreen.tsx)
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import SearchResultCard from '../../components/searchResult'; // Adjust path as needed
import { BASE_URL } from '@/config'; // Your base API URL
import { Ionicons } from '@expo/vector-icons'; // For icons

// Define a type for your Meal item based on your schema
interface MealItem {
  id: string;
  user_id: string;
  meal_image_url: string;
  recipe_text: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  // Add other meal properties as needed for display
  cuisine?: string;
  meal_time?: string;
  course_type?: string;
  diet_type?: string;
  spice_level?: string;
  prep_time_mins?: number;
  serving_size?: string;
}

export default function RecommendationScreen() {
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendedMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      // Assuming your backend has an endpoint to get all meals,
      // or a specific recommendation endpoint. For now, using /api/meals
      // If you need actual recommendations, your backend would implement that logic.
      const response = await fetch(`${BASE_URL}/api/search/recommendation`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch recommended meals.');
      }

      const data = await response.json();
      setRecommendedMeals(data || []); // Assuming the response is an array of meals

    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Could not load recommendations. Please try again.');
      Alert.alert('Error', err.message || 'Failed to load recommended meals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecommendedMeals();
  }, [fetchRecommendedMeals]);

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#FE2C55" /> {/* Use the accent color */}
        <Text style={styles.loadingText}>Loading delicious meals...</Text>
      </View>
    );
  }

  if (error) {
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

  if (recommendedMeals.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="sad-outline" size={48} color="#888" />
        <Text style={styles.emptyText}>No recommended meals found. Time to upload some!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>For You</Text> {/* TikTok-style "For You" */}
      <FlatList
        data={recommendedMeals}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <SearchResultCard item={item} type="meals" />}
        numColumns={2} // Two columns for the grid layout
        columnWrapperStyle={styles.row} // Style for each row of columns
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light background for the screen
    paddingHorizontal: 8, // Padding for the overall grid
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#161823', // Dark text color
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 8, // Match container padding
  },
  flatListContent: {
    paddingBottom: 20, // Ensure content doesn't get cut off at the bottom
  },
  row: {
    flex: 1,
    justifyContent: 'space-around', // Distribute items evenly in a row
    marginBottom: 16, // Space between rows
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#D8000C', // Red for error
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF', // Standard blue for action
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
