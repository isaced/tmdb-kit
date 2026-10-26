import { chmodSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const cliOnly = process.argv.includes('--cli')
const outDir = 'dist'

async function runBuild(options: Parameters<typeof Bun.build>[0]) {
  const result = await Bun.build(options)

  if (!result.success) {
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }
}

async function buildSdk() {
  await runBuild({
    entrypoints: ['./src/index.ts'],
    outdir: outDir,
    format: 'esm',
    target: 'browser',
    sourcemap: 'linked',
    naming: 'index.js',
  })

  await runBuild({
    entrypoints: ['./src/index.ts'],
    outdir: outDir,
    format: 'cjs',
    target: 'browser',
    sourcemap: 'linked',
    naming: 'index.cjs',
  })
}

async function buildCli() {
  await runBuild({
    entrypoints: ['./src/cli/main.ts'],
    outdir: outDir,
    format: 'esm',
    target: 'node',
    naming: 'cli.js',
  })

  const cliPath = join(outDir, 'cli.js')
  const source = readFileSync(cliPath, 'utf8')

  writeFileSync(cliPath, source.startsWith('#!') ? source : `#!/usr/bin/env node\n${source}`)
  chmodSync(cliPath, 0o755)
}

async function buildTypes() {
  const result = await Bun.$`bunx tsc -p tsconfig.build.json`.nothrow()

  if (result.exitCode !== 0) {
    process.exit(result.exitCode)
  }
}

const moduleSpecifier = /(\bfrom\s*['"]|\bimport\s*\(\s*['"])(\.[^'"]+?)(['"])/g
const relativeSpecifier = /(?:\bfrom\s*['"]|\bimport\s*\(\s*['"])(\.[^'"]*)['"]/g

function rewriteSpecifiers(source: string, extension: '.js' | '.cjs'): string {
  return source.replace(
    moduleSpecifier,
    (_match, prefix: string, specifier: string, quote: string) => {
      const path = specifier.replace(/\.(?:js|mjs|cjs)$/, '')
      return `${prefix}${path}${extension}${quote}`
    },
  )
}

function listDeclarations(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...listDeclarations(path))
    } else if (entry.name.endsWith('.d.ts')) {
      files.push(path)
    }
  }

  return files
}

function finalizeTypes() {
  for (const file of listDeclarations(outDir)) {
    const esm = rewriteSpecifiers(readFileSync(file, 'utf8'), '.js')

    for (const match of esm.matchAll(relativeSpecifier)) {
      if (!match[1].endsWith('.js')) {
        throw new Error(`Unresolved relative specifier "${match[1]}" in ${file}`)
      }
    }

    writeFileSync(file, esm)
    writeFileSync(file.replace(/\.d\.ts$/, '.d.cts'), rewriteSpecifiers(esm, '.cjs'))
  }
}

if (cliOnly) {
  await buildCli()
} else {
  rmSync(outDir, { recursive: true, force: true })
  await buildSdk()
  await buildCli()
  await buildTypes()
  finalizeTypes()
}
