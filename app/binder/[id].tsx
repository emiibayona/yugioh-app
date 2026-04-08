import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import useBinders, { Binder } from "@/hooks/useBinders";
import useCardImage from "@/hooks/useCardImage";

export default function BinderDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { binders } = useBinders();
  const { getCardImageUrl } = useCardImage();

  const binder = binders.find((b) => b.id === id);

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

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#00FFCC" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>{binder.name}</Text>
          <Text style={styles.subtitle}>{binder.cardCount} cards</Text>
        </View>
      </View>

      <FlatList
        data={binder.Cards}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          return (
            <View style={styles.cardItem}>
              <Image
                source={{ uri: getCardImageUrl(item.name, item.id, item) }}
                style={styles.cardImage}
              />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.qtyBadge}>
                    x{item.quantity}
                  </Text>
                  {item.treatment === "foil" && (
                    <View style={styles.foilBadge}>
                      <Ionicons name="sparkles" size={10} color="#000" />
                      <Text style={styles.foilText}>FOIL</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="copy-outline" size={64} color="#222" />
            <Text style={styles.emptyText}>This binder is empty</Text>
          </View>
        }
      />
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
