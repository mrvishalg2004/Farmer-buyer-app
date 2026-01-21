import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity } from 'react-native';

export default function BuyerLayout() {
    const { logout } = useAuth();

    return (
        <Tabs screenOptions={{
            headerRight: () => (
                <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
                    <Ionicons name="log-out-outline" size={24} color="black" />
                </TouchableOpacity>
            ),
            tabBarActiveTintColor: '#2E7D32',
        }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Marketplace',
                    tabBarIcon: ({ color }) => <Ionicons name="storefront" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'My Cart',
                    tabBarIcon: ({ color }) => <Ionicons name="cart" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color }) => <Ionicons name="receipt" size={24} color={color} />,
                }}
            />
        </Tabs>
    );
}
