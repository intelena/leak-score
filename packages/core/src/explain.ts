import type { RouteReport } from "./types.js";

/**
 * Plain-language explanation of a report, suitable for a UI tooltip or an LLM
 * prompt. Deterministic and free of any external dependency.
 */
export function explain(report: RouteReport): string {
	const { input, crossedShare, publicShare, pieces, leakScore, label, factors } = report;
	const lines: string[] = [];
	lines.push(`Selling ${input.amount} ${input.sellAsset} for ${input.buyAsset} at exposure ${input.exposure}/100 scores ${leakScore}/100 (${label} leak).`);
	lines.push(`${Math.round(crossedShare * 100)}% crosses in the dark at the oracle midpoint and never appears on-chain.`);
	if (publicShare > 0) {
		lines.push(`${Math.round(publicShare * 100)}% routes to public liquidity as ${pieces.length} piece${pieces.length === 1 ? "" : "s"} from one-time addresses over ~${Math.max(...pieces.map((p) => p.delaySeconds))}s.`);
	} else {
		lines.push("Nothing routes publicly.");
	}
	const top = [...factors].sort((a, b) => b.points - a.points).filter((f) => f.points > 0).slice(0, 2);
	if (top.length) lines.push(`Biggest contributors: ${top.map((f) => `${f.key} (+${f.points})`).join(", ")}.`);
	lines.push(leakScore > 0 ? "To lower the leak, raise the exposure preference or wait for more dark depth." : "This route has no measurable public footprint.");
	return lines.join(" ");
}
