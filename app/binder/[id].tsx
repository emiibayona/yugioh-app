import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useBinders, { Binder } from "@/hooks/useBinders";
import useCardImage from "@/hooks/useCardImage";
import CardImage from "@/components/ImageComponent";

export default function BinderDetailScreen() {
  const { id } = useLocalSearchParams();
  const binderId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { binders, updateAllCardsBinder } = useBinders();

  const binder = useMemo(() => binders.find((b) => b.id === binderId), [binders, binderId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editableCards, setEditableCards] = useState<any[]>([]);
  const [initialCards, setInitialCards] = useState<any[]>([]);
  const [previewCard, setPreviewCard] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (binder && !isEditing) {
      setEditableCards(binder.Cards);
    }
  }, [binder, isEditing]);

  const hasChanges = useMemo(() => {
    if (!isEditing) return false;
    if (editableCards.length !== initialCards.length) return true;
    
    return editableCards.some((card, index) => {
      const initial = initialCards[index];
      return (
        card.id !== initial.id ||
        card.quantity !== initial.quantity ||
        card.treatment !== initial.treatment
      );
    });
  }, [isEditing, editableCards, initialCards]);

  if (!binder) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Binder not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleToggleEdit = () => {
    if (isEditing) {
      // Cancel
      setEditableCards(binder.Cards);
      setIsEditing(false);
    } else {
      const cardsClone = JSON.parse(JSON.stringify(binder.Cards));
      setEditableCards(cardsClone);
      setInitialCards(cardsClone);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const success = await updateAllCardsBinder(binderId, editableCards);
      if (success) {
        setIsEditing(false);
      } else {
        Alert.alert("Error", "Failed to update binder");
      }
    } catch (error) {
      console.error("Save error:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...editableCards];
    const newQty = Math.max(0, updated[index].quantity + delta);
    if (newQty === 0) {
      updated.splice(index, 1);
    } else {
      updated[index] = { ...updated[index], quantity: newQty };
    }
    setEditableCards(updated);
  };

  const toggleFoil = (index: number) => {
    const updated = [...editableCards];
    updated[index] = {
      ...updated[index],
      treatment: updated[index].treatment === "foil" ? "" : "foil",
    };
    setEditableCards(updated);
  };

  const removeCard = (index: number) => {
    const updated = [...editableCards];
    updated.splice(index, 1);
    setEditableCards(updated);
  };

  const cardsToDisplay = isEditing ? editableCards : binder.Cards;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#00FFCC" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{binder.name}</Text>
          <Text style={styles.subtitle}>
            {isEditing ? editableCards.length : binder.cardCount} cards
          </Text>
        </View>

        {isEditing ? (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleToggleEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
              disabled={isSaving || !hasChanges}
            >
              <Text style={[styles.saveText, !hasChanges && styles.saveTextDisabled]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={handleToggleEdit} style={styles.editBtn}>
            <Ionicons name="create-outline" size={24} color="#00FFCC" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={cardsToDisplay}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={isEditing ? undefined : () => setPreviewCard(item)}
              onLongPress={isEditing ? () => setPreviewCard(item) : undefined}
              style={styles.cardItem}
            >
              <CardImage
                name={item.name}
                cardId={item.id}
                style={styles.cardImage}
                item={item}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardMeta}>
                  {isEditing ? (
                    <View style={styles.editControls}>
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          onPress={() => updateQuantity(index, -1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={16} color="#00FFCC" />
                        </TouchableOpacity>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <TouchableOpacity
                          onPress={() => updateQuantity(index, 1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="add" size={16} color="#00FFCC" />
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => toggleFoil(index)}
                        style={[
                          styles.foilToggle,
                          item.treatment === "foil" && styles.foilActive,
                        ]}
                      >
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color={item.treatment === "foil" ? "#000" : "#00FFCC"}
                        />
                        <Text
                          style={[
                            styles.foilToggleText,
                            item.treatment === "foil" && styles.foilActiveText,
                          ]}
                        >
                          FOIL
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => removeCard(index)}
                        style={styles.removeBtn}
                      >
                        <Ionicons name="trash-outline" size={20} color="#FF5555" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.qtyBadge}>x{item.quantity}</Text>
                      {item.treatment === "foil" && (
                        <View style={styles.foilBadge}>
                          <Ionicons name="sparkles" size={10} color="#000" />
                          <Text style={styles.foilText}>FOIL</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="copy-outline" size={64} color="#222" />
            <Text style={styles.emptyText}>This binder is empty</Text>
          </View>
        }
      />

      <Modal
        visible={!!previewCard}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewCard(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPreviewCard(null)}
        >
          <View style={styles.modalContent}>
            {previewCard && (
              <>
                <CardImage
                  name={previewCard.name}
                  cardId={previewCard.id}
                  style={styles.fullCardImage}
                  item={previewCard}
                />
                <Text style={styles.previewName}>{previewCard.name}</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#00FFCC" />
          <Text style={styles.savingText}>Saving changes...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: {
    padding: 5,
    marginRight: 15,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  editBtn: {
    padding: 8,
  },
  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  cancelBtn: {
    marginRight: 15,
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: "#00FFCC",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#333",
  },
  saveText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  saveTextDisabled: {
    color: "#444",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  cardItem: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  cardImage: {
    width: 40,
    height: 58,
    borderRadius: 4,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 15,
  },
  cardName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBadge: {
    color: "#00FFCC",
    fontSize: 12,
    fontWeight: "bold",
    marginRight: 10,
  },
  foilBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00FFCC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  foilText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "black",
    marginLeft: 3,
  },
  editControls: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "space-between",
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    padding: 5,
  },
  qtyValue: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: "center",
  },
  foilToggle: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00FFCC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  foilActive: {
    backgroundColor: "#00FFCC",
  },
  foilToggleText: {
    color: "#00FFCC",
    fontSize: 10,
    fontWeight: "bold",
    marginLeft: 4,
  },
  foilActiveText: {
    color: "#000",
  },
  removeBtn: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    alignItems: "center",
    width: "100%",
  },
  fullCardImage: {
    width: 300,
    height: 435,
    borderRadius: 12,
  },
  previewName: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  savingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  savingText: {
    color: "#00FFCC",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#FF5555",
    fontSize: 18,
    marginBottom: 10,
  },
  backLink: {
    color: "#00FFCC",
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#333",
    fontSize: 18,
    marginTop: 15,
  },
});

