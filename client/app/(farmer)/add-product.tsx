import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';

import { API_URL } from '@/constants/config';



export default function AddProduct() {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState(''); // kg, dozen, etc.
    const [quantity, setQuantity] = useState('');
    const [description, setDescription] = useState('');
    const [isAuction, setIsAuction] = useState(false);
    const [auctionDuration, setAuctionDuration] = useState(''); // in days
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async () => {
        if (!name || !category || !price || !unit || !quantity) {
            Alert.alert('Error', 'Please fill required fields');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_URL}/products`, {
                name,
                category,
                price: parseFloat(price),
                unit,
                quantity: parseInt(quantity),
                image: '', // No image provided
                description,
                isAuction,
                basePrice: isAuction ? parseFloat(price) : 0,
                auctionEndTime: isAuction ? new Date(Date.now() + parseInt(auctionDuration) * 24 * 60 * 60 * 1000) : undefined
            });
            Alert.alert('Success', 'Product added!');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
            {/* <Text style={styles.heading}>New Listing</Text> */}

            <View style={styles.formGroup}>
                <Text style={styles.label}>Product Name</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Red Apples" />
            </View>

            <View style={styles.switchContainer}>
                <Text style={styles.label}>Sell via Auction?</Text>
                <TouchableOpacity
                    style={[styles.toggleBtn, isAuction && styles.toggleBtnActive]}
                    onPress={() => setIsAuction(!isAuction)}
                >
                    <Text style={[styles.toggleText, isAuction && styles.toggleTextActive]}>
                        {isAuction ? 'Yes, Auction' : 'No, Fixed Price'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Category</Text>
                    <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="e.g. Fruit" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Unit</Text>
                    <TextInput style={styles.input} value={unit} onChangeText={setUnit} placeholder="e.g. kg, dozen" />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>{isAuction ? "Base Price (₹)" : "Price (₹)"}</Text>
                    <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="0.00" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput style={styles.input} value={quantity} onChangeText={setQuantity} keyboardType="numeric" placeholder="0" />
                </View>
            </View>

            {isAuction && (
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Auction Duration (Days)</Text>
                    <TextInput
                        style={styles.input}
                        value={auctionDuration}
                        onChangeText={setAuctionDuration}
                        keyboardType="numeric"
                        placeholder="e.g. 3"
                    />
                </View>
            )}

            <View style={styles.formGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Product details..."
                    multiline
                    numberOfLines={4}
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>List Product</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    formGroup: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
    },
    label: {
        marginBottom: 5,
        fontWeight: '500',
        color: '#666',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fafafa',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        backgroundColor: '#2E7D32',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    toggleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#e0e0e0',
    },
    toggleBtnActive: {
        backgroundColor: '#2E7D32',
    },
    toggleText: {
        fontSize: 14,
        color: '#333',
    },
    toggleTextActive: {
        color: '#fff',
    },
});
