import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { useSQLiteContext } from "expo-sqlite";
import useDatabase from "@/hooks/useDatabase";
import ScannerOverlay from "./ScannerOverlay";
import useScannerSession from "@/hooks/useScannerSession";
import { Ionicons } from "@expo/vector-icons";
import useCardImage from "@/hooks/useCardImage";

interface ScannerComponentProps {
  onCardDetected: (card: any) => void;
}

type ScanMode = "lightning" | "stopAndGo" | "pause";

export default function ScannerComponent({
  onCardDetected,
}: ScannerComponentProps) {
  const { width: screenWidth } = useWindowDimensions();
  const device = useCameraDevice("back");
  const camera = useRef<Camera>(null);
  const db = useSQLiteContext();
  const { findCardByNames, searchCards } = useDatabase(db);
  const {
    addCard,
    sessionCards,
    updateQuantity,
    removeCard,
    toggleFoil,
    clearSession,
  } = useScannerSession(db);
  const { getCardImageUrl } = useCardImage();

  const [zoom, setZoom] = useState(1.5);
  const [lastDetectedName, setLastDetectedName] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("stopAndGo");
  const [previousMode, setPreviousMode] = useState<ScanMode>("stopAndGo");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [recentDetection, setRecentDetection] = useState<any>(null);

  // Manual search states
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const analysisLock = useRef(false);

  const analyzeFrame = async () => {
    if (
      scanMode === "pause" ||
      analysisLock.current ||
      !camera.current ||
      showSessionModal
    )
      return;

    analysisLock.current = true;
    try {
      const photo = await camera.current.takeSnapshot({ quality: 80 });
      if (!photo) return;

      const imageUri = "file://" + photo.path;
      const result = await TextRecognition.recognize(
        imageUri,
        TextRecognitionScript.LATIN,
      );

      if (result && result.blocks) {
        const sortedBlocks = [...result.blocks].sort(
          (a, b) => (a.frame?.top || 0) - (b.frame?.top || 0),
        );

        const generalCandidates = sortedBlocks.map((b) => b.text.trim());

        const candidateNames = generalCandidates.filter(
          (t) => t.length >= 3 && t.length < 40,
        );
        console.log("______________INIT_________________");

        const descriptionCandidates = generalCandidates.filter(
          (t) => t.length >= 40,
        );

        if (candidateNames.length > 0 || descriptionCandidates.length > 0) {
          const cardFound = await findCardByNames(
            candidateNames,
            descriptionCandidates,
            true,
          );

          if (cardFound && cardFound.name !== lastDetectedName) {
            console.log("Detected:", cardFound.name);
            setLastDetectedName(cardFound.name);

            addCard(cardFound);
            setRecentDetection(cardFound);
            setTimeout(() => setRecentDetection(null), 2000);
            onCardDetected(cardFound);

            if (scanMode === "stopAndGo") {
              setScanMode("pause");
            } else {
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }
      }
    } catch (error) {
      console.log("Analysis error:", error);
    } finally {
      analysisLock.current = false;
    }
  };

  useEffect(() => {
    let interval: any;
    if (scanMode !== "pause" && !showSessionModal) {
      interval = setInterval(analyzeFrame, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [scanMode, lastDetectedName, showSessionModal]);

  const handleModeChange = (newMode: ScanMode) => {
    if (newMode === "pause") {
      if (scanMode !== "pause") {
        setPreviousMode(scanMode);
        setScanMode("pause");
      } else {
        setScanMode(previousMode);
      }
    } else {
      setScanMode(newMode);
      setPreviousMode(newMode);
      setLastDetectedName(null);
    }
  };

  const handleClearSession = () => {
    Alert.alert("Clear Session", "Are you sure you want to clear all cards?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", onPress: clearSession, style: "destructive" },
    ]);
  };

  const handleManualSearch = async (text: string) => {
    setSearchText(text);
    if (text.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCards(text, true);
      setSearchResults(results);
    } catch (e) {
      console.error("Manual search failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddManualCard = (card: any) => {
    addCard(card);
    setSearchText("");
    setSearchResults([]);
    setShowSearchInput(false);
    Alert.alert("Card added", `${card.name} added to session.`);
  };

  if (!device)
    return (
      <View style={styles.error}>
        <Text>No device found</Text>
      </View>
    );

  const totalScanned = sessionCards.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        zoom={zoom}
        video={true}
        resizeMode="cover"
      />

      <ScannerOverlay />

      <View style={styles.topControls}>
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeBtn,
              scanMode === "lightning" && styles.activeModeBtn,
            ]}
            onPress={() => handleModeChange("lightning")}
          >
            <Text
              style={[
                styles.modeBtnText,
                scanMode === "lightning" && styles.activeModeBtnText,
              ]}
            >
              LIGHTNING
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              scanMode === "stopAndGo" && styles.activeModeBtn,
            ]}
            onPress={() => handleModeChange("stopAndGo")}
          >
            <Text
              style={[
                styles.modeBtnText,
                scanMode === "stopAndGo" && styles.activeModeBtnText,
              ]}
            >
              STOP & GO
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeBtn,
              scanMode === "pause" && styles.pauseActiveBtn,
            ]}
            onPress={() => handleModeChange("pause")}
          >
            <Ionicons
              name={scanMode === "pause" ? "play" : "pause"}
              size={18}
              color={scanMode === "pause" ? "#FFF" : "#AAA"}
            />
            <Text
              style={[
                styles.modeBtnText,
                { marginLeft: 5 },
                scanMode === "pause" && styles.activeModeBtnText,
              ]}
            >
              PAUSE
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomControls}>
        {recentDetection && (
          <View style={styles.previewContainer}>
            <Image
              source={{
                uri: getCardImageUrl(recentDetection.name, recentDetection.id),
              }}
              style={styles.previewImage}
            />

            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {recentDetection.name}
              </Text>
              <Text style={styles.previewSubtitle}>Added to session</Text>
            </View>
          </View>
        )}

        <View style={styles.actionArea}>
          {scanMode === "pause" ? (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => handleModeChange("pause")}
            >
              <Text style={styles.resumeButtonText}>REANUDAR ESCANEO</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusBadge}>
              <ActivityIndicator
                size="small"
                color="#00FFCC"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.statusBadgeText}>
                {scanMode === "lightning"
                  ? "⚡ MODALIDAD RÁPIDA"
                  : "🔍 BUSCANDO CARTAS..."}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.sessionCounter}
            onPress={() => setShowSessionModal(true)}
          >
            <Ionicons
              name="layers-outline"
              size={20}
              color="#00FFCC"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.counterText}>{totalScanned} Cards</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>Scanned Cards</Text>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity
                  onPress={() => setShowSearchInput(!showSearchInput)}
                  style={styles.headerIconBtn}
                >
                  <Ionicons
                    name={showSearchInput ? "list" : "search"}
                    size={24}
                    color={showSearchInput ? "#00FFCC" : "#FFF"}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSessionModal(false)}
                  style={styles.headerIconBtn}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {showSearchInput && (
              <View style={styles.searchSection}>
                <View style={styles.searchInputWrapper}>
                  <Ionicons
                    name="search"
                    size={18}
                    color="#999"
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search card manually..."
                    placeholderTextColor="#999"
                    value={searchText}
                    onChangeText={handleManualSearch}
                    autoFocus
                  />
                  {isSearching && (
                    <ActivityIndicator size="small" color="#00FFCC" />
                  )}
                </View>

                {searchResults.length > 0 && (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => `search-${item.id}`}
                    style={styles.searchResultsList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchItem}
                        onPress={() => handleAddManualCard(item)}
                      >
                        <Image
                          source={{
                            uri: getCardImageUrl(item.name, item.id),
                          }}
                          style={styles.searchItemImage}
                        />
                        <Text style={styles.searchItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Ionicons name="add-circle" size={24} color="#00FFCC" />
                      </TouchableOpacity>
                    )}
                  />
                )}
                {searchText.length >= 3 &&
                  searchResults.length === 0 &&
                  !isSearching && (
                    <Text style={styles.noResultsText}>No cards found</Text>
                  )}
              </View>
            )}

            {!showSearchInput && (
              <FlatList
                data={sessionCards}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                  <View style={styles.cardItem}>
                    <Image
                      source={{
                        uri: getCardImageUrl(item.name, item.id),
                      }}
                      style={styles.cardItemImage}
                    />
                    <View style={styles.cardItemInfo}>
                      <Text style={styles.cardItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={styles.cardItemActions}>
                        <View style={styles.quantityControls}>
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            style={styles.qtyBtn}
                          >
                            <Ionicons
                              name="remove-circle-outline"
                              size={20}
                              color="#00FFCC"
                            />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            onPress={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            style={styles.qtyBtn}
                          >
                            <Ionicons
                              name="add-circle-outline"
                              size={20}
                              color="#00FFCC"
                            />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.foilBtn,
                            item.isFoil && styles.foilBtnActive,
                          ]}
                          onPress={() => toggleFoil(item.id)}
                        >
                          <Ionicons
                            name={item.isFoil ? "sparkles" : "sparkles-outline"}
                            size={16}
                            color={item.isFoil ? "#000" : "#00FFCC"}
                          />
                          <Text
                            style={[
                              styles.foilBtnText,
                              item.isFoil && styles.foilBtnTextActive,
                            ]}
                          >
                            FOIL
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeCard(item.id)}
                      style={styles.removeBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#FF5555"
                      />
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No cards scanned yet</Text>
                  </View>
                }
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.clearBtn]}
                onPress={handleClearSession}
              >
                <Text style={styles.footerBtnText}>Clear Session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.binderBtn]}
                onPress={() =>
                  Alert.alert("Coming soon", "Add to binders functionality")
                }
              >
                <Text style={styles.binderBtnText}>Add to Binders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    backgroundColor: "rgba(0,0,0,0.85)",
    flexDirection: "row",
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "#00FFCC",
    marginBottom: 15,
  },
  previewImage: {
    width: 35,
    height: 50,
    borderRadius: 4,
  },
  previewInfo: {
    marginLeft: 12,
    flex: 1,
  },
  previewTitle: {
    color: "#00FFCC",
    fontWeight: "bold",
    fontSize: 13,
  },
  previewSubtitle: {
    color: "#AAA",
    fontSize: 10,
  },
  topControls: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 5,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.4)",
    width: "90%",
    justifyContent: "space-between",
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  activeModeBtn: {
    backgroundColor: "#00FFCC",
  },
  pauseActiveBtn: {
    backgroundColor: "#FF5555",
  },
  modeBtnText: {
    color: "#AAA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  activeModeBtnText: {
    color: "#000",
  },
  bottomControls: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  sessionCounter: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#00FFCC",
    flexDirection: "row",
    alignItems: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionArea: {
    height: 50,
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
  },
  resumeButton: {
    backgroundColor: "#00FFCC",
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadgeText: {
    color: "#00FFCC",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#111",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: "80%",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,255,204,0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconBtn: {
    marginLeft: 15,
    padding: 5,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  searchSection: {
    flex: 1,
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
  },
  searchResultsList: {
    flex: 1,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  searchItemImage: {
    width: 30,
    height: 44,
    borderRadius: 3,
    marginRight: 15,
  },
  searchItemName: {
    flex: 1,
    color: "#FFF",
    fontSize: 14,
  },
  noResultsText: {
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  cardItemImage: {
    width: 40,
    height: 58,
    borderRadius: 4,
  },
  cardItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cardItemName: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardItemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    padding: 2,
  },
  qtyText: {
    color: "#FFF",
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: "bold",
  },
  foilBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 255, 204, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
  },
  foilBtnActive: {
    backgroundColor: "#00FFCC",
  },
  foilBtnText: {
    color: "#00FFCC",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 5,
  },
  foilBtnTextActive: {
    color: "#000",
  },
  removeBtn: {
    padding: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  footerBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  clearBtn: {
    backgroundColor: "#222",
    borderWidth: 1,
    borderColor: "#444",
  },
  binderBtn: {
    backgroundColor: "#00FFCC",
  },
  binderBtnText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 13,
  },
  footerBtnText: {
    fontWeight: "bold",
    fontSize: 13,
    color: "#FFF",
  },
});
