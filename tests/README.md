# Test Architecture

Tests are organized by behavior boundary instead of by coverage target.

- `_support/` contains reusable fetch mocks, endpoint assertions, and small response fixtures.
- `unit/` covers pure helpers, the HTTP transport, and the public client facade.
- `resources/` covers resource endpoint contracts: method name, path, query parameters, defaults, and validation.
- `integration/` covers the live TMDB API: SDK resources plus the CLI entry point. It requires `TMDB_ACCESS_TOKEN` or `TMDB_API_KEY`, is excluded from the default `bun test` run, and is invoked with `bun run test:integration`.

When adding a TMDB endpoint, prefer a resource contract test that proves the SDK maps the public TypeScript API to the documented TMDB path and query parameters. Keep network behavior in `unit/http.test.ts` so resource tests stay small and deterministic.

The live suite runs in the `Integration` GitHub workflow. Keep its assertions stable: prefer IDs and fields that TMDB does not change (for example movie 550's English and Simplified Chinese titles) over volatile popularity ordering.
