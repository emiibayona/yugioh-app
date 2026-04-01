import { StyleSheet, Text, View } from "react-native";

export default function ScannerCollectionActions() {
    return (
        <View style={styles.wrapper}>

            <View style={styles.iconsWrapper}><Text style={styles.icons}>A</Text></View>
            <View style={styles.iconsWrapper}><Text style={styles.icons}>B</Text></View>
            <View style={styles.iconsWrapper}><Text style={styles.icons}>C</Text></View>
        </View>
    )
}


const styles = StyleSheet.create({
    wrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        height: 'auto',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 25,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
    },
    iconsWrapper: {
        height: 30,
        width: 30,
        borderRadius: 5,
        backgroundColor: 'lightgray',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    icons: {
        fontSize: 8,
    }
})