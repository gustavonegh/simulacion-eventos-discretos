import { Activity, Database, FlaskConical, Gauge, MessagesSquare, Presentation, Sigma, Timer, UploadCloud } from "lucide-react";
import { cn } from "@/utils/cn";

const LINKS = [
  { href: "#presentacion", label: "Presentación", icon: Presentation },
  { href: "#eda", label: "EDA", icon: Database },
  { href: "#datos", label: "Tu CSV", icon: UploadCloud },
  { href: "#modelo", label: "Modelo probabilístico", icon: Sigma },
  { href: "#simulador", label: "① Simulador en vivo", icon: Timer },
  { href: "#laboratorio", label: "② Laboratorio de réplicas", icon: FlaskConical },
  { href: "#mejora", label: "Mejora operativa", icon: Gauge },
  { href: "#discusion", label: "Discusión y reflexión", icon: MessagesSquare },
];

export default function Nav({ seed }: { seed: number }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[#05070d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 shadow-lg shadow-indigo-500/30">
            <Activity className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-extrabold tracking-tight text-white">DES · Centro de Atención</span>
            <span className="block font-mono text-[10px] text-slate-500">1 ventanilla · 09:00–15:00 · FIFO</span>
          </span>
        </a>
        <nav className="ml-auto hidden items-center gap-1 overflow-x-auto lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              )}
            >
              <l.icon className="h-3.5 w-3.5 text-indigo-400" />
              {l.label}
            </a>
          ))}
        </nav>
        <span className="ml-auto hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] text-emerald-300 md:inline lg:ml-3">
          semilla {seed}
        </span>
      </div>
    </header>
  );
}
