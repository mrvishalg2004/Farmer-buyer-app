import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '@/constants/theme';

export default function BuyerLayout() {
    const { logout } = useAuth();

    return (
        <Tabs screenOptions={{
            headerShown: false, // Hiding default header for premium custom headers
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
                name="home"
                options={{
                    title: 'Market',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "storefront" : "storefront-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="cart"
                options={{
                    title: 'Basket',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "basket" : "basket-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Orders',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons
                            name={focused ? "clipboard-text" : "clipboard-text-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
