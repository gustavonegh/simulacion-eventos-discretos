import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Dices, Sigma } from "lucide-react";
import { Card, ChartTip, Section, Badge } from "./ui";
import { generarTiempoEntreArribos, generarTiempoServicio } from "@/lib/dist";
import type { Proporciones } from "@/lib/dist";
import { mulberry32, type Rng } from "@/lib/rng";
import { histogram, mean, percentile } from "@/lib/sim";
import { TIPO_COLOR } from "@/lib/meta";

type DistCard = {
  titulo: string;
  dist: string;
  formula: string;
  params: string;
  nota: string;
  color: string;
  sample: (rng: Rng) => number;
  binSize: number;
};

const CARDS: DistCard[] = [
  {
    titulo: "Tiempo entre arribos",
    dist: "Log-normal",
    formula: "t = loc + scale · e^(s·Z),  Z ~ N(0,1)",
    params: "s = 1.4381 · loc = −0.0816 · scale = 6.0595",
    nota: "Cola larga a la derecha: la mayoría de arribos son cercanos, pero pueden aparecer rachas de llegadas.",
    color: "#818cf8",
    sample: (rng) => generarTiempoEntreArribos(rng),
    binSize: 5,
  },
  {
    titulo: "Servicio · CONSULTA",
    dist: "Weibull mínima",
    formula: "t = loc + scale · (−ln U)^(1/c)",
    params: "c = 1.8748 · loc = 0.3047 · scale = 4.5329",
    nota: "Servicios cortos y frecuentes (54.8% de los arribos): la moda está cerca de cero.",
    color: TIPO_COLOR.consulta,
    sample: (rng) => generarTiempoServicio(rng, "consulta"),
    binSize: 2,
  },
  {
    titulo: "Servicio · PAGO",
    dist: "Beta (loc+scale)",
    formula: "t = loc + scale · B,  B ~ Beta(a,b)",
    params: "a = 4.169 · b = 114.649 · loc = −0.266 · scale = 224.443",
    nota: "Duración acotada y asimétrica (35.2% de los arribos): son raros los pagos larguísimos.",
    color: TIPO_COLOR.pago,
    sample: (rng) => generarTiempoServicio(rng, "pago"),
    binSize: 2,
  },
  {
    titulo: "Servicio · TRÁMITE",
    dist: "Beta (loc+scale)",
    formula: "t = loc + scale · B,  B ~ Beta(a,b)",
    params: "a = 4.821 · b = 1.329.433 · loc = −0.268 · scale = 3.500.903",
    nota: "Sólo 10% de los arribos, pero con alta variabilidad: genera los cuellos de botella de la cola.",
    color: TIPO_COLOR.tramite,
    sample: (rng) => generarTiempoServicio(rng, "tramite"),
    binSize: 5,
  },
];

function DistPanel({ card, seed }: { card: DistCard; seed: number }) {
  const data = useMemo(() => {
    const rng = mulberry32(seed);
    const vals: number[] = [];
    for (let i = 0; i < 900; i++) vals.push(card.sample(rng));
    const bins = histogram(vals, card.binSize, 16).map((b) => ({ x: b.label, count: b.count }));
    return { bins, media: mean(vals), p90: percentile(vals, 90), max: Math.max(...vals) };
  }, [card, seed]);

  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white">{card.titulo}</h3>
          <Badge tone="violet">{card.dist}</Badge>
        </div>
        <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: card.color, boxShadow: `0 0 12px ${card.color}` }} />
      </div>
      <div className="mt-3 rounded-lg bg-black/30 px-3 py-2 font-mono text-[11px] leading-relaxed text-slate-300">{card.formula}</div>
      <div className="mt-1.5 font-mono text-[11px] text-indigo-300">{card.params}</div>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.bins} margin={{ top: 4, right: 4, bottom: 0, left: -26 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
            <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 9 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill: "#475569", fontSize: 9 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" name="frecuencia (900 muestras)" fill={card.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] text-slate-500">
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
          media <span className="block text-xs font-bold text-slate-200 tabular-nums">{data.media.toFixed(2)} min</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
          p90 <span className="block text-xs font-bold text-slate-200 tabular-nums">{data.p90.toFixed(2)} min</span>
        </div>
        <div className="rounded-lg bg-white/[0.04] px-2 py-1.5">
          máx <span className="block text-xs font-bold text-slate-200 tabular-nums">{data.max.toFixed(1)} min</span>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-500">{card.nota}</p>
    </Card>
  );
}

export default function Model({ proporciones }: { proporciones: Proporciones }) {
  return (
    <Section
      id="modelo"
      eyebrow="3 · Caracterización de entradas y modelo probabilístico"
      title={
        <>
          ¿Por qué modelado <span className="text-violet-400">estocástico</span> y no promedios fijos?
        </>
      }
      description={
        <>
          Los tiempos determinísticos no reflejan la variabilidad real del sistema. Se usan distribuciones continuas, asimétricas y
          limitadas en cero (<strong className="text-slate-200">Log-normal, Weibull y Beta</strong>): ideales para servicios donde la mayoría
          se resuelve rápido pero existen casos atípicos de larga duración (cola hacia la derecha). Las proporciones empíricas del EDA{" "}
          (<span className="font-mono text-xs text-sky-300">consulta {proporciones.consulta.toFixed(4)}</span>,{" "}
          <span className="font-mono text-xs text-emerald-300">pago {proporciones.pago.toFixed(4)}</span>,{" "}
          <span className="font-mono text-xs text-rose-300">trámite {proporciones.tramite.toFixed(4)}</span>) definen el tipo de cada
          arribo.
        </>
      }
    >
      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-violet-400/20 bg-violet-400/5 p-4 text-sm text-slate-300">
        <Dices className="h-5 w-5 shrink-0 text-violet-300" />
        <span>
          <Sigma className="mr-1 inline h-4 w-4 text-violet-300" />
          Cada evento consume variables aleatorias independientes: <code className="font-mono text-xs text-violet-300">X ~ Lognormal</code>{" "}
          para arribos y <code className="font-mono text-xs text-violet-300">S(tipo) ~ Weibull/Beta</code> para la duración condicionada al
          trámite. Los histogramas de abajo se muestrean en vivo (900 draws) con los parámetros exactos de la cátedra.
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {CARDS.map((c, i) => (
          <DistPanel key={c.titulo} card={c} seed={100 + i * 7} />
        ))}
      </div>
    </Section>
  );
}
