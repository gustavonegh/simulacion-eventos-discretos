# Simulación de Eventos Discretos — Centro de Atención Universitaria

Aplicación web interactiva (React + Vite + Tailwind v4) que implementa un
**simulador de eventos discretos (DES)** para un centro de atención administrativa
con una única estación de servicio, operando de **09:00 a 15:00**.

Incluye las 7 secciones del informe: presentación y objetivos, EDA del dataset,
**carga de tu CSV real**, modelo probabilístico, **① simulador en vivo**,
**② laboratorio de réplicas**, escenario de mejora operativa y discusión de
supuestos.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) **20 o superior** (recomendado 22 LTS)
- **Visual Studio Code** con la extensión *ESLint* (opcional)

---

## Abrir y editar en Visual Studio Code

```bash
# 1. Descomprimí el proyecto descargado y entrá a la carpeta
cd nombre-del-proyecto

# 2. Instalá las dependencias (crea la carpeta node_modules/)
npm install

# 3. Levantá el servidor de desarrollo
npm run dev
```

Vite te va a mostrar una URL local (por defecto **http://localhost:5173**).
Abrila en el navegador. Cada vez que guardes un archivo, la página se
recarga sola (Hot Module Replacement).

Para editar desde VS Code directamente:

```bash
# desde la carpeta del proyecto
code .
```

---

## Scripts disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Compila a producción dentro de `dist/` (todo en un único `index.html`) |
| `npm run preview` | Previsualiza localmente el build de producción |

---

## Estructura del proyecto

```
├── index.html                 # Título de la pestaña y fuentes de Google
├── package.json               # Dependencias y scripts
├── vite.config.ts             # Config de Vite (+ plugin single-file)
├── tsconfig.json              # TypeScript estricto, alias "@" → src/
└── src/
    ├── main.tsx               # Punto de entrada de React
    ├── index.css              # Tailwind v4 + tema oscuro + animaciones
    ├── App.tsx                # Compone todas las secciones
    ├── components/
    │   ├── Nav.tsx            # Barra de navegación fija
    │   ├── Hero.tsx           # Portada con las DOS OPCIONES
    │   ├── Presentation.tsx   # 1. Presentación y objetivos
    │   ├── Eda.tsx            # 2. EDA y verificación del CSV
    │   ├── DataUpload.tsx     # Carga de tu CSV real + reproducibilidad
    │   ├── DesDiagramInteractive.tsx  # Diagrama SVG interactivo (reloj/FEL/eventos)
    │   ├── Model.tsx          # 3. Modelo probabilístico (histogramas)
    │   ├── LiveSim.tsx        # ① Simulador en vivo (reloj, FEL, FIFO)
    │   ├── Lab.tsx            # ② Laboratorio de réplicas + IC 95%
    │   ├── Discussion.tsx     # 6. Mejora, supuestos y 4 reflexiones
    │   └── ui.tsx             # Componentes base reutilizables
    ├── lib/
    │   ├── rng.ts             # RNG sembrado (mulberry32) + normal/gamma
    │   ├── dist.ts            # Lognorm, Weibull, Beta (equivalente a scipy)
    │   ├── sim.ts             # Motor DES: reloj, FEL (min-heap), FIFO
    │   ├── edaData.ts         # Dataset sintético de 1.190 filas
    │   └── meta.ts            # Metadatos de métricas y colores
    └── utils/cn.ts            # Helper de clases de Tailwind
```

---

## Dónde ajustar los parámetros del modelo

Todos los parámetros de la cátedra están centralizados en
[`src/lib/dist.ts`](src/lib/dist.ts):

| Parámetro | Archivo | Valor |
|---|---|---|
| Tiempo entre arribos (Log-normal) | `src/lib/dist.ts` | s=1.4381, loc=−0.0816, scale=6.0595 |
| Consulta (Weibull mínima) | `src/lib/dist.ts` | c=1.8748, loc=0.3047, scale=4.5329 |
| Pago (Beta) | `src/lib/dist.ts` | a=4.169, b=114.649, loc=−0.266, scale=224.443 |
| Trámite (Beta) | `src/lib/dist.ts` | a=4.821, b=1.329.433, loc=−0.268, scale=3.500.903 |
| Proporciones empíricas | `src/lib/dist.ts` | consulta 0.5479 · pago 0.3521 · trámite 0.1000 |
| Cierre de arribos (15:00) | `src/lib/sim.ts` | `TIEMPO_CIERRE_ARRIBOS = 360` |
| Factor de la mejora | `src/lib/sim.ts` | `tramiteFactor: 0.8` (trámites −20%) |
| Réplicas y semilla por defecto | `src/App.tsx` | `runReplicas(100, 42, …)` |
| Proporciones del modelo | `src/lib/dist.ts` | `PROB_SERVICIOS` (o las de tu CSV, cargado en la web) |

Si cambiás la semilla o el número de réplicas en `src/App.tsx`, el laboratorio
arranca con esos valores (también podés cambiarlos en pantalla).

---

## Notas técnicas

- El motor reproduce fielmente el notebook de Python: mismo RNG sembrado
  (equivalente a `np.random.seed(42)`), mismas distribuciones de `scipy.stats`
  y mismo cálculo de intervalos de confianza (media ± 1.96 · SEM).
- Con 500 réplicas las métricas coinciden con las del informe
  (espera media ≈ 6.52 min, P90 ≈ 16.5 min, utilización ≈ 45%).
- El build de producción genera un único `index.html` autocontenido
  (`vite-plugin-singlefile`), fácil de subir a cualquier hosting estático.

---

## ¿Subirlo a un repositorio en la nube?

Sí, sin problemas. El `.gitignore` ya excluye `node_modules/` y `dist/`, así que
solo se versiona el código fuente (~340 KB).

---

## Probar en local

```bash
npm install        # solo la primera vez
npm run dev        # http://localhost:5173  (recarga en caliente)
```

Para probar **exactamente lo que se va a publicar** (build de producción):

```bash
npm run build      # genera dist/
npm run preview    # http://localhost:4173
```

---

## Subir a Netlify

El repo ya incluye `netlify.toml`, así que el deploy es automático: no hay que
configurar nada en el panel.

### Opción A — Desde GitHub (recomendada)

```bash
git init
git add .
git commit -m "Simulador DES - Centro de atencion universitaria"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

Después: [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
existing project** → elegí el repo. Netlify lee el `netlify.toml` y usa:

| Campo | Valor |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | `20` |

Cada `git push` redespliega solo.

### Opción B — Netlify Drop (sin git, 30 segundos)

```bash
npm run build
```

Y arrastrá la carpeta **`dist/`** a [app.netlify.com/drop](https://app.netlify.com/drop).
Como el build es un único `index.html` autocontenido, no hay nada más que subir.

### Opción C — Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod --dir=dist
```

> **Importante:** subí siempre la carpeta `dist/` (el resultado de `npm run build`),
> nunca el proyecto completo: `node_modules/` son 200 MB y no se necesita en producción.

### Otras alternativas

| Servicio | Cómo |
|---|---|
| **Vercel** | `npx vercel --prod` desde la carpeta del proyecto |
| **Surge.sh** | `npx surge dist/` |
| **GitHub Pages** | Settings → Pages → Source: branch `main`, carpeta `/dist` |

**Sobre el `.ipynb` y el CSV:** podés incluirlos en el repo como documentación
(carpeta `docs/`), pero no afectan la ejecución de la app. El CSV original sí es
útil tenerlo a mano: la sección «Tu CSV» de la web te deja cargarlo en el
navegador para recalcular las proporciones con tus datos reales, sin que haya
que subirlo a ningún servidor.
