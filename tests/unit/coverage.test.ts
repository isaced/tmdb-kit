import { expect, test } from 'bun:test'
import { join } from 'node:path'

test('loads every source module so coverage sees untested files', async () => {
  const root = join(import.meta.dir, '..', '..', 'src')
  const glob = new Bun.Glob('**/*.ts')
  let loaded = 0

  for await (const path of glob.scan(root)) {
    if (path === 'cli/main.ts') {
      continue
    }

    await import(join(root, path))
    loaded += 1
  }

  expect(loaded).toBeGreaterThan(0)
})