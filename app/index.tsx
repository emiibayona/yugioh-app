import * as React from "react";
import {
  StyleSheet,
  Platform,
  View,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Text,
  Image,
} from "react-native";
import * as ImageManipulator from 'expo-image-manipulator';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { Redirect, useRouter } from "expo-router";
import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';
import useDatabase from "@/hooks/useDatabase";
import Overlay from "@/components/Overlay";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import BoundariesScreen from "@/components/BoundariesScreen";
import { useBoundaries } from "@/hooks/useBoundaries";
import ZoomSlider from "@/components/ZoomSlider";

export default function HomeScreen() {

  const { height, width, scale, fontScale } = useWindowDimensions();
  const { hasPermission } = useCameraPermission();
  const camera = React.useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { boundaries, getBoundaries, getCropOptions } = useBoundaries();

  const router = useRouter();
  const { addCardToScannedCollection, findCardByName, findImageByCardId } = useDatabase(useSQLiteContext());
  const [cardd, setCardd] = React.useState<any>(null);
  const [analyzing, setAnalyzing] = React.useState<boolean>(true);
  const [zoom, setZoom] = React.useState(device?.neutralZoom);
  const [lastCapturedUri, setLastCapturedUri] = useState(null);

  const redirectToPermissions = !hasPermission;


  const isLocked = React.useRef(false);

  const [nameComponentWidth, setNameComponentWidth] = React.useState(0);
  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    console.log("Info top ele here", event.nativeEvent);
    setNameComponentWidth(width);
  }

  // To improve.
  // Flow: take a picture, if fail? Keep scaning.
  // If not, add the card to the current scanned collection, 
  // show it on screen. remove it 
  // keep scanning.


  const analyzeCard = async (analyzing2: any) => {
    if (!analyzing) return;
    if (isLocked.current) return;
    isLocked.current = true;

    try {
      if (camera.current == null) throw new Error("Camera ref is null!");
      
      const photo = await camera.current?.takeSnapshot({ quality: 50 });
      if (!photo) throw new Error("Failed to take snapshot");

      const imageUri = "file://" + photo.path;
      const screenDim = { width, height };
      const photoDim = { width: photo.width, height: photo.height };

      const cropOptions = getCropOptions(photoDim, screenDim);
      if (!cropOptions) throw new Error("Failed to calculate crop options");

      console.log("Calculated crops:", cropOptions);

      // Crop name area
      const croppedNameImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [cropOptions.name],
        { format: ImageManipulator.SaveFormat.PNG }
      );

      const resultName = await TextRecognition.recognize(croppedNameImage.uri, TextRecognitionScript.LATIN);
      let recogText = (resultName?.blocks && resultName.blocks[0]?.text)?.toUpperCase();
      
      console.log("Name recognition result:", recogText);

      let cardFound = null;
      if (recogText) {
        cardFound = await findCardByName(recogText);
      }

      // If name fails, try effect area (sometimes it's more readable or contains unique info)
      if (!cardFound) {
        const croppedEffectImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [cropOptions.effect],
          { format: ImageManipulator.SaveFormat.PNG }
        );
        const resultEffect = await TextRecognition.recognize(croppedEffectImage.uri, TextRecognitionScript.LATIN);
        console.log("Effect recognition result (partial):", resultEffect?.blocks?.[0]?.text?.substring(0, 20));
        // You could potentially search by effect text if findCardByName fails, 
        // but typically name is the primary key.
      }

      if (cardFound) {
        if (cardFound?.cardId !== cardd?.cardId) {
          setCardd(cardFound);
        }
      }

    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setTimeout(() => {
        isLocked.current = false;
        if (analyzing) {
            analyzeCard(analyzing);
        }
      }, 500);
    }
  };

  if (redirectToPermissions) return <Redirect href={"/permissions"} />;
  if (!device) return <></>;

  useEffect(() => {
    if (analyzing) {
      analyzeCard(analyzing);
    }
  }, [analyzing]);


  return (
    <>
      <StatusBar barStyle={"light-content"} />
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 2, borderRadius: 10, overflow: "hidden", zIndex: 0 }}>
          <Camera
            ref={camera}
            style={{ flex: 1, }}
            photo={true}
            // zoom={1}
            zoom={zoom}
            device={device!}
            isActive={true}
            resizeMode="cover"
            preview={true}
            focusable={true}
          />
        </View>

        {/* Undercam */}
        <View style={styles.overlay}>
          {/* <Text style={{ color: "white" }}>Espacio para cositas</Text> */}
          {/* <TouchableHighlight onPress={() => setAnalyzing(!analyzing)} style={{ zIndex: 3 }}>
            {analyzing ? <Text>Pause</Text> : <Text>Start</Text>}
          </TouchableHighlight> */}
          {/* {cardd && <TouchableHighlight onPress={() => setCardd(null)} style={{ zIndex: 3 }}>
            <FontAwesome5 name="dot-circle" size={55} color={"white"} />
          </TouchableHighlight>} */}
          {/* {!cardd && <TouchableHighlight onPress={() => setCardd(null)}>
            <FontAwesome5 name="dot-circle" size={55} color={"white"} />
          </TouchableHighlight>} */}
          {/* <Text style={{ position: "absolute", left: 70, height: 'auto', top: 100, color: 'white', zIndex: 10 }}>RANDOM</Text */}
          {/* <ZoomSlider onUpdateZoom={setZoom} /> */}

          {lastCapturedUri && (
            <View style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 30 }}>
              <Image
                source={{ uri: lastCapturedUri }}
                style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
              />
            </View>
          )}
          <View style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%" }}>
            <BoundariesScreen showSample={true} onExternalLayout={handleLayout} onUpdateZoom={setZoom} />
            <Overlay card={cardd} />
          </View>
        </View>
      </SafeAreaView >
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    // borderColor: "red",
    // borderStyle: "solid",
    // borderWidth: 1,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  overlay: {
    // borderColor: "blue",
    // borderStyle: "solid",
    // borderWidth: 1,

    height: '100%',
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    // gap: 20,
    zIndex: 2,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  }
});
