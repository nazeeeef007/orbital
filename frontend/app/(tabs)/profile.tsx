import React, { useEffect, useState, useCallback } from 'react'; // Import useCallback
import {
  View,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  SafeAreaView,
  RefreshControl, // Import RefreshControl
} from 'react-native';
import { Avatar, Button, TextInput, useTheme, Card, Title, Paragraph, Divider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import * as Progress from 'react-native-progress';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/config';

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
  const [macroHistory, setMacroHistory] = useState([]);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // New state for refreshing

  // Wrap initialize logic in useCallback to prevent unnecessary re-creations
  const initialize = useCallback(async () => {
    setRefreshing(true); // Start refreshing indicator
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      if (!storedToken) {
        Alert.alert('Authentication Error', 'No authentication token found. Please log in again.');
        setRefreshing(false); // Stop refreshing if no token
        return;
      }
      setToken(storedToken);

      const profileRes = await axios.get(`${BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });

      const data = profileRes.data;

      setForm({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        daily_calories: data.daily_calories?.toString() || '0',
        daily_protein: data.daily_protein?.toString() || '0',
        daily_carbs: data.daily_carbs?.toString() || '0',
        daily_fat: data.daily_fat?.toString() || '0',
        calories_goal: data.calories_goal?.toString() || '0',
        protein_goal: data.protein_goal?.toString() || '0',
        carbs_goal: data.carbs_goal?.toString() || '0',
        fat_goal: data.fat_goal?.toString() || '0',
      });

      setAvatar(data.avatar_url || null);

      // Fetch macro history if needed for the graph
      const historyRes = await axios.get(`${BASE_URL}/api/macro/history`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      setMacroHistory(historyRes.data.data || []);

    } catch (err) {
      console.error("Failed to load profile:", err);
      Alert.alert('Error', 'Failed to load profile data. Please try again later.');
    } finally {
      setRefreshing(false); // Stop refreshing indicator regardless of success or failure
    }
  }, []); // Empty dependency array as it only needs to be created once

  useEffect(() => {
    initialize();
  }, [initialize]); // Depend on initialize now that it's wrapped in useCallback


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
        if (val !== null && val !== undefined && (val !== '' || key.includes('_goal') || key.includes('daily_'))) {
          formData.append(key, val);
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
      setIsEditingGoals(false); // Exit editing mode after saving
      initialize(); // Re-fetch data after a successful save to ensure fresh values are displayed
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
          unfilledColor={theme.colors.backdrop}
          borderWidth={0}
          strokeCap="round"
          textStyle={styles.progressText}
        />
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{progressText}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={ // Add RefreshControl here
          <RefreshControl
            refreshing={refreshing}
            onRefresh={initialize} // Call initialize on pull to refresh
            tintColor={theme.colors.primary} // Color of the refresh indicator
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
            {avatar ? (
              <Avatar.Image size={100} source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <Avatar.Icon size={100} icon="account-circle-outline" style={styles.avatar} color={theme.colors.primary} />
            )}
            <Text style={styles.changeAvatarText}>Change Profile Photo</Text>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <TextInput
              label="Display Name"
              value={form.display_name}
              onChangeText={(text) => handleChange('display_name', text)}
              mode="flat"
              style={styles.infoInput}
              underlineColor="transparent"
              theme={{ colors: { primary: theme.colors.primary, text: theme.colors.text } }}
            />
            <TextInput
              label="Username"
              value={`@${form.username}`}
              onChangeText={(text) => handleChange('username', text.startsWith('@') ? text.substring(1) : text)}
              mode="flat"
              style={styles.infoInput}
              underlineColor="transparent"
              autoCapitalize="none"
              autoCorrect={false}
              theme={{ colors: { primary: theme.colors.primary, text: theme.colors.text } }}
            />
            <TextInput
              label="Bio"
              value={form.bio}
              onChangeText={(text) => handleChange('bio', text)}
              mode="flat"
              multiline
              numberOfLines={2}
              style={styles.infoInput}
              underlineColor="transparent"
              theme={{ colors: { primary: theme.colors.primary, text: theme.colors.text } }}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Contact Information */}
        <Text style={styles.sectionTitle}>Contact & Location</Text>
        <TextInput label="Location" value={form.location} onChangeText={(text) => handleChange('location', text)} style={styles.input} left={<TextInput.Icon icon="map-marker-outline" />} />
        <TextInput label="Website" value={form.website} onChangeText={(text) => handleChange('website', text)} style={styles.input} autoCapitalize="none" left={<TextInput.Icon icon="web" />} />

        <Divider style={styles.divider} />

        {/* Macros Progress Section */}
        <Text style={styles.sectionTitle}>Today's Macros Progress</Text>
        <View style={styles.macrosProgressContainer}>
          {renderMacroProgress('Calories', +form.daily_calories || 0, +form.calories_goal || 0, theme.colors.error)}
          {renderMacroProgress('Protein', +form.daily_protein || 0, +form.protein_goal || 0, theme.colors.tertiary)}
          {renderMacroProgress('Carbs', +form.daily_carbs || 0, +form.carbs_goal || 0, theme.colors.info)}
          {renderMacroProgress('Fat', +form.daily_fat || 0, +form.fat_goal || 0, theme.colors.warning)}
        </View>

        <Divider style={styles.divider} />

        {/* Macro Goals Section */}
        <View style={styles.goalsHeader}>
          <Text style={styles.sectionTitle}>Macro Goals</Text>
          <TouchableOpacity onPress={() => setIsEditingGoals(!isEditingGoals)} style={styles.editButton}>
            <Ionicons name={isEditingGoals ? "checkmark-circle-outline" : "pencil-outline"} size={24} color={theme.colors.primary} />
            <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>{isEditingGoals ? "Done" : "Edit Goals"}</Text>
          </TouchableOpacity>
        </View>

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
            <TextInput label="Calories Goal (kcal)" value={form.calories_goal} onChangeText={(text) => handleChange('calories_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
            <TextInput label="Protein Goal (g)" value={form.protein_goal} onChangeText={(text) => handleChange('protein_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
            <TextInput label="Carbs Goal (g)" value={form.carbs_goal} onChangeText={(text) => handleChange('carbs_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
            <TextInput label="Fat Goal (g)" value={form.fat_goal} onChangeText={(text) => handleChange('fat_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
            <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.saveGoalsButton}>
              {loading ? "Saving..." : "Save Goals"}
            </Button>
          </View>
        )}

        {/* Macro Graph (Uncomment when in use) */}
        {/*
        <Divider style={styles.divider} />
        <Text style={styles.sectionTitle}>7-Day Macro Trend</Text>
        <Card style={styles.graphCard}>
          <Card.Content>
            {macroHistory.length > 0 ? (
              <MacroGraph data={macroHistory} />
            ) : (
              <Text style={styles.noGraphData}>No macro history available yet.</Text>
            )}
          </Card.Content>
        </Card>
        */}

        {/* General Save Profile Button */}
        {!isEditingGoals && (
          <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.saveProfileButton}>
            {loading ? "Saving Profile..." : "Save All Changes"}
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  avatarWrapper: {
    marginRight: 20,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  changeAvatarText: {
    marginTop: 8,
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  profileInfo: {
    flex: 1,
  },
  infoInput: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    height: 40,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    marginTop: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  macrosProgressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  macroCard: {
    alignItems: 'center',
    width: '46%',
    marginBottom: 20,
    backgroundColor: '#fff',
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
    color: '#333',
  },
  macroLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  macroValue: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  divider: {
    marginVertical: 20,
    backgroundColor: '#e0e0e0',
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e9f4ff',
  },
  editButtonText: {
    marginLeft: 5,
    fontWeight: 'bold',
  },
  goalsDisplay: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  goalLabel: {
    fontSize: 16,
    color: '#555',
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  saveGoalsButton: {
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 10,
    paddingVertical: 5,
  },
  saveProfileButton: {
    marginTop: 30,
    borderRadius: 10,
    paddingVertical: 8,
  },
  graphCard: {
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noGraphData: {
    textAlign: 'center',
    paddingVertical: 30,
    color: '#888',
    fontSize: 15,
  }
});

export default Profile;