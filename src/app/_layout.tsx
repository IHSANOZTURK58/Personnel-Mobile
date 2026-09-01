import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#005b9f',
        },
        headerTintColor: '#ffffff', 
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center', 
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }} 
      />

      <Stack.Screen 
        name="home" 
        options={{ title: 'Simfer Raporlama' }} 
      />

      <Stack.Screen 
        name="personel" 
        options={{ title: 'Personel Yönetimi' }} 
      />

      <Stack.Screen 
        name="personel-ekle" 
        options={{ title: 'Yeni Personel Ekle' }} 
      />

      <Stack.Screen 
        name="kamera" 
        options={{ title: 'Arıza Bildir' }} 
      />

      <Stack.Screen 
        name="liste" 
        options={{ title: 'Arızalı Ürünler' }} 
      />
    </Stack>
  );
}