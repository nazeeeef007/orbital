// components/CustomDropdown.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Animated, // Import Animated for smoother transitions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Define a light and dark color palette for better contrast and modern feel
const Colors = {
  primary: '#4f46e5', // A vibrant blue-purple for key elements
  secondary: '#8b5cf6', // A lighter purple for accents
  textPrimary: '#333333', // Dark text for readability
  textSecondary: '#666666', // Muted text for descriptions/placeholders
  border: '#E0E0E0', // Light grey for borders
  background: '#FFFFFF', // White background for cards/modal
  overlay: 'rgba(0,0,0,0.4)', // Slightly darker overlay for better focus
  selectedBg: '#eef2ff', // Very light blue for selected item background (matches primary color family)
  selectedText: '#4f46e5', // Primary color for selected text
  success: '#16a34a', // Green for success indicators
  placeholder: '#A0A0A0', // Clear placeholder color
};

interface DropdownItem {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  label?: string; // Made label optional
  placeholder: string;
  options: DropdownItem[];
  selectedValue: string | number | null; // Allow null for no selection
  onValueChange: (value: string | number) => void;
  style?: object;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean; // Added disabled prop
}

const screenHeight = Dimensions.get('window').height;

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  placeholder,
  options,
  selectedValue,
  onValueChange,
  style,
  icon = 'chevron-down',
  disabled = false, // Default to not disabled
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const [dropdownLeft, setDropdownLeft] = useState(0);
  const triggerRef = useRef<TouchableOpacity>(null);
  const opacityAnim = useRef(new Animated.Value(0)).current; // For modal opacity animation
  const scaleAnim = useRef(new Animated.Value(0.95)).current; // For modal scale animation

  // Function to calculate and set dropdown position
  const calculateDropdownPosition = useCallback(() => {
    triggerRef.current?.measure((_fx, _fy, _w, h, px, py) => {
      // Check if dropdown would go off-screen at the bottom
      const potentialDropdownBottom = py + h + (Platform.OS === 'ios' ? 8 : 10) + screenHeight * 0.4; // Max height
      const spaceBelow = screenHeight - (py + h);
      const spaceAbove = py;

      let topPosition = py + h + (Platform.OS === 'ios' ? 8 : 10); // Default below trigger

      // If not enough space below, try to open upwards
      if (potentialDropdownBottom > screenHeight && spaceAbove > screenHeight * 0.4) {
        topPosition = py - (screenHeight * 0.4 + (Platform.OS === 'ios' ? 8 : 10)); // Open above trigger
      } else if (potentialDropdownBottom > screenHeight && spaceAbove <= screenHeight * 0.4) {
        // If not enough space anywhere, position from top and limit height
        topPosition = 10; // Small margin from top
      }

      setDropdownTop(topPosition);
      setDropdownWidth(_w);
      setDropdownLeft(px);
    });
  }, []);

  // UseEffect for initial position calculation and whenever dimensions change
  useEffect(() => {
    if (modalVisible) {
      calculateDropdownPosition();
    }
  }, [modalVisible, calculateDropdownPosition, Dimensions.get('window').width, Dimensions.get('window').height]);


  const openDropdown = () => {
    if (disabled) return; // Prevent opening if disabled

    Keyboard.dismiss(); // Dismiss keyboard when dropdown opens
    calculateDropdownPosition(); // Calculate position right before opening

    setModalVisible(true);
    // Start animations
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 200, // Quick fade in
      useNativeDriver: true,
    }).start();
    Animated.spring(scaleAnim, { // Spring animation for a bouncy feel
      toValue: 1,
      friction: 7, // Adjust for bounciness
      tension: 60, // Adjust for speed
      useNativeDriver: true,
    }).start();
  };

  const closeDropdown = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 150, // Quicker fade out
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      scaleAnim.setValue(0.95); // Reset scale for next open
    });
  };

  const onItemPress = (item: DropdownItem) => {
    onValueChange(item.value);
    closeDropdown(); // Close modal with animation
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
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
      )}
    </TouchableOpacity>
  );

  const displayValue = options.find(option => option.value === selectedValue)?.label || placeholder;
  const isPlaceholder = !selectedValue;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        ref={triggerRef}
        style={[styles.dropdownTrigger, disabled && styles.dropdownTriggerDisabled]}
        onPress={openDropdown}
        activeOpacity={disabled ? 1 : 0.8} // No active opacity change if disabled
        disabled={disabled} // Disable the TouchableOpacity
      >
        <Text style={[styles.dropdownTriggerText, isPlaceholder && styles.placeholderText]}>
          {displayValue}
        </Text>
        <Ionicons
          name={icon}
          size={20}
          color={disabled ? Colors.placeholder : Colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none" // Use custom Animated.View for animation
        onRequestClose={closeDropdown}
      >
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.dropdownModal,
                {
                  top: dropdownTop,
                  width: dropdownWidth,
                  maxHeight: screenHeight * 0.4,
                  left: dropdownLeft,
                  opacity: opacityAnim, // Bind opacity to animation value
                  transform: [{ scale: scaleAnim }], // Bind scale to animation value
                },
              ]}
            >
              <FlatList
                data={options}
                renderItem={renderItem}
                keyExtractor={(item) => String(item.value)}
                showsVerticalScrollIndicator={true}
                ListEmptyComponent={<Text style={styles.dropdownEmptyText}>No options available</Text>}
                contentContainerStyle={styles.dropdownListContent}
                keyboardShouldPersistTaps="handled"
              />
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  dropdownTriggerDisabled: {
    backgroundColor: '#F5F5F5', // Lighter background when disabled
    borderColor: '#E0E0E0',
  },
  dropdownTriggerText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: Colors.placeholder,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  dropdownModal: {
    position: 'absolute',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 15,
    overflow: 'hidden', // Ensures content respects border radius
    maxHeight: screenHeight * 0.4,
  },
  dropdownListContent: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    minHeight: 50, // Ensure consistent height for touch targets
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  dropdownSelectedItem: {
    backgroundColor: Colors.selectedBg, // Use the new selected background color
  },
  dropdownSelectedItemText: {
    fontWeight: '600',
    color: Colors.selectedText, // Use the new selected text color
  },
  dropdownEmptyText: {
    padding: 20,
    textAlign: 'center',
    color: Colors.placeholder,
    fontSize: 15,
  },
});