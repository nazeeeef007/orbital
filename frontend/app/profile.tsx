import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  TouchableOpacity,
  Platform
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Avatar,
  useTheme,
  HelperText,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : 'http://192.168.68.110:3000';

import * as SecureStore from 'expo-secure-store'; // ⬅️ Add this import at the top

const Profile = () => {
  const theme = useTheme();

  const [form, setForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    location: '',
    website: '',
    daily_calories: '',
    protein_goal: '',
    carbs_goal: '',
    fat_goal: '',
  });

  const [avatar, setAvatar] = useState(null); // local uri or server url
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);

  // Load current user profile on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken'); // or whatever key you used
        if (!storedToken) {
          Alert.alert('Error', 'No auth token found');
          return;
        }
        setToken(storedToken);

        const res = await axios.get(`${BASE_URL}/api/profile/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        const data = res.data;
        setForm({
          username: data.username || '',
          display_name: data.display_name || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          daily_calories: data.daily_calories?.toString() || '',
          protein_goal: data.protein_goal?.toString() || '',
          carbs_goal: data.carbs_goal?.toString() || '',
          fat_goal: data.fat_goal?.toString() || '',
        });
        setAvatar(data.avatar_url ? `${BASE_URL}${data.avatar_url}` : null);
      } catch (err) {
        Alert.alert('Error', 'Failed to load profile');
      }
    };

    initialize();
  }, []);

  const pickImage = async () => {
    // Ask for permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is needed!');
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

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

   const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Error', 'Missing auth token');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });

      if (avatar && avatar.startsWith('file://')) {
        const filename = avatar.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('avatar', {
          uri: avatar,
          name: filename,
          type,
        });
      }

      const res = await axios.put(`${BASE_URL}/api/profile/profile`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      Alert.alert('Success', 'Profile updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
        {avatar ? (
          <Avatar.Image size={120} source={{ uri: avatar }} />
        ) : (
          <Avatar.Icon size={120} icon="account" />
        )}
        <Text style={styles.avatarText}>Tap to change avatar</Text>
      </TouchableOpacity>

      <TextInput
        label="Username"
        value={form.username}
        onChangeText={(text) => handleChange('username', text)}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        label="Display Name"
        value={form.display_name}
        onChangeText={(text) => handleChange('display_name', text)}
        style={styles.input}
      />
      <TextInput
        label="Bio"
        value={form.bio}
        onChangeText={(text) => handleChange('bio', text)}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      <TextInput
        label="Location"
        value={form.location}
        onChangeText={(text) => handleChange('location', text)}
        style={styles.input}
      />
      <TextInput
        label="Website"
        value={form.website}
        onChangeText={(text) => handleChange('website', text)}
        style={styles.input}
        autoCapitalize="none"
      />

      <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>
        Calorie & Macro Goals
      </Text>

      <TextInput
        label="Daily Calories"
        value={form.daily_calories}
        onChangeText={(text) => handleChange('daily_calories', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Protein Goal (g)"
        value={form.protein_goal}
        onChangeText={(text) => handleChange('protein_goal', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Carbs Goal (g)"
        value={form.carbs_goal}
        onChangeText={(text) => handleChange('carbs_goal', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Fat Goal (g)"
        value={form.fat_goal}
        onChangeText={(text) => handleChange('fat_goal', text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
        style={{ marginTop: 20 }}
      >
        Save Profile
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
  },
  input: {
    marginBottom: 15,
  },
  sectionHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 10,
  },
});

export default Profile;
