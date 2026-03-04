import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface Order {
    _id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    items: OrderItem[];
    paymentId: string;
}

export default function OrdersScreen() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders`);
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

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return {
                    bg: '#E8F5E9',
                    color: '#2E7D32',
                    icon: 'check-decagram',
                    label: 'PAID'
                };
            case 'pending':
                return {
                    bg: '#FFF3E0',
                    color: '#EF6C00',
                    icon: 'clock-outline',
                    label: 'PENDING'
                };
            default:
                return {
                    bg: '#F5F5F5',
                    color: '#616161',
                    icon: 'help-circle-outline',
                    label: status.toUpperCase()
                };
        }
    };

    const renderItem = ({ item, index }: { item: Order; index: number }) => {
        const status = getStatusStyles(item.status);
        const date = new Date(item.createdAt);

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 100).duration(500)}
                layout={Layout.springify()}
                style={[styles.card, Shadows.light]}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.dateContainer}>
                        <MaterialCommunityIcons name="calendar-range" size={16} color={Colors.light.secondaryText} />
                        <Text style={styles.dateText}>{date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                        <MaterialCommunityIcons name={status.icon as any} size={14} color={status.color} />
                        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.orderLabel}>Order Items</Text>
                    {item.items.map((prod, idx) => (
                        <View key={idx} style={styles.itemRow}>
                            <View style={styles.itemNameContainer}>
                                <Text style={styles.itemQty}>{prod.quantity}x</Text>
                                <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₹{prod.price * prod.quantity}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <View>
                        <Text style={styles.totalLabel}>Grand Total</Text>
                        <Text style={styles.totalVal}>₹{item.totalAmount}</Text>
                    </View>
                    <View style={styles.paymentInfo}>
                        <Text style={styles.refLabel}>Payment Ref</Text>
                        <Text style={styles.refVal} numberOfLines={1}>{item.paymentId.substring(0, 15)}...</Text>
                    </View>
                </View>

                <LinearGradient
                    colors={[Colors.light.border, 'transparent']}
                    style={styles.accentBar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Loading your farm history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.text, Colors.light.tint]}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>My Orders</Text>
                        <Text style={styles.headerSubtitle}>History of your fresh produce</Text>
                    </View>
                    <TouchableOpacity
                        style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 12 }}
                        onPress={logout}
                    >
                        <MaterialCommunityIcons name="logout" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="clipboard-text-off-outline" size={80} color={Colors.light.border} />
                        <Text style={styles.emptyTitle}>No orders yet</Text>
                        <Text style={styles.emptySub}>Your purchase history will appear here.</Text>
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
        paddingBottom: 30,
        paddingHorizontal: 25,
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#E8F5E9',
        fontWeight: '500',
        marginTop: 2,
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
        paddingBottom: 40,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    accentBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '600',
        color: Colors.light.secondaryText,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '900',
        marginLeft: 4,
    },
    content: {
        marginBottom: 15,
    },
    orderLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.light.border,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.light.tint,
        marginRight: 8,
    },
    itemName: {
        fontSize: 15,
        color: Colors.light.text,
        fontWeight: '600',
    },
    itemPrice: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.light.text,
    },
    divider: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 15,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    totalLabel: {
        fontSize: 12,
        color: Colors.light.secondaryText,
        fontWeight: '600',
    },
    totalVal: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.light.tint,
    },
    paymentInfo: {
        alignItems: 'flex-end',
        maxWidth: '50%',
    },
    refLabel: {
        fontSize: 10,
        color: Colors.light.border,
        fontWeight: '700',
    },
    refVal: {
        fontSize: 11,
        color: Colors.light.earthy,
        fontWeight: '500',
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
        marginTop: 6,
        textAlign: 'center',
    },
});
