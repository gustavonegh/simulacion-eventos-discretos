import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts";
import { Dices, FlaskConical, Play, RefreshCw, RotateCcw, Sigma } from "lucide-react";
import { Badge, Card, ChartTip, DeltaChip, Section, StatTile } from "./ui";
import DesDiagramInteractive from "./DesDiagramInteractive";
import { histogram, runReplicas, type Metrics, type ReplicaSet } from "@/lib/sim";
import type { Proporciones } from "@/lib/dist";
import { METRIC_META } from "@/lib/meta";
import { cn } from "@/utils/cn";

const N_OPTS = [20, 50, 100, 500];
const COMPARE_KEYS: (keyof Metrics)[] = [
  "esperaMedia",
  "percentil90",
  "utilizacion",
  "longitudMediaCola",
  "tiempoMedioSistema",
  "maxEspera",
];

function IcBar({ lo, hi, media }: { lo: number; hi: number; media: number }) {
  const span = Math.max(hi - lo, 1e-9);
  const pad = span * 0.15;
  const a = lo - pad;
  const b = hi + pad;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - a) / (b - a)) * 100));
  return (
    <div className="relative mt-2 h-2 rounded-full bg-white/5">
      <div
        className="absolute h-full rounded-full bg-gradient-to-r from-indigo-500/70 via-cyan-400/70 to-indigo-500/70"
        style={{ left: `${pct(lo)}%`, width: `${Math.max(2, pct(hi) - pct(lo))}%` }}
      />
      <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-300 shadow" style={{ left: `${pct(media)}%` }} />
    </div>
  );
}

export default function Lab({
  baseInit,
  impInit,
  fuente,
  proporciones,
  seed,
  onSeedChange,
}: {
  baseInit: ReplicaSet;
  impInit: ReplicaSet;
  fuente: "informe" | "csv";
  proporciones: Proporciones;
  seed: number;
  onSeedChange: (s: number) => void;
}) {
  const [n, setN] = useState(50);
  const [base, setBase] = useState(baseInit);
  const [imp, setImp] = useState(impInit);
  const [busy, setBusy] = useState(false);

  const run = () => {
    setBusy(true);
    // pequeña pausa para que el estado "ejecutando…" se perciba
    setTimeout(() => {
      setBase(runReplicas(n, seed, false, proporciones));
      setImp(runReplicas(n, seed, true, proporciones));
      setBusy(false);
    }, 300);
  };

  const lineData = useMemo(
    () => base.esperaPorJornada.map((v, i) => ({ j: i + 1, base: +v.toFixed(2), mejorado: +imp.esperaPorJornada[i].toFixed(2) })),
    [base, imp]
  );

  const arrivalsData = useMemo(() => {
    const labels = ["09–10", "10–11", "11–12", "12–13", "13–14", "14–15", "15+"];
    return base.arribosPorHora.map((c, i) => ({ franja: labels[i], arribos: +(c / base.n).toFixed(1) }));
  }, [base]);

  // Escala del eje Y del scatter (mínimo 40 min, como en la figura de referencia)
  const yMax = useMemo(() => {
    const mx = Math.max(...lineData.flatMap((d) => [d.base, d.mejorado]));
    return Math.max(40, Math.ceil(mx / 10) * 10);
  }, [lineData]);

  const histData = useMemo(() => {
    const hb = histogram(base.esperasAcumuladas, 5, 14);
    const hi = histogram(imp.esperasAcumuladas, 5, 14);
    const n = Math.max(hb.length, hi.length);
    return Array.from({ length: n }, (_, i) => ({
      x: (hb[i] ?? hi[i]).label,
      base: hb[i]?.count ?? 0,
      mejorado: hi[i]?.count ?? 0,
    }));
  }, [base, imp]);

  const metricKeys = Object.keys(METRIC_META) as (keyof Metrics)[];

  const eB = base.stats.esperaMedia;
  const eI = imp.stats.esperaMedia;
  const icB = eB; // media + IC 95% del escenario base
  const icI = eI; // media del escenario mejorado
  const mB = base.stats.maxEspera;
  const mI = imp.stats.maxEspera;
  const icOverlap = eI.icInf <= eB.icSup && eB.icInf <= eI.icSup;
  const mejoraClara = eI.media < eB.media && mI.media < mB.media && !icOverlap;

  return (
    <Section
      id="laboratorio"
      eyebrow="5 · Opción 2 — Réplicas independientes e indicadores (IC 95%)"
      title={
        <>
          Laboratorio de <span className="text-fuchsia-400">{base.n} jornadas</span> con intervalos de confianza
        </>
      }
      description="Cada réplica es una jornada completa e independiente (misma semilla para base y mejora, como en el notebook: comparación justa). Se reporta la media muestral y el IC 95% = media ± 1.96 · SEM sobre las réplicas."
    >
      {/* controles */}
      <Card className="mb-5 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          <FlaskConical className="h-4 w-4 text-fuchsia-300" /> Controles
        </span>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {N_OPTS.map((v) => (
            <button
              key={v}
              onClick={() => setN(v)}
              className={cn("rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition", n === v ? "bg-fuchsia-400/20 text-fuchsia-300" : "text-slate-500 hover:text-slate-300")}
            >
              {v} réplicas
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          <Sigma className="ml-2 h-4 w-4 text-indigo-400" />
          <span className="px-1 font-mono text-[11px] text-slate-500">semilla</span>
          <input
            type="number"
            value={seed}
            onChange={(e) => onSeedChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className="w-16 bg-transparent px-1 font-mono text-xs font-bold text-indigo-300 outline-none"
          />
          <button
            onClick={() => onSeedChange(Math.floor(Math.random() * 100000))}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/10"
            title="Sortear una semilla al azar: nueva muestra de jornadas"
          >
            <Dices className="h-3.5 w-3.5" /> aleatoria
          </button>
          <button
            onClick={() => onSeedChange(42)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition",
              seed === 42 ? "bg-indigo-400/20 text-indigo-300" : "text-slate-400 hover:bg-white/10"
            )}
            title="Volver a la semilla 42 del informe (resultados reproducibles)"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 42
          </button>
        </div>
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-fuchsia-500/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {busy ? "Simulando…" : "Ejecutar réplicas"}
        </button>
        <span className="ml-auto font-mono text-[11px] text-slate-500">
          {base.n} jornadas base + {imp.n} mejoradas · {base.days.reduce((a, d) => a + d.nAtendidos, 0).toLocaleString("es-AR")} clientes atendidos en total (base)
        </span>
      </Card>

      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-2xl border border-indigo-400/20 bg-indigo-400/5 px-4 py-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <RotateCcw className="h-3.5 w-3.5 text-indigo-400" />
          <strong className="text-slate-200">Semilla 42</strong> = los mismos números del informe, reproducibles y comparables.
        </span>
        <span className="flex items-center gap-1.5">
          <Dices className="h-3.5 w-3.5 text-fuchsia-400" />
          <strong className="text-slate-200">Semilla aleatoria</strong> = otra muestra de jornadas: las medias se mueven unos minutos, pero las conclusiones se mantienen si aumentás las réplicas.
        </span>
      </div>

      {/* ---- Motor DES interactivo (integrado en la Opción 2) ---- */}
      <Card className="mb-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-white">Motor de eventos discretos · arquitectura interactiva</h3>
          <Badge tone="indigo">reloj + FEL + cola FIFO</Badge>
          <span className="text-[11px] text-slate-500">hacé clic en los bloques · recorrido automático disponible</span>
        </div>
        <DesDiagramInteractive />
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* tabla de métricas base con IC */}
        <Card className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Indicadores de desempeño — escenario base</h3>
          <div className="flex gap-1.5">
            <Badge tone="indigo">IC 95% = media ± 1.96·SEM</Badge>
            {fuente === "csv" && <Badge tone="emerald">datos de tu CSV</Badge>}
          </div>
        </div>
          <div className="mt-4 space-y-3.5">
            {metricKeys.map((k) => {
              const s = base.stats[k];
              const m = METRIC_META[k];
              return (
                <div key={k} className="rounded-xl border border-white/5 bg-white/[0.03] px-3.5 py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">{m.label}</span>
                      <span className="ml-2 text-[10px] text-slate-500">{m.desc}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-lg font-bold text-white tabular-nums">{m.fmt(s.media)}</span>
                      <span className="ml-2 font-mono text-[10px] text-slate-500">
                        IC [{m.fmt(s.icInf)}{m.unit ? " " + m.unit : ""}, {m.fmt(s.icSup)}{m.unit ? " " + m.unit : ""}]
                      </span>
                    </div>
                  </div>
                  <IcBar lo={s.icInf} hi={s.icSup} media={s.media} />
                </div>
              );
            })}
          </div>
        </Card>

        {/* charts derecha */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white">Espera media por jornada · escenario base</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-slate-400">
                cada punto = 1 jornada
              </span>
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                banda = IC 95 %
              </span>
            </div>
            <div className="mt-3 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={lineData} margin={{ top: 6, right: 10, bottom: 14, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis
                    dataKey="j"
                    type="number"
                    name="Jornada"
                    domain={[1, base.n]}
                    tick={{ fill: "#64748b", fontSize: 9 }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "jornada #", position: "insideBottomRight", offset: -4, fill: "#475569", fontSize: 9 }}
                  />
                  <YAxis
                    type="number"
                    name="Espera media"
                    domain={[0, yMax]}
                    tick={{ fill: "#475569", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    unit="m"
                  />
                  <Tooltip content={<ChartTip unit="min" />} cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }} />
                  {/* banda del IC 95% + línea de media del escenario base */}
                  <ReferenceArea y1={icB.icInf} y2={icB.icSup} fill="#f59e0b" fillOpacity={0.1} stroke="none" />
                  <ReferenceLine y={icB.media} stroke="#f59e0b" strokeDasharray="6 4" strokeWidth={1.4} />
                  <ReferenceLine y={icI.media} stroke="#34d399" strokeDasharray="6 4" strokeWidth={1.4} />
                  <Scatter dataKey="base" name="Base" fill="#e879f9" shape="circle" legendType="circle" />
                  <Scatter dataKey="mejorado" name="Mejorado (−20% trámites)" fill="#34d399" shape="circle" legendType="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-fuchsia-400" /> base · media {METRIC_META.esperaMedia.fmt(icB.media)} min</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> mejorado · media {METRIC_META.esperaMedia.fmt(icI.media)} min</span>
            </div>
          </Card>
          <Card>
            <h3 className="text-sm font-bold text-white">Arribos por franja horaria (promedio por jornada)</h3>
            <p className="mt-1 text-[11px] text-slate-500">Las llegadas no son homogéneas: picos a media mañana (motiva un NHPP en la reflexión 4).</p>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={arrivalsData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                  <XAxis dataKey="franja" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip unit="clientes/día" />} />
                  <Area type="monotone" dataKey="arribos" name="arribos" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.25} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        {/* histograma esperas */}
        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Distribución de esperas (todas las réplicas, clientes pooled)</h3>
            <div className="flex gap-2 font-mono text-[10px]">
              <span className="flex items-center gap-1 text-indigo-300"><span className="h-2 w-2 rounded-sm bg-indigo-400" /> base</span>
              <span className="flex items-center gap-1 text-emerald-300"><span className="h-2 w-2 rounded-sm bg-emerald-400" /> mejorado</span>
            </div>
          </div>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histData} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} label={{ value: "espera (min)", position: "insideBottomRight", offset: -2, fill: "#475569", fontSize: 9 }} />
                <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip unit="clientes" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="base" name="Base" fill="#818cf8" radius={[3, 3, 0, 0]} maxBarSize={26} />
                <Bar dataKey="mejorado" name="Mejorado" fill="#34d399" radius={[3, 3, 0, 0]} maxBarSize={26} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {base.esperasAcumuladas.length.toLocaleString("es-AR")} esperas registradas en {base.n} jornadas. La mejora desplaza masa hacia esperas cortas y recorta la cola derecha.
          </p>
        </Card>

        {/* tabla comparativa */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Base vs Mejorado</h3>
            <Badge tone="emerald">misma semilla {seed}</Badge>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-white/[0.05] font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 text-left">Métrica</th>
                  <th className="px-2 py-2 text-right">Base</th>
                  <th className="px-2 py-2 text-right">Mejora</th>
                  <th className="px-3 py-2 text-right">Δ</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_KEYS.map((k) => {
                  const m = METRIC_META[k];
                  const b = base.stats[k].media;
                  const i = imp.stats[k].media;
                  const d = i - b;
                  const pct = b !== 0 ? (d / b) * 100 : 0;
                  return (
                    <tr key={k} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-3 py-2.5 font-medium text-slate-300">{m.label}</td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-indigo-300">{m.fmt(b)}</td>
                      <td className="px-2 py-2.5 text-right font-mono tabular-nums text-emerald-300">{m.fmt(i)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="inline-flex flex-col items-end gap-0.5">
                          <DeltaChip delta={d} suffix={m.unit === "%" ? "" : ""} />
                          <span className="font-mono text-[9px] text-slate-500 tabular-nums">{pct > 0 ? "+" : ""}{pct.toFixed(1)}%</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <StatTile label="Espera media" value={METRIC_META.esperaMedia.fmt(base.stats.esperaMedia.media)} sub={`→ ${METRIC_META.esperaMedia.fmt(imp.stats.esperaMedia.media)} min`} accent="text-indigo-300" />
            <StatTile label="Utilización" value={METRIC_META.utilizacion.fmt(base.stats.utilizacion.media)} sub={`→ ${METRIC_META.utilizacion.fmt(imp.stats.utilizacion.media)}`} accent="text-cyan-300" />
            <StatTile label="Máx. espera" value={METRIC_META.maxEspera.fmt(base.stats.maxEspera.media)} sub={`→ ${METRIC_META.maxEspera.fmt(imp.stats.maxEspera.media)} min`} accent="text-rose-300" />
          </div>
        </Card>
      </div>

      <Card className="mt-5 border-emerald-400/25 bg-gradient-to-r from-emerald-500/10 via-transparent to-indigo-500/10">
        <p className="text-sm leading-relaxed text-slate-300">
          <strong className="text-emerald-300">Conclusión:</strong> aunque «trámite» representa solo el 10% de los arribos, su alta
          variabilidad y duración genera cuellos de botella.{" "}
          {mejoraClara ? (
            <>
              Agilizarlo un 20% (formulario de pre-carga digital) reduce la espera media de{" "}
              <span className="font-mono font-bold text-indigo-300">{METRIC_META.esperaMedia.fmt(eB.media)} min</span> a{" "}
              <span className="font-mono font-bold text-emerald-300">{METRIC_META.esperaMedia.fmt(eI.media)} min</span> y la espera máxima
              de <span className="font-mono font-bold text-indigo-300">{METRIC_META.maxEspera.fmt(mB.media)} min</span> a{" "}
              <span className="font-mono font-bold text-emerald-300">{METRIC_META.maxEspera.fmt(mI.media)} min</span>: una mejora altamente
              efectiva para descongestionar la cola.
            </>
          ) : (
            <>
              Con {base.n} réplicas los intervalos de confianza se solapan (espera media:{" "}
              <span className="font-mono text-indigo-300">{METRIC_META.esperaMedia.fmt(eB.media)}</span> vs{" "}
              <span className="font-mono text-emerald-300">{METRIC_META.esperaMedia.fmt(eI.media)} min</span>), así que la diferencia aún no
              es concluyente: probá aumentar el número de réplicas en los controles y vas a ver que la mejora (−20% en trámites) se
              consolida estadísticamente.
            </>
          )}
        </p>
      </Card>
    </Section>
  );
}
