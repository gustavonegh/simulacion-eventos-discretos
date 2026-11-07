// ============================================================
// MOTOR DEL SIMULADOR DE EVENTOS DISCRETOS (DES)
// Reloj + Lista de Eventos Futuros (FEL, min-heap) + cola FIFO
// Servidor único · arribos hasta 15:00 (360 min) · sin abandonos
// ============================================================
import { generarTiempoEntreArribos, generarTipoServicio, generarTiempoServicio, type Proporciones, type TipoServicio } from "./dist";
import { mulberry32, type Rng } from "./rng";

export const HORA_APERTURA = 9; // 09:00
export const TIEMPO_CIERRE_ARRIBOS = 360; // minutos desde 09:00 -> 15:00

export type Client = {
  id: number;
  label: string;
  llegada: number; // minutos desde 09:00
  tipo: TipoServicio;
  servicio: number; // duración efectiva aplicada
  inicio: number; // inicio del servicio (-1 si aún no)
  fin: number; // fin del servicio
  espera: number; // espera en cola (min)
};

export type SimEvent = {
  t: number;
  tipo: "ARRIBO" | "FIN_SERVICIO";
  client: Client;
};

export type Metrics = {
  esperaMedia: number;
  percentil90: number;
  propEsperaMayor40: number;
  utilizacion: number;
  tiempoMedioSistema: number;
  longitudMediaCola: number;
  maxEspera: number;
};

export type DayResult = {
  events: SimEvent[]; // traza completa, ordenada por tiempo
  clients: Client[]; // en orden de arribo
  metrics: Metrics;
  relojFinal: number;
  nAtendidos: number;
  /** Tiempo del primer arribo que cayó después de las 15:00 y fue rechazado. */
  proximoArriboRechazado: number | null;
};

// ---------- Min-heap sobre el tiempo de los eventos (FEL) ----------
type HeapItem = { t: number; seq: number; ev: SimEvent };

function heapPush(heap: HeapItem[], item: HeapItem) {
  heap.push(item);
  let i = heap.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heap[p].t < heap[i].t || (heap[p].t === heap[i].t && heap[p].seq <= heap[i].seq)) break;
    [heap[p], heap[i]] = [heap[i], heap[p]];
    i = p;
  }
}

function heapPop(heap: HeapItem[]): HeapItem {
  const top = heap[0];
  const last = heap.pop()!;
  if (heap.length > 0) {
    heap[0] = last;
    let i = 0;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let m = i;
      if (l < heap.length && (heap[l].t < heap[m].t || (heap[l].t === heap[m].t && heap[l].seq < heap[m].seq))) m = l;
      if (r < heap.length && (heap[r].t < heap[m].t || (heap[r].t === heap[m].t && heap[r].seq < heap[m].seq))) m = r;
      if (m === i) break;
      [heap[m], heap[i]] = [heap[i], heap[m]];
      i = m;
    }
  }
  return top;
}

// ---------- Una jornada completa ----------
export function simularJornada(rng: Rng, opts: { tramiteFactor?: number; props?: Proporciones } = {}): DayResult {
  const tramiteFactor = opts.tramiteFactor ?? 1.0; // escenario mejorado: 0.80
  const props = opts.props; // undefined => usa las proporciones del informe
  const tiempoCierre = TIEMPO_CIERRE_ARRIBOS;

  let reloj = 0;
  let servidorOcupado = false;
  const cola: Client[] = [];
  const FEL: HeapItem[] = [];
  let seq = 0;

  const tiemposEspera: number[] = [];
  const tiemposSistema: number[] = [];
  let tiempoTotalOcupado = 0;
  let areaBajoCola = 0;
  let tiempoAnterior = 0;

  const events: SimEvent[] = [];
  const clients: Client[] = [];
  let proximoArriboRechazado: number | null = null;
  let n = 0;
  const mkClient = (llegada: number): Client => {
    n += 1;
    const c: Client = {
      id: n,
      label: "C" + String(n).padStart(3, "0"),
      llegada,
      tipo: "consulta",
      servicio: 0,
      inicio: -1,
      fin: -1,
      espera: -1,
    };
    clients.push(c);
    return c;
  };

  const pushEv = (t: number, tipo: "ARRIBO" | "FIN_SERVICIO", client: Client) => {
    const ev: SimEvent = { t, tipo, client };
    heapPush(FEL, { t, seq: seq++, ev });
  };

  // Primer arribo
  const t0 = generarTiempoEntreArribos(rng);
  pushEv(t0, "ARRIBO", mkClient(t0));

  while (FEL.length > 0) {
    const { t, ev } = heapPop(FEL);

    // área bajo la curva de la cola (para longitud media de cola)
    areaBajoCola += cola.length * (t - tiempoAnterior);
    tiempoAnterior = t;
    reloj = t;

    if (ev.tipo === "ARRIBO") {
      // 1. Programar próximo arribo si estamos antes de las 15:00
      const prox = reloj + generarTiempoEntreArribos(rng);
      if (prox <= tiempoCierre) {
        pushEv(prox, "ARRIBO", mkClient(prox));
      } else if (proximoArriboRechazado === null) {
        proximoArriboRechazado = prox; // primer arribo que cayó después del cierre
      }

      // 2. Tipo de servicio probabilístico
      ev.client.tipo = generarTipoServicio(rng, props);
      events.push(ev);

      // 3. Lógica de atención (servidor único)
      if (!servidorOcupado) {
        servidorOcupado = true;
        ev.client.espera = 0;
        tiemposEspera.push(0);
        let ts = generarTiempoServicio(rng, ev.client.tipo);
        if (ev.client.tipo === "tramite") ts = ts * tramiteFactor; // mejora operativa
        ev.client.servicio = ts;
        ev.client.inicio = reloj;
        ev.client.fin = reloj + ts;
        tiempoTotalOcupado += ts;
        pushEv(reloj + ts, "FIN_SERVICIO", ev.client);
      } else {
        cola.push(ev.client); // FIFO
      }
    } else {
      // FIN_SERVICIO
      tiemposSistema.push(reloj - ev.client.llegada);
      events.push(ev);
      if (cola.length > 0) {
        const siguiente = cola.shift()!;
        siguiente.espera = reloj - siguiente.llegada;
        tiemposEspera.push(siguiente.espera);
        let ts = generarTiempoServicio(rng, siguiente.tipo);
        if (siguiente.tipo === "tramite") ts = ts * tramiteFactor; // mejora operativa
        siguiente.servicio = ts;
        siguiente.inicio = reloj;
        siguiente.fin = reloj + ts;
        tiempoTotalOcupado += ts;
        pushEv(reloj + ts, "FIN_SERVICIO", siguiente);
      } else {
        servidorOcupado = false;
      }
    }
  }

  const metrics: Metrics = {
    esperaMedia: mean(tiemposEspera),
    percentil90: percentile(tiemposEspera, 90),
    propEsperaMayor40: mean(tiemposEspera.map((e) => (e > 40 ? 1 : 0))),
    utilizacion: reloj > 0 ? tiempoTotalOcupado / reloj : 0,
    tiempoMedioSistema: mean(tiemposSistema),
    longitudMediaCola: reloj > 0 ? areaBajoCola / reloj : 0,
    maxEspera: Math.max(...tiemposEspera),
  };

  return { events, clients, metrics, relojFinal: reloj, nAtendidos: tiemposSistema.length, proximoArriboRechazado };
}

// ---------- Réplicas independientes + IC 95% ----------
export type ReplicaSet = {
  n: number;
  seed: number;
  improved: boolean;
  days: DayResult[];
  metricArrays: Record<keyof Metrics, number[]>;
  stats: Record<keyof Metrics, { media: number; icInf: number; icSup: number; sem: number }>;
  esperaPorJornada: number[];
  maxEsperaPorJornada: number[];
  arribosPorHora: number[]; // bins de 60 min, índice 0 = 09:00-10:00 ...
  esperasAcumuladas: number[];
};

export function runReplicas(nReplicas: number, seed: number, improved: boolean, props?: Proporciones): ReplicaSet {
  const rng = mulberry32(seed); // semilla fija => resultados reproducibles
  const days: DayResult[] = [];
  for (let i = 0; i < nReplicas; i++) {
    days.push(simularJornada(rng, { tramiteFactor: improved ? 0.8 : 1.0, props }));
  }
  const keys = Object.keys(days[0].metrics) as (keyof Metrics)[];
  const metricArrays = {} as Record<keyof Metrics, number[]>;
  const stats = {} as ReplicaSet["stats"];
  for (const k of keys) {
    const arr = days.map((d) => d.metrics[k]);
    metricArrays[k] = arr;
    const m = mean(arr);
    const s = sem(arr);
    stats[k] = { media: m, sem: s, icInf: m - 1.96 * s, icSup: m + 1.96 * s };
  }
  const arribosPorHora = new Array(7).fill(0);
  const esperasAcumuladas: number[] = [];
  for (const d of days) {
    for (const ev of d.events) {
      if (ev.tipo === "ARRIBO") {
        const h = Math.min(6, Math.floor(ev.t / 60));
        arribosPorHora[h] += 1;
      }
    }
    for (const c of d.clients) if (c.espera >= 0) esperasAcumuladas.push(c.espera);
  }
  return {
    n: nReplicas,
    seed,
    improved,
    days,
    metricArrays,
    stats,
    esperaPorJornada: days.map((d) => d.metrics.esperaMedia),
    maxEsperaPorJornada: days.map((d) => d.metrics.maxEspera),
    arribosPorHora,
    esperasAcumuladas,
  };
}

// ---------- Estadística ----------
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function stdSample(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / (arr.length - 1));
}

export function sem(arr: number[]): number {
  return stdSample(arr) / Math.sqrt(arr.length);
}

/** Percentil con interpolación lineal (igual que numpy.percentile). */
export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const k = ((s.length - 1) * p) / 100;
  const f = Math.floor(k);
  const c = Math.ceil(k);
  if (f === c) return s[k];
  return s[f] + (k - f) * (s[c] - s[f]);
}

/** Formatea minutos desde 09:00 como HH:MM:SS */
export function fmtClock(minDesdeApertura: number): string {
  const total = HORA_APERTURA * 3600 + Math.floor(minDesdeApertura * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function fmtHM(minDesdeApertura: number): string {
  const total = HORA_APERTURA * 60 + Math.floor(minDesdeApertura);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Histograma: devuelve bins [{label, count, x0}] */
export function histogram(values: number[], binSize: number, maxBins = 14): { label: string; count: number; x0: number }[] {
  if (values.length === 0) return [];
  const vmax = Math.max(...values);
  const nBins = Math.min(maxBins, Math.max(1, Math.ceil(vmax / binSize)));
  const bins = Array.from({ length: nBins }, (_, i) => ({
    label: `${(i * binSize).toFixed(0)}–${((i + 1) * binSize).toFixed(0)}`,
    count: 0,
    x0: i * binSize,
  }));
  for (const v of values) {
    let idx = Math.floor(v / binSize);
    if (idx >= nBins) idx = nBins - 1;
    bins[idx].count += 1;
  }
  return bins;
}
