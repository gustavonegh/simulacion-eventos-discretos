// ============================================================
// Lector/limpiador de centro_atencion.csv
// Reproduce el pipeline de limpieza del notebook:
//   1. str.strip().str.lower() sobre `servicio`
//   2. mapeo correctivo de typos (consul, cnt, pgao, pagoo, pgo)
//   3. forward fill de `fecha`
//   4. proporciones empíricas por categoría
// ============================================================
import { CORRECCIONES_SERVICIO, generarDataset, type RawRow } from "./edaData";
import type { Proporciones, TipoServicio } from "./dist";

export type ColumnStats = { nombre: string; vacios: number; distintos: number };

export type CsvAnalysis = {
  ok: boolean;
  error?: string;
  nombreArchivo: string;
  totalFilas: number;
  columnas: ColumnStats[];
  vaciosTotales: number;
  typos: { valor: string; cantidad: number; corrigeA: TipoServicio }[];
  filasCorregidas: number;
  filasDescartadas: number;
  fechasImputadas: number;
  proporciones: Proporciones;
  muestra: { crudo: string; corregido: string }[];
  fuente: "archivo" | "sintetico";
};

/** Detecta el delimitador (`,` `;` o tab) de la cabecera. */
function detectarDelimitador(header: string): string {
  const opciones = [",", ";", "\t"];
  let mejor = ",";
  let mejorN = -1;
  for (const d of opciones) {
    const n = header.split(d).length - 1;
    if (n > mejorN) {
      mejorN = n;
      mejor = d;
    }
  }
  return mejor;
}

/** Parser de una línea CSV respetando comillas dobles. */
function parsearLinea(linea: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let enComillas = false;
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i];
    if (ch === '"') {
      if (enComillas && linea[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        enComillas = !enComillas;
      }
    } else if (ch === delim && !enComillas) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Normaliza el nombre de columna: minúsculas, sin espacios ni acentos. */
function normCol(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/** Limpia un valor crudo de `servicio` a su categoría canónica. */
export function limpiarServicio(raw: string): TipoServicio | null {
  const low = raw.trim().toLowerCase();
  if (low === "") return null;
  if (low in CORRECCIONES_SERVICIO) return CORRECCIONES_SERVICIO[low];
  if (low === "consulta" || low === "pago" || low === "tramite") return low;
  return null;
}

export function esTypo(raw: string): boolean {
  const low = raw.trim().toLowerCase();
  return low !== "" && low !== "consulta" && low !== "pago" && low !== "tramite";
}

/** Analiza el texto de un CSV y devuelve el resumen del EDA + proporciones. */
export function analizarCsv(texto: string, nombreArchivo = "centro_atencion.csv"): CsvAnalysis {
  try {
    const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lineas.length < 2) {
      return { ...vacio(nombreArchivo), error: "El archivo no tiene filas de datos (solo cabecera o vacío)." };
    }
    const delim = detectarDelimitador(lineas[0]);
    const headerOrig = parsearLinea(lineas[0], delim);
    const header = headerOrig.map(normCol);
    const idxServicio = header.findIndex((h) => h.includes("servicio") && !h.includes("duracion"));
    const idxFecha = header.findIndex((h) => h.includes("fecha"));

    if (idxServicio === -1) {
      return {
        ...vacio(nombreArchivo),
        error: 'No se encontró la columna "servicio". Columnas detectadas: ' + header.join(", "),
      };
    }

    const filas = lineas.slice(1).map((l) => parsearLinea(l, delim));
    const totalFilas = filas.length;

    // forward fill de `fecha` (igual que df['fecha'].ffill() del notebook)
    let fechasImputadas = 0;
    if (idxFecha >= 0) {
      let ultima = "";
      for (const f of filas) {
        const v = (f[idxFecha] ?? "").trim();
        if (v === "") {
          if (ultima !== "") {
            f[idxFecha] = ultima;
            fechasImputadas++;
          }
        } else {
          ultima = v;
        }
      }
    }

    // ---- vacíos por columna ----
    const columnas: ColumnStats[] = headerOrig.map((nombre, i) => {
      let vacios = 0;
      const set = new Set<string>();
      for (const f of filas) {
        const v = (f[i] ?? "").trim();
        if (v === "") vacios++;
        else set.add(v);
      }
      return { nombre, vacios, distintos: set.size };
    });

    // ---- limpieza de servicio + typos ----
    const conteo: Record<TipoServicio, number> = { consulta: 0, pago: 0, tramite: 0 };
    const typoMap = new Map<string, number>();
    let filasCorregidas = 0;
    let filasDescartadas = 0;
    const muestra: { crudo: string; corregido: string }[] = [];

    for (const f of filas) {
      const crudo = f[idxServicio] ?? "";
      const cat = limpiarServicio(crudo);
      if (cat === null) {
        if (crudo.trim() !== "") filasDescartadas++;
        continue;
      }
      if (esTypo(crudo)) {
        typoMap.set(crudo.trim().toLowerCase(), (typoMap.get(crudo.trim().toLowerCase()) ?? 0) + 1);
        filasCorregidas++;
      }
      conteo[cat]++;
      if (muestra.length < 6 && esTypo(crudo)) muestra.push({ crudo, corregido: cat });
    }

    const validos = conteo.consulta + conteo.pago + conteo.tramite;
    if (validos === 0) {
      return { ...vacio(nombreArchivo), error: 'La columna "servicio" no tiene valores reconocibles (consulta/pago/trámite).' };
    }

    const proporciones: Proporciones = {
      consulta: conteo.consulta / validos,
      pago: conteo.pago / validos,
      tramite: conteo.tramite / validos,
    };

    return {
      ok: true,
      nombreArchivo,
      totalFilas,
      columnas,
      fechasImputadas,
      vaciosTotales: columnas.reduce((a, c) => a + c.vacios, 0),
      typos: [...typoMap.entries()]
        .map(([valor, cantidad]) => ({ valor, cantidad, corrigeA: CORRECCIONES_SERVICIO[valor] }))
        .sort((a, b) => b.cantidad - a.cantidad),
      filasCorregidas,
      filasDescartadas,
      proporciones,
      muestra,
      fuente: "archivo",
    };
  } catch (e) {
    return { ...vacio(nombreArchivo), error: "No se pudo leer el archivo: " + (e as Error).message };
  }
}

function vacio(nombreArchivo: string): CsvAnalysis {
  return {
    ok: false,
    nombreArchivo,
    totalFilas: 0,
    columnas: [],
    vaciosTotales: 0,
    typos: [],
    filasCorregidas: 0,
    filasDescartadas: 0,
    fechasImputadas: 0,
    proporciones: { consulta: 0, pago: 0, tramite: 0 },
    muestra: [],
    fuente: "archivo",
  };
}

/** Convierte las filas sintéticas a texto CSV descargable (delimitador coma). */
export function rowsToCsv(rows: RawRow[]): string {
  const header = "id_cliente,fecha,hora_llegada,servicio,duracion_servicio_min";
  const lines = rows.map((r) => {
    // la duración usa coma decimal -> se entrecomilla para no romper el CSV
    const dur = r.duracion ? `"${r.duracion}"` : "";
    return [r.idCliente, r.fecha, r.horaLlegada, r.servicio, dur].join(",");
  });
  return [header, ...lines].join("\n");
}

/** Genera el CSV sintético de 1.190 filas listo para descargar. */
export function csvSintetico(nRows = 1190): string {
  return rowsToCsv(generarDataset(nRows));
}
