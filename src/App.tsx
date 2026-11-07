import { useMemo, useState } from "react";
import { Cpu } from "lucide-react";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Presentation from "@/components/Presentation";
import Eda from "@/components/Eda";
import DataUpload from "@/components/DataUpload";
import Model from "@/components/Model";
import LiveSim from "@/components/LiveSim";
import Lab from "@/components/Lab";
import Discussion from "@/components/Discussion";
import { runReplicas } from "@/lib/sim";
import { PROB_SERVICIOS, type Proporciones } from "@/lib/dist";

export default function App() {
  // Proporciones del modelo: arrancan con las del informe y se pueden
  // reemplazar por las de un CSV real cargado por el usuario.
  const [proporciones, setProporciones] = useState<Proporciones>(PROB_SERVICIOS);
  const [fuente, setFuente] = useState<"informe" | "csv">("informe");
  // Semilla global: 42 por defecto (reproduce el informe). Cambiarla
  // recalcula TODAS las secciones con una nueva muestra de jornadas.
  const [seed, setSeed] = useState(42);

  // Réplicas base + mejoradas (misma semilla => comparación justa, como el notebook)
  const base = useMemo(() => runReplicas(50, seed, false, proporciones), [seed, proporciones]);
  const improved = useMemo(() => runReplicas(50, seed, true, proporciones), [seed, proporciones]);

  const aplicarCsv = (p: Proporciones) => {
    setProporciones(p);
    setFuente("csv");
  };
  const restaurar = () => {
    setProporciones(PROB_SERVICIOS);
    setFuente("informe");
  };

  return (
    <div className="min-h-screen bg-[#05070d] font-sans text-slate-200 antialiased">
      <Nav seed={seed} />
      <Hero base={base} improved={improved} />
      <main className="relative">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative">
          <Presentation />
          <Eda />
          <DataUpload proporciones={proporciones} fuente={fuente} onAplicar={aplicarCsv} onRestaurar={restaurar} />
          <Model proporciones={proporciones} />
          <LiveSim proporciones={proporciones} fuente={fuente} />
          {/* key => el laboratorio se reconstruye si cambian semilla o proporciones */}
          <Lab
            key={`${JSON.stringify(proporciones)}-${seed}`}
            baseInit={base}
            impInit={improved}
            fuente={fuente}
            proporciones={proporciones}
            seed={seed}
            onSeedChange={setSeed}
          />
          <Discussion base={base} improved={improved} />
        </div>
      </main>
      <footer className="relative border-t border-white/5 bg-black/40 py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 px-4 text-center sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30">
            <Cpu className="h-5 w-5 text-white" />
          </span>
          <p className="text-sm font-bold text-white">Simulación de Eventos Discretos · Centro de Atención Administrativa Universitaria</p>
          <p className="max-w-xl text-xs leading-relaxed text-slate-500">
            Una única estación de servicio · 09:00–15:00 · cola FIFO · sin abandonos · Reloj + FEL (min-heap) · eventos ARRIBO y
            FIN_SERVICIO · 50 réplicas con IC 95% · Escenario base vs mejora operativa (trámites −20%).
          </p>
          <p className="font-mono text-[10px] text-slate-600">
            React + Vite + Tailwind · motor DES equivalente al notebook de Python (scipy: lognorm / weibull_min / beta) · semilla{" "}
            <span className="text-indigo-400">{seed}</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
