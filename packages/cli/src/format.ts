import type { RouteReport } from "@intelena/leak-score";

const bar = (share: number, width = 24) => {
	const filled = Math.round(share * width);
	return "█".repeat(filled) + "░".repeat(width - filled);
};

export function formatReport(r: RouteReport): string {
	const lines: string[] = [];
	lines.push(`Sell ${r.input.amount} ${r.input.sellAsset} → ${r.input.buyAsset}   exposure ${r.input.exposure}`);
	lines.push("");
	lines.push(`Leak Score  ${String(r.leakScore).padStart(3)}/100  (${r.label})`);
	lines.push(`Dark cross  ${bar(r.crossedShare)}  ${Math.round(r.crossedShare * 100)}%  ${r.crossedAmount.toFixed(4)} ${r.input.sellAsset} at midpoint`);
	lines.push(`Public leg  ${bar(r.publicShare)}  ${Math.round(r.publicShare * 100)}%  ${r.publicAmount.toFixed(4)} ${r.input.sellAsset} in ${r.pieces.length} piece${r.pieces.length === 1 ? "" : "s"}`);
	lines.push(`Price vs mid ${r.priceVsMidPct}%   ETA ${r.etaMinutes[0]}–${r.etaMinutes[1]} min`);
	lines.push("");
	lines.push("Factors");
	for (const f of r.factors) lines.push(`  ${String(f.points).padStart(3)}  ${f.key.padEnd(18)} ${f.detail}`);
	if (r.pieces.length) {
		lines.push("");
		lines.push("Public pieces");
		for (const p of r.pieces) lines.push(`  +${String(p.delaySeconds).padStart(4)}s  ${p.amount.toFixed(4).padStart(12)} ${r.input.sellAsset}  ${bar(p.share, 12)}`);
	}
	return lines.join("\n");
}

export function formatSweep(rows: RouteReport[]): string {
	const head = "exposure  leak  label     dark%  public%  pieces  price%";
	const body = rows.map((r) =>
		[
			String(r.input.exposure).padStart(8),
			String(r.leakScore).padStart(5),
			r.label.padEnd(9),
			String(Math.round(r.crossedShare * 100)).padStart(5),
			String(Math.round(r.publicShare * 100)).padStart(8),
			String(r.pieces.length).padStart(7),
			String(r.priceVsMidPct).padStart(7),
		].join("  "),
	);
	return [head, ...body].join("\n");
}
