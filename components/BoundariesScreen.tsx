import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useBoundaries } from '@/hooks/useBoundaries';
import CardSample from './CardSample';
import ZoomSlider from './ZoomSlider';

interface BoundariesScreenProps {
    showSample: boolean,
    onExternalLayout: (event: any) => void
    onUpdateZoom: (zoom: number) => void
}

export default function BoundariesScreen({ showSample, onExternalLayout, onUpdateZoom }: BoundariesScreenProps) {

    const { boundaries } = useBoundaries();
    const [showBoundaries, setShowBoundaries] = useState(true);

    const styles = StyleSheet.create({
        container: {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: showBoundaries ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0,0,0,0)',
            borderColor: 'white',
            borderStyle: 'solid',
            borderBottomWidth: showBoundaries ? boundaries.height : 0,
            borderTopWidth: showBoundaries ? boundaries.height : 0,
            borderLeftWidth: showBoundaries ? boundaries.width : 0,
            borderRightWidth: showBoundaries ? boundaries.width : 0,
        },
        text: {
            fontSize: 18,
            fontWeight: 'bold',
        },
        cross: {
            position: "absolute",
            top: showBoundaries ? -boundaries.height + 10 : 10,
            left: showBoundaries ? -boundaries.width + 15 : 15,
            fontSize: 18,
            fontWeight: 'bold'
        }
    });

    return (
        <View style={styles.container}>
            {/* Center it and show it with instructions */}
            <ZoomSlider onUpdateZoom={onUpdateZoom} />
            {/* <View style={styles.container}></View> */}
            <Text style={styles.cross} onPress={() => setShowBoundaries(!showBoundaries)}>{showBoundaries ? 'Quitar reglas' : 'Mostrar reglas'}</Text>
            {showSample && showBoundaries && <CardSample onLayout={onExternalLayout} />}
        </View >
    );


}

