# Matchnight

Şampiyonlar Ligi maç merkezi: fikstür, sonuçlar, puan durumu, eleme turları ve her maç için
**şeffaf bir Elo modelinden** kazanma olasılıkları. İngilizce, Almanca, Türkçe.

> Matchnight bağımsız bir taraftar projesidir; UEFA ya da herhangi bir kulüple bağlantısı yoktur.

## Mimari

```
packages/core   Framework'süz domain mantığı (saf TypeScript, 176 test)
                openfootball ayrıştırıcı · football-data adaptörü · Elo · puan durumu
                eşleşme çözücü (toplam skor/deplasman golü/penaltı) · API sözleşmesi
apps/api        NestJS 12 + MikroORM 7 + SQLite
                REST API · periyodik senkron · migration'lar · CLI (bin/console karşılığı)
apps/web        Next.js 15 · 3 dil · veriyi yalnızca API'den okur
```

Symfony biliyorsan önce **[docs/symfony-to-nest.md](docs/symfony-to-nest.md)**: her kavramın
bu repodaki karşılığı ve yeni özellik eklerken izlenecek sıra.

## Gereksinimler

- Node **22.17+** (MikroORM 7 bunu istiyor)
- Docker (sadece deploy için)

## Geliştirme

```bash
npm install
npm run build -w @matchnight/core   # api ve web, core'un derlenmiş halini kullanıyor
cp .env.example .env

npm run dev:api    # http://localhost:3001/api — açılışta migration + ilk senkron
npm run dev:web    # http://localhost:3000     — ayrı bir terminalde
```

İlk açılışta API, openfootball arşivini `data/archive`'a indirir (repoda da bir kopyası var,
ağ yoksa o kullanılır) ve 2011-12'den bu yana ~2000 maçı SQLite'a yazar.

### Güncel sezon (2026-27)

openfootball güncel sezonu genelde gecikmeli yayımlıyor. Güncel fikstür ve skorlar için
[football-data.org](https://www.football-data.org/client/register)'dan ücretsiz anahtar alıp
`.env`'e yaz:

```bash
FOOTBALL_DATA_TOKEN=anahtarın
```

Önce anahtarın Şampiyonlar Ligi'ni kapsadığını doğrula:

```bash
curl -H "X-Auth-Token: $FOOTBALL_DATA_TOKEN" "https://api.football-data.org/v4/competitions/CL/matches?season=2026" | head -c 400
```

> football-data adaptörü 23.09.2026'da gerçek yanıtla doğrulandı: 2026-27 lig aşamasının 144 maçı
> atlanmadan işleniyor, 36 kulübün arşivdekilerle eşleşmesi testte
> (`packages/core/tests/fixtures/football-data/`). **Ön eleme turları football-data'nın ücretsiz
> verisinde yok**, bu yüzden sitede de yok. Kulüp ülkeleri ayrı bir istekle
> (`/competitions/CL/teams`) geliyor; o yanıt henüz gerçek veriyle denenmedi. Yeni bir kulüp adı
> eşleşmezse log'da `arşivde olmayan kulüpler` uyarısı çıkar; `packages/core/src/teams.ts`'teki
> alias tablosuna ekle.
>
> Ücretsiz katman: dakikada 10 istek (senkron 30 dakikada bir 2 istek atıyor), kaynak gösterimi
> gerekli (sitenin alt bilgisinde var). Reklam eklemeden önce football-data.org kullanım şartlarını oku.

### Komutlar

| Komut | Ne yapar |
|---|---|
| `npm test` | Bütün testler (core birim testleri + API e2e) |
| `npm run typecheck` | Üç paketin tip kontrolü |
| `npm run backtest` | Elo parametre araması + görülmemiş sezonlarda değerlendirme |
| `node apps/api/dist/cli.js sync` | Elle senkron |
| `node apps/api/dist/cli.js migrate` | Bekleyen migration'ları uygula |
| `node apps/api/dist/cli.js migration:create` | Entity değişikliğinden migration üret |

## Elo modeli

Formül, parametreler ve sınırlamalar sitede `/method` sayfasında. Kısaca:

- Parametreler 2013-14 … 2022-23 sezonlarında grid aramasıyla seçildi.
- Model, **hiç görmediği** 2023-24 … 2025-26 sezonlarında (503 maç):

| Yöntem | Log loss ↓ | Brier ↓ | Favori kazandı |
|---|---|---|---|
| Her sonuç 1/3 | 1.099 | 0.667 | %50 |
| Geçmiş sonuç frekansları | 1.021 | 0.616 | %50 |
| **Matchnight Elo** | **0.933** | **0.549** | **%60** |

Bu rakamlar her senkronda yeniden hesaplanıp sitede gösteriliyor.

## API

| Uç nokta | Açıklama |
|---|---|
| `GET /api/meta` | Son senkron, sezonlar, model parametreleri, değerlendirme |
| `GET /api/seasons` | Sezonlar ve şampiyonlar |
| `GET /api/seasons/:season/standings` | Puan durumu (grup ya da lig aşaması) |
| `GET /api/seasons/:season/knockouts` | Eleme eşleşmeleri |
| `GET /api/seasons/:season/matches` | Sezonun bütün maçları |
| `GET /api/matches/upcoming?limit=` | Sıradaki maçlar |
| `GET /api/matches/latest?limit=` | Son sonuçlar |
| `GET /api/matches/on-this-day?date=MM-DD` | Bu tarihte oynanan maçlar |
| `GET /api/matches/:id` | Maç + ikili geçmiş + form |
| `GET /api/teams/ranking` | Aktif kulüplerin Elo sıralaması |
| `GET /api/teams/:id` | Kulüp: Elo geçmişi, sezon sezon yolculuk |
| `GET /api/health` | Sağlık kontrolü |

## Deploy (Hetzner)

```bash
git clone <repo> && cd matchnight
cp .env.example .env   # FOOTBALL_DATA_TOKEN, SITE_URL, IMPRINT_* doldur
docker compose up -d --build
```

- `web` 3000 portunda; `api` dışarı açık değil, sadece iç ağdan konuşuyor.
- SQLite ve arşiv `matchnight-data` volume'ünde.
- Caddy örneği:
  ```caddy
  matchnight.example.com {
      reverse_proxy 127.0.0.1:3000
  }
  ```
  (compose'taki portu `127.0.0.1:3000:3000` yap.)

> Docker imajları bu repoyu hazırlarken derlenemedi (ortamda Docker daemon yoktu). Onun yerine
> her imajın çalışma zamanı katmanı birebir taklit edilerek doğrulandı: API yalnızca üretim
> bağımlılıklarıyla açılıyor, migration + senkron çalışıyor; web standalone çıktısı sayfaları
> ve statik dosyaları servis ediyor. İlk `docker compose build` senin makinende olacak.

## Almanya için yasal notlar

- **Künye (Impressum):** `IMPRINT_NAME`, `IMPRINT_ADDRESS`, `IMPRINT_EMAIL` doldurulmadan
  sayfa "yapılandırılmadı" der — sahte künye yayına çıkmaz.
- **Gizlilik:** Şu an çerez, analiz ya da reklam yok; metin buna göre yazıldı. Reklam ya da
  analiz eklendiğinde metin güncellenmeli ve çerez onayı eklenmeli.
- **Marka:** Site adında "Champions League" geçmiyor, UEFA ya da kulüp logosu kullanılmıyor.
- Metinler bir başlangıç şablonudur, hukuki danışmanlık değildir.

## Veri kaynakları

- [openfootball/champions-league](https://github.com/openfootball/champions-league) — CC0 (kamu malı), 2011-12'den bu yana
- [football-data.org](https://www.football-data.org) — güncel sezon (isteğe bağlı, ücretsiz katman)

## Sıradaki adım

Tahmin ligi (Tippspiel): kullanıcı hesabı, arkadaş grupları, davet linki, maç haftası
tahminleri ve puan tablosu. Tahminler `matches` tablosuna bağlanacak; bu yüzden senkron
maçları silmek yerine upsert ediyor (kimlikler kararlı).
