import React, { useEffect, useState } from 'react';
import { View, Alert, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Avatar, Button, TextInput, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import * as Progress from 'react-native-progress';
import { BASE_URL } from '@/config';
// import MacroGraph from "../components/MacroGraph";

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

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [macroHistory, setMacroHistory] = useState([]);


  useEffect(() => {
    const initialize = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('authToken');
        if (!storedToken) {
          Alert.alert('Error', 'No auth token found');
          return;
        }
        setToken(storedToken);
        console.log('Sending to backend');

        const res = await axios.get(`http://${BASE_URL}:3000/api/profile/me`, {
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
          daily_protein: data.daily_protein?.toString() || '',
          daily_carbs: data.daily_carbs?.toString() || '',
          daily_fat: data.daily_fat?.toString() || '',
          calories_goal: data.calories_goal?.toString() || '',
          protein_goal: data.protein_goal?.toString() || '',
          carbs_goal: data.carbs_goal?.toString() || '',
          fat_goal: data.fat_goal?.toString() || '',
        });

        setAvatar(data.avatar_url || null);
        // console.log(data.avatar_url);
        const historyRes = await axios.get(`http://${BASE_URL}:3000/api/macro/history`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });

        setMacroHistory(historyRes.data.data || []);
      } catch (err) {
        Alert.alert('Error', 'Failed to load profile');
      }
    };

    initialize();
  }, []);

  const pickImage = async () => {
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

      await axios.put(`http://${BASE_URL}:3000/api/profile/profile`, formData, {
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

  const renderMacroCircle = (label, consumed, goal, color) => {
    const progress = goal > 0 ? Math.min(consumed / goal, 1) : 0;
    return (
      <View style={styles.circleContainer}>
        <Progress.Circle
          size={80}
          progress={progress}
          showsText
          formatText={() => `${consumed}/${goal}`}
          color={color}
          unfilledColor="#eee"
          borderWidth={0}
        />
        <Text style={styles.circleLabel}>{label}</Text>
      </View>
    );
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

      <TextInput label="Username" value={form.username} onChangeText={(text) => handleChange('username', text)} style={styles.input} autoCapitalize="none" autoCorrect={false} />
      <TextInput label="Display Name" value={form.display_name} onChangeText={(text) => handleChange('display_name', text)} style={styles.input} />
      <TextInput label="Bio" value={form.bio} onChangeText={(text) => handleChange('bio', text)} multiline numberOfLines={3} style={styles.input} />
      <TextInput label="Location" value={form.location} onChangeText={(text) => handleChange('location', text)} style={styles.input} />
      <TextInput label="Website" value={form.website} onChangeText={(text) => handleChange('website', text)} style={styles.input} autoCapitalize="none" />

      <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>Macros Progress</Text>
      <View style={styles.macrosRow}>
        <View style={styles.macroWrapper}>
          {renderMacroCircle('Calories (kcal)', +form.daily_calories || 0, +form.calories_goal || 0, '#FF6B6B')}
        </View>
        <View style={styles.macroWrapper}>
          {renderMacroCircle('Protein (g)', +form.daily_protein || 0, +form.protein_goal || 0, '#6C5CE7')}
        </View>
        <View style={styles.macroWrapper}>
          {renderMacroCircle('Carbs (g)', +form.daily_carbs || 0, +form.carbs_goal || 0, '#4ECDC4')}
        </View>
        <View style={styles.macroWrapper}>
          {renderMacroCircle('Fat (g)', +form.daily_fat || 0, +form.fat_goal || 0, '#FFD93D')}
        </View>
      </View>


      <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>Macro Goals</Text>
      <TextInput label="Daily Calories" value={form.calories_goal} onChangeText={(text) => handleChange('calories_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
      <TextInput label="Protein Goal (g)" value={form.protein_goal} onChangeText={(text) => handleChange('protein_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
      <TextInput label="Carbs Goal (g)" value={form.carbs_goal} onChangeText={(text) => handleChange('carbs_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />
      <TextInput label="Fat Goal (g)" value={form.fat_goal} onChangeText={(text) => handleChange('fat_goal', text.replace(/[^0-9]/g, ''))} keyboardType="numeric" style={styles.input} />

      {/* <View>
      <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>7-Day Macro Trend</Text>
      <MacroGraph data={macroHistory} />
    </View> */}

      <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={{ marginTop: 20 }}>
        Save Profile
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
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
  macrosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  circleContainer: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  circleLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  macroWrapper: {
  width: '48%',      // roughly half with some spacing
  marginBottom: 15,
  alignItems: 'center',
},

});

export default Profile;
