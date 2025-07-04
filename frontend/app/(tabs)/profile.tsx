import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  RefreshControl,
  Platform,
  // Dimensions, // Removed as it's now in MacroHistoryChart
} from 'react-native';
import { Avatar, Button, TextInput, useTheme, Card, Title, Paragraph, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
// import { LineChart } from 'react-native-chart-kit'; // Removed
import { BASE_URL } from '@/config';
import MacroHistoryChart from '../components/MacroHistoryChart'; // Import the new component

// --- Define appColors outside the component for consistent access ---
const appColors = {
  primary: '#4f46e5', // Indigo
  secondary: '#8b5cf6', // Violet
  background: '#f8f8f8', // Light Grey background
  cardBackground: '#FFFFFF', // White for cards
  textPrimary: '#333333', // Dark text
  textSecondary: '#666666', // Medium grey text
  border: '#E0E0E0', // Light grey border
  success: '#16a34a', // Green
  error: '#dc2626', // Red (for calories progress)
  info: '#0ea5e9', // Sky blue (for carbs progress)
  warning: '#facc15', // Yellow (for fat progress)
  placeholder: '#A0A0A0', // Placeholder text
  // Removed chartLineX colors as they are now in MacroHistoryChart
};
// -----------------------------------------------------------------------------

// Removed DailyMacroHistory interface as it's now in MacroHistoryChart.tsx
// interface DailyMacroHistory { ... }

const Profile = () => {
  const theme = useTheme();

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    website: '',
    daily_calories: '',
    daily_protein: '',
    daily_carbs: '',
    daily_fat: '',
    calories_goal: '',
    protein_goal: '',
    carbs_goal: '',
    fat_goal: '',
  });

  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [macroHistory, setMacroHistory] = useState<any[]>([]); // Keep as any[] or define a shared type if needed
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initialize = useCallback(async () => {
    setRefreshing(true);
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (!storedToken) {
        Alert.alert('Authentication Error', 'No authentication token found. Please log in again.');
        setRefreshing(false);
        return;
      }
      setToken(storedToken);

      // --- Fetch Profile Data ---
      const profileRes = await axios.get(`${BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      const profileData = profileRes.data;

      setForm({
        username: profileData.username || '',
        display_name: profileData.display_name || '',
        bio: profileData.bio || '',
        location: profileData.location || '',
        website: profileData.website || '',
        daily_calories: profileData.daily_calories?.toString() || '0',
        daily_protein: profileData.daily_protein?.toString() || '0',
        daily_carbs: profileData.daily_carbs?.toString() || '0',
        daily_fat: profileData.daily_fat?.toString() || '0',
        calories_goal: profileData.calories_goal?.toString() || '0',
        protein_goal: profileData.protein_goal?.toString() || '0',
        carbs_goal: profileData.carbs_goal?.toString() || '0',
        fat_goal: profileData.fat_goal?.toString() || '0',
      });
      setAvatar(profileData.avatar_url || null);

      // --- Fetch Macro History Data ---
      const historyRes = await axios.get(`${BASE_URL}/api/macro/history`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setMacroHistory(historyRes.data.data || []);

    } catch (err) {
      console.error("Failed to load profile or macro history:", err);
      Alert.alert('Error', 'Failed to load profile data. Please try again later.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);


  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Permission to access media library is needed to set your avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing authentication token. Please log in.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined) {
          if (key.includes('_goal') || key.includes('daily_')) {
            formData.append(key, val === '' ? '0' : val);
          } else {
            formData.append(key, val);
          }
        }
      });

      if (avatar && avatar.startsWith('file://')) {
        const filename = avatar.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('avatar', {
          uri: avatar,
          name: filename || 'avatar.jpg',
          type,
        } as any);
      } else if (avatar === null) {
        formData.append('avatar', '');
      }

      await axios.put(`${BASE_URL}/api/profile/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Your profile has been updated successfully!');
      setIsEditingGoals(false);
      initialize();
    } catch (err: any) {
      console.error("Profile update failed:", err);
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMacroProgress = (label: string, consumed: number, goal: number, color: string) => {
    const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
    const progressText = `${consumed}/${goal}${label.includes('Calories') ? 'kcal' : 'g'}`;
    const percentage = Math.round(progress * 100);

    return (
      <View style={styles.macroCard}>
        <Progress.Circle
          size={85}
          progress={progress}
          showsText
          formatText={() => percentage + '%'}
          color={color}
          unfilledColor={appColors.border}
          borderWidth={0}
          strokeCap="round"
          textStyle={styles.progressText}
        />
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{progressText}</Text>
      </View>
    );
  };

  const hasGoalsSet = +form.calories_goal > 0 || +form.protein_goal > 0 || +form.carbs_goal > 0 || +form.fat_goal > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={initialize}
            tintColor={appColors.primary}
          />
        }
      >
        {/* Profile Header */}
        <Card style={styles.sectionCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
              {avatar ? (
                <Avatar.Image size={100} source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <Avatar.Icon size={100} icon="account-circle-outline" style={styles.avatar} color={appColors.primary} />
              )}
              <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              <TextInput
                label="Display Name"
                value={form.display_name}
                onChangeText={(text) => handleChange('display_name', text)}
                mode="outlined"
                style={styles.infoInput}
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <TextInput
                label="Username"
                value={`@${form.username}`}
                onChangeText={(text) => handleChange('username', text.startsWith('@') ? text.substring(1) : text)}
                mode="outlined"
                style={styles.infoInput}
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                autoCapitalize="none"
                autoCorrect={false}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <TextInput
                label="Bio"
                value={form.bio}
                onChangeText={(text) => handleChange('bio', text)}
                mode="outlined"
                multiline
                numberOfLines={3}
                style={styles.infoInputBio}
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
            </View>
          </View>
        </Card>

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact & Location</Text>
        <Card style={styles.sectionCard}>
          <TextInput
            label="Location"
            value={form.location}
            onChangeText={(text) => handleChange('location', text)}
            style={styles.input}
            mode="outlined"
            outlineColor={appColors.border}
            activeOutlineColor={appColors.primary}
            left={<TextInput.Icon icon="map-marker-outline" color={appColors.textSecondary} />}
            theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
          />
          <TextInput
            label="Website"
            value={form.website}
            onChangeText={(text) => handleChange('website', text)}
            style={styles.input}
            mode="outlined"
            outlineColor={appColors.border}
            activeOutlineColor={appColors.primary}
            autoCapitalize="none"
            left={<TextInput.Icon icon="web" color={appColors.textSecondary} />}
            theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
          />
        </Card>

        {/* Macros Progress Section */}
        {hasGoalsSet && (
          <>
            <Text style={styles.sectionTitle}>Today's Macros Progress</Text>
            <View style={styles.macrosProgressContainer}>
              {renderMacroProgress('Calories', +form.daily_calories || 0, +form.calories_goal || 0, appColors.error)}
              {renderMacroProgress('Protein', +form.daily_protein || 0, +form.protein_goal || 0, appColors.primary)}
              {renderMacroProgress('Carbs', +form.daily_carbs || 0, +form.carbs_goal || 0, appColors.info)}
              {renderMacroProgress('Fat', +form.daily_fat || 0, +form.fat_goal || 0, appColors.warning)}
            </View>
          </>
        )}
        {!hasGoalsSet && (
          <View style={styles.emptyStateCard}>
            <Ionicons name="bulb-outline" size={30} color={appColors.placeholder} />
            <Text style={styles.emptyStateText}>Set your macro goals to track your daily progress here!</Text>
          </View>
        )}


        {/* Macro Goals Section */}
        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>Macro Goals</Text>
          <TouchableOpacity onPress={() => setIsEditingGoals(!isEditingGoals)} style={styles.editButton}>
            <Ionicons name={isEditingGoals ? "checkmark-circle-outline" : "pencil-outline"} size={20} color={appColors.primary} />
            <Text style={[styles.editButtonText, { color: appColors.primary }]}>{isEditingGoals ? "Done" : "Edit Goals"}</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.sectionCard}>
          {!isEditingGoals ? (
            <View style={styles.goalsDisplay}>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Calories Goal:</Text>
                <Text style={styles.goalValue}>{form.calories_goal || '0'} kcal</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Protein Goal:</Text>
                <Text style={styles.goalValue}>{form.protein_goal || '0'} g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Carbs Goal:</Text>
                <Text style={styles.goalValue}>{form.carbs_goal || '0'} g</Text>
              </View>
              <View style={styles.goalItem}>
                <Text style={styles.goalLabel}>Fat Goal:</Text>
                <Text style={styles.goalValue}>{form.fat_goal || '0'} g</Text>
              </View>
            </View>
          ) : (
            <View>
              <TextInput
                label="Calories Goal (kcal)"
                value={form.calories_goal}
                onChangeText={(text) => handleChange('calories_goal', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <TextInput
                label="Protein Goal (g)"
                value={form.protein_goal}
                onChangeText={(text) => handleChange('protein_goal', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <TextInput
                label="Carbs Goal (g)"
                value={form.carbs_goal}
                onChangeText={(text) => handleChange('carbs_goal', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <TextInput
                label="Fat Goal (g)"
                value={form.fat_goal}
                onChangeText={(text) => handleChange('fat_goal', text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                style={styles.input}
                mode="outlined"
                outlineColor={appColors.border}
                activeOutlineColor={appColors.primary}
                theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
              />
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.saveGoalsButton}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                {loading ? "Saving..." : "Save Goals"}
              </Button>
            </View>
          )}
        </Card>

        {/* General Save Profile Button */}
        {!isEditingGoals && (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.saveProfileButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            {loading ? "Saving Profile..." : "Save All Changes"}
          </Button>
        )}

        {/* Daily Macro History Chart - Now a component */}
        <Text style={styles.sectionTitle}>Daily Macro History</Text>
        <Card style={styles.graphCard}>
          <MacroHistoryChart macroHistory={macroHistory} />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Stylesheet definition ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: appColors.cardBackground,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 15,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    marginRight: 20,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: appColors.border,
    borderWidth: 2,
    borderColor: appColors.border,
  },
  changeAvatarText: {
    marginTop: 8,
    color: appColors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  input: {
    marginBottom: 15,
    backgroundColor: appColors.cardBackground,
    borderRadius: 8,
    borderColor: appColors.border,
  },
  infoInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    height: 40,
    marginBottom: 5,
    fontSize: 16,
  },
  infoInputBio: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    marginBottom: 5,
    fontSize: 16,
    minHeight: 80,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appColors.textPrimary,
    marginBottom: 15,
    marginTop: 25,
    paddingLeft: 4,
  },
  macrosProgressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCard: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    backgroundColor: appColors.cardBackground,
    borderRadius: 12,
    paddingVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appColors.textPrimary,
  },
  macroLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: appColors.textSecondary,
  },
  macroValue: {
    fontSize: 14,
    color: appColors.textSecondary,
    marginTop: 3,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: appColors.border,
    height: 1,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 25,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: `${appColors.primary}10`,
  },
  editButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 15,
  },
  goalsDisplay: {
    // This view is now wrapped in a Card style. No need for shadow/background here.
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
    paddingHorizontal: 5,
  },
  goalLabel: {
    fontSize: 16,
    color: appColors.textSecondary,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: appColors.textPrimary,
  },
  saveGoalsButton: {
    marginTop: 20,
    borderRadius: 10,
    backgroundColor: appColors.primary,
  },
  saveProfileButton: {
    marginTop: 30,
    borderRadius: 10,
    backgroundColor: appColors.primary,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: appColors.cardBackground,
  },
  // --- Removed Chart Specific Styles from Profile.tsx ---
  graphCard: {
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: appColors.cardBackground,
    // Removed paddingVertical here as it's now handled by MacroHistoryChart's internal container
  },
  noGraphData: { // Kept for empty state of graphCard if MacroHistoryChart is not used
    textAlign: 'center',
    paddingVertical: 30,
    color: appColors.placeholder,
    fontSize: 15,
  },
  emptyStateCard: {
    backgroundColor: appColors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
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

export default Profile;