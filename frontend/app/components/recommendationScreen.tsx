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
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView, // Added ScrollView for the SingleMealView content
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import RecommendationCard from './recommendationCard'; // Assuming this is your grid card
import { BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { formatDistanceToNowStrict } from 'date-fns'; // For friendly date formatting

const { width, height } = Dimensions.get('window');

// Extend MealItem to match backend's enriched data
interface Comment {
  content: string;
  created_at: string;
  user_id: string;
  username?: string; // Add username as it's coming from the backend now
}

interface MealItem {
  id: string;
  user_id?: string; // User who uploaded the meal
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
  // Fields from backend enrichment
  likesCount: number;
  savesCount: number;
  comments: Comment[]; // Ensure this is Comment[]
  isLikedByCurrentUser?: boolean;
  isSavedByCurrentUser?: boolean;
}

// Separate component for rendering a single comment
const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <View style={commentStyles.commentContainer}>
    <Text style={commentStyles.commentUsername}>{comment.username || 'Unknown User'}</Text>
    <Text style={commentStyles.commentContent}>{comment.content}</Text>
    <Text style={commentStyles.commentDate}>
      {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true })}
    </Text>
  </View>
);

// New SingleMealView Component
interface SingleMealViewProps {
  meal: MealItem;
  onLikePress: (mealId: string, isLiked: boolean) => void;
  onSavePress: (mealId: string, isSaved: boolean) => void;
  onCommentPress: (meal: MealItem) => void;
}

const SingleMealView: React.FC<SingleMealViewProps> = ({ meal, onLikePress, onSavePress, onCommentPress }) => {
  const timeAgo = formatDistanceToNowStrict(new Date(meal.created_at), { addSuffix: true });

  return (
    <View style={singleMealStyles.container}>
      <Image source={{ uri: meal.meal_image_url || 'https://via.placeholder.com/400' }} style={singleMealStyles.image} />
      <View style={singleMealStyles.overlay} />

      <ScrollView contentContainerStyle={singleMealStyles.detailsContainer}>
        <Text style={singleMealStyles.recipeText}>{meal.recipe_text}</Text>
        <Text style={singleMealStyles.timeAgo}>{timeAgo}</Text>

        <View style={singleMealStyles.infoRow}>
          {meal.cuisine && <Text style={singleMealStyles.infoText}><Ionicons name="pizza-outline" size={16} color="#fff" /> {meal.cuisine}</Text>}
          {meal.meal_time && <Text style={singleMealStyles.infoText}><Ionicons name="time-outline" size={16} color="#fff" /> {meal.meal_time}</Text>}
        </View>
        <View style={singleMealStyles.infoRow}>
          {meal.course_type && <Text style={singleMealStyles.infoText}><Ionicons name="restaurant-outline" size={16} color="#fff" /> {meal.course_type}</Text>}
          {meal.diet_type && <Text style={singleMealStyles.infoText}><Ionicons name="leaf-outline" size={16} color="#fff" /> {meal.diet_type}</Text>}
        </View>
        <View style={singleMealStyles.infoRow}>
          {meal.spice_level && <Text style={singleMealStyles.infoText}><Ionicons name="flame-outline" size={16} color="#fff" /> {meal.spice_level}</Text>}
          {meal.prep_time_mins !== null && (
            <Text style={singleMealStyles.infoText}><Ionicons name="hourglass-outline" size={16} color="#fff" /> {meal.prep_time_mins} mins</Text>
          )}
        </View>
        {meal.serving_size && <Text style={singleMealStyles.infoText}><Ionicons name="people-outline" size={16} color="#fff" /> Serving: {meal.serving_size}</Text>}

        <View style={singleMealStyles.macrosContainer}>
          <Text style={singleMealStyles.macroText}>Calories: {meal.calories}</Text>
          <Text style={singleMealStyles.macroText}>Protein: {meal.protein}g</Text>
          <Text style={singleMealStyles.macroText}>Carbs: {meal.carbs}g</Text>
          <Text style={singleMealStyles.macroText}>Fat: {meal.fat}g</Text>
        </View>
      </ScrollView>

      <View style={singleMealStyles.actionsContainer}>
        <TouchableOpacity onPress={() => onLikePress(meal.id, meal.isLikedByCurrentUser || false)} style={singleMealStyles.actionButton}>
          <Ionicons name={meal.isLikedByCurrentUser ? 'heart' : 'heart-outline'} size={30} color={meal.isLikedByCurrentUser ? '#FF6B6B' : '#fff'} />
          <Text style={singleMealStyles.actionText}>{meal.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onCommentPress(meal)} style={singleMealStyles.actionButton}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color="#fff" />
          <Text style={singleMealStyles.actionText}>{meal.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onSavePress(meal.id, meal.isSavedByCurrentUser || false)} style={singleMealStyles.actionButton}>
          <Ionicons name={meal.isSavedByCurrentUser ? 'bookmark' : 'bookmark-outline'} size={30} color={meal.isSavedByCurrentUser ? '#FFD700' : '#fff'} />
          <Text style={singleMealStyles.actionText}>{meal.savesCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


export default function RecommendationScreen() {
  const [recommendedMeals, setRecommendedMeals] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid'); // Default to grid
  const [selectedMealIndex, setSelectedMealIndex] = useState<number>(0);

  // State for comments modal
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedMealForComments, setSelectedMealForComments] = useState<MealItem | null>(null);
  const [newCommentContent, setNewCommentContent] = useState<string>('');
  const [fetchingComments, setFetchingComments] = useState(false); // New state for loading comments in modal
  const [mealComments, setMealComments] = useState<Comment[]>([]); // State to hold comments for the modal

  const flatListRef = useRef<FlatList<MealItem>>(null);

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

      const enrichedRecommendations: MealItem[] = rawRecommendations.map((meal: MealItem) => ({
        ...meal,
        isLikedByCurrentUser: meal.isLikedByCurrentUser ?? false,
        isSavedByCurrentUser: meal.isSavedByCurrentUser ?? false,
        comments: meal.comments || [], // Ensure comments is an array
        likesCount: meal.likesCount ?? 0,
        savesCount: meal.savesCount ?? 0,
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

  // Use useFocusEffect to refetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRecommendedMeals();
    }, [fetchRecommendedMeals])
  );

  useEffect(() => {
    // Adjust status bar style based on view mode
    if (viewMode === 'single') {
      StatusBar.setBarStyle('light-content', true);
    } else {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'single' && flatListRef.current && selectedMealIndex !== null) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: selectedMealIndex, animated: false });
      }, 100);
    }
  }, [viewMode, selectedMealIndex]);

  const handleCardPress = (meal: MealItem) => {
    const index = recommendedMeals.findIndex(item => item.id === meal.id);
    if (index !== -1) {
      setSelectedMealIndex(index);
      setViewMode('single');
    }
  };

  const handleLike = useCallback(async (mealId: string, isLiked: boolean) => {
    // Optimistic UI update
    setRecommendedMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId
          ? {
              ...meal,
              likesCount: isLiked ? meal.likesCount - 1 : meal.likesCount + 1,
              isLikedByCurrentUser: !isLiked,
            }
          : meal
      )
    );

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setRecommendedMeals(prevMeals =>
          prevMeals.map(meal =>
            meal.id === mealId
              ? {
                  ...meal,
                  likesCount: isLiked ? meal.likesCount + 1 : meal.likesCount - 1,
                  isLikedByCurrentUser: isLiked,
                }
              : meal
          )
        );
        Alert.alert('Authentication Error', 'You must be logged in to like meals.');
        return;
      }

      const endpoint = isLiked ? 'unlike' : 'like';

      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meal_id: mealId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Authentication Required', 'Your session has expired. Please log in again.');
        }
        throw new Error(errorData.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal.`);
      }
    } catch (err: any) {
      console.error(`Error ${isLiked ? 'unliking' : 'liking'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isLiked ? 'unlike' : 'like'} meal. Please try again.`);
      // Rollback UI if API call fails
      setRecommendedMeals(prevMeals =>
        prevMeals.map(meal =>
          meal.id === mealId
            ? {
                ...meal,
                likesCount: isLiked ? meal.likesCount + 1 : meal.likesCount - 1,
                isLikedByCurrentUser: isLiked,
              }
            : meal
        )
      );
    }
  }, []);

  const handleSave = useCallback(async (mealId: string, isSaved: boolean) => {
    // Optimistic UI update
    setRecommendedMeals(prevMeals =>
      prevMeals.map(meal =>
        meal.id === mealId
          ? {
              ...meal,
              savesCount: isSaved ? meal.savesCount - 1 : meal.savesCount + 1,
              isSavedByCurrentUser: !isSaved,
            }
          : meal
      )
    );

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setRecommendedMeals(prevMeals =>
          prevMeals.map(meal =>
            meal.id === mealId
              ? {
                  ...meal,
                  savesCount: isSaved ? meal.savesCount + 1 : meal.savesCount - 1,
                  isSavedByCurrentUser: isSaved,
                }
              : meal
          )
        );
        Alert.alert('Authentication Error', 'You must be logged in to save meals.');
        return;
      }

      const endpoint = isSaved ? 'unsave' : 'save';

      const response = await fetch(`${BASE_URL}/api/meals/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ meal_id: mealId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Authentication Required', 'Your session has expired. Please log in again.');
        }
        throw new Error(errorData.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal.`);
      }
    } catch (err: any) {
      console.error(`Error ${isSaved ? 'unsaving' : 'saving'} meal:`, err);
      Alert.alert('Error', err.message || `Failed to ${isSaved ? 'unsave' : 'save'} meal. Please try again.`);
      // Rollback UI if API call fails
      setRecommendedMeals(prevMeals =>
        prevMeals.map(meal =>
          meal.id === mealId
            ? {
                ...meal,
                savesCount: isSaved ? meal.savesCount + 1 : meal.savesCount - 1,
                isSavedByCurrentUser: isSaved,
              }
            : meal
        )
      );
    }
  }, []);


  const handleOpenComments = useCallback(async (meal: MealItem) => {
    setSelectedMealForComments(meal);
    setCommentModalVisible(true);
    setFetchingComments(true); // Start loading comments for the modal
    setMealComments([]); // Clear previous comments

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to view comments.');
        setCommentModalVisible(false); // Close modal if no token
        return;
      }

      const response = await fetch(`${BASE_URL}/api/meals/comments/${meal.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Authentication Required', 'Your session has expired. Please log in again to view comments.');
        }
        throw new Error(errorData.message || 'Failed to fetch comments.');
      }

      const data: Comment[] = await response.json();
      setMealComments(data); // Set fetched comments
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      Alert.alert('Error', err.message || 'Failed to load comments. Please try again.');
      setCommentModalVisible(false); // Close modal on error
    } finally {
      setFetchingComments(false); // Stop loading
    }
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!selectedMealForComments || !newCommentContent.trim()) {
      Alert.alert('Input Required', 'Please enter a comment.');
      return;
    }

    const commentContentTrimmed = newCommentContent.trim();

    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to add comments.');
        return;
      }

      const response = await fetch(`${BASE_URL}/api/meals/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          meal_id: selectedMealForComments.id,
          content: commentContentTrimmed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          Alert.alert('Authentication Required', 'Your session has expired. Please log in again.');
        }
        throw new Error(errorData.message || 'Failed to add comment.');
      }

      // Optimistic update for the comment list in the modal AND the main list
      const newComment: Comment = {
        content: commentContentTrimmed,
        created_at: new Date().toISOString(),
        user_id: 'current_user_id_placeholder', // This should ideally come from the backend's response or a user context
        username: 'You', // Placeholder for current user's username
      };

      // Update comments in the modal
      setMealComments(prevComments => [newComment, ...prevComments]);

      // Update comments array for the specific meal in the main recommendedMeals list
      setRecommendedMeals(prevMeals =>
        prevMeals.map(meal =>
          meal.id === selectedMealForComments.id
            ? {
                ...meal,
                comments: [newComment, ...meal.comments], // Add new comment to the meal's comments array
              }
            : meal
        )
      );
      // Update selectedMealForComments to reflect new comment immediately for modal's header count
      setSelectedMealForComments(prev =>
        prev ? { ...prev, comments: [newComment, ...prev.comments] } : null
      );

      setNewCommentContent(''); // Clear input

    } catch (err: any) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', err.message || 'Failed to add comment. Please try again.');
    }
  }, [selectedMealForComments, newCommentContent]);


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
      <StatusBar barStyle={viewMode === 'single' ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recommendations</Text>
        <TouchableOpacity onPress={() => setViewMode(viewMode === 'grid' ? 'single' : 'grid')}>
          <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {recommendedMeals.length === 0 ? (
        <View style={styles.centered}>
          <Text>No recommendations available. Try adjusting your profile goals or eating more meals!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={recommendedMeals}
          key={viewMode === 'grid' ? 'grid' : 'single'} // Change key to force remount on viewMode change
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          renderItem={({ item, index }) => (
            viewMode === 'grid' ? (
              <RecommendationCard
                item={item}
                onPress={handleCardPress}
                onLikePress={handleLike}
                onSavePress={handleSave}
                onCommentPress={handleOpenComments} // Pass the new handler
                isLikedByCurrentUser={item.isLikedByCurrentUser}
                isSavedByCurrentUser={item.isSavedByCurrentUser}
              />
            ) : (
              <SingleMealView
                meal={item}
                onLikePress={handleLike}
                onSavePress={handleSave}
                onCommentPress={handleOpenComments}
              />
            )
          )}
          contentContainerStyle={viewMode === 'grid' ? styles.gridListContent : styles.singleListContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchRecommendedMeals}
              colors={['#0000ff']}
              tintColor={'#0000ff'}
            />
          }
          // Pagination for single view
          pagingEnabled={viewMode === 'single'}
          horizontal={false} // Make it vertical scrolling
          onMomentumScrollEnd={viewMode === 'single' ? (event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.y / height); // Use height for vertical scroll
            setSelectedMealIndex(newIndex);
          } : undefined}
          snapToInterval={viewMode === 'single' ? height : undefined} // Snap to full height for vertical paging
          snapToAlignment={'start'}
          decelerationRate={'fast'}
        />
      )}

      {/* Comments Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={commentModalVisible}
        onRequestClose={() => {
          setCommentModalVisible(!commentModalVisible);
          setSelectedMealForComments(null); // Clear selected meal when closing
          setMealComments([]); // Clear comments when closing
          setNewCommentContent(''); // Clear input
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCommentModalVisible(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={30} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Comments for {selectedMealForComments?.recipe_text}</Text>
          </View>

          {fetchingComments ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color="#0000ff" />
              <Text>Loading comments...</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={mealComments} // Use the dedicated state for modal comments
                keyExtractor={(item, index) => `${item.user_id}-${item.created_at}-${index}`} // Unique key
                renderItem={({ item }) => <CommentItem comment={item} />}
                contentContainerStyle={styles.commentsList}
                ListEmptyComponent={<Text style={styles.emptyCommentsText}>No comments yet. Be the first to comment!</Text>}
              />

              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.commentInputContainer}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -height * 0.1} // Adjust as needed
              >
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Add a comment..."
                  value={newCommentContent}
                  onChangeText={setNewCommentContent}
                  multiline
                  maxLength={200}
                />
                <TouchableOpacity onPress={handleAddComment} style={styles.sendButton}>
                  <Ionicons name="send" size={24} color="#FFF" />
                </TouchableOpacity>
              </KeyboardAvoidingView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Adjust for Android status bar
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
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
  gridListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between', // Distribute items evenly
  },
  singleListContent: {
    flexGrow: 1,
    // No vertical padding needed here as items will fill the screen
  },
  emptyCommentsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalCloseButton: {
    paddingRight: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  commentsList: {
    padding: 15,
    paddingBottom: 20, // Add padding at bottom to prevent input from covering last comment
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  commentTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
    maxHeight: 100, // Prevent input from growing too large
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const commentStyles = StyleSheet.create({
  commentContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  commentContent: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: '#888',
    textAlign: 'right',
  },
});

const singleMealStyles = StyleSheet.create({
  container: {
    width: width,
    height: height, // Each item takes full screen height
    backgroundColor: '#000', // Dark background for sleek look
    justifyContent: 'flex-end', // Align content to the bottom
    position: 'relative',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)', // Semi-transparent overlay
  },
  detailsContainer: {
    padding: 20,
    paddingBottom: 80, // Make space for action buttons
    justifyContent: 'flex-end', // Align content to the bottom
    flexGrow: 1,
  },
  recipeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  timeAgo: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: '#fff',
    marginRight: 15,
    marginBottom: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  macrosContainer: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
  macroText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  actionsContainer: {
    position: 'absolute',
    right: 15,
    bottom: 100, // Adjust to be above the comment input on the main screen (if any)
    alignItems: 'center',
    zIndex: 1,
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    fontWeight: '600',
  },
});