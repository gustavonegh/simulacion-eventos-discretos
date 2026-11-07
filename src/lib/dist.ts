// Distribuciones continuas equivalentes a scipy.stats (misma parametrización).
import { gamma, normal, type Rng } from "./rng";

export type TipoServicio = "consulta" | "pago" | "tramite";

/** Distribución de probabilidad por categoría de servicio. */
export type Proporciones = Record<TipoServicio, number>;

export const PROB_SERVICIOS: Record<TipoServicio, number> = {
  consulta: 0.547899,
  pago: 0.352101,
  tramite: 0.1,
};

/** Log-normal: scipy lognorm(s, loc, scale) = loc + scale * exp(s * Z), Z ~ N(0,1) */
export function lognorm(rng: Rng, s: number, loc: number, scale: number): number {
  return loc + scale * Math.exp(s * normal(rng));
}

/** Weibull mínima: scipy weibull_min(c, loc, scale) = loc + scale * (-ln U)^(1/c) */
export function weibullMin(rng: Rng, c: number, loc: number, scale: number): number {
  let u = rng();
  while (u <= 0) u = rng();
  return loc + scale * Math.pow(-Math.log(u), 1 / c);
}

/** Beta: scipy beta(a, b, loc, scale) = loc + scale * X/(X+Y), X~Gamma(a), Y~Gamma(b) */
export function beta(rng: Rng, a: number, b: number, loc: number, scale: number): number {
  const x = gamma(rng, a);
  const y = gamma(rng, b);
  const bb = x / (x + y);
  return loc + scale * bb;
}

// ==========================================
// GENERADORES DEFINITIVOS (parámetros de la cátedra)
// ==========================================

/** Tiempo entre arribos — Log-normal (s=1.4381, loc=-0.0816, scale=6.0595) */
export function generarTiempoEntreArribos(rng: Rng): number {
  return Math.max(0.05, lognorm(rng, 1.4381, -0.0816, 6.0595));
}

/**
 * Tipo de servicio según proporciones empíricas.
 * Si no se pasan, usa las del informe (0.5479 / 0.3521 / 0.1000).
 */
export function generarTipoServicio(rng: Rng, props: Proporciones = PROB_SERVICIOS): TipoServicio {
  const u = rng();
  if (u <= props.consulta) return "consulta";
  if (u <= props.consulta + props.pago) return "pago";
  return "tramite";
}

/** Duración del servicio condicionada al tipo — distribuciones de la cátedra. */
export function generarTiempoServicio(rng: Rng, tipo: TipoServicio): number {
  let t: number;
  if (tipo === "consulta") {
    // Weibull mínima (c=1.8748, loc=0.3047, scale=4.5329)
    t = weibullMin(rng, 1.8748, 0.3047, 4.5329);
  } else if (tipo === "pago") {
    // Beta (a=4.169, b=114.649, loc=-0.266, scale=224.443)
    t = beta(rng, 4.169850010105158, 114.6492079716935, -0.2662459715074412, 224.443094694334);
  } else {
    // TRÁMITE: Beta (a=4.821, b=1329433.497, loc=-0.268, scale=3500903.007)
    t = beta(rng, 4.821335309573588, 1329433.4977673884, -0.2681920896357173, 3500903.0070410594);
  }
  return Math.max(0.05, t);
}
