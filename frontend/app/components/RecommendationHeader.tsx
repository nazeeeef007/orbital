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
   
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',

  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  
});

export default RecommendationHeader;