import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

/*
 * Vitest esbuild kullanır ve esbuild decorator metadata üretmez; Nest'in DI'ı
 * buna muhtaç. SWC eklentisi tsc gibi metadata üretir (Nest'in önerdiği kurulum).
 */
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: { include: ['test/**/*.e2e.test.ts'], testTimeout: 60_000, hookTimeout: 60_000, pool: 'forks' },
});
