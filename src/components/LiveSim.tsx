import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  CheckCircle2,
  Clock3,
  DoorClosed,
  Hourglass,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
  SkipForward,
  UserCheck,
  Users,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge, Card, ChartTip, Section, StatTile } from "./ui";
import { fmtClock, fmtHM, histogram, simularJornada, TIEMPO_CIERRE_ARRIBOS, type DayResult } from "@/lib/sim";
import { mulberry32 } from "@/lib/rng";
import type { Proporciones } from "@/lib/dist";
import { METRIC_META, TIPO_BG, TIPO_COLOR, TIPO_DOT } from "@/lib/meta";
import { cn } from "@/utils/cn";

const SPEEDS = [5, 15, 40, 90];

function waitTone(w: number): string {
  if (w > 30) return "border-rose-400/40 bg-rose-400/10 text-rose-300";
  if (w > 15) return "border-amber-400/40 bg-amber-400/10 text-amber-300";
  return "border-emerald-400/40 bg-emerald-400/10 text-emerald-300";
}

export default function LiveSim({ proporciones, fuente }: { proporciones: Proporciones; fuente: "informe" | "csv" }) {
  const [seed, setSeed] = useState(42);
  const [improved, setImproved] = useState(false);
  const day = useMemo<DayResult>(
    () => simularJornada(mulberry32(seed), { tramiteFactor: improved ? 0.8 : 1, props: proporciones }),
    [seed, improved, proporciones]
  );
  const [reloj, setReloj] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const relojRef = useRef(0);
  const rafRef = useRef(0);

  // al cambiar de jornada (semilla o escenario) se reinicia el reloj
  useEffect(() => {
    relojRef.current = 0;
    setReloj(0);
    setPlaying(false);
  }, [day]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const nr = Math.min(day.relojFinal, relojRef.current + speed * dt);
      relojRef.current = nr;
      setReloj(nr);
      if (nr >= day.relojFinal) {
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, day]);

  // ---- estado derivado en el instante `reloj` ----
  const idx = useMemo(() => {
    let i = 0;
    while (i < day.events.length && day.events[i].t <= reloj) i++;
    return i;
  }, [day, reloj]);
  const lastEvent = idx > 0 ? day.events[idx - 1] : null;
  const upcoming = day.events.slice(idx, idx + 6);
  const arrivals = day.clients.filter((c) => c.llegada <= reloj);
  const waiting = arrivals.filter((c) => c.inicio === -1 || c.inicio > reloj);
  const enServicio =
    arrivals.find((c) => c.inicio >= 0 && c.inicio <= reloj && c.fin > reloj) ?? null;
  const atendidos = day.clients.filter((c) => c.fin > 0 && c.fin <= reloj).length;
  const esperas = day.clients
    .filter((c) => c.espera >= 0 && c.inicio >= 0 && c.inicio <= reloj)
    .map((c) => c.espera);
  const esperaMediaLive = esperas.length ? esperas.reduce((a, b) => a + b, 0) / esperas.length : 0;
  const maxEsperaLive = esperas.length ? Math.max(...esperas) : 0;
  const finished = day.relojFinal > 0 && reloj >= day.relojFinal;

  const step = () => {
    const next = day.events.find((e) => e.t > reloj);
    const t = next ? next.t : day.relojFinal;
    relojRef.current = t;
    setReloj(t);
    setPlaying(false);
  };

  const rechazado = day.proximoArriboRechazado;
  // El timeline se extiende hasta cubrir el arribo rechazado, para que se vea
  // por qué la jornada puede terminar antes de las 15:00.
  const tMax = Math.max(TIEMPO_CIERRE_ARRIBOS, day.relojFinal, rechazado ?? 0);
  const terminoAntes = day.relojFinal < TIEMPO_CIERRE_ARRIBOS;
  const waitBins = useMemo(
    () => histogram(esperas, 5, 12).map((b) => ({ x: b.label, n: b.count, x0: b.x0 })),
    [esperas.join(",")]
  );

  return (
    <Section
      id="simulador"
      eyebrow="4 · Opción 1 — Simulador de eventos discretos en vivo"
      title={
        <>
          Mirá correr una jornada: <span className="text-sky-300">reloj, FEL y cola FIFO</span>
        </>
      }
      description="Cada tick del reloj procesa el próximo evento de la Lista de Eventos Futuros. Los arribos se pintan según su tipo de servicio; cuando la ventanilla está ocupada, el cliente entra a la cola FIFO. A las 15:00 se cierra el ingreso, pero se atiende a todos los que quedaron."
    >
      {/* ---- controles ---- */}
      <Card className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {([false, true] as const).map((imp) => (
            <button
              key={String(imp)}
              onClick={() => setImproved(imp)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                improved === imp ? (imp ? "bg-emerald-400/20 text-emerald-300" : "bg-indigo-400/20 text-indigo-300") : "text-slate-500 hover:text-slate-300"
              )}
            >
              {imp ? "Mejorado: trámites −20%" : "Escenario base"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          <button
            onClick={() => setPlaying((p) => !p)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500/80 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-400"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pausa" : "Play"}
          </button>
          <button onClick={step} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10" title="Avanzar al próximo evento">
            <SkipForward className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              relojRef.current = 0;
              setReloj(0);
              setPlaying(true);
            }}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            title="Reiniciar jornada"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSeed(Math.floor(Math.random() * 100000));
            }}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            title="Nueva semilla aleatoria"
          >
            <Shuffle className="h-4 w-4" /> nueva jornada
          </button>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold transition",
                speed === s ? "bg-cyan-400/20 text-cyan-300" : "text-slate-500 hover:text-slate-300"
              )}
            >
              {s}×
            </button>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-2 font-mono text-[11px] text-slate-500">
          {fuente === "csv" && <Badge tone="emerald">datos de tu CSV</Badge>}
          semilla <span className="font-bold text-indigo-300">{seed}</span> · {idx}/{day.events.length} eventos procesados
        </span>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ---- columna izquierda: reloj + timeline + ventanilla + cola ---- */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Reloj del simulador</div>
                <div className={cn("text-glow mt-1 font-mono text-5xl font-black tabular-nums sm:text-6xl", finished ? "text-emerald-300" : "text-white")}>
                  {fmtClock(reloj)}
                </div>
                <div className="mt-1 font-mono text-xs text-slate-500">
                  t = {reloj.toFixed(1)} min desde 09:00 {reloj > TIEMPO_CIERRE_ARRIBOS && <span className="text-amber-300">· post-cierre (se vacía la cola)</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatTile label="Arribados" value={String(arrivals.length)} accent="text-sky-300" />
                <StatTile label="En cola" value={String(waiting.length)} accent={waiting.length > 0 ? "text-amber-300" : "text-white"} />
                <StatTile label="Atendidos" value={String(atendidos)} accent="text-emerald-300" />
                <StatTile label="Espera media" value={esperas.length ? esperaMediaLive.toFixed(2) : "—"} sub={esperas.length ? `máx ${maxEsperaLive.toFixed(1)} min` : undefined} accent="text-indigo-300" />
              </div>
            </div>

            {/* timeline de la jornada */}
            <div className="relative mt-8 h-28 rounded-xl border border-white/5 bg-black/30 px-2 pb-2 pt-6">
              {/* línea de cierre 15:00 */}
              <div className="absolute bottom-2 top-5 w-px bg-amber-400/60" style={{ left: `${(TIEMPO_CIERRE_ARRIBOS / tMax) * 100}%` }}>
                <span className="absolute -top-5 left-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap font-mono text-[9px] text-amber-300">
                  <DoorClosed className="h-3 w-3" /> 15:00 cierre
                </span>
              </div>
              {/* arribos abajo */}
              {day.events
                .filter((e) => e.tipo === "ARRIBO")
                .map((e, i) => (
                  <span
                    key={"a" + i}
                    className={cn("absolute bottom-2 h-2 w-2 -translate-x-1/2 rounded-full transition-opacity", TIPO_DOT[e.client.tipo])}
                    style={{ left: `${(e.t / tMax) * 100}%`, opacity: e.t <= reloj ? 1 : 0.25 }}
                  />
                ))}
              {/* fins arriba */}
              {day.events
                .filter((e) => e.tipo === "FIN_SERVICIO")
                .map((e, i) => (
                  <span
                    key={"f" + i}
                    className="absolute top-6 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-violet-400 transition-opacity"
                    style={{ left: `${(e.t / tMax) * 100}%`, opacity: e.t <= reloj ? 1 : 0.2 }}
                  />
                ))}
              {/* playhead */}
              <div
                className="absolute bottom-2 top-5 w-0.5 bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]"
                style={{ left: `${(reloj / tMax) * 100}%` }}
              />
              {/* etiquetas de hora */}
              {[0, 60, 120, 180, 240, 300, 360].map((m) => (
                <span key={m} className="absolute bottom-0 -translate-x-1/2 font-mono text-[9px] text-slate-600" style={{ left: `${(m / tMax) * 100}%` }}>
                  {fmtHM(m)}
                </span>
              ))}
              {/* arribo rechazado por caer después de las 15:00 */}
              {rechazado && (
                <div className="absolute top-5 bottom-2 w-px border-l border-dashed border-slate-600" style={{ left: `${(rechazado / tMax) * 100}%` }}>
                  <span
                    className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] text-slate-500"
                    title={`Arribo previsto a las ${fmtHM(rechazado)}: cayó después del cierre y no fue admitido`}
                  >
                    ✕ {fmtHM(rechazado)}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] text-slate-500">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400" /> ARRIBO (color = tipo de servicio)</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rotate-45 bg-violet-400" /> FIN_SERVICIO</span>
              <span className="flex items-center gap-1"><span className="h-3 w-0.5 bg-cyan-300" /> reloj actual</span>
              {rechazado && <span className="flex items-center gap-1 text-slate-600">✕ arribo rechazado (pos 15:00)</span>}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
              La jornada <strong className="text-slate-400">no siempre llega a las 15:00</strong>: la simulación termina cuando el sistema
              queda vacío. Si el próximo arribo cae después de las 15:00 no se admite (✕) y, sin clientes en sistema, la FEL queda vacía y el
              reloj se detiene antes del cierre.
            </p>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* ventanilla */}
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Ventanilla única</h3>
                {enServicio ? <Badge tone="emerald">ocupada</Badge> : <Badge tone="sky">libre</Badge>}
              </div>
              {enServicio ? (
                <div className="mt-4">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl border font-mono text-xs font-bold", TIPO_BG[enServicio.tipo])}>
                      {enServicio.label}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                        <span className={cn("h-2 w-2 rounded-full", TIPO_DOT[enServicio.tipo])} />
                        {enServicio.tipo}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        llegó {fmtHM(enServicio.llegada)} · espera {enServicio.espera.toFixed(1)} min
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between font-mono text-[10px] text-slate-500">
                      <span>servicio {enServicio.servicio.toFixed(2)} min</span>
                      <span>quedan {(enServicio.fin - reloj).toFixed(1)} min</span>
                    </div>
                    <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-[width] duration-100"
                        style={{
                          width: `${Math.min(100, ((reloj - enServicio.inicio) / enServicio.servicio) * 100)}%`,
                          background: TIPO_COLOR[enServicio.tipo],
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                  {reloj < day.relojFinal ? "Esperando al próximo cliente…" : "Jornada finalizada"}
                </div>
              )}
            </Card>

            {/* cola FIFO */}
            <Card>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Cola FIFO</h3>
                <Badge tone={waiting.length > 3 ? "rose" : "amber"}>{waiting.length} en espera</Badge>
              </div>
              <div className="mt-4 flex min-h-24 flex-wrap content-start gap-2">
                {waiting.length === 0 && (
                  <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
                    cola vacía
                  </div>
                )}
                {waiting.slice(0, 10).map((c) => {
                  const w = reloj - c.llegada;
                  return (
                    <div key={c.id} className={cn("rounded-xl border px-2.5 py-2 text-center", waitTone(w))}>
                      <div className="flex items-center justify-center gap-1.5 font-mono text-[11px] font-bold">
                        <span className={cn("h-1.5 w-1.5 rounded-full", TIPO_DOT[c.tipo])} />
                        {c.label}
                      </div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-80">{c.tipo}</div>
                      <div className="font-mono text-[10px] tabular-nums">espera {w.toFixed(1)} min</div>
                    </div>
                  );
                })}
                {waiting.length > 10 && (
                  <div className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 font-mono text-[11px] text-slate-400">
                    +{waiting.length - 10} más
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* histograma de esperas acumuladas */}
          <Card>
            <h3 className="text-sm font-bold text-white">Distribución de esperas (clientes ya atendidos)</h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitBins} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
                  <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip unit="clientes" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="n" name="clientes" radius={[4, 4, 0, 0]} maxBarSize={30}>
                    {waitBins.map((b, i) => (
                      <Cell key={i} fill={b.x0 >= 40 ? "#fb7185" : b.x0 >= 15 ? "#fbbf24" : "#818cf8"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 font-mono text-[10px] text-slate-500">■ &lt;15 min · ■ 15–40 min · ■ &gt;40 min (umbral del indicador)</p>
          </Card>
        </div>

        {/* ---- columna derecha: FEL + último evento ---- */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-bold text-white">
                <Activity className="h-4 w-4 text-indigo-400" /> FEL · Lista de Eventos Futuros
              </h3>
              <Badge tone="indigo">{upcoming.length} pendientes</Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              {upcoming.length === 0 && <div className="rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-500">FEL vacía — fin de la jornada</div>}
              {upcoming.map((e, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-2.5 py-2 font-mono text-[11px]",
                    i === 0 ? "border-cyan-400/40 bg-cyan-400/10" : "border-white/5 bg-white/[0.03]"
                  )}
                >
                  <span className="w-14 shrink-0 font-bold text-slate-300 tabular-nums">{fmtHM(e.t)}</span>
                  {e.tipo === "ARRIBO" ? (
                    <span className="flex items-center gap-1 text-sky-300"><ArrowDownToLine className="h-3.5 w-3.5" /> ARRIBO</span>
                  ) : (
                    <span className="flex items-center gap-1 text-violet-300"><CheckCircle2 className="h-3.5 w-3.5" /> FIN_SERV</span>
                  )}
                  <span className="ml-auto flex items-center gap-1.5 text-slate-400">
                    <span className={cn("h-1.5 w-1.5 rounded-full", TIPO_DOT[e.client.tipo])} />
                    {e.client.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-[width] duration-100" style={{ width: `${(idx / day.events.length) * 100}%` }} />
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-white">Último evento procesado</h3>
            {lastEvent ? (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
                <div className="flex items-center gap-2">
                  {lastEvent.tipo === "ARRIBO" ? (
                    <Badge tone="sky">ARRIBO · {fmtClock(lastEvent.t)}</Badge>
                  ) : (
                    <Badge tone="violet">FIN_SERVICIO · {fmtClock(lastEvent.t)}</Badge>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 font-mono text-xs text-slate-300">
                  <span className={cn("h-2 w-2 rounded-full", TIPO_DOT[lastEvent.client.tipo])} />
                  {lastEvent.client.label} · {lastEvent.client.tipo}
                  {lastEvent.tipo === "FIN_SERVICIO" && (
                    <span className="text-slate-500">· esperó {lastEvent.client.espera.toFixed(1)} min · atención {lastEvent.client.servicio.toFixed(1)} min</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-dashed border-white/10 p-3 text-xs text-slate-500">Aún no se procesó ningún evento. Dale Play.</div>
            )}
          </Card>

          <Card className="grid grid-cols-2 gap-2">
            <StatTile label="Clientes en sistema" value={String(arrivals.length - atendidos)} accent="text-amber-300" />
            <StatTile label="Espera máx. vista" value={esperas.length ? maxEsperaLive.toFixed(1) + " min" : "—"} accent="text-rose-300" />
            <StatTile label="Utilización acumulada" value={day.relojFinal > 0 ? `${(((day.clients.filter(c=>c.inicio>=0&&c.inicio<=reloj).reduce((a,c)=>a+c.servicio,0)) ) / Math.max(reloj, 0.001) * 100).toFixed(1)}%` : "—"} accent="text-cyan-300" />
            <StatTile label="Jornada" value={finished ? "FIN" : "en curso"} accent={finished ? "text-emerald-300" : "text-white"} />
          </Card>
        </div>
      </div>

      {/* ---- resumen al finalizar ---- */}
      {finished && (
        <Card className="mt-5 border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-base font-extrabold text-white">
              <UserCheck className="h-5 w-5 text-emerald-300" /> Resumen de la jornada simulada{" "}
              <span className="font-mono text-xs font-medium text-slate-400">(semilla {seed} · {improved ? "escenario mejorado" : "escenario base"})</span>
            </h3>
            <div className="flex gap-2">
              <button onClick={() => { relojRef.current = 0; setReloj(0); setPlaying(true); }} className="rounded-lg bg-emerald-500/80 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-400">
                <RotateCcw className="mr-1 inline h-3.5 w-3.5" /> Repetir
              </button>
              <button onClick={() => setSeed(Math.floor(Math.random() * 100000))} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10">
                <Shuffle className="mr-1 inline h-3.5 w-3.5" /> Otra jornada
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {(Object.keys(METRIC_META) as (keyof typeof METRIC_META)[]).map((k) => (
              <div key={k} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
                <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {k === "utilizacion" ? <Clock3 className="h-3 w-3" /> : k === "longitudMediaCola" ? <Users className="h-3 w-3" /> : <Hourglass className="h-3 w-3" />}
                  {METRIC_META[k].label}
                </div>
                <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">{METRIC_META[k].fmt(day.metrics[k])}</div>
                <div className="text-[9px] text-slate-600">{METRIC_META[k].unit}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Atendidos {day.nAtendidos} clientes · reloj final <span className="font-mono text-slate-300">{fmtHM(day.relojFinal)}</span> (
            {day.relojFinal.toFixed(1)} min) ·{" "}
            {terminoAntes ? (
              <>
                <span className="text-amber-300">terminó antes de las 15:00</span>: el último cliente fue atendido a las{" "}
                {fmtHM(day.relojFinal)} y el próximo arribo caía a las{" "}
                <span className="font-mono text-slate-300">{rechazado ? fmtHM(rechazado) : "—"}</span>, fuera del horario de atención, por lo
                que no fue admitido y la FEL quedó vacía.
              </>
            ) : (
              <>se extendió más allá de las 15:00 para vaciar la cola, sin abandonos.</>
            )}
          </p>
        </Card>
      )}
    </Section>
  );
}
