/** Small deterministic PRNG (LCG) so routes are reproducible for a given seed. */
export function seeded(seed: number): () => number {
	let s = seed >>> 0 || 1;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 0xffffffff;
	};
}

/** Stable seed from an intent when none is supplied. */
export function seedFrom(parts: (string | number)[]): number {
	let h = 2166136261;
	for (const p of parts) {
		for (const ch of String(p)) {
			h ^= ch.charCodeAt(0);
			h = Math.imul(h, 16777619);
		}
	}
	return h >>> 0;
}
