// app/(tabs)/search.tsx
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
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';
import SearchResultCard from '../../components/searchResult'; // Your existing SearchResultCard
import { Ionicons } from '@expo/vector-icons'; // For search icon and filter icon
import RecommendationScreen from '../components/recommendationScreen'; // Import the new component

let debounceTimer: NodeJS.Timeout;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'meals' | 'users'>('meals');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Use a state to track if a search was explicitly performed (query is not empty)
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults([]); // Clear results when query is empty
      setHasSearched(false); // No active search
      clearTimeout(debounceTimer); // Clear any pending debounces
      return;
    }

    setHasSearched(true); // User has entered a query
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      dynamicSearch();
    }, 500); // 500ms debounce
  }, [query, type]);

  const dynamicSearch = useCallback(async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication token not found. Please log in again.');
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

      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
      Alert.alert('Search Failed', 'Could not perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [query, type]); // Dependencies for useCallback

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          placeholder="Search users or meals..."
          value={query}
          onChangeText={setQuery}
          style={styles.input}
          placeholderTextColor="#888"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && ( // Show clear button if query is not empty
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'users' && styles.activeButton]}
          onPress={() => setType('users')}
        >
          <Text style={[styles.toggleText, type === 'users' && styles.activeButtonText]}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, type === 'meals' && styles.activeButton]}
          onPress={() => setType('meals')}
        >
          <Text style={[styles.toggleText, type === 'meals' && styles.activeButtonText]}>Meals</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#FE2C55" style={styles.loader} />}

      {/* Conditionally render RecommendationScreen or Search Results */}
      {!hasSearched ? ( // If no search query is active
        <RecommendationScreen />
      ) : (
        // Display search results if a query is active
        <FlatList
          data={results}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <SearchResultCard item={item} type={type} />}
          ListEmptyComponent={
            !loading && query.trim().length > 0 && results.length === 0 ? (
              <View style={styles.centeredMessage}>
                <Ionicons name="compass-outline" size={48} color="#888" />
                <Text style={styles.emptyText}>No results found for "{query}".</Text>
                <Text style={styles.emptySubText}>Try a different query or switch type.</Text>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5', // Light background for the screen
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15, // Increased margin
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000', // Subtle shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 48, // Consistent height for input
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA', // Light grey background for toggle
    borderRadius: 10,
    marginBottom: 20, // Increased margin
    overflow: 'hidden',
    alignSelf: 'center', // Center the toggle bar
    width: '90%', // Make it slightly narrower than full width
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FE2C55', // Vibrant accent color
    borderRadius: 8, // Rounded corners for active segment
    margin: 4, // Little spacing for the active button within the container
  },
  toggleText: {
    color: '#555', // Default text color for inactive
    fontWeight: '600',
    fontSize: 15,
  },
  activeButtonText: {
    color: 'white', // White text for active button
  },
  loader: {
    marginVertical: 20,
  },
  centeredMessage: {
    flex: 1, // Allow it to take available space
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#888',
    fontSize: 17,
    fontWeight: '500',
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: 5,
    color: '#A0A0A0',
    fontSize: 14,
  },
});