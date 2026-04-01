import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

const CardSample = ({ onLayout }: any) => {

    return (<View style={styles.wrapper}>
        <View style={styles.top} onLayout={onLayout}>
            <View style={styles.name}>
            </View>
            <View style={styles.icon}>
            </View>
        </View>
        <View style={styles.bottom}>
            <View style={styles.textBox}>
            </View>
        </View>
    </View>)
}


const styles = StyleSheet.create({
    wrapper: {
        width: '100%',
        height: '100%',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    top: {
        position: 'relative',
        height: 30,
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'center'

    },
    name: {
        borderStyle: 'solid',
        borderColor: 'yellow',
        borderWidth: 2,
        width: '82%',
        height: '100%'
    },
    icon: {
        borderStyle: 'solid',
        borderColor: 'orange',
        borderWidth: 2,
        borderRadius: 50,
        height: "100%",
        width: 30,
    },
    bottom: {
        position: 'relative',
        height: 100,
        width: "100%",
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        alignContent: 'center',
    },
    textBox: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: 'red',
        height: "100%",
        width: "100%"
    }
});

export default CardSample;