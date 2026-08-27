import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  
  const [userName, setUserName] = useState(''); 

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await axios.get("http://172.16.71.60:8080/api/User/profil", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserName(response.data.data.fullName); 
      }
    } catch (error) {
      console.error("Profil çekme hatası:", error);
    }
  };

  // 🚀 Çıkış Yapma Fonksiyonu
  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Çıkış Yap", 
          style: "destructive", // Rengini kırmızı yapar (iOS'ta)
          onPress: async () => {
            await SecureStore.deleteItemAsync('userToken'); // Token'ı temizle
            router.replace('/'); // Login sayfasına (index) geri dön
          }
        }
      ]
    );
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }} 
      showsVerticalScrollIndicator={false}
    >
      {/* 🚀 Üst Kısım: Karşılama ve Çıkış Butonu Yan Yana */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greeting}>Hoş Geldiniz,</Text>
          {userName ? <Text style={styles.nameText}>{userName}</Text> : null}
          <Text style={styles.subtitle}>Lütfen yapmak istediğiniz işlemi seçin</Text>
        </View>

        {/* Çıkış Butonu */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={26} color="#dc2626" />
        </TouchableOpacity>
      </View>

      <View style={styles.menuContainer}>
        
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/personel')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#fef2f2' }]}>
            <Ionicons name="people-outline" size={40} color="#dc2626" />
          </View>
          <Text style={styles.cardTitle}>Personel Yönetimi</Text>
          <Text style={styles.cardDesc}>Sistemdeki kullanıcıları listele, sil veya yeni ekle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/liste')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="list-outline" size={40} color="#2563eb" />
          </View>
          <Text style={styles.cardTitle}>Arıza Listesi</Text>
          <Text style={styles.cardDesc}>Tüm arızaları ve durumlarını görüntüle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/kamera')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="qr-code-outline" size={40} color="#16a34a" />
          </View>
          <Text style={styles.cardTitle}>Arıza Bildir</Text>
          <Text style={styles.cardDesc}>Barkod okutarak yeni arıza kaydı oluştur</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f5', 
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 50,
    marginBottom: 30,
  },
  headerTextContainer: {
    flex: 1, // Yazıların sağdaki butonu ezmemesi için
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginTop: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    paddingRight: 10,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2', // Hafif kırmızı arka plan
    padding: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  menuContainer: {
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  cardDesc: {
    fontSize: 14,
    color: '#6b7280',
  }
});