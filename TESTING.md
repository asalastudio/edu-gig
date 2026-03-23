# Testing

This project uses **[Vitest](https://vitest.dev/)** for unit and component tests, plus **[Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** for rendering React components in a browser-like environment (`jsdom`).

## Commands

| Command | Description |
|--------|-------------|
| `npm run test` | Run all tests once (CI-friendly) |
| `npm run test:watch` | Watch mode while developing |
| `npm run test:coverage` | Run tests with V8 coverage report |

## Conventions

- Place tests next to source files: `*.test.ts` or `*.test.tsx` under `src/`
- Prefer testing **behavior** (what users see/do) over implementation details
- For Next.js App Router pages that need routing, mock `next/navigation` in the test file when needed

## CI

GitHub Actions runs `npm run test` and `npm run build` on push and pull requests (see `.github/workflows/ci.yml`).

## Future: E2E

End-to-end tests (e.g. **Playwright**) can be added later for full browser flows (sign-in, browse → profile). The current setup covers fast feedback for utilities and UI components.
