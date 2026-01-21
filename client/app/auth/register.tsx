import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://192.168.1.4:5001';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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
        <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>

            <View style={styles.roleContainer}>
                <TouchableOpacity
                    style={[styles.roleButton, role === 'buyer' && styles.roleButtonActive]}
                    onPress={() => setRole('buyer')}
                >
                    <Text style={[styles.roleText, role === 'buyer' && styles.roleTextActive]}>I'm a Buyer</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.roleButton, role === 'farmer' && styles.roleButtonActive]}
                    onPress={() => setRole('farmer')}
                >
                    <Text style={[styles.roleText, role === 'farmer' && styles.roleTextActive]}>I'm a Farmer</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Register</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text>Already have an account? </Text>
                <Link href="/auth/login" asChild>
                    <TouchableOpacity>
                        <Text style={styles.link}>Login</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    roleContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden',
    },
    roleButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
    },
    roleButtonActive: {
        backgroundColor: '#2E7D32',
    },
    roleText: {
        color: '#666',
        fontWeight: 'bold',
    },
    roleTextActive: {
        color: '#fff',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#2E7D32',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    link: {
        color: '#2E7D32',
        fontWeight: 'bold',
    },
});
