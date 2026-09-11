# Simfer Arıza Takip Mobil Uygulaması

Simfer personellerinin sahadaki arızaları fotoğraflı olarak sisteme kaydedebilmesini ve takip edebilmesini sağlayan çapraz platform (iOS/Android) mobil uygulamadır.

**Kullanılan Teknolojiler ve Kütüphaneler**
* React Native & Expo (Stabilite için Expo Go 5.4 sürümü ile çalışılmaktadır)
* Expo Router (Dosya tabanlı modern navigasyon)
* Axios (Asenkron API haberleşmesi)
* AsyncStorage (Cihaz içi kalıcı JWT token saklama)
* Expo Camera & File System (Kamera erişimi ve medya/fotoğraf işleme)
* React Native Image Zoom Viewer (Arıza fotoğraflarını yakınlaştırarak inceleme)
* React Native Picker & DateTimePicker (Kategori ve tarih seçim arayüzleri)
* Expo Sharing (İçerik paylaşım yönetimi)
* Expo Vector Icons (Ionicons arayüz ikonları)

**⚙️ Bağlantılı API Projesi**
Bu mobil uygulama, veritabanı, önbellek ve medya yönetimi işlemleri için özel olarak tasarlanmış .NET tabanlı backend servisi ile entegre çalışmaktadır. API kaynak kodlarına ve Docker mimarisine buradan ulaşabilirsiniz:
👉 [Simfer Arıza Takip API Reposu](https://github.com/IHSANOZTURK58/Personnel-API)

**Kurulum ve Çalıştırma**
1. Proje bağımlılıklarını yükleyin:
   npm install

2. Geliştirme sunucusunu başlatın:
   npx expo start --clear

3. Uyumlu Expo Go (5.4) uygulaması ile giriş yaparak yerel ağ üzerinden projeyi telefonunuzda görüntüleyin.
