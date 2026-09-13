export { bestPriceUnderLeak, leastLeakUnderSlippage, type Tradeoff } from "./compare.js";
export { explain } from "./explain.js";
export { LABEL_THRESHOLDS, labelFor, scoreRoute, sweep } from "./score.js";
export type { LeakLabel, MarketContext, OrderIntent, RoutePiece, RouteReport, ScoreFactor } from "./types.js";
export { interpolateImpact, presets, PRESET_EXPOSURES } from "./lab.js";
export type { ImpactPoint, Preset } from "./lab.js";
