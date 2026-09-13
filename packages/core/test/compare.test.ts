import { describe, expect, it } from "vitest";

import { bestPriceUnderLeak, explain, leastLeakUnderSlippage, scoreRoute } from "../src/index.js";
import { runLeakScoreTool, leakScoreTool } from "../src/adapters/anthropic-tool.js";

const base = { sellAsset: "TSLA", buyAsset: "USDG", amount: 250 };

describe("compare", () => {
	it("finds the lowest exposure under a leak budget", () => {
		const t = bestPriceUnderLeak(base, 30);
		expect(t).not.toBeNull();
		expect(t!.leakScore).toBeLessThanOrEqual(30);
		// one step lower must violate the budget
		const lower = scoreRoute({ ...base, exposure: Math.max(0, t!.exposure - 5) });
		if (t!.exposure > 0) expect(lower.leakScore).toBeGreaterThan(30);
	});

	it("returns null when the budget is unreachable", () => {
		expect(bestPriceUnderLeak(base, -1)).toBeNull();
	});

	it("finds the least leak under a slippage budget", () => {
		const t = leastLeakUnderSlippage(base, 0.05, { publicDepth: 1000 });
		expect(t).not.toBeNull();
		expect(Math.abs(t!.priceVsMidPct)).toBeLessThanOrEqual(0.05);
	});
});

describe("explain", () => {
	it("mentions the score and the crossed share", () => {
		const r = scoreRoute({ ...base, exposure: 70 });
		const text = explain(r);
		expect(text).toContain(`${r.leakScore}/100`);
		expect(text).toContain(`${Math.round(r.crossedShare * 100)}%`);
	});
});

describe("anthropic tool adapter", () => {
	it("has a strict schema with required fields", () => {
		expect(leakScoreTool.strict).toBe(true);
		expect(leakScoreTool.input_schema.required).toEqual(["sellAsset", "buyAsset", "amount", "exposure"]);
	});
	it("runs and returns report + explanation", () => {
		const out = runLeakScoreTool({ ...base, exposure: 50, darkDepth: 100 });
		expect(out.report.crossedAmount).toBe(100);
		expect(out.explanation.length).toBeGreaterThan(40);
	});
});
