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
    Dimensions,
    Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

import { API_URL } from '@/constants/config';

const { width, height } = Dimensions.get('window');

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'farmer' | 'buyer'>('buyer');
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        console.log('Attempting login with:', email, 'at', `${API_URL}/auth/login`);
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { email, password }, { timeout: 5000 });
            const data = res.data as { token: string; user: any };

            if (data.user.role !== role) {
                Alert.alert(
                    'Login Failed',
                    `This account is registered as a '${data.user.role}'. Please switch to that role to login.`
                );
                return;
            }

            await login(data.token, data.user);
        } catch (error: any) {
            console.error('Login error details:', error);
            if (error.code === 'ECONNABORTED') {
                Alert.alert('Login Failed', 'Request timed out. Check your network or server URL.');
            } else {
                Alert.alert('Login Failed', error.response?.data?.message || error.message || 'Something went wrong');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <ImageBackground
            source={require('../../assets/images/login-bg.png')}
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
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Connecting Farmers & Buyers Globally</Text>
                        </View>

                        <View style={styles.roleContainer}>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                                onPress={() => setRole('buyer')}
                            >
                                <Ionicons name="cart" size={20} color={role === 'buyer' ? '#fff' : '#2E7D32'} />
                                <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>Buyer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                                onPress={() => setRole('farmer')}
                            >
                                <Ionicons name="business" size={20} color={role === 'farmer' ? '#fff' : '#2E7D32'} />
                                <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>Farmer</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputSection}>
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
                                    placeholder="Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                    placeholderTextColor="#795548"
                                />
                            </View>
                        </View>

                        <View style={styles.extraContainer}>
                            <View style={styles.rememberMe}>
                                <Switch
                                    value={rememberMe}
                                    onValueChange={setRememberMe}
                                    trackColor={{ false: '#D7CCC8', true: '#A5D6A7' }}
                                    thumbColor={rememberMe ? '#2E7D32' : '#f4f3f4'}
                                />
                                <Text style={styles.rememberText}>Remember Me</Text>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.forgotText}>Forgot Password?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Login</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <Link href="/auth/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.link}>Create Account</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
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
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#2E7D32',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1B5E20',
    },
    subtitle: {
        fontSize: 14,
        color: '#5D4037',
        marginTop: 5,
        textAlign: 'center',
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 10,
    },
    roleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#2E7D32',
    },
    roleButtonActive: {
        backgroundColor: '#2E7D32',
    },
    roleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginLeft: 6,
    },
    roleTextActive: {
        color: '#fff',
    },
    inputSection: {
        marginBottom: 15,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        height: 56,
        borderWidth: 1,
        borderColor: '#D7CCC8',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#3E2723',
    },
    extraContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 25,
    },
    rememberMe: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rememberText: {
        fontSize: 13,
        color: '#5D4037',
        marginLeft: 5,
    },
    forgotText: {
        fontSize: 13,
        color: '#2E7D32',
        fontWeight: '600',
    },
    button: {
        backgroundColor: '#2E7D32',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#2E7D32',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A5D6A7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 25,
    },
    footerText: {
        color: '#5D4037',
        fontSize: 14,
    },
    link: {
        color: '#2E7D32',
        fontWeight: 'bold',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});

