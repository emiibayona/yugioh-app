import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useBinders, { Binder } from "@/hooks/useBinders";
import { useRouter } from "expo-router";

export default function CollectionScreen() {
  const {
    fetchBinders,
    createBinder,
    updateBinder,
    deleteBinder,
    fuseBinders,
    binders,
    loading,
  } = useBinders();
  const router = useRouter();
  const [refreshing, setRefreshRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBinder, setEditingBinder] = useState<Binder | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Fuse states
  const [fuseMode, setFuseMode] = useState(false);
  const [selectedForFuse, setSelectedForFuse] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    await fetchBinders();
  }, [fetchBinders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshRefreshing(true);
    await loadData();
    setRefreshRefreshing(false);
  };

  const handleSave = async () => {
    if (!name) return;

    let success: any = false;
    if (editingBinder) {
      success = await updateBinder(editingBinder.id, { name, description });
    } else {
      success = await createBinder(name, description);
    }

    if (success) {
      setModalVisible(false);
      resetForm();
      loadData();
    } else {
      Alert.alert("Error", "Failed to save binder");
    }
  };

  const resetForm = () => {
    setEditingBinder(null);
    setName("");
    setDescription("");
  };

  const handleEdit = (binder: Binder) => {
    setEditingBinder(binder);
    setName(binder.name);
    setDescription(binder.description || "");
    setModalVisible(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Binder", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (await deleteBinder(id)) loadData();
        },
      },
    ]);
  };

  const handleSelectForFuse = (id: string) => {
    if (selectedForFuse.includes(id)) {
      setSelectedForFuse((prev) => prev.filter((i) => i !== id));
    } else if (selectedForFuse.length < 2) {
      setSelectedForFuse((prev) => [...prev, id]);
    }
  };

  const executeFuse = async () => {
    if (selectedForFuse.length !== 2) return;

    Alert.alert(
      "Fuse Binders",
      "This will merge all cards into the second binder and delete the first one. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fuse",
          onPress: async () => {
            const success = await fuseBinders(
              selectedForFuse[0],
              selectedForFuse[1],
              binders.find((x) => x.id === selectedForFuse[0])?.Cards || [],
            );
            console.log("🚀 ~ executeFuse ~ success:", success)
            if (success) {
              setFuseMode(false);
              setSelectedForFuse([]);
              loadData();
            } else {
              Alert.alert("Error", "Fuse failed");
            }
          },
        },
      ],
    );
  };

  const renderBinderItem = ({ item }: { item: Binder }) => {
    const isSelected = selectedForFuse.includes(item.id);

    const cardsAmount = item.Cards.reduce((sum, c) => sum + c.quantity, 0);
    return (
      <TouchableOpacity
        style={[styles.binderCard, isSelected && styles.selectedCard]}
        onPress={() =>
          fuseMode
            ? handleSelectForFuse(item.id)
            : router.push(`/binder/${item.id}`)
        }
        onLongPress={() => handleEdit(item)}
      >
        <View style={styles.binderIconContainer}>
          <Ionicons
            name="book"
            size={32}
            color={isSelected ? "#000" : "#00FFCC"}
          />
        </View>
        <View style={styles.binderInfo}>
          <Text style={[styles.binderName, isSelected && styles.selectedText]}>
            {item.name}
          </Text>
          <Text
            style={[styles.binderDetails, isSelected && styles.selectedText]}
          >
            {cardsAmount} cards • Updated{" "}
            {new Date(item.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        {!fuseMode && (
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={styles.actionBtn}
          >
            <Ionicons name="trash-outline" size={20} color="#FF5555" />
          </TouchableOpacity>
        )}
        {fuseMode && isSelected && (
          <Text style={styles.fuseOrder}>
            {selectedForFuse.indexOf(item.id) === 0 ? "SOURCE" : "TARGET"}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Colección</Text>
          <Text style={styles.subtitle}>{binders.length} Binders</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerBtn, fuseMode && styles.activeHeaderBtn]}
            onPress={() => {
              setFuseMode(!fuseMode);
              setSelectedForFuse([]);
            }}
          >
            <Ionicons
              name="arrow-redo"
              size={22}
              color={fuseMode ? "#000" : "#00FFCC"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {fuseMode && (
        <View style={styles.fuseBar}>
          <Text style={styles.fuseText}>Select two binders to merge</Text>
          <TouchableOpacity
            style={[
              styles.executeFuseBtn,
              selectedForFuse.length !== 2 && styles.disabledBtn,
            ]}
            disabled={selectedForFuse.length !== 2}
            onPress={executeFuse}
          >
            <Text style={styles.executeFuseText}>Execute Fuse</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={binders}
        keyExtractor={(item) => item.id}
        renderItem={renderBinderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00FFCC"
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.center}>
              <Ionicons name="albums-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>No binders found</Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => setModalVisible(true)}
              >
                <Text style={styles.createFirstText}>
                  Create your first binder
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00FFCC" />
        </View>
      )}

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingBinder ? "Edit Binder" : "New Binder"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Binder Name"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (Optional)"
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Binder</Text>
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
    backgroundColor: "#000",
    paddingTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#00FFCC",
  },
  activeHeaderBtn: {
    backgroundColor: "#00FFCC",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
  },
  addBtn: {
    backgroundColor: "#00FFCC",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  fuseBar: {
    backgroundColor: "#111",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  fuseText: {
    color: "#FFF",
    fontSize: 12,
    flex: 1,
  },
  executeFuseBtn: {
    backgroundColor: "#00FFCC",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  executeFuseText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 12,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: "#333",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  binderCard: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  selectedCard: {
    backgroundColor: "#00FFCC",
    borderColor: "#00FFCC",
  },
  binderIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(0, 255, 204, 0.1)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  binderInfo: {
    flex: 1,
  },
  binderName: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectedText: {
    color: "#000",
  },
  binderDetails: {
    color: "#AAA",
    fontSize: 12,
  },
  actionBtn: {
    padding: 10,
  },
  fuseOrder: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 4,
    borderRadius: 4,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 10,
  },
  createFirstBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#00FFCC",
  },
  createFirstText: {
    color: "#00FFCC",
    fontWeight: "bold",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#000",
    borderRadius: 10,
    color: "#FFF",
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  cancelBtn: {
    padding: 15,
    marginRight: 10,
  },
  cancelBtnText: {
    color: "#AAA",
    fontWeight: "bold",
  },
  saveBtn: {
    backgroundColor: "#00FFCC",
    borderRadius: 10,
    paddingHorizontal: 25,
    paddingVertical: 15,
  },
  saveBtnText: {
    color: "#000",
    fontWeight: "bold",
  },
});
