import { Migration } from '@mikro-orm/migrations';

export class Migration20260923201833 extends Migration {

  override name = 'Migration20260923201833';

  override up(): void | Promise<void> {
    this.addSql(`create table \`meta\` (\`key\` text not null primary key, \`value\` json not null);`);

    this.addSql(`create table \`teams\` (\`id\` text not null primary key, \`name\` text not null, \`country\` text not null, \`elo\` double null, \`last_season\` text null);`);

    this.addSql(`create table \`matches\` (\`id\` text not null primary key, \`season\` text not null, \`stage\` text check (\`stage\` in ('GROUP', 'LEAGUE', 'PLAYOFF', 'R16', 'QF', 'SF', 'FINAL')) not null, \`grp\` text null, \`round\` integer null, \`kickoff\` datetime not null, \`day\` text not null, \`time_known\` integer not null default true, \`home_id\` text not null, \`away_id\` text not null, \`status\` text check (\`status\` in ('finished', 'scheduled', 'live', 'postponed')) not null, \`score_home\` integer null, \`score_away\` integer null, \`ht_home\` integer null, \`ht_away\` integer null, \`extra_time\` integer not null default false, \`pen_home\` integer null, \`pen_away\` integer null, \`neutral\` integer not null default false, \`source\` text not null, \`elo_home_before\` double null, \`elo_away_before\` double null, \`elo_home_after\` double null, \`elo_away_after\` double null, \`elo_p_home\` double null, \`elo_p_draw\` double null, \`elo_p_away\` double null, constraint \`matches_home_id_foreign\` foreign key (\`home_id\`) references \`teams\` (\`id\`), constraint \`matches_away_id_foreign\` foreign key (\`away_id\`) references \`teams\` (\`id\`));`);
    this.addSql(`create index \`matches_kickoff_index\` on \`matches\` (\`kickoff\`);`);
    this.addSql(`create index \`matches_day_index\` on \`matches\` (\`day\`);`);
    this.addSql(`create index \`matches_home_id_index\` on \`matches\` (\`home_id\`);`);
    this.addSql(`create index \`matches_away_id_index\` on \`matches\` (\`away_id\`);`);
    this.addSql(`create index \`matches_season_stage_index\` on \`matches\` (\`season\`, \`stage\`);`);

    this.addSql(`create table \`rating_points\` (\`id\` integer not null primary key autoincrement, \`team_id\` text not null, \`match_id\` text not null, \`kickoff\` datetime not null, \`rating\` double not null, constraint \`rating_points_team_id_foreign\` foreign key (\`team_id\`) references \`teams\` (\`id\`), constraint \`rating_points_match_id_foreign\` foreign key (\`match_id\`) references \`matches\` (\`id\`) on delete cascade);`);
    this.addSql(`create index \`rating_points_team_id_index\` on \`rating_points\` (\`team_id\`);`);
    this.addSql(`create index \`rating_points_match_id_index\` on \`rating_points\` (\`match_id\`);`);
    this.addSql(`create index \`rating_points_team_id_kickoff_index\` on \`rating_points\` (\`team_id\`, \`kickoff\`);`);
  }

}
