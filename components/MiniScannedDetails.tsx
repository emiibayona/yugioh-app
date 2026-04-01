import React, { ComponentProps } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";


interface MiniScannedDetailsProps {
    card: { name: string; card: string } | null;
    onPress?: () => void;
}

export default function MiniScannedDetails({ card, onPress }: MiniScannedDetailsProps) {


    return (
        <View style={styles.wrapper}>
            <View style={styles.container}>
                <View style={styles.cardContainer}>
                    <View style={styles.cardImageContainer}>
                        <Image src={card?.card} style={styles.cardImage} />
                    </View>
                    <View>
                        <Text style={styles.cardName}>{card?.name}</Text>
                    </View>
                    <View><Text style={styles.cardName}>{'>'}</Text></View>
                </View>
            </View >
            <View style={styles.actionsContainer}>
                <Pressable>{({ pressed }) => (<Text style={[styles.cardName, pressed && styles.cardNamePressed]}>{'Normal'}</Text>)}</Pressable>
                <Pressable>{({ pressed }) => (<Text style={[styles.cardName, pressed && styles.cardNamePressed]}>{'Expansion'}</Text>)}</Pressable>
                <Pressable>{({ pressed }) => (<Text style={[styles.cardName, pressed && styles.cardNamePressed]}>{'EN'}</Text>)}</Pressable>
                <Pressable>
                    {({ pressed }) => (<Text style={[styles.cardName, pressed && styles.cardNamePressed]}>{'+1'}</Text>)}
                </Pressable>
            </View>
        </View >
    )
}

const styles = StyleSheet.create({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'auto',
        width: '100%',
    },
    container: {
        width: '95%',
        height: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        alignItems: 'center',
    },
    cardContainer: {
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardImageContainer: {
        height: '100%',
        minWidth: '25%',
    },
    cardImage: {
        width: 'auto',
        minHeight: '100%',
        borderRadius: 10,
        resizeMode: 'contain',
    },
    cardName: {
        color: 'white',
        fontSize: 16,
        padding: 5,
        borderRadius: 5,
    },
    cardNamePressed: {
        color: 'gray',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 5,
        padding: 5
    },
    actionsContainer: {
        // borderColor: 'yellow',
        // borderStyle: 'solid',
        // borderWidth: 1,

        height: 50,
        width: '85%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderRadius: 25,
        fontWeight: '600',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        marginTop: 5,
    }
});