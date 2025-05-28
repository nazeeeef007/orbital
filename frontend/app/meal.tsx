import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '@/config';

const Meals = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchMeals = async () => {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://${BASE_URL}:3000/api/meals`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setMeals(data);
    } catch (err) {
      console.error('Failed to fetch meals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

  return (
    <>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => handleImagePress(item.meal_image_url)}>
              <Image source={{ uri: item.meal_image_url }} style={styles.mainImage} />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <Text style={styles.caption}>{item.recipe_text}</Text>

              <View style={styles.macrosRow}>
                <Text style={styles.macro}>🍗 {item.protein}g</Text>
                <Text style={styles.macro}>🍞 {item.carbs}g</Text>
                <Text style={styles.macro}>🥑 {item.fat}g</Text>
                <Text style={styles.macro}>🔥 {item.calories} cal</Text>
              </View>

              {item.recipe_image_url && (
                <TouchableOpacity onPress={() => handleImagePress(item.recipe_image_url)}>
                  <Image source={{ uri: item.recipe_image_url }} style={styles.recipeImage} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer}>
              {['❤️', '💬', '🔖'].map((icon, index) => (
                <TouchableOpacity key={index} style={styles.footerButton}>
                  <Text style={styles.footerIcon}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent>
        <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullscreenImage} resizeMode="contain" />
          )}
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  mainImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  infoContainer: {
    padding: 16,
  },
  caption: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  macro: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  recipeImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f1f1',
  },
  footerButton: {
    padding: 6,
    borderRadius: 8,
  },
  footerIcon: {
    fontSize: 22,
    opacity: 0.85,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '92%',
    height: '70%',
  },
});

export default Meals;
