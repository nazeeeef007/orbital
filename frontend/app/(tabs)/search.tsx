import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';
import SearchResultCard from '../../components/searchResult';
import RecommendationScreen from '../components/recommendationScreen';
import { Ionicons } from '@expo/vector-icons';
// Import useNavigation to pass it down if needed, though SearchResultCard now uses it directly
// import { useNavigation } from '@react-navigation/native'; // Not strictly needed here anymore, but good to know

let debounceTimer: NodeJS.Timeout;

// --- Consistent Color Palette ---
const Colors = {
  primary: '#6C63FF', // A vibrant purple/blue for primary actions
  secondary: '#00B8D9', // A bright teal for secondary elements (used for active toggle)
  background: '#F0F2F5', // Light grey for a clean background
  cardBackground: '#FFFFFF', // White for cards and inputs
  textPrimary: '#333333', // Dark text for readability
  textSecondary: '#6B7280', // Lighter text for hints and labels
  border: '#E5E7EB', // Subtle border color
  success: '#28A745', // Green for success
  error: '#DC3545', // Red for errors
  warning: '#FFC107', // Yellow for warnings
  placeholder: '#9CA3AF', // Placeholder text color
};
// --- End Color Palette ---

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'meals' | 'users'>('meals');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // const navigation = useNavigation(); // If you needed to pass navigation down, you'd uncomment this

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      clearTimeout(debounceTimer);
      return;
    }

    setHasSearched(true);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      dynamicSearch();
    }, 500);
  }, [query, type]);

  const dynamicSearch = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'Authentication token not found. Please log in again.');
        return;
      }

      const res = await fetch(
        `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to perform search.');
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      Alert.alert('Search Failed', 'Could not perform search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, type]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.container}>
          {/* Search Input Bar */}
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={20} color={Colors.placeholder} style={styles.searchIcon} />
            <TextInput
              placeholder="Search users or meals..."
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              placeholderTextColor={Colors.placeholder}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Toggle Buttons - Made Sleeker */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, type === 'meals' && styles.activeToggleButton]}
              onPress={() => setType('meals')}
            >
              <Text style={[styles.toggleText, type === 'meals' && styles.activeToggleText]}>Meals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleButton, type === 'users' && styles.activeToggleButton]}
              onPress={() => setType('users')}
            >
              <Text style={[styles.toggleText, type === 'users' && styles.activeToggleText]}>Users</Text>
            </TouchableOpacity>
          </View>

          {loading && hasSearched && <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />}

          {/* Conditionally render RecommendationScreen or Search Results */}
          {!hasSearched ? (
            <View style={styles.recommendationWrapper}>
              <RecommendationScreen />
            </View>
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              // No need to pass onPress here, as SearchResultCard handles navigation internally for 'users' type.
              // If you had specific meal click logic in SearchScreen, you would pass it like:
              // renderItem={({ item }) => <SearchResultCard item={item} type={type} onPress={type === 'meals' ? handleMealPress : undefined} />}
              renderItem={({ item }) => <SearchResultCard item={item} type={type} />}
              ListEmptyComponent={
                !loading && query.trim().length > 0 && results.length === 0 ? (
                  <View style={styles.centeredMessage}>
                    <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
                    <Text style={styles.emptyText}>No results found for "{query}".</Text>
                    <Text style={styles.emptySubText}>Try a different query or switch search type.</Text>
                  </View>
                ) : null
              }
              contentContainerStyle={styles.resultsListContent}
              showsVerticalScrollIndicator={false}
              style={styles.resultsList}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 0,
    backgroundColor: Colors.background,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 44,
    marginBottom: 4, // Adjusted marginBottom to be closer to the toggle
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 30,
  },
  searchIcon: {
    marginRight: 10,
    color: Colors.placeholder,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 0, // Ensure no extra vertical padding within the input itself
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  // --- Sleeker Toggle Styles ---
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground, // Background for the whole toggle bar
    borderRadius: 10, // Slightly less rounded than search bar for a subtle difference
    overflow: 'hidden', // Ensures active button's border radius is respected
    alignSelf: 'center', // Center the toggle bar
    width: '100%', // Take full width within padding
    marginBottom: 5, // Space below the toggle
    borderWidth: 1, // Subtle border for the container
    borderColor: Colors.border,
    height: 40, // Reduced overall height
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0, // No specific padding, let height dictate
  },
  activeToggleButton: {
    backgroundColor: Colors.primary, // Use primary color for active state
    borderRadius: 8, // Rounded corners for the active segment
    margin: 2, // Creates a small gap around the active segment
    shadowColor: Colors.primary, // Shadow matches active color
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    color: Colors.textSecondary, // Default inactive text color
    fontWeight: '600',
    fontSize: 14, // Slightly smaller text
  },
  activeToggleText: {
    color: Colors.cardBackground, // White text for active button
  },
  // --- End Sleeker Toggle Styles ---
  loader: {
    marginVertical: 30,
  },
  recommendationWrapper: {
    flex: 1,
    paddingTop: 1,
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 0,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 15,
    color: Colors.textSecondary,
    fontSize: 17,
    fontWeight: '500',
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 5,
    color: Colors.placeholder,
    fontSize: 14,
  },
  resultsList: {
    flex: 1,
    marginTop: 10,
  },
  resultsListContent: {
    paddingBottom: 40,
  },
});
