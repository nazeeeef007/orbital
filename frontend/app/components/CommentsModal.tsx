import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { formatDistanceToNowStrict } from 'date-fns';
import { BASE_URL } from '@/config';

const { height } = Dimensions.get('window');

interface Comment {
  content: string;
  created_at: string;
  user_id: string;
  username?: string;
  avatar_url?: string | null;
}

interface MealItemForComments {
  id: string;
  recipe_text: string;
  comments: Comment[];
}

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  meal: MealItemForComments | null;
  onCommentAdded: (mealId: string, newComment: Comment) => void;
}

const CommentItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <View style={commentStyles.commentContainer}>
    <Image
      source={
        comment.avatar_url
          ? { uri: comment.avatar_url }
          : require('@/assets/images/icon.png') // Fallback avatar
      }
      style={commentStyles.avatar}
    />
    <View style={commentStyles.textContainer}>
      <Text style={commentStyles.commentUsername}>
        {comment.username || 'Unknown User'}
      </Text>
      <Text style={commentStyles.commentContent}>{comment.content}</Text>
      <Text style={commentStyles.commentDate}>
        {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: true })}
      </Text>
    </View>
  </View>
);

const CommentsModal: React.FC<CommentsModalProps> = ({
  visible,
  onClose,
  meal,
  onCommentAdded,
}) => {
  const [newCommentContent, setNewCommentContent] = useState('');
  const [fetchingComments, setFetchingComments] = useState(false);
  const [mealComments, setMealComments] = useState<Comment[]>([]);

  useEffect(() => {
    if (visible && meal) {
      setMealComments(meal.comments || []);
      fetchCommentsForMeal(meal.id);
    } else {
      setMealComments([]);
      setNewCommentContent('');
    }
  }, [visible, meal]);

  const fetchCommentsForMeal = useCallback(async (mealId: string) => {
    setFetchingComments(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You must be logged in to view comments.');
        onClose();
        return;
      }

      const response = await fetch(`${BASE_URL}/api/meals/comments/${mealId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch comments.');
      }

      const data: Comment[] = await response.json();
      setMealComments(data);
    } catch (err: any) {
      console.error('Error fetching comments:', err);
      Alert.alert('Error', err.message || 'Failed to load comments.');
      onClose();
    } finally {
      setFetchingComments(false);
    }
  }, [onClose]);

  const handleAddComment = useCallback(async () => {
    if (!meal || !newCommentContent.trim()) {
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
          meal_id: meal.id,
          content: commentContentTrimmed,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add comment.');
      }

      const addedComment = await response.json();
      const newComment: Comment = {
        content: commentContentTrimmed,
        created_at: addedComment.created_at || new Date().toISOString(),
        user_id: addedComment.user_id || 'current_user_id_placeholder',
        username: addedComment.username || 'You',
        avatar_url: addedComment.avatar_url || null,
      };

      setMealComments(prev => [newComment, ...prev]);
      onCommentAdded(meal.id, newComment);
      setNewCommentContent('');
    } catch (err: any) {
      console.error('Error adding comment:', err);
      Alert.alert('Error', err.message || 'Failed to add comment.');
    }
  }, [meal, newCommentContent, onCommentAdded]);

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={modalStyles.modalContainer}>
        <View style={modalStyles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={modalStyles.modalCloseButton}>
            <Ionicons name="close" size={30} color="#333" />
          </TouchableOpacity>
          <Text style={modalStyles.modalTitle} numberOfLines={1}>
            Comments for {meal?.recipe_text}
          </Text>
        </View>

        {fetchingComments ? (
          <View style={modalStyles.centered}>
            <ActivityIndicator size="small" color="#0000ff" />
            <Text>Loading comments...</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={mealComments}
              keyExtractor={(item, index) => `${item.user_id}-${item.created_at}-${index}`}
              renderItem={({ item }) => <CommentItem comment={item} />}
              contentContainerStyle={modalStyles.commentsList}
              ListEmptyComponent={
                <Text style={modalStyles.emptyCommentsText}>
                  No comments yet. Be the first to comment!
                </Text>
              }
            />
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={modalStyles.commentInputContainer}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -height * 0.1}
            >
              <TextInput
                style={modalStyles.commentTextInput}
                placeholder="Add a comment..."
                value={newCommentContent}
                onChangeText={setNewCommentContent}
                multiline
                maxLength={200}
                placeholderTextColor="#999"
              />
              <TouchableOpacity onPress={handleAddComment} style={modalStyles.sendButton}>
                <Ionicons name="send" size={24} color="#FFF" />
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const commentStyles = StyleSheet.create({
  commentContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#ddd',
  },
  textContainer: {
    flex: 1,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  commentContent: {
    fontSize: 15,
    color: '#555',
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 11,
    color: '#888',
    textAlign: 'left',
  },
});

const modalStyles = StyleSheet.create({
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
    paddingBottom: 20,
    flexGrow: 1,
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
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCommentsText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontSize: 16,
  },
});

export default CommentsModal;
