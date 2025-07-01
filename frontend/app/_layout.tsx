// app/_layout.tsx
import { Stack, Redirect, usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native'; // Added Text for loading message
import { AuthProvider } from '../hooks/useAuth';
export default function RootLayout() {
  const pathname = usePathname();
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Effect to check for an authentication token when the app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('authToken');
        setAuthToken(token);
      } catch (error) {
        // Log the error if retrieving the token fails
        console.error('SecureStore: Failed to retrieve auth token', error);
        // Set token to null to ensure redirection if an error occurs
        setAuthToken(null);
      } finally {
        // Always set loading to false after the check is complete
        setIsAuthLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Display a loading indicator while the authentication status is being checked
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" /> {/* Standard blue color for loader */}
        <Text style={styles.loadingText}>Loading app...</Text>
      </View>
    );
  }

  // Determine if the current route is considered "public" (accessible without an auth token)
  const isPublicRoute = pathname === '/login' || pathname === '/signup';

  // If there is no authentication token and the user is trying to access a private route,
  // redirect them to the login screen.
  if (!authToken && !isPublicRoute) {
    return <Redirect href="/login" />;
  }

  // Render the main stack navigator for your application
  return (
    <AuthProvider>
    <Stack>
      {/* The 'login' and 'signup' screens are designed to be standalone,
          so their headers are hidden. */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />

      {/* The '(tabs)' group will contain your main authenticated user experience.
          The tab bar navigation (Home, Upload, Search, Profile) and specific screen headers
          within these tabs will be defined in 'app/(tabs)/_layout.tsx'.
          We hide the header for this stack screen as it's managed by the tab layout. */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* You can add other individual authenticated screens here if they are not part of the main tabs.
          For example, a detailed view or a settings page that doesn't fit in the primary tab bar.
          <Stack.Screen name="detailScreen" options={{ headerTitle: 'Meal Details' }} />
          <Stack.Screen name="settings" options={{ headerTitle: 'Settings' }} /> */}
    </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // A light, neutral background color
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555', // A soft, readable grey for the text
  },
});
