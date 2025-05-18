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
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize="none"
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
  },
});
