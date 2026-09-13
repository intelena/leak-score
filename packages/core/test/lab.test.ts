import { describe, expect, it } from "vitest";
import { interpolateImpact, presets } from "../src/index.js";

const curve = [
	{ size: 10, impactPct: -0.1 },
	{ size: 20, impactPct: -0.25 },
	{ size: 40, impactPct: -0.7 },
];

describe("interpolateImpact", () => {
	it("interpolates between measured points and scales outside them", () => {
		expect(interpolateImpact(curve, 0)).toBe(0);
		expect(interpolateImpact(curve, 5)).toBeCloseTo(-0.05);
		expect(interpolateImpact(curve, 15)).toBeCloseTo(-0.175);
		expect(interpolateImpact(curve, 30)).toBeCloseTo(-0.475);
		expect(interpolateImpact(curve, 80)).toBeCloseTo(-1.4);
	});
	it("returns null without usable points", () => {
		expect(interpolateImpact([], 10)).toBeNull();
		expect(interpolateImpact([{ size: 10, impactPct: Number.NaN }], 10)).toBeNull();
	});
});

describe("presets", () => {
	const intent = { sellAsset: "TSLA", buyAsset: "USDG", amount: 40 };
	it("orders leak from best-price (highest) to least-exposure (lowest)", () => {
		const [best, balanced, least] = presets(intent);
		expect(best!.report.leakScore).toBeGreaterThan(balanced!.report.leakScore);
		expect(balanced!.report.leakScore).toBeGreaterThan(least!.report.leakScore);
		expect(best!.impactPct).toBeNull();
	});
	it("prices the public leg with a curve and midpoint", () => {
		const [best, , least] = presets(intent, { curve, midPrice: 365 });
		expect(best!.impactPct).toBeLessThan(0);
		expect(best!.cost).toBeGreaterThan(least!.cost!);
		expect(least!.report.publicAmount).toBeLessThan(best!.report.publicAmount);
	});
	it("honours a custom balanced exposure", () => {
		const [, balanced] = presets(intent, { balancedExposure: 70 });
		expect(balanced!.exposure).toBe(70);
	});
});
