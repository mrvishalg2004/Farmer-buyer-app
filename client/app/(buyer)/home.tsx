import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Alert, TextInput, ScrollView, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

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
    isAuction?: boolean;
    basePrice?: number;
    highestBid?: number;
    auctionEndTime?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
    'All': 'apps',
    'Vegetables': 'carrot',
    'Fruits': 'food-apple',
    'Grains': 'wheat',
    'Dairy': 'bottle-wine',
    'Others': 'dots-horizontal'
};

export default function BuyerHome() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const router = useRouter();
    const { logout } = useAuth();

    const categories = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Others'];

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_URL}/products`, {
                params: {
                    category: selectedCategory,
                    search: search
                }
            });
            setProducts(res.data as Product[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchProducts();
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [search, selectedCategory]);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [selectedCategory])
    );

    const addToCart = async (productId: string) => {
        try {
            await axios.post(`${API_URL}/cart`, { productId, quantity: 1 });
            Alert.alert("Success", "Added to your basket! 🧺");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Could not add to cart");
        }
    };

    const renderItem = ({ item, index }: { item: Product; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay(index * 100).duration(500)}
            style={[styles.card, Shadows.light]}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&h=200&auto=format&fit=crop' }}
                    style={styles.image}
                />
                {item.quantity > 0 && !item.isAuction && (
                    <View style={styles.tagFresh}>
                        <MaterialCommunityIcons name="leaf" size={12} color="#fff" />
                        <Text style={styles.tagText}>FRESH</Text>
                    </View>
                )}
            </View>

            <View style={styles.info}>
                <View>
                    <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.priceContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <Text style={styles.price}>{item.isAuction ? item.basePrice : item.price}</Text>
                        <Text style={styles.unit}> / {item.unit}</Text>
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    {item.isAuction ? (
                        <View style={styles.auctionBadge}>
                            <MaterialCommunityIcons name="gavel" size={14} color={Colors.light.accent} />
                            <Text style={styles.auctionText}>Auction</Text>
                        </View>
                    ) : (
                        item.quantity > 0 ? (
                            <Text style={styles.stock}>In Stock: {item.quantity}</Text>
                        ) : (
                            <Text style={styles.outOfStock}>Sold Out</Text>
                        )
                    )}
                </View>
            </View>

            <View style={styles.actionContainer}>
                {item.isAuction ? (
                    <TouchableOpacity
                        style={styles.bidBtn}
                        onPress={() => router.push(`/product/${item._id}` as any)}
                    >
                        <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.addBtn, item.quantity === 0 && styles.disabledBtn]}
                        onPress={() => addToCart(item._id)}
                        disabled={item.quantity === 0}
                    >
                        <Ionicons name="cart-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.text, Colors.light.tint]}
                style={styles.heroHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.welcomeText}>Fresh from Farms</Text>
                        <Text style={styles.brandText}>KHETKART</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity style={styles.iconBtn} onPress={logout}>
                            <MaterialCommunityIcons name="logout" size={22} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.searchBar, Shadows.medium]}>
                    <Ionicons name="search" size={20} color={Colors.light.tint} />
                    <TextInput
                        style={styles.input}
                        placeholder="Search for fresh produce..."
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categories</Text>
                </View>

                <View>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoryList}
                    >
                        {categories.map((cat, index) => (
                            <Animated.View
                                key={cat}
                                entering={FadeInRight.delay(index * 50).duration(400)}
                            >
                                <TouchableOpacity
                                    style={[
                                        styles.categoryBtn,
                                        selectedCategory === cat && styles.activeCategoryBtn
                                    ]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <View style={[
                                        styles.catIconContainer,
                                        selectedCategory === cat && styles.activeCatIconContainer
                                    ]}>
                                        <MaterialCommunityIcons
                                            name={CATEGORY_ICONS[cat] || 'grid'}
                                            size={20}
                                            color={selectedCategory === cat ? '#fff' : Colors.light.tint}
                                        />
                                    </View>
                                    <Text style={[
                                        styles.categoryText,
                                        selectedCategory === cat && styles.activeCategoryText
                                    ]}>{cat}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.marketHeader}>
                    <Text style={styles.sectionTitle}>Marketplace</Text>
                    <Text style={styles.itemCount}>{products.length} products found</Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Colors.light.tint} />
                        <Text style={styles.loaderText}>Fetching fresh produce...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="leaf-off" size={64} color={Colors.light.border} />
                                <Text style={styles.empty}>No products available in this category.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    heroHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    welcomeText: {
        fontSize: 16,
        color: '#E8F5E9',
        fontWeight: '500',
    },
    brandText: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 1,
    },
    iconBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 15,
        borderRadius: 16,
        height: 54,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: Colors.light.text,
    },
    content: {
        flex: 1,
    },
    sectionHeader: {
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    categoryList: {
        paddingHorizontal: 15,
        paddingBottom: 15,
    },
    categoryBtn: {
        alignItems: 'center',
        marginRight: 15,
        padding: 5,
    },
    activeCategoryBtn: {
        borderRadius: 20,
    },
    catIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    activeCatIconContainer: {
        backgroundColor: Colors.light.tint,
        borderColor: Colors.light.tint,
    },
    categoryText: {
        fontSize: 12,
        color: Colors.light.earthy,
        fontWeight: '600',
    },
    activeCategoryText: {
        color: Colors.light.tint,
        fontWeight: '700',
    },
    marketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    itemCount: {
        fontSize: 12,
        color: Colors.light.secondaryText,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderText: {
        marginTop: 10,
        color: Colors.light.tint,
        fontWeight: '500',
    },
    list: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        width: 90,
        height: 90,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
    },
    tagFresh: {
        position: 'absolute',
        top: -5,
        left: -5,
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagText: {
        color: '#fff',
        fontSize: 8,
        fontWeight: '900',
        marginLeft: 2,
    },
    info: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'space-around',
        height: 80,
    },
    categoryBadge: {
        fontSize: 10,
        fontWeight: '700',
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
    },
    currency: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.tint,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.light.tint,
    },
    unit: {
        fontSize: 12,
        color: Colors.light.earthy,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stock: {
        fontSize: 11,
        color: Colors.light.secondaryText,
        fontWeight: '600',
    },
    outOfStock: {
        fontSize: 11,
        color: '#D32F2F',
        fontWeight: '600',
    },
    auctionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    auctionText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.light.accent,
        marginLeft: 4,
    },
    actionContainer: {
        marginLeft: 10,
    },
    addBtn: {
        backgroundColor: Colors.light.tint,
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bidBtn: {
        backgroundColor: Colors.light.accent,
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledBtn: {
        backgroundColor: '#E0E0E0',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    empty: {
        textAlign: 'center',
        marginTop: 15,
        color: Colors.light.earthy,
        fontSize: 16,
        paddingHorizontal: 40,
    },
});
