import { Embeddable, Property } from '@mikro-orm/decorators/legacy';

/**
 * Doctrine karşılığı: #[ORM\Embeddable]. Ayrı tablo değil; sahibi olan
 * entity'nin tablosunda önekli sütunlar olarak durur (score_home, score_away).
 */
@Embeddable()
export class ScoreValue {
  @Property({ type: 'integer' })
  home: number;

  @Property({ type: 'integer' })
  away: number;
}

/** Maç öncesi Elo, maç sonrası Elo (oynandıysa) ve sonuç olasılıkları. */
@Embeddable()
export class EloSnapshot {
  @Property({ type: 'double' })
  homeBefore: number;

  @Property({ type: 'double' })
  awayBefore: number;

  @Property({ type: 'double', nullable: true })
  homeAfter: number | null;

  @Property({ type: 'double', nullable: true })
  awayAfter: number | null;

  @Property({ type: 'double' })
  pHome: number;

  @Property({ type: 'double' })
  pDraw: number;

  @Property({ type: 'double' })
  pAway: number;
}
