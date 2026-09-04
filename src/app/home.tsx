import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState(''); 
  const [userRole, setUserRole] = useState(''); 

  // 401 Hatası (Oturum Zaman Aşımı) durumunda çalışacak merkezi fonksiyon
  const handleSessionTimeout = async () => {
    Alert.alert("Oturum Süresi Doldu", "Güvenliğiniz için oturumunuz kapatıldı. Lütfen tekrar giriş yapın.");
    await AsyncStorage.clear();
    router.replace('/');
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken'); 
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/User/profil`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUserName(response.data.data.fullName); 
        setUserRole(response.data.data.role);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        await handleSessionTimeout();
      } else {
        console.error("Profil çekme hatası:", error);
      }
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Hesabınızdan çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Çıkış işlemi başlatıldı...");
              await AsyncStorage.clear();
              console.log("✅ Kasa tamamen boşaltıldı.");
              router.replace('/');
            } catch (error) {
              console.error("Çıkış hatası:", error);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Sersim Hata Rapor Sistemi',
          headerTitleAlign: 'center',
          headerTitleStyle: { 
            color: '#ffffff',
            fontWeight: '900', 
            fontSize: 18 
          },
          headerStyle: { backgroundColor: '#005b9f' },
          headerShadowVisible: false, 
        }} 
      />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Üst Kısım: Karşılama */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.greeting}>İyi Çalışmalar,</Text>
            <Text style={styles.nameText}>{userName || "Yükleniyor..."}</Text>
            {userRole ? <Text style={styles.roleText}>{userRole}</Text> : null}
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Üstteki İkili Menü: Liste ve Personel */}
        <View style={styles.gridContainer}>
          <TouchableOpacity 
            style={styles.gridCard} 
            onPress={() => router.push('/liste')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="list" size={34} color="#3b82f6" />
            </View>
            <Text style={styles.gridTitle}>Arıza Listesi</Text>
            <Text style={styles.gridDesc}>Tüm kayıtları görüntüle</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.gridCard} 
            onPress={() => router.push('/personel')}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#fef2f2' }]}>
              <Ionicons name="people" size={34} color="#ef4444" />
            </View>
            <Text style={styles.gridTitle}>Personeller</Text>
            <Text style={styles.gridDesc}>Sistemdeki kullanıcılar</Text>
          </TouchableOpacity>
        </View>

        {/* Alttaki Geniş Ana Eylem: Arıza Bildir */}
        <TouchableOpacity 
          style={styles.heroCard} 
          onPress={() => router.push('/kamera')}
          activeOpacity={0.9}
        >
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Yeni Arıza Bildir</Text>
            <Text style={styles.heroDesc}>Cihaz barkodunu okutarak anında hata kaydı oluşturun.</Text>
          </View>
          <View style={styles.heroIconBadge}>
            <Ionicons name="qr-code" size={36} color="#16a34a" />
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20, 
    paddingBottom: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', 
    marginBottom: 35,
  },
  greeting: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  nameText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6', 
    marginTop: 4,
    textTransform: 'uppercase', 
    letterSpacing: 0.5,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15, 
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIcon: {
    width: 55,
    height: 55,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gridTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  gridDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  heroTextContainer: {
    flex: 1,
    paddingRight: 15,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  heroIconBadge: {
    backgroundColor: '#f0fdf4', 
    width: 65,
    height: 65,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  }
});