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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';
import SearchResultCard from '../../components/searchResult';
import RecommendationScreen from '../components/recommendationScreen';
import { Ionicons } from '@expo/vector-icons';

let debounceTimer: NodeJS.Timeout;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'meals' | 'users'>('meals');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // DEBUG LOG: Track query and hasSearched
  console.log('SearchScreen rendered. query:', `"${query}"`, 'hasSearched:', hasSearched);


  useEffect(() => {
    if (!query.trim()) {
      console.log('SearchScreen useEffect: Query is empty. Setting hasSearched to false.'); // DEBUG LOG
      setResults([]);
      setHasSearched(false);
      clearTimeout(debounceTimer);
      return;
    }

    console.log('SearchScreen useEffect: Query is NOT empty. Setting hasSearched to true.'); // DEBUG LOG
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
          {query.length > 0 && (
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

        {loading && hasSearched && <ActivityIndicator size="large" color="#FE2C55" style={styles.loader} />}

        {/* Conditionally render RecommendationScreen or Search Results */}
        {!hasSearched ? (
          <>
            {console.log('Rendering RecommendationScreen')} {/* DEBUG LOG */}
            <RecommendationScreen />
          </>
        ) : (
          <>
            {console.log('Rendering Search Results FlatList')} {/* DEBUG LOG */}
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
              style={styles.resultsList}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ... (unchanged styles)
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
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
    height: 48,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
    padding: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    alignSelf: 'center',
    width: '90%',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#FE2C55',
    borderRadius: 8,
    margin: 4,
  },
  toggleText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
  activeButtonText: {
    color: 'white',
  },
  loader: {
    marginVertical: 20,
  },
  centeredMessage: {
    flex: 1,
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
  resultsList: {
    flex: 1,
  },
});