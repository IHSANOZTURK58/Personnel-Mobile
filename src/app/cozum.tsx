import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function CozumEkrani() {
  const [faultId, setFaultId] = useState('');
  const [resolutionDetails, setResolutionDetails] = useState('');

  const handleResolve = async () => {
    if (!faultId || !resolutionDetails) {
      Alert.alert("Eksik Bilgi", "Lütfen Arıza ID ve Çözüm Detayını doldurun.");
      return;
    }

    try {
     const token = await AsyncStorage.getItem('userToken'); 
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/resolve`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: parseInt(faultId),
          resolutionDetails: resolutionDetails
        })
      });

      if (response.ok) {
        Alert.alert("Başarılı!", "Arıza başarıyla çözüldü ve detaylar eklendi.");
        setFaultId('');
        setResolutionDetails('');
      } else {
        const errorText = await response.text();
        Alert.alert(`Hata (${response.status})`, errorText || "İşlem başarısız.");
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "API'ye ulaşılamıyor.");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Arıza Çözüm Merkezi</Text>
            <Text style={styles.headerSubtitle}>Mevcut arızaları kapatın</Text>
          </View>

          <View style={styles.formContainer}>
            
            <Text style={styles.label}>Arıza Kayıt ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 1"
              value={faultId}
              onChangeText={setFaultId}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Ne Yapıldı da Çözüldü?</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Örn: Rezistans kablosu yenisiyle değiştirildi..."
              value={resolutionDetails}
              onChangeText={setResolutionDetails}
              multiline={true}
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleResolve}>
              <Text style={styles.buttonText}>Arızayı Çözüldü İşaretle</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  headerContainer: { 
    padding: 20, 
    paddingTop: 40, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#16a34a' },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 6 },
  formContainer: { padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#16a34a', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 2 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
});