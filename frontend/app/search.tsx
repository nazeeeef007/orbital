import React, { useState, useEffect } from 'react';
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
import SearchResultCard from '../components/searchResult';

let debounceTimer: NodeJS.Timeout;

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'meals' | 'users'>('meals');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      dynamicSearch();
    }, 500); // 500ms debounce
  }, [query, type]);

  const dynamicSearch = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication token not found. Please log in again.');
        return;
      }

      const res = await fetch(
        `http://${BASE_URL}:3000/api/search?q=${encodeURIComponent(query)}&type=${type}`,
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
      Alert.alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search users or meals..."
        value={query}
        onChangeText={setQuery}
        style={styles.input}
        placeholderTextColor="#888"
      />

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, type === 'users' && styles.activeButton]}
          onPress={() => setType('users')}
        >
          <Text style={styles.toggleText}>Users</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, type === 'meals' && styles.activeButton]}
          onPress={() => setType('meals')}
        >
          <Text style={styles.toggleText}>Meals</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#1E90FF" style={styles.loader} />}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <SearchResultCard item={item} type={type} />}
        ListEmptyComponent={
          !loading && query.trim().length > 0 ? (
            <Text style={styles.emptyText}>No results found.</Text>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#1E90FF',
  },
  toggleText: {
    color: '#fff',
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
    fontSize: 16,
  },
});
