import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Product {
    _id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number;
    image?: string;
    isAuction?: boolean;
    basePrice?: number;
    highestBid?: number;
    auctionEndTime?: string;
    distance?: number;
}

export default function BuyerAgriWaste() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const router = useRouter();
    const { logout } = useAuth();
    const { t } = useTranslation();

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let currentLoc = location;
            if (!currentLoc) {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({});
                    currentLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    setLocation(currentLoc);
                }
            }

            const params: any = {
                isAgriWaste: 'true',
                search: search
            };
            if (currentLoc) {
                params.buyerLat = currentLoc.latitude;
                params.buyerLng = currentLoc.longitude;
            }

            const res = await axios.get(`${API_URL}/products`, { params });
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
    }, [search]);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
        }, [])
    );

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
            </View>

            <View style={styles.info}>
                <View>
                    <Text style={styles.categoryBadge}>{item.category.toUpperCase()}</Text>
                    <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.priceContainer}>
                        <Text style={styles.currency}>₹</Text>
                        <Text style={styles.price}>{item.highestBid || item.basePrice}</Text>
                        <Text style={styles.unit}> / {item.unit}</Text>
                    </Text>
                </View>

                <View style={styles.cardFooter}>
                    <View style={styles.auctionBadge}>
                        <MaterialCommunityIcons name="gavel" size={14} color={Colors.light.accent} />
                        <Text style={styles.auctionText}>Current Bid</Text>
                    </View>
                    {item.distance !== undefined && item.distance > 50 && (
                        <View style={styles.radiusBadge}>
                            <MaterialCommunityIcons name="map-marker-distance" size={12} color="#D32F2F" />
                            <Text style={styles.outOfRadiusText}> Too far ({Math.round(item.distance)}km)</Text>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.actionContainer}>
                <TouchableOpacity
                    style={[styles.bidBtn, (item.distance !== undefined && item.distance > 50) && styles.disabledBtn]}
                    onPress={() => router.push(`/product/${item._id}` as any)}
                    disabled={item.distance !== undefined && item.distance > 50}
                >
                    <MaterialCommunityIcons name="gavel" size={20} color="#fff" />
                </TouchableOpacity>
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
                        <Text style={styles.welcomeText}>{t('agriWaste.sustainableSourcing')}</Text>
                        <Text style={styles.brandText}>{t('agriWaste.dashboardTitle')}</Text>
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
                        placeholder={t('agriWaste.searchPlaceholder')}
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
                <View style={styles.marketHeader}>
                    <Text style={styles.sectionTitle}>Auctions</Text>
                    <Text style={styles.itemCount}>{products.length} listings found</Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={Colors.light.tint} />
                        <Text style={styles.loaderText}>Fetching Agri Waste listings...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={renderItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.list}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialCommunityIcons name="leaf-maple" size={64} color={Colors.light.border} />
                                <Text style={styles.empty}>No Agri Waste auctions currently active.</Text>
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
        marginTop: 20,
    },
    marketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
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
    bidBtn: {
        backgroundColor: Colors.light.accent,
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
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
    radiusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    outOfRadiusText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#D32F2F',
    },
    disabledBtn: {
        backgroundColor: '#E0E0E0',
    },
});
