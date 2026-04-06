import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SQLiteDatabase } from "expo-sqlite";

export interface ScannedCard {
  id: string;
  name: string;
  image?: string;
  quantity: number;
  timestamp: number;
  isFoil?: boolean;
}

const SESSION_STORAGE_KEY = "scanner_session_cards";

export default function useScannerSession(db?: SQLiteDatabase) {
  const [sessionCards, setSessionCards] = useState<ScannedCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const stored = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        setSessionCards(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load scanner session", e);
    } finally {
      setLoading(false);
    }
  };

  const saveSession = async (cards: ScannedCard[]) => {
    try {
      await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cards));
    } catch (e) {
      console.error("Failed to save scanner session", e);
    }
  };

  useEffect(() => {
    syncToCollection();
  }, [sessionCards]);

  const addCard = (card: any) => {
    setSessionCards((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === card.id);
      let newCards;
      if (existingIndex > -1) {
        newCards = [...prev];
        newCards[existingIndex].quantity += 1;
      } else {
        newCards = [
          {
            id: card.id,
            name: card.name,
            image: card.image,
            quantity: 1,
            timestamp: Date.now(),
            isFoil: false,
          },
          ...prev,
        ];
      }
      saveSession(newCards);
      return newCards;
    });
  };

  const removeCard = (id: string) => {
    setSessionCards((prev) => {
      const newCards = prev.filter((c) => c.id !== id);
      saveSession(newCards);
      return newCards;
    });
  };

  const toggleFoil = (id: string) => {
    setSessionCards((prev) => {
      const newCards = prev.map((c) =>
        c.id === id ? { ...c, isFoil: !c.isFoil } : c,
      );
      saveSession(newCards);
      return newCards;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeCard(id);
      return;
    }
    setSessionCards((prev) => {
      const newCards = prev.map((c) => (c.id === id ? { ...c, quantity } : c));
      saveSession(newCards);
      return newCards;
    });
  };

  const clearSession = async () => {
    setSessionCards([]);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const syncToCollection = async () => {
    if (!db) return { success: false, error: "Database not provided" };
    if (sessionCards?.length === 0) return { success: true, count: 0 };

    try {
      // Im going to upload to a sync api when the user clicks "sync", or when the user close the app, or when the user moved all the session to binder/deck/collection, whatever makes more sense
      // but for now let's just log the session data to see it working end-to-end
      console.log("Syncing session data to collection:", sessionCards);

      // 1. Ensure userCollection table exists
      // await db.execAsync(`
      //   CREATE TABLE IF NOT EXISTS userCollection (
      //     id TEXT PRIMARY KEY,
      //     quantity INTEGER DEFAULT 0,
      //     updatedAt INTEGER
      //   );
      // `);

      // // 2. Upsert each card from session
      // for (const card of sessionCards) {
      //   await db.runAsync(
      //     `INSERT INTO userCollection (id, quantity, updatedAt)
      //      VALUES (?, ?, ?)
      //      ON CONFLICT(id) DO UPDATE SET
      //      quantity = quantity + excluded.quantity,
      //      updatedAt = excluded.updatedAt`,
      //     [card.id, card.quantity, Date.now()],
      //   );
      // }

      const count = sessionCards.length;
      // await clearSession();
      return { success: true, count };
    } catch (e) {
      console.error("Failed to sync to collection", e);
      return { success: false, error: e };
    }
  };

  return {
    sessionCards,
    addCard,
    removeCard,
    toggleFoil,
    updateQuantity,
    clearSession,
    syncToCollection,
    loading,
  };
}
