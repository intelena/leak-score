#!/usr/bin/env node
import { scoreRoute, sweep } from "@intelena/leak-score";

import { parseArgs } from "./args.js";
import { formatReport, formatSweep } from "./format.js";

try {
	const parsed = parseArgs(process.argv.slice(2));
	if ("help" in parsed) {
		process.stdout.write(parsed.help);
		process.exit(0);
	}
	const { intent, ctx, json, sweep: doSweep } = parsed;
	if (doSweep) {
		const rows = sweep({ sellAsset: intent.sellAsset, buyAsset: intent.buyAsset, amount: intent.amount }, ctx);
		process.stdout.write((json ? JSON.stringify(rows, null, 2) : formatSweep(rows)) + "\n");
	} else {
		const report = scoreRoute(intent, ctx);
		process.stdout.write((json ? JSON.stringify(report, null, 2) : formatReport(report)) + "\n");
	}
} catch (err) {
	process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
	process.exit(1);
}
