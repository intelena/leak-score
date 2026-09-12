import { scoreRoute } from "./score.js";
import type { MarketContext, OrderIntent, RouteReport } from "./types.js";

export interface Tradeoff {
	exposure: number;
	leakScore: number;
	priceVsMidPct: number;
	etaMinutes: [number, number];
	report: RouteReport;
}

/**
 * Find the lowest exposure setting that keeps the Leak Score at or below
 * `maxLeak` — i.e. the best price you can get for a privacy budget.
 * Returns null if no setting satisfies it (e.g. shallow dark depth).
 */
export function bestPriceUnderLeak(intent: Omit<OrderIntent, "exposure">, maxLeak: number, ctx: MarketContext = {}): Tradeoff | null {
	for (let exposure = 0; exposure <= 100; exposure += 5) {
		const report = scoreRoute({ ...intent, exposure }, ctx);
		if (report.leakScore <= maxLeak) return { exposure, leakScore: report.leakScore, priceVsMidPct: report.priceVsMidPct, etaMinutes: report.etaMinutes, report };
	}
	return null;
}

/**
 * The lowest Leak Score reachable while keeping price within `maxSlippagePct`
 * of the midpoint — i.e. the most privacy you can buy for a price budget.
 */
export function leastLeakUnderSlippage(intent: Omit<OrderIntent, "exposure">, maxSlippagePct: number, ctx: MarketContext = {}): Tradeoff | null {
	let best: Tradeoff | null = null;
	for (let exposure = 0; exposure <= 100; exposure += 5) {
		const report = scoreRoute({ ...intent, exposure }, ctx);
		if (Math.abs(report.priceVsMidPct) > maxSlippagePct) continue;
		if (!best || report.leakScore < best.leakScore) best = { exposure, leakScore: report.leakScore, priceVsMidPct: report.priceVsMidPct, etaMinutes: report.etaMinutes, report };
	}
	return best;
}
