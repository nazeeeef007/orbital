
// --- 2. Create components/IngredientItem.tsx ---
// This component will render a single ingredient row.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Ingredient } from '@/types/Ingredients';


// Placeholder for appColors based on your previous styles
const appColors = {
    background: '#f9fafb',
    cardBackground: '#fff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    primary: '#6C63FF',
    border: '#e5e7eb', // A light grey for borders
    placeholder: '#9ca3af', // A medium grey for placeholder text
    error: '#ef4444',
};

interface IngredientItemProps {
    ingredient: Ingredient;
}

const IngredientItem: React.FC<IngredientItemProps> = ({ ingredient }) => {
    // Helper to format numeric values, displaying 'N/A' for null
    const formatMacro = (value: number | null) => {
        return value !== null ? value.toFixed(1) : 'N/A';
    };

    return (
        <View style={styles.itemContainer}>
            <Text style={styles.itemName}>{ingredient.name}</Text>
            <View style={styles.macroRow}>
                <Text style={styles.macroText}>Weight: {formatMacro(ingredient.weight)}g</Text>
                <Text style={styles.macroText}>Calories: {formatMacro(ingredient.calories)}</Text>
            </View>
            <View style={styles.macroRow}>
                <Text style={styles.macroText}>Protein: {formatMacro(ingredient.protein)}g</Text>
                <Text style={styles.macroText}>Carbs: {formatMacro(ingredient.carbs)}g</Text>
                <Text style={styles.macroText}>Fat: {formatMacro(ingredient.fat)}g</Text>
            </View>
            {/* You can add created_at/updated_at if needed, but often not relevant for each row */}
            {/* <Text style={styles.dateText}>Created: {new Date(ingredient.created_at).toLocaleDateString()}</Text> */}
        </View>
    );
};

const styles = StyleSheet.create({
    itemContainer: {
        backgroundColor: appColors.cardBackground,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        color: appColors.textPrimary,
        marginBottom: 8,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    macroText: {
        fontSize: 14,
        color: appColors.textSecondary,
        flex: 1, // Distribute space evenly
    },
    dateText: {
        fontSize: 12,
        color: appColors.textSecondary,
        marginTop: 8,
        textAlign: 'right',
    },
});

export default IngredientItem;
