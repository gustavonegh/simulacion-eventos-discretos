import { useRef, useState } from "react";
import { Dices, Download, FileSpreadsheet, RefreshCw, Shuffle, Upload, X } from "lucide-react";
import { Badge, Card, Section } from "./ui";
import { analizarCsv, csvSintetico, type CsvAnalysis } from "@/lib/csv";
import { type Proporciones } from "@/lib/dist";
import { TIPO_COLOR } from "@/lib/meta";
import { cn } from "@/utils/cn";

const TIPOS: ("consulta" | "pago" | "tramite")[] = ["consulta", "pago", "tramite"];

function descargar(nombre: string, contenido: string) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataUpload({
  proporciones,
  onAplicar,
  onRestaurar,
  fuente,
}: {
  proporciones: Proporciones;
  onAplicar: (p: Proporciones) => void;
  onRestaurar: () => void;
  fuente: "informe" | "csv";
}) {
  const [analisis, setAnalisis] = useState<CsvAnalysis | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const leerArchivo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result ?? "");
      setAnalisis(analizarCsv(texto, file.name));
    };
    reader.readAsText(file, "utf-8");
  };

  const usandoInforme = fuente === "informe";

  return (
    <Section
      id="datos"
      eyebrow="Extra · Tus datos reales y la reproducibilidad"
      title={
        <>
          Subí tu <span className="text-emerald-300">centro_atencion.csv</span> y el modelo se recalcula
        </>
      }
      description="La app viene con el dataset del informe (semilla 42). Si arrastrás tu CSV real, se repite la limpieza del notebook (minúsculas, mapeo de typos, forward fill) y las proporciones empíricas se recalculan para alimentar el simulador. Nada se sube a ningún servidor: todo se procesa en tu navegador."
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- Zona de carga ---------- */}
        <div className="space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              const f = e.dataTransfer.files?.[0];
              if (f) leerArchivo(f);
            }}
            className={cn(
              "rounded-2xl border-2 border-dashed p-8 text-center transition",
              arrastrando ? "border-emerald-400 bg-emerald-400/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"
            )}
          >
            <FileSpreadsheet className="mx-auto h-10 w-10 text-emerald-300" />
            <h3 className="mt-3 text-base font-bold text-white">Arrastrá tu CSV aquí</h3>
            <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
              Formato esperado: <code className="font-mono text-emerald-300">id_cliente, fecha, hora_llegada, servicio, duracion_servicio_min</code>.
              Acepta separador <span className="font-mono">,</span> <span className="font-mono">;</span> o tab.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl bg-emerald-500/80 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-400"
              >
                <Upload className="h-4 w-4" /> Elegir archivo
              </button>
              <button
                onClick={() => descargar("centro_atencion.csv", csvSintetico(1190))}
                className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              >
                <Download className="h-4 w-4" /> Descargar CSV de ejemplo (1.190 filas)
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) leerArchivo(f);
              }}
            />
          </div>

          {/* estado del modelo activo */}
          <Card className={cn("border-l-4", usandoInforme ? "border-l-indigo-400" : "border-l-emerald-400")}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Modelo activo</h3>
              <Badge tone={usandoInforme ? "indigo" : "emerald"}>{usandoInforme ? "dataset del informe" : analisis?.nombreArchivo}</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {TIPOS.map((t) => {
                const p = proporciones[t];
                return (
                  <div key={t}>
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-slate-300">{t}</span>
                      <span className="font-bold text-slate-200 tabular-nums">{(p * 100).toFixed(2)}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p * 100}%`, background: TIPO_COLOR[t] }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {!usandoInforme && (
              <button
                onClick={onRestaurar}
                className="mt-4 flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Volver a las proporciones del informe
              </button>
            )}
          </Card>
        </div>

        {/* ---------- Resultado del análisis ---------- */}
        <div className="space-y-5">
          {!analisis && (
            <Card className="flex h-full min-h-64 flex-col items-center justify-center text-center">
              <Dices className="h-9 w-9 text-slate-600" />
              <p className="mt-3 max-w-xs text-sm text-slate-500">
                Cuando cargues un CSV vas a ver acá: filas totales, vacíos por columna, typos corregidos y las nuevas proporciones
                empíricas listas para aplicar al simulador.
              </p>
            </Card>
          )}

          {analisis && !analisis.ok && (
            <Card className="border-rose-400/30 bg-rose-400/5">
              <h3 className="flex items-center gap-2 text-sm font-bold text-rose-300">
                <X className="h-4 w-4" /> No se pudo analizar el archivo
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{analisis.error}</p>
            </Card>
          )}

          {analisis?.ok && (
            <>
              <Card>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">EDA de {analisis.nombreArchivo}</h3>
                  <Badge tone="emerald">{analisis.totalFilas.toLocaleString("es-AR")} filas</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Vacíos totales", analisis.vaciosTotales.toLocaleString("es-AR")],
                    ["Typos corregidos", analisis.filasCorregidas.toLocaleString("es-AR")],
                    ["Fechas imputadas", analisis.fechasImputadas.toLocaleString("es-AR")],
                    ["Filas descartadas", analisis.filasDescartadas.toLocaleString("es-AR")],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-white/[0.04] px-3 py-2">
                      <div className="text-[10px] uppercase tracking-wide text-slate-500">{l}</div>
                      <div className="font-mono text-base font-bold text-white tabular-nums">{v}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-white/[0.05] font-mono text-[9px] uppercase tracking-wider text-slate-500">
                        <th className="px-2.5 py-1.5">Columna</th>
                        <th className="px-2.5 py-1.5 text-center">Vacíos</th>
                        <th className="px-2.5 py-1.5 text-center">Distintos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analisis.columnas.map((c) => (
                        <tr key={c.nombre} className="border-t border-white/5">
                          <td className="px-2.5 py-1.5 font-mono text-slate-300">{c.nombre}</td>
                          <td className="px-2.5 py-1.5 text-center">
                            <span className={cn("font-mono tabular-nums", c.vacios > 0 ? "text-amber-300" : "text-emerald-400")}>{c.vacios}</span>
                          </td>
                          <td className="px-2.5 py-1.5 text-center font-mono text-slate-400 tabular-nums">{c.distintos}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {analisis.typos.length > 0 && (
                <Card>
                  <h3 className="text-sm font-bold text-white">Typos detectados y corregidos</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {analisis.typos.map((t) => (
                      <span key={t.valor} className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 font-mono text-[11px] text-rose-300">
                        {t.valor} <span className="text-rose-400/60">→ {t.corrigeA}</span> ×{t.cantidad}
                      </span>
                    ))}
                  </div>
                  {analisis.muestra.length > 0 && (
                    <div className="mt-3 space-y-1 font-mono text-[11px]">
                      {analisis.muestra.slice(0, 4).map((m, i) => (
                        <div key={i} className="flex items-center gap-2 rounded-lg bg-black/30 px-2.5 py-1.5">
                          <span className="text-rose-300 line-through">{m.crudo}</span>
                          <span className="text-slate-600">→</span>
                          <span className="font-bold text-emerald-300">{m.corregido}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}

              <Card className="border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
                <h3 className="text-sm font-bold text-white">Nuevas proporciones empíricas</h3>
                <div className="mt-2 space-y-1.5 font-mono text-xs">
                  {TIPOS.map((t) => (
                    <div key={t} className="flex justify-between">
                      <span className="text-slate-400">{t}</span>
                      <span className="font-bold text-slate-200 tabular-nums">{(analisis.proporciones[t] * 100).toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => onAplicar(analisis.proporciones)}
                  disabled={fuente === "csv"}
                  className={cn(
                    "mt-4 w-full rounded-xl px-4 py-2.5 text-xs font-extrabold transition",
                    fuente === "csv" ? "cursor-default bg-emerald-400/20 text-emerald-300" : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90"
                  )}
                >
                  {fuente === "csv" ? "✓ Aplicado al simulador" : "Aplicar estas proporciones al simulador"}
                </button>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ---------- Reproducibilidad ---------- */}
      <Card className="mt-5 border-indigo-400/25 bg-indigo-400/5">
        <div className="flex items-start gap-3">
          <Shuffle className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
          <div>
            <h3 className="text-sm font-bold text-white">¿Por qué las simulaciones son siempre iguales? Porque así debe ser</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              El simulador usa un generador de números aleatorios <strong className="text-slate-200">sembrado</strong> (equivalente a{" "}
              <code className="font-mono text-xs text-indigo-300">np.random.seed(42)</code>). Con la misma semilla, la misma secuencia de
              eventos se repite exactamente: eso es lo que hace que un resultado científico sea <em>reproducible</em> y verificable. Si
              cada ejecución diera números distintos, nadie podría validar tu informe.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Para obtener jornadas distintas alcanza con cambiar la semilla: en el <strong className="text-slate-200">Laboratorio</strong> hay
              un campo de semilla editable, y en el <strong className="text-slate-200">Simulador en vivo</strong> un botón «nueva jornada» que
              sortea una semilla al azar. Ningún archivo adicional es necesario para eso.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                ["Misma semilla", "resultados idénticos → reproducible"],
                ["Otra semilla", "journadas distintas → nueva muestra"],
                ["Tu CSV real", "cambian las proporciones del modelo"],
              ].map(([a, b]) => (
                <div key={a} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                  <div className="text-xs font-bold text-indigo-300">{a}</div>
                  <div className="text-[11px] text-slate-500">{b}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
