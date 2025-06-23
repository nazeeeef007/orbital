// app/meal-details/[id].tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router'; // Import Stack and useRouter for navigation
import * as SecureStore from 'expo-secure-store';
import SingleMealView from '../components/SingleMealView'; // Your existing SingleMealView
import CommentsModal from '../components/CommentsModal';
import { BASE_URL } from '@/config';

// Interface definitions (assuming they are the same as before)
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
  commentsCount: number; // Keep this as a separate count for initial display
  comments: Comment[]; // Keep full comments array for modal
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
  // --- NEW: Add location property here ---
  location: string | null;
}

export default function MealDetailsScreen() {
  const { id } = useLocalSearchParams();
  const mealId = typeof id === 'string' ? id : undefined; // Ensure mealId is a string or undefined
  const router = useRouter(); // Initialize router for navigation

  const [meal, setMeal] = useState<MealItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [currentMealForComments, setCurrentMealForComments] = useState<MealItem | null>(null);

  // Function to fetch details for a SINGLE meal
  const fetchMealDetails = useCallback(async () => {
    if (!mealId) {
      setError('Meal ID not provided for details view.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const token = await SecureStore.getItemAsync('authToken');

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch details for the specific meal ID
      const response = await fetch(`${BASE_URL}/api/meals/${mealId}`, {
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch details for meal ID: ${mealId}`);
      }

      const data = await response.json();
      const fetchedMeal: MealItem = {
        id: data.id,
        user_id: data.user_id,
        recipe_text: data.recipe_text,
        meal_image_url: data.meal_image_url,
        calories: data.calories,
        protein: data.protein,
        carbs: data.carbs,
        fat: data.fat,
        created_at: data.created_at,
        cuisine: data.cuisine,
        meal_time: data.meal_time,
        course_type: data.course_type,
        diet_type: data.diet_type,
        spice_level: data.spice_level,
        prep_time_mins: data.prep_time_mins,
        serving_size: data.serving_size,
        score: data.score ?? 0,
        likesCount: data.meal_likes?.[0]?.count ?? 0,
        savesCount: data.meal_saves?.[0]?.count ?? 0,
        commentsCount: data.meal_comments?.[0]?.count ?? (Array.isArray(data.comments) ? data.comments.length : 0),
        comments: Array.isArray(data.comments) ? data.comments : [], // Ensure comments array is passed
        isLikedByCurrentUser: data.isLiked ?? false,
        isSavedByCurrentUser: data.isSaved ?? false,
        // --- NEW: Map location from fetched data ---
        location: data.location || null, // Assuming your API returns 'location' field
      };
      setMeal(fetchedMeal);
    } catch (err: any) {
      console.error(`Error fetching meal details for ${mealId}:`, err);
      setError(err.message || 'Could not load meal details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [mealId]); // Dependency on mealId to refetch if it changes (e.g., if navigating between detail screens)

  useEffect(() => {
    fetchMealDetails();
    StatusBar.setBarStyle('dark-content', true); // Set status bar for this screen
    return () => StatusBar.setBarStyle('dark-content', true); // Clean up on unmount
  }, [fetchMealDetails]);

  // --- Handlers for interactions that update the current meal's state ---
  // These are similar to what you had, but now operate on the single `meal` state.

  const updateCurrentMealState = useCallback((updatedMeal: MealItem) => {
    setMeal(updatedMeal);
    // If the comments modal is open and showing this meal, update its state too
    if (currentMealForComments && currentMealForComments.id === updatedMeal.id) {
      setCurrentMealForComments(updatedMeal);
    }
  }, [currentMealForComments]);

  const handleLike = useCallback(async (currentMealId: string, isLiked: boolean) => {
    if (!meal || meal.id !== currentMealId) return; // Only update if it's the current meal

    const originalMeal = { ...meal }; // Save original state for rollback
    const newLikesCount = isLiked ? meal.likesCount - 1 : meal.likesCount + 1;
    const newIsLikedStatus = !isLiked;

    updateCurrentMealState({
      ...meal,
      likesCount: newLikesCount,
      isLikedByCurrentUser: newIsLikedStatus,
    });

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to like meals.');
        updateCurrentMealState(originalMeal); // Rollback UI
        return;
      }
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meal_id: currentMealId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal.`);
      }
      // If success, the UI is already updated. No further action needed here.
    } catch (err: any) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal. Please try again.`);
      updateCurrentMealState(originalMeal); // Rollback UI on API error
    }
  }, [meal, updateCurrentMealState]);

  const handleSave = useCallback(async (currentMealId: string, isSaved: boolean) => {
    if (!meal || meal.id !== currentMealId) return;

    const originalMeal = { ...meal }; // Save original state for rollback
    const newSavesCount = isSaved ? meal.savesCount - 1 : meal.savesCount + 1;
    const newIsSavedStatus = !isSaved;

    updateCurrentMealState({
      ...meal,
      savesCount: newSavesCount,
      isSavedByCurrentUser: newIsSavedStatus,
    });

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to save meals.');
        updateCurrentMealState(originalMeal); // Rollback UI
        return;
      }
      const endpoint = isSaved ? 'unsave' : 'save';
      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ meal_id: currentMealId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal.`);
      }
    } catch (err: any) {
      console.error(`Error ${isSaved ? 'unSaving' : 'saving'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal. Please try again.`);
      updateCurrentMealState(originalMeal); // Rollback UI on API error
    }
  }, [meal, updateCurrentMealState]);

  const handleOpenComments = useCallback((selectedMeal: MealItem) => {
    // Make sure we pass the most up-to-date meal object
    setCurrentMealForComments(meal); // Use the current state of 'meal'
    setCommentModalVisible(true);
  }, [meal]); // Dependency on 'meal' to ensure the latest data is passed

  const handleCommentAdded = useCallback((commentMealId: string, newComment: Comment) => {
    setMeal(prevMeal => {
      if (prevMeal && prevMeal.id === commentMealId) {
        const updatedMeal = {
          ...prevMeal,
          commentsCount: prevMeal.commentsCount + 1,
          comments: [newComment, ...prevMeal.comments], // Add new comment to the beginning
        };
        // Also update the meal object for the comments modal if it's currently open
        setCurrentMealForComments(updatedMeal);
        return updatedMeal;
      }
      return prevMeal;
    });
  }, []);


  // --- Render Logic ---
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading meal details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!meal) {
    // This case should ideally be handled by router.back() or a clear message
    // if mealId was provided but no meal was found on the backend.
    return (
      <View style={styles.centered}>
        <Text>Meal details not available.</Text>
        {/* Potentially add a button to go back */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Configure Expo Router's Stack.Screen to hide its default header
          and let SingleMealView manage its own header (with back button) */}
      <Stack.Screen options={{ headerShown: false }} />

      <SingleMealView
        meal={meal} // The meal object now includes 'location'
        onLikePress={handleLike}
        onSavePress={handleSave}
        onCommentPress={handleOpenComments}
        onClose={() => router.back()} // This will navigate back to the previous screen
      />

      <CommentsModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        meal={currentMealForComments} // Pass the meal object that holds the latest comments
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Or whatever background you prefer for the detail view
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB', // Match container background
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
});