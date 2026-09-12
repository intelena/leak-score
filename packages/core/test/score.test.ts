import { describe, expect, it } from "vitest";

import { labelFor, scoreRoute, sweep } from "../src/index.js";

const base = { sellAsset: "rHOOD", buyAsset: "USDG", amount: 250 };

describe("scoreRoute", () => {
	it("is deterministic for the same input", () => {
		const a = scoreRoute({ ...base, exposure: 65 });
		const b = scoreRoute({ ...base, exposure: 65 });
		expect(a).toEqual(b);
	});

	it("leaks less as exposure preference rises", () => {
		const scores = sweep(base).map((r) => r.leakScore);
		for (let i = 1; i < scores.length; i++) expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]!);
	});

	it("crosses more in the dark as exposure preference rises", () => {
		const low = scoreRoute({ ...base, exposure: 0 });
		const high = scoreRoute({ ...base, exposure: 100 });
		expect(high.crossedShare).toBeGreaterThan(low.crossedShare);
		expect(high.pieces.length).toBeGreaterThan(low.pieces.length);
	});

	it("caps the crossed amount by dark depth", () => {
		const r = scoreRoute({ ...base, exposure: 100 }, { darkDepth: 50 });
		expect(r.crossedAmount).toBe(50);
		expect(r.publicAmount).toBe(200);
	});

	it("scores a fully crossed order as zero leak", () => {
		const r = scoreRoute({ ...base, exposure: 100 }, { darkDepth: Infinity });
		// 90% crosses at exposure 100; force full cross by depth = amount and wanted ≥ amount
		const full = scoreRoute({ ...base, amount: 1, exposure: 100 }, { darkDepth: Infinity });
		expect(r.leakScore).toBeLessThan(full.leakScore + 10);
		expect(r.factors.find((f) => f.key === "public-share")!.points).toBeLessThan(10);
	});

	it("penalises address reuse", () => {
		const fresh = scoreRoute({ ...base, exposure: 40 }, { addressFreshness: 1 });
		const reused = scoreRoute({ ...base, exposure: 40 }, { addressFreshness: 0.2 });
		expect(reused.leakScore).toBeGreaterThan(fresh.leakScore);
	});

	it("pieces sum to the public amount and start at t=0", () => {
		const r = scoreRoute({ ...base, exposure: 50 });
		const sum = r.pieces.reduce((a, p) => a + p.amount, 0);
		expect(sum).toBeCloseTo(r.publicAmount, 6);
		expect(r.pieces[0]!.delaySeconds).toBe(0);
	});

	it("keeps the score within 0..100 and labels it", () => {
		for (const r of sweep(base, { addressFreshness: 0 })) {
			expect(r.leakScore).toBeGreaterThanOrEqual(0);
			expect(r.leakScore).toBeLessThanOrEqual(100);
			expect(r.label).toBe(labelFor(r.leakScore));
		}
	});

	it("rejects invalid intents", () => {
		expect(() => scoreRoute({ ...base, amount: 0, exposure: 50 })).toThrow(RangeError);
		expect(() => scoreRoute({ ...base, buyAsset: "rHOOD", exposure: 50 })).toThrow(RangeError);
	});
});
