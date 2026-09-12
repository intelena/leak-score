import { seedFrom, seeded } from "./prng.js";
import type { LeakLabel, MarketContext, OrderIntent, RoutePiece, RouteReport, ScoreFactor } from "./types.js";

/** Thresholds for the human label. Exported so UIs stay consistent with the library. */
export const LABEL_THRESHOLDS = { low: 20, moderate: 45 } as const;

export function labelFor(score: number): LeakLabel {
	if (score < LABEL_THRESHOLDS.low) return "low";
	if (score < LABEL_THRESHOLDS.moderate) return "moderate";
	return "high";
}

function clamp(n: number, lo: number, hi: number) {
	return Math.min(hi, Math.max(lo, n));
}

function normalise(intent: OrderIntent): OrderIntent {
	if (!(intent.amount > 0)) throw new RangeError("amount must be > 0");
	if (!intent.sellAsset || !intent.buyAsset) throw new RangeError("sellAsset and buyAsset are required");
	if (intent.sellAsset === intent.buyAsset) throw new RangeError("sellAsset and buyAsset must differ");
	return { ...intent, exposure: clamp(Math.round(intent.exposure), 0, 100) };
}

/**
 * Score a route.
 *
 * The model is intentionally simple and fully documented (see SPEC.md):
 *  1. Exposure preference sets how much of the order waits for a dark cross.
 *  2. Dark depth caps what can actually cross.
 *  3. The public remainder is split into pieces with jittered timing.
 *  4. Leak points come from: public share, how few pieces, whether pieces still
 *     "look like" one trade, address freshness, and timing clustering.
 */
export function scoreRoute(rawIntent: OrderIntent, ctx: MarketContext = {}): RouteReport {
	const intent = normalise(rawIntent);
	const { exposure, amount } = intent;

	// 1. Preference → intended crossed share (20% … 90%).
	const wanted = 0.2 + (exposure / 100) * 0.7;
	// 2. Cap by available dark depth.
	const darkDepth = ctx.darkDepth ?? Infinity;
	const crossedAmount = Math.min(amount * wanted, darkDepth);
	const crossedShare = crossedAmount / amount;
	const publicAmount = amount - crossedAmount;
	const publicShare = publicAmount / amount;

	// 3. Fragment the public leg.
	const pieceCount = publicAmount > 0 ? Math.max(1, Math.round(1 + exposure / 12)) : 0;
	const rand = seeded(ctx.seed ?? seedFrom([intent.sellAsset, intent.buyAsset, amount, exposure]));
	const weights = Array.from({ length: pieceCount }, () => 0.5 + rand());
	const total = weights.reduce((a, b) => a + b, 0) || 1;
	const maxDelay = 30 + exposure * 6;
	const pieces: RoutePiece[] = weights
		.map((w) => ({ share: w / total, amount: (publicAmount * w) / total, delaySeconds: Math.round(rand() * maxDelay) }))
		.sort((a, b) => a.delaySeconds - b.delaySeconds);
	if (pieces[0]) pieces[0].delaySeconds = 0;

	// 4. Leak factors.
	const factors: ScoreFactor[] = [];

	const publicPts = Math.round(publicShare * 55);
	factors.push({ key: "public-share", points: publicPts, detail: `${Math.round(publicShare * 100)}% of the order touches public liquidity` });

	const fragPts = pieceCount === 0 ? 0 : Math.round(20 / Math.sqrt(pieceCount));
	factors.push({ key: "fragmentation", points: fragPts, detail: pieceCount === 0 ? "No public leg" : `${pieceCount} public piece${pieceCount === 1 ? "" : "s"}` });

	// If any single piece is ≥ 40% of the public leg it still reads as a block.
	const largest = pieces.reduce((m, p) => Math.max(m, p.share), 0);
	const sigPts = largest >= 0.4 && publicShare > 0 ? Math.round((largest - 0.4) * 25) : 0;
	factors.push({ key: "size-signature", points: sigPts, detail: sigPts ? `Largest piece is ${Math.round(largest * 100)}% of the public leg` : "No dominant piece" });

	const freshness = clamp(ctx.addressFreshness ?? 1, 0, 1);
	const freshPts = Math.round((1 - freshness) * 15 * (publicShare > 0 ? 1 : 0));
	factors.push({ key: "address-freshness", points: freshPts, detail: freshPts ? `Some pieces reuse addresses (${Math.round(freshness * 100)}% fresh)` : "Every piece from a one-time address" });

	// Timing: pieces landing within 10s of each other cluster into one print.
	let clustered = 0;
	for (let i = 1; i < pieces.length; i++) if ((pieces[i]!.delaySeconds - pieces[i - 1]!.delaySeconds) < 10) clustered++;
	const timingPts = pieceCount > 1 ? Math.round((clustered / (pieceCount - 1)) * 10) : 0;
	factors.push({ key: "timing", points: timingPts, detail: timingPts ? `${clustered} piece gap${clustered === 1 ? "" : "s"} under 10s` : "Pieces are spread out" });

	const leakScore = clamp(factors.reduce((a, f) => a + f.points, 0), 0, 100);

	// Price: crossed part fills at mid; public part pays impact scaled by depth.
	const publicDepth = ctx.publicDepth ?? amount * 10;
	const impactPct = publicAmount > 0 ? -(publicAmount / publicDepth) * 2 : 0; // 2% at full depth, linear
	const priceVsMidPct = Number((impactPct * publicShare + 0 * crossedShare).toFixed(3));

	const etaMinutes: [number, number] = [Math.round(1 + exposure / 10), Math.round(3 + exposure / 6)];

	return { leakScore, label: labelFor(leakScore), factors, crossedShare, publicShare, crossedAmount, publicAmount, pieces, priceVsMidPct, etaMinutes, input: intent };
}

/**
 * Sweep the exposure slider and return one report per step — the data behind a
 * "best price ↔ least exposure" control.
 */
export function sweep(intent: Omit<OrderIntent, "exposure">, ctx: MarketContext = {}, steps = 11): RouteReport[] {
	return Array.from({ length: steps }, (_, i) => scoreRoute({ ...intent, exposure: Math.round((i / (steps - 1)) * 100) }, ctx));
}
