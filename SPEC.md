# Leak Score — model specification (v0.1)

Everything the library does is described here so the number can be audited.

## Inputs

**Intent**

| Field | Meaning |
|---|---|
| `sellAsset`, `buyAsset` | Assets. Must differ. |
| `amount` | Size in `sellAsset` units, > 0. |
| `exposure` | Trader preference 0–100. 0 = best price, 100 = least exposure. Rounded and clamped. |

**Market context** (all optional)

| Field | Default | Meaning |
|---|---|---|
| `darkDepth` | `∞` | Depth available for dark crossing, in `sellAsset` units. |
| `publicDepth` | `10 × amount` | Public pool depth before impact becomes significant. |
| `addressFreshness` | `1` | Share of public pieces sent from never-used addresses, 0–1. |
| `seed` | derived from intent | Seed for deterministic piece randomisation. |

## Steps

1. **Intended crossed share** `wanted = 0.2 + 0.7 × (exposure / 100)` — from 20% (exposure 0) to 90% (exposure 100).
2. **Crossed amount** `min(amount × wanted, darkDepth)`. The remainder is the **public leg**.
3. **Fragmentation.** If the public leg is > 0: `pieces = max(1, round(1 + exposure / 12))` (1 → 9). Piece sizes are drawn as `0.5 + U(0,1)` and normalised; delays are `U(0, 30 + 6 × exposure)` seconds, sorted, first piece at `0`.
4. **Factors** (points add up, clamped to 0–100):

| Key | Points | Rationale |
|---|---|---|
| `public-share` | `round(publicShare × 55)` | The only part anyone can observe. |
| `fragmentation` | `round(20 / √pieces)` (0 if no public leg) | Fewer pieces read more like one trade. |
| `size-signature` | `round((largest − 0.4) × 25)` if the largest piece ≥ 40% of the public leg | A dominant piece is still a block print. |
| `address-freshness` | `round((1 − freshness) × 15)` if there is a public leg | Reused addresses link pieces together. |
| `timing` | `round(clusteredGaps / (pieces − 1) × 10)` where a gap < 10 s is "clustered" | Pieces landing together look like one order. |

5. **Label** `low` < 20 ≤ `moderate` < 45 ≤ `high`.
6. **Price vs mid** — the crossed part fills at the midpoint (0%); the public part pays linear impact `−2% × (publicAmount / publicDepth)`, weighted by `publicShare`.
7. **ETA** `[1 + exposure/10, 3 + exposure/6]` minutes.

## Properties (tested)

- Deterministic for identical input.
- Leak Score is monotonically non-increasing as `exposure` rises (all else equal).
- Crossed amount never exceeds `darkDepth`.
- Piece amounts sum to the public amount; the first piece starts at `t = 0`.
- Address reuse strictly increases the score when a public leg exists.

## Non-goals

This is a UI-facing heuristic, not a formal privacy metric. It does not model chain-analysis heuristics beyond the listed factors, and it makes no claim about the unobservability of the dark leg itself — that is a property of the settlement layer, not of this score.
