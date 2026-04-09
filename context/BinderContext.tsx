import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useAuth } from "./AuthContext";
import { Config } from "@/constants/Config";

const API_BASE_URL = Config.API_URL;
const API_URL = `${API_BASE_URL}/binders`;

export interface Binder {
  id: string;
  name: string;
  cardCount: number;
  description?: string;
  lastUpdated: string;
  Cards: any[];
  updatedAt: Date;
  createdAt: Date;
}

interface BindersContextType {
  loading: boolean;
  binders: Binder[];
  userNumbers: { binders: number; cards: number };
  fetchBinders: (silent?: boolean) => Promise<Binder[]>;
  createBinder: (name: string, description?: string) => Promise<string | null>;
  updateBinder: (binderId: string, data: Partial<Binder>) => Promise<boolean>;
  deleteBinder: (binderId: string) => Promise<boolean>;
  fuseBinders: (
    sourceId: string,
    targetId: string,
    cards: any[],
  ) => Promise<boolean>;
  addCardsToBinder: (binderId: string, cards: any[]) => Promise<boolean>;
}

const BindersContext = createContext<BindersContextType | undefined>(undefined);

export function BindersProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [binders, setBinders] = useState<Binder[]>([]);
  const [userNumbers, setUserNumbers] = useState<{
    binders: number;
    cards: number;
  }>({ binders: 0, cards: 0 });
  const fetchBinders = useCallback(
    async (silent: boolean = false) => {
      if (!token || !user?.email) return [];
      if (!silent) setLoading(true);
      try {
        const response = await fetch(`${API_URL}/user/${user.email}/full`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to fetch binders");

        const data = await response.json();

        for (const element of data) {
          element.Cards = element.binder_cards.map((x: any) => ({
            ...x.Card,
            quantity: x.quantity,
            treatment: x.treatment,
            binderId: x.binderId,
          }));
          delete element.binder_cards;
        }

        setBinders(data);
        return data;
      } catch (error) {
        console.error("fetchBinders error:", error);
        return [];
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token, user?.email],
  );

  useEffect(() => {
    if (token && user?.email) {
      fetchBinders();
    }
  }, [token, user?.email, fetchBinders]);

  useEffect(() => {
    const data = { binders: binders?.length, cards: 0 };
    for (const binder of binders) {
      const totalCards = binder.Cards.reduce((sum, c) => sum + c.quantity, 0);
      data.cards += totalCards;
    }
    setUserNumbers(data);
  }, [binders]);
  const createBinder = async (name: string, description?: string) => {
    if (!token || !user?.email) return null;
    try {
      const response = await fetch(`${API_URL}/user/${user.email}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        const newBinder = await response.json();
        // Optimistic update or silent refresh
        await fetchBinders(true);
        return newBinder.id;
      }
      return null;
    } catch (error) {
      console.error("createBinder error:", error);
      return null;
    }
  };

  const updateBinder = async (binderId: string, data: Partial<Binder>) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/${binderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetchBinders(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("updateBinder error:", error);
      return false;
    }
  };

  const deleteBinder = async (binderId: string) => {
    if (!token) return false;

    // Optimistic update: remove immediately from UI
    const previousBinders = [...binders];
    setBinders((prev) => prev.filter((b) => b.id !== binderId));

    try {
      const response = await fetch(`${API_URL}/${binderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setBinders(previousBinders); // Rollback
        return false;
      }
      return true;
    } catch (error) {
      setBinders(previousBinders); // Rollback
      console.error("deleteBinder error:", error);
      return false;
    }
  };

  //
  const fuseBinders = async (
    sourceId: string,
    targetId: string,
    cards: any[],
  ) => {
    if (!token) return false;
    try {
      console.log(
        `🚀 ~ fuseBinders ~ { sourceId, targetId, cards }:`,
        JSON.stringify({ sourceId, targetId, cards }),
      );
      const response = await fetch(`${API_URL}/fuse/all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sourceId, targetId, cards }),
      });
      console.log("🚀 ~ fuseBinders ~ response:", await response.json());
      if (response.ok) {
        await fetchBinders(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("fuseBinders error:", error);
      return false;
    }
  };

  const addCardsToBinder = async (binderId: string, cards: any[]) => {
    if (!token) return false;
    try {
      const response = await fetch(`${API_URL}/${binderId}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cards }),
      });
      if (response.ok) {
        await fetchBinders(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error("addCardsToBinder error:", error);
      return false;
    }
  };

  return (
    <BindersContext.Provider
      value={{
        loading,
        binders,
        fetchBinders,
        createBinder,
        updateBinder,
        deleteBinder,
        fuseBinders,
        addCardsToBinder,
        userNumbers,
      }}
    >
      {children}
    </BindersContext.Provider>
  );
}

export function useBinders() {
  const context = useContext(BindersContext);
  if (!context) {
    throw new Error("useBinders must be used within a BindersProvider");
  }
  return context;
}
