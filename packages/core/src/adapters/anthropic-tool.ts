/**
 * Tool definition for LLM function calling (Anthropic Messages API shape).
 * Lets an assistant call `scoreRoute` with validated arguments.
 *
 *   import { leakScoreTool, runLeakScoreTool } from "@intelena/leak-score/adapters/anthropic-tool";
 *   // pass `leakScoreTool` in `tools`, and when the model emits a tool_use block
 *   // named "score_route", reply with runLeakScoreTool(block.input).
 */
import { scoreRoute } from "../score.js";
import { explain } from "../explain.js";

export const leakScoreTool = {
	name: "score_route",
	description:
		"Score a proposed on-chain swap for information leakage. Returns the Leak Score (0–100, lower is more private), how much crosses in the dark, how the public remainder is fragmented, and named factors.",
	input_schema: {
		type: "object",
		additionalProperties: false,
		properties: {
			sellAsset: { type: "string", description: "Asset being sold, e.g. rHOOD" },
			buyAsset: { type: "string", description: "Asset being bought, e.g. USDG" },
			amount: { type: "number", exclusiveMinimum: 0, description: "Size in sellAsset units" },
			exposure: { type: "integer", minimum: 0, maximum: 100, description: "0 = best price, 100 = least exposure" },
			darkDepth: { type: "number", description: "Optional dark-crossing depth in sellAsset units" },
			publicDepth: { type: "number", description: "Optional public pool depth in sellAsset units" },
			addressFreshness: { type: "number", minimum: 0, maximum: 1, description: "Optional share of pieces from one-time addresses" },
		},
		required: ["sellAsset", "buyAsset", "amount", "exposure"],
	},
	strict: true,
} as const;

export interface LeakScoreToolInput {
	sellAsset: string;
	buyAsset: string;
	amount: number;
	exposure: number;
	darkDepth?: number;
	publicDepth?: number;
	addressFreshness?: number;
}

/** Execute the tool and return a JSON-serialisable result plus a one-paragraph explanation. */
export function runLeakScoreTool(input: LeakScoreToolInput) {
	const { sellAsset, buyAsset, amount, exposure, ...ctx } = input;
	const report = scoreRoute({ sellAsset, buyAsset, amount, exposure }, ctx);
	return { report, explanation: explain(report) };
}
