import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { TouchableOpacity } from 'react-native';

export default function FarmerLayout() {
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
                name="dashboard"
                options={{
                    title: 'My Products',
                    tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="add-product"
                options={{
                    title: 'Add Product',
                    tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bids"
                options={{
                    title: 'Auctions',
                    tabBarIcon: ({ color }) => <Ionicons name="pricetag" size={24} color={color} />,
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
