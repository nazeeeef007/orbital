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
  ActionSheetIOS, // For iOS specific action sheet
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/config';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Added MaterialCommunityIcons for variety
import { CustomDropdown } from '../components/CustomDropdown';
import axios from 'axios';

// Define a type for the ImagePickerAsset to ensure type safety
interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  fileName?: string; // Add fileName as it's useful for FormData
  type?: string;     // Add type as it's useful for FormData
}

// --- Constants for Dropdown Options ---
const CUISINE_OPTIONS = [
  { label: 'African', value: 'African' },
  { label: 'American', value: 'American' },
  { label: 'Asian', value: 'Asian' },
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
  { label: 'Southeast Asian', value: 'Southeast Asian' },
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
  { label: 'Omnivore', value: 'Omnivore' },
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

// --- Modern Color Palette ---
const Colors = {
  primary: '#6C63FF', // A vibrant purple/blue for primary actions
  secondary: '#00B8D9', // A bright teal for secondary elements
  background: '#F0F2F5', // Light grey for a clean background
  cardBackground: '#FFFFFF', // White for cards and inputs
  textPrimary: '#333333', // Dark text for readability
  textSecondary: '#6B7280', // Lighter text for hints and labels
  border: '#E5E7EB', // Subtle border color
  success: '#28A745', // Green for success
  error: '#DC3545', // Red for errors
  warning: '#FFC107', // Yellow for warnings
  placeholder: '#9CA3AF', // Placeholder text color
};


export default function UploadScreen() {
  const router = useRouter();

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
   * Prompts the user to choose between taking a photo or selecting from the gallery.
   * @param setImageFn The state setter function for the image.
   */
  const showImagePickerOptions = useCallback((setImageFn: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>) => {
    const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options,
          cancelButtonIndex: cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            await takePhoto(setImageFn);
          } else if (buttonIndex === 1) {
            await pickImage(setImageFn);
          }
        }
      );
    } else {
      // For Android, use Alert.alert to simulate ActionSheet
      Alert.alert(
        'Select Image',
        'Choose an option to add your image:',
        [
          { text: 'Take Photo', onPress: () => takePhoto(setImageFn) },
          { text: 'Choose from Gallery', onPress: () => pickImage(setImageFn) },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    }
  }, []);

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
   * Handles taking a photo with the device's camera.
   * Prompts for permission if not already granted.
   * @param setImageFn The state setter function for the image.
   */
  const takePhoto = useCallback(async (setImageFn: React.Dispatch<React.SetStateAction<ImagePickerAsset | null>>) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access camera is needed to take photos!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
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
      const response = await fetch(mealImage.uri);
      const imageBlob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64 = reader.result?.toString().split(',')[1];
        const dataUri = `data:image/jpeg;base64,${base64}`;

        const backendRes = await fetch(`${BASE_URL}/api/bot/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: dataUri,
            description: recipeText || 'No description provided',
          }),
        });

        const data = await backendRes.json();

        if (!backendRes.ok) {
          throw new Error(data.error || 'AI analysis failed');
        }

        const macros = data.macros;
        setCalories(String(macros.calories || ''));
        setProtein(String(macros.protein || ''));
        setCarbs(String(macros.carbs || macros.carbohydrates || ''));
        setFat(String(macros.fat || '')); // Ensure fat is also set

        setCuisine(data.cuisine || '');
        setMealTime(data.meal_time || '');

        Alert.alert('AI Analysis Complete', 'Macros updated based on image.');
      };

      reader.readAsDataURL(imageBlob);
    } catch (err: any) {
      console.error('AI analysis error:', err);
      Alert.alert('AI Analysis Failed', err.message || 'Unexpected error.');
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


       const getFileName = (fileName: string | undefined) => {
      if (!fileName) return `file_${Date.now()}.jpg`; // fallback filename
      return fileName.includes('.') ? fileName : `${fileName}.jpg`;
    };

    const formData = new FormData();

    formData.append('meal_image', {
      uri: mealImage.uri,
      name: getFileName(mealImage.fileName),
      type: 'image/jpeg',
    });

    if (recipeImage) {
      formData.append('recipe_image', {
        uri: recipeImage.uri,
        name: getFileName(recipeImage.fileName),
        type: 'image/jpeg',
      });
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
        formData.append('price', '0'); // Set default price for homecooked
        formData.append('location', 'Homecooked'); // Default location for homecooked
      } else {
        formData.append('price', price);
        formData.append('location', location);
      }
      for (let pair of formData.entries()) {
      console.log(`${pair[0]}:`, pair[1]);
    }

      const response = await fetch(`${BASE_URL}/api/upload/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      console.log('Status:', response.status);
      const json = await response.text();
      console.log('Response body:', json);
      if (!response.ok) {

        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload meal.');
      }
      // console.log(response);
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
      onPress={() => showImagePickerOptions(setImageFn)} // Use the new function here
      style={styles.imageBox}
      activeOpacity={0.7}
    >
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderContent}>
          <Ionicons name="camera" size={40} color={Colors.primary} />
          <Text style={styles.placeholderText}>{label}</Text>
        </View>
      )}
      {image && (
        <TouchableOpacity
          style={styles.clearImageButton}
          onPress={() => setImageFn(null)}
        >
          <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
        </TouchableOpacity>
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
          <Text style={styles.title}>Dish & Diet Details</Text>
          <Text style={styles.subtitle}>Share your meal and track its nutrition!</Text>

          {/* Image Pickers */}
          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Dish Photos</Text>
            <View style={styles.imagePickersRow}>
              {renderImageBox(mealImage, 'Meal Photo *', setMealImage)}
              {renderImageBox(recipeImage, 'Recipe Photo (Optional)', setRecipeImage)}
            </View>
          </View>

          {/* AI Toggle for Macros */}
          <View style={styles.sectionCard}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Analyze Macros with AI</Text>
              <Switch
                value={useAIForMacros}
                onValueChange={setUseAIForMacros}
                trackColor={{ false: Colors.border, true: Colors.secondary + '80' }} // Faded secondary color
                thumbColor={useAIForMacros ? Colors.secondary : Colors.cardBackground}
                ios_backgroundColor={Colors.border}
              />
            </View>
            {useAIForMacros && (
              <TouchableOpacity
                style={[styles.aiButton, loading && styles.buttonDisabled]}
                onPress={handleAIAnalysis}
                disabled={loading || !mealImage} // Disable if no meal image
              >
                {loading ? (
                  <ActivityIndicator color={Colors.cardBackground} size="small" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Ionicons name="bulb-outline" size={20} color={Colors.cardBackground} style={{ marginRight: 8 }} />
                    <Text style={styles.buttonText}>Get AI Macro Analysis</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {useAIForMacros && !mealImage && (
              <Text style={styles.aiHintText}>
                * Select a meal photo above to enable AI analysis.
              </Text>
            )}
          </View>


          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Recipe & Nutritional Information</Text>
            <TextInput
              placeholder="Describe your meal/recipe... (e.g., 'Spicy chicken curry with basmati rice')"
              value={recipeText}
              onChangeText={setRecipeText}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.multilineInput]}
              placeholderTextColor={Colors.placeholder}
            />

            <View style={styles.macroInputsGrid}>
              <TextInput
                placeholder="Calories (kcal)"
                keyboardType="numeric"
                value={calories}
                onChangeText={(text) => setCalories(text.replace(/[^0-9.]/g, ''))}
                style={styles.macroInput}
                placeholderTextColor={Colors.placeholder}
              />
              <TextInput
                placeholder="Protein (g)"
                keyboardType="numeric"
                value={protein}
                onChangeText={(text) => setProtein(text.replace(/[^0-9.]/g, ''))}
                style={styles.macroInput}
                placeholderTextColor={Colors.placeholder}
              />
              <TextInput
                placeholder="Carbs (g)"
                keyboardType="numeric"
                value={carbs}
                onChangeText={(text) => setCarbs(text.replace(/[^0-9.]/g, ''))}
                style={styles.macroInput}
                placeholderTextColor={Colors.placeholder}
              />
              <TextInput
                placeholder="Fat (g)"
                keyboardType="numeric"
                value={fat}
                onChangeText={(text) => setFat(text.replace(/[^0-9.]/g, ''))}
                style={styles.macroInput}
                placeholderTextColor={Colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Meal Characteristics</Text>
            <CustomDropdown
              label="Cuisine Type *"
              placeholder="Select Cuisine..."
              options={CUISINE_OPTIONS}
              selectedValue={cuisine}
              onValueChange={setCuisine}
            />
            <CustomDropdown
              label="Meal Time *"
              placeholder="Select Meal Time..."
              options={MEAL_TIME_OPTIONS}
              selectedValue={mealTime}
              onValueChange={setMealTime}
            />
            <CustomDropdown
              label="Diet Type *"
              placeholder="Select Diet Type..."
              options={DIET_TYPE_OPTIONS}
              selectedValue={dietType}
              onValueChange={setDietType}
            />
            <CustomDropdown
              label="Spice Level *"
              placeholder="Select Spice Level (1-5)..."
              options={SPICE_LEVEL_OPTIONS}
              selectedValue={spiceLevel}
              onValueChange={setSpiceLevel}
            />
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.cardHeader}>Origin & Details</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Homecooked Meal?</Text>
              <Switch
                value={isHomecooked}
                onValueChange={setIsHomecooked}
                trackColor={{ false: Colors.border, true: Colors.success + '80' }} // Faded success color
                thumbColor={isHomecooked ? Colors.success : Colors.cardBackground}
                ios_backgroundColor={Colors.border}
              />
            </View>

            {isHomecooked ? (
              <TextInput
                placeholder="Prep Time (minutes) *"
                keyboardType="numeric"
                value={prepTimeMins}
                onChangeText={(text) => setPrepTimeMins(text.replace(/[^0-9]/g, ''))}
                style={styles.input}
                placeholderTextColor={Colors.placeholder}
              />
            ) : (
              <>
                <TextInput
                  placeholder="Price (e.g., 12.50) *"
                  keyboardType="numeric"
                  value={price}
                  onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
                  style={styles.input}
                  placeholderTextColor={Colors.placeholder}
                />
                <TextInput
                  placeholder="Location (e.g., Restaurant Name) *"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.input}
                  placeholderTextColor={Colors.placeholder}
                />
              </>
            )}
          </View>


          <TouchableOpacity
            style={[styles.uploadButton, loading && styles.buttonDisabled]}
            onPress={uploadMeal}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.cardBackground} size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="cloud-upload-outline" size={24} color={Colors.cardBackground} style={{ marginRight: 10 }} />
                <Text style={styles.buttonText}>Upload Meal</Text>
              </View>
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
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop:20
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  sectionCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: Colors.background, // Match card background or a lighter shade
    paddingHorizontal: 15,
    // No shadow here, let the parent card handle it
  },
  switchLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  aiButton: {
    backgroundColor: Colors.secondary,
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    flexDirection: 'row', // For icon and text
    justifyContent: 'center',
  },
  aiHintText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
  imagePickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  imageBox: {
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 15,
    height: 180, // Slightly taller for more presence
    width: '48%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background, // Use background color for the box itself
    overflow: 'hidden',
    position: 'relative', // For the clear button positioning
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 13, // Slightly less than box to show border
    resizeMode: 'cover',
  },
  placeholderContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: Colors.placeholder,
    marginTop: 10,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 5,
    fontWeight: '500',
  },
  clearImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: Colors.cardBackground,
    borderRadius: 15,
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: Colors.background, // Input background
    fontSize: 16,
    color: Colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
    marginBottom: 5, // Reduced marginBottom
  },
  macroInput: {
    width: '48%',
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: Colors.background,
    fontSize: 16,
    color: Colors.textPrimary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  uploadButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: 12,
    marginTop: 30,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    flexDirection: 'row', // For icon and text
    justifyContent: 'center',
  },
  buttonText: {
    color: Colors.cardBackground,
    fontWeight: 'bold',
    fontSize: 18,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: Colors.primary + '80', // Faded primary color
    shadowOpacity: 0.1,
    elevation: 2,
  },
});