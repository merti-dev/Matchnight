# Symfony'den NestJS'e: bu repo üzerinden

Symfony biliyorsan NestJS'in %80'ini zaten biliyorsun: ikisi de DI container'lı,
modül/bundle yapılı, controller-service-repository katmanlı framework'ler. Bu doküman
her kavramı **bu repodaki gerçek bir dosyayla** eşliyor.

## Kavram eşlemesi

| Symfony | NestJS / MikroORM | Bu repoda |
|---|---|---|
| `public/index.php` + Kernel | `main.ts` + `NestFactory.create()` | `apps/api/src/main.ts` |
| `bin/console` | `NestFactory.createApplicationContext()` (HTTP olmadan) | `apps/api/src/cli.ts` |
| Bundle | `@Module()` | `apps/api/src/matches/matches.module.ts` |
| `services.yaml` autowiring | Provider + constructor injection | `MatchesService` constructor'ı |
| Interface'e alias (`App\Foo: '@App\Bar'`) | Token + `{ provide, useClass }` | `sync/sync.module.ts`, `sync/sources/match-source.ts` |
| `parameters` + `%env()%` | `ConfigService` + tipli sarmalayıcı | `config/app.config.ts` |
| Controller + `#[Route]` | `@Controller()` + `@Get()` | `seasons/seasons.controller.ts` |
| Route requirements | Pipe (`PipeTransform`) | `seasons/season-param.pipe.ts` |
| `#[MapQueryString]` + Validator | DTO + `class-validator` + `ValidationPipe` | `common/query.dto.ts`, `bootstrap.ts` |
| `NotFoundHttpException` | `NotFoundException` | `teams/teams.service.ts` |
| Serializer / Normalizer | Mapper fonksiyonu (entity → DTO) | `matches/match.mapper.ts` |
| Doctrine Entity + attribute'lar | MikroORM Entity + decorator'lar | `matches/match.entity.ts` |
| `#[ORM\ManyToOne]` | `@ManyToOne()` | `Match.home`, `Match.away` |
| `#[ORM\Embeddable]` | `@Embeddable()` + `@Embedded()` | `common/embeddables.ts` |
| `ServiceEntityRepository` | `EntityRepository` + `repository: () => X` | `matches/match.repository.ts` |
| `$em->flush()` / Unit of Work | `em.flush()` — aynı kavram | (MikroORM Doctrine'den esinlenmiş) |
| `wrapInTransaction()` | `em.transactional()` | `sync/sync.service.ts` |
| Doctrine Migrations | MikroORM Migrator | `database/migrations/`, `cli.ts migration:create` |
| `doctrine:schema:validate` | Şema farkı testi | `apps/api/test/api.e2e.test.ts` → "şema" |
| Symfony Scheduler | `@nestjs/schedule` + `SchedulerRegistry` | `sync/sync.scheduler.ts` |
| `WebTestCase` | `Test.createTestingModule()` + gerçek HTTP | `apps/api/test/api.e2e.test.ts` |

## Farklı olan birkaç şey

**1. Interface'ler çalışma anında yok.** PHP'de interface'ler çalışma anında vardır, Symfony
onları doğrudan autowire eder. TypeScript'te derlemeden sonra silinirler; Nest bu yüzden bir
**token** ister (`ARCHIVE_SOURCE`) ve `@Inject(TOKEN)` ile enjekte eder.

**2. DI tip bilgisini decorator metadata'dan okur.** `emitDecoratorMetadata` açık olmalı ve
kodu `tsc` (ya da SWC) derlemeli. esbuild/tsx bu bilgiyi üretmez; bu yüzden API `nest build`
ile derleniyor, testlerde Vitest'e SWC eklentisi takılı (`apps/api/vitest.config.ts`).

**3. Request scope varsayılan değil.** Symfony servisleri istek başına yaşar gibi düşünülür;
Nest'te provider'lar varsayılan olarak **singleton**. İstek başına izole EntityManager'ı
MikroORM'un Nest modülü bizim yerimize ayarlıyor (RequestContext). HTTP dışında çalışan
kod (zamanlayıcı) için `em.fork()` kullanılıyor — bkz. `SyncService`.

**4. Entity dışarı sızmaz.** API her zaman `@matchnight/core` içindeki DTO tiplerini döner;
web de aynı tipleri okur. Sözleşme tek dosyada: `packages/core/src/api-types.ts`.

## Yeni bir özellik eklerken sırayla

Örnek: "maç sayfasına hakem bilgisi ekle".

1. **Entity:** `Match`'e `@Property() referee: string | null` ekle.
2. **Migration:** `npm run build -w @matchnight/api && node apps/api/dist/cli.js migration:create`
   → `src/database/migrations/` altında yeni dosya. Oku, sonra commit'le.
3. **Veri:** kaynak adaptöründe (`packages/core/src/football-data.ts`) alanı doldur.
4. **Sözleşme:** `MatchDto`'ya alanı ekle (`packages/core/src/api-types.ts`).
5. **Mapper:** `toMatchDto()` içinde eşle.
6. **Web:** maç sayfasında göster.
7. **Test:** `npm test` — migration unutulduysa şema testi "migration eksik" diye kırılır.

## Nerede ne var

```
packages/core   framework'süz domain: parser, Elo, puan durumu, eşleşme çözücü, API sözleşmesi
apps/api        NestJS: modüller, entity'ler, senkron, REST
apps/web        Next.js: sayfalar, bileşenler, API istemcisi (lib/api.ts — bir sınıf)
```

`packages/core` bilerek hiçbir framework'e bağlı değil: Elo'yu ya da puan durumunu
değiştirmek için Nest'i ya da Next'i bilmen gerekmez, testleri de milisaniyede koşar.
