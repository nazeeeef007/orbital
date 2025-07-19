
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth'; // Adjust path if needed
import IngredientItem from '../components/IngredientItem'; // Adjust path if needed
import { Ionicons } from '@expo/vector-icons'; // Assuming you have expo vector icons installed
import type { Ingredient } from '@/types/Ingredients';

const appColors = {
    background: '#f9fafb',
    cardBackground: '#fff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#6C63FF',
    border: '#e5e7eb',
    placeholder: '#9ca3af',
    error: '#ef4444',
};

const Ingredients: React.FC = () => {
    const { ingredients, loading, authToken } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false); // State to indicate active search

    // Debounce the search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300); // 300ms debounce time

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    // Filter ingredients based on the debounced search query
    const filteredIngredients = useMemo(() => {
        if (!ingredients) {
            return [];
        }
        if (!debouncedSearchQuery) {
            return ingredients; // No search query, return all
        }
        const lowerCaseQuery = debouncedSearchQuery.toLowerCase();
        return ingredients.filter(ingredient =>
            ingredient.name.toLowerCase().startsWith(lowerCaseQuery)
        );
    }, [ingredients, debouncedSearchQuery]);

    // Render item function for FlatList
    const renderItem = useCallback(({ item }: { item: Ingredient }) => (
        <IngredientItem ingredient={item} />
    ), []); // Memoize to prevent unnecessary re-renders of items

    // Handle empty list or loading states
    if (loading) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <ActivityIndicator size="large" color={appColors.primary} />
                <Text style={styles.loadingText}>Loading ingredients...</Text>
            </SafeAreaView>
        );
    }

    if (!authToken) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorText}>Please log in to view ingredients.</Text>
            </SafeAreaView>
        );
    }

    if (!ingredients) {
        return (
            <SafeAreaView style={styles.centeredContainer}>
                <Text style={styles.errorText}>Failed to load ingredients. Please try again later.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.headerTitle}>Ingredients</Text>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color={appColors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search ingredients..."
                        placeholderTextColor={appColors.placeholder}
                        value={searchQuery}
                        onChangeText={text => {
                            setSearchQuery(text);
                            setIsSearching(!!text); // Set searching state if text exists
                        }}
                        clearButtonMode="while-editing" // iOS specific clear button
                    />
                    {isSearching && ( // Show activity indicator only when actively searching
                        <ActivityIndicator size="small" color={appColors.primary} style={styles.searchLoadingIndicator} />
                    )}
                </View>

                {/* Ingredient List */}
                {filteredIngredients.length > 0 ? (
                    <FlatList
                        data={filteredIngredients}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id}
                        initialNumToRender={10} // Render initial items to fill screen
                        maxToRenderPerBatch={5} // Render more items in batches as user scrolls
                        windowSize={21} // Number of items kept in memory (visible + buffer)
                        removeClippedSubviews={true} // Important for performance
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContentContainer}
                    />
                ) : (
                    <View style={styles.emptyStateCard}>
                        <Ionicons name="nutrition-outline" size={50} color={appColors.placeholder} />
                        <Text style={styles.emptyStateText}>
                            {searchQuery ? `No ingredients found for "${searchQuery}".` : "No ingredients available."}
                        </Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: appColors.background,
        paddingTop: Platform.OS === 'android' ? 25 : 0,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: appColors.background,
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: appColors.textSecondary,
    },
    errorText: {
        fontSize: 16,
        color: appColors.error,
        textAlign: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: appColors.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: appColors.cardBackground,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: appColors.textPrimary,
    },
    searchLoadingIndicator: {
        marginLeft: 10,
    },
    listContentContainer: {
        paddingBottom: 40, // Add padding to the bottom of the list
    },
    emptyStateCard: {
        backgroundColor: appColors.cardBackground,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    emptyStateText: {
        marginTop: 10,
        fontSize: 16,
        color: appColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default Ingredients;