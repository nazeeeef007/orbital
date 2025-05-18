import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const categories = [
  'Fire',
  'Medical Emergency',
  'Suspicious Activity',
  'Accident',
  'Natural Disaster',
  'Other',
];

export default function ReportIncident() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the incident.');
      return false;
    }
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter the location of the incident.');
      return false;
    }
    if (!category) {
      Alert.alert('Validation Error', 'Please select a category.');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the incident.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header here if needed, e.g.:
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          location,
          description,
          category,
          date: date.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit incident report.');
      }

      setLoading(false);
      Alert.alert('Success', 'Incident reported successfully.');
      router.replace('/home');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Error', error.message || 'Failed to report incident. Please try again later.');
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Report an Incident</Text>

      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        placeholder="Brief summary of the incident"
        value={title}
        onChangeText={setTitle}
        maxLength={50}
      />

      <Text style={styles.label}>Location</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter location (e.g., Block 123, Street name)"
        value={location}
        onChangeText={setLocation}
      />
      {/* Optional: Add "Use current location" button here */}

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              category === cat && styles.categoryChipSelected,
            ]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.categoryText,
                category === cat && styles.categoryTextSelected,
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Date & Time</Text>
      <TouchableOpacity
        style={styles.datePickerButton}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
        <Text style={styles.datePickerText}>{date.toLocaleString()}</Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="datetime"
          display="default"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      <Text style={styles.label}>Detailed Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened in detail"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.submitButton, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f9fafb',
    flexGrow: 1,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  textArea: {
    height: 140,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 10,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
  },
  categoryChipSelected: {
    backgroundColor: '#4f46e5',
  },
  categoryText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
    gap: 8,
  },
  datePickerText: {
    color: '#4f46e5',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
