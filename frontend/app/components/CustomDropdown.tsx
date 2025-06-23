// components/CustomDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DropdownItem {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  label: string;
  placeholder: string;
  options: DropdownItem[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  // Optional: Add a style prop for external customization if needed
  style?: object;
  // Optional: Allow icon customization
  icon?: keyof typeof Ionicons.glyphMap;
}

const screenHeight = Dimensions.get('window').height;

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  placeholder,
  options,
  selectedValue,
  onValueChange,
  style, // Destructure style prop
  icon = 'chevron-down', // Default icon
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const triggerRef = useRef<TouchableOpacity>(null);

  // Recalculate position when modal visibility or screen dimensions change
  useEffect(() => {
    if (modalVisible) {
      triggerRef.current?.measure((_fx, _fy, _w, h, px, py) => {
        setDropdownTop(py + h + (Platform.OS === 'ios' ? 4 : 6)); // Adjusted slight offset
        setDropdownWidth(_w);
        setDropdownLeft(px);
      });
    }
  }, [modalVisible, Dimensions.get('window').width, Dimensions.get('window').height]); // Added dimensions as dependency

  const openDropdown = () => {
    Keyboard.dismiss(); // Dismiss keyboard when dropdown opens

    triggerRef.current?.measure((_fx, _fy, _w, h, px, py) => {
      setDropdownTop(py + h + (Platform.OS === 'ios' ? 4 : 6)); // Adjusted slight offset
      setDropdownWidth(_w);
      setDropdownLeft(px);
    });
    setModalVisible(true);
  };

  const onItemPress = (item: DropdownItem) => {
    onValueChange(item.value);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: DropdownItem }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedValue === item.value && styles.dropdownSelectedItem,
      ]}
      onPress={() => onItemPress(item)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.dropdownItemText,
          selectedValue === item.value && styles.dropdownSelectedItemText,
        ]}
      >
        {item.label}
      </Text>
      {selectedValue === item.value && (
        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
      )}
    </TouchableOpacity>
  );

  const displayValue = options.find(option => option.value === selectedValue)?.label || placeholder;
  const isPlaceholder = !selectedValue; // Check if selectedValue is empty/falsy

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        ref={triggerRef}
        style={styles.dropdownTrigger}
        onPress={openDropdown}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownTriggerText, isPlaceholder && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Ionicons name={icon} size={20} color="#757575" /> {/* Neutral icon color */}
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade" // Smooth fade animation
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay}>
            <View
              style={[
                styles.dropdownModal,
                {
                  top: dropdownTop,
                  width: dropdownWidth,
                  maxHeight: screenHeight * 0.4, // Limit height to 40% of screen
                  left: dropdownLeft,
                },
              ]}
            >
              <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.value)} // Ensure key is string
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={<Text style={styles.dropdownEmptyText}>No options available</Text>}
                contentContainerStyle={styles.dropdownListContent}
                keyboardShouldPersistTaps="handled" // Keep taps handled
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // Increased margin for better spacing
  },
  label: {
    fontSize: 16,
    fontWeight: '600', // Slightly bolder label
    color: '#424242', // Darker text for labels
    marginBottom: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#E0E0E0', // Lighter, subtle border
    paddingVertical: 14, // Increased vertical padding
    paddingHorizontal: 16,
    borderRadius: 12, // More rounded corners
    backgroundColor: '#FFFFFF', // White background
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56, // Ensure a minimum height for consistent touch target
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // More pronounced shadow
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5, // Android shadow
  },
  dropdownTriggerText: {
    fontSize: 16,
    color: '#424242', // Darker active text
    flex: 1,
  },
  placeholderText: {
    color: '#9E9E9E', // Grey for placeholder
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Slightly lighter overlay
    justifyContent: 'flex-start', // Align content to the top
    alignItems: 'flex-start', // Align content to the left
  },
  dropdownModal: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 }, // Deeper shadow for modal
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden', // Ensures content respects border radius
    maxHeight: screenHeight * 0.4, // Limits dropdown height
  },
  dropdownListContent: {
    paddingVertical: 4, // Slightly less padding to fit more items
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Ensures white background for items
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#424242',
    flex: 1,
  },
  dropdownSelectedItem: {
    backgroundColor: '#E8F5E9', // Light green for selected item background
  },
  dropdownSelectedItemText: {
    fontWeight: '600', // Bolder for selected text
    color: '#2E7D32', // Dark green for selected text
  },
  dropdownEmptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#9E9E9E',
    fontSize: 15,
  },
});