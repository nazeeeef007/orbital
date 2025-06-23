// components/RecommendationList.tsx
import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  ListRenderItem,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface RecommendationListProps<T> {
  data: T[];
  viewMode: 'grid' | 'single';
  refreshing: boolean;
  onRefresh: () => void;
  renderItem: ListRenderItem<T>;
  selectedMealIndex: number | null; // For single view initial scroll
  onScrollEnd?: (index: number) => void; // For single view swipe
}

const RecommendationList = <T extends { id: string }>(
  {
    data,
    viewMode,
    refreshing,
    onRefresh,
    renderItem,
    selectedMealIndex,
    onScrollEnd,
  }: RecommendationListProps<T>
) => {
  const flatListRef = useRef<FlatList<T>>(null);

  useEffect(() => {
    // Scroll to the selected meal when view mode changes to single
    if (viewMode === 'single' && flatListRef.current && selectedMealIndex !== null && data.length > 0) {
      // Use a timeout to ensure FlatList has rendered its items
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: selectedMealIndex, animated: false });
      }, 100);
    }
  }, [viewMode, selectedMealIndex, data]);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      key={viewMode === 'grid' ? 'grid-list' : 'single-list'} // Change key to force remount on viewMode change
      keyExtractor={(item) => item.id}
      numColumns={viewMode === 'grid' ? 2 : 1}
      renderItem={renderItem}
      contentContainerStyle={viewMode === 'grid' ? styles.gridListContent : styles.singleListContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0000ff']}
          tintColor={'#0000ff'}
        />
      }
      pagingEnabled={viewMode === 'single'}
      horizontal={false}
      onMomentumScrollEnd={
        viewMode === 'single'
          ? (event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.y / height);
              onScrollEnd && onScrollEnd(newIndex);
            }
          : undefined
      }
      snapToInterval={viewMode === 'single' ? height : undefined}
      snapToAlignment={'start'}
      decelerationRate={'fast'}
    />
  );
};

const styles = StyleSheet.create({
  gridListContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  singleListContent: {
    flexGrow: 1,
  },
});

export default RecommendationList;