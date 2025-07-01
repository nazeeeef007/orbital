import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

interface AuthTextInputProps extends TextInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
}

const AuthTextInput: React.FC<AuthTextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  ...props
}) => {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor="#888" // Explicitly set a visible placeholder color
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
      // Added for debugging if issues persist
      // If you're still debugging, uncomment these temporarily:
      // multiline={false}
      // numberOfLines={1}
      // enableCopyPasteText={true} // For Android
      // textContentType="none" // For iOS autofill
      {...props}
    />
  );
};

export default AuthTextInput;

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    width: '100%',
    color: '#333', // Explicitly set text color to a dark visible color
    fontSize: 16,  // Explicitly set a font size
    backgroundColor: '#fff', // Ensure background is not transparent or same as text
    paddingHorizontal: 15, // Add a bit more horizontal padding
    height: 50, // Give it a fixed height to ensure consistent display
  },
});