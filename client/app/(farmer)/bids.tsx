import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Image } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from 'expo-router';
import { API_URL } from '@/constants/config';

interface Bid {
    _id: string;
    buyerId: { _id: string, name: string, email: string } | string;
    bidAmount: number;
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

    const fetchBids = async () => {
        try {
            const res = await axios.get(`${API_URL}/products/my`);
            const allProducts = res.data as Product[];
            const auctionProducts = allProducts.filter((p: Product) => p.isAuction);

            // Hydrate with strict bids from collection
            const hydrated = await Promise.all(auctionProducts.map(async (p) => {
                try {
                    const bidsRes = await axios.get(`${API_URL}/bids/product/${p._id}`);
                    // Ensure we cast correctly
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

    const handleAcceptBid = async (productId: string, bidId: string, amount: number) => {
        Alert.alert(
            "Accept Bid",
            `Sell for ₹${amount}? This will create an order.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Accept",
                    onPress: async () => {
                        try {
                            await axios.post(`${API_URL}/bids/${bidId}/accept`, {});
                            Alert.alert("Success", "Bid accepted! Order created.");
                            fetchBids();
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.message || "Failed to accept bid");
                        }
                    }
                }
            ]
        );
    };

    const renderBid = (bid: Bid, productId: string, isSold: boolean) => (
        <View key={bid._id} style={styles.bidRow}>
            <Text style={styles.bidUser}>
                User: {typeof bid.buyerId === 'object' ? bid.buyerId.name : 'User'}
            </Text>
            <Text style={styles.bidAmount}>₹{bid.bidAmount}</Text>

            {!isSold && (
                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAcceptBid(productId, bid._id, bid.bidAmount)}
                >
                    <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderProduct = ({ item }: { item: Product }) => {
        const isSold = item.auctionStatus === 'SOLD';

        return (
            <View style={styles.card}>
                <View style={styles.header}>
                    <Image
                        source={{ uri: item.image || 'https://placehold.co/50x50' }}
                        style={styles.image}
                    />
                    <View>
                        <Text style={styles.info}>Auction: {item.name}</Text>
                        <Text style={[styles.subInfo, isSold && styles.soldText]}>
                            {isSold ? 'SOLD' : `Highest Bid: ₹${item.highestBid || 0}`}
                        </Text>
                    </View>
                </View>

                <View style={styles.bidsList}>
                    {item.bids && item.bids.length > 0 ? (
                        item.bids
                            .sort((a, b) => b.bidAmount - a.bidAmount)
                            .map(bid => renderBid(bid, item._id, isSold))
                    ) : (
                        <Text style={styles.noBids}>No bids yet.</Text>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={products}
                renderItem={renderProduct}
                keyExtractor={item => item._id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No active auctions.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
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
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 4,
        marginRight: 10,
    },
    info: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subInfo: {
        color: '#666',
        fontSize: 12,
    },
    bidsList: {
        paddingLeft: 10,
    },
    bidRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#f0f0f0',
        padding: 8,
        borderRadius: 4,
    },
    bidUser: {
        fontSize: 12,
        color: '#555',
    },
    bidAmount: {
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    acceptBtn: {
        backgroundColor: '#2E7D32',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    acceptText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    noBids: {
        fontStyle: 'italic',
        color: '#999',
    },
    empty: {
        textAlign: 'center',
        marginTop: 50,
        color: '#999',
    },
    soldText: {
        color: 'red',
        fontWeight: 'bold',
    }
});
