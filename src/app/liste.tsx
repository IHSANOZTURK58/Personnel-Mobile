import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FaultListScreen() {
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bekleyen' | 'cozulen'>('bekleyen');
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFault, setSelectedFault] = useState<any>(null);
  
  const [imageFullScreenVisible, setImageFullScreenVisible] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    fetchFaults();
  }, []);

  const fetchFaults = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch("http://172.16.71.60:8080/api/FaultyProducts/get-all", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaults(data); 
      }
    } catch (error) {
      console.error("Liste çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsResolved = async (itemId: number) => {
    if (!itemId) return;

    Alert.alert(
      "İşlem Onayı",
      "Bu arızayı çözüldü olarak işaretlemek istiyor musunuz?",
      [
        { text: "İptal", style: "cancel" },
        { 
          text: "Evet, Çözüldü", 
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('userToken');
              const apiUrl = `http://172.16.71.60:8080/api/FaultyProducts/cozuldu-isaretle/${itemId}`;

              const response = await fetch(apiUrl, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
              });

              if (response.ok) {
                setModalVisible(false); 
                fetchFaults(); 
              } else {
                const errorText = await response.text();
                Alert.alert("Sunucu Hatası", `Kod: ${response.status}\nDetay: ${errorText}`);
              }
            } catch (error) {
              Alert.alert("Bağlantı Hatası", "API'ye ulaşılamadı.");
            }
          }
        }
      ]
    );
  };

  // 🚀 Resim linkini arka planda çeken fonksiyon
  const fetchImageUrl = async (fileName: string) => {
    setImageLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const response = await fetch(`http://172.16.71.60:8080/api/FaultyProducts/get-image-url/${fileName}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const safeUrl = data.temporaryUrl || data.TemporaryUrl; 
        setFullScreenImageUrl(safeUrl);
      } else {
        setFullScreenImageUrl(null);
      }
    } catch (error) {
      console.error(error);
      setFullScreenImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const filteredFaults = faults.filter(fault => {
    const matchesTab = activeTab === 'bekleyen' ? fault.isResolved === false : fault.isResolved === true;
    const matchesSearch = fault.barcodeNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getImageName = (fault: any) => {
    if (!fault) return null;
    return fault.imageFileName || fault.ImageFileName;
  };

  // 🚀 Karta tıklandığında hem modali açar hem de resmi yüklemeye başlar
  const openDetailModal = (item: any) => {
    setSelectedFault(item);
    setModalVisible(true);
    
    const fileName = getImageName(item);
    if (fileName) {
      fetchImageUrl(fileName);
    } else {
      setFullScreenImageUrl(null);
    }
  };

  const renderFaultCard = ({ item }: { item: any }) => {
    const targetId = item.id !== undefined ? item.id : item.Id;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openDetailModal(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.barcode}>#{item.barcodeNumber}</Text>
        </View>
        
        <Text style={styles.description} numberOfLines={3}>{item.defectDescription}</Text>
        
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
          <Text style={styles.dateText}>
            {new Date(item.createdDate).toLocaleDateString('tr-TR')} - {new Date(item.createdDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          {activeTab === 'bekleyen' ? (
            <>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Bekliyor</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.actionPillButton} 
                onPress={() => handleMarkAsResolved(targetId)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                <Text style={styles.actionPillText}>Çözüldü Yap</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.resolvedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 6 }} />
              <Text style={styles.resolvedBadgeText}>Çözüldü</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Arıza Listesi</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="barcode-outline" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Barkod numarası ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          keyboardType="default" 
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchIcon}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'bekleyen' && styles.activeTabBekleyen]} onPress={() => setActiveTab('bekleyen')}>
          <Text style={[styles.tabText, activeTab === 'bekleyen' && styles.activeTabText]}>Bekleyenler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'cozulen' && styles.activeTabCozulen]} onPress={() => setActiveTab('cozulen')}>
          <Text style={[styles.tabText, activeTab === 'cozulen' && styles.activeTabText]}>Çözülenler</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#005b9f" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredFaults}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderFaultCard}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 ? `"${searchQuery}" barkodlu arıza bulunamadı.` : 'Bu listede hiç kayıt bulunmuyor.'}
            </Text>
          }
        />
      )}

      {/* 🚀 ARIZA DETAYLARI POPUP'I */}
      {/* onRequestClose özelliği Android'deki fiziksel geri tuşunun pencereyi kapatmasını sağlar */}
      <Modal 
        visible={modalVisible} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>✖</Text>
            </TouchableOpacity>

            {selectedFault && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{selectedFault.productName}</Text>
                <Text style={styles.modalBarcode}>Barkod: {selectedFault.barcodeNumber}</Text>

                <Text style={styles.modalLabel}>Arıza Detayı:</Text>
                <Text style={styles.modalDescription}>{selectedFault.defectDescription}</Text>

                <Text style={styles.modalLabel}>Kayıt Tarihi:</Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedFault.createdDate).toLocaleDateString('tr-TR')} - {new Date(selectedFault.createdDate).toLocaleTimeString('tr-TR')}
                </Text>

                {/* 🚀 DEĞİŞEN KISIM: Fotoğraf artık en altta açık olarak geliyor */}
                <View style={styles.imageSectionContainer}>
                  <Text style={styles.modalLabel}>Arıza Fotoğrafı:</Text>
                  
                  {getImageName(selectedFault) ? (
                    imageLoading ? (
                      <ActivityIndicator size="small" color="#0ea5e9" style={{ marginTop: 20 }} />
                    ) : fullScreenImageUrl ? (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setImageFullScreenVisible(true)}
                      >
                        <Image 
                          source={{ uri: fullScreenImageUrl }} 
                          style={styles.inlineModalImage} 
                          resizeMode="cover"
                        />
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

      {/* 🚀 TAM EKRAN (ZOOM) FOTOĞRAF ALANI */}
      {/* onRequestClose ile telefonun geri tuşu bu pencereyi de sorunsuz kapatır */}
      <Modal 
        visible={imageFullScreenVisible} 
        transparent={true} 
        animationType="slide"
        onRequestClose={() => setImageFullScreenVisible(false)}
      >
        <View style={styles.fullScreenImageOverlay}>
          
          <TouchableOpacity style={styles.fullScreenCloseButton} onPress={() => setImageFullScreenVisible(false)}>
            <Text style={styles.fullScreenCloseText}>Kapat ✖</Text>
          </TouchableOpacity>

          <ScrollView 
            contentContainerStyle={styles.zoomableScrollContainer}
            maximumZoomScale={5} 
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            {fullScreenImageUrl && (
              <Image 
                source={{ uri: fullScreenImageUrl }}
                style={styles.fullScreenZoomImage}
                resizeMode="contain"
              />
            )}
          </ScrollView>

        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 20, marginTop: 15, borderRadius: 10, paddingHorizontal: 15, borderWidth: 1, borderColor: '#d1d5db', height: 48, elevation: 1 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  clearSearchIcon: { marginLeft: 10, padding: 2 },

  tabContainer: { flexDirection: 'row', padding: 20, paddingBottom: 10 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#e5e7eb', marginHorizontal: 5, borderRadius: 8 },
  activeTabBekleyen: { backgroundColor: '#ef4444' }, 
  activeTabCozulen: { backgroundColor: '#10b981' }, 
  tabText: { fontSize: 15, fontWeight: 'bold', color: '#4b5563' },
  activeTabText: { color: '#ffffff' },
  
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#e5e7eb', elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  productName: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  barcode: { fontSize: 13, color: '#6b7280', fontWeight: 'bold' },
  description: { fontSize: 14, color: '#4b5563', marginBottom: 12, lineHeight: 20 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  dateText: { fontSize: 13, color: '#9ca3af', marginLeft: 6 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12 },
  pendingBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pendingBadgeText: { color: '#dc2626', fontWeight: 'bold', fontSize: 13 },
  actionPillButton: { flexDirection: 'row', backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionPillText: { color: 'white', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resolvedBadgeText: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#6b7280', fontSize: 15, marginTop: 50 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', width: '100%', maxHeight: '85%', borderRadius: 15, padding: 20, elevation: 5 },
  modalCloseButton: { alignSelf: 'flex-end', padding: 5, marginBottom: 5 },
  modalCloseText: { fontSize: 20, color: '#6b7280', fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 5 },
  modalBarcode: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  modalLabel: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 5 },
  modalDescription: { fontSize: 15, color: '#4b5563', lineHeight: 22, marginBottom: 20 },
  modalDate: { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  // 🚀 YENİ İÇ İÇE FOTOĞRAF STİLLERİ
  imageSectionContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 15, paddingBottom: 20 },
  inlineModalImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  zoomHintContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  zoomHintText: { color: '#6b7280', fontSize: 13, fontStyle: 'italic', marginLeft: 5 },
  noImageContainer: { width: '100%', padding: 20, backgroundColor: '#f3f4f6', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  noImageText: { color: '#9ca3af', fontWeight: 'bold', fontStyle: 'italic', marginTop: 10 },

  fullScreenImageOverlay: { flex: 1, backgroundColor: 'black', justifyContent: 'center' },
  fullScreenCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 8 },
  fullScreenCloseText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  zoomableScrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  fullScreenZoomImage: { width: '100%', height: '100%', minHeight: 400 }
});