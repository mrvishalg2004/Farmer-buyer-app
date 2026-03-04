import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Order {
    _id: string;
    user: { name: string, email: string };
    items: {
        name: string;
        quantity: number;
        price: number;
    }[];
    totalAmount: number;
    status: string;
    createdAt: string;
}

export default function FarmerOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders/received`);
            setOrders(res.data as Order[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const getStatusColor = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return '#F57F17';
            case 'PAID': return Colors.light.tint;
            case 'COMPLETED': return '#2E7D32';
            case 'CANCELLED': return '#D32F2F';
            default: return Colors.light.earthy;
        }
    };

    const renderOrder = ({ item, index }: { item: Order, index: number }) => (
        <Animated.View
            entering={FadeInUp.delay(index * 100).duration(500)}
            style={[styles.card, Shadows.light]}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>ORDER #{item._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.buyerSection}>
                <View style={styles.buyerIcon}>
                    <MaterialCommunityIcons name="account-outline" size={20} color={Colors.light.tint} />
                </View>
                <View>
                    <Text style={styles.buyerLabel}>Buyer Details</Text>
                    <Text style={styles.buyerName}>{item.user?.name || 'Unknown Buyer'}</Text>
                    <Text style={styles.buyerEmail}>{item.user?.email || 'No email'}</Text>
                </View>
            </View>

            <View style={styles.itemsSection}>
                <Text style={styles.itemsLabel}>Products Sold</Text>
                {item.items.map((prod, idx) => (
                    <View key={idx} style={styles.itemRow}>
                        <View style={styles.itemDot} />
                        <Text style={styles.itemName}>{prod.name}</Text>
                        <Text style={styles.itemQty}>{prod.quantity} x ₹{prod.price}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.totalLabel}>Total Revenue</Text>
                <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
            </View>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Fetching your sales reports...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.text, Colors.light.tint]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.dashboardTitle}>Sales History</Text>
                        <Text style={styles.dashboardSubtitle}>Track your farm earnings</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>₹{orders.reduce((acc, curr) => acc + curr.totalAmount, 0)}</Text>
                        <Text style={styles.statLabel}>Total Sales</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{orders.length}</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="receipt-text-minus" size={80} color={Colors.light.border} />
                        <Text style={styles.emptyTitle}>No Orders Yet</Text>
                        <Text style={styles.emptySub}>When buyers purchase your products, they will appear here.</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 25,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    dashboardTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
    },
    dashboardSubtitle: {
        fontSize: 14,
        color: '#E8F5E9',
        fontWeight: '500',
    },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 14,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 20,
        padding: 15,
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statVal: {
        fontSize: 20,
        fontWeight: '900',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: '#E8F5E9',
        fontWeight: '600',
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: Colors.light.tint,
        fontWeight: '600',
    },
    list: {
        padding: 20,
        paddingBottom: 100, // Account for tab bar
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    orderId: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.light.text,
        letterSpacing: 0.5,
    },
    orderDate: {
        fontSize: 12,
        color: Colors.light.secondaryText,
        marginTop: 2,
        fontWeight: '500',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    buyerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        padding: 12,
        borderRadius: 16,
        marginBottom: 20,
    },
    buyerIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        ...Shadows.light,
    },
    buyerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.light.border,
        textTransform: 'uppercase',
    },
    buyerName: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
    },
    buyerEmail: {
        fontSize: 11,
        color: Colors.light.secondaryText,
    },
    itemsSection: {
        marginBottom: 15,
    },
    itemsLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: Colors.light.border,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginLeft: 4,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    itemDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.light.tint,
        marginRight: 10,
    },
    itemName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.light.text,
    },
    itemQty: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.light.tint,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.secondaryText,
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.light.tint,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.light.text,
        marginTop: 20,
    },
    emptySub: {
        fontSize: 14,
        color: Colors.light.earthy,
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});
