// RNG determinista (mulberry32) + muestreadores base.
// Equivalente funcional a np.random.seed(42) en el notebook de Python.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Normal estándar N(0,1) vía Box-Muller. */
export function normal(rng: Rng): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Gamma(shape, 1) vía Marsaglia-Tsang (válido para shape > 0). */
export function gamma(rng: Rng, shape: number): number {
  if (shape < 1) {
    // Boost: Gamma(a) = Gamma(a+1) * U^(1/a)
    const u = rng();
    return gamma(rng, shape + 1) * Math.pow(u, 1 / shape);
  }
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const z = normal(rng);
    const v = Math.pow(1 + c * z, 3);
    if (v <= 0) continue;
    const u = rng();
    if (u < 1 - 0.0331 * z * z * z * z) return d * v;
    if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Uniforme discreta: elige un elemento según probabilidades p. */
export function choice<T>(rng: Rng, items: T[], p: number[]): T {
  const u = rng();
  let acc = 0;
  for (let i = 0; i < items.length; i++) {
    acc += p[i];
    if (u <= acc) return items[i];
  }
  return items[items.length - 1];
}
