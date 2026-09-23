import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/sqlite';
import { stagesReached, type RankingRowDto, type TeamDetailDto } from '@matchnight/core';
import { MatchRepository } from '../matches/match.repository.js';
import { toCoreMatch, toMatchDto, toTeamRef } from '../matches/match.mapper.js';
import { MetaService } from '../meta/meta.service.js';
import { RatingPoint } from '../ratings/rating-point.entity.js';
import { TeamRepository } from './team.repository.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teams: TeamRepository,
    private readonly matches: MatchRepository,
    private readonly meta: MetaService,
    private readonly em: EntityManager,
  ) {}

  async ranking(): Promise<RankingRowDto[]> {
    const since = await this.meta.activeSince();
    if (!since) return [];
    const teams = await this.teams.activeRanking(since);
    return teams.map((t, i) => ({ rank: i + 1, team: toTeamRef(t), elo: t.elo!, lastSeason: t.lastSeason! }));
  }

  async detail(id: string): Promise<TeamDetailDto> {
    const team = await this.teams.findOne({ id });
    if (!team) throw new NotFoundException(`kulüp bulunamadı: ${id}`);

    const [all, points, ranking] = await Promise.all([
      this.matches.allForTeam(id),
      this.em.find(RatingPoint, { team: id }, { orderBy: { kickoff: 'asc' } }),
      this.ranking(),
    ]);

    const byId = new Map(all.map((m) => [m.id, m]));
    const bySeason = new Map<string, typeof all>();
    for (const m of all) bySeason.set(m.season, [...(bySeason.get(m.season) ?? []), m]);
    const journey = [...bySeason.entries()]
      .map(([season, list]) => ({ season, reached: stagesReached(list.map(toCoreMatch)).get(id)! }))
      .sort((a, b) => b.season.localeCompare(a.season));

    return {
      team: toTeamRef(team),
      elo: team.elo,
      rank: ranking.find((r) => r.team.id === id)?.rank ?? null,
      lastSeason: team.lastSeason,
      journey,
      history: points.flatMap((p) => {
        const m = byId.get(p.match.id);
        if (!m?.score) return [];
        const home = m.home.id === id;
        const [own, other] = home ? [m.score.home, m.score.away] : [m.score.away, m.score.home];
        return [{
          matchId: m.id,
          kickoff: p.kickoff.toISOString(),
          rating: p.rating,
          opponent: (home ? m.away : m.home).name,
          score: `${own}-${other}`,
          result: own > other ? 'W' : own < other ? 'L' : 'D',
        } as const];
      }),
      recent: all.filter((m) => m.status === 'finished').slice(-8).reverse().map(toMatchDto),
    };
  }
}
