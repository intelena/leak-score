import type { MarketContext, OrderIntent } from "@intelena/leak-score";

export interface CliOptions {
	intent: OrderIntent;
	ctx: MarketContext;
	json: boolean;
	sweep: boolean;
}

const HELP = `leak-score — pre-trade exposure scoring

Usage:
  leak-score --sell <AMOUNT> <ASSET> --buy <ASSET> [--exposure 0-100] [options]

Options:
  --exposure <n>        0 = best price … 100 = least exposure (default 65)
  --dark-depth <n>      Dark-crossing depth in sell-asset units (default: unlimited)
  --public-depth <n>    Public pool depth in sell-asset units
  --freshness <0-1>     Share of pieces sent from one-time addresses (default 1)
  --seed <n>            Deterministic seed for piece randomisation
  --sweep               Print a table across the whole exposure range
  --json                Machine-readable output
  -h, --help            Show this help

Example:
  leak-score --sell 250 rHOOD --buy USDG --exposure 70
`;

export function parseArgs(argv: string[]): CliOptions | { help: string } {
	const args = [...argv];
	const opt: Partial<OrderIntent> = { exposure: 65 };
	const ctx: MarketContext = {};
	let json = false;
	let sweep = false;

	const take = () => {
		const v = args.shift();
		if (v === undefined) throw new Error("missing value");
		return v;
	};
	const num = (v: string, name: string) => {
		const n = Number(v);
		if (!Number.isFinite(n)) throw new Error(`${name} must be a number, got "${v}"`);
		return n;
	};

	while (args.length) {
		const a = args.shift()!;
		switch (a) {
			case "-h":
			case "--help":
				return { help: HELP };
			case "--sell":
				opt.amount = num(take(), "--sell amount");
				opt.sellAsset = take();
				break;
			case "--buy":
				opt.buyAsset = take();
				break;
			case "--exposure":
				opt.exposure = num(take(), "--exposure");
				break;
			case "--dark-depth":
				ctx.darkDepth = num(take(), "--dark-depth");
				break;
			case "--public-depth":
				ctx.publicDepth = num(take(), "--public-depth");
				break;
			case "--freshness":
				ctx.addressFreshness = num(take(), "--freshness");
				break;
			case "--seed":
				ctx.seed = num(take(), "--seed");
				break;
			case "--json":
				json = true;
				break;
			case "--sweep":
				sweep = true;
				break;
			default:
				throw new Error(`unknown option ${a}\n\n${HELP}`);
		}
	}
	if (!opt.sellAsset || !opt.buyAsset || opt.amount === undefined) return { help: HELP };
	return { intent: opt as OrderIntent, ctx, json, sweep };
}
