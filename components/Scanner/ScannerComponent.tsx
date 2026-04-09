import React, { useRef, useState, useEffect, useMemo } from "react";
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
  Platform,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
} from "react-native-vision-camera";
import { useIsFocused } from "@react-navigation/native";
import Slider from "@react-native-community/slider";
import TextRecognition, {
  TextRecognitionScript,
} from "@react-native-ml-kit/text-recognition";
import { useSQLiteContext } from "expo-sqlite";
import useDatabase from "@/hooks/useDatabase";
import ScannerOverlay from "./ScannerOverlay";
import useScannerSession from "@/hooks/useScannerSession";
import { Ionicons } from "@expo/vector-icons";
import useCardImage from "@/hooks/useCardImage";
import useBinders from "@/hooks/useBinders";
import { useTranslation } from "react-i18next";
import CardImage from "../ImageComponent";
import * as ImageManipulator from "expo-image-manipulator";

interface ScannerComponentProps {
  onCardDetected: (card: any) => void;
}

type ScanMode = "lightning" | "stopAndGo" | "pause";

export default function ScannerComponent({
  onCardDetected,
}: ScannerComponentProps) {
  const { width: screenWidth } = useWindowDimensions();
  const device = useCameraDevice("back");
  const isFocused = useIsFocused();
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1920, height: 1080 } },
    { fps: 30 },
  ]);

  const { t } = useTranslation();

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
  const {
    addCardsToBinder,
    createBinder,
    binders,
    loading: bindersLoading,
  } = useBinders();

  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(5);
  const [lastDetectedName, setLastDetectedName] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>("pause");
  const [previousMode, setPreviousMode] = useState<ScanMode>("stopAndGo");

  const [showSessionModal, setShowSessionModal] = useState(false);
  const [recentDetection, setRecentDetection] = useState<any>(null);

  // Manual search states
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Binder selection states
  const [showBinderSelector, setShowBinderSelector] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const analysisLock = useRef(false);

  useEffect(() => {
    if (device) {
      setMinZoom(device.minZoom);
      // Make it between 1 and 2 as requested. Some devices might have minZoom > 1.
      const targetMaxZoom = Math.max(device.minZoom, 2);
      setMaxZoom(targetMaxZoom);
      setZoom(Math.max(device.minZoom, 1.2));
    }
  }, [device]);

  const analyzeFrame = async () => {
    if (
      scanMode === "pause" ||
      analysisLock.current ||
      !camera.current ||
      showSessionModal ||
      showBinderSelector ||
      !isFocused
    )
      return;

    analysisLock.current = true;
    try {
      console.log(">>>> START", new Date().toLocaleTimeString());
      // Use lower quality for faster processing on Android
      const photo = await camera.current.takeSnapshot({ quality: 60 });
      if (!photo) return;
      console.log("Take snap", new Date().toLocaleTimeString());

      const imageUri = "file://" + photo.path;

      const imageManipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 800 } }], // Small enough for speed, large enough for accuracy
        {
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.7,
        },
      );
      console.log("Take imageManipulated", new Date().toLocaleTimeString());

      const result = await TextRecognition.recognize(
        imageManipulated?.uri || imageUri,
        TextRecognitionScript.LATIN,
      );
      console.log("Take recognition", new Date().toLocaleTimeString());

      console.log("🚀 ~ analyzeFrame ~ result.blocks:", result.blocks);
      if (result && result.blocks) {
        const sortedBlocks = [...result.blocks].sort(
          (a, b) => (a.frame?.top || 0) - (b.frame?.top || 0),
        );

        const generalCandidates = sortedBlocks.map((b) => b.text.trim());

        const candidateNames = generalCandidates.filter(
          (t) => t.length >= 3 && t.length < 40,
        );

        const descriptionCandidates = generalCandidates.filter(
          (t) => t.length >= 40,
        );

        if (candidateNames.length > 0 || descriptionCandidates.length > 0) {
          const cardFound = await findCardByNames(
            candidateNames,
            descriptionCandidates,
            true,
          );
          console.log("Take findCard", new Date().toLocaleTimeString());

          if (cardFound && cardFound.name !== lastDetectedName) {
            setLastDetectedName(cardFound.name);

            addCard(cardFound);
            setRecentDetection(cardFound);
            setTimeout(() => setRecentDetection(null), 2000);
            onCardDetected(cardFound);

            if (scanMode === "stopAndGo") {
              setScanMode("pause");
            } else {
              console.log(
                "Hittig here in lightning mode, waiting longer to avoid multiple detections",
              );
              // Wait longer in lightning mode between detections to avoid multiple registrations
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
      }
      console.log(
        "<<<< END ====================",
        new Date().toLocaleTimeString(),
      );
    } catch (error) {
      console.log("Analysis error:", error);
    } finally {
      analysisLock.current = false;
    }
  };

  useEffect(() => {
    let interval: any;
    if (
      scanMode !== "pause" &&
      !showSessionModal &&
      !showBinderSelector &&
      isFocused
    ) {
      console.log("Starting frame analysis with mode:", scanMode);
      interval = setInterval(analyzeFrame, 1500); // Increased interval for better performance
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    scanMode,
    lastDetectedName,
    showSessionModal,
    showBinderSelector,
    isFocused,
  ]);

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
    Alert.alert(
      t("scanner.session.clearSession"),
      t("scanner.session.clearSessionConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.clear"),
          onPress: clearSession,
          style: "destructive",
        },
      ],
    );
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
    Alert.alert(t("scanner.session.added"), `${card.name}`);
  };

  const handleOpenBinderSelector = async () => {
    if (sessionCards.length === 0) {
      Alert.alert(
        t("scanner.session.emptySession"),
        t("scanner.session.scanCards"),
      );
      return;
    }

    setShowSessionModal(false);

    // Smooth transition
    setTimeout(() => {
      setShowBinderSelector(true);
    }, 100);
  };

  const handleSyncToBinder = async (
    binderId: string,
    binderName: string,
    isFuse: boolean = false,
  ) => {
    setIsSyncing(true);
    // bitch
    try {
      const success = await addCardsToBinder(binderId, sessionCards);
      if (success) {
        Alert.alert(
          t("common.success"),
          sessionCards.length <= 1
            ? t("scanner.session.cardSynced", { binderName })
            : t("scanner.session.cardsSynced", {
                count: sessionCards.length,
                binderName,
              }),
        );
        await clearSession();
        setShowBinderSelector(false);
      } else {
        Alert.alert(t("common.error"), "Failed to sync cards to binder");
      }
    } catch (e) {
      Alert.alert(
        t("common.error"),
        "An unexpected error occurred during sync",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateAndSync = () => {
    Alert.prompt(
      t("binder.new"),
      t("binder.newMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.save"),
          onPress: async (name) => {
            if (!name) return;
            setIsSyncing(true);
            try {
              const newBinderId = await createBinder(name);
              if (newBinderId) {
                await handleSyncToBinder(newBinderId, name);
              } else {
                Alert.alert("Error", "Failed to create binder");
              }
            } catch (e) {
              Alert.alert("Error", "Failed to create binder");
            } finally {
              setIsSyncing(false);
            }
          },
        },
      ],
      "plain-text",
    );
  };

  const handleCloseBinderSelector = () => {
    setShowBinderSelector(false);
    setTimeout(() => setShowSessionModal(true), 100);
  };

  if (!device)
    return (
      <View style={styles.error}>
        <ActivityIndicator size="large" color="#00FFCC" />
        <Text style={{ color: "#FFF", marginTop: 10 }}>
          {t("scanner.loadingCamera")}
        </Text>
      </View>
    );

  const totalScanned = sessionCards.reduce(
    (acc, curr) => acc + curr.quantity,
    0,
  );

  return (
    <View style={styles.container}>
      {isFocused && (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isFocused}
          photo={true}
          zoom={zoom}
          format={format}
          video={true}
          resizeMode="cover"
          enableZoomGesture={true}
        />
      )}

      <ScannerOverlay />

      <View style={styles.zoomContainer}>
        <Ionicons name="add" size={14} color="#00FFCC" />
        <Slider
          style={styles.zoomSlider}
          minimumValue={minZoom}
          maximumValue={maxZoom}
          value={zoom}
          onValueChange={setZoom}
          minimumTrackTintColor="#00FFCC"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#00FFCC"
        />
        <Ionicons name="remove" size={14} color="#AAA" />
      </View>

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
              {t("scanner.modes.lightning")}
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
              {t("scanner.modes.stopAndGo")}
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
              {t("scanner.modes.pause")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomControls}>
        {recentDetection && (
          <View style={styles.previewContainer}>
            <CardImage
              name={recentDetection.name}
              cardId={recentDetection.cardId || recentDetection.id}
              style={styles.previewImage}
            />

            <View style={styles.previewInfo}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {recentDetection.name}
              </Text>
              <Text style={styles.previewSubtitle}>
                {t("scanner.session.added")}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.actionArea}>
          {scanMode === "pause" ? (
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={() => handleModeChange("pause")}
            >
              <Text style={styles.resumeButtonText}>
                {t("scanner.modes.resume")}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.statusBadge}>
              <ActivityIndicator
                size="small"
                color="#00FFCC"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.statusBadgeText}>
                {"🔍 " + t("scanner.modes.working")}
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
            <Text style={styles.counterText}>
              {totalScanned} {t("scanner.session.scanned")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowSessionModal(false);
          setShowSearchInput(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.headerLeft}>
                <Text style={styles.modalTitle}>
                  {showSearchInput
                    ? t("scanner.session.list.searching")
                    : t("scanner.session.list.title")}
                </Text>
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
                  onPress={() => {
                    setShowSessionModal(false);
                    setShowSearchInput(false);
                  }}
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
                    placeholder={t("scanner.manualSearchPlaceholder")}
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
                    keyExtractor={(item) => `search-${item.cardId || item.id}`}
                    style={styles.searchResultsList}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.searchItem}
                        onPress={() => handleAddManualCard(item)}
                      >
                        <CardImage
                          name={item.name}
                          cardId={item.cardId || item.id}
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
                    <Text style={styles.noResultsText}>
                      {t("scanner.session.list.notFound")}
                    </Text>
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
                    <CardImage
                      name={item.name}
                      cardId={item.id}
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
                            {t("card.treatment.foil")}
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
                    <Text style={styles.emptyText}>
                      {t("scanner.session.list.empty")}
                    </Text>
                  </View>
                }
              />
            )}

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerBtn, styles.clearBtn]}
                disabled={isSyncing || sessionCards.length === 0}
                onPress={handleClearSession}
              >
                <Text style={styles.footerBtnText}>
                  {t("scanner.session.clearSession")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerBtn, styles.binderBtn]}
                onPress={handleOpenBinderSelector}
                disabled={isSyncing || sessionCards.length === 0}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.binderBtnText}>
                    {t("scanner.session.addToBinder")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Binder Selector Modal */}
      <Modal
        visible={showBinderSelector}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseBinderSelector}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "60%" }]}>
            {/* Syncing Overlay - prevent interaction and show smooth spinner */}
            {isSyncing && (
              <View style={styles.syncingOverlay}>
                <ActivityIndicator size="large" color="#00FFCC" />
                <Text style={styles.syncingText}>{t("card.sync.syncing")}</Text>
              </View>
            )}

            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCloseBinderSelector}>
                <Ionicons name="arrow-back" size={24} color="#00FFCC" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{t("binder.select")}</Text>
              <TouchableOpacity onPress={() => setShowBinderSelector(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.newBinderBtn}
              onPress={handleCreateAndSync}
            >
              <Ionicons name="add-circle-outline" size={24} color="#00FFCC" />
              <Text style={styles.newBinderText}>{t("binder.newAndSync")}</Text>
            </TouchableOpacity>

            {bindersLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#00FFCC" />
              </View>
            ) : (
              <FlatList
                data={binders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.binderSelectItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.binderSelectName}>{item.name}</Text>
                      <Text style={styles.binderSelectCount}>
                        {t("card.nCards", {
                          number: item.Cards.reduce(
                            (sum, c) => sum + c.quantity,
                            0,
                          ),
                        })}
                      </Text>
                    </View>
                    <View style={styles.binderActionRow}>
                      <TouchableOpacity
                        style={styles.binderActionBtn}
                        onPress={() =>
                          handleSyncToBinder(item.id, item.name, false)
                        }
                      >
                        <Text style={styles.binderActionText}>
                          {t("binder.selectShort")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>{t("binder.notFound")}</Text>
                  </View>
                }
              />
            )}
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
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomContainer: {
    position: "absolute",
    right: 12,
    top: "40%",
    height: 150,
    width: 28,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "visible",
  },
  zoomSlider: {
    width: 100,
    height: 20,
    transform: [{ rotate: "-90deg" }],
  },
  previewContainer: {
    backgroundColor: "rgba(0,0,0,0.85)",
    flexDirection: "row",
    padding: 6,
    borderRadius: 8,
    alignItems: "center",
    width: "75%",
    borderWidth: 1,
    borderColor: "#00FFCC",
    marginBottom: 8,
  },
  previewImage: {
    width: 20,
    height: 30,
    borderRadius: 2,
  },
  previewInfo: {
    marginLeft: 8,
    flex: 1,
  },
  previewTitle: {
    color: "#00FFCC",
    fontWeight: "bold",
    fontSize: 10,
  },
  previewSubtitle: {
    color: "#AAA",
    fontSize: 8,
  },
  topControls: {
    position: "absolute",
    top: Platform.OS === "android" ? 30 : 50,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  modeSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.4)",
    width: "80%",
    justifyContent: "space-between",
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    borderRadius: 18,
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
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  activeModeBtnText: {
    color: "#000",
  },
  bottomControls: {
    position: "absolute",
    bottom: 2,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 8,
  },
  sessionCounter: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#00FFCC",
    flexDirection: "row",
    alignItems: "center",
  },
  counterText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  actionArea: {
    height: 35,
    justifyContent: "center",
    width: "100%",
    alignItems: "center",
    marginBottom: 2,
  },
  resumeButton: {
    backgroundColor: "#00FFCC",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: "#00FFCC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeButtonText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadgeText: {
    color: "#00FFCC",
    fontSize: 8,
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
  syncingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 25,
  },
  syncingText: {
    color: "#00FFCC",
    marginTop: 15,
    fontWeight: "bold",
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
  binderSelectItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 10,
  },
  binderSelectName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  binderSelectCount: {
    color: "#666",
    fontSize: 12,
    marginTop: 4,
  },
  binderActionRow: {
    flexDirection: "row",
    marginLeft: 10,
  },
  binderActionBtn: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  fuseActionBtn: {
    backgroundColor: "#00FFCC",
  },
  binderActionText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  newBinderBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(0, 255, 204, 0.1)",
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 204, 0.3)",
    justifyContent: "center",
  },
  newBinderText: {
    color: "#00FFCC",
    fontWeight: "bold",
    marginLeft: 10,
  },
});
