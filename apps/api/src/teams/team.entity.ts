import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { TeamRepository } from './team.repository.js';

/**
 * Doctrine karşılığı:
 *   #[ORM\Entity(repositoryClass: TeamRepository::class)]
 *   #[ORM\Table(name: 'teams')]
 */
@Entity({ tableName: 'teams', repository: () => TeamRepository })
export class Team {
  /** Kulüp kimliği: "bayern", "galatasaray" — kaynaklar arası sabit. */
  @PrimaryKey({ type: 'string' })
  id: string;

  @Property({ type: 'string' })
  name: string;

  /** UEFA ülke kodu: GER, ESP, TUR… */
  @Property({ type: 'string', length: 3 })
  country: string;

  /** Güncel Elo (senkron sonunda yazılır; hiç oynamadıysa null). */
  @Property({ type: 'double', nullable: true })
  elo: number | null = null;

  /** CL'de oynadığı son sezon, "2025-26". */
  @Property({ type: 'string', nullable: true })
  lastSeason: string | null = null;
}
