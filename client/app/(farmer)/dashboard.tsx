import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';

import { API_URL } from '@/constants/config';



interface Product {
    _id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    quantity: number;
    image?: string;
}

export default function FarmerDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products/my`);
            setProducts(res.data as Product[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

    const handleDelete = async (id: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await axios.delete(`${API_URL}/products/${id}`);
                            fetchProducts();
                        } catch (error) {
                            Alert.alert("Error", "Could not delete product");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.image || 'https://placehold.co/100x100?text=No+Image' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>{item.category} • {item.quantity} {item.unit} left</Text>
                <Text style={styles.price}>₹{item.price}/{item.unit}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
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
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No products listed yet.</Text>}
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
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
    },
    image: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 10,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    details: {
        color: '#666',
        fontSize: 12,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 4,
    },
    deleteBtn: {
        padding: 8,
    },
    deleteText: {
        color: 'red',
        fontSize: 12,
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});
