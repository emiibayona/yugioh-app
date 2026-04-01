import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

export default function ZoomSlider({ onUpdateZoom }: any) {
    const [value, setValue] = useState(0);
    useEffect(() => { onUpdateZoom(value); }, [value]);
    return (
        <View style={styles.container}>
            {/* <Text style={styles.label}>Zoom: {value.toFixed(1)}x</Text> */}
            <Slider
                style={styles.slider}
                minimumValue={1.5}
                maximumValue={5}
                value={value}
                onValueChange={setValue}
                step={0.1}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        zIndex: 3,
        borderStyle: 'solid',
        borderColor: 'orange',
        borderWidth: 2,
        width: 100
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
    slider: {
        height: 40,
    },
});