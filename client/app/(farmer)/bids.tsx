import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image, Dimensions } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

interface Bid {
    _id: string;
    buyerId: { _id: string, name: string, email: string } | string;
    bidAmount: number;
    requestedQuantity: number;
    status?: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    createdAt: string;
}

interface Product {
    _id: string;
    name: string;
    image?: string;
    isAuction?: boolean;
    basePrice: number;
    highestBid: number;
    auctionStatus?: string;
    bids: Bid[];
}

export default function FarmerBids() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { logout } = useAuth();

    const fetchBids = async () => {
        try {
            const res = await axios.get(`${API_URL}/products/my`);
            const allProducts = res.data as Product[];
            const auctionProducts = allProducts.filter((p: Product) => p.isAuction);

            // Hydrate with strict bids from collection
            const hydrated = await Promise.all(auctionProducts.map(async (p) => {
                try {
                    const bidsRes = await axios.get(`${API_URL}/bids/product/${p._id}`);
                    const bids = bidsRes.data as Bid[];
                    return { ...p, bids };
                } catch (e) {
                    return { ...p, bids: [] };
                }
            }));

            setProducts(hydrated);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBids();
        }, [])
    );

    const handleAcceptBid = async (productId: string, bidId: string, amount: number, requestedQuantity: number) => {
        Alert.alert(
            "Accept Bid",
            `Accept offer for ${requestedQuantity} units at ₹${amount}/unit?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: async () => {
                        try {
                            await axios.post(`${API_URL}/bids/${bidId}/accept`, {});
                            Alert.alert("Success", "Bid accepted! Order has been created. 🎉");
                            fetchBids();
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to accept bid");
                        }
                    }
                }
            ]
        );
    };

    const renderBid = (bid: Bid, productId: string, isSold: boolean, index: number) => (
        <Animated.View
            key={bid._id}
            entering={FadeInDown.delay(index * 50)}
            style={[styles.bidRow, isSold && { opacity: 0.6 }]}
        >
            <View style={styles.bidMain}>
                <View style={styles.bidIcon}>
                    <MaterialCommunityIcons name="account" size={16} color={Colors.light.tint} />
                </View>
                <View>
                    <Text style={styles.bidUser}>
                        {typeof bid.buyerId === 'object' ? bid.buyerId.name : 'Unknown Buyer'}
                    </Text>
                    <Text style={styles.bidTime}>
                        {new Date(bid.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <View style={styles.bidAction}>
                <Text style={styles.bidAmount}>₹{bid.bidAmount}/unit</Text>
                <Text style={styles.bidMeta}>Qty: {bid.requestedQuantity || 1}</Text>
                {bid.status === 'ACCEPTED' ? (
                    <Text style={styles.acceptedTag}>ACCEPTED</Text>
                ) : !isSold && (
                    <TouchableOpacity
                        style={styles.acceptBtn}
                        onPress={() => handleAcceptBid(productId, bid._id, bid.bidAmount, bid.requestedQuantity || 1)}
                    >
                        <Text style={styles.acceptText}>ACCEPT</Text>
                    </TouchableOpacity>
                )}
            </View>
        </Animated.View>
    );

    const renderProduct = ({ item, index }: { item: Product, index: number }) => {
        const isSold = item.auctionStatus === 'SOLD';

        return (
            <Animated.View
                entering={FadeInUp.delay(index * 100).duration(500)}
                style={[styles.card, Shadows.light]}
            >
                <View style={styles.cardHeader}>
                    <Image
                        source={{ uri: item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&h=200&auto=format&fit=crop' }}
                        style={styles.image}
                    />
                    <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.name}</Text>
                        <View style={styles.bidStatus}>
                            {isSold ? (
                                <View style={styles.soldBadge}>
                                    <MaterialCommunityIcons name="check-decagram" size={14} color="#fff" />
                                    <Text style={styles.soldText}>SOLD</Text>
                                </View>
                            ) : (
                                <View style={styles.activeBadge}>
                                    <MaterialCommunityIcons name="gavel" size={14} color={Colors.light.accent} />
                                    <Text style={styles.highestBidText}>Highest: ₹{item.highestBid || item.basePrice}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.bidsSection}>
                    <Text style={styles.sectionLabel}>Recent Bids</Text>
                    <View style={styles.divider} />
                    {item.bids && item.bids.length > 0 ? (
                        item.bids
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((bid, idx) => renderBid(bid, item._id, isSold, idx))
                    ) : (
                        <View style={styles.noBidsContainer}>
                            <MaterialCommunityIcons name="gavel" size={24} color={Colors.light.border} />
                            <Text style={styles.noBids}>Waiting for first bid...</Text>
                        </View>
                    )}
                </View>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Fetching active auctions...</Text>
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
                        <Text style={styles.dashboardTitle}>Live Auctions</Text>
                        <Text style={styles.dashboardSubtitle}>Manage your active bidding</Text>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                        <MaterialCommunityIcons name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.auctionHeader}>
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{products.filter(p => p.auctionStatus !== 'SOLD').length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statBox}>
                        <Text style={styles.statVal}>{products.filter(p => p.auctionStatus === 'SOLD').length}</Text>
                        <Text style={styles.statLabel}>Complete</Text>
                    </View>
                </View>
            </LinearGradient>

            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="gavel" size={80} color={Colors.light.border} />
                        <Text style={styles.emptyTitle}>No Auctions Found</Text>
                        <Text style={styles.emptySub}>Start an auction to sell to the highest bidder.</Text>
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
    auctionHeader: {
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
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    image: {
        width: 65,
        height: 65,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
    },
    productInfo: {
        flex: 1,
        marginLeft: 15,
    },
    productName: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.text,
    },
    bidStatus: {
        marginTop: 4,
        flexDirection: 'row',
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    highestBidText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.light.accent,
        marginLeft: 4,
    },
    soldBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    soldText: {
        fontSize: 11,
        fontWeight: '900',
        color: '#fff',
        marginLeft: 4,
    },
    bidsSection: {
        marginTop: 5,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.light.border,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 12,
    },
    bidRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#FCFCFC',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    bidMain: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    bidIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    bidUser: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
    },
    bidTime: {
        fontSize: 11,
        color: Colors.light.secondaryText,
    },
    bidAction: {
        alignItems: 'flex-end',
    },
    bidAmount: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.light.tint,
    },
    bidMeta: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.light.secondaryText,
        marginBottom: 4,
    },
    acceptedTag: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.light.tint,
    },
    acceptBtn: {
        backgroundColor: Colors.light.tint,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    acceptText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    noBidsContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    noBids: {
        fontSize: 14,
        color: Colors.light.border,
        fontWeight: '600',
        marginTop: 8,
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
