import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { cli: './src/cli/main.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'es2022',
  outDir: 'dist',
  clean: false,
  dts: false,
  sourcemap: false,
  hash: false,
  fixedExtension: false,
  banner: { js: '#!/usr/bin/env node\n' },
  deps: { alwaysBundle: ['citty'], onlyBundle: ['citty'] },
})
