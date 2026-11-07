import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Play, Sparkles, Users, Clock3, TimerReset } from "lucide-react";
import type { ReplicaSet } from "@/lib/sim";
import { METRIC_META, TIPO_DOT } from "@/lib/meta";
import { cn } from "@/utils/cn";

const TRACK_DOTS = [
  "consulta", "pago", "consulta", "tramite", "consulta", "pago", "consulta",
  "pago", "consulta", "tramite", "consulta", "pago", "consulta", "pago",
];

export default function Hero({ base, improved }: { base: ReplicaSet; improved: ReplicaSet }) {
  const esperaBase = base.stats.esperaMedia.media;
  const esperaImp = improved.stats.esperaMedia.media;
  const utilBase = base.stats.utilizacion.media;

  return (
    <section id="top" className="bg-grid relative overflow-hidden pt-16">
      {/* orbes de color */}
      <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 top-40 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-[120px]" />
      <div className="pointer-events-none absolute -left-24 top-64 h-80 w-80 rounded-full bg-cyan-500/15 blur-[110px]" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pt-24">
        <div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 font-mono text-[11px] font-medium text-indigo-300">
              <Sparkles className="h-3.5 w-3.5" />
              SIMULACIÓN DE EVENTOS DISCRETOS · reloj + FEL + cola FIFO
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl">
              Centro de Atención
              <span className="text-glow block bg-gradient-to-r from-indigo-400 via-cyan-300 to-fuchsia-400 bg-clip-text text-transparent">
                Universitaria
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
              Sistema administrativo con <strong className="text-slate-200">una única estación de servicio</strong> que atiende de{" "}
              <strong className="font-mono text-cyan-300">09:00 a 15:00</strong>. Explorá el EDA del dataset real, el modelo
              probabilístico ajustado y ejecutá el simulador con dos modalidades interactivas.
            </p>

            {/* Métricas en vivo (50 réplicas, semilla 42) */}
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              <div className="glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <Clock3 className="h-3.5 w-3.5 text-indigo-400" /> Espera media
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">{esperaBase.toFixed(2)}</div>
                <div className="text-[11px] text-slate-500">min · IC95 [{base.stats.esperaMedia.icInf.toFixed(2)}, {base.stats.esperaMedia.icSup.toFixed(2)}]</div>
              </div>
              <div className="glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <Users className="h-3.5 w-3.5 text-indigo-400" /> Utilización
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-white tabular-nums">{(utilBase * 100).toFixed(1)}%</div>
                <div className="text-[11px] text-slate-500">del servidor único</div>
              </div>
              <div className="glass rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <TimerReset className="h-3.5 w-3.5 text-emerald-400" /> Con mejora
                </div>
                <div className="mt-1 font-mono text-2xl font-bold text-emerald-300 tabular-nums">{esperaImp.toFixed(2)}</div>
                <div className="text-[11px] text-slate-500">min · trámites −20%</div>
              </div>
            </div>
          </motion.div>

          {/* LAS DOS OPCIONES */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-9 grid gap-4 sm:grid-cols-2"
          >
            <a
              href="#simulador"
              className="group relative overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/15 via-[#0a0e1a] to-[#0a0e1a] p-5 transition hover:border-sky-400/50 hover:shadow-lg hover:shadow-sky-500/10"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-sky-300 uppercase">
                <Play className="h-4 w-4" /> Opción 1
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-white">Simulador en vivo</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Mirá una jornada completa animada: reloj, Lista de Eventos Futuros, arribos y fins de servicio sobre la cola FIFO.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-300">
                Entrar al simulador <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
            <a
              href="#laboratorio"
              className="group relative overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/15 via-[#0a0e1a] to-[#0a0e1a] p-5 transition hover:border-fuchsia-400/50 hover:shadow-lg hover:shadow-fuchsia-500/10"
            >
              <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-widest text-fuchsia-300 uppercase">
                <BarChart3 className="h-4 w-4" /> Opción 2
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-white">Laboratorio de réplicas</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                Ejecutá 50 jornadas independientes en el navegador, calculá indicadores con IC 95% y contrastá base vs mejora.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-300">
                Abrir el laboratorio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          </motion.div>
        </div>

        {/* Visual animado: fila que llega a la ventanilla */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="glass relative hidden overflow-hidden rounded-3xl p-6 lg:block"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">vista previa · cola FIFO</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 animate-blink rounded-full bg-emerald-400" /> en vivo
            </span>
          </div>
          <div className="relative mt-8 h-40">
            <div className="absolute bottom-8 left-0 h-px w-[320px] bg-gradient-to-r from-slate-700 via-slate-500 to-transparent" />
            {TRACK_DOTS.map((t, i) => (
              <span
                key={i}
                className={cn("animate-travel absolute bottom-[29px] left-0 h-3 w-3 rounded-full", TIPO_DOT[t])}
                style={{ animationDelay: `${i * 0.5}s`, animationDuration: "7s" }}
              />
            ))}
            {/* ventanilla */}
            <div className="animate-server-pulse absolute bottom-4 right-0 flex h-20 w-24 flex-col items-center justify-center rounded-2xl border border-emerald-400/40 bg-emerald-400/10">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Ventanilla</span>
              <span className="font-mono text-sm font-bold text-white">ÚNICA</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10px]">
            {(["consulta", "pago", "tramite"] as const).map((t) => (
              <div key={t} className="flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2 py-1.5 text-slate-400">
                <span className={cn("h-2 w-2 rounded-full", TIPO_DOT[t])} /> {t}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/5 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
            <span className="text-indigo-400">reloj</span> = 09:00 → 15:00+ · <span className="text-sky-400">ARRIBO</span> ·{" "}
            <span className="text-violet-400">FIN_SERVICIO</span> · FEL (min-heap) · cola <span className="text-amber-300">FIFO</span> · sin
            abandonos post-cierre
          </div>
        </motion.div>
      </div>

      {/* cinta de métricas clave */}
      <div className="relative border-t border-white/5 bg-black/30">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-px px-4 sm:grid-cols-4 lg:px-8">
          {(
            [
              ["Registros CSV", "1.190", "5 columnas · 142 vacíos/col"],
              ["Espera media (base)", METRIC_META.esperaMedia.fmt(esperaBase) + " min", `IC95 [${base.stats.esperaMedia.icInf.toFixed(2)}, ${base.stats.esperaMedia.icSup.toFixed(2)}]`],
              ["P90 de espera", METRIC_META.percentil90.fmt(base.stats.percentil90.media) + " min", `IC95 [${base.stats.percentil90.icInf.toFixed(2)}, ${base.stats.percentil90.icSup.toFixed(2)}]`],
              ["Máx. espera (base)", METRIC_META.maxEspera.fmt(base.stats.maxEspera.media) + " min", `mejora: ${METRIC_META.maxEspera.fmt(improved.stats.maxEspera.media)} min`],
            ] as const
          ).map(([l, v, s]) => (
            <div key={l} className="px-4 py-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{l}</div>
              <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">{v}</div>
              <div className="text-[10px] text-slate-600">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
