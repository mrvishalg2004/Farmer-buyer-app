import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Colors, Shadows } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { API_URL } from '@/constants/config';
import LanguageSelector from '@/components/LanguageSelector';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handlePasswordUpdate = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert(t('common.error'), t('profileSettings.fillFields'));
            return;
        }

        setLoading(true);
        try {
            await axios.put(`${API_URL}/auth/password`, {
                currentPassword,
                newPassword
            });
            Alert.alert(t('common.success'), t('profileSettings.passwordUpdated'));
            setCurrentPassword('');
            setNewPassword('');
        } catch (error: any) {
            const message = error.response?.data?.message || t('profileSettings.passwordsMismatch');
            Alert.alert(t('common.error'), message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={[Colors.light.tint, Colors.light.text]}
                style={styles.headerBackground}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View entering={FadeInDown.duration(800)} style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <MaterialCommunityIcons name="account" size={60} color={Colors.light.tint} />
                    </View>
                    <Text style={styles.userName}>{user?.name}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                </Animated.View>
            </LinearGradient>

            <Animated.View entering={FadeInUp.delay(200).duration(800)} style={styles.content}>

                {/* Language Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="web" size={24} color={Colors.light.tint} style={{ marginRight: 10 }} />
                        <Text style={styles.sectionTitle}>{t('language.title')}</Text>
                    </View>
                    <View style={styles.card}>
                        <LanguageSelector />
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <MaterialCommunityIcons name="shield-lock" size={24} color={Colors.light.tint} style={{ marginRight: 10 }} />
                        <Text style={styles.sectionTitle}>{t('profileSettings.security')}</Text>
                    </View>
                    <View style={styles.card}>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('profileSettings.currentPassword')}
                                placeholderTextColor="#999"
                                secureTextEntry={!showCurrentPassword}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                            />
                            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={{ padding: 10, marginRight: -5 }}>
                                <MaterialCommunityIcons name={showCurrentPassword ? "eye-off" : "eye"} size={22} color={Colors.light.tint} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.inputContainer}>
                            <MaterialCommunityIcons name="lock-plus" size={20} color={Colors.light.tint} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder={t('profileSettings.newPassword')}
                                placeholderTextColor="#999"
                                secureTextEntry={!showNewPassword}
                                value={newPassword}
                                onChangeText={setNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={{ padding: 10, marginRight: -5 }}>
                                <MaterialCommunityIcons name={showNewPassword ? "eye-off" : "eye"} size={22} color={Colors.light.tint} />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={[styles.submitBtn, loading && styles.disabledBtn]}
                            onPress={handlePasswordUpdate}
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
                                    <Text style={styles.submitText}>{t('profileSettings.updatePassword')}</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <MaterialCommunityIcons name="logout" size={22} color="#D32F2F" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

            </Animated.View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    scrollContent: {
        paddingBottom: 100, // Account for bottom tabs
    },
    headerBackground: {
        width: '100%',
        paddingTop: 80,
        paddingBottom: 40,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        alignItems: 'center',
        ...Shadows.medium,
    },
    headerContent: {
        alignItems: 'center',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        ...Shadows.medium,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    userName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    userEmail: {
        fontSize: 14,
        color: '#E8F5E9',
        opacity: 0.9,
    },
    content: {
        padding: 20,
        marginTop: 10,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingLeft: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.light.text,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        ...Shadows.medium,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 55,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: Colors.light.text,
        fontWeight: '500',
    },
    submitBtn: {
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 5,
        ...Shadows.medium,
    },
    btnGradient: {
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledBtn: {
        opacity: 0.7,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: '#FFEBEE',
        borderRadius: 15,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    logoutText: {
        color: '#D32F2F',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
