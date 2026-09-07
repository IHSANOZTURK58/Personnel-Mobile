import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ImageViewer from 'react-native-image-zoom-viewer';

export default function FaultListScreen() {
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bekleyen' | 'cozulen' | 'tumu'>('bekleyen');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState<string>('Tümü');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); 
  const [timeFilter, setTimeFilter] = useState<'tumu' | '7gun' | '1ay' | '6ay' | 'ozel'>('tumu');
  
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false); 
  const [timeModalVisible, setTimeModalVisible] = useState(false); 
  
  const [customDateModalVisible, setCustomDateModalVisible] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFault, setSelectedFault] = useState<any>(null);
  
  const [imageFullScreenVisible, setImageFullScreenVisible] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const [resolveModalVisible, setResolveModalVisible] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [faultToResolve, setFaultToResolve] = useState<number | null>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [isScannerVisible, setIsScannerVisible] = useState(false);

  useEffect(() => {
    fetchFaults();
  }, []);

  const fetchFaults = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/get-all`, {
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

  const openResolveModal = (itemId: number) => {
    setFaultToResolve(itemId);
    setResolutionText('');
    setResolveModalVisible(true);
  };

  const submitResolution = async () => {
    if (!resolutionText.trim()) {
      Alert.alert("Uyarı", "Lütfen bir çözüm detayı giriniz.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/resolve`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          Id: faultToResolve,
          ResolutionDetails: resolutionText
        })
      });

      if (response.ok) {
        setResolveModalVisible(false);
        fetchFaults(); 
      } else {
        const errorText = await response.text();
        Alert.alert("Sunucu Hatası", `Detay: ${errorText}`);
      }
    } catch (error) {
      Alert.alert("Bağlantı Hatası", "API'ye ulaşılamadı.");
    }
  };

  const fetchImageUrl = async (fileName: string) => {
    setImageLoading(true);
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/get-image-url/${fileName}`, {
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
      setFullScreenImageUrl(null);
    } finally {
      setImageLoading(false);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('İzin Reddedildi', 'Barkod okutmak için kamera izni gereklidir.');
        return;
      }
    }
    setIsScannerVisible(true);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setSearchQuery(data); 
    setIsScannerVisible(false); 
  };

  const productList = ['Tümü', ...Array.from(new Set(faults.map(f => f.productName || f.ProductName))).filter(Boolean)];
  const categoryList = ['Tümü', ...Array.from(new Set(faults.map(f => f.faultCategory || f.FaultCategory))).filter(Boolean)];

  const getTimeLabel = () => {
    switch(timeFilter) {
      case '7gun': return 'Son 7 Gün';
      case '1ay': return 'Son 1 Ay';
      case '6ay': return 'Son 6 Ay';
      case 'ozel': 
        const sDate = customStartDate ? customStartDate.toLocaleDateString('tr-TR') : '?';
        const eDate = customEndDate ? customEndDate.toLocaleDateString('tr-TR') : '?';
        return `${sDate} - ${eDate}`;
      default: return 'Tüm Zamanlar';
    }
  };

  const applyCustomDateFilter = () => {
    if (!customStartDate || !customEndDate) {
      Alert.alert("Eksik Bilgi", "Lütfen başlangıç ve bitiş tarihlerini seçiniz.");
      return;
    }
    if (customStartDate > customEndDate) {
      Alert.alert("Hatalı Tarih", "Başlangıç tarihi bitiş tarihinden sonra olamaz.");
      return;
    }
    setTimeFilter('ozel');
    setCustomDateModalVisible(false);
    setTimeout(() => setFilterMenuVisible(true), 100);
  };

  const baseFilteredFaults = faults.filter(fault => {
    const barcode = fault.barcodeNumber || fault.BarcodeNumber || '';
    const matchesSearch = barcode.toString().toLowerCase().includes(searchQuery.toLowerCase());
    
    const prodName = fault.productName || fault.ProductName;
    const matchesProduct = selectedProduct === 'Tümü' || prodName === selectedProduct;

    const catName = fault.faultCategory || fault.FaultCategory;
    const matchesCategory = selectedCategory === 'Tümü' || catName === selectedCategory;

    const faultDate = new Date(fault.createdDate || fault.CreatedDate).getTime();
    const now = new Date().getTime();
    let matchesTime = true;

    if (timeFilter === '7gun') matchesTime = faultDate >= (now - 7 * 24 * 60 * 60 * 1000);
    else if (timeFilter === '1ay') matchesTime = faultDate >= (now - 30 * 24 * 60 * 60 * 1000);
    else if (timeFilter === '6ay') matchesTime = faultDate >= (now - 180 * 24 * 60 * 60 * 1000);
    else if (timeFilter === 'ozel' && customStartDate && customEndDate) {
      const sTime = new Date(customStartDate).setHours(0, 0, 0, 0);
      const eTime = new Date(customEndDate).setHours(23, 59, 59, 999);
      matchesTime = faultDate >= sTime && faultDate <= eTime;
    }

    return matchesSearch && matchesProduct && matchesCategory && matchesTime;
  });

  const pendingCount = baseFilteredFaults.filter(item => {
    const isRes = item.isResolved !== undefined ? item.isResolved : item.IsResolved;
    return isRes === false;
  }).length;

  const resolvedCount = baseFilteredFaults.filter(item => {
    const isRes = item.isResolved !== undefined ? item.isResolved : item.IsResolved;
    return isRes === true;
  }).length;

  const filteredFaults = baseFilteredFaults.filter(fault => {
    if (activeTab === 'tumu') return true;
    const isRes = fault.isResolved !== undefined ? fault.isResolved : fault.IsResolved;
    return activeTab === 'bekleyen' ? isRes === false : isRes === true;
  }).sort((a, b) => {
    const dateA = new Date(a.createdDate || a.CreatedDate).getTime();
    const dateB = new Date(b.createdDate || b.CreatedDate).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const getImageName = (fault: any) => {
    if (!fault) return null;
    return fault.imageFileName || fault.ImageFileName;
  };

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
    const prodName = item.productName || item.ProductName;
    const barcode = item.barcodeNumber || item.BarcodeNumber;
    const desc = item.defectDescription || item.DefectDescription;
    const cDate = item.createdDate || item.CreatedDate;
    const repName = item.reporterName || item.ReporterName || "Bilinmiyor";
    const categoryName = item.faultCategory || item.FaultCategory || "Kategori Belirtilmemiş";
    const resolverName = item.resolvedByName || item.ResolvedByName || "Bilinmiyor";
    
    // YENİ EKLENEN KISIM: Kartın kendi isResolved durumunu tespit ediyoruz.
    const isRes = item.isResolved !== undefined ? item.isResolved : item.IsResolved;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openDetailModal(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.productName}>{prodName}</Text>
          <Text style={styles.barcode}>#{barcode}</Text>
        </View>
        
        <Text style={styles.cardCategoryText}>Tür: {categoryName}</Text>
        
        <Text style={styles.description} numberOfLines={3}>{desc}</Text>
        
        <View style={styles.infoRowContainer}>
          <View style={styles.iconTextGroup}>
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText}>
              {new Date(cDate).toLocaleDateString('tr-TR')} - {new Date(cDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
            </Text>
          </View>
          
          <View style={styles.iconTextGroup}>
            <Ionicons name="person-outline" size={14} color="#9ca3af" />
            <Text style={styles.infoText} numberOfLines={1}>{repName}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {/* YENİ MANTIK: Sekmeye göre değil, kartın kendi durumuna (!isRes) göre çizim yapıyoruz */}
          {!isRes ? (
            <>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Bekliyor</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.actionPillButton} 
                onPress={() => openResolveModal(targetId)}
                activeOpacity={0.7}
              >
                <Ionicons name="build-outline" size={16} color="white" />
                <Text style={styles.actionPillText}>Çözümle</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
              <View style={styles.resolvedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#0a0d0b" style={{ marginRight: 6 }} />
                <Text style={styles.resolvedBadgeText}>Çözüldü</Text>
              </View>
              <Text style={styles.resolverText}>Çözen: {resolverName}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }; 

  const handleExportAndShare = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      let queryParams = `?tab=${activeTab}&category=${encodeURIComponent(selectedCategory)}&product=${encodeURIComponent(selectedProduct)}&time=${timeFilter}`;
      
      if (searchQuery) {
        queryParams += `&search=${encodeURIComponent(searchQuery)}`;
      }
      
      if (timeFilter === 'ozel' && customStartDate && customEndDate) {
        queryParams += `&startDate=${customStartDate.toISOString()}&endDate=${customEndDate.toISOString()}`;
      }

      const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/FaultyProducts/faulty-products-excel${queryParams}`;

      const timestamp = new Date().getTime();
      const fileName = `Simfer_Ariza_Raporu_${timestamp}.xlsx`;
      const localFilePath = FileSystem.documentDirectory + fileName;

      Alert.alert("İşlem Başladı", "Filtrelenmiş Excel dosyası hazırlanıyor...");

      const { uri, status } = await FileSystem.downloadAsync(apiUrl, localFilePath, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Filtrelenmiş Simfer Raporu',
            UTI: 'com.microsoft.excel.xls' 
          });
        } else {
          Alert.alert("Hata", "Bu cihazda paylaşım menüsü desteklenmiyor.");
        }
      } else {
        Alert.alert("İndirme Başarısız", `Sunucu hatası: ${status}`);
      }
    } catch (error) {
      Alert.alert("Sistem Hatası", String(error));
      console.error(error);
    }
  };                                             
  
  return (
    <View style={styles.container}>                        
      
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Arıza Listesi</Text>
        
        {/* EXCEL BUTONU (KOYU YEŞİL) */}
        <TouchableOpacity 
          style={{ backgroundColor: '#217346', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }} 
          onPress={handleExportAndShare}
        >
          <Ionicons name="document-text-outline" size={18} color="white" style={{ marginRight: 6 }} />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>Excel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'tumu' && styles.activeTab]} onPress={() => setActiveTab('tumu')}>
          <Text style={[styles.tabText, activeTab === 'tumu' && styles.activeTabText]}>Tümü ({pendingCount + resolvedCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'bekleyen' && styles.activeTab]} onPress={() => setActiveTab('bekleyen')}>
          <Text style={[styles.tabText, activeTab === 'bekleyen' && styles.activeTabText]}>Bekleyenler ({pendingCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'cozulen' && styles.activeTab]} onPress={() => setActiveTab('cozulen')}>
          <Text style={[styles.tabText, activeTab === 'cozulen' && styles.activeTabText]}>Çözülenler ({resolvedCount})</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.controlsRow}>
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={openScanner} style={styles.scannerButton}>
            <Ionicons name="barcode-outline" size={24} color="#005b9f" />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="Barkod numarası ara..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchIcon}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
          
          {/* FİLTRE BUTONU */}
          <TouchableOpacity onPress={() => setFilterMenuVisible(true)} style={styles.filterMenuButton}>
            <Ionicons name="options-outline" size={26} color="#005b9f" />
            {(selectedProduct !== 'Tümü' || selectedCategory !== 'Tümü' || timeFilter !== 'tumu') && (
              <View style={styles.filterActiveDot} />
            )}
          </TouchableOpacity>
        </View>
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
              {searchQuery.length > 0 || selectedProduct !== 'Tümü' || selectedCategory !== 'Tümü' || timeFilter !== 'tumu'
                ? 'Seçtiğiniz filtrelere uygun arıza bulunamadı.' 
                : 'Bu listede hiç kayıt bulunmuyor.'}
            </Text>
          }
        />
      )}

      {/* İŞLEMLER VE FİLTRE MENÜSÜ MODALI */}
      <Modal visible={filterMenuVisible} transparent={true} animationType="fade" onRequestClose={() => setFilterMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setFilterMenuVisible(false)}>
          <View style={styles.dropdownModalContent}>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Filtre Seçenekleri</Text>
              <TouchableOpacity onPress={() => setFilterMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.filterChip, { marginBottom: 10, paddingVertical: 12 }]} onPress={() => { setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
              <Ionicons name={sortOrder === 'desc' ? "arrow-down-outline" : "arrow-up-outline"} size={18} color="#005b9f" />
              <Text style={[styles.filterChipText, { fontSize: 14 }]}>{sortOrder === 'desc' ? "Sıralama: En Yeni Üstte" : "Sıralama: En Eski Üstte"}</Text>
            </TouchableOpacity>

            {/* ZAMAN FİLTRESİ BUTONU */}
            <TouchableOpacity 
              style={[styles.filterChip, { marginBottom: 10, paddingVertical: 12 }, timeFilter !== 'tumu' && { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' }]} 
              onPress={() => { setFilterMenuVisible(false); setTimeout(() => setTimeModalVisible(true), 100); }}
            >
              <Ionicons name="calendar-outline" size={18} color={timeFilter !== 'tumu' ? "#0284c7" : "#005b9f"} />
              <Text style={[styles.filterChipText, { fontSize: 14 }, timeFilter !== 'tumu' && { color: '#0369a1' }]}>Zaman: {getTimeLabel()}</Text>
            </TouchableOpacity>

            {/* ÜRÜN FİLTRESİ BUTONU */}
            <TouchableOpacity 
              style={[styles.filterChip, { marginBottom: 10, paddingVertical: 12 }, selectedProduct !== 'Tümü' && { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' }]} 
              onPress={() => { setFilterMenuVisible(false); setTimeout(() => setProductModalVisible(true), 100); }}
            >
              <Ionicons name="cube-outline" size={18} color={selectedProduct !== 'Tümü' ? "#0284c7" : "#005b9f"} />
              <Text style={[styles.filterChipText, { fontSize: 14 }, selectedProduct !== 'Tümü' && { color: '#0369a1' }]} numberOfLines={1}>Ürün: {selectedProduct}</Text>
            </TouchableOpacity>

            {/* KATEGORİ FİLTRESİ BUTONU */}
            <TouchableOpacity 
              style={[styles.filterChip, { marginBottom: 10, paddingVertical: 12 }, selectedCategory !== 'Tümü' && { backgroundColor: '#e0f2fe', borderColor: '#38bdf8' }]} 
              onPress={() => { setFilterMenuVisible(false); setTimeout(() => setCategoryModalVisible(true), 100); }}
            >
              <Ionicons name="layers-outline" size={18} color={selectedCategory !== 'Tümü' ? "#0284c7" : "#005b9f"} />
              <Text style={[styles.filterChipText, { fontSize: 14 }, selectedCategory !== 'Tümü' && { color: '#0369a1' }]} numberOfLines={1}>Hata Türü: {selectedCategory}</Text>
            </TouchableOpacity>

            {/* FİLTRELERİ TEMİZLE BUTONU (PASTEL KIRMIZI) */}
            {(selectedProduct !== 'Tümü' || selectedCategory !== 'Tümü' || timeFilter !== 'tumu') && (
              <TouchableOpacity 
                style={{ marginTop: 10, backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#fca5a5' }} 
                onPress={() => {
                  setSelectedProduct('Tümü');
                  setSelectedCategory('Tümü');
                  setTimeFilter('tumu');
                  setSortOrder('desc');
                }}
              >
                <Text style={{ color: '#ef4444', fontWeight: 'bold', fontSize: 14 }}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            )}

          </View>
        </TouchableOpacity>
      </Modal>

      {/* ÜRÜN MODALI */}
      <Modal visible={productModalVisible} transparent={true} animationType="fade" onRequestClose={() => { setProductModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => { setProductModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Ürün Seçin</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {productList.map((prod, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.dropdownItem, selectedProduct === prod && styles.dropdownItemActive]} 
                  onPress={() => { setSelectedProduct(prod as string); setProductModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}
                >
                  <Text style={[styles.dropdownItemText, selectedProduct === prod && styles.dropdownItemTextActive]}>
                    {prod as string}
                  </Text>
                  {selectedProduct === prod && <Ionicons name="checkmark-circle" size={20} color="#005b9f" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* KATEGORİ MODALI */}
      <Modal visible={categoryModalVisible} transparent={true} animationType="fade" onRequestClose={() => { setCategoryModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => { setCategoryModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Hata Türü Seçin</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categoryList.map((cat, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.dropdownItem, selectedCategory === cat && styles.dropdownItemActive]} 
                  onPress={() => { setSelectedCategory(cat as string); setCategoryModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}
                >
                  <Text style={[styles.dropdownItemText, selectedCategory === cat && styles.dropdownItemTextActive]}>
                    {cat as string}
                  </Text>
                  {selectedCategory === cat && <Ionicons name="checkmark-circle" size={20} color="#005b9f" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ZAMAN FİLTRESİ MODALI */}
      <Modal visible={timeModalVisible} transparent={true} animationType="fade" onRequestClose={() => { setTimeModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => { setTimeModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
          <View style={styles.dropdownModalContent}>
            <Text style={styles.dropdownModalTitle}>Zaman Aralığı Seçin</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {[
                { id: 'tumu', label: 'Tüm Zamanlar' },
                { id: '7gun', label: 'Son 7 Gün' },
                { id: '1ay', label: 'Son 1 Ay' },
                { id: '6ay', label: 'Son 6 Ay' },
                { id: 'ozel', label: 'Özel Tarih Aralığı' }
              ].map((timeOpt) => (
                <TouchableOpacity 
                  key={timeOpt.id} 
                  style={[styles.dropdownItem, timeFilter === timeOpt.id && styles.dropdownItemActive]} 
                  onPress={() => { 
                    if (timeOpt.id === 'ozel') {
                      setTimeModalVisible(false);
                      setTimeout(() => setCustomDateModalVisible(true), 100);
                    } else {
                      setTimeFilter(timeOpt.id as any); 
                      setTimeModalVisible(false); 
                      setTimeout(() => setFilterMenuVisible(true), 100);
                    }
                  }}
                >
                  <Text style={[styles.dropdownItemText, timeFilter === timeOpt.id && styles.dropdownItemTextActive]}>
                    {timeOpt.label}
                  </Text>
                  {timeFilter === timeOpt.id && <Ionicons name="checkmark-circle" size={20} color="#005b9f" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ÖZEL TARİH MODALI */}
      <Modal visible={customDateModalVisible} transparent={true} animationType="fade" onRequestClose={() => { setCustomDateModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => { setCustomDateModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Özel Tarih Aralığı</Text>
            
            <Text style={styles.modalLabel}>Başlangıç Tarihi</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={{ color: customStartDate ? '#1e293b' : '#9ca3af', fontSize: 15 }}>
                {customStartDate ? customStartDate.toLocaleDateString('tr-TR') : 'Tarih Seçmek İçin Dokunun'}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={customStartDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartPicker(false); 
                  if (selectedDate) setCustomStartDate(selectedDate);
                }}
              />
            )}

            <Text style={styles.modalLabel}>Bitiş Tarihi</Text>
            <TouchableOpacity 
              style={styles.dateInput} 
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={{ color: customEndDate ? '#1e293b' : '#9ca3af', fontSize: 15 }}>
                {customEndDate ? customEndDate.toLocaleDateString('tr-TR') : 'Tarih Seçmek İçin Dokunun'}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={customEndDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndPicker(false); 
                  if (selectedDate) setCustomEndDate(selectedDate);
                }}
              />
            )}
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
              <TouchableOpacity onPress={() => { setCustomDateModalVisible(false); setTimeout(() => setFilterMenuVisible(true), 100); }} style={{ marginRight: 20, justifyContent: 'center' }}>
                <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { applyCustomDateFilter(); setTimeout(() => setFilterMenuVisible(true), 100); }} style={styles.actionPillButton}>
                <Text style={styles.actionPillText}>Filtrele</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* DETAY MODALI */}
      <Modal visible={modalVisible} transparent={true} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>✖</Text>
            </TouchableOpacity>

            {selectedFault && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{selectedFault.productName || selectedFault.ProductName}</Text>
                <Text style={styles.modalBarcode}>Barkod: {selectedFault.barcodeNumber || selectedFault.BarcodeNumber}</Text>

                <Text style={styles.modalLabel}>Arıza Türü:</Text>
                <Text style={styles.modalDescription}>{selectedFault.faultCategory || selectedFault.FaultCategory || "Belirtilmemiş"}</Text>

                <Text style={styles.modalLabel}>Arıza Detayı:</Text>
                <Text style={styles.modalDescription}>{selectedFault.defectDescription || selectedFault.DefectDescription}</Text>

                <Text style={styles.modalLabel}>Kayıt Tarihi:</Text>
                <Text style={styles.modalDate}>
                  {new Date(selectedFault.createdDate || selectedFault.CreatedDate).toLocaleDateString('tr-TR')} - {new Date(selectedFault.createdDate || selectedFault.CreatedDate).toLocaleTimeString('tr-TR')}
                </Text>

                <Text style={styles.modalLabel}>Raporlayan Kişi:</Text>
                <Text style={styles.modalText}>
                  {selectedFault.reporterName || selectedFault.ReporterName || "Bilinmiyor"}
                </Text>

                {(selectedFault.isResolved || selectedFault.IsResolved) && (
                  <>
                    <Text style={styles.modalLabel}>Çözüm Detayı:</Text>
                    <Text style={styles.modalDescription}>
                      {selectedFault.resolutionDetails || selectedFault.ResolutionDetails || "Çözüm açıklaması girilmemiş."}
                    </Text>
                    
                    <Text style={styles.modalLabel}>Çözen Kişi:</Text>
                    <Text style={[styles.modalDescription, { color: '#2a3435d5' }]}>
                      {selectedFault.resolvedByName || selectedFault.ResolvedByName || "Bilinmiyor"}
                    </Text>
                    
                    <Text style={styles.modalLabel}>Çözüm Tarihi:</Text>
                    <Text style={styles.modalDate}>
                      {selectedFault.resolvedDate || selectedFault.ResolvedDate 
                        ? `${new Date(selectedFault.resolvedDate || selectedFault.ResolvedDate).toLocaleDateString('tr-TR')} - ${new Date(selectedFault.resolvedDate || selectedFault.ResolvedDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`
                        : "Bilinmiyor"}
                    </Text>
                  </>
                )}

                <View style={styles.imageSectionContainer}>
                  <Text style={styles.modalLabel}>Arıza Fotoğrafı:</Text>
                  
                  {getImageName(selectedFault) ? (
                    imageLoading ? (
                      <ActivityIndicator size="small" color="#005b9f" style={{ marginTop: 20 }} />
                    ) : fullScreenImageUrl ? (
                      <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => setImageFullScreenVisible(true)}
                      >
                        <Image source={{ uri: fullScreenImageUrl }} style={styles.inlineModalImage} resizeMode="cover" />
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

      {/* ÇÖZÜM GİRİŞ MODALI */}
      <Modal visible={resolveModalVisible} transparent={true} animationType="fade" onRequestClose={() => setResolveModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Çözüm Detayı Girin</Text>
            
            <TextInput
              style={styles.modalTextArea}
              placeholder="Arızayı nasıl çözdüğünüzü açıklayın..."
              placeholderTextColor="#9ca3af"
              multiline={true}
              value={resolutionText}
              onChangeText={setResolutionText}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20 }}>
              <TouchableOpacity onPress={() => setResolveModalVisible(false)} style={{ marginRight: 20, justifyContent: 'center' }}>
                <Text style={{ color: '#6b7280', fontWeight: 'bold' }}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitResolution} style={styles.actionPillButton}>
                <Text style={styles.actionPillText}>Çözümü Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FOTOĞRAF TAM EKRAN MODALI */}
      <Modal visible={imageFullScreenVisible} transparent={true} onRequestClose={() => setImageFullScreenVisible(false)}>
        <ImageViewer 
          imageUrls={fullScreenImageUrl ? [{ url: fullScreenImageUrl }] : []}
          enableSwipeDown={true} 
          onSwipeDown={() => setImageFullScreenVisible(false)}
          onCancel={() => setImageFullScreenVisible(false)}
          renderIndicator={() => <></>}
          renderHeader={() => (
            <TouchableOpacity 
              style={{ position: 'absolute', top: 45, right: 20, zIndex: 9999, padding: 10, backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 20 }}
              onPress={() => setImageFullScreenVisible(false)}
            >
              <Ionicons name="close" size={28} color="#ffffff" />
            </TouchableOpacity>
          )}
        />
      </Modal>

      {/* TARAYICI MODALI */}
      <Modal visible={isScannerVisible} transparent={true} animationType="slide">
        <View style={styles.scannerContainer}>
          <CameraView 
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={handleBarCodeScanned}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
            <Text style={styles.scannerText}>Ürün barkodunu çerçeveye hizalayın</Text>
          </View>
          <TouchableOpacity 
            style={styles.scannerCloseButton}
            onPress={() => setIsScannerVisible(false)}
          >
            <Ionicons name="close" size={32} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#005b9f' }, 
  tabText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#005b9f', fontWeight: 'bold' },

  controlsRow: { marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 8, paddingHorizontal: 15, borderWidth: 1, borderColor: '#e2e8f0', height: 48 },
  scannerButton: { marginRight: 10, padding: 5 }, 
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  clearSearchIcon: { marginLeft: 10, padding: 2 },
  
  filterMenuButton: { marginLeft: 10, padding: 5, position: 'relative' },
  filterActiveDot: { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#ffffff' },

  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginRight: 10 },
  filterChipText: { fontSize: 13, color: '#475569', fontWeight: '600', marginLeft: 6 },

  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scannerTarget: { width: 250, height: 250, borderWidth: 2, borderColor: '#005b9f', backgroundColor: 'transparent', borderRadius: 20, marginBottom: 20 },
  scannerText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  scannerCloseButton: { position: 'absolute', top: 50, right: 20, padding: 10, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 25 },

  dropdownModalContent: { backgroundColor: 'white', width: '85%', borderRadius: 12, padding: 10, elevation: 5 },
  dropdownModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f2937', padding: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 5 },
  dropdownItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8 },
  dropdownItemActive: { backgroundColor: '#f0f9ff' },
  dropdownItemText: { fontSize: 15, color: '#4b5563' },
  dropdownItemTextActive: { color: '#005b9f', fontWeight: 'bold' },
  
  card: { backgroundColor: '#ffffff', padding: 16, borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  productName: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  barcode: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
  
  cardCategoryText: { fontSize: 14, color: '#005b9f', fontWeight: '600', marginBottom: 8 },
  resolverText: { fontSize: 13, color: '#059669', fontWeight: 'bold' },

  description: { fontSize: 14, color: '#475569', marginBottom: 12, lineHeight: 20 },
  
  infoRowContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingRight: 10 },
  iconTextGroup: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  infoText: { fontSize: 13, color: '#64748b', marginLeft: 6, marginRight: 10 },
  modalText: { fontSize: 15, color: '#475569', marginBottom: 20 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  pendingBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  pendingBadgeText: { color: '#d97706', fontWeight: 'bold', fontSize: 12 },
  actionPillButton: { flexDirection: 'row', backgroundColor: '#005b9f', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  actionPillText: { color: 'white', fontWeight: 'bold', fontSize: 13, marginLeft: 6 },
  resolvedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  resolvedBadgeText: { color: '#166534', fontWeight: 'bold', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#64748b', fontSize: 15, marginTop: 50 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', width: '100%', maxHeight: '85%', borderRadius: 12, padding: 20, elevation: 5 },
  modalCloseButton: { alignSelf: 'flex-end', padding: 5, marginBottom: 5 },
  modalCloseText: { fontSize: 20, color: '#64748b', fontWeight: 'bold' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 5 },
  modalBarcode: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  modalLabel: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 5 },
  modalDescription: { fontSize: 15, color: '#475569', lineHeight: 22, marginBottom: 20 },
  modalDate: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  
  modalTextArea: { height: 120, borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 15, textAlignVertical: 'top', fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc' },
  dateInput: { justifyContent: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', padding: 12, borderRadius: 8, height: 48, marginBottom: 15 },

  imageSectionContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15, paddingBottom: 20 },
  inlineModalImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  zoomHintContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  zoomHintText: { color: '#64748b', fontSize: 13, fontStyle: 'italic', marginLeft: 5 },
  noImageContainer: { width: '100%', padding: 20, backgroundColor: '#f1f5f9', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  noImageText: { color: '#94a3b8', fontWeight: 'bold', fontStyle: 'italic', marginTop: 10 },
});