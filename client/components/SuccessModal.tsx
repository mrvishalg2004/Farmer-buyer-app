import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withDelay } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface Props {
    visible: boolean;
    onFinish: () => void;
}

export default function SuccessModal({ visible, onFinish }: Props) {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        if (visible) {
            scale.value = withSequence(
                withSpring(1.2),
                withSpring(1)
            );
            opacity.value = withSpring(1);

            // Auto close after 2 seconds
            const timer = setTimeout(() => {
                onFinish();
            }, 2500);
            return () => clearTimeout(timer);
        } else {
            scale.value = 0;
            opacity.value = 0;
        }
    }, [visible]);

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Animated.View style={[styles.iconContainer, animatedStyle]}>
                        <Ionicons name="checkmark-circle" size={80} color="#2E7D32" />
                    </Animated.View>
                    <Text style={styles.title}>Payment Successful!</Text>
                    <Text style={styles.subtitle}>Your order has been placed.</Text>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        alignItems: 'center',
        elevation: 5,
        width: '80%',
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    }
});
