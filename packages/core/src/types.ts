/** A swap the trader intends to execute. */
export interface OrderIntent {
	/** Asset being sold, e.g. "rHOOD". */
	sellAsset: string;
	/** Asset being bought, e.g. "USDG". */
	buyAsset: string;
	/** Size in units of `sellAsset`. Must be > 0. */
	amount: number;
	/**
	 * Trader preference from 0 (best price: route everything as fast as possible)
	 * to 100 (least exposure: wait for crossing, fragment heavily).
	 */
	exposure: number;
}

/** What the router knows about the venues at quote time. */
export interface MarketContext {
	/**
	 * Depth available for crossing in the dark, in units of `sellAsset`.
	 * `Infinity` means "assume the book can absorb anything" (useful for modelling).
	 */
	darkDepth?: number;
	/**
	 * Public pool depth in units of `sellAsset` before impact becomes significant.
	 * Used to scale price impact of the public leg.
	 */
	publicDepth?: number;
	/** Mid price of `sellAsset` in `buyAsset`. Only used to report notional; scoring is size-relative. */
	midPrice?: number;
	/** Address freshness of the relayer pool, 0–1 (1 = every piece from a never-used address). */
	addressFreshness?: number;
	/** Deterministic seed for piece randomisation. Same seed + input → same route. */
	seed?: number;
}

export interface RoutePiece {
	/** Fraction of the public leg this piece carries, 0–1. */
	share: number;
	/** Size in units of `sellAsset`. */
	amount: number;
	/** Seconds after the first piece is submitted. */
	delaySeconds: number;
}

export type LeakLabel = "low" | "moderate" | "high";

/** One named contributor to the score, so UIs can explain the number. */
export interface ScoreFactor {
	key: "public-share" | "fragmentation" | "size-signature" | "address-freshness" | "timing";
	/** Points contributed (positive = more leak). */
	points: number;
	/** Human-readable reason. */
	detail: string;
}

export interface RouteReport {
	/** 0 (nothing observable) … 100 (fully readable as one trade). */
	leakScore: number;
	label: LeakLabel;
	factors: ScoreFactor[];
	/** Share of the order expected to cross in the dark, 0–1. */
	crossedShare: number;
	/** Share routed to public liquidity, 0–1. */
	publicShare: number;
	crossedAmount: number;
	publicAmount: number;
	pieces: RoutePiece[];
	/** Estimated execution price relative to midpoint for the whole order, in percent (negative = worse than mid). */
	priceVsMidPct: number;
	/** Expected time to complete, in minutes [min, max]. */
	etaMinutes: [number, number];
	/** Echo of the normalised inputs. */
	input: OrderIntent;
}
