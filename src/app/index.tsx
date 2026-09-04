import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Token kontrolü bitene kadar beyaz ekranda dönen yükleniyor state'i
  const [isCheckingToken, setIsCheckingToken] = useState(true); 

  const router = useRouter(); 
  const API_URL = `${process.env.EXPO_PUBLIC_API_URL}/api/Auth/login`; 

 useEffect(() => {
    const checkExistingToken = async () => {
      try {
        // Artık AsyncStorage kullanıyoruz
        const token = await AsyncStorage.getItem('userToken');
        const role = await AsyncStorage.getItem('userRole');

        console.log("KASADAN GELEN TOKEN:", token ? "VAR" : "YOK");

        if (token && role && token !== "undefined") {
          setTimeout(() => {
            if (role === "Admin" || role === "Manager") {
              router.replace('/home');
            } else {
              router.replace('/kamera'); 
            }
          }, 300);
        } else {
          setIsCheckingToken(false);
        }
      } catch (error) {
        setIsCheckingToken(false);
      }
    };

    checkExistingToken();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Hata", "Lütfen kullanıcı adı ve şifrenizi girin.");
      return;
    }

    setLoading(true);
    try {
      // 1. API İsteğini atıyoruz (Kırmızı çizgi hatasını bu satır çözer)
      const response = await axios.post(API_URL, {
        username: username,
        password: password
      });

      // 2. .NET veriyi otomatik küçük harfe çevirdiği için küçük harfle yakalıyoruz
      const { token, role, fullName } = response.data;

      // AsyncStorage'ın boyut sınırı yoktur, devasa token'ı rahatça yazar
      if (token) await AsyncStorage.setItem('userToken', String(token));
      if (role) await AsyncStorage.setItem('userRole', String(role));
      if (fullName) await AsyncStorage.setItem('userFullName', String(fullName));

      if (role === "Admin" || role === "Manager") {
        router.replace('/home');
      } else {
        router.replace('/kamera'); 
      }

    } catch (error: any) {
      console.error("GİRİŞ İŞLEMİNDE ÇÖKME:", error); 
      
      if (error.response && error.response.status === 401) {
        Alert.alert("Giriş Başarısız", "Kullanıcı adı veya şifre hatalı.");
      } else {
        // Artık kod hatasını "IP Hatası" sanmıyoruz, genel bir hata basıyoruz.
        Alert.alert("İşlem Hatası", "Giriş yaparken bir sorun oluştu.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Kontrol aşamasındayken ekranda sadece dönen bir yükleniyor ikonu gösterilir
  if (isCheckingToken) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f4f5' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Simfer Personel</Text>
        <Text style={styles.subtitle}>Sisteme Giriş Yapın</Text>

        <TextInput
          style={styles.input}
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={22} 
              color="#6b7280" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});