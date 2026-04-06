import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Binder {
  id: string;
  name: string;
  cardCount: number;
  lastUpdated: string;
}

export default function CollectionScreen() {
  const [binders, setBinders] = useState<Binder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking API fetch
    const fetchBinders = async () => {
      setLoading(true);
      try {
        // In the future: const response = await fetch('YOUR_EXTERNAL_API/binders');
        // const data = await response.json();
        
        // Mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockData: Binder[] = [
          { id: '1', name: 'Main Collection', cardCount: 150, lastUpdated: '2024-03-20' },
          { id: '2', name: 'Trade Binder', cardCount: 45, lastUpdated: '2024-03-25' },
          { id: '3', name: 'Rare Spells', cardCount: 12, lastUpdated: '2024-04-01' },
        ];
        setBinders(mockData);
      } catch (error) {
        console.error("Error fetching binders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBinders();
  }, []);

  const renderBinderItem = ({ item }: { item: Binder }) => (
    <TouchableOpacity style={styles.binderCard}>
      <View style={styles.binderIconContainer}>
        <Ionicons name="book" size={32} color="#00FFCC" />
      </View>
      <View style={styles.binderInfo}>
        <Text style={styles.binderName}>{item.name}</Text>
        <Text style={styles.binderDetails}>{item.cardCount} cards • Updated {item.lastUpdated}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Binders</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#00FFCC" />
        </View>
      ) : (
        <FlatList
          data={binders}
          keyExtractor={(item) => item.id}
          renderItem={renderBinderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No binders found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  addBtn: {
    backgroundColor: '#00FFCC',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: 20,
  },
  binderCard: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  binderIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 255, 204, 0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  binderInfo: {
    flex: 1,
  },
  binderName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  binderDetails: {
    color: '#AAA',
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});
