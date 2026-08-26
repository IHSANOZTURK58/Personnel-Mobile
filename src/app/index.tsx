import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import {
  Alert, Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraMode, setCameraMode] = useState<'barcode' | 'photo' | null>(null);

  // Veritabanı State'leri
  const [barcodeNumber, setBarcodeNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [defectDescription, setDefectDescription] = useState('');
  
  // Fotoğraf State'leri
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false); // Tam ekran kontrolü

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.infoText}>Kamera izni gerekiyor.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.buttonText}>İzin Ver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (cameraMode === 'barcode') {
      setBarcodeNumber(data); 
      setCameraMode(null); 
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        setPhotoUri(photo.uri); 
        setCameraMode(null); 
      }
    }
  };

  // Gönder Butonu (Gerçek API İsteği)
  const handleSubmit = async () => {
    // 1. Form eksik mi diye kontrol et
    if (!barcodeNumber || !productName || !defectDescription) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm metin alanlarını doldurun.");
      return;
    }
    if (!photoUri) {
      Alert.alert("Eksik Bilgi", "Lütfen arızalı ürünün fotoğrafını çekin.");
      return;
    }
    
    // 2. Verileri C# API'nin beklediği formata (FormData) çevir
    const formData = new FormData();
    formData.append('BarcodeNumber', barcodeNumber);
    formData.append('ProductName', productName);
    formData.append('DefectDescription', defectDescription);
    
    // Fotoğraf dosyasını ekle
    formData.append('File', {
      uri: photoUri,
      name: 'ariza_fotografi.jpg',
      type: 'image/jpeg',
    } as any);

    try {
     const apiUrl = "http://172.16.71.60:8080/api/FaultyProducts/report-faulty-product";

      const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IjIiLCJVc2VybmFtZSI6IsSwaHNhbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiLEsGhzYW7Dlnp0w7xyayDDlnp0w7xyayIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluIiwiZXhwIjoxNzg3NzYwMDM1LCJpc3MiOiJTaW1mZXJBUEkiLCJhdWQiOiJTaW1mZXJVc2VycyJ9.Zs05mBSQ9lsAOW2pWJuD_WP5MLZKg7oPJ8laelMknMk"; 

      // 5. İsteği Docker'daki API'ye fırlat
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: formData,
      });

      // 6. Backend'den gelen cevabı kontrol et
      if (response.ok) {
        Alert.alert("Başarılı!", "Ürün kaydedildi ve fotoğraf MinIO'ya yüklendi.");
        setBarcodeNumber('');
        setProductName('');
        setDefectDescription('');
        setPhotoUri(null);
      } else {
        const errorText = await response.text();
        Alert.alert(
          `Sunucu Hatası (Kod: ${response.status})`, 
          `Hata Kodu: ${response.status}\n\nEğer 400 ise: Parametre uyuşmazlığı var.\nEğer 401 ise: Token geçersiz.\nEğer 500 ise: Backend çöktü.\n\nDetay: ${errorText || "BOŞ GELDİ"}`
        );
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "API'ye ulaşılamıyor. IP ve Port ayarlarını kontrol edin.");
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f8" />

      {/* --- TAM EKRAN FOTOĞRAF MODALI --- */}
      <Modal visible={isFullScreenMode} transparent={true} animationType="fade">
        <View style={styles.fullScreenModal}>
          <Image source={{ uri: photoUri || '' }} style={styles.fullScreenImage} resizeMode="contain" />
          
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsFullScreenMode(false)}>
            <Text style={styles.closeModalButtonText}>✖ Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {cameraMode ? (
        // --- KAMERA EKRANI ---
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
            onBarcodeScanned={cameraMode === 'barcode' ? handleBarcodeScanned : undefined}
            barcodeScannerSettings={cameraMode === 'barcode' ? { barcodeTypes: ["qr", "ean13", "ean8", "code128"] } : undefined}
          />
          
          {cameraMode === 'photo' && (
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={() => setCameraMode(null)}>
            <Text style={styles.buttonText}>İptal Et</Text>
          </TouchableOpacity>
        </View>
      ) : (
        // --- FORM EKRANI ---
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Simfer Personel</Text>
              <Text style={styles.headerSubtitle}>Arızalı Ürün Bildirimi</Text>
            </View>

            <View style={styles.formContainer}>
              
              <Text style={styles.label}>Barkod Numarası</Text>
              <View style={styles.barcodeInputGroup}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0, borderRightWidth: 0, borderTopRightRadius: 0, borderBottomRightRadius: 0 }]}
                  placeholder="Okutun veya yazın..."
                  value={barcodeNumber}
                  onChangeText={setBarcodeNumber}
                />
                <TouchableOpacity style={styles.scanButton} onPress={() => setCameraMode('barcode')}>
                  <Text style={styles.scanButtonText}>📷 Okut</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Ürün Adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: Ankastre Fırın"
                value={productName}
                onChangeText={setProductName}
              />

              <Text style={styles.label}>Hata Açıklaması</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Örn: Rezistans arızalı..."
                value={defectDescription}
                onChangeText={setDefectDescription}
                multiline={true}
                numberOfLines={4}
              />

              {/* FOTOĞRAF ALANI */}
              <Text style={styles.label}>Arıza Fotoğrafı</Text>
              {photoUri ? (
                <View style={styles.photoPreviewContainer}>
                  {/* Fotoğrafın kendisine basılabilir özellik ekledik */}
                  <TouchableOpacity onPress={() => setIsFullScreenMode(true)}>
                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                  </TouchableOpacity>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#666', marginBottom: 5 }}>Önizlemek için resme dokunun.</Text>
                    <TouchableOpacity style={styles.retakeButton} onPress={() => setCameraMode('photo')}>
                      <Text style={styles.retakeButtonText}>🔄 Yeniden Çek</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.photoButton} activeOpacity={0.8} onPress={() => setCameraMode('photo')}>
                  <Text style={styles.photoButtonText}>📸 Kamerayı Aç ve Fotoğraf Çek</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.submitButton} activeOpacity={0.8} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Sisteme Gönder</Text>
              </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: { padding: 20, paddingTop: 40, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#005b9f', letterSpacing: 0.5 },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '500' },
  formContainer: { padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  barcodeInputGroup: { flexDirection: 'row', marginBottom: 20 },
  scanButton: { backgroundColor: '#e69a00', justifyContent: 'center', paddingHorizontal: 20, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: '#e69a00' },
  scanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  photoButton: { backgroundColor: '#e0e0e0', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  photoButtonText: { color: '#555', fontSize: 16, fontWeight: 'bold' },
  photoPreviewContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  photoPreview: { width: 80, height: 80, borderRadius: 8, marginRight: 15, borderWidth: 1, borderColor: '#ddd' },
  retakeButton: { backgroundColor: '#f44336', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  retakeButtonText: { color: '#fff', fontWeight: 'bold' },

  submitButton: { backgroundColor: '#005b9f', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 4 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  cameraContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'flex-end' },
  camera: { ...StyleSheet.absoluteFillObject }, 
  
  captureButtonContainer: { position: 'absolute', bottom: 100, alignSelf: 'center' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  
  cancelButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#e53935', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  infoText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  primaryButton: { backgroundColor: '#005b9f', padding: 15, borderRadius: 10 },

  /* TAM EKRAN MODAL STİLLERİ */
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)', // Koyu siyah arka plan
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});