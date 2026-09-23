# Devir dokümanı — önceki oturumun özeti

Bu dosya, projeyi başlatan ilk Claude Code oturumunun (Eylül 2026) özetidir. Yeni oturum
buradan bağlamı alır; kod yapısı için `CLAUDE.md` ve `docs/symfony-to-nest.md`'ye bak.

## Kullanıcı

- Almanya'da yaşıyor; iş yerinde **Symfony** ile çalışıyor. Bu projeyi hem **programlama
  öğrenmek** hem **para kazanmak** için kullanmak istiyor → açıklamalar öğretici olsun,
  Symfony karşılıklarını göster.
- Türkçe yazışıyor. Site üç dilli: İngilizce, Almanca, Türkçe.
- Kendi **Hetzner** sunucusuna Docker ile deploy edecek.
- Tercihleri: net öneri ister, uzun seçenek listesi ve arka arkaya çoktan seçmeli soru
  sevmez (bir tanesini yarıda kesti). Beğenmediğini açıkça söyler ("beğenmedim").
- Reddettiği fikir: "diziliş grafiklerini içerik üreticilerine elle hizmet olarak satmak".
- YouTube'da içerik üretmek istiyor; site özellikleri video senaryosu kaynağı olacak.

## Önceki projeler (aynı kullanıcı)

1. **FootTactic** — `merti-dev/foottactic`, dal `claude/futbol-ilk-11-site-n41ycf`.
   Next.js + SQLite, Süper Lig/Premier Lig/La Liga fikstürüne göre ilk 11 kurucu.
   Sonuç: piyasada onlarca benzer diziliş aracı var, tek başına farklılaşmıyor. Beklemede.
2. **Penaltı** — `merti-dev/penalti`. Vite + TS + Canvas arcade (seri atış + serbest vuruş),
   bağımlılıksız, ~23 KB. Tarball olarak teslim edildi; kullanıcı kendisi push edecekti.
3. **Matchnight** — bu repo. Şu anki odak.

## Ürün kararı ve para planı (kullanıcı onayladı: "çok iyi")

**Tespit:** Gelir modelini Şampiyonlar Ligi takvimi belirler. Lig aşaması Eylül–Ocak
(8 hafta, zirve 7-8. haftalar = Ocak, "kim tur atlar?"), kura günleri, eleme turları
Şubat–Mayıs (final zirve), yaz ölü sezon (risk).

**Üç ayak:**
1. **Tahmin ligi (Tippspiel)** — geri gelme sebebi + büyüme motoru. Arkadaş/iş yeri grupları,
   davet linki, maç haftası skor tahmini, puan tablosu. Almanya'da Tippspiel kültürü var;
   rakip **Kicktipp** (CL'yi de destekliyor). Farkımız: 3 dil (Almanya'daki ~3M Türk kökenli
   karışık gruplar), yalnız CL odağı, daha iyi tasarım, her maçta Elo "tahmin ipucu".
   ⚠️ **Ücretsiz kalmalı** — katılım ücreti + para ödülü Almanya'da kumar sayılır.
2. **Maç önü sayfaları** — Elo olasılığı, geçmiş, form; Ocak'ta senaryo hesaplayıcı.
   SEO ("Bayern vs Arsenal prediction"), YouTube, affiliate yerleşimi burada.
3. **Arşiv + "bu tarihte"** — kalıcı içerik, yaz boşluğunu ve YouTube Shorts'u taşır.

**Gelir katmanları (sırayla):** reklam (Impressum/gizlilik/çerez izni önce) → YouTube
(haftalık "Elo tahminleri" + günlük Shorts) → **bahis affiliate** (yalnız DE/EN trafik,
yalnız lisanslı operatörler: Almanya'da GGL beyaz listesi, İngiltere'de UKGC; Türkçe
trafiğe bahis linki YOK) → premium gruplar (2. sezon) → sponsorluk.

**Hedef ölçüt:** ilk sezonda 2.000 aktif tahminci (≈ sezon içinde ~100k sayfa/ay).
**Ocak sonunda 500'ün altındaysa modeli değiştir.** Reklam tahmini RPM $3–8 → ~$300–800/ay
(varsayım, garanti değil).

**Almanya hukuk listesi:** Impressum, Datenschutzerklärung, çerez banner'ı (reklam/analitik
gelince), para gelince Gewerbeanmeldung (Kleinunternehmer eşiği için Steuerberater),
site adında "Champions League" yok, UEFA/kulüp logosu yok. Hetzner de Almanya'da (DSGVO'ya uygun).

**Tamamlanan:** Aşama 1 (veri hattı, Elo, 3 dil, site). **Sıradaki:** Aşama 2 — tahmin ligi.

## Teknik durum (commit 1ce5a13)

- Monorepo: `packages/core` (saf TS), `apps/api` (NestJS 12 + MikroORM 7 + SQLite),
  `apps/web` (Next.js 15). Neden Nest: kullanıcı Symfony biliyor ve öğrenmek istiyor.
- **188 test yeşil**: core 176 (gerçek 15 sezon verisiyle), api 12 e2e.
- Veri: openfootball/champions-league (CC0) 2011-12 … 2025-26 = 1997 maç, 108 kulüp.
  **2026-27 openfootball'da henüz yok**; site 2025-26'yı gösterip bunu ana sayfada söylüyor.
- Elo parametreleri (backtest ile, eğitim 2013-23): K=40, ev avantajı 50, yeni kulüp 1300,
  sezon başı ortalamaya çekme %10, beraberlik 0.27·e^(−|Δ|/500).
  Görülmemiş 2023-26 (503 maç): log loss 0.933 / Brier 0.549 / favori %59.6.
  Karşılaştırma: geçmiş frekans 1.021, eşit olasılık 1.099.

### Doğrulanmamış / kullanıcıda bekleyen
- **football-data.org adaptörü gerçek anahtarla hiç çalışmadı** (bulut oturumu o hosta
  erişemedi). Kullanıcı ücretsiz anahtar alıp README'deki curl ile CL'yi doğrulamalı;
  ilk senkronda log'lara bak (atlanan maçlar, arşivde olmayan kulüpler → alias tablosu).
- **Docker imajları hiç derlenmedi** (bulutta daemon yoktu); çalışma zamanı katmanları
  taklit edilerek doğrulandı. İlk `docker compose build` kullanıcıda.
- Künye bilgileri (`IMPRINT_*`) kullanıcı tarafından doldurulmalı.

## Öğrenilen tuzaklar (tekrar yaşanmasın)

- **Nest 12 yalnız ESM.** Göreli import'lar `.js` uzantılı. DI decorator metadata ister →
  API `nest build` (tsc) ile derlenir; **tsx/esbuild metadata üretmez**. Vitest'e
  `unplugin-swc` takılı.
- `nest-commander` Nest 11 çekip DI'ı iki kopyaya bölüyordu → kaldırıldı; CLI
  `createApplicationContext` ile yazıldı. Kök `package.json`'da `overrides` Nest'i tek kopya tutar.
- MikroORM `forRootAsync` + `useFactory` kullanırken modül seviyesinde **`driver: SqliteDriver`**
  şart, yoksa `@mikro-orm/sqlite`'ın EntityManager'ı enjekte edilemez.
- MikroORM decorator'ları v7'de `@mikro-orm/decorators/legacy`'den; `ReflectMetadataProvider` de orada.
- Migration snapshot adı sabit (`snapshotName: '.snapshot-matchnight'`), yoksa testler
  `:memory:` adıyla kaynak klasöre dosya yazıyor.
- openfootball formatı: 4 başlık düzeni ("Group A", "Gruppe A", "Group, Matchday N",
  "League, Matchday N"), 5 skor biçimi (a.e.t., pen.). 2023-24'te grup harfi yok → maç
  grafiğinden çıkarılıyor, harfler `groups.ts`'teki çapa takımlarla. Monaco'nun ülke kodu
  FRA→MCO değişti. Kulüp adı eşlemeleri `teams.ts`.
- Oynamayan kulüplerin Elo'su yıllar içinde ortalamaya kayıyor → sıralama yalnız son iki
  sezonda oynamışları gösteriyor (yöntem sayfasında yazıyor).
- Görsel: grafik renkleri dataviz doğrulayıcısından geçti; beraberlik nötr gri (bilinçli).

## Çalışma biçimi (kullanıcıyla)

- Söylemeden önce doğrula; doğrulanamayanı açıkça belirt.
- Mantığı gerçek veriyle test et (ör. "hesaplanan tur atlayanlar = gerçek").
- Commit mesajları Türkçe. Ekran görüntüsüyle görsel kontrol yap.
- Oturum bulutta çalışıyorsa: yalnız başlangıçta seçilen repoya push edilebilir.

## Aşama 2 için başlangıç notları (tahmin ligi)

- Kullanıcı hesabı (e-posta + magic link ya da parola; DSGVO'ya dikkat), grup, davet
  linki (token), maç başına skor tahmini (maç başlayınca kilitlenir), puanlama
  (ör. tam skor 3 / doğru sonuç + gol farkı 2 / doğru sonuç 1 — kullanıcıyla netleştir),
  haftalık ve genel puan tablosu.
- `matches` satırları senkronda upsert ediliyor, kimlikleri kararlı → tahminler güvenle
  `match_id`'ye bağlanabilir. Ertelenip tarihi değişen maçta kimlik değişir (id'de tarih var):
  tahmin tablosu eklenmeden önce bunun çözümü düşünülmeli.
- Nest'te: `auth` modülü, Guard (Symfony voter/firewall karşılığı), DTO doğrulama.
- Tahminler ücretsiz; para ödülü yok.
