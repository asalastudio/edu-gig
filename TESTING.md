# Testing

This project uses **[Vitest](https://vitest.dev/)** for unit and component tests, **[Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** for React, and **[Playwright](https://playwright.dev/)** for browser coverage of the launch flow.

## Commands

| Command | Description |
|--------|-------------|
| `npm run test` | Run all unit tests once (CI-friendly) |
| `npm run test:watch` | Watch mode while developing |
| `npm run test:coverage` | Run tests with V8 coverage report |
| `npm run test:e2e` | Playwright (public launch copy, checkout retirement, auth gates) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint including `@convex-dev/eslint-plugin` |
| `npm run check:env` | Local env audit |
| `npm run check:env:beta` | Production/beta env audit (off-platform payment) |

## Conventions

- Place tests next to source files: `*.test.ts` or `*.test.tsx` under `src/`
- Prefer testing **behavior** (what users see/do) over implementation details
- For Next.js App Router pages that need routing, mock `next/navigation` in the test file when needed
- Engagement idempotency and role access live in `src/lib/create-engagement.test.ts` (pure helpers from `convex/lib`)

## CI

GitHub Actions runs `npm run test` and `npm run build` on push and pull requests (see `.github/workflows/ci.yml`).
