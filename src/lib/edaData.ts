// Dataset sintético que reproduce la estructura de centro_atencion.csv
// (1.190 registros, 142 vacíos por columna clave, typos en `servicio`).
import { mulberry32 } from "./rng";
import { generarTiempoServicio, type TipoServicio } from "./dist";

export type RawRow = {
  idx: number;
  idCliente: string; // "" si vacío
  fecha: string; // "" si vacío
  horaLlegada: string;
  servicio: string; // valor CRUDO (con typos y mayúsculas)
  duracion: string; // "" si vacío, usa coma decimal como el CSV original
};

export const CORRECCIONES_SERVICIO: Record<string, TipoServicio> = {
  consul: "consulta",
  cnt: "consulta",
  pgao: "pago",
  pagoo: "pago",
  pgo: "pago",
};

/**
 * Variantes de presentación por categoría (incluye typos y mayúsculas),
 * para que el CSV de ejemplo se parezca al real antes de limpiar.
 */
const VARIANTES: Record<TipoServicio, string[]> = {
  consulta: ["consulta", "consulta", "consulta", "consulta", "consulta", "CONSULTA", "ConSulTa", "cOnsUlTa", "consul", "cnt"],
  pago: ["pago", "pago", "pago", "pago", "pago", "Pago", "PGAO", "pagoo", "pgo"],
  tramite: ["tramite", "tramite", "tramite", "tramite", "TRAMITE", "Tramite"],
};

/** Elige cómo se ve escrita la categoría en el CSV crudo. */
export function elegirVariante(rng: () => number, tipo: TipoServicio): string {
  const arr = VARIANTES[tipo];
  return arr[Math.floor(rng() * arr.length)];
}

export function limpiarServicio(raw: string): TipoServicio {
  const low = raw.trim().toLowerCase();
  if (low in CORRECCIONES_SERVICIO) return CORRECCIONES_SERVICIO[low];
  if (low === "consulta") return "consulta";
  if (low === "pago") return "pago";
  if (low === "tramite") return "tramite";
  return "consulta";
}

function fmtHora(rng: () => number): string {
  // llegadas entre 09:00 y 14:59
  const totalMin = 9 * 60 + Math.floor(rng() * (15 * 60 - 9 * 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const s = Math.floor(rng() * 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function generarDataset(nRows = 1190): RawRow[] {
  const rng = mulberry32(2026);
  const rows: RawRow[] = [];

  // --- 1. Tipos de servicio con proporciones EXACTAS del informe ---
  const nConsulta = Math.round(nRows * 0.547899);
  const nPago = Math.round(nRows * 0.352101);
  const nTramite = nRows - nConsulta - nPago;
  const tipos: TipoServicio[] = [
    ...Array<TipoServicio>(nConsulta).fill("consulta"),
    ...Array<TipoServicio>(nPago).fill("pago"),
    ...Array<TipoServicio>(nTramite).fill("tramite"),
  ];
  for (let i = tipos.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [tipos[i], tipos[j]] = [tipos[j], tipos[i]];
  }

  // --- 2. Exactamente 142 vacíos por columna (id_cliente, fecha, duración) ---
  const nVacios = Math.min(142, Math.floor(nRows * 0.12));
  const vaciosId = elegirIndices(rng, nRows, nVacios);
  const vaciosFecha = elegirIndices(rng, nRows, nVacios);
  const vaciosDur = elegirIndices(rng, nRows, nVacios);

  // fechas: jornadas que avanzan desde 2026-08-03
  let fechaActual = new Date(Date.UTC(2026, 7, 3));
  let registrosJornada = 0;
  const registrosPorJornada = 45 + Math.floor(rng() * 15);

  for (let i = 0; i < nRows; i++) {
    if (registrosJornada >= registrosPorJornada) {
      fechaActual = new Date(fechaActual.getTime() + 86400000 * (1 + Math.floor(rng() * 2)));
      registrosJornada = 0;
    }
    registrosJornada++;
    const tipo = tipos[i];
    const dur = generarTiempoServicio(rng, tipo);
    rows.push({
      idx: i + 1,
      idCliente: vaciosId.has(i) ? "" : "B" + String(i + 1).padStart(5, "0"),
      fecha: vaciosFecha.has(i) ? "" : fechaActual.toISOString().slice(0, 10),
      horaLlegada: fmtHora(rng),
      servicio: elegirVariante(rng, tipo),
      duracion: vaciosDur.has(i) ? "" : dur.toFixed(2).replace(".", ","),
    });
  }
  return rows;
}

/** Elige `k` índices distintos al azar (sin repetición). */
function elegirIndices(rng: () => number, total: number, k: number): Set<number> {
  const set = new Set<number>();
  while (set.size < k) set.add(Math.floor(rng() * total));
  return set;
}

/** Proporciones limpias (las del enunciado, usadas como base del modelo). */
export const PROPORCIONES_LIMPIAS: { servicio: TipoServicio; prop: number; color: string }[] = [
  { servicio: "consulta", prop: 0.547899, color: "#60a5fa" },
  { servicio: "pago", prop: 0.352101, color: "#34d399" },
  { servicio: "tramite", prop: 0.1, color: "#fb7185" },
];

export const TYPOS_ENCONTRADOS = ["consul", "cnt", "pgao", "pagoo", "pgo"];

export const ESTRUCTURA_CSV = [
  { columna: "id_cliente", tipo: "Texto / identificador", vacios: 142, ejemplo: "B00001" },
  { columna: "fecha", tipo: "Fecha", vacios: 142, ejemplo: "2026-08-03" },
  { columna: "hora_llegada", tipo: "Hora", vacios: 0, ejemplo: "09:01:03" },
  { columna: "servicio", tipo: "Texto categórico", vacios: 0, ejemplo: "consulta" },
  { columna: "duracion_servicio_min", tipo: "Número decimal", vacios: 142, ejemplo: "2,68" },
];
