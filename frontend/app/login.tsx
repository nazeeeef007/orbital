// app/auth/login.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthTextInput from '../components/AuthTextInput';
import * as SecureStore from 'expo-secure-store'; // ⬅️ add this at the top
import { BASE_URL } from "@/config";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleLogin = async () => {
    setMessage(null);
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`http://${BASE_URL}:3000/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      setLoading(false);

      if (!response.ok) {
        // More detailed error handling based on API response
        if (data.error === 'Invalid email') {
          setMessage({ type: 'error', text: 'Email address not found.' });
        } else if (data.error === 'Invalid password') {
          setMessage({ type: 'error', text: 'Incorrect password. Please try again.' });
        } else {
          setMessage({ type: 'error', text: data.error || 'Login failed. Please check your credentials.' });
        }
      } else {
        const { session, user } = data.data;


        if (!session || !session.access_token) {
          setMessage({ type: 'error', text: 'Login failed: token missing.' });
          return;
        }
        await SecureStore.setItemAsync('authToken', session.access_token); // ✅ Correct method
        console.log(session.access_token);
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          router.replace('/home');
        }, 1000)
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Network error. Please try again later.' });
      console.error(err);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Text style={styles.title}>Login</Text>

      <AuthTextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <AuthTextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      {message && (
        <Text style={[styles.message, message.type === 'error' ? styles.error : styles.success]}>
          {message.text}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/signup')} disabled={loading}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#111827',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonDisabled: {
    backgroundColor: '#a5a0f8',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
  },
  link: {
    marginTop: 18,
    color: '#4f46e5',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  error: {
    color: '#dc2626',
  },
  success: {
    color: '#16a34a',
  },
});
