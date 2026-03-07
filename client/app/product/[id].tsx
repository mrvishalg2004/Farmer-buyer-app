import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import { useAuth } from '../../context/AuthContext';

interface Bid {
    user: string;
    amount: number;
    time: string;
}

interface Product {
    _id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    quantity: number;
    image?: string;
    description?: string;
    isAuction?: boolean;
    basePrice?: number;
    highestBid?: number;
    auctionEndTime?: string;
    bids?: Bid[];
    farmer: string;
    auctionStatus?: 'OPEN' | 'CLOSED' | 'SOLD';
    highestBidderId?: string;
}

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [bidAmount, setBidAmount] = useState('');
    const [placingBid, setPlacingBid] = useState(false);
    const { user } = useAuth();

    const [timeLeft, setTimeLeft] = useState('');
    const [auctionActive, setAuctionActive] = useState(true);

    useEffect(() => {
        fetchProduct();
        const interval = setInterval(fetchProduct, 5000); // Poll every 5 seconds
        return () => clearInterval(interval);
    }, [id, user]);

    useEffect(() => {
        if (product?.isAuction) {
            // Check status first
            if (product.auctionStatus && product.auctionStatus !== 'OPEN') {
                setAuctionActive(false);
                setTimeLeft(product.auctionStatus === 'SOLD' ? 'Auction Sold' : 'Auction Closed');
                return;
            }

            if (product.auctionEndTime) {
                const timer = setInterval(() => {
                    const now = new Date().getTime();
                    const end = new Date(product.auctionEndTime!).getTime();
                    const diff = end - now;

                    if (diff <= 0) {
                        clearInterval(timer);
                        setTimeLeft('Auction Ended');
                        setAuctionActive(false);
                    } else {
                        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
                        setAuctionActive(true);
                    }
                }, 1000);
                return () => clearInterval(timer);
            }
        }
    }, [product]);

    const fetchProduct = async () => {
        try {
            const res = await axios.get(`${API_URL}/products/${id}`);
            const found = res.data as Product;

            if (found) {
                console.log('--- Product Debug ---');
                console.log('Product ID:', found._id);
                console.log('Auction Status:', found.auctionStatus);
                console.log('Highest Bidder ID:', found.highestBidderId);
                console.log('Current User ID:', user?.id);
                console.log('Match:', user && found.highestBidderId === user.id);
            }

            setProduct(found || null);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Could not load product');
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceBid = async () => {
        if (!bidAmount) return;

        const amount = parseFloat(bidAmount);
        if (isNaN(amount)) {
            Alert.alert('Error', 'Invalid amount');
            return;
        }

        if (product && amount <= (product.highestBid || product.basePrice || 0)) {
            Alert.alert('Error', 'Bid must be higher than current price');
            return;
        }

        setPlacingBid(true);
        try {
            await axios.post(`${API_URL}/bids/place`, {
                productId: id,
                bidAmount: amount
            });
            Alert.alert('Success', 'Bid placed successfully!');
            setBidAmount('');
            fetchProduct(); // Refresh
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not place bid');
        } finally {
            setPlacingBid(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#2E7D32" /></View>;
    }

    if (!product) {
        return <View style={styles.center}><Text>Product not found</Text></View>;
    }

    const currentPrice = product.highestBid || product.basePrice || product.price;

    return (
        <ScrollView style={styles.container}>
            <Image
                source={{ uri: product.image || 'https://placehold.co/400x300?text=Product' }}
                style={styles.image}
            />

            <View style={styles.content}>
                <Text style={styles.name}>{product.name}</Text>
                <Text style={styles.category}>{product.category}</Text>

                <Text style={styles.price}>
                    {product.isAuction ? 'Current Bid: ' : 'Price: '}
                    ₹{currentPrice}/{product.unit}
                </Text>

                {product.isAuction && (
                    <Text style={[styles.auctionInfo, !auctionActive && styles.auctionClosed]}>
                        Time Left: {timeLeft}
                    </Text>
                )}

                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>
                    {product.description || 'No description available.'}
                </Text>

                {product.isAuction && (
                    <View style={styles.bidSection}>
                        <Text style={styles.sectionTitle}>Place a Bid</Text>

                        {auctionActive ? (
                            <>
                                <TextInput
                                    style={styles.input}
                                    value={bidAmount}
                                    onChangeText={setBidAmount}
                                    placeholder={`Enter amount > ₹${currentPrice}`}
                                    keyboardType="numeric"
                                />
                                <TouchableOpacity
                                    style={styles.bidBtn}
                                    onPress={handlePlaceBid}
                                    disabled={placingBid}
                                >
                                    {placingBid ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.bidBtnText}>Place Bid</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={styles.closedContainer}>
                                {product.auctionStatus === 'SOLD' ? (
                                    user && product.highestBidderId === user.id ? (
                                        <Text style={styles.winnerText}>🎉 Congratulations! You won this auction! 🎉</Text>
                                    ) : (
                                        <Text style={styles.closedText}>This item has been SOLD</Text>
                                    )
                                ) : (
                                    <Text style={styles.closedText}>Bidding is Closed</Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 300,
        backgroundColor: '#f0f0f0',
    },
    content: {
        padding: 20,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    category: {
        fontSize: 16,
        color: '#666',
        marginBottom: 12,
    },
    price: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 8,
    },
    auctionInfo: {
        fontSize: 14,
        color: '#F57C00',
        marginBottom: 20,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#444',
        lineHeight: 24,
        marginBottom: 20,
    },
    bidSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 15,
    },
    bidBtn: {
        backgroundColor: '#F57C00',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    bidBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    auctionClosed: {
        color: 'red',
    },
    disabledBtn: {
        backgroundColor: '#ccc',
    },
    closedContainer: {
        padding: 20,
        backgroundColor: '#ffebee',
        borderRadius: 8,
        alignItems: 'center',
    },
    closedText: {
        color: '#d32f2f',
        fontWeight: 'bold',
        fontSize: 16,
    },
    winnerText: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    }
});
