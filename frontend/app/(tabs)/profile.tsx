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
} from 'react-native';
import { Avatar, Button, TextInput, useTheme, Card } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { BASE_URL } from '@/config';
import MacroHistoryChart from '../components/MacroHistoryChart';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth hook

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
};
// -----------------------------------------------------------------------------

const Profile = () => {
  const theme = useTheme();
  const route = useRoute();
  // Destructure from useAuth
  const { user: authUser, authToken, loading: authLoading, refreshUserProfile, logout: authLogout } = useAuth();


  // FIX: More robust access to route.params.id
  // Ensure route.params is an object (even empty) before destructuring 'id'
  const routeUserId = (route.params as { id?: string } | undefined)?.id;

  // We no longer need to manage loggedInUserId and token separately,
  // as useAuth provides the global user and token state.
  // const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  // const [token, setToken] = useState<string | null>(null);

  const [isMyProfile, setIsMyProfile] = useState(false);
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
  const [loading, setLoading] = useState(false); // For form submission
  const [macroHistory, setMacroHistory] = useState<any[]>([]);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  const initialize = useCallback(async () => {
    // Prevent re-fetching if auth is still loading or no token is available from useAuth
    if (authLoading || !authToken || !authUser?.id) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    try {
      // The token is now from useAuth
      // setToken(authToken); // No longer needed as we use authToken directly

      // Logged-in user's ID is from authUser
      const currentLoggedInUserId = authUser.id;
      // setLoggedInUserId(currentLoggedInUserId); // No longer needed

      // Determine the user ID to fetch: routeUserId if present, otherwise loggedInUserId (for own profile)
      const userIdToFetch = routeUserId || currentLoggedInUserId;
      setIsMyProfile(userIdToFetch === currentLoggedInUserId);

      // --- Fetch Profile Data ---
      const profileRes = await axios.get(`${BASE_URL}/api/profile/${userIdToFetch}`, {
        headers: { Authorization: `Bearer ${authToken}` },
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

      // --- Fetch Macro History Data (for any viewed profile) ---
      const historyRes = await axios.get(`${BASE_URL}/api/macro/${userIdToFetch}/history`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setMacroHistory(historyRes.data.data || []);

    } catch (err: any) {
      console.error("Failed to load profile or macro history:", err);
      if (err.response) {
        console.error("API Response Error Data:", err.response.data);
        console.error("API Response Status:", err.response.status);
      }
      Alert.alert('Error', err.response?.data?.error || 'Failed to load profile data. Please try again later.');

      if (err.response?.status === 401) {
        // If the token is truly invalid for the profile fetch, log out
        authLogout();
      }

    } finally {
      setRefreshing(false);
    }
  }, [routeUserId, authToken, authUser?.id, authLoading, authLogout]); // Dependencies for useCallback

  useEffect(() => {
    // Only call initialize if auth is not loading and we have a user/token
    if (!authLoading && authUser && authToken) {
      initialize();
    }
  }, [initialize, authLoading, authUser, authToken]); // Depend on initialize and auth state

  const pickImage = async () => {
    if (!isMyProfile) return;

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
    if (!isMyProfile) return;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    // Use authToken from useAuth
    if (!authToken || !isMyProfile) {
      Alert.alert('Error', 'Unauthorized action.');
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
        formData.append('avatar', ''); // Explicitly send empty string if avatar cleared
      }

      await axios.put(`${BASE_URL}/api/profile/profile`, formData, { // Assuming this is your profile update endpoint
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
      });

      Alert.alert('Success', 'Your profile has been updated successfully!');
      setIsEditingGoals(false);
      // --- CRITICAL CHANGE: Refresh the user profile in AuthContext ---
      await refreshUserProfile();
      // After refreshing AuthContext, re-initialize local state to show the latest data
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

  const hasGoalsSetForViewedProfile = (+form.calories_goal > 0 || +form.protein_goal > 0 || +form.carbs_goal > 0 || +form.fat_goal > 0);

  // Show a loading indicator if AuthContext is still loading
  if (authLoading) {
    return (
      <View style={styles.centeredLoading}>
        <Progress.CircleSnail color={[appColors.primary, appColors.secondary]} size={50} thickness={5} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Handle cases where the user or token is not available after authLoading
  if (!authUser || !authToken) {
    return (
      <View style={styles.centeredLoading}>
        <Text style={styles.errorText}>Please log in to view this profile.</Text>
        <Button mode="contained" onPress={authLogout} style={styles.loginButton}>
          Log In
        </Button>
      </View>
    );
  }

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
        <Card style={styles.sectionCard}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} disabled={!isMyProfile}>
              {avatar ? (
                <Avatar.Image size={100} source={{ uri: avatar }} style={styles.avatar} />
              ) : (
                <Avatar.Icon size={100} icon="account-circle-outline" style={styles.avatar} color={appColors.primary} />
              )}
              {isMyProfile && <Text style={styles.changeAvatarText}>Change Profile Photo</Text>}
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
                editable={isMyProfile}
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
                editable={isMyProfile}
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
                editable={isMyProfile}
              />
            </View>
          </View>
        </Card>

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
            editable={isMyProfile}
          />
          <TextInput
            label="Website"
            value={form.website}
            onChangeText={(text) => handleChange('website', text)}
            mode="outlined"
            style={styles.input}
            outlineColor={appColors.border}
            activeOutlineColor={appColors.primary}
            autoCapitalize="none"
            left={<TextInput.Icon icon="web" color={appColors.textSecondary} />}
            theme={{ colors: { primary: appColors.primary, text: appColors.textPrimary, placeholder: appColors.placeholder } }}
            editable={isMyProfile}
          />
        </Card>

        {hasGoalsSetForViewedProfile ? (
          <>
            <Text style={styles.sectionTitle}>Today's Macros Progress</Text>
            <View style={styles.macrosProgressContainer}>
              {renderMacroProgress('Calories', +form.daily_calories || 0, +form.calories_goal || 0, appColors.error)}
              {renderMacroProgress('Protein', +form.daily_protein || 0, +form.protein_goal || 0, appColors.primary)}
              {renderMacroProgress('Carbs', +form.daily_carbs || 0, +form.carbs_goal || 0, appColors.info)}
              {renderMacroProgress('Fat', +form.daily_fat || 0, +form.fat_goal || 0, appColors.warning)}
            </View>
          </>
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="bulb-outline" size={30} color={appColors.placeholder} />
            <Text style={styles.emptyStateText}>
              {isMyProfile ? "Set your macro goals to track your daily progress here!" : "This user has not set their macro goals."}
            </Text>
          </View>
        )}

        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>Macro Goals</Text>
          {isMyProfile && (
            <TouchableOpacity onPress={() => setIsEditingGoals(!isEditingGoals)} style={styles.editButton}>
              <Ionicons name={isEditingGoals ? "checkmark-circle-outline" : "pencil-outline"} size={20} color={appColors.primary} />
              <Text style={[styles.editButtonText, { color: appColors.primary }]}>{isEditingGoals ? "Done" : "Edit Goals"}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Card style={styles.sectionCard}>
          {!isEditingGoals || !isMyProfile ? (
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
                editable={isMyProfile}
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
                editable={isMyProfile}
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
                editable={isMyProfile}
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
                editable={isMyProfile}
              />
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading || !isMyProfile}
                style={styles.saveGoalsButton}
                labelStyle={styles.buttonLabel}
                contentStyle={styles.buttonContent}
              >
                {loading ? "Saving..." : "Save Goals"}
              </Button>
            </View>
          )}
        </Card>

        {/* This button should likely be for general profile updates, not just when not editing goals */}
        {!isEditingGoals && isMyProfile && (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !isMyProfile}
            style={styles.saveProfileButton}
            labelStyle={styles.buttonLabel}
            contentStyle={styles.buttonContent}
          >
            {loading ? "Saving Profile..." : "Save All Changes"}
          </Button>
        )}

        <Text style={styles.sectionTitle}>Daily Macro History</Text>
        <Card style={styles.graphCard}>
          {macroHistory.length > 0 ? (
            <MacroHistoryChart macroHistory={macroHistory} />
          ) : (
            <View style={styles.emptyStateCard}>
              <Ionicons name="stats-chart-outline" size={30} color={appColors.placeholder} />
              <Text style={styles.emptyStateText}>
                {isMyProfile ? "No macro history data available. Start logging your daily macros!" : "No macro history data available for this user."}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

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
  graphCard: {
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: appColors.cardBackground,
  },
  noGraphData: {
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
  centeredLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appColors.background,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: appColors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: appColors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    marginTop: 10,
    backgroundColor: appColors.primary,
  },
});

export default Profile;