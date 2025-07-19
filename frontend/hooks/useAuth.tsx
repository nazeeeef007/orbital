// --- 1. Update hooks/useAuth.tsx ---
// This file will be modified to fetch and store ingredients globally.

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Alert, Platform } from 'react-native'; // Added Platform for potential future use
import { BASE_URL } from '@/config';
import { useRouter } from 'expo-router';
import type { Ingredient } from '@/types/Ingredients';
// --- Interfaces ---
interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  website: string | null;
  avatar_url: string | null;
  calories_goal: number | null;
  protein_goal: number | null;
  carbs_goal: number | null;
  fat_goal: number | null;
  daily_calories: number | null;
  daily_protein: number | null;
  daily_carbs: number | null;
  daily_fat: number | null;
}



interface AuthContextType {
  authToken: string | null;
  user: UserProfile | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  ingredients: Ingredient[] | null; // New: Store all ingredients
  fetchIngredients: () => Promise<void>; // New: Function to fetch ingredients
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ingredients, setIngredients] = useState<Ingredient[] | null>(null); // New state for ingredients
  const router = useRouter();

  // Memoized function to fetch user profile
  const fetchUserProfile = useCallback(async () => {
    if (!authToken) {
      console.warn('fetchUserProfile called without an authToken.');
      setUser(null);
      return;
    }
    try {
      const authRes = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const userId =
        typeof authRes.data.user?.id === 'string'
          ? authRes.data.user.id
          : typeof authRes.data.id === 'string'
          ? authRes.data.id
          : null;

      if (!userId) {
        console.error('User ID not found in auth response:', authRes.data);
        throw new Error('Invalid authentication response: User ID missing.');
      }

      const profileRes = await axios.get<UserProfile>(
        `${BASE_URL}/api/profile/${userId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setUser(profileRes.data);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err.message || err);
      setUser(null);
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        await SecureStore.deleteItemAsync('authToken');
        setAuthToken(null);
      }
      throw err;
    }
  }, [authToken]);

  // New: Memoized function to fetch all ingredients
  const fetchIngredients = useCallback(async () => {
    if (!authToken) {
      console.warn('fetchIngredients called without an authToken.');
      setIngredients(null);
      return;
    }
    try {
      // Using the /api/ingredients endpoint to get all ingredients
      const response = await axios.get<Ingredient[]>(`${BASE_URL}/api/ingredients`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setIngredients(response.data);
    } catch (err: any) {
      console.error('Failed to fetch ingredients:', err.message || err);
      setIngredients(null);
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        await SecureStore.deleteItemAsync('authToken');
        setAuthToken(null);
        setUser(null);
      }
      throw err;
    }
  }, [authToken]); // Re-create if authToken changes

  // Login function
  const login = useCallback(
    async (token: string) => {
      setLoading(true);
      try {
        await SecureStore.setItemAsync('authToken', token);
        setAuthToken(token);
        // Fetch user profile and ingredients after setting the token
        await Promise.all([
          fetchUserProfile(),
          fetchIngredients()
        ]);
      } catch (e) {
        console.error('Login process failed:', e);
        Alert.alert('Login Error', 'Failed to log in. Please check your credentials or try again.');
        await SecureStore.deleteItemAsync('authToken');
        setAuthToken(null);
        setUser(null);
        setIngredients(null); // Clear ingredients on login failure
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile, fetchIngredients]
  );

  // Logout function
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (e) {
      console.error('SecureStore logout failed:', e);
      Alert.alert('Logout Error', 'Could not clear authentication token securely.');
    } finally {
      setAuthToken(null);
      setUser(null);
      setIngredients(null); // Clear ingredients on logout
      setLoading(false);
      router.replace('/login');
    }
  }, []);

  // Bootstrap: run once on mount to check for existing token and fetch data
  useEffect(() => {
    const loadAuthAndAppData = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          setAuthToken(token);
          // Fetch user profile and ingredients concurrently
          await Promise.all([
            fetchUserProfile(),
            fetchIngredients()
          ]);
        }
      } catch (e) {
        console.error('Authentication or data bootstrap error:', e);
        setAuthToken(null);
        setUser(null);
        setIngredients(null);
      } finally {
        setLoading(false);
      }
    };
    loadAuthAndAppData();
  }, [fetchUserProfile, fetchIngredients]); // Dependencies

  // Memoize the context value
  const contextValue = useMemo(
    () => ({
      authToken,
      user,
      loading,
      login,
      logout,
      refreshUserProfile: fetchUserProfile,
      ingredients, // Expose ingredients
      fetchIngredients, // Expose fetchIngredients
    }),
    [authToken, user, loading, login, logout, fetchUserProfile, ingredients, fetchIngredients]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};