import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '@/constants/theme';

export default function FarmerLayout() {
    const { logout } = useAuth();

    return (
        <Tabs screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.light.tint,
            tabBarInactiveTintColor: Colors.light.icon,
            tabBarStyle: {
                backgroundColor: '#fff',
                borderTopLeftRadius: 25,
                borderTopRightRadius: 25,
                height: 70,
                paddingBottom: 10,
                paddingTop: 10,
                position: 'absolute',
                borderTopWidth: 0,
                elevation: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            tabBarLabelStyle: {
                fontWeight: '700',
                fontSize: 10,
            }
        }}>
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'My Farm',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "sprout" : "sprout-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="add-product"
                options={{
                    title: 'Add New',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "plus-circle" : "plus-circle-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="bids"
                options={{
                    title: 'Auctions',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "gavel" : "gavel"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Sales',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "truck-delivery" : "truck-delivery-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
