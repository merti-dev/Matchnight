import { Controller, Get } from '@nestjs/common';
import type { MetaDto } from '@matchnight/core';
import { MetaService } from './meta.service.js';

@Controller()
export class MetaController {
  constructor(private readonly service: MetaService) {}

  @Get('meta')
  meta(): Promise<MetaDto> {
    return this.service.get();
  }

  /** Docker healthcheck ve izleme için. */
  @Get('health')
  async health() {
    const meta = await this.service.get();
    return { ok: true, lastSync: meta.lastSync, seasons: meta.seasons.length };
  }
}
