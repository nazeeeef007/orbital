// frontend/app/upload.tsx
import React, { useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BASE_URL } from "@/config";
import { Ionicons } from '@expo/vector-icons';

export default function UploadScreen() {
  const router = useRouter();
  const [mealImage, setMealImage] = useState(null);
  const [recipeImage, setRecipeImage] = useState(null);
  const [recipeText, setRecipeText] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async (setImageFn: any) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setImageFn(result.assets[0]);
    }
  };

  const uploadMeal = async () => {
    if (!recipeText || !mealImage || !calories || !protein || !carbs || !fat) {
      alert('Please fill in all required fields and upload meal image.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      console.log(token);
      if (!token) {
        alert('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('meal_image', {
        uri: mealImage.uri,
        name: 'meal.jpg',
        type: 'image/jpeg',
      });

      if (recipeImage) {
        formData.append('recipe_image', {
          uri: recipeImage.uri,
          name: 'recipe.jpg',
          type: 'image/jpeg',
        });
      }

      formData.append('recipe_text', recipeText);
      formData.append('calories', calories);
      formData.append('protein', protein);
      formData.append('carbs', carbs);
      formData.append('fat', fat);

      const response = await fetch(`http://${BASE_URL}:3000/api/upload/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        alert(data.error || 'Upload failed');
      } else {
        alert('Meal uploaded successfully!');
        router.replace('/home');
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert('Error uploading meal');
    }
  };

  const renderImageBox = (image, label, setImageFn) => (
    <TouchableOpacity onPress={() => pickImage(setImageFn)} style={styles.imageBox}>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons name="camera" size={32} color="#aaa" />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Meal</Text>

      {renderImageBox(mealImage, 'Tap to add Meal Image *', setMealImage)}
      {renderImageBox(recipeImage, 'Tap to add Recipe Image (optional)', setRecipeImage)}

      <TextInput
        placeholder="Recipe description *"
        value={recipeText}
        onChangeText={setRecipeText}
        multiline
        style={styles.input}
      />
      <TextInput placeholder="Calories *" keyboardType="numeric" value={calories} onChangeText={setCalories} style={styles.input} />
      <TextInput placeholder="Protein *" keyboardType="numeric" value={protein} onChangeText={setProtein} style={styles.input} />
      <TextInput placeholder="Carbs *" keyboardType="numeric" value={carbs} onChangeText={setCarbs} style={styles.input} />
      <TextInput placeholder="Fat *" keyboardType="numeric" value={fat} onChangeText={setFat} style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={uploadMeal} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Upload Meal</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4f46e5',
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 12,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  imageBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    marginTop: 8,
    fontSize: 14,
  },
});
