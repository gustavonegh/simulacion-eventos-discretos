import { useState } from "react";
import { ChevronDown, DoorOpen, Gauge, MessageCircleQuestion, ShieldAlert, Sparkles } from "lucide-react";
import { Card, Section, Badge } from "./ui";
import { cn } from "@/utils/cn";
import type { ReplicaSet } from "@/lib/sim";
import { METRIC_META } from "@/lib/meta";

const REFLEXIONES = [
  {
    q: "¿Qué limitaciones tiene el modelo respecto de la operación real del centro?",
    a: "Asume un servidor que trabaja a ritmo constante, sin fatiga, pausas (ej. ir al baño) ni fallas del sistema informático. Además, supone que el tiempo de servicio es independiente del tamaño de la cola — en la realidad un empleado suele acelerar la atención cuando ve la fila muy larga.",
  },
  {
    q: "¿Qué datos adicionales permitirían validar externamente los tiempos de espera?",
    a: "Registros de un sistema de turneros electrónicos (tickets con hora de emisión y hora de llamado a ventanilla), encuestas de satisfacción de los estudiantes, o métricas de abandono real obtenidas por observación directa (cuánta gente se va sin ser atendida).",
  },
  {
    q: "¿Qué supuesto tuvo mayor impacto sobre los resultados y por qué?",
    a: "El de un único servidor procesando todas las categorías bajo disciplina estrictamente FIFO. Al mezclar consultas rápidas con trámites largos, los clientes de tareas sencillas sufren esperas desproporcionadas, lo que incrementa drásticamente el percentil 90 de la espera global.",
  },
  {
    q: "¿Qué decisión de modelado se revisaría con más tiempo o más datos?",
    a: "La distribución global única de arribos. En el ámbito universitario las llegadas no son homogéneas durante las 6 horas: presentan picos a media mañana o en los recreos. Con más datos se modelaría con un Proceso de Poisson No Estacionario (NHPP) con tasas variables por franja horaria.",
  },
];

function Accordion({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border transition", open ? "border-indigo-400/40 bg-white/[0.05]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]")}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <MessageCircleQuestion className="h-5 w-5 shrink-0 text-indigo-400" />
        <span className="flex-1 text-sm font-bold text-slate-100">{q}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="px-5 pb-5 pl-12 text-sm leading-relaxed text-slate-400">{a}</p>}
    </div>
  );
}

export default function Discussion({ base, improved }: { base: ReplicaSet; improved: ReplicaSet }) {
  const [open, setOpen] = useState(0);
  const dEspera = improved.stats.esperaMedia.media - base.stats.esperaMedia.media;
  const dMax = improved.stats.maxEspera.media - base.stats.maxEspera.media;
  const dUtil = improved.stats.utilizacion.media - base.stats.utilizacion.media;

  return (
    <>
      <Section
        id="mejora"
        eyebrow="6 · Propuesta y evaluación de la mejora operativa"
        title={
          <>
            Formulario de <span className="text-emerald-400">pre-carga digital</span>: trámites −20%
          </>
        }
        description={`Se propone implementar un formulario digital que el estudiante completa antes de llegar, reduciendo el tiempo de atención de la categoría «trámite» en un 20% (t_serv · 0.80). Se simulan ${base.n} jornadas bajo el nuevo escenario con la misma semilla (42) para una comparación justa.`}
      >
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-emerald-300" />
              <h3 className="text-sm font-bold text-white">Contraste de resultados (50 réplicas, semilla 42)</h3>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/[0.05] font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 text-left">Métrica</th>
                    <th className="px-4 py-2.5 text-right">Escenario base</th>
                    <th className="px-4 py-2.5 text-right">Mejorado (−20% trámites)</th>
                    <th className="px-4 py-2.5 text-right">Variación</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    [
                      ["esperaMedia", dEspera],
                      ["utilizacion", dUtil],
                      ["maxEspera", dMax],
                    ] as const
                  ).map(([k, d]) => {
                    const m = METRIC_META[k];
                    const b = base.stats[k].media;
                    const i = improved.stats[k].media;
                    const pct = b !== 0 ? ((i - b) / b) * 100 : 0;
                    return (
                      <tr key={k} className="border-t border-white/5">
                        <td className="px-4 py-3 font-semibold text-slate-200">{m.label}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-indigo-300">{m.fmt(b)}</td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-emerald-300">{m.fmt(i)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-xs font-bold tabular-nums text-emerald-300">
                            {d > 0 ? "+" : ""}
                            {m.fmt(d)} ({pct.toFixed(1)}%)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-relaxed text-slate-300">
              <Sparkles className="mr-1 inline h-4 w-4 text-emerald-300" />
              Aunque «trámite» es solo el 10% de los arribos, su alta variabilidad genera cuellos de botella: agilizarlo un 20% reduce
              significativamente la <strong className="text-white">espera máxima</strong> y la <strong className="text-white">espera media</strong>,
              descongestionando la cola.
            </p>
          </Card>
          <Card className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-300" />
              <h3 className="text-sm font-bold text-white">Discusión de supuestos — el de mayor impacto</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
              <p>
                El supuesto con mayor impacto potencial es <strong className="text-amber-300">«sin abandonos» + «servidor único»</strong>: en la
                simulación base todos permanecen en la cola, generando esperas máximas de hasta{" "}
                <span className="font-mono text-rose-300">{METRIC_META.maxEspera.fmt(base.stats.maxEspera.media)} min</span>. En la realidad,
                colas largas inducen <em>reneging</em> (irse de la fila) o <em>balking</em> (ni siquiera ingresar al verla).
              </p>
              <p>
                Si se incorporara una tasa de abandono empírica (ej. clientes que se van tras 15 min de espera), la longitud media de cola y la
                espera media caerían matemáticamente — pero eso <strong className="text-slate-200">ocultaría la ineficiencia real</strong> bajo una
                falsa mejora de métricas, traduciéndose en insatisfacción y trámites universitarios truncados.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge tone="amber">sin abandonos</Badge>
                <Badge tone="amber">servidor único</Badge>
                <Badge tone="sky">FIFO estricto</Badge>
                <Badge tone="violet">cierre 15:00 sin nuevos arribos</Badge>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section
        id="discusion"
        eyebrow="7 · Preguntas de reflexión"
        title={
          <>
            ¿Qué nos enseña el modelo sobre la <span className="text-indigo-400">operación real</span>?
          </>
        }
        description="Haz clic en cada pregunta para desplegar la respuesta completa del análisis."
      >
        <div className="space-y-3">
          {REFLEXIONES.map((r, i) => (
            <Accordion key={i} q={r.q} a={r.a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} />
          ))}
        </div>
        <Card className="mt-6 flex items-start gap-3 border-indigo-400/25 bg-indigo-400/5">
          <DoorOpen className="mt-0.5 h-5 w-5 shrink-0 text-indigo-300" />
          <p className="text-sm leading-relaxed text-slate-300">
            <strong className="text-white">Política de cierre:</strong> no se admiten nuevos arribos después de las 15:00, pero se finaliza la
            atención de todos los clientes que quedaron en el sistema, sin abandonos. Por eso el reloj puede superar los 360 min (hasta{" "}
            <span className="font-mono text-cyan-300">{fmtMax(base)}</span>).
          </p>
        </Card>
      </Section>
    </>
  );
}

function fmtMax(base: ReplicaSet): string {
  const m = Math.max(...base.days.map((d) => d.relojFinal));
  return `${(9 * 60 + m).toString()} min → ${String(Math.floor((9 * 60 + m) / 60)).padStart(2, "0")}:${String(Math.floor((9 * 60 + m) % 60)).padStart(2, "0")}`;
}
