import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Stack, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PersonelEkleScreen() {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // 🚀 Default değeri artık 'Worker' yapıyoruz.
  const [roleName, setRoleName] = useState('Worker'); 
  
  const [loading, setLoading] = useState(false);

  // Ekranda görünecek etiketler (Label) ve API'ye gidecek değerler (Value)
  const roleOptions = [
    { label: 'Personel', value: 'Worker' },
    { label: 'Yönetici', value: 'Manager' },
    { label: 'Admin', value: 'Admin' }
  ];

  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/User/add-user`; 

  const handleAddUser = async () => {
    if (!firstName || !lastName || !username || !password) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      
      const payload = {
        firstName,
        lastName,
        username,
        password,
        roleName // Seçilen İngilizce değer gidecek (Worker, Manager, Admin)
      };

      const response = await axios.post(API_URL, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        Alert.alert("Başarılı", "Yeni kayıt sisteme eklendi!", [
          { text: "Tamam", onPress: () => router.back() }
        ]);
      }
    } catch (error: any) {
      console.error("Ekleme hatası:", error);
      const errorMsg = error.response?.data || "Kullanıcı eklenirken bir hata oluştu.";
      Alert.alert("Ekleme Başarısız", typeof errorMsg === 'string' ? errorMsg : "Yetkiniz yetersiz olabilir.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Personel Ekle</Text>
      </View>

      <View style={styles.formContainer}>
        
        <Text style={styles.label}>Ad</Text>
        <TextInput style={styles.input} placeholder="Personelin Adı" value={firstName} onChangeText={setFirstName} />

        <Text style={styles.label}>Soyad</Text>
        <TextInput style={styles.input} placeholder="Personelin Soyadı" value={lastName} onChangeText={setLastName} />

        <Text style={styles.label}>Kullanıcı Adı</Text>
        <TextInput style={styles.input} placeholder="Örn: ahmet.yilmaz" value={username} onChangeText={setUsername} autoCapitalize="none" />

        <Text style={styles.label}>Şifre</Text>
        {/* 🚀 secureTextEntry kaldırıldı, artık şifre açıkça görünecek */}
        <TextInput style={styles.input} placeholder="Şifre belirleyin" value={password} onChangeText={setPassword} />

        <Text style={styles.label}>Yetki (Rol)</Text>
        <View style={styles.roleContainer}>
          {roleOptions.map((role) => (
            <TouchableOpacity 
              key={role.value} 
              style={[styles.roleButton, roleName === role.value && styles.roleButtonActive]}
              onPress={() => setRoleName(role.value)}
            >
              <Text style={[styles.roleText, roleName === role.value && styles.roleTextActive]}>
                {role.label} {/* Ekranda Türkçe yazacak */}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleAddUser}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>Kaydet</Text>}
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f5' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 50, paddingHorizontal: 20, marginBottom: 20 },
  backButton: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  formContainer: { backgroundColor: 'white', marginHorizontal: 20, padding: 20, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 5, marginTop: 15 },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  roleContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  roleButton: { flex: 1, paddingVertical: 10, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#f9fafb' },
  roleButtonActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  roleText: { color: '#6b7280', fontWeight: '600' },
  roleTextActive: { color: '#2563eb', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#16a34a', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 30 },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});