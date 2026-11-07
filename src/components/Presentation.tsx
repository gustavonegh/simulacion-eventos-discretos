import { Database, GitCompareArrows, ListChecks, Sigma, Cpu } from "lucide-react";
import { Card, Section } from "./ui";

const OBJETIVOS = [
  {
    icon: Database,
    n: "01",
    titulo: "Análisis exploratorio (EDA)",
    texto: "Verificar tipos, consistencia y estructura de los 1.190 registros de centro_atencion.csv; detectar vacíos, typos y anomalías de carga.",
  },
  {
    icon: Sigma,
    n: "02",
    titulo: "Caracterizar las entradas",
    texto: "Justificar el modelado probabilístico (Log-normal, Weibull y Beta) a partir de las proporciones empíricas y las distribuciones de la cátedra.",
  },
  {
    icon: Cpu,
    n: "03",
    titulo: "Implementar el simulador DES",
    texto: "Motor de eventos discretos con reloj, Lista de Eventos Futuros (FEL, min-heap), cola FIFO y eventos ARRIBO / FIN_SERVICIO.",
  },
  {
    icon: ListChecks,
    n: "04",
    titulo: "Réplicas e indicadores",
    texto: "Ejecutar réplicas independientes (50 en el informe, ajustable en la web), calcular métricas de desempeño con intervalos de confianza del 95% e interpretar resultados.",
  },
  {
    icon: GitCompareArrows,
    n: "05",
    titulo: "Contrastar escenarios",
    texto: "Comparar el escenario base contra una mejora operativa sencilla (trámites −20% por pre-carga digital) con la misma semilla.",
  },
];

export default function Presentation() {
  return (
    <Section
      id="presentacion"
      eyebrow="1 · Presentación y objetivos"
      title={
        <>
          Un sistema de atención con <span className="text-indigo-400">una única estación</span>
        </>
      }
      description={
        <>
          <strong className="text-slate-200">Contexto:</strong> centro de atención administrativa universitaria con un solo servidor
          (ventanilla única) que opera de <span className="font-mono text-cyan-300">09:00 a 15:00</span>. Los clientes llegan al azar,
          hacen una <span className="text-sky-300">consulta</span>, un <span className="text-emerald-300">pago</span> o un{" "}
          <span className="text-rose-300">trámite</span>, y esperan en una cola <span className="font-mono">FIFO</span> si la ventanilla
          está ocupada. No se admiten arribos después de las 15:00, pero se atiende a todos los que quedaron en el sistema (sin abandonos).
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {OBJETIVOS.map((o) => (
          <Card key={o.n} className="group transition hover:border-indigo-400/30 hover:bg-white/[0.06]">
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300 ring-1 ring-indigo-400/30 transition group-hover:scale-110">
                <o.icon className="h-5 w-5" />
              </span>
              <span className="font-mono text-sm font-bold text-slate-600">{o.n}</span>
            </div>
            <h3 className="mt-4 text-base font-bold text-white">{o.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{o.texto}</p>
          </Card>
        ))}
        <Card className="border-indigo-400/25 bg-gradient-to-br from-indigo-500/10 to-transparent md:col-span-2 lg:col-span-1">
          <h3 className="text-base font-bold text-white">Arquitectura del simulador</h3>
          <ul className="mt-3 space-y-2 font-mono text-xs leading-relaxed text-slate-400">
            <li><span className="text-cyan-300">reloj</span> → avanza al próximo evento de la FEL</li>
            <li><span className="text-cyan-300">FEL</span> → min-heap ordenado por tiempo (heapq)</li>
            <li><span className="text-sky-300">ARRIBO</span> → agenda próximo arribo (≤ 15:00) + atiende o encola</li>
            <li><span className="text-violet-300">FIN_SERVICIO</span> → libera ventanilla, saca el primero de la cola FIFO</li>
            <li><span className="text-amber-300">cierre</span> → no entran más clientes, pero se vacía la cola</li>
          </ul>
        </Card>
      </div>
    </Section>
  );
}
