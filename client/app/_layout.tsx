import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { API_URL } from '@/constants/config';

// Create a wrapper component to use the Auth Context
function AppContent() {
  const { user, token } = useAuth(); // Assuming AuthContext exposes token/user

  useEffect(() => {
    (async () => {
      console.log('AppContent mounted, checking user:', user ? user.email : 'No user');
      if (!user || !token) return;

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        console.log('Fetching location...');
        let location = null;
        try {
          // Try to get current position with a timeout
          location = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Location timeout')), 5000))
          ]) as Location.LocationObject;
        } catch (e) {
          console.log('Current position unavailable, trying last known position...');
          location = await Location.getLastKnownPositionAsync({});
        }

        if (location) {
          console.log('Location fetched:', location.coords.latitude);
          // Send to backend
          await axios.put(
            `${API_URL}/auth/location`,
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          console.log('Location synced');
        } else {
          console.log('Could not determine location, skipping sync');
        }
      } catch (error) {
        console.warn('Location sync skipped:', error instanceof Error ? error.message : 'Unknown error');
      }
    })();
  }, [user, token]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
