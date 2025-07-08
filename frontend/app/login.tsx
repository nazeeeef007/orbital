import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import AuthTextInput from '../components/AuthTextInput';
import { BASE_URL } from '@/config';
import { useAuth } from '../hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    setMessage(null);
    if (!email || !password) {
      setMessage({ type: 'error', text: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setMessage({
          type: 'error',
          text: data.error || 'Login failed. Please check your credentials.',
        });
        return;
      }

      const { session } = data.data;
      if (!session?.access_token) {
        setLoading(false);
        setMessage({ type: 'error', text: 'Login failed: token missing.' });
        return;
      }

      setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
      
      // Call the login function from useAuth
      await login(session.access_token);
      
      // Navigate to home after successful login
      router.replace('/home');

    } catch (err) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Network error. Please try again later.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>NutriScan</Text>
        <Text style={styles.tagline}>Your personalized nutrition tracker</Text>
      </View>

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
    backgroundColor: '#f5f6fa',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4f46e5',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 6,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#4f46e5',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  link: {
    marginTop: 20,
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