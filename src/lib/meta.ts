import type { Metrics } from "./sim";

export type MetricMeta = {
  label: string;
  unit: string;
  desc: string;
  fmt: (v: number) => string;
};

export const METRIC_META: Record<keyof Metrics, MetricMeta> = {
  esperaMedia: {
    label: "Espera media",
    unit: "min",
    desc: "Tiempo promedio de espera en cola por cliente",
    fmt: (v) => v.toFixed(3),
  },
  percentil90: {
    label: "Percentil 90 de espera",
    unit: "min",
    desc: "El 90% de los clientes espera menos que este valor",
    fmt: (v) => v.toFixed(3),
  },
  propEsperaMayor40: {
    label: "Proporción con espera > 40 min",
    unit: "",
    desc: "Fracción de clientes que esperó más de 40 minutos",
    fmt: (v) => v.toFixed(3),
  },
  utilizacion: {
    label: "Utilización del servidor",
    unit: "",
    desc: "Ventanilla ocupada sobre el reloj final de cada jornada (como en el notebook)",
    fmt: (v) => (v * 100).toFixed(1) + "%",
  },
  tiempoMedioSistema: {
    label: "Tiempo medio en el sistema",
    unit: "min",
    desc: "Espera + servicio (Ley de Little: W = L / λ)",
    fmt: (v) => v.toFixed(3),
  },
  longitudMediaCola: {
    label: "Longitud media de cola",
    unit: "clientes",
    desc: "Área bajo la curva de la cola / tiempo de simulación",
    fmt: (v) => v.toFixed(3),
  },
  maxEspera: {
    label: "Máxima espera observada",
    unit: "min",
    desc: "Peor caso de la jornada (cola más larga)",
    fmt: (v) => v.toFixed(3),
  },
};

export const TIPO_COLOR: Record<string, string> = {
  consulta: "#60a5fa",
  pago: "#34d399",
  tramite: "#fb7185",
};

export const TIPO_BG: Record<string, string> = {
  consulta: "bg-sky-400/15 text-sky-300 border-sky-400/30",
  pago: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  tramite: "bg-rose-400/15 text-rose-300 border-rose-400/30",
};

export const TIPO_DOT: Record<string, string> = {
  consulta: "bg-sky-400",
  pago: "bg-emerald-400",
  tramite: "bg-rose-400",
};
