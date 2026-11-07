import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-90px" }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className={cn("relative mx-auto w-full max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8", className)}
    >
      <div className="mb-10">
        <span className="font-mono text-xs font-semibold tracking-[0.25em] text-indigo-400 uppercase">{eyebrow}</span>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h2>
        {description && <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate-400">{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("glass rounded-2xl p-5 sm:p-6", className)}>{children}</div>;
}

export function Badge({ children, tone = "indigo" }: { children: ReactNode; tone?: "indigo" | "emerald" | "rose" | "amber" | "sky" | "violet" }) {
  const tones: Record<string, string> = {
    indigo: "bg-indigo-400/10 text-indigo-300 border-indigo-400/30",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
    rose: "bg-rose-400/10 text-rose-300 border-rose-400/30",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    sky: "bg-sky-400/10 text-sky-300 border-sky-400/30",
    violet: "bg-violet-400/10 text-violet-300 border-violet-400/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="glass rounded-xl px-4 py-3">
      <div className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">{label}</div>
      <div className={cn("mt-1 font-mono text-xl font-bold tabular-nums sm:text-2xl", accent)}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

/** Tooltip oscuro compartido por todos los gráficos de Recharts */
export function ChartTip({ active, payload, label, unit }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1120]/95 px-3 py-2 shadow-xl backdrop-blur">
      {label !== undefined && label !== null && (
        <div className="mb-1 font-mono text-[11px] text-slate-400">{String(label)}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 font-mono text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill || "#818cf8" }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-semibold text-white tabular-nums">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DeltaChip({ delta, suffix = "" }: { delta: number; suffix?: string }) {
  const good = delta < 0; // en métricas de espera/cola, bajar es bueno
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
        good ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-rose-400/30 bg-rose-400/10 text-rose-300"
      )}
    >
      {good ? "▼" : "▲"} {Math.abs(delta).toFixed(3)}
      {suffix}
    </span>
  );
}
