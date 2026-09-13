# CLAUDE.md — leak-score

Open-source pnpm monorepo: `packages/core` (`@intelena/leak-score`, pure TS, zero deps) + `packages/cli`. Tests with vitest; CI in `.github/workflows/ci.yml`.

- The scoring model is specified in `SPEC.md`. Any change to `packages/core/src/score.ts` must update SPEC.md and keep the tested properties (deterministic, monotone in exposure, depth cap, piece sums).
- Keep core dependency-free and runtime-agnostic (browser / Workers / Node). Node-only code belongs in the CLI.
- The dapp (`../../intelena-dapp/app/lib/routing-sim.ts`, Route Lab in `components/lab/route-lab.tsx`) and the marketing Leak Score demo mirror this model — `src/lab.ts` (`presets`, `interpolateImpact`) is the extracted Route Lab maths. When the model changes, update them or switch them to import this package.
- Asset symbols are Robinhood Chain tickers without any prefix (`TSLA`, not `rHOOD`); there is no HOOD token.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, …), English, single line.
