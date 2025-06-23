// screens/upload.tsx (or whatever path your upload screen is)
import React, { useState, useCallback } from 'react';
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
  Alert,
  Switch,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/config';
import { Ionicons } from '@expo/vector-icons';
// Import your new CustomDropdown component
import { CustomDropdown } from '../components/CustomDropdown'; // Adjust path as needed

// Define a type for the ImagePickerAsset to ensure type safety
interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  // Add other properties if you use them, e.g., type, fileName
}

// --- Constants for Dropdown Options (moved from component to here for clarity) ---
const CUISINE_OPTIONS = [
  { label: 'African', value: 'African' },
  { label: 'American', value: 'American' },
  { label: 'Asian', value: 'Asian' }, // Broad category, but good for general selection
  { label: 'Caribbean', value: 'Caribbean' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'French', value: 'French' },
  { label: 'German', value: 'German' },
  { label: 'Greek', value: 'Greek' },
  { label: 'Indian', value: 'Indian' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Mediterranean', value: 'Mediterranean' },
  { label: 'Mexican', value: 'Mexican' },
  { label: 'Middle Eastern', value: 'Middle Eastern' },
  { label: 'South American', value: 'South American' },
  { label: 'Southeast Asian', value: 'Southeast Asian' }, // More specific than just 'Asian'
  { label: 'Spanish', value: 'Spanish' },
  { label: 'Thai', value: 'Thai' },
  { label: 'Turkish', value: 'Turkish' },
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'Other', value: 'Other' },
];

const DIET_TYPE_OPTIONS = [
  { label: 'Carnivore', value: 'Carnivore' },
  { label: 'Dairy-Free', value: 'Dairy-Free' },
  { label: 'Gluten-Free', value: 'Gluten-Free' },
  { label: 'Halal', value: 'Halal' },
  { label: 'Keto', value: 'Keto' },
  { label: 'Low Carb', value: 'Low Carb' },
  { label: 'Low Fat', value: 'Low Fat' },
  { label: 'Nut-Free', value: 'Nut-Free' },
  { label: 'Omnivore', value: 'Omnivore' }, // Standard, eats everything
  { label: 'Paleo', value: 'Paleo' },
  { label: 'Pescatarian', value: 'Pescatarian' },
  { label: 'Sugar-Free', value: 'Sugar-Free' },
  { label: 'Vegan', value: 'Vegan' },
  { label: 'Vegetarian', value: 'Vegetarian' },
  { label: 'Other', value: 'Other' },
];
const SPICE_LEVEL_OPTIONS = [
  { label: '1 (Mild)', value: '1' },
  { label: '2', value: '2' },
  { label: '3 (Medium)', value: '3' },
  { label: '4', value: '4' },
  { label: '5 (Spicy)', value: '5' },
];
const MEAL_TIME_OPTIONS = [
  { label: 'Breakfast', value: 'Breakfast' },
  { label: 'Lunch', value: 'Lunch' },
  { label: 'Dinner', value: 'Dinner' },
  { label: 'Snack', value: 'Snack' },
];

export default function UploadScreen() {
  const router = useRouter();

  // State for all meal schema columns
  const [mealImage, setMealImage] = useState<ImagePickerAsset | null>(null);
  const [recipeImage, setRecipeImage] = useState<ImagePickerAsset | null>(null);
  const [recipeText, setRecipeText] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [dietType, setDietType] = useState('');
  const [spiceLevel, setSpiceLevel] = useState<string>('');
  const [isHomecooked, setIsHomecooked] = useState(true);
  const [prepTimeMins, setPrepTimeMins] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [useAIForMacros, setUseAIForMacros] = useState(false);

  /**
   * Handles picking an image from the device's media library.
   * Prompts for permission if not already granted.
   * @param setImageFn The state setter function for the image.
   */
  const pickImage = useCallback(async (setImageFn: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access media library is needed to upload images!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageFn(result.assets[0]);
    }
  }, []);

  /**
   * Initiates AI analysis for meal macros based on the uploaded meal image and recipe text.
   */
  const handleAIAnalysis = async () => {
    if (!mealImage) {
      Alert.alert('Missing Meal Image', 'Please select a meal image to analyze with AI.');
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('meal_image', {
        uri: mealImage.uri,
        name: `meal_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);
      formData.append('recipe_text', recipeText);

      const response = await fetch(`${BASE_URL}/api/upload/uploadAi`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze meal with AI.');
      }

      const { macros } = await response.json();
      setCalories(macros.calories ? String(Math.round(macros.calories)) : '');
      setProtein(macros.protein ? String(Math.round(macros.protein)) : '');
      setCarbs(macros.carbohydrates ? String(Math.round(macros.carbohydrates)) : '');
      setFat(macros.fat ? String(Math.round(macros.fat)) : '');

      Alert.alert('AI Analysis Complete', 'Macro nutrients have been pre-filled. Please review and adjust if needed.');

    } catch (err: any) {
      console.error('AI analysis error:', err);
      Alert.alert('AI Analysis Failed', err.message || 'An unexpected error occurred during AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the submission of the meal data. Performs validation and sends data to the API.
   */
  const uploadMeal = async () => {
    // --- Validation ---
    if (!mealImage) {
      Alert.alert('Validation Error', 'Please upload a **Meal Photo**.');
      return;
    }
    if (!recipeText.trim()) {
      Alert.alert('Validation Error', 'Please provide a **Recipe Description**.');
      return;
    }
    if (!calories || !protein || !carbs || !fat) {
      Alert.alert('Validation Error', 'Please fill in all **Nutritional Information** (Calories, Protein, Carbs, Fat).');
      return;
    }
    if (!cuisine) {
      Alert.alert('Validation Error', 'Please select a **Cuisine Type**.');
      return;
    }
    if (!mealTime) {
      Alert.alert('Validation Error', 'Please select a **Meal Time**.');
      return;
    }
    if (!dietType) {
      Alert.alert('Validation Error', 'Please select a **Diet Type**.');
      return;
    }
    if (!spiceLevel) {
      Alert.alert('Validation Error', 'Please select a **Spice Level**.');
      return;
    }

    if (isHomecooked) {
      if (!prepTimeMins || parseInt(prepTimeMins) <= 0) {
        Alert.alert('Validation Error', 'Please provide a valid **Prep Time** in minutes for homecooked meals.');
        return;
      }
    } else {
      if (!price || parseFloat(price) <= 0) {
        Alert.alert('Validation Error', 'Please provide a valid **Price** for non-homecooked meals.');
        return;
      }
      if (!location.trim()) {
        Alert.alert('Validation Error', 'Please provide a **Location** for non-homecooked meals.');
        return;
      }
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        Alert.alert('Authentication Error', 'You are not logged in. Please log in again.');
        router.replace('/login');
        return;
      }

      const formData = new FormData();
      formData.append('meal_image', {
        uri: mealImage.uri,
        name: `meal_${Date.now()}.jpg`,
        type: 'image/jpeg',
      } as any);

      if (recipeImage) {
        formData.append('recipe_image', {
          uri: recipeImage.uri,
          name: `recipe_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

      formData.append('recipe_text', recipeText);
      formData.append('calories', calories);
      formData.append('protein', protein);
      formData.append('carbs', carbs);
      formData.append('fat', fat);
      formData.append('cuisine', cuisine);
      formData.append('meal_time', mealTime);
      formData.append('diet_type', dietType);
      formData.append('spice_level', spiceLevel);

      if (isHomecooked) {
        formData.append('prep_time_mins', prepTimeMins);
        formData.append('price', '0');
        formData.append('location', 'Homecooked');
      } else {
        formData.append('price', price);
        formData.append('location', location);
      }

      const response = await fetch(`${BASE_URL}/api/upload/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload meal.');
      }

      Alert.alert('Success', 'Meal uploaded successfully!');
      // Reset form fields
      setMealImage(null);
      setRecipeImage(null);
      setRecipeText('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
      setCuisine('');
      setMealTime('');
      setDietType('');
      setSpiceLevel('');
      setIsHomecooked(true);
      setPrepTimeMins('');
      setPrice('');
      setLocation('');
      setUseAIForMacros(false);

      router.replace('/profile');
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'An unexpected error occurred during upload. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renders a customizable image selection box.
   * @param image The currently selected image.
   * @param label The text label for the image box.
   * @param setImageFn The setter function for the image state.
   */
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
          <Ionicons name="camera-outline" size={40} color="#666" />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.fullScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>New Meal Entry</Text>

          {/* Image Pickers */}
          <View style={styles.imagePickersRow}>
            {renderImageBox(mealImage, 'Meal Photo *', setMealImage)}
            {renderImageBox(recipeImage, 'Recipe Photo (Optional)', setRecipeImage)}
          </View>

          {/* AI Toggle for Macros */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Analyze Macros with AI</Text>
            <Switch
              value={useAIForMacros}
              onValueChange={setUseAIForMacros}
              trackColor={{ false: '#767577', true: '#A5D6A7' }}
              thumbColor={useAIForMacros ? '#4CAF50' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
          {useAIForMacros && (
            <TouchableOpacity
              style={[styles.aiButton, loading && styles.buttonDisabled]}
              onPress={handleAIAnalysis}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Get AI Macro Analysis</Text>
              )}
            </TouchableOpacity>
          )}

          <Text style={styles.sectionHeader}>Recipe Details *</Text>
          <TextInput
            placeholder="Describe your meal/recipe... (e.g., 'Spicy chicken curry with basmati rice')"
            value={recipeText}
            onChangeText={setRecipeText}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.multilineInput]}
            placeholderTextColor="#888"
          />

          <Text style={styles.sectionHeader}>Nutritional Information *</Text>
          <View style={styles.macroInputsGrid}>
            <TextInput
              placeholder="Calories (kcal)"
              keyboardType="numeric"
              value={calories}
              onChangeText={(text) => setCalories(text.replace(/[^0-9.]/g, ''))}
              style={styles.macroInput}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Protein (g)"
              keyboardType="numeric"
              value={protein}
              onChangeText={(text) => setProtein(text.replace(/[^0-9.]/g, ''))}
              style={styles.macroInput}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Carbs (g)"
              keyboardType="numeric"
              value={carbs}
              onChangeText={(text) => setCarbs(text.replace(/[^0-9.]/g, ''))}
              style={styles.macroInput}
              placeholderTextColor="#888"
            />
            <TextInput
              placeholder="Fat (g)"
              keyboardType="numeric"
              value={fat}
              onChangeText={(text) => setFat(text.replace(/[^0-9.]/g, ''))}
              style={styles.macroInput}
              placeholderTextColor="#888"
            />
          </View>

          <Text style={styles.sectionHeader}>Meal Characteristics *</Text>
          {/* Custom Dropdown for Cuisine */}
          <CustomDropdown
            label="Cuisine Type"
            placeholder="Select Cuisine..."
            options={CUISINE_OPTIONS}
            selectedValue={cuisine}
            onValueChange={setCuisine}
          />

          {/* Custom Dropdown for Meal Time */}
          <CustomDropdown
            label="Meal Time"
            placeholder="Select Meal Time..."
            options={MEAL_TIME_OPTIONS}
            selectedValue={mealTime}
            onValueChange={setMealTime}
          />

          {/* Custom Dropdown for Diet Type */}
          <CustomDropdown
            label="Diet Type"
            placeholder="Select Diet Type..."
            options={DIET_TYPE_OPTIONS}
            selectedValue={dietType}
            onValueChange={setDietType}
          />

          {/* Custom Dropdown for Spice Level */}
          <CustomDropdown
            label="Spice Level"
            placeholder="Select Spice Level (1-5)..."
            options={SPICE_LEVEL_OPTIONS}
            selectedValue={spiceLevel}
            onValueChange={setSpiceLevel}
          />

          {/* Homecooked Toggle */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Homecooked Meal?</Text>
            <Switch
              value={isHomecooked}
              onValueChange={setIsHomecooked}
              trackColor={{ false: '#767577', true: '#A5D6A7' }}
              thumbColor={isHomecooked ? '#4CAF50' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          {isHomecooked ? (
            <TextInput
              placeholder="Prep Time (minutes) *"
              keyboardType="numeric"
              value={prepTimeMins}
              onChangeText={(text) => setPrepTimeMins(text.replace(/[^0-9]/g, ''))}
              style={styles.input}
              placeholderTextColor="#888"
            />
          ) : (
            <>
              <TextInput
                placeholder="Price (e.g., 12.50) *"
                keyboardType="numeric"
                value={price}
                onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
                style={styles.input}
                placeholderTextColor="#888"
              />
              <TextInput
                placeholder="Location (e.g., Restaurant Name) *"
                value={location}
                onChangeText={setLocation}
                style={styles.input}
                placeholderTextColor="#888"
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.uploadButton, loading && styles.buttonDisabled]}
            onPress={uploadMeal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Upload Meal</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 30,
    color: '#2C3E50',
    textAlign: 'center',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchLabel: {
    fontSize: 16,
    color: '#34495E',
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: '#1E88E5',
    padding: 15,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 25,
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  imagePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  imageBox: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    height: 160,
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13,
    resizeMode: 'cover',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#888',
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 5,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 15,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  multilineInput: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  macroInputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  macroInput: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#DCDCDC',
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  uploadButton: {
    backgroundColor: '#4CAF50',
    padding: 18,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 30,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
    shadowOpacity: 0.1,
    elevation: 2,
  },
});