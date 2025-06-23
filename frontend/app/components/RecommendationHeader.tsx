// components/RecommendationHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RecommendationHeaderProps {
  title: string;
  viewMode: 'grid' | 'single';
  onToggleViewMode: () => void;
}

const RecommendationHeader: React.FC<RecommendationHeaderProps> = ({
  title,
  viewMode,
  onToggleViewMode,
}) => {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onToggleViewMode} style={styles.toggleButton}>
        <Ionicons name={viewMode === 'grid' ? 'list' : 'grid'} size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  toggleButton: {
    padding: 5, // Make the touch area a bit larger
  }
});

export default RecommendationHeader;