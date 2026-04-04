import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';

export default function ScannerOverlay() {
    const { width, height } = Dimensions.get('window');
    const scanLineAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const translateY = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [height * 0.25, height * 0.75],
    });

    return (
        <View style={styles.container} pointerEvents="none">
            {/* Corner Markers - Reduced height area */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />

            {/* Scanning Line */}
            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 5,
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: 'rgba(0, 255, 204, 0.4)',
        borderWidth: 2,
    },
    topLeft: {
        top: '20%',
        left: '10%',
        borderRightWidth: 0,
        borderBottomWidth: 0,
    },
    topRight: {
        top: '20%',
        right: '10%',
        borderLeftWidth: 0,
        borderBottomWidth: 0,
    },
    bottomLeft: {
        bottom: '20%',
        left: '10%',
        borderRightWidth: 0,
        borderTopWidth: 0,
    },
    bottomRight: {
        bottom: '20%',
        right: '10%',
        borderLeftWidth: 0,
        borderTopWidth: 0,
    },
    scanLine: {
        height: 1,
        backgroundColor: 'rgba(0, 255, 204, 0.6)',
        width: '90%',
        alignSelf: 'center',
        shadowColor: '#00FFCC',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
        elevation: 2,
        zIndex: 6,
    },
});
