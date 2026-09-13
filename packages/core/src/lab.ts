import { scoreRoute } from "./score.js";
import type { MarketContext, OrderIntent, RouteReport } from "./types.js";

/**
 * Route Lab helpers — the same maths the Intelena dapp's `/lab` page runs:
 * a measured price-impact curve (e.g. from Uniswap QuoterV2 at several sizes)
 * combined with the routing model into ready-to-use presets.
 */

/** One measured point: public order size → quoted price impact vs. midpoint (negative = worse than mid). */
export interface ImpactPoint {
	size: number;
	impactPct: number;
}

/**
 * Impact for an arbitrary public size, linearly interpolated on a measured
 * curve. Below the first point and above the last it scales proportionally
 * (impact ∝ size), which is conservative for AMM pools.
 */
export function interpolateImpact(curve: ImpactPoint[], size: number): number | null {
	const pts = curve.filter((p) => Number.isFinite(p.impactPct) && p.size > 0).sort((a, b) => a.size - b.size);
	if (pts.length === 0 || !(size >= 0)) return null;
	if (size === 0) return 0;
	const first = pts[0]!;
	if (size <= first.size) return (first.impactPct * size) / first.size;
	for (let i = 1; i < pts.length; i++) {
		const a = pts[i - 1]!;
		const b = pts[i]!;
		if (size <= b.size) return a.impactPct + ((b.impactPct - a.impactPct) * (size - a.size)) / (b.size - a.size);
	}
	const last = pts[pts.length - 1]!;
	return (last.impactPct * size) / last.size;
}

export interface Preset {
	name: "Best price" | "Balanced" | "Least exposure";
	exposure: number;
	report: RouteReport;
	/** Interpolated impact of the public leg, % vs. midpoint; null without a curve. */
	impactPct: number | null;
	/** Estimated cost of that impact in quote units, given `midPrice`; null without a curve. */
	cost: number | null;
}

export const PRESET_EXPOSURES = { "Best price": 15, Balanced: 50, "Least exposure": 90 } as const;

/**
 * The three presets the dapp offers, scored with the model and priced with a
 * measured impact curve when one is supplied.
 */
export function presets(
	intent: Omit<OrderIntent, "exposure">,
	options: { curve?: ImpactPoint[]; midPrice?: number; balancedExposure?: number; ctx?: MarketContext } = {},
): Preset[] {
	const exposures = { ...PRESET_EXPOSURES, Balanced: options.balancedExposure ?? PRESET_EXPOSURES.Balanced };
	return (Object.keys(exposures) as Preset["name"][]).map((name) => {
		const exposure = exposures[name];
		const report = scoreRoute({ ...intent, exposure }, options.ctx);
		const impactPct = options.curve ? interpolateImpact(options.curve, report.publicAmount) : null;
		const cost = impactPct !== null && options.midPrice ? (Math.abs(Math.min(0, impactPct)) / 100) * report.publicAmount * options.midPrice : null;
		return { name, exposure, report, impactPct, cost };
	});
}
