import { StyleSheet, View } from "react-native";
import MiniScannedDetails from "./MiniScannedDetails";
import ScannerCollectionActions from './ScannerCollectionActions';

interface OverlayProps {
    card: { name: string; card: string } | null;
}
export default function Overlay({ card }: OverlayProps) {

    console.log("Card in Overlay:", card);
    return (
        <View style={styles.wrapper} pointerEvents="box-none">
            {card && <View style={styles.miniScanned}><MiniScannedDetails card={card} /></View>}
            <View style={styles.collectionActions}>
                <ScannerCollectionActions />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        // borderColor: 'green',
        // borderStyle: 'solid',
        // borderWidth: 1,
    },
    miniScanned: {
        // borderColor: 'yellow',
        // borderStyle: 'solid',
        // borderWidth: 1,

        width: '100%',
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
    },
    collectionActions: {
        position: 'absolute',
        top: 10,
        right: 10,
        // borderColor: 'purple',
        // borderStyle: 'solid',
        // borderWidth: 1,
    }
})