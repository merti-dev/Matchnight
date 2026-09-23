import { EntityRepository } from '@mikro-orm/sqlite';
import type { Team } from './team.entity.js';

/** Doctrine karşılığı: class TeamRepository extends ServiceEntityRepository */
export class TeamRepository extends EntityRepository<Team> {
  /** Son iki sezonda oynamış kulüpler, Elo'ya göre. */
  async activeRanking(sinceSeason: string): Promise<Team[]> {
    return this.find({ elo: { $ne: null }, lastSeason: { $gte: sinceSeason } }, { orderBy: { elo: 'desc' } });
  }
}
