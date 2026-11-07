import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownToLine, CaseLower, SpellCheck2, Table2, TriangleAlert } from "lucide-react";
import { Card, ChartTip, Section, Badge } from "./ui";
import { ESTRUCTURA_CSV, generarDataset, PROPORCIONES_LIMPIAS, TYPOS_ENCONTRADOS, type RawRow } from "@/lib/edaData";
import { cn } from "@/utils/cn";

const HEADER_LETTERS = ["A", "B", "C", "D", "E"];
const COLUMNAS = ["id_cliente", "fecha", "hora_llegada", "servicio", "duracion_servicio_m…"];

function isTypo(servicio: string): boolean {
  const low = servicio.trim().toLowerCase();
  return low !== "consulta" && low !== "pago" && low !== "tramite";
}

function CsvPreview({ rows }: { rows: RawRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0f1c]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-emerald-400/10 px-4 py-2.5">
        <span className="rounded bg-emerald-500 px-1.5 py-0.5 font-mono text-[11px] font-bold text-emerald-950">CSV</span>
        <span className="font-mono text-xs text-slate-300">centro_atencion.csv</span>
        <span className="ml-auto font-mono text-[10px] text-slate-500">1.190 filas × 5 columnas · primeras {rows.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="bg-white/[0.04] text-slate-500">
              <th className="w-10 border-b border-r border-white/5 px-2 py-1.5 text-center font-medium">#</th>
              {HEADER_LETTERS.map((l, i) => (
                <th key={l} className="border-b border-white/5 px-2 py-1.5 text-left">
                  <span className="mr-1.5 text-slate-600">{l}</span>
                  <span className="font-semibold text-slate-300">{COLUMNAS[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.idx} className="border-b border-white/[0.03] transition hover:bg-white/[0.04]">
                <td className="border-r border-white/5 bg-white/[0.02] px-2 py-1 text-center text-slate-600">{r.idx}</td>
                <td className={cn("px-2 py-1", r.idCliente ? "text-slate-300" : "text-slate-700")}>{r.idCliente || "∅"}</td>
                <td className={cn("px-2 py-1", r.fecha ? "text-slate-300" : "text-slate-700")}>{r.fecha || "∅"}</td>
                <td className="px-2 py-1 text-slate-300">{r.horaLlegada}</td>
                <td className={cn("px-2 py-1", isTypo(r.servicio) ? "font-semibold text-rose-400" : "text-slate-300")}>{r.servicio}</td>
                <td className={cn("px-2 py-1 text-right", r.duracion ? "text-slate-300" : "text-slate-700")}>{r.duracion || "∅"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/10 bg-black/40 px-4 py-2 font-mono text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="text-rose-400">■</span> valor con error tipográfico</span>
        <span className="flex items-center gap-1"><span className="text-slate-700">∅</span> celda vacía (142 por columna)</span>
      </div>
    </div>
  );
}

export default function Eda() {
  const rows = useMemo(() => generarDataset(1190).slice(0, 32), []);

  const chartData = PROPORCIONES_LIMPIAS.map((p) => ({
    servicio: p.servicio,
    prop: +(p.prop * 100).toFixed(1),
    color: p.color,
  }));

  return (
    <Section
      id="eda"
      eyebrow="2 · Análisis exploratorio de datos (EDA)"
      title={
        <>
          De <span className="font-mono text-emerald-300">centro_atencion.csv</span> a un dataset limpio
        </>
      }
      description="El archivo original cuenta con 1.190 registros. La inspección inicial detectó vacíos en tres columnas y múltiples errores tipográficos en la columna servicio, que se corrigieron antes de modelar."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- Columna izquierda: estructura, anomalías y proporciones ---------- */}
        <div className="space-y-5">
          <Card>
            <div className="flex items-center gap-2">
              <Table2 className="h-5 w-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Estructura y verificación inicial</h3>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-white/[0.05] font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-3 py-2">Columna</th>
                    <th className="px-3 py-2">Tipo reconocido</th>
                    <th className="px-3 py-2 text-center">Vacíos</th>
                    <th className="px-3 py-2">Ejemplo</th>
                  </tr>
                </thead>
                <tbody>
                  {ESTRUCTURA_CSV.map((c) => (
                    <tr key={c.columna} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-3 py-2 font-mono text-[11px] text-indigo-300">{c.columna}</td>
                      <td className="px-3 py-2 text-slate-300">{c.tipo}</td>
                      <td className="px-3 py-2 text-center">
                        {c.vacios > 0 ? (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300 ring-1 ring-amber-400/30">
                            {c.vacios}
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-emerald-400">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{c.ejemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-rose-400" />
              <h3 className="text-sm font-bold text-white">Anomalías detectadas y tratamiento aplicado</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TYPOS_ENCONTRADOS.map((t) => (
                <Badge key={t} tone="rose">
                  {t}
                </Badge>
              ))}
              <span className="ml-1 self-center text-xs text-slate-500">→ errores de carga en «servicio»</span>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/30">
                  <CaseLower className="h-4 w-4" />
                </span>
                <span>
                  <strong className="text-slate-200">Estandarización:</strong> <code className="font-mono text-xs text-sky-300">str.strip().str.lower()</code> sobre la columna servicio.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300 ring-1 ring-violet-400/30">
                  <SpellCheck2 className="h-4 w-4" />
                </span>
                <span>
                  <strong className="text-slate-200">Mapeo correctivo:</strong> <code className="font-mono text-xs text-violet-300">consul/cnt → consulta</code>,{" "}
                  <code className="font-mono text-xs text-violet-300">pgao/pagoo/pgo → pago</code>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/30">
                  <ArrowDownToLine className="h-4 w-4" />
                </span>
                <span>
                  <strong className="text-slate-200">Imputación:</strong> los vacíos de <code className="font-mono text-xs text-amber-300">fecha</code> se propagaron hacia
                  adelante (forward fill), asumiendo la misma jornada que el registro anterior.
                </span>
              </li>
            </ol>
          </Card>

          {/* Proporciones empíricas — debajo de anomalías, en la columna izquierda */}
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Proporciones empíricas (post-limpieza)</h3>
              <Badge tone="emerald">base del modelo</Badge>
            </div>
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="servicio" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "rgba(148,163,184,0.2)" }} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<ChartTip unit="%" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="prop" name="Frecuencia relativa" radius={[8, 8, 0, 0]} maxBarSize={64}>
                    {chartData.map((d) => (
                      <Cell key={d.servicio} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              consulta <strong className="text-sky-300">54.8%</strong> · pago <strong className="text-emerald-300">35.2%</strong> · trámite{" "}
              <strong className="text-rose-300">10.0%</strong> — estas frecuencias relativas alimentan{" "}
              <code className="font-mono text-[11px] text-indigo-300">generar_tipo_servicio()</code>.
            </p>
          </Card>
        </div>

        {/* ---------- Columna derecha: vista previa del CSV ---------- */}
        <div className="space-y-5">
          <Card className="p-4 sm:p-5">
            <CsvPreview rows={rows} />
          </Card>
        </div>
      </div>
    </Section>
  );
}
