import { describe, expect, it } from "vitest";

import { parseArgs } from "../src/args.js";

describe("parseArgs", () => {
	it("parses a basic intent", () => {
		const p = parseArgs(["--sell", "250", "rHOOD", "--buy", "USDG", "--exposure", "70"]);
		expect("help" in p).toBe(false);
		if ("help" in p) return;
		expect(p.intent).toEqual({ amount: 250, sellAsset: "rHOOD", buyAsset: "USDG", exposure: 70 });
	});
	it("returns help when required args are missing", () => {
		expect("help" in parseArgs([])).toBe(true);
	});
	it("rejects unknown options", () => {
		expect(() => parseArgs(["--nope"])).toThrow(/unknown option/);
	});
	it("parses market context", () => {
		const p = parseArgs(["--sell", "1", "ETH", "--buy", "USDG", "--dark-depth", "0.5", "--freshness", "0.8", "--seed", "7", "--json"]);
		if ("help" in p) throw new Error("unexpected help");
		expect(p.ctx).toEqual({ darkDepth: 0.5, addressFreshness: 0.8, seed: 7 });
		expect(p.json).toBe(true);
	});
});
