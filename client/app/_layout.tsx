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
      if (!user || !token) return;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});

      // Send to backend
      try {
        await axios.put(
          `${API_URL}/auth/location`,
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            // address: ... (optional reverse geocode if needed, but strict requirement didn't mandate it)
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        console.log('Location synced');
      } catch (error) {
        console.error('Failed to sync location', error);
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
