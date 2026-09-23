import { Injectable, NotFoundException } from '@nestjs/common';
import {
  STAGES,
  computeStandings,
  finalWinner,
  groupTies,
  leagueZone,
  type KnockoutsDto,
  type MatchDto,
  type SeasonSummaryDto,
  type StandingsDto,
  type Zone,
} from '@matchnight/core';
import type { Match } from '../matches/match.entity.js';
import { MatchRepository } from '../matches/match.repository.js';
import { toCoreMatch, toMatchDto, toTeamRef } from '../matches/match.mapper.js';

@Injectable()
export class SeasonsService {
  constructor(private readonly matches: MatchRepository) {}

  private async load(season: string): Promise<Match[]> {
    const list = await this.matches.bySeason(season);
    if (!list.length) throw new NotFoundException(`sezon bulunamadı: ${season}`);
    return list;
  }

  private format(list: Match[]): 'GROUP' | 'LEAGUE' {
    return list.some((m) => m.stage === 'LEAGUE') ? 'LEAGUE' : 'GROUP';
  }

  async list(): Promise<SeasonSummaryDto[]> {
    const seasons = await this.matches.seasons();
    const out: SeasonSummaryDto[] = [];
    for (const season of seasons.reverse()) {
      const list = await this.matches.bySeason(season);
      const final = list.find((m) => m.stage === 'FINAL');
      const winnerId = final ? finalWinner(toCoreMatch(final)) : null;
      const champion = final && winnerId ? (final.home.id === winnerId ? final.home : final.away) : null;
      const runnerUp = final && winnerId ? (final.home.id === winnerId ? final.away : final.home) : null;
      out.push({
        season,
        format: this.format(list),
        matches: list.length,
        finished: list.filter((m) => m.status === 'finished').length,
        champion: champion ? toTeamRef(champion) : null,
        runnerUp: runnerUp ? toTeamRef(runnerUp) : null,
      });
    }
    return out;
  }

  async matchesOf(season: string): Promise<MatchDto[]> {
    return (await this.load(season)).map(toMatchDto);
  }

  async standings(season: string): Promise<StandingsDto> {
    const list = await this.load(season);
    const format = this.format(list);
    const teamOf = new Map(list.flatMap((m) => [[m.home.id, m.home], [m.away.id, m.away]] as const));
    const core = list.map(toCoreMatch);

    const tableFor = (group: string | null, subset: typeof core) =>
      computeStandings(subset, season, format).map((row) => {
        const zone: Zone =
          format === 'LEAGUE' ? leagueZone(row.position) : row.position <= 2 ? 'advance' : row.position === 3 ? 'third' : 'out';
        return { ...row, team: toTeamRef(teamOf.get(row.teamId)!), zone };
      });

    if (format === 'LEAGUE') {
      return { season, format, tables: [{ group: null, rows: tableFor(null, core.filter((m) => m.stage === 'LEAGUE')) }] };
    }
    const groups = [...new Set(core.filter((m) => m.stage === 'GROUP').map((m) => m.group!))].sort();
    return {
      season,
      format,
      tables: groups.map((g) => ({ group: g, rows: tableFor(g, core.filter((m) => m.stage === 'GROUP' && m.group === g)) })),
    };
  }

  async knockouts(season: string): Promise<KnockoutsDto> {
    const list = await this.load(season);
    const byId = new Map(list.map((m) => [m.id, m]));
    const teamOf = new Map(list.flatMap((m) => [[m.home.id, m.home], [m.away.id, m.away]] as const));
    const ties = groupTies(list.map(toCoreMatch));
    const rounds = STAGES.filter((s) => s !== 'GROUP' && s !== 'LEAGUE')
      .map((stage) => ({
        stage,
        ties: ties
          .filter((t) => t.stage === stage)
          .sort((a, b) => a.legs[0]!.kickoff.localeCompare(b.legs[0]!.kickoff))
          .map((t) => ({
            stage,
            first: toTeamRef(teamOf.get(t.firstHomeId)!),
            second: toTeamRef(teamOf.get(t.firstAwayId)!),
            legs: t.legs.map((leg) => toMatchDto(byId.get(leg.id)!)),
            aggregate: t.aggregate,
            winnerId: t.winnerId,
            decidedBy: t.decidedBy,
          })),
      }))
      .filter((r) => r.ties.length);
    return { season, rounds };
  }
}
