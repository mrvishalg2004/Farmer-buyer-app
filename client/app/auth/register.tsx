import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ImageBackground,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

import { API_URL } from '@/constants/config';

const { width, height } = Dimensions.get('window');

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState<'farmer' | 'buyer'>('buyer');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
            const data = res.data as { token: string; user: any };
            await login(data.token, data.user);
        } catch (error: any) {
            console.error("Registration Error:", error);
            const msg = error.response?.data?.message || error.message || 'Something went wrong';
            Alert.alert('Registration Failed', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/images/auth-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.overlay}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.card}>
                        <View style={styles.header}>
                            <View style={styles.logoCircle}>
                                <Ionicons name="leaf" size={40} color="#2E7D32" />
                            </View>
                            <Text style={styles.title}>KhetKart</Text>
                            <Text style={styles.subtitle}>Empowering Agriculture, Connecting Lives</Text>
                        </View>

                        <Text style={styles.label}>Select Your Role</Text>
                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                                onPress={() => setRole('buyer')}
                            >
                                <Ionicons name="cart" size={22} color={role === 'buyer' ? '#fff' : '#2E7D32'} />
                                <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>Buyer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                                onPress={() => setRole('farmer')}
                            >
                                <Ionicons name="business" size={22} color={role === 'farmer' ? '#fff' : '#2E7D32'} />
                                <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>Farmer</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputSection}>
                            <View style={styles.inputWrapper}>
                                <Ionicons name="person-outline" size={20} color="#4E342E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholderTextColor="#795548"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="mail-outline" size={20} color="#4E342E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    placeholderTextColor="#795548"
                                />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Ionicons name="lock-closed-outline" size={20} color="#4E342E" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    placeholderTextColor="#795548"
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 10, marginRight: -5 }}>
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#2E7D32" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Get Started</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <Link href="/auth/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.link}>Login Here</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: width,
        height: height,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 30,
        padding: 25,
        width: '100%',
        maxWidth: 450,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#2E7D32',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1B5E20',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 14,
        color: '#5D4037',
        marginTop: 5,
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3E2723',
        marginBottom: 12,
        marginLeft: 5,
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 12,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 15,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#2E7D32',
    },
    roleButtonActive: {
        backgroundColor: '#2E7D32',
    },
    roleText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginLeft: 8,
    },
    roleTextActive: {
        color: '#fff',
    },
    inputSection: {
        marginBottom: 25,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 15,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 60,
        borderWidth: 1,
        borderColor: '#D7CCC8',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#3E2723',
    },
    button: {
        backgroundColor: '#2E7D32',
        height: 60,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
    footerText: {
        color: '#5D4037',
        fontSize: 15,
    },
    link: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
});

