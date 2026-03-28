import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Dimensions } from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';

import { API_URL } from '@/constants/config';
import { Colors, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

const InputField = ({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', multiline = false }: any) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputContainer, multiline && styles.textAreaContainer]}>
            <MaterialCommunityIcons name={icon} size={20} color={Colors.light.tint} style={styles.inputIcon} />
            <TextInput
                style={[styles.input, multiline && styles.textArea]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#999"
                keyboardType={keyboardType}
                multiline={multiline}
                numberOfLines={multiline ? 4 : 1}
            />
        </View>
    </View>
);

export default function AddProduct() {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [unit, setUnit] = useState(''); // kg, dozen, etc.
    const [quantity, setQuantity] = useState('');
    const [imageLink, setImageLink] = useState('');
    const [description, setDescription] = useState('');
    const [isAuction, setIsAuction] = useState(false);
    const [auctionDuration, setAuctionDuration] = useState(''); // in days
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleSubmit = async () => {
        if (!name || !category || !price || !unit || !quantity) {
            Alert.alert('Error', 'Please fill required fields (Name, Category, Price, Unit, Quantity)');
            return;
        }

        setLoading(true);
        try {
            let location = null;
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const currentPos = await Location.getCurrentPositionAsync({});
                location = {
                    latitude: currentPos.coords.latitude,
                    longitude: currentPos.coords.longitude
                };
            }

            await axios.post(`${API_URL}/products`, {
                name,
                category,
                price: parseFloat(price),
                unit,
                quantity: parseInt(quantity),
                image: imageLink,
                description,
                isAuction,
                basePrice: isAuction ? parseFloat(price) : 0,
                auctionEndTime: isAuction ? new Date(Date.now() + parseInt(auctionDuration) * 24 * 60 * 60 * 1000) : undefined,
                location
            });
            Alert.alert('Success', 'Product listed successfully! 🌱');
            router.back();
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not add product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.light.text, Colors.light.tint]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>New Listing</Text>
                    <Text style={styles.headerSubtitle}>Add fresh items to your farm</Text>
                </View>
                <MaterialCommunityIcons name="sprout" size={40} color="rgba(255,255,255,0.2)" />
            </LinearGradient>

            <ScrollView
                style={styles.formWrapper}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View entering={FadeInUp.duration(600)}>
                    <InputField
                        label="Product Name"
                        value={name}
                        onChangeText={setName}
                        placeholder="e.g. Organic Red Apples"
                        icon="tag-outline"
                    />

                    <InputField
                        label="Image URL"
                        value={imageLink}
                        onChangeText={setImageLink}
                        placeholder="https://images.unsplash.com/..."
                        icon="image-outline"
                    />

                    <View style={styles.typeSelector}>
                        <Text style={styles.label}>Selling Method</Text>
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[styles.typeBtn, !isAuction && styles.typeBtnActive]}
                                onPress={() => setIsAuction(false)}
                            >
                                <MaterialCommunityIcons
                                    name="cash-multiple"
                                    size={18}
                                    color={!isAuction ? '#fff' : Colors.light.tint}
                                />
                                <Text style={[styles.typeBtnText, !isAuction && styles.typeBtnTextActive]}>Fixed Price</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, isAuction && styles.typeBtnActive]}
                                onPress={() => setIsAuction(true)}
                            >
                                <MaterialCommunityIcons
                                    name="gavel"
                                    size={18}
                                    color={isAuction ? '#fff' : Colors.light.tint}
                                />
                                <Text style={[styles.typeBtnText, isAuction && styles.typeBtnTextActive]}>Auction</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <InputField
                                label="Category"
                                value={category}
                                onChangeText={setCategory}
                                placeholder="e.g. Fruits"
                                icon="shape-outline"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="Unit"
                                value={unit}
                                onChangeText={setUnit}
                                placeholder="e.g. kg"
                                icon="scale"
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <InputField
                                label={isAuction ? "Base Price (₹)" : "Price (₹)"}
                                value={price}
                                onChangeText={setPrice}
                                placeholder="0.00"
                                icon="currency-inr"
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <InputField
                                label="Stock Qty"
                                value={quantity}
                                onChangeText={setQuantity}
                                placeholder="0"
                                icon="store-24-hour"
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {isAuction && (
                        <Animated.View entering={FadeInDown}>
                            <InputField
                                label="Auction Duration (Days)"
                                value={auctionDuration}
                                onChangeText={setAuctionDuration}
                                placeholder="e.g. 7"
                                icon="calendar-clock"
                                keyboardType="numeric"
                            />
                        </Animated.View>
                    )}

                    <InputField
                        label="Description"
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Tell buyers about your fresh produce..."
                        icon="text-subject"
                        multiline
                    />

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.disabledBtn]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        <LinearGradient
                            colors={[Colors.light.tint, '#2E7D32']}
                            style={styles.btnGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="check-circle-outline" size={22} color="#fff" />
                                    <Text style={styles.submitText}>LIST PRODUCT</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomLeftRadius: 35,
        borderBottomRightRadius: 35,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 8,
        borderRadius: 12,
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#E8F5E9',
        fontWeight: '500',
    },
    formWrapper: {
        flex: 1,
    },
    scrollContent: {
        padding: 25,
        paddingBottom: 110, // Account for tab bar
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1,
        borderColor: '#EEE',
        ...Shadows.light,
    },
    textAreaContainer: {
        height: 120,
        alignItems: 'flex-start',
        paddingVertical: 15,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.light.text,
        fontWeight: '600',
    },
    textArea: {
        height: '100%',
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    typeSelector: {
        marginBottom: 20,
    },
    typeButtons: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 16,
        padding: 6,
    },
    typeBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
    },
    typeBtnActive: {
        backgroundColor: Colors.light.tint,
        ...Shadows.light,
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.light.tint,
        marginLeft: 8,
    },
    typeBtnTextActive: {
        color: '#fff',
    },
    submitBtn: {
        borderRadius: 18,
        overflow: 'hidden',
        marginTop: 10,
        ...Shadows.medium,
    },
    btnGradient: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
        marginLeft: 10,
    },
    disabledBtn: {
        opacity: 0.7,
    },
});
