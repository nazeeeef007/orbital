// app/recommendations.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import RecommendationCard from '../components/recommendationCard';
import CommentsModal from '../components/CommentsModal';
import RecommendationHeader from '../components/RecommendationHeader';
import RecommendationList from '../components/RecommendationList';

import { BASE_URL } from '@/config';

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
  commentsCount: number;
  comments: Comment[];
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
  // --- NEW: Add location property ---
  location: string | null;
}

export default function RecommendationScreen() {
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedMealForComments, setSelectedMealForComments] = useState<MealItem | null>(null);

  const router = useRouter();

  const fetchRecommendedMeals = useCallback(async () => {
    setRefreshing(true);
    if (recommendedMeals.length === 0) {
      setLoading(true);
    }
    setError(null);

    const token = await SecureStore.getItemAsync('authToken');

    try {
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${BASE_URL}/api/search/recommendation`, {
        headers: headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          throw new Error('Authentication required. Please log in to view recommendations.');
        }
        throw new Error(errorData.message || errorData.error || 'Failed to fetch recommended meals.');
      }

      const data = await response.json();
      const rawRecommendations = Array.isArray(data.recommendations) ? data.recommendations : [];

      const enrichedRecommendations: MealItem[] = rawRecommendations.map((meal: any) => ({
        id: meal.id,
        user_id: meal.user_id,
        recipe_text: meal.recipe_text,
        meal_image_url: meal.meal_image_url,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        created_at: meal.created_at,
        cuisine: meal.cuisine,
        meal_time: meal.meal_time,
        diet_type: meal.diet_type,
        spice_level: meal.spice_level,
        prep_time_mins: meal.prep_time_mins,
        serving_size: meal.serving_size,
        score: meal.score ?? 0,

        likesCount: meal.meal_likes?.[0]?.count ?? 0,
        savesCount: meal.meal_saves?.[0]?.count ?? 0,
        commentsCount: meal.meal_comments?.[0]?.count ?? 0,

        comments: [],
        isLikedByCurrentUser: meal.isLiked ?? false,
        isSavedByCurrentUser: meal.isSaved ?? false,
        // --- NEW: Map location from fetched data ---
        location: meal.location || null, // Assuming your API returns 'location' field
      }));

      setRecommendedMeals(enrichedRecommendations);
    } catch (err: any) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Could not load recommendations. Please try again.');
      Alert.alert('Error', err.message || 'Failed to load recommended meals.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [recommendedMeals.length]);

  useFocusEffect(
    useCallback(() => {
      fetchRecommendedMeals();
    }, [fetchRecommendedMeals])
  );

  useEffect(() => {
    StatusBar.setBarStyle('dark-content', true);
  }, []);

  // MODIFIED: Navigate to the meal-details/[id] route with the selected meal's ID
  const handleCardPress = useCallback((meal: MealItem) => {
    router.push(`/meal-details/${meal.id}`); // Now points to your new feed screen
  }, [router]);

  // Keep these handlers in RecommendationScreen for when meals are shown in grid view
  // When navigating to the full-screen feed, the handlers in MealFeedScreen will take over.
  const handleLike = useCallback(async (mealId: string, isLiked: boolean) => {
    setRecommendedMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId
          ? { ...meal, likesCount: isLiked ? meal.likesCount - 1 : meal.likesCount + 1, isLikedByCurrentUser: !isLiked }
          : meal
      )
    );

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) { Alert.alert('Authentication Error', 'You must be logged in to like meals.'); setRecommendedMeals(prevMeals => prevMeals.map(meal => meal.id === mealId ? { ...meal, likesCount: isLiked ? meal.likesCount + 1 : meal.likesCount - 1, isLikedByCurrentUser: isLiked } : meal)); return; }
      const endpoint = isLiked ? 'unlike' : 'like';
      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ meal_id: mealId }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal.`); }
    } catch (err: any) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal. Please try again.`);
      setRecommendedMeals(prevMeals => prevMeals.map(meal => meal.id === mealId ? { ...meal, likesCount: isLiked ? meal.likesCount + 1 : meal.likesCount - 1, isLikedByCurrentUser: isLiked } : meal));
    }
  }, []);

  const handleSave = useCallback(async (mealId: string, isSaved: boolean) => {
    setRecommendedMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId
          ? { ...meal, savesCount: isSaved ? meal.savesCount - 1 : meal.savesCount + 1, isSavedByCurrentUser: !isSaved }
          : meal
      )
    );

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) { Alert.alert('Authentication Error', 'You must be logged in to save meals.'); setRecommendedMeals(prevMeals => prevMeals.map(meal => meal.id === mealId ? { ...meal, savesCount: isSaved ? meal.savesCount + 1 : meal.savesCount - 1, isSavedByCurrentUser: isSaved } : meal)); return; }
      const endpoint = isSaved ? 'unsave' : 'save';
      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ meal_id: mealId }) });
      if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal.`); }
    } catch (err: any) {
      console.error(`Error ${isSaved ? 'unSaving' : 'saving'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal. Please try again.`);
      setRecommendedMeals(prevMeals => prevMeals.map(meal => meal.id === mealId ? { ...meal, savesCount: isSaved ? meal.savesCount + 1 : meal.savesCount - 1, isSavedByCurrentUser: isSaved } : meal));
    }
  }, []);

  const handleOpenComments = useCallback((meal: MealItem) => {
    setSelectedMealForComments({ ...meal, commentsCount: meal.commentsCount });
    setCommentModalVisible(true);
  }, []);

  const handleCommentAdded = useCallback((mealId: string, newComment: Comment) => {
    setRecommendedMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId
          ? { ...meal, commentsCount: meal.commentsCount + 1, comments: [newComment, ...meal.comments] }
          : meal
      )
    );
    setSelectedMealForComments(prev =>
      prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1, comments: [newComment, ...prev.comments] } : null
    );
  }, []);


  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading recommendations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchRecommendedMeals} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Tap to Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' />

      <RecommendationHeader
        title="Recommendations"
      />

      {recommendedMeals.length === 0 ? (
        <View style={styles.centered}>
          <Text>No recommendations available. Try adjusting your profile goals or eating more meals!</Text>
        </View>
      ) : (
        <RecommendationList
          data={recommendedMeals}
          viewMode="grid"
          refreshing={refreshing}
          onRefresh={fetchRecommendedMeals}
          renderItem={({ item, index }) => (
            <RecommendationCard
              item={item} // 'item' now includes 'location'
              onPress={handleCardPress} // This now triggers navigation to single meal screen
              onLikePress={handleLike}
              onSavePress={handleSave}
              onCommentPress={handleOpenComments}
              isLikedByCurrentUser={item.isLikedByCurrentUser}
              isSavedByCurrentUser={item.isSavedByCurrentUser}
            />
          )}
        />
      )}

      <CommentsModal
        visible={commentModalVisible}
        onClose={() => setCommentModalVisible(false)}
        meal={selectedMealForComments}
        onCommentAdded={handleCommentAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});