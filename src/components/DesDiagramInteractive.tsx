import { useEffect, useState } from "react";
import { ArrowRight, Boxes, DoorClosed, ListOrdered, Pause, Play, Timer, UserRound, Users } from "lucide-react";
import { Card } from "./ui";
import { cn } from "@/utils/cn";

type NodoId = "reloj" | "fel" | "procesar" | "arribo" | "cola" | "servidor" | "fin";

type Info = {
  titulo: string;
  tag: string;
  color: string;
  icon: typeof Timer;
  desc: string;
  tech: string[];
};

const INFO: Record<NodoId, Info> = {
  reloj: {
    titulo: "Reloj",
    tag: "estado",
    color: "#94a3b8",
    icon: Timer,
    desc: "Variable en minutos desde las 09:00. No avanza a intervalos fijos: salta directamente al tiempo del próximo evento tras cada heappop. Arranca en 0 y la simulación termina cuando la FEL queda vacía.",
    tech: ["reloj = 0.0 al iniciar", "reloj = evento.t en cada iteración", "termina cuando FEL.length == 0"],
  },
  fel: {
    titulo: "FEL · Lista de Eventos Futuros",
    tag: "min-heap",
    color: "#818cf8",
    icon: ListOrdered,
    desc: "Cola de prioridad que guarda tuplas (tiempo, tipo, cliente). Siempre entrega el evento de menor tiempo; ante empate gana el que se insertó primero. Es la traducción directa del heapq de Python.",
    tech: ["heapq.heappush(FEL, (t, tipo, cliente))", "heapq.heappop(FEL) → menor t", "orden de inserción rompe empates"],
  },
  procesar: {
    titulo: "Despacho del evento",
    tag: "switch",
    color: "#94a3b8",
    icon: ArrowRight,
    desc: "Según el tipo de evento se ejecuta una rama distinta del código. Acá no hay avance de tiempo: es pura lógica de programación. Cada rama puede insertar nuevos eventos en la FEL.",
    tech: ["if tipo == 'ARRIBO': …", "elif tipo == 'FIN_SERVICIO': …", "puede programar nuevos eventos"],
  },
  arribo: {
    titulo: "Evento · ARRIBO",
    tag: "llegada",
    color: "#38bdf8",
    icon: Boxes,
    desc: "Llega un cliente. Se programa el próximo arribo si todavía no son las 15:00, se muestrea su tipo de servicio y se decide si entra directo a la ventanilla o espera en la cola.",
    tech: ["programa próximo arribo si t ≤ 360", "muestrea tipo (54.8 / 35.2 / 10.0 %)", "servidor libre → inicia servicio", "servidor ocupado → se encola (FIFO)"],
  },
  cola: {
    titulo: "Cola FIFO",
    tag: "deque",
    color: "#fbbf24",
    icon: Users,
    desc: "Clientes que ya llegaron y todavía no fueron atendidos. Se extrae siempre la cabeza: el que llegó primero. Su longitud media se calcula como el área bajo la curva dividida el tiempo total de simulación.",
    tech: ["cola.append(cliente) → encola", "cola.popleft() → extrae cabeza", "Lq = Σ len(cola)·Δt / reloj"],
  },
  servidor: {
    titulo: "Servidor único",
    tag: "1 cliente a la vez",
    color: "#34d399",
    icon: UserRound,
    desc: "Una sola ventanilla que atiende un cliente por vez. Al terminar un servicio extrae la cabeza de la cola o queda libre. Su utilización es el tiempo ocupado sobre el tiempo total de la jornada.",
    tech: ["servidor_ocupado = True / False", "tiempo_total_ocupado += t_servicio", "ρ = ocupado / reloj"],
  },
  fin: {
    titulo: "Evento · FIN_SERVICIO",
    tag: "salida",
    color: "#a78bfa",
    icon: DoorClosed,
    desc: "Termina la atención. Se registran las métricas del cliente, y si hay gente esperando se saca la cabeza de la cola para iniciar su servicio; si no, el servidor queda libre.",
    tech: ["registra espera y tiempo en sistema", "cola no vacía → extrae cabeza FIFO", "inicia su servicio (programa FIN)", "cola vacía → libera el servidor"],
  },
};

const ORDEN: NodoId[] = ["reloj", "fel", "procesar", "arribo", "cola", "servidor", "fin"];

const MONO = "'JetBrains Mono', ui-monospace, monospace";

/** Nodo clicable del diagrama. */
function N({
  id, x, y, w, h, stroke, fill, dashed, activo, dim, onSelect, children,
}: {
  id: NodoId; x: number; y: number; w: number; h: number;
  stroke: string; fill: string; dashed?: boolean; activo: boolean; dim: boolean;
  onSelect: (id: NodoId) => void;
  children?: React.ReactNode;
}) {
  return (
    <g
      onClick={() => onSelect(id)}
      style={{ cursor: "pointer", transition: "opacity .3s ease" }}
      opacity={dim ? 0.38 : 1}
    >
      <rect
        x={x} y={y} width={w} height={h} rx={14}
        fill={activo ? fill.replace(/[\d.]+\)$/, "0.18)") : fill}
        stroke={activo ? stroke : stroke}
        strokeWidth={activo ? 2.4 : 1.4}
        strokeDasharray={dashed ? "7 5" : undefined}
        filter={activo ? "url(#glow)" : undefined}
      />
      {activo && (
        <rect
          x={x - 4} y={y - 4} width={w + 8} height={h + 8} rx={18}
          fill="none" stroke={stroke} strokeWidth={1} opacity={0.5}
        >
          <animate attributeName="opacity" values="0.6;0.05;0.6" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
      {children}
    </g>
  );
}

/** Flecha del diagrama; se resalta si alguno de sus nodos dueño está activo. */
function Flecha({
  d, color, duenos, activo, dashed, label, lx, ly, anchor = "start",
}: {
  d: string; color: string; duenos: NodoId[]; activo: NodoId | null;
  dashed?: boolean; label?: string; lx?: number; ly?: number; anchor?: "start" | "middle";
}) {
  const on = activo !== null && duenos.includes(activo);
  return (
    <g style={{ transition: "opacity .3s ease" }} opacity={on ? 1 : activo ? 0.28 : 0.85}>
      <path d={d} stroke={on ? color : "#64748b"} strokeWidth={on ? 2 : 1.3} strokeDasharray={dashed ? "6 5" : undefined} markerEnd={`url(#m${color.slice(1)})`} fill="none" />
      {label && (
        <text x={lx} y={ly} textAnchor={anchor} fontFamily={MONO} fontSize={9.5} fill={on ? color : "#94a3b8"}>
          {label}
        </text>
      )}
    </g>
  );
}

export default function DesDiagramInteractive() {
  const [activo, setActivo] = useState<NodoId | null>("reloj");
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => {
      setActivo((prev) => {
        const i = ORDEN.indexOf(prev ?? "reloj");
        return ORDEN[(i + 1) % ORDEN.length];
      });
    }, 2600);
    return () => clearInterval(t);
  }, [auto]);

  const info = activo ? INFO[activo] : null;
  const Icon = info?.icon ?? Timer;

  const resaltarCamino = (id: NodoId) => {
    setAuto(false);
    setActivo(id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* ---------------- Diagrama ---------------- */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-2">
        <svg viewBox="0 0 1000 470" className="h-auto min-w-[760px] w-full" role="img" aria-label="Arquitectura interactiva del simulador de eventos discretos">
          <defs>
            {["#64748b", "#38bdf8", "#a78bfa", "#fbbf24"].map((c) => (
              <marker key={c} id={`m${c.slice(1)}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill={c} />
              </marker>
            ))}
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Fila superior */}
          <N id="reloj" x={20} y={50} w={150} h={72} stroke="rgba(148,163,184,0.4)" fill="rgba(148,163,184,0.07)" activo={activo === "reloj"} dim={activo !== null && activo !== "reloj"} onSelect={resaltarCamino}>
            <text x={95} y={78} textAnchor="middle" fontFamily={MONO} fontSize={12} fontWeight={700} fill="#cbd5e1">RELOJ</text>
            <text x={95} y={99} textAnchor="middle" fontFamily={MONO} fontSize={10} fill="#64748b">t (minutos)</text>
          </N>

          <N id="fel" x={250} y={28} w={310} h={112} stroke="rgba(129,140,248,0.45)" fill="rgba(129,140,248,0.07)" activo={activo === "fel"} dim={activo !== null && activo !== "fel"} onSelect={resaltarCamino}>
            <text x={266} y={53} fontFamily={MONO} fontSize={11.5} fontWeight={700} fill="#a5b4fc">FEL · lista de eventos futuros</text>
            <text x={266} y={78} fontFamily={MONO} fontSize={11} fill="#e2e8f0">( 7.2  ARRIBO )</text>
            <text x={266} y={98} fontFamily={MONO} fontSize={11} fill="#e2e8f0">( 11.4  FIN_SV )</text>
            <text x={266} y={124} fontFamily={MONO} fontSize={10} fill="#64748b">min-heap: pop por menor t</text>
          </N>

          <N id="procesar" x={650} y={50} w={200} h={72} stroke="rgba(148,163,184,0.4)" fill="rgba(148,163,184,0.07)" activo={activo === "procesar"} dim={activo !== null && activo !== "procesar"} onSelect={resaltarCamino}>
            <text x={750} y={78} textAnchor="middle" fontFamily={MONO} fontSize={12} fontWeight={700} fill="#e2e8f0">PROCESAR</text>
            <text x={750} y={99} textAnchor="middle" fontFamily={MONO} fontSize={10} fill="#64748b">evento de menor t</text>
          </N>

          <Flecha d="M 560 84 L 648 84" color="#64748b" duenos={["fel", "procesar"]} activo={activo} />
          <Flecha d="M 745 50 C 745 12, 165 12, 165 50" color="#64748b" duenos={["procesar", "reloj"]} activo={activo} dashed label="el reloj salta al tiempo del siguiente evento (pop del FEL)" lx={455} ly={9} anchor="middle" />
          <Flecha d="M 700 122 C 700 158, 240 155, 240 188" color="#38bdf8" duenos={["procesar", "arribo"]} activo={activo} dashed />
          <Flecha d="M 800 122 L 790 188" color="#a78bfa" duenos={["procesar", "fin"]} activo={activo} dashed />

          {/* Fila media */}
          <N id="arribo" x={20} y={190} w={440} h={140} stroke="rgba(56,189,248,0.4)" fill="rgba(56,189,248,0.05)" activo={activo === "arribo"} dim={activo !== null && activo !== "arribo"} onSelect={resaltarCamino}>
            <rect x={20} y={190} width={440} height={42} rx={14} fill="rgba(56,189,248,0.12)" />
            <rect x={20} y={214} width={440} height={18} fill="rgba(56,189,248,0.12)" />
            <circle cx={38} cy={211} r={4} fill="#38bdf8" />
            <text x={54} y={216} fontFamily={MONO} fontSize={12} fontWeight={700} fill="#7dd3fc">EVENTO · ARRIBO</text>
            {["1 · programa próximo arribo si t ≤ 360", "2 · muestrea tipo (54.8 / 35.2 / 10.0 %)", "3 · servidor libre → inicia servicio", "4 · servidor ocupado → se encola (FIFO)"].map((t, i) => (
              <text key={i} x={36} y={252 + i * 21} fontFamily={MONO} fontSize={11} fill="#cbd5e1">{t}</text>
            ))}
          </N>

          <N id="fin" x={540} y={190} w={440} h={140} stroke="rgba(167,139,250,0.4)" fill="rgba(167,139,250,0.05)" activo={activo === "fin"} dim={activo !== null && activo !== "fin"} onSelect={resaltarCamino}>
            <rect x={540} y={190} width={440} height={42} rx={14} fill="rgba(167,139,250,0.12)" />
            <rect x={540} y={214} width={440} height={18} fill="rgba(167,139,250,0.12)" />
            <circle cx={558} cy={211} r={4} fill="#a78bfa" />
            <text x={574} y={216} fontFamily={MONO} fontSize={12} fontWeight={700} fill="#c4b5fd">EVENTO · FIN_SERVICIO</text>
            {["1 · registra espera y tiempo en sistema", "2 · cola no vacía → extrae cabeza FIFO", "3 · inicia su servicio (programa FIN)", "4 · cola vacía → libera el servidor"].map((t, i) => (
              <text key={i} x={556} y={252 + i * 21} fontFamily={MONO} fontSize={11} fill="#cbd5e1">{t}</text>
            ))}
          </N>

          {/* Fila inferior */}
          <Flecha d="M 240 330 L 240 370" color="#fbbf24" duenos={["arribo", "cola"]} activo={activo} label="se encola" lx={252} ly={354} />

          <N id="cola" x={60} y={372} w={380} h={76} stroke="rgba(251,191,36,0.45)" fill="rgba(251,191,36,0.05)" dashed activo={activo === "cola"} dim={activo !== null && activo !== "cola"} onSelect={resaltarCamino}>
            <text x={78} y={400} fontFamily={MONO} fontSize={12} fontWeight={700} fill="#fcd34d">COLA FIFO</text>
            <text x={78} y={422} fontFamily={MONO} fontSize={10} fill="#94a3b8">1ro en llegar, 1ro en atender</text>
          </N>

          <N id="servidor" x={600} y={372} w={300} h={76} stroke="rgba(52,211,153,0.5)" fill="rgba(52,211,153,0.1)" activo={activo === "servidor"} dim={activo !== null && activo !== "servidor"} onSelect={resaltarCamino}>
            <text x={750} y={400} textAnchor="middle" fontFamily={MONO} fontSize={12} fontWeight={700} fill="#6ee7b7">SERVIDOR ÚNICO</text>
            <text x={750} y={422} textAnchor="middle" fontFamily={MONO} fontSize={10} fill="#94a3b8">1 cliente a la vez</text>
          </N>

          <Flecha d="M 440 410 L 598 410" color="#fbbf24" duenos={["cola", "servidor"]} activo={activo} label="extrae cabeza" lx={519} ly={400} anchor="middle" />
          <Flecha d="M 430 330 C 430 358, 545 350, 596 392" color="#38bdf8" duenos={["arribo", "servidor"]} activo={activo} dashed />
          <Flecha d="M 760 330 L 760 370" color="#a78bfa" duenos={["fin", "servidor"]} activo={activo} dashed />
        </svg>
      </div>

      {/* ---------------- Panel de detalle ---------------- */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setAuto((a) => !a)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
              auto ? "bg-indigo-500/80 text-white" : "border border-white/15 text-slate-300 hover:bg-white/10"
            )}
          >
            {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {auto ? "Pausar recorrido" : "Recorrido automático"}
          </button>
          <button onClick={() => resaltarCamino("arribo")} className={cn("rounded-xl border px-3 py-1.5 text-xs font-bold transition", activo === "arribo" ? "border-sky-400/50 bg-sky-400/20 text-sky-300" : "border-white/15 text-slate-300 hover:bg-white/10")}>
            Evento ARRIBO
          </button>
          <button onClick={() => resaltarCamino("fin")} className={cn("rounded-xl border px-3 py-1.5 text-xs font-bold transition", activo === "fin" ? "border-violet-400/50 bg-violet-400/20 text-violet-300" : "border-white/15 text-slate-300 hover:bg-white/10")}>
            Evento FIN_SERVICIO
          </button>
          <button onClick={() => { setAuto(false); setActivo(null); }} className="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-white/10">
            Ver todo
          </button>
        </div>

        {info ? (
          <Card className="flex-1 border-white/10" key={activo ?? "vacio"}>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl ring-1" style={{ background: `${info.color}22`, color: info.color, borderColor: `${info.color}55` }}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-sm font-extrabold text-white">{info.titulo}</h4>
                <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: info.color }}>{info.tag}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">{info.desc}</p>
            <div className="mt-3 space-y-1.5">
              {info.tech.map((t, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-black/40 px-2.5 py-1.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: info.color }} />
                  <code className="font-mono text-[10.5px] leading-relaxed text-slate-300">{t}</code>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="flex flex-1 flex-col items-center justify-center text-center">
            <Boxes className="h-8 w-8 text-slate-600" />
            <p className="mt-2 max-w-[220px] text-xs leading-relaxed text-slate-500">
              Hacé clic en cualquier bloque del diagrama para ver qué hace, o activá el recorrido automático.
            </p>
          </Card>
        )}

        {/* barra de progreso del recorrido */}
        <div className="flex items-center gap-1.5">
          {ORDEN.map((id) => (
            <button
              key={id}
              onClick={() => { setAuto(false); setActivo(id); }}
              className={cn(
                "h-1.5 flex-1 rounded-full transition",
                activo === id ? "bg-indigo-400" : "bg-white/10 hover:bg-white/25"
              )}
              title={INFO[id].titulo}
            />
          ))}
        </div>
        <p className="text-center font-mono text-[10px] text-slate-600">
          paso {activo ? ORDEN.indexOf(activo) + 1 : "–"} de {ORDEN.length}
        </p>
      </div>
    </div>
  );
}
