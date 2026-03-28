import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Shadows } from '@/constants/theme';

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function LanguageSelector() {
    const { i18n } = useTranslation();
    const [modalVisible, setModalVisible] = useState(false);

    const activeLanguage = LANGUAGES.find(lang => lang.code === i18n.language) || LANGUAGES[0];

    const changeLanguage = (langCode: string) => {
        i18n.changeLanguage(langCode);
        setModalVisible(false);
    };

    return (
        <View>
            <TouchableOpacity
                style={styles.selectorBtn}
                onPress={() => setModalVisible(true)}
            >
                <MaterialCommunityIcons name="translate" size={20} color={Colors.light.tint} />
                <Text style={styles.selectorText}>{activeLanguage.label}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.light.tint} />
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={[styles.modalContent, Shadows.medium]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Language</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialCommunityIcons name="close" size={24} color={Colors.light.text} />
                            </TouchableOpacity>
                        </View>

                        {LANGUAGES.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageOption,
                                    i18n.language === lang.code && styles.languageOptionActive
                                ]}
                                onPress={() => changeLanguage(lang.code)}
                            >
                                <Text style={[
                                    styles.languageText,
                                    i18n.language === lang.code && styles.languageTextActive
                                ]}>
                                    {lang.label}
                                </Text>
                                {i18n.language === lang.code && (
                                    <MaterialCommunityIcons name="check-circle" size={20} color={Colors.light.tint} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    selectorBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#EAEAEA',
    },
    selectorText: {
        color: Colors.light.text,
        fontWeight: '600',
        fontSize: 16,
        flex: 1,
        marginLeft: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxWidth: 320,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.light.text,
    },
    languageOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
    },
    languageOptionActive: {
        backgroundColor: '#E8F5E9',
        borderWidth: 1,
        borderColor: 'rgba(46, 125, 50, 0.2)',
    },
    languageText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.light.text,
    },
    languageTextActive: {
        color: Colors.light.tint,
        fontWeight: '800',
    },
});
