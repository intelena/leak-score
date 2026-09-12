# leak-score

**Pre-trade exposure scoring for on-chain orders.** Given an order and what the router knows about the venues, `leak-score` tells you how much of the order can cross in the dark, how the public remainder is fragmented, and a single **Leak Score (0–100)** with named factors — so "residual exposure" is measured and chosen, never hidden.

Part of [Intelena](https://intelena.app) — dark routing on Robinhood Chain. The model is deliberately small and fully specified in [SPEC.md](./SPEC.md) so anyone can audit the number.

```
Sell 250 rHOOD → USDG   exposure 70

Leak Score   27/100  (moderate)
Dark cross  █████████████████░░░░░░░  69%  172.5000 rHOOD at midpoint
Public leg  ███████░░░░░░░░░░░░░░░░░  31%  77.5000 rHOOD in 7 pieces
Price vs mid -0.019%   ETA 8–15 min

Factors
   17  public-share       31% of the order touches public liquidity
    8  fragmentation      7 public pieces
    0  size-signature     No dominant piece
    0  address-freshness  Every piece from a one-time address
    2  timing             1 piece gap under 10s
```

## Packages

| Package | What |
|---|---|
| [`@intelena/leak-score`](./packages/core) | Pure TypeScript library. Zero dependencies. Works in browsers, Workers, and Node. |
| [`@intelena/leak-score-cli`](./packages/cli) | `leak-score` command for terminals and CI. |

## Library

```ts
import { scoreRoute, sweep } from "@intelena/leak-score";

const report = scoreRoute(
  { sellAsset: "rHOOD", buyAsset: "USDG", amount: 250, exposure: 70 },
  { darkDepth: 500, publicDepth: 5000, addressFreshness: 1 },
);

report.leakScore;     // 27
report.label;         // "moderate"
report.crossedShare;  // 0.69
report.pieces;        // [{ share, amount, delaySeconds }, …]
report.factors;       // [{ key: "public-share", points: 17, detail: "…" }, …]

// Every step of the "best price ↔ least exposure" slider:
const curve = sweep({ sellAsset: "rHOOD", buyAsset: "USDG", amount: 250 });
```

Reports are deterministic: the same intent and context always produce the same route (pass `seed` to control piece randomisation).

### Trade-off helpers

```ts
import { bestPriceUnderLeak, leastLeakUnderSlippage, explain } from "@intelena/leak-score";

// Lowest exposure (best price) that keeps the Leak Score ≤ 25
bestPriceUnderLeak(intent, 25);            // { exposure: 75, leakScore: 23, priceVsMidPct: -0.015, … }

// Most privacy you can get while staying within 0.05% of mid
leastLeakUnderSlippage(intent, 0.05);

// One-paragraph plain-language explanation (deterministic, no LLM needed)
explain(report);
```

### LLM tool adapter

`@intelena/leak-score/adapters/anthropic-tool` exports a strict tool definition (`score_route`) plus `runLeakScoreTool()` so an assistant can score routes via function calling:

```ts
import { leakScoreTool, runLeakScoreTool } from "@intelena/leak-score/adapters/anthropic-tool";
// tools: [leakScoreTool] → on tool_use "score_route": runLeakScoreTool(block.input)
```

## CLI

```bash
npx @intelena/leak-score-cli --sell 250 rHOOD --buy USDG --exposure 70
leak-score --sell 2 ETH --buy USDG --sweep
leak-score --sell 250 rHOOD --buy USDG --json | jq .leakScore
```

## Development

```bash
pnpm install
pnpm build && pnpm test
node examples/node-quickstart.mjs
```

## Roadmap

- [ ] Publish to npm under `@intelena`
- [ ] Browser playground (the marketing site's Leak Score demo, wired to this package)
- [ ] Calibrate factor weights against on-chain heuristics (address clustering, timing analysis) and document the method
- [ ] `--live` mode in the CLI: pull dark/public depth from the Intelena API once it exists

## Status

The scoring model is a documented heuristic intended for UIs, simulators, and research. It is **not** a formal privacy guarantee; the on-chain leg of any route remains observable, and the score exists to make that visible before signing.

## License

MIT
