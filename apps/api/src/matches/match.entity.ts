import { Embedded, Entity, Enum, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import type { MatchStatus, Stage } from '@matchnight/core';
import { EloSnapshot, ScoreValue } from '../common/embeddables.js';
import { Team } from '../teams/team.entity.js';
import { MatchRepository } from './match.repository.js';

@Entity({ tableName: 'matches', repository: () => MatchRepository })
@Index({ properties: ['season', 'stage'] })
export class Match {
  /** Kararlı kimlik: sezon + gün + takımlar ("2025-26-2025-09-16-athletic-club-arsenal"). */
  @PrimaryKey({ type: 'string' })
  id: string;

  @Property({ type: 'string' })
  season: string;

  @Enum({ items: ['GROUP', 'LEAGUE', 'PLAYOFF', 'R16', 'QF', 'SF', 'FINAL'], type: 'string' })
  stage: Stage;

  @Property({ type: 'string', nullable: true })
  grp: string | null = null;

  /** Lig haftası ya da eleme ayağı. */
  @Property({ type: 'integer', nullable: true })
  round: number | null = null;

  @Property({ type: 'datetime' })
  @Index()
  kickoff: Date;

  /** Berlin saatine göre maç günü "YYYY-MM-DD" — "bu tarihte" sorguları için. */
  @Property({ type: 'string', length: 10 })
  @Index()
  day: string;

  @Property({ type: 'boolean' })
  timeKnown: boolean = true;

  /** Doctrine karşılığı: #[ORM\ManyToOne(targetEntity: Team::class)] */
  @ManyToOne(() => Team)
  home: Team;

  @ManyToOne(() => Team)
  away: Team;

  @Enum({ items: ['finished', 'scheduled', 'live', 'postponed'], type: 'string' })
  status: MatchStatus;

  @Embedded({ entity: () => ScoreValue, nullable: true, prefix: 'score_' })
  score: ScoreValue | null = null;

  @Embedded({ entity: () => ScoreValue, nullable: true, prefix: 'ht_' })
  halfTime: ScoreValue | null = null;

  @Property({ type: 'boolean' })
  extraTime: boolean = false;

  @Embedded({ entity: () => ScoreValue, nullable: true, prefix: 'pen_' })
  penalties: ScoreValue | null = null;

  @Property({ type: 'boolean' })
  neutral: boolean = false;

  /** openfootball ya da football-data. */
  @Property({ type: 'string' })
  source: string;

  @Embedded({ entity: () => EloSnapshot, nullable: true, prefix: 'elo_' })
  elo: EloSnapshot | null = null;
}
