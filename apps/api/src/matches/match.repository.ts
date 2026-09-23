import { EntityRepository } from '@mikro-orm/sqlite';
import type { Match } from './match.entity.js';

/**
 * Maç sorguları tek yerde. Takımlar her zaman birlikte yükleniyor (populate),
 * çünkü her ekranda isimleri gerekiyor — Doctrine'deki fetch join'in karşılığı.
 */
export class MatchRepository extends EntityRepository<Match> {
  private readonly withTeams = { populate: ['home', 'away'] as const };

  bySeason(season: string): Promise<Match[]> {
    return this.find({ season }, { ...this.withTeams, orderBy: { kickoff: 'asc', id: 'asc' } });
  }

  byId(id: string): Promise<Match | null> {
    return this.findOne({ id }, this.withTeams);
  }

  upcoming(limit: number, now = new Date()): Promise<Match[]> {
    return this.find(
      { status: { $in: ['scheduled', 'live'] }, kickoff: { $gte: new Date(now.getTime() - 3 * 3600_000) } },
      { ...this.withTeams, orderBy: { kickoff: 'asc' }, limit },
    );
  }

  latestFinished(limit: number): Promise<Match[]> {
    return this.find({ status: 'finished' }, { ...this.withTeams, orderBy: { kickoff: 'desc' }, limit });
  }

  /** İki kulübün CL'deki bütün karşılaşmaları, yeniden eskiye. */
  headToHead(a: string, b: string, before?: Date): Promise<Match[]> {
    return this.find(
      {
        $or: [{ home: a, away: b }, { home: b, away: a }],
        status: 'finished',
        ...(before ? { kickoff: { $lt: before } } : {}),
      },
      { ...this.withTeams, orderBy: { kickoff: 'desc' } },
    );
  }

  /** Bir kulübün son maçları; `before` verilirse o maçtan öncekiler. */
  forTeam(teamId: string, limit: number, before?: Date): Promise<Match[]> {
    return this.find(
      {
        $or: [{ home: teamId }, { away: teamId }],
        status: 'finished',
        ...(before ? { kickoff: { $lt: before } } : {}),
      },
      { ...this.withTeams, orderBy: { kickoff: 'desc' }, limit },
    );
  }

  allForTeam(teamId: string): Promise<Match[]> {
    return this.find({ $or: [{ home: teamId }, { away: teamId }] }, { ...this.withTeams, orderBy: { kickoff: 'asc' } });
  }

  /** "MM-DD" gününde oynanmış bütün maçlar (Berlin tarihine göre). */
  onDay(monthDay: string): Promise<Match[]> {
    return this.find({ day: { $like: `%-${monthDay}` } }, { ...this.withTeams, orderBy: { kickoff: 'desc' } });
  }

  /** Maç oynanmış bütün farklı "MM-DD" günleri. */
  async monthDays(): Promise<string[]> {
    const rows = await this.createQueryBuilder('m').select('m.day', true).execute<Array<{ day: string }>>('all');
    return [...new Set(rows.map((r) => r.day.slice(5)))].sort();
  }

  async seasons(): Promise<string[]> {
    const rows = await this.createQueryBuilder('m').select('m.season', true).execute<Array<{ season: string }>>('all');
    return rows.map((r) => r.season).sort();
  }
}
