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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert, // Using Alert for better UX
  Switch, // For the AI toggle
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/config'; // Make sure this path is correct
import { Ionicons } from '@expo/vector-icons'; // For icons
// import { mealApi } from "@/apis/mealApi"; // Uncomment if you're using mealApi

// Define a type for the ImagePickerAsset to ensure type safety
interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  // Add other properties if you use them, e.g., type, fileName
}

export default function UploadScreen() {
  const router = useRouter();
  const [mealImage, setMealImage] = useState<ImagePickerAsset | null>(null);
  const [recipeImage, setRecipeImage] = useState<ImagePickerAsset | null>(null);
  const [recipeText, setRecipeText] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [loading, setLoading] = useState(false);
  const [useAI, setUseAI] = useState(false); // State for the AI toggle

  const pickImage = async (setImageFn: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>) => {
    // Request media library permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is needed to upload images!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8, // Slightly reduced quality for faster uploads, still good visual
    });

    if (!result.canceled) {
      setImageFn(result.assets[0]);
    }
  };

  const uploadMeal = async () => {
    // Basic validation
    if (!recipeText.trim() || !mealImage) {
      Alert.alert('Missing Information', 'Please provide a meal image and recipe description.');
      return;
    }

    // Conditional validation for macros based on AI toggle
    if (!useAI && (!calories || !protein || !carbs || !fat)) {
      Alert.alert('Missing Macros', 'Please fill in all macro details (Calories, Protein, Carbs, Fat) for manual upload.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('meal_image', {
        uri: mealImage.uri,
        name: `meal_${Date.now()}.jpg`, // Unique name to prevent caching issues on server
        type: 'image/jpeg',
      } as any); // Type assertion for FormData append

      if (recipeImage) {
        formData.append('recipe_image', {
          uri: recipeImage.uri,
          name: `recipe_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any); // Type assertion for FormData append
      }

      formData.append('recipe_text', recipeText);

      // Only append macros if not using AI (AI would presumably provide them)
      if (!useAI) {
        formData.append('calories', calories);
        formData.append('protein', protein);
        formData.append('carbs', carbs);
        formData.append('fat', fat);
      }
      // You might add a flag to tell your backend whether AI analysis is requested
      formData.append('use_ai_analysis', String(useAI));
      let response = null;
      if (useAI) {
        response = await fetch(`${BASE_URL}/api/upload/uploadAi`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' is often automatically set by fetch with FormData
          },
          body: formData,
        });
      }
      else{
        response = await fetch(`${BASE_URL}/api/upload/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // 'Content-Type': 'multipart/form-data' is often automatically set by fetch with FormData
          },
          body: formData,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload meal.');
      }

      Alert.alert('Success', 'Meal uploaded successfully!');
      // Optionally reset form fields here
      setMealImage(null);
      setRecipeImage(null);
      setRecipeText('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setUseAI(false);

      router.replace('/profile'); // Navigate back to home or a confirmation screen
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'An unexpected error occurred during upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderImageBox = (
    image: ImagePickerAsset | null,
    label: string,
    setImageFn: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>
  ) => (
    <TouchableOpacity
      onPress={() => pickImage(setImageFn)}
      style={styles.imageBox}
      activeOpacity={0.7}
    >
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons name="image-outline" size={40} color="#888" />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f5f5f5' }} // Lighter background
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust offset for header/tab bar
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled" // Keep taps active when keyboard is up
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>New Meal Entry</Text>

          {/* AI Toggle */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Analyze with AI</Text>
            <Switch
              value={useAI}
              onValueChange={setUseAI}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={useAI ? '#2196F3' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          {/* Image Pickers */}
          <View style={styles.imagePickersRow}>
            {renderImageBox(mealImage, 'Meal Photo *', setMealImage)}
            {renderImageBox(recipeImage, 'Recipe Photo (Optional)', setRecipeImage)}
          </View>

          <Text style={styles.sectionHeader}>Recipe Details</Text>
          <TextInput
            placeholder="Describe your meal/recipe... *"
            value={recipeText}
            onChangeText={setRecipeText}
            multiline
            numberOfLines={4} // Give more lines for description
            style={[styles.input, styles.multilineInput]}
            placeholderTextColor="#888"
          />

          {/* Macro Inputs - Conditionally Rendered */}
          {!useAI && (
            <>
              <Text style={styles.sectionHeader}>Nutritional Information *</Text>
              <View style={styles.macroInputsGrid}>
                <TextInput
                  placeholder="Calories (kcal)"
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={(text) => setCalories(text.replace(/[^0-9]/g, ''))} // Allow only numbers
                  style={styles.macroInput}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder="Protein (g)"
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={(text) => setProtein(text.replace(/[^0-9]/g, ''))}
                  style={styles.macroInput}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder="Carbs (g)"
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={(text) => setCarbs(text.replace(/[^0-9]/g, ''))}
                  style={styles.macroInput}
                  placeholderTextColor="#888"
                />
                <TextInput
                  placeholder="Fat (g)"
                  keyboardType="numeric"
                  value={fat}
                  onChangeText={(text) => setFat(text.replace(/[^0-9]/g, ''))}
                  style={styles.macroInput}
                  placeholderTextColor="#888"
                />
              </View>
            </>
          )}

          <TouchableOpacity style={styles.uploadButton} onPress={uploadMeal} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>{useAI ? 'Analyze & Upload Meal' : 'Upload Meal'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5', // Soft background color
    paddingBottom: 40, // Extra padding at bottom for scroll
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25, // More spacing
    color: '#2c3e50', // Darker text for titles
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e0f2f7', // Light blue background for the switch row
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#b3e0ed',
  },
  switchLabel: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  imagePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  imageBox: {
    borderWidth: 2, // Slightly thicker border
    borderColor: '#dcdcdc', // Lighter border color
    borderRadius: 15, // More rounded corners
    height: 160, // Slightly smaller height for better fit in row
    width: '48%', // Two columns with some spacing
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // White background inside image box
    overflow: 'hidden', // Ensure image respects border radius
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13, // Match parent border radius
    resizeMode: 'cover', // Ensure image covers the area nicely
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 10,
    marginTop: 15, // Spacing before new sections
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 14, // Increased padding
    marginBottom: 15, // More spacing between inputs
    borderRadius: 10, // Consistent border radius
    backgroundColor: '#fff', // White background
    fontSize: 16, // Larger font size for readability
    color: '#333',
    shadowColor: '#000', // Subtle shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  multilineInput: {
    minHeight: 100, // Minimum height for multiline text input
    textAlignVertical: 'top', // Align text to the top for multiline
  },
  macroInputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10, // Spacing before the button
  },
  macroInput: {
    width: '48%', // Two columns for macro inputs
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 14,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    backgroundColor: '#28a745', // Green for upload action
    padding: 16,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 20, // More margin above the button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18, // Larger text for main action
  },
});