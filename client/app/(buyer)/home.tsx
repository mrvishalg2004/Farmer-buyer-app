import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

export default function BuyerHome() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API_URL}/products`);
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

    const addToCart = async (productId: string) => {
        try {
            await axios.post(`${API_URL}/cart`, { productId, quantity: 1 }); // Default add 1
            Alert.alert("Success", "Added to cart");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Could not add to cart");
        }
    };

    const renderItem = ({ item }: { item: Product }) => (
        <View style={styles.card}>
            <Image
                source={{ uri: item.image || 'https://placehold.co/100x100?text=No+Image' }}
                style={styles.image}
            />
            <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.details}>{item.category} • ₹{item.price}/{item.unit}</Text>
                {item.quantity > 0 ? (
                    <Text style={styles.stock}>In Stock ({item.quantity})</Text>
                ) : (
                    <Text style={styles.outOfStock}>Out of Stock</Text>
                )}
            </View>
            <TouchableOpacity
                style={[styles.addBtn, item.quantity === 0 && styles.disabledBtn]}
                onPress={() => addToCart(item._id)}
                disabled={item.quantity === 0}
            >
                <Ionicons name="add" size={24} color="#fff" />
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
                ListEmptyComponent={<Text style={styles.empty}>No products available.</Text>}
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
        borderRadius: 12,
        padding: 10,
        marginBottom: 15,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 12,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    details: {
        color: '#666',
        fontSize: 14,
        marginBottom: 4,
    },
    stock: {
        color: '#2E7D32',
        fontSize: 12,
        fontWeight: '600'
    },
    outOfStock: {
        color: 'red',
        fontSize: 12,
        fontWeight: '600'
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginTop: 4,
    },
    addBtn: {
        backgroundColor: '#2E7D32',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#ccc'
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
});
