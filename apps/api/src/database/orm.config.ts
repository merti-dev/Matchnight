import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { SqliteDriver, type Options } from '@mikro-orm/sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { MetaEntry } from '../meta/meta.entity.js';
import { Match } from '../matches/match.entity.js';
import { RatingPoint } from '../ratings/rating-point.entity.js';
import { Team } from '../teams/team.entity.js';

export const ENTITIES = [Team, Match, RatingPoint, MetaEntry];

/** Derlenmiş (dist) ve kaynak (src) migration dizinleri. */
export const MIGRATIONS_DIST = resolve(import.meta.dirname, 'migrations');
export const MIGRATIONS_SRC = resolve(import.meta.dirname, '../../src/database/migrations');

/** Doctrine'deki doctrine.yaml karşılığı. */
export function ormOptions(dbPath: string): Options {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  return {
    driver: SqliteDriver,
    dbName: dbPath,
    entities: ENTITIES,
    metadataProvider: ReflectMetadataProvider,
    extensions: [Migrator],
    migrations: {
      path: MIGRATIONS_DIST,
      pathTs: MIGRATIONS_SRC,
      glob: '!(*.d).{js,ts}',
      transactional: true,
      snapshot: true,
      // Anlık görüntü adı veritabanı adından türetilmesin (testlerde :memory:, üretimde /data/…)
      snapshotName: '.snapshot-matchnight',
    },
  };
}
