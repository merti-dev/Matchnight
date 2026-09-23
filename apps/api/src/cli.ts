import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { CliModule } from './app.module.js';
import { MIGRATIONS_SRC } from './database/orm.config.js';
import { SyncService } from './sync/sync.service.js';

/**
 * bin/console karşılığı: uygulamayı HTTP sunucusu olmadan başlatıp servisleri kullanır.
 *   node dist/cli.js migrate            bekleyen migration'ları uygula
 *   node dist/cli.js migration:create   entity'lerle şema arasındaki farktan migration üret
 *   node dist/cli.js sync               veriyi çek, Elo'yu hesapla, yaz
 */
const [command, ...args] = process.argv.slice(2);
const app = await NestFactory.createApplicationContext(CliModule, { logger: ['log', 'warn', 'error'] });
const orm = app.get(MikroORM);

try {
  switch (command) {
    case 'migrate': {
      const done = await orm.migrator.up();
      console.log(done.length ? `uygulandı: ${done.map((m) => m.name).join(', ')}` : 'bekleyen migration yok');
      break;
    }
    case 'migration:create': {
      const initial = args.includes('--initial');
      const result = await orm.migrator.create(MIGRATIONS_SRC, false, initial);
      console.log(result.fileName ? `oluşturuldu: src/database/migrations/${result.fileName}` : 'şema güncel, migration gerekmiyor');
      break;
    }
    case 'sync': {
      await orm.migrator.up();
      const r = await app.get(SyncService).run();
      console.log(`✓ ${r.matches} maç · ${r.teams} kulüp · ${r.seasons[0]}…${r.seasons.at(-1)} · güncel sezon: ${r.liveSource} · ${r.durationMs} ms`);
      if (r.newTeams.length) console.log(`  ! arşivde olmayan kulüpler: ${r.newTeams.join(', ')}`);
      for (const w of r.warnings) console.log(`  ! ${w}`);
      break;
    }
    default:
      console.log('kullanım: node dist/cli.js <migrate | migration:create [--initial] | sync>');
      process.exitCode = command ? 1 : 0;
  }
} finally {
  await app.close();
}
