import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

/** Anahtar/değer: son senkron zamanı, backtest sonucu… Değerler JSON. */
@Entity({ tableName: 'meta' })
export class MetaEntry {
  @PrimaryKey({ type: 'string' })
  key: string;

  @Property({ type: 'json' })
  value: unknown;
}
