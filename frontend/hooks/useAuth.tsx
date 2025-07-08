// hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Alert } from 'react-native';
import { BASE_URL } from '@/config'; // your backend URL
import { useRouter } from 'expo-router'; // IMPORT THIS!

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
  // Changed the signature to indicate it can be called without an explicit token
  // as it will use the authToken from state.
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter here
  // Use useCallback for fetchUserProfile to memoize it and prevent unnecessary re-creations.
  // It now relies on the `authToken` from the state, making it callable externally
  // without needing to pass the token explicitly.
  const fetchUserProfile = useCallback(async () => {
    // Only attempt to fetch if authToken exists
    if (!authToken) {
      console.warn('fetchUserProfile called without an authToken.');
      setUser(null); // Ensure user is null if no token is present
      return;
    }

    try {
      // First, get basic user info (including ID)
      const authRes = await axios.get(`${BASE_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      // Safely extract userId, prioritize authRes.data.user.id then authRes.data.id
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

      // Then, fetch the full profile using the user ID
      const profileRes = await axios.get<UserProfile>(
        `${BASE_URL}/api/profile/${userId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      setUser(profileRes.data);
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err.message || err);
      setUser(null); // Clear user profile on error
      if (err.response?.status === 401) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        // Token is invalid, clear it and log out
        await SecureStore.deleteItemAsync('authToken');
        setAuthToken(null);
        // Do not throw here, let the component handle the logout flow if needed
      }
      // Re-throw if it's an error we want calling components to potentially catch
      throw err;
    }
  }, [authToken]); // Dependency: re-create if authToken changes

  // Login
  const login = useCallback(
    async (token: string) => {
      setLoading(true); // Set loading true at the start of login
      try {
        await SecureStore.setItemAsync('authToken', token);
        setAuthToken(token);
        // Call fetchUserProfile without passing token directly, it will use the state's authToken
        await fetchUserProfile();
      } catch (e) {
        console.error('Login process failed:', e);
        Alert.alert('Login Error', 'Failed to log in. Please check your credentials or try again.');
        await SecureStore.deleteItemAsync('authToken'); // Clear token on login failure
        setAuthToken(null);
        setUser(null);
        throw e; // Re-throw to allow login screen to handle
      } finally {
        setLoading(false); // Always set loading to false after login attempt
      }
    },
    [fetchUserProfile] // Dependency: fetchUserProfile
  );

  // Logout
  const logout = useCallback(async () => {
    setLoading(true); // Indicate loading during logout
    try {
      await SecureStore.deleteItemAsync('authToken');
    } catch (e) {
      console.error('SecureStore logout failed:', e);
      Alert.alert('Logout Error', 'Could not clear authentication token securely.');
    } finally {
      setAuthToken(null);
      setUser(null);
      setLoading(false); // Set loading to false after logout attempt
      router.replace('/login');
    }
  }, []);

  // Bootstrap: run once on mount to check for existing token and fetch profile
  useEffect(() => {
    const loadAuthData = async () => {
      setLoading(true); // Start loading immediately
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (token) {
          setAuthToken(token);
          // Directly call the memoized fetchUserProfile
          await fetchUserProfile();
        }
      } catch (e) {
        console.error('Authentication bootstrap error:', e);
        // Clear any potentially corrupted state
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false); // Always set loading to false after bootstrap
      }
    };
    loadAuthData();
  }, [fetchUserProfile]); // Dependency: fetchUserProfile (ensures it's the latest memoized version)

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(
    () => ({
      authToken,
      user,
      loading,
      login,
      logout,
      refreshUserProfile: fetchUserProfile, // Expose the memoized fetchUserProfile as refreshUserProfile
    }),
    [authToken, user, loading, login, logout, fetchUserProfile] // Add fetchUserProfile to dependencies
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