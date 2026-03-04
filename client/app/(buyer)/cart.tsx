import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Image, Alert, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

import SuccessModal from '../../components/SuccessModal';
import { useRouter } from 'expo-router';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface CartItem {
    product: {
        _id: string;
        name: string;
        price: number;
        unit: string;
        image?: string;
    };
    quantity: number;
    _id: string;
}

export default function CartScreen() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checkingOut, setCheckingOut] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const router = useRouter();
    const { logout } = useAuth();

    const onAnimationFinish = () => {
        setShowSuccess(false);
        router.push('/(buyer)/orders');
    };

    const fetchCart = async () => {
        try {
            const res = await axios.get(`${API_URL}/cart`);
            const items = (res.data as any).items || [];
            setCartItems(items);
            calculateTotal(items);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotal = (items: CartItem[]) => {
        const t = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        setTotal(t);
    }

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const updateQuantity = async (productId: string, newQty: number) => {
        if (newQty < 0) return;
        try {
            const res = await axios.post(`${API_URL}/cart`, { productId, quantity: newQty });
            const items = (res.data as any).items;
            setCartItems(items);
            calculateTotal(items);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) return;
        setCheckingOut(true);

        try {
            const orderRes = await axios.post(`${API_URL}/orders/create`, { amount: total });
            const { id: order_id, amount, currency } = orderRes.data as any;

            Alert.alert(
                "Secure Checkout",
                `Proceed to pay ₹${total} via Razorpay Secure?`,
                [
                    { text: 'Cancel', style: 'cancel', onPress: () => setCheckingOut(false) },
                    {
                        text: 'Pay Now', onPress: async () => {
                            try {
                                await axios.post(`${API_URL}/orders/verify`, {
                                    razorpay_order_id: order_id,
                                    razorpay_payment_id: 'pay_test_' + Date.now(),
                                    razorpay_signature: 'MOCK_SIGNATURE',
                                    items: cartItems.map(item => ({
                                        product: item.product._id,
                                        name: item.product.name,
                                        price: item.product.price,
                                        quantity: item.quantity
                                    })),
                                    totalAmount: total
                                });
                                setCartItems([]);
                                setTotal(0);
                                setCheckingOut(false);
                                setShowSuccess(true);
                            } catch (err) {
                                Alert.alert("Error", "Payment verification failed");
                                setCheckingOut(false);
                            }
                        }
                    }
                ]
            );

        } catch (error) {
            Alert.alert("Error", "Checkout failed");
            setCheckingOut(false);
        }
    };

    const renderItem = ({ item, index }: { item: CartItem; index: number }) => (
        <Animated.View
            entering={SlideInRight.delay(index * 100).duration(400)}
            style={[styles.card, Shadows.light]}
        >
            <Image
                source={{ uri: item.product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=100&h=100&auto=format&fit=crop' }}
                style={styles.image}
                resizeMode="cover"
            />
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.unitText}>{item.product.unit}</Text>
                <Text style={styles.priceText}>₹{item.product.price}</Text>
            </View>
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product._id, Math.max(0, item.quantity - 1))}
                >
                    <Ionicons name="remove" size={18} color="#fff" />
                </TouchableOpacity>
                <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                </View>
                <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQuantity(item.product._id, item.quantity + 1)}
                >
                    <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Fetching your basket...</Text>
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
                <View style={styles.headerContent}>
                    <View>
                        <Text style={styles.headerTitle}>My Basket</Text>
                        <View style={styles.itemBadge}>
                            <Text style={styles.itemBadgeText}>{cartItems.length} Items</Text>
                        </View>
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
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.product._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="basket-off-outline" size={80} color={Colors.light.border} />
                        <Text style={styles.emptyTitle}>Your basket is empty</Text>
                        <Text style={styles.emptySub}>Start adding some fresh produce!</Text>
                        <TouchableOpacity style={styles.shopBtn} onPress={() => router.push('/(buyer)/home')}>
                            <Text style={styles.shopBtnText}>Shop Now</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            {cartItems.length > 0 && (
                <View style={styles.footerContainer}>
                    <View style={[styles.footer, Shadows.medium]}>
                        <View style={styles.totalSection}>
                            <View style={styles.row}>
                                <Text style={styles.totalLabel}>Subtotal</Text>
                                <Text style={styles.totalVal}>₹{total}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.totalLabel}>Delivery</Text>
                                <Text style={styles.freeText}>FREE</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.row}>
                                <Text style={styles.grandLabel}>Grand Total</Text>
                                <Text style={styles.grandVal}>₹{total}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleCheckout}
                            disabled={checkingOut}
                        >
                            <LinearGradient
                                colors={['#FFD54F', Colors.light.accent]}
                                style={styles.checkoutBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {checkingOut ? (
                                    <ActivityIndicator color="#1B5E20" />
                                ) : (
                                    <View style={styles.checkoutBtnContent}>
                                        <Text style={styles.checkoutText}>PROCEED TO PAY</Text>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color="#1B5E20" />
                                    </View>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <SuccessModal visible={showSuccess} onFinish={onAnimationFinish} />
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
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    itemBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    itemBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
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
        paddingBottom: 220,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    image: {
        width: 70,
        height: 70,
        borderRadius: 15,
        backgroundColor: '#f9f9f9',
    },
    info: {
        flex: 1,
        marginLeft: 15,
    },
    name: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.light.text,
    },
    unitText: {
        fontSize: 12,
        color: Colors.light.secondaryText,
        marginBottom: 4,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.tint,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F8E9',
        borderRadius: 12,
        padding: 4,
    },
    qtyBtn: {
        backgroundColor: Colors.light.tint,
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyDisplay: {
        paddingHorizontal: 10,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.light.text,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 80,
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
    },
    shopBtn: {
        marginTop: 30,
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 15,
    },
    shopBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 100, // Raised slightly more for absolute clearance
        left: 20,
        right: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
    },
    footer: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 35, // Changed from borderTopLeft/RightRadius to just borderRadius
    },
    totalSection: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 14,
        color: Colors.light.secondaryText,
        fontWeight: '600',
    },
    totalVal: {
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '700',
    },
    freeText: {
        fontSize: 14,
        color: Colors.light.tint,
        fontWeight: '900',
    },
    divider: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 12,
        borderStyle: 'dashed',
    },
    grandLabel: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.text,
    },
    grandVal: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.light.tint,
    },
    checkoutBtn: {
        height: 58,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkoutText: {
        color: '#1B5E20',
        fontSize: 18,
        fontWeight: '900',
        marginRight: 10,
        letterSpacing: 0.5,
    },
});
