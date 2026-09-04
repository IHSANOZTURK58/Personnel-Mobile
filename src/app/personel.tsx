import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PersonelScreen() {
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [filteredPersonnel, setFilteredPersonnel] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const API_BASE_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/User`; 

  useEffect(() => {
    fetchPersonnel();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = personnel.filter(p => 
        p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.username.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPersonnel(filtered);
    } else {
      setFilteredPersonnel(personnel);
    }
  }, [searchQuery, personnel]);

 const fetchPersonnel = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      const tamAdres = `${API_BASE_URL}/Employee-listesi`;
      const response = await axios.get(tamAdres, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPersonnel(response.data.data);
        setFilteredPersonnel(response.data.data);
      }
    } catch (error: any) {
      console.log("3. Axios Hata Detayı:", error.message);
      Alert.alert("Hata", "Personel listesi alınamadı. Yetkiniz olmayabilir.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, fullName: string) => {
    Alert.alert(
      "Personel Sil",
      `${fullName} adlı kullanıcıyı sistemden silmek istediğinize emin misiniz?`,
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Sil", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_BASE_URL}/delete-user/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              Alert.alert("Başarılı", "Kullanıcı sistemden silindi.");
              setPersonnel(prev => prev.filter(p => p.id !== id));
            } catch (error: any) {
              console.error("Silme hatası:", error);
              const errorMsg = error.response?.data || "Kullanıcı silinirken bir hata oluştu.";
              Alert.alert("Hata", typeof errorMsg === 'string' ? errorMsg : "Yetkiniz yetersiz.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.infoContainer}>
        <Text style={styles.fullName}>{item.fullName}</Text>
        <Text style={styles.username}>Kullanıcı Adı: {item.username}</Text>
        <Text style={styles.roleBadge}>
          {/* Listede İngilizce rol gelirse Türkçe gösterelim */}
          {item.role === 'Worker' ? 'Personel' : item.role === 'Manager' ? 'Yönetici' : item.role}
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id, item.fullName)}
      >
        <Ionicons name="trash-outline" size={24} color="#dc2626" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 10 }}>Personeller Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Personel Yönetimi</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/personel-ekle')}>
          <Ionicons name="person-add" size={20} color="white" />
          <Text style={styles.addBtnText}>Yeni Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="İsim veya Kullanıcı Adı ile ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredPersonnel}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Aranan kriterlere uygun personel bulunamadı.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  addBtn: { flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 5 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, paddingHorizontal: 10, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, alignItems: 'center', justifyContent: 'space-between' },
  infoContainer: { flex: 1 },
  fullName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  username: { fontSize: 14, color: '#6b7280', marginTop: 2, marginBottom: 5 },
  roleBadge: { alignSelf: 'flex-start', backgroundColor: '#e0e7ff', color: '#4f46e5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 12, fontWeight: 'bold' },
  deleteBtn: { padding: 10, backgroundColor: '#fee2e2', borderRadius: 8 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#6b7280' }
});