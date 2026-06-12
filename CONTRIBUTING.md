# Contributing to tmdb-kit

Thanks for your interest in contributing! This guide covers the basics to get you started.

## Prerequisites

- Node.js 18+
- npm

## Getting Started

```bash
git clone https://github.com/isaced/tmdb-kit.git
cd tmdb-kit
npm install
```

## Development Workflow

```bash
npm run typecheck      # type-check without emitting
npm run test:coverage  # run tests with coverage
npm run build          # build ESM + CJS output
```

Or run all three at once:

```bash
npm run ci
```

## Project Structure

```
src/
  client.ts          # TMDBClient class and createTMDB factory
  http.ts            # HTTP transport, auth, and request logic
  query.ts           # URL building and query helpers
  errors.ts          # Error classes (TMDBError, TMDBResponseError, etc.)
  search-guards.ts   # Type guards for search.multi() results
  types.ts           # All TypeScript types and known-size constants
  index.ts           # Public API re-exports
  resources/         # Resource modules (movies, tv, search, etc.)
tests/
  unit/              # Unit tests with mocked fetch
  resources/         # Resource-level integration tests
  integration/       # Live TMDB API tests (requires real token)
```

## Adding a New Resource

1. Create `src/resources/<name>.ts` with a class that takes `TMDBTransport` in its constructor.
2. Add the resource to `TMDBClient` in `src/client.ts`.
3. Export any new types from `src/types.ts` and re-export them in `src/index.ts`.
4. Add tests in `tests/resources/<name>.test.ts` using the existing mock patterns.

## Testing

- **Unit tests** (`tests/unit/`): mock `fetch` via `TMDBTransport` stubs. No real network calls.
- **Resource tests** (`tests/resources/`): same mock pattern, focused on resource methods.
- **Integration tests** (`tests/integration/`): hit the live TMDB API. Require `TMDB_ACCESS_TOKEN` env var. Run with `npm run test:integration`.

All tests must pass with 100% line coverage before submitting a PR.

## Code Style

- Strict TypeScript — no `any`, no implicit `undefined`.
- No runtime dependencies.
- Prefer Web standard APIs over Node.js-specific ones.
- Keep resource classes small and explicit — one method per TMDB endpoint.
- Follow existing naming conventions for types, functions, and files.

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(search): add keyword search endpoint
fix(images): handle null poster_path in url builder
docs: update authentication examples
test(movies): cover recommendations endpoint
```

## Pull Requests

1. Fork the repo and create a feature branch from `main`.
2. Make your changes following the guidelines above.
3. Ensure `npm run ci` passes (typecheck + test:coverage + build).
4. Open a PR with a clear description of what changed and why.

## Questions?

Open an issue at <https://github.com/isaced/tmdb-kit/issues>.
