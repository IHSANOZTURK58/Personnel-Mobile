import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#005b9f', // Simfer'in kurumsal mavi rengi
        },
        headerTintColor: '#ffffff', // Üst bardaki yazıların ve geri okunun rengi
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center', // Başlığı ortala
      }}
    >
      {/* 1. Login Sayfası (Burada üst bara gerek yok) */}
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />

      {/* 2. Admin Ana Sayfası */}
      <Stack.Screen 
        name="home" 
        options={{ title: 'Simfer Raporlama' }} 
      />

      {/* 3. Personel Listesi */}
      <Stack.Screen 
        name="personel" 
        options={{ title: 'Personel Yönetimi' }} 
      />

      {/* 4. Personel Ekleme Sayfası */}
      <Stack.Screen 
        name="personel-ekle" 
        options={{ title: 'Yeni Personel Ekle' }} 
      />

      {/* 5. İşçi Arıza Bildirim Sayfası */}
      <Stack.Screen 
        name="kamera" 
        options={{ title: 'Arıza Bildir' }} 
      />

      {/* 6. Arıza Listesi Sayfası */}
      <Stack.Screen 
        name="liste" 
        options={{ title: 'Arızalı Ürünler' }} 
      />
    </Stack>
  );
}