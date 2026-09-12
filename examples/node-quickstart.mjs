// pnpm build && node examples/node-quickstart.mjs
import { bestPriceUnderLeak, explain, scoreRoute, sweep } from "@intelena/leak-score";

const intent = { sellAsset: "rHOOD", buyAsset: "USDG", amount: 250 };

const r = scoreRoute({ ...intent, exposure: 70 }, { darkDepth: 500 });
console.log(explain(r));

console.log("\nBest price with leak ≤ 25:");
console.log(bestPriceUnderLeak(intent, 25));

console.log("\nSlider curve:");
console.table(sweep(intent).map((x) => ({ exposure: x.input.exposure, leak: x.leakScore, label: x.label, dark: `${Math.round(x.crossedShare * 100)}%` })));
