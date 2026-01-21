import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';

// Make sure API_URL matches other files
const API_URL = 'http://192.168.1.4:5001';

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

    const fetchOrders = async () => {
        try {
            const res = await axios.get(`${API_URL}/orders`);
            setOrders(res.data);
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

    const renderItem = ({ item }: { item: Order }) => (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString()}</Text>
                <Text style={[styles.status, { color: item.status === 'paid' ? '#2E7D32' : '#f57c00' }]}>
                    {item.status.toUpperCase()}
                </Text>
            </View>
            <View style={styles.divider} />
            {item.items.map((prod, index) => (
                <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{prod.quantity}x {prod.name}</Text>
                    <Text style={styles.itemPrice}>₹{prod.price * prod.quantity}</Text>
                </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.footer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹{item.totalAmount}</Text>
            </View>
            <Text style={styles.paymentId}>Ref: {item.paymentId}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2E7D32" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    date: {
        color: '#666',
        fontSize: 12,
    },
    status: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 10,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    itemName: {
        fontSize: 14,
        color: '#333',
    },
    itemPrice: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    totalLabel: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    totalValue: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2E7D32',
    },
    paymentId: {
        fontSize: 10,
        color: '#999',
        marginTop: 10,
        textAlign: 'right',
    }
    ,
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});
