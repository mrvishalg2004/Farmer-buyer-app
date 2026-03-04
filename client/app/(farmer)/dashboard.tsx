import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, TextInput, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

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
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [newQuantity, setNewQuantity] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const { logout } = useAuth();

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
            "This action cannot be undone. Are you sure?",
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

    const handleUpdateQuantity = async () => {
        if (!selectedProduct) return;
        const qty = parseInt(newQuantity);
        if (isNaN(qty) || qty < 0) {
            Alert.alert("Error", "Please enter a valid non-negative number");
            return;
        }

        try {
            await axios.patch(`${API_URL}/products/${selectedProduct._id}/quantity`, { quantity: qty });
            Alert.alert("Success", "Stock updated successfully");
            setModalVisible(false);
            fetchProducts();
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not update stock");
        }
    };

    const openUpdateModal = (product: Product) => {
        setSelectedProduct(product);
        setNewQuantity(product.quantity.toString());
        setModalVisible(true);
    };

    const renderItem = ({ item, index }: { item: Product; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(500)}
            layout={Layout.springify()}
            style={[styles.card, Shadows.light]}
        >
            <View style={styles.cardMain}>
                <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&h=200&auto=format&fit=crop' }}
                    style={styles.image}
                />
                <View style={styles.info}>
                    <View>
                        <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                        <Text style={styles.name}>{item.name}</Text>
                    </View>
                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>₹{item.price}</Text>
                        <Text style={styles.unit}> / {item.unit}</Text>
                    </View>
                    <View style={styles.stockStatus}>
                        <MaterialCommunityIcons
                            name={item.quantity > 5 ? "check-circle" : "alert-circle"}
                            size={14}
                            color={item.quantity > 5 ? Colors.light.tint : "#F57F17"}
                        />
                        <Text style={[styles.details, { color: item.quantity > 5 ? Colors.light.text : "#F57F17" }]}>
                            {item.quantity} {item.unit} available
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => openUpdateModal(item)} style={styles.updateBtn}>
                    <LinearGradient
                        colors={[Colors.light.tint, '#2E7D32']}
                        style={styles.actionGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <MaterialCommunityIcons name="plus-box-outline" size={18} color="#fff" />
                        <Text style={styles.updateText}>STOCK</Text>
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#D32F2F" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Loading your inventory...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.text, Colors.light.tint]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.headerTitle}>My Harvest</Text>
                        <Text style={styles.headerSubtitle}>Manage your listings</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{products.length}</Text>
                        <Text style={styles.statLabel}>Products</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>
                            {products.reduce((acc, curr) => acc + curr.quantity, 0)}
                        </Text>
                        <Text style={styles.statLabel}>In Stock</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={products}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="leaf-off" size={64} color={Colors.light.border} />
                        <Text style={styles.empty}>You haven't listed any products yet.</Text>
                    </View>
                }
            />

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <Animated.View entering={FadeInDown} style={[styles.modalContent, Shadows.medium]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Update Inventory</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalSubtitle}>Product: {selectedProduct?.name}</Text>

                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="numeric" size={20} color={Colors.light.tint} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter new quantity"
                                keyboardType="numeric"
                                value={newQuantity}
                                onChangeText={setNewQuantity}
                                autoFocus
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={handleUpdateQuantity}
                        >
                            <LinearGradient
                                colors={[Colors.light.tint, '#2E7D32']}
                                style={styles.btnGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.btnText}>UPDATE STOCK</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    header: {
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
    headerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#E8F5E9',
        fontWeight: '500',
    },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 14,
    },
    statsRow: {
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
        padding: 15,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardMain: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 18,
        backgroundColor: '#f5f5f5',
    },
    info: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    categoryBadge: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.light.accent,
        marginBottom: 2,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.light.text,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginTop: 2,
    },
    price: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.light.tint,
    },
    unit: {
        fontSize: 12,
        color: Colors.light.earthy,
    },
    stockStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    details: {
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 4,
    },
    actions: {
        alignItems: 'center',
        marginLeft: 10,
    },
    updateBtn: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 10,
    },
    actionGradient: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 4,
    },
    deleteBtn: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    empty: {
        textAlign: 'center',
        marginTop: 15,
        color: Colors.light.earthy,
        fontSize: 16,
        paddingHorizontal: 40,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 25,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.light.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: Colors.light.secondaryText,
        marginBottom: 25,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 56,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 18,
        color: Colors.light.text,
        fontWeight: '600',
    },
    confirmBtn: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    btnGradient: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
