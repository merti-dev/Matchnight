import type { Match as CoreMatch, MatchDto, TeamRef } from '@matchnight/core';
import type { Team } from '../teams/team.entity.js';
import type { Match } from './match.entity.js';

/**
 * Entity -> API yanıtı (Symfony'deki Serializer/normalizer karşılığı).
 * Entity'ler dışarı hiç sızmıyor; controller'lar yalnızca DTO döner.
 */
export function toTeamRef(team: Team): TeamRef {
  return { id: team.id, name: team.name, country: team.country };
}

const score = (s: { home: number; away: number } | null) => (s ? { home: s.home, away: s.away } : null);

export function toMatchDto(m: Match): MatchDto {
  return {
    id: m.id,
    season: m.season,
    stage: m.stage,
    group: m.grp,
    round: m.round,
    kickoff: m.kickoff.toISOString(),
    timeKnown: m.timeKnown,
    status: m.status,
    home: toTeamRef(m.home),
    away: toTeamRef(m.away),
    score: score(m.score),
    halfTime: score(m.halfTime),
    extraTime: m.extraTime,
    penalties: score(m.penalties),
    neutral: m.neutral,
    elo: m.elo
      ? { homeBefore: m.elo.homeBefore, awayBefore: m.elo.awayBefore, homeAfter: m.elo.homeAfter, awayAfter: m.elo.awayAfter }
      : null,
    prob: m.elo ? { home: m.elo.pHome, draw: m.elo.pDraw, away: m.elo.pAway } : null,
  };
}

/** Entity -> core'daki saf tip (puan durumu, eşleşme hesapları için). */
export function toCoreMatch(m: Match): CoreMatch {
  return {
    id: m.id,
    season: m.season,
    stage: m.stage,
    group: m.grp,
    round: m.round,
    kickoff: m.kickoff.toISOString(),
    timeKnown: m.timeKnown,
    homeId: m.home.id,
    awayId: m.away.id,
    status: m.status,
    score: score(m.score),
    halfTime: score(m.halfTime),
    extraTime: m.extraTime,
    penalties: score(m.penalties),
    neutral: m.neutral,
  };
}
