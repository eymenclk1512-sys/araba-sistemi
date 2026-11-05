CARDBOARD WHEEL - ILK SURUM

Bu ZIP, Android telefon tarayicisinda acilabilen ilk prototiptir.
Kamera + MediaPipe el takibi + iki bilek arasindaki yon degisiminden
yaklasik direksiyon acisi gosterimi bulunur.

CALISTIRMA
1. ZIP'i bilgisayarinda bir klasore cikart.
2. Dosyalari HTTPS destekleyen bir statik web sunucusuna yukle.
   Ornek: GitHub Pages veya Vercel.
3. Yayindaki HTTPS adresini Android Chrome'da ac.
4. Kamera izni ver ve "Kamerayi ac" dugmesine bas.
5. Iki elinle karton direksiyonu kavra, duz konumdayken kalibre et.

ONEMLI SINIRLAMALAR
- Kamera izni icin HTTPS veya localhost gerekir.
- Ilk acilista MediaPipe dosyalari internetten indirilir.
- Bu surum karton direksiyonun kendisini fiziksel olarak tanimaz.
  Iki elin bilek konumlari arasindaki yonu kullanarak yaklasik aci hesaplar.
- Tamamen duz, simetrik ve isaretsiz yuvarlak kartonun kendi donusunu
  yalnizca goruntusunden anlamak mumkun degildir. Daha guvenilir takip icin
  sonraki surumde direksiyon geometrisi/kenari ve el takibi birlikte gelistirilmeli.
- Bu surum henuz oyunlara tus/gamepad verisi gondermez. Oyun baglantisi
  icin sonraki asamada PC alici uygulamasi veya desteklenen giris protokolu gerekir.
- PWA'nin uygulama kabugu onbellege alinabilir; AI model dosyasi ve CDN
  bagimliliklari ilk yukleme ve model erisimi icin internet isteyebilir.

GIZLILIK
Video tarayici icinde islenir; bu prototipte goruntu kaydi veya sunucuya
video yukleme kodu yoktur.
