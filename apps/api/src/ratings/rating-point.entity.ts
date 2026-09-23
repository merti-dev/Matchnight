import { Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { Match } from '../matches/match.entity.js';
import { Team } from '../teams/team.entity.js';

/** Bir kulübün bir maçtan sonraki Elo'su — takım sayfasındaki grafik bundan çiziliyor. */
@Entity({ tableName: 'rating_points' })
@Index({ properties: ['team', 'kickoff'] })
export class RatingPoint {
  @PrimaryKey({ type: 'integer', autoincrement: true })
  id: number;

  @ManyToOne(() => Team)
  team: Team;

  @ManyToOne(() => Match, { deleteRule: 'cascade' })
  match: Match;

  @Property({ type: 'datetime' })
  kickoff: Date;

  @Property({ type: 'double' })
  rating: number;
}
