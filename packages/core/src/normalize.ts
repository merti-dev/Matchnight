import { resolveTeam } from './teams.js';
import type { Match, RawMatch, Team } from './types.js';

/** Takım adlarını kulüp kimliğine çözer ve kararlı maç kimliği üretir. */
export function normalize(raw: RawMatch[]): { matches: Match[]; teams: Map<string, Team>; unknownNames: Set<string> } {
  const teams = new Map<string, Team>();
  const unknownNames = new Set<string>();
  const matches: Match[] = [];

  const register = (name: string, country: string | null) => {
    const resolved = resolveTeam(name);
    if (resolved.unknown) unknownNames.add(name);
    const existing = teams.get(resolved.id);
    // Ülke kodu: en son görülen boş olmayan değer (Monaco FRA -> MCO)
    teams.set(resolved.id, { id: resolved.id, name: resolved.name, country: country || existing?.country || '' });
    return resolved.id;
  };

  for (const r of raw) {
    const homeId = register(r.home.name, r.home.country);
    const awayId = register(r.away.name, r.away.country);
    const day = r.kickoff.slice(0, 10);
    const { home: _h, away: _a, ...rest } = r;
    matches.push({ ...rest, id: `${r.season}-${day}-${homeId}-${awayId}`, homeId, awayId });
  }
  return { matches, teams, unknownNames };
}
