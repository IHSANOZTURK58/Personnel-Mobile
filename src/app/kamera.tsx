import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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
import ImageViewer from 'react-native-image-zoom-viewer';

export default function HomeScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraMode, setCameraMode] = useState<'barcode' | 'photo' | null>(null);

  const [barcodeNumber, setBarcodeNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [faultCategory, setFaultCategory] = useState('Mekanik Arıza');
  const [defectDescription, setDefectDescription] = useState('');
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isFullScreenMode, setIsFullScreenMode] = useState(false); 
  
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const [dailyReports, setDailyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // GEÇMİŞ DETAY STATE'LERİ
  const [selectedHistoryFault, setSelectedHistoryFault] = useState<any>(null);
  const [historyDetailVisible, setHistoryDetailVisible] = useState(false);
  const [historyImageUrl, setHistoryImageUrl] = useState<string | null>(null);
  const [historyImageLoading, setHistoryImageLoading] = useState(false);
  const [historyImageFullScreen, setHistoryImageFullScreen] = useState(false);

  const fetchDailyReports = async () => {
    setLoadingReports(true);
    try {
        const token = await SecureStore.getItemAsync('userToken'); 
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/my-daily-reports`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            setDailyReports(data);
        }
    } catch (error) {
        console.error("Günlük raporlar çekilirken hata:", error);
    } finally {
        setLoadingReports(false);
    }
  };

  const fetchHistoryImageUrl = async (fileName: string) => {
    setHistoryImageLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/get-image-url/${fileName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setHistoryImageUrl(data.temporaryUrl || data.TemporaryUrl);
      } else {
        setHistoryImageUrl(null);
      }
    } catch (error) {
      setHistoryImageUrl(null);
    } finally {
      setHistoryImageLoading(false);
    }
  };

  const openHistoryDetail = (item: any) => {
    setSelectedHistoryFault(item);
    setHistoryDetailVisible(true);
    if (item.imageFileName) {
      fetchHistoryImageUrl(item.imageFileName);
    } else {
      setHistoryImageUrl(null);
    }
  };

  useEffect(() => {
    fetchDailyReports();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      const role = await SecureStore.getItemAsync('userRole');
      const fullName = await SecureStore.getItemAsync('userFullName');
      setUserRole(role);
      setUserName(fullName);
    };
    fetchUserData();

    const fetchProducts = async () => {
      try {
        const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/lookup/products`;
        const jwtToken = await SecureStore.getItemAsync('userToken');
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          }
        });

        const textResponse = await response.text();
        if (response.ok) {
          const data = JSON.parse(textResponse);
          const productList = Array.isArray(data) ? data : (data.items || data.data || []);
          setProducts(productList);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, []);

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
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userFullName');
            router.replace('/'); 
          }
        }
      ]
    );
  };

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

  const handleSubmit = () => {
    // 1. Önce boş alan kontrolü
    if (!barcodeNumber || !productName || !defectDescription) {
      Alert.alert("Eksik Bilgi", "Lütfen tüm metin alanlarını doldurun.");
      return;
    }
    if (!photoUri) {
      Alert.alert("Eksik Bilgi", "Lütfen arızalı ürünün fotoğrafını çekin.");
      return;
    }
    
    // 2. GÖNDERMEDEN ÖNCE ONAY PENCERESİ
    Alert.alert(
      "Kaydı Onaylayın",
      `Şu bilgileri sisteme gönderiyorsunuz:\n\n Ürün: ${productName}\n Barkod: ${barcodeNumber}\n Kategori: ${faultCategory}\n\nBu işlemi onaylıyor musunuz?`,
      [
        { 
          text: "Vazgeç", 
          style: "cancel" 
        },
        { 
          text: "Evet, Gönder", 
          style: "default",
          // 3. Kullanıcı "Evet" derse veriyi API'ye gönder
          onPress: async () => {
            const formData = new FormData();
            formData.append('BarcodeNumber', barcodeNumber);
            formData.append('ProductName', productName);
            formData.append('DefectDescription', defectDescription);
            formData.append('FaultCategory', faultCategory);
            
            formData.append('File', {
              uri: photoUri,
              name: 'ariza_fotografi.jpg',
              type: 'image/jpeg',
            } as any);

            try {
              const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/report-faulty-product`;
              const jwtToken = await SecureStore.getItemAsync('userToken'); 

              if (!jwtToken) {
                Alert.alert("Hata", "Oturum süreniz dolmuş, lütfen tekrar giriş yapın.");
                return;
              }

              const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${jwtToken}`, 
                },
                body: formData,
              });

              if (response.ok) {
                Alert.alert("Başarılı!", "Ürün kaydedildi ve fotoğraf sisteme yüklendi.");
                setBarcodeNumber('');
                setProductName('');
                setDefectDescription('');
                setPhotoUri(null);
                fetchDailyReports();  
              } else {
                const errorText = await response.text();
                Alert.alert(`Sunucu Hatası`, `Detay: ${errorText}`);
              }
            } catch (error) {
              Alert.alert("Bağlantı Hatası", "API'ye ulaşılamıyor.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f8" />

      {/* Yeni Çekilen Fotoğrafın Tam Ekran Modülü */}
      <Modal visible={isFullScreenMode} transparent={true} animationType="fade">
        <View style={styles.fullScreenModal}>
          <Image source={{ uri: photoUri || '' }} style={styles.fullScreenImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setIsFullScreenMode(false)}>
            <Text style={styles.closeModalButtonText}>✖ Kapat</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Bugün Bildirdiklerim Listesi Modalı */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.sectionTitle}>Bugün Bildirdiklerim</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <Text style={styles.closeText}>Kapat</Text>
                    </TouchableOpacity>
                </View>

                {loadingReports ? (
                    <ActivityIndicator size="large" color="#0000ff" />
                ) : dailyReports.length === 0 ? (
                    <Text style={styles.emptyText}>Bugün henüz arıza bildirmediniz.</Text>
                ) : (
                    <FlatList
                        data={dailyReports}
                        keyExtractor={(item: any) => item.id.toString()}
                        renderItem={({ item }: { item: any }) => (
                            <TouchableOpacity 
                              style={styles.reportCard}
                              activeOpacity={0.7}
                              onPress={() => openHistoryDetail(item)}
                            >
                                <Text style={styles.productName}>{item.productName}</Text>
                                <Text style={styles.barcodeText}>Barkod: {item.barcodeNumber}</Text>
                                <Text style={styles.statusText}>
                                    Durum: {item.isResolved ? "✅ Çözüldü" : "⏳ Bekliyor"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
      </Modal>

      {/* Geçmiş Bildirim Detay Modalı */}
      <Modal visible={historyDetailVisible} transparent={true} animationType="fade" onRequestClose={() => setHistoryDetailVisible(false)}>
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            
            <TouchableOpacity style={styles.detailModalCloseButton} onPress={() => setHistoryDetailVisible(false)}>
              <Text style={styles.detailModalCloseText}>✖</Text>
            </TouchableOpacity>

            {selectedHistoryFault && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.detailModalTitle}>{selectedHistoryFault.productName}</Text>
                <Text style={styles.detailModalBarcode}>Barkod: {selectedHistoryFault.barcodeNumber}</Text>

                <Text style={styles.detailModalLabel}>Arıza Kategorisi:</Text>
                <Text style={styles.detailModalDescription}>{selectedHistoryFault.faultCategory || "Belirtilmemiş"}</Text>

                <Text style={styles.detailModalLabel}>Arıza Detayı:</Text>
                <Text style={styles.detailModalDescription}>{selectedHistoryFault.defectDescription}</Text>

                {selectedHistoryFault.isResolved && (
                  <>
                    <Text style={styles.detailModalLabel}>Çözüm Detayı:</Text>
                    <Text style={styles.detailModalDescription}>
                      {selectedHistoryFault.resolutionDetails || "Çözüm açıklaması girilmemiş."}
                    </Text>
                  </>
                )}

                <Text style={styles.detailModalLabel}>Kayıt Tarihi:</Text>
                <Text style={styles.detailModalDate}>
                  {new Date(selectedHistoryFault.createdDate).toLocaleDateString('tr-TR')} - {new Date(selectedHistoryFault.createdDate).toLocaleTimeString('tr-TR')}
                </Text>

                <View style={styles.imageSectionContainer}>
                  <Text style={styles.detailModalLabel}>Arıza Fotoğrafı:</Text>
                  
                  {selectedHistoryFault.imageFileName ? (
                    historyImageLoading ? (
                      <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 20 }} />
                    ) : historyImageUrl ? (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setHistoryImageFullScreen(true)}
                      >
                        <Image source={{ uri: historyImageUrl }} style={styles.inlineModalImage} resizeMode="cover" />
                        <View style={styles.zoomHintContainer}>
                          <Ionicons name="search-outline" size={16} color="#6b7280" />
                          <Text style={styles.zoomHintText}>Büyütmek için fotoğrafa dokunun</Text>
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.noImageText}>Fotoğraf yüklenemedi.</Text>
                    )
                  ) : (
                    <View style={styles.noImageContainer}>
                      <Text style={styles.noImageText}>Bu arızaya fotoğraf eklenmemiş.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Geçmiş Resim Tam Ekran Görüntüleyici */}
      <Modal visible={historyImageFullScreen} transparent={true} onRequestClose={() => setHistoryImageFullScreen(false)}>
        <ImageViewer 
          imageUrls={historyImageUrl ? [{ url: historyImageUrl }] : []}
          enableSwipeDown={true} 
          onSwipeDown={() => setHistoryImageFullScreen(false)}
          onCancel={() => setHistoryImageFullScreen(false)}
          renderIndicator={() => <></>}
          renderHeader={() => (
            <TouchableOpacity 
              style={{ position: 'absolute', top: 45, right: 20, zIndex: 9999, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20 }}
              onPress={() => setHistoryImageFullScreen(false)}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          )}
        />
      </Modal>

      {cameraMode ? (
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
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            
            <View style={styles.headerContainer}>
              <View>
                <Text style={styles.headerTitle}>Simfer Personel</Text>
                {userName && (
                  <Text style={styles.userNameText}>👤 Hoş geldin, {userName}</Text>
                )}
                <Text style={styles.headerSubtitle}>Arızalı Ürün Bildirimi</Text>
              </View>
              
              {userRole?.toLowerCase() === 'worker' && (
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                  <Ionicons name="log-out-outline" size={26} color="#dc2626" />
                </TouchableOpacity>
              )}
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={productName}
                  onValueChange={(itemValue) => setProductName(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Lütfen bir ürün seçin..." value="" color="#999" />
                  {products?.map((item) => (
                    <Picker.Item 
                      key={item.id?.toString() || item.name} 
                      label={item.name} 
                      value={item.name} 
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Hata Türü (Kategori)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={faultCategory}
                  onValueChange={(itemValue) => setFaultCategory(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Mekanik Arıza" value="Mekanik Arıza" />
                  <Picker.Item label="Elektronik Arıza" value="Elektronik Arıza" />
                  <Picker.Item label="Kozmetik Hasar" value="Kozmetik Hasar" />
                  <Picker.Item label="Diğer" value="Diğer" />
                </Picker>
              </View>

              <Text style={styles.label}>Hata Açıklaması</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Örn: Rezistans arızalı..."
                value={defectDescription}
                onChangeText={setDefectDescription}
                multiline={true}
                numberOfLines={4}
              />

              <Text style={styles.label}>Arıza Fotoğrafı</Text>
              {photoUri ? (
                <View style={styles.photoPreviewContainer}>
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

              <TouchableOpacity 
                  style={styles.historyButton} 
                  onPress={() => {
                      fetchDailyReports();
                      setModalVisible(true); 
                  }}>
                  <Text style={styles.historyButtonText}>Geçmiş Bildirimlerimi Gör</Text>
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
  
  headerContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20, 
    paddingTop: 40, 
    backgroundColor: '#ffffff', 
    borderBottomWidth: 1, 
    borderBottomColor: '#e0e0e0' 
  },
  headerTitle: { fontSize: 26, fontWeight: '900', color: '#005b9f', letterSpacing: 0.5 },
  userNameText: { fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginTop: 6 },
  headerSubtitle: { fontSize: 14, color: '#666', marginTop: 6, fontWeight: '500' },
  logoutBtn: { backgroundColor: '#fee2e2', padding: 10, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

  formContainer: { padding: 24 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 20 },
  barcodeInputGroup: { flexDirection: 'row', marginBottom: 20 },
  scanButton: { backgroundColor: '#e69a00', justifyContent: 'center', paddingHorizontal: 20, borderTopRightRadius: 8, borderBottomRightRadius: 8, borderWidth: 1, borderColor: '#e69a00' },
  scanButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 20, overflow: 'hidden', justifyContent: 'center' },
  picker: { height: 55, width: '100%' },
  
  photoButton: { backgroundColor: '#e0e0e0', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' },
  photoButtonText: { color: '#555', fontSize: 16, fontWeight: 'bold' },
  photoPreviewContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, backgroundColor: '#fff', padding: 15, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  photoPreview: { width: 80, height: 80, borderRadius: 8, marginRight: 15, borderWidth: 1, borderColor: '#ddd' },
  retakeButton: { backgroundColor: '#f44336', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, alignItems: 'center' },
  retakeButtonText: { color: '#fff', fontWeight: 'bold' },

  submitButton: { backgroundColor: '#005b9f', paddingVertical: 18, borderRadius: 12, alignItems: 'center', elevation: 4 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  historyButton: { backgroundColor: '#6c757d', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  historyButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  cameraContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'flex-end' },
  camera: { ...StyleSheet.absoluteFillObject }, 
  captureButtonContainer: { position: 'absolute', bottom: 100, alignSelf: 'center' },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255, 255, 255, 0.3)', justifyContent: 'center', alignItems: 'center' },
  captureButtonInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  cancelButton: { position: 'absolute', bottom: 30, alignSelf: 'center', backgroundColor: '#e53935', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 10 },
  infoText: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  primaryButton: { backgroundColor: '#005b9f', padding: 15, borderRadius: 10 },

  fullScreenModal: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center' },
  fullScreenImage: { width: '100%', height: '80%' },
  closeModalButton: { position: 'absolute', top: 50, right: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8 },
  closeModalButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeText: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  reportCard: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 10, borderLeftWidth: 5, borderLeftColor: '#007bff', elevation: 2 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  barcodeText: { fontSize: 14, color: '#666', marginTop: 5 },
  statusText: { fontSize: 14, fontWeight: '600', marginTop: 8, color: '#444' },
  emptyText: { fontStyle: 'italic', color: '#888', textAlign: 'center', marginTop: 20 },

  // DETAY MODALI STİLLERİ
  detailModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailModalContent: { backgroundColor: 'white', width: '100%', maxHeight: '85%', borderRadius: 15, padding: 20, elevation: 5 },
  detailModalCloseButton: { alignSelf: 'flex-end', padding: 5, marginBottom: 5 },
  detailModalCloseText: { fontSize: 20, color: '#6b7280', fontWeight: 'bold' },
  detailModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  detailModalBarcode: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  detailModalLabel: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  detailModalDescription: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 20 },
  detailModalDate: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  
  imageSectionContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15, paddingBottom: 20 },
  inlineModalImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  zoomHintContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  zoomHintText: { color: '#6b7280', fontSize: 13, fontStyle: 'italic', marginLeft: 5 },
  noImageContainer: { width: '100%', padding: 20, backgroundColor: '#f3f4f6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  noImageText: { color: '#9ca3af', fontWeight: 'bold', fontStyle: 'italic', marginTop: 10 },
});