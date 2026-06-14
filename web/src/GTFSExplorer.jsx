import { useState, useEffect } from "react";

// ─── URL del data.json generado por el pipeline ────────────────────────────
// URL raw del data.json en el repositorio (repo público, rama main).
const DATA_URL = "https://raw.githubusercontent.com/yocastros/worldofestadistiques/main/pipeline/output/data.json"; // null = usar solo datos de demostración (fallback)

// ─── DATOS DE DEMOSTRACIÓN (fallback cuando DATA_URL es null o falla) ──────
// Estos datos son el output real del pipeline ejecutado el 14/06/2026
const DEMO_DATA = {
  gtfs_version: "V149.20251206",
  gtfs_start: "20251206",
  gtfs_end: "20251231",
  rutas_bus: 412,
  rutas_metro: 13,
  paradas_total: 13054,
  generado_en: "2026-06-14T08:06:53Z",
  metro_lines: [
    { id:"L1",  nombre:"Línea 1 (San Pablo - Los Dominicos)",               punta_min:3.9,  color:"#C8102E" },
    { id:"L2",  nombre:"Línea 2 (Vespucio Norte - Hospital El Pino)",       punta_min:6.2,  color:"#F5A800" },
    { id:"L3",  nombre:"Línea 3 (Plaza Quilicura - F. Castillo Velasco)",   punta_min:6.7,  color:"#8C6239" },
    { id:"L4",  nombre:"Línea 4 (Tobalaba - Plaza de Puente Alto)",         punta_min:7.5,  color:"#1B9AD1" },
    { id:"L4A", nombre:"Línea 4A (La Cisterna - Vicuña Mackenna)",          punta_min:5.5,  color:"#1B9AD1" },
    { id:"L5",  nombre:"Línea 5 (Plaza de Maipú - Vicente Valdés)",         punta_min:6.3,  color:"#00A550" },
    { id:"L6",  nombre:"Línea 6 (Cerrillos - Los Leones)",                  punta_min:7.5,  color:"#9E1C72" },
  ],
  periodos_bus: [
    { periodo:"Madrugada", horario:"05:00–07:00", avg:16.8, mediana:15.0, n:2905  },
    { periodo:"Punta AM",  horario:"07:00–09:00", avg:16.2, mediana:13.2, n:1221  },
    { periodo:"Valle",     horario:"09:00–18:00", avg:14.6, mediana:12.5, n:4626  },
    { periodo:"Punta PM",  horario:"18:00–20:00", avg:16.6, mediana:15.0, n:1770  },
    { periodo:"Nocturno",  horario:"20:00–23:30", avg:23.1, mediana:20.0, n:2362  },
  ],
  top_rutas: [
    { id:"211c", nombre:"La Cisterna → San Bernardo",      freq:5.3, tiene_metro:true  },
    { id:"C10e", nombre:"Tobalaba → Camino Juan Pablo II", freq:5.3, tiene_metro:true  },
    { id:"203c", nombre:"La Pintana → La Granja",          freq:6.0, tiene_metro:false },
    { id:"C20",  nombre:"Escuela Militar → Parque Arauco", freq:6.3, tiene_metro:true  },
    { id:"208c", nombre:"Huechuraba → Zapadores",          freq:6.4, tiene_metro:true  },
    { id:"203e", nombre:"Centro → La Pintana",             freq:7.0, tiene_metro:false },
    { id:"C14",  nombre:"Escuela Militar → Los Trapenses", freq:7.7, tiene_metro:true  },
    { id:"104",  nombre:"Providencia → Camilo Henríquez",  freq:7.8, tiene_metro:false },
    { id:"425",  nombre:"Rigoberto Jara → Lo Hermida",     freq:7.9, tiene_metro:false },
    { id:"I09",  nombre:"Rinconada → U. de Chile",         freq:8.0, tiene_metro:true  },
  ],
  serie_metro: [
    {mes:"Ene 2024",m:48.2},{mes:"Feb 2024",m:45.1},{mes:"Mar 2024",m:52.3},
    {mes:"Abr 2024",m:51.0},{mes:"May 2024",m:53.4},{mes:"Jun 2024",m:52.1},
    {mes:"Jul 2024",m:50.8},{mes:"Ago 2024",m:53.9},{mes:"Sep 2024",m:54.2},
    {mes:"Oct 2024",m:55.8},{mes:"Nov 2024",m:56.9},{mes:"Dic 2024",m:51.3},
    {mes:"Ene 2025",m:50.1},{mes:"Feb 2025",m:47.8},{mes:"Mar 2025",m:55.2},
    {mes:"Abr 2025",m:54.6},{mes:"May 2025",m:57.1},{mes:"Jun 2025",m:55.9},
    {mes:"Jul 2025",m:53.4},{mes:"Ago 2025",m:56.3},{mes:"Sep 2025",m:57.0},
    {mes:"Oct 2025",m:62.2},{mes:"Nov 2025",m:57.7},
  ],
};

// ─── UI helpers ────────────────────────────────────────────────────────────
const mono = { fontFamily:"monospace" };

const Tag = ({ children, color="#4FA3D1" }) => (
  <span style={{ ...mono, fontSize:"0.6rem", letterSpacing:"0.1em",
    textTransform:"uppercase", padding:"0.1rem 0.4rem",
    background:`${color}20`, color, border:`1px solid ${color}40`,
    borderRadius:2, whiteSpace:"nowrap" }}>{children}</span>
);

const Tip = ({ text, children }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ borderBottom:"1px dashed #4FA3D1", color:"#4FA3D1",
        cursor:"help", ...mono, fontSize:"0.75rem" }}>{children}</span>
      {show && (
        <span style={{ position:"absolute", bottom:"calc(100% + 4px)", left:0,
          background:"#1F2937", color:"#D1D5DB", fontSize:"0.68rem",
          padding:"0.4rem 0.6rem", borderRadius:3, width:220, zIndex:50,
          lineHeight:1.5, boxShadow:"0 4px 12px rgba(0,0,0,.5)", ...mono }}>{text}</span>
      )}
    </span>
  );
};

const HBar = ({ value, max, color }) => (
  <div style={{ background:"#1F2937", borderRadius:2, height:8, flex:1, minWidth:60 }}>
    <div style={{ width:`${Math.min(100,(value/max)*100)}%`, height:"100%",
      background:color, borderRadius:2, transition:"width .6s ease" }}/>
  </div>
);

// ─── Estado del pipeline ───────────────────────────────────────────────────
function PipelineBadge({ data, source }) {
  const fecha = data?.generado_en
    ? new Date(data.generado_en).toLocaleDateString("es-CL", { day:"numeric", month:"short", year:"numeric" })
    : "—";
  return (
    <div style={{ background:"#0D1117", border:"1px solid #1F2937",
      borderLeft:`3px solid ${source==="live"?"#1A9E6B":"#F0B429"}`,
      padding:"0.75rem 1.1rem", marginBottom:"1.25rem",
      display:"flex", alignItems:"center", gap:"1rem", flexWrap:"wrap" }}>
      <div style={{ flex:1 }}>
        <div style={{ ...mono, fontSize:"0.58rem", textTransform:"uppercase",
          letterSpacing:"0.12em", color: source==="live"?"#1A9E6B":"#F0B429", marginBottom:2 }}>
          {source === "live" ? "✓ Datos en vivo — data.json desde GitHub" : "⚠ Modo demostración — datos del pipeline 14/06/2026"}
        </div>
        <div style={{ fontSize:"0.8rem", color:"#D1D5DB" }}>
          GTFS <strong style={{ color:"#F5F1E8" }}>{data?.gtfs_version}</strong>
          {" · "}vigente {data?.gtfs_start?.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")} → {data?.gtfs_end?.replace(/(\d{4})(\d{2})(\d{2})/, "$3/$2/$1")}
        </div>
      </div>
      <div style={{ ...mono, fontSize:"0.65rem", color:"#6B7280", textAlign:"right" }}>
        Generado<br/>{fecha}
      </div>
    </div>
  );
}

// ─── Pestañas de contenido ─────────────────────────────────────────────────
function TabMetro({ lines }) {
  const [active, setActive] = useState(null);
  return (
    <div>
      <p style={{ fontSize:"0.83rem", color:"#9CA3AF", lineHeight:1.7, marginBottom:"0.75rem" }}>
        <Tip text="Intervalo en minutos entre trenes consecutivos en la misma dirección, extraído del GTFS vigente.">Headway</Tip>{" "}
        real en hora punta AM (07:00–09:00) según el archivo GTFS del DTPM.
        Menor número = más frecuente = menos espera.
      </p>
      <div style={{ display:"grid", gap:1, background:"#1F2937" }}>
        {lines.map(l => (
          <div key={l.id} onClick={() => setActive(active===l.id ? null : l.id)}
            style={{ background: active===l.id ? "#111827":"#0D1117",
              padding:"0.85rem 1.1rem", cursor:"pointer",
              display:"grid", gridTemplateColumns:"3.5rem 1fr auto auto",
              alignItems:"center", gap:"1rem",
              borderLeft:`3px solid ${l.color}`, transition:"background .15s" }}>
            <span style={{ ...mono, fontWeight:700, color:l.color, fontSize:"0.8rem" }}>{l.id}</span>
            <div>
              <div style={{ fontSize:"0.82rem", color:"#F5F1E8", fontWeight:500 }}>
                {l.nombre.replace(/\(.*?\)\s*/,"").trim()}
              </div>
              {active===l.id && (
                <div style={{ ...mono, fontSize:"0.68rem", color:"#6B7280", marginTop:3 }}>
                  {l.nombre}
                </div>
              )}
            </div>
            <HBar value={Math.max(0,10-l.punta_min)} max={9} color={l.color}/>
            <div style={{ textAlign:"right", minWidth:64 }}>
              <span style={{ ...mono, fontWeight:700, fontSize:"1rem",
                color: l.punta_min<=5?"#1A9E6B": l.punta_min<=7?"#F0B429":"#9CA3AF" }}>
                {l.punta_min}
              </span>
              <span style={{ ...mono, fontSize:"0.6rem", color:"#6B7280" }}> min</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ ...mono, fontSize:"0.62rem", color:"#4B5563", marginTop:6 }}>
        Verde ≤ 5 min · Amarillo ≤ 7 min · Gris &gt; 7 min · Click para detalle
      </p>
    </div>
  );
}

function TabBuses({ periodos }) {
  const maxAvg = Math.max(...periodos.map(p=>p.avg));
  return (
    <div>
      <p style={{ fontSize:"0.83rem", color:"#9CA3AF", lineHeight:1.7, marginBottom:"0.75rem" }}>
        Frecuencia promedio de las <strong style={{color:"#F5F1E8"}}>{412}</strong> rutas de buses RED por período horario.
        La <Tip text="Valor central: la mitad de las rutas tiene una frecuencia menor y la otra mitad mayor. Más robusta que el promedio ante valores extremos.">mediana</Tip>{" "}
        es más representativa que el promedio.
      </p>
      <div style={{ display:"grid", gap:1, background:"#1F2937" }}>
        {periodos.map(p => (
          <div key={p.periodo} style={{ background:"#0D1117", padding:"0.85rem 1.1rem",
            display:"grid", gridTemplateColumns:"8rem 1fr 5.5rem 5.5rem",
            alignItems:"center", gap:"1rem" }}>
            <div>
              <div style={{ fontSize:"0.82rem", color:"#F5F1E8", fontWeight:500 }}>{p.periodo}</div>
              <div style={{ ...mono, fontSize:"0.62rem", color:"#6B7280" }}>{p.horario}</div>
            </div>
            <HBar value={maxAvg - p.avg + 5} max={maxAvg + 3} color="#4FA3D1"/>
            <div style={{ textAlign:"right" }}>
              <span style={{ ...mono, fontWeight:700, color:"#4FA3D1" }}>{p.avg}</span>
              <span style={{ ...mono, fontSize:"0.6rem", color:"#6B7280" }}> avg</span>
            </div>
            <div style={{ textAlign:"right" }}>
              <span style={{ ...mono, color:"#9CA3AF" }}>{p.mediana}</span>
              <span style={{ ...mono, fontSize:"0.6rem", color:"#6B7280" }}> med</span>
            </div>
          </div>
        ))}
      </div>
      <p style={{ ...mono, fontSize:"0.62rem", color:"#4B5563", marginTop:6 }}>
        avg = promedio aritmético · med = mediana · unidades en minutos
      </p>
    </div>
  );
}

function TabTopRutas({ rutas }) {
  return (
    <div>
      <p style={{ fontSize:"0.83rem", color:"#9CA3AF", lineHeight:1.7, marginBottom:"0.75rem" }}>
        Las 10 rutas de bus con menor{" "}
        <Tip text="Headway: minutos entre buses consecutivos. Menor = más frecuente.">headway</Tip>{" "}
        en hora punta AM, calculadas del GTFS. (M) = conexión directa con Metro.
      </p>
      <div style={{ display:"grid", gap:1, background:"#1F2937" }}>
        {rutas.map((r, i) => (
          <div key={r.id} style={{ background:"#0D1117", padding:"0.75rem 1.1rem",
            display:"grid", gridTemplateColumns:"2rem 3rem 1fr auto 4rem",
            alignItems:"center", gap:"0.75rem" }}>
            <span style={{ ...mono, fontSize:"0.65rem", color:"#4B5563" }}>#{i+1}</span>
            <span style={{ ...mono, fontSize:"0.72rem", color:"#E8341A", fontWeight:700 }}>{r.id}</span>
            <span style={{ fontSize:"0.8rem", color:"#D1D5DB" }}>{r.nombre.replace(/^\(M\)\s*/,"")}</span>
            <div style={{ display:"flex", gap:4 }}>
              {r.tiene_metro && <Tag color="#4FA3D1">Metro</Tag>}
            </div>
            <div style={{ textAlign:"right" }}>
              <span style={{ ...mono, fontWeight:700,
                color: r.freq<=6?"#1A9E6B":"#F0B429" }}>{r.freq}</span>
              <span style={{ ...mono, fontSize:"0.6rem", color:"#6B7280" }}> min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSerie({ serie }) {
  const vals = serie.map(d=>d.m);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const ultimo = serie[serie.length-1];
  const [hover, setHover] = useState(null);

  return (
    <div>
      <p style={{ fontSize:"0.83rem", color:"#9CA3AF", lineHeight:1.7, marginBottom:"0.75rem" }}>
        Pasajeros mensuales del Metro de Santiago publicados por el INE.
        Actualizable editando <code style={{ ...mono, background:"#1F2937",
          padding:"0 4px", borderRadius:2, fontSize:"0.75rem" }}>SERIE_INE</code>{" "}
        en el extractor cada vez que el INE publica un nuevo boletín (~2 meses de rezago).
      </p>

      {/* KPIs */}
      <div style={{ display:"flex", gap:"2rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {[
          { l:"Último dato", v:`${ultimo.m}M`, s:ultimo.mes, c:"#4FA3D1" },
          { l:"Máximo",       v:`${max}M`,      s:"Oct 2025",  c:"#1A9E6B" },
          { l:"Mínimo",       v:`${min}M`,      s:"Feb 2025",  c:"#6B7280" },
          { l:"Tendencia",    v:vals[vals.length-1]>vals[0]?"↑ Creciendo":"↓ Bajando", s:`vs ${serie[0].mes}`, c:"#F0B429" },
        ].map(k => (
          <div key={k.l}>
            <div style={{ ...mono, fontSize:"0.58rem", textTransform:"uppercase",
              letterSpacing:"0.1em", color:"#6B7280" }}>{k.l}</div>
            <div style={{ fontFamily:"'Arial Black', sans-serif",
              fontSize:"1.6rem", fontWeight:800, color:k.c, lineHeight:1.1 }}>{k.v}</div>
            <div style={{ ...mono, fontSize:"0.62rem", color:"#6B7280" }}>{k.s}</div>
          </div>
        ))}
      </div>

      {/* Gráfico barras */}
      <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:120,
        paddingBottom:"1.5rem", position:"relative", userSelect:"none" }}>
        {serie.map((d,i) => {
          const h = ((d.m-min)/(max-min||1))*85+10;
          const isLast = i===serie.length-1;
          return (
            <div key={d.mes} style={{ flex:1, display:"flex", flexDirection:"column",
              alignItems:"center", position:"relative", cursor:"default" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}>
              {hover===i && (
                <div style={{ position:"absolute", bottom:"102%", left:"50%",
                  transform:"translateX(-50%)", background:"#1F2937",
                  padding:"0.25rem 0.45rem", borderRadius:3,
                  ...mono, fontSize:"0.62rem", color:"#F5F1E8",
                  whiteSpace:"nowrap", zIndex:10 }}>
                  {d.mes}<br/>{d.m}M
                </div>
              )}
              <div style={{ width:"100%", height:`${h}%`,
                background: isLast?"#4FA3D1": hover===i?"#4FA3D150":"#1F2937",
                borderRadius:"2px 2px 0 0", transition:"background .15s",
                borderTop: isLast?"2px solid #4FA3D1":"none" }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between",
        ...mono, fontSize:"0.58rem", color:"#4B5563" }}>
        <span>{serie[0].mes}</span>
        <span>Barra azul = dato más reciente · pasar cursor para ver valor</span>
        <span>{ultimo.mes}</span>
      </div>
      <div style={{ marginTop:"0.75rem", padding:"0.65rem 0.9rem",
        background:"#0D1117", border:"1px solid #1F2937",
        ...mono, fontSize:"0.62rem", color:"#4B5563", lineHeight:1.6 }}>
        Fuente: INE — Boletín mensual "Personas transportadas por Metro de Santiago" ·
        Publicado con ~2 meses de rezago · {serie.length} meses disponibles en la serie.
      </div>
    </div>
  );
}

function TabPipeline({ data }) {
  const pasos = [
    {
      titulo:"Rutas, frecuencias, paradas",
      badge:"Automático — cada lunes 06h UTC",
      color:"#1A9E6B",
      items:[
        "GitHub Actions descarga el GTFS del DTPM (vía repo espejo)",
        "Calcula MD5: si el archivo no cambió, no hace nada",
        "Si cambió, ejecuta gtfs_extractor.py y genera un nuevo data.json",
        "Hace commit automático → el frontend lo lee sin intervención humana",
      ],
    },
    {
      titulo:"Pasajeros mensuales Metro",
      badge:"Manual — ~cada 2 meses",
      color:"#F0B429",
      items:[
        "Ir a ine.gob.cl → Sala de Prensa → buscar 'Metro de Santiago'",
        "El INE publica el boletín ~2 meses después del período",
        "Editar SERIE_INE en gtfs_extractor.py agregando { mes, m }",
        "Hacer commit → el pipeline toma el nuevo valor en la próxima ejecución",
      ],
    },
    {
      titulo:"Tarifas",
      badge:"Manual — cuando el Panel de Expertos las cambia",
      color:"#E8341A",
      items:[
        "El Panel de Expertos anuncia el cambio con ~1 semana de anticipación",
        "La resolución se publica en dtpm.cl → Sistemas de Pago → Tarifas",
        "Editar la tabla de tarifas en el HTML principal del sitio",
      ],
    },
  ];

  return (
    <div>
      <p style={{ fontSize:"0.83rem", color:"#9CA3AF", lineHeight:1.7, marginBottom:"1rem" }}>
        El pipeline corre en <strong style={{color:"#F5F1E8"}}>GitHub Actions</strong> (gratuito para repos públicos).
        Solo necesita acceso a internet; no requiere servidor propio.
      </p>

      {/* Diagrama ASCII */}
      <div style={{ background:"#0D1117", border:"1px solid #1F2937",
        padding:"1rem 1.25rem", marginBottom:"1.25rem",
        ...mono, fontSize:"0.68rem", color:"#6B7280", lineHeight:1.8, overflowX:"auto" }}>
        <pre style={{ margin:0 }}>{`DTPM (GTFS)             INE (boletín PDF)
     │                        │
     ▼                        ▼ (manual, ~2 meses)
GitHub Actions ──► gtfs_extractor.py
(cron: lunes        │
 06h UTC)           ▼
            data.json  ──► git commit → GitHub
                               │
                               ▼
                        Frontend (fetch)
                        sin reinicio ni deploy`}</pre>
      </div>

      <div style={{ display:"grid", gap:1, background:"#1F2937" }}>
        {pasos.map(p => (
          <div key={p.titulo} style={{ background:"#0D1117", padding:"1.1rem 1.25rem",
            borderLeft:`3px solid ${p.color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", gap:"1rem", marginBottom:"0.65rem", flexWrap:"wrap" }}>
              <span style={{ fontWeight:600, color:"#F5F1E8", fontSize:"0.88rem" }}>{p.titulo}</span>
              <Tag color={p.color}>{p.badge}</Tag>
            </div>
            <ol style={{ paddingLeft:"1.25rem", margin:0 }}>
              {p.items.map((s,i) => (
                <li key={i} style={{ fontSize:"0.78rem", color:"#9CA3AF",
                  lineHeight:1.65, marginBottom:"0.2rem" }}>{s}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div style={{ marginTop:"1.25rem", padding:"0.75rem 1rem",
        background:"rgba(232,52,26,0.06)", border:"1px solid rgba(232,52,26,0.2)",
        fontSize:"0.75rem", color:"#C0503A", lineHeight:1.6 }}>
        <strong>Limitación actual:</strong> El GTFS refleja el programa de operación planificado, no
        posiciones en tiempo real. Para datos en tiempo real se requiere convenio formal con el DTPM
        (acceso a su API privada con IP fija). El MTT licitó la renovación de ese sistema en abril 2025;
        cuando esté disponible públicamente, el pipeline puede extenderse.
      </div>
    </div>
  );
}

// ─── APP ───────────────────────────────────────────────────────────────────
const TABS = [
  { id:"metro",    label:"Metro — headways" },
  { id:"buses",    label:"Buses RED — períodos" },
  { id:"toprutas", label:"Top rutas" },
  { id:"serie",    label:"Pasajeros mensual" },
  { id:"pipeline", label:"Pipeline" },
];

export default function GTFSExplorer() {
  const [tab, setTab]   = useState("metro");
  const [data, setData] = useState(null);
  const [src, setSrc]   = useState("demo");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (DATA_URL) {
      setLoading(true);
      fetch(DATA_URL)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(d => { setData(d); setSrc("live"); })
        .catch(() => { setData(DEMO_DATA); setSrc("demo"); })
        .finally(() => setLoading(false));
    } else {
      setData(DEMO_DATA);
      setSrc("demo");
    }
  }, []);

  if (!data) return (
    <div style={{ minHeight:"100vh", background:"#111318", color:"#F5F1E8",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"monospace", fontSize:"0.8rem", color:"#6B7280" }}>
      {loading ? "Cargando datos del pipeline..." : "Iniciando..."}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#111318", color:"#F5F1E8",
      fontFamily:"Inter, sans-serif" }}>

      {/* HEADER */}
      <div style={{ borderBottom:"1px solid #1F2937", padding:"1.25rem 1.5rem 1rem" }}>
        <div style={{ fontFamily:"monospace", fontSize:"0.58rem", letterSpacing:"0.15em",
          textTransform:"uppercase", color:"#4FA3D1", marginBottom:"0.4rem" }}>
          Pipeline de datos abiertos · Santiago de Chile
        </div>
        <h1 style={{ fontFamily:"'Arial Black', sans-serif",
          fontSize:"clamp(1.3rem,4vw,2rem)", fontWeight:900,
          lineHeight:1, letterSpacing:"-0.02em", margin:0 }}>
          GTFS Explorer<br/>
          <span style={{ color:"#E8341A" }}>Red Metropolitana</span>
        </h1>

        {/* KPIs del sistema */}
        <div style={{ display:"flex", gap:"1.5rem", marginTop:"0.9rem",
          paddingTop:"0.9rem", borderTop:"1px solid #1F2937", flexWrap:"wrap" }}>
          {[
            ["Rutas de bus",             data.rutas_bus],
            ["Rutas de Metro",           data.rutas_metro],
            ["Paradas / estaciones",     data.paradas_total.toLocaleString("es-CL")],
            ["Pasajeros Metro nov. 2025","57,7M"],
          ].map(([l,v]) => (
            <div key={l}>
              <div style={{ fontFamily:"monospace", fontSize:"0.56rem",
                textTransform:"uppercase", letterSpacing:"0.1em", color:"#6B7280" }}>{l}</div>
              <div style={{ fontFamily:"'Arial Black',sans-serif",
                fontWeight:900, fontSize:"1.2rem", color:"#F5F1E8", lineHeight:1.1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display:"flex", overflowX:"auto", borderBottom:"1px solid #1F2937",
        scrollbarWidth:"none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding:"0.7rem 1rem", background:"none", border:"none",
            borderBottom: tab===t.id ? "2px solid #E8341A":"2px solid transparent",
            color: tab===t.id ? "#F5F1E8":"#6B7280",
            fontFamily:"monospace", fontSize:"0.62rem", letterSpacing:"0.08em",
            textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap",
            transition:"color .15s" }}>{t.label}</button>
        ))}
      </div>

      {/* CONTENIDO */}
      <div style={{ padding:"1.25rem 1.5rem", maxWidth:860 }}>
        <PipelineBadge data={data} source={src}/>
        {tab === "metro"    && <TabMetro    lines={data.metro_lines}/>}
        {tab === "buses"    && <TabBuses    periodos={data.periodos_bus}/>}
        {tab === "toprutas" && <TabTopRutas rutas={data.top_rutas}/>}
        {tab === "serie"    && <TabSerie    serie={data.serie_metro}/>}
        {tab === "pipeline" && <TabPipeline data={data}/>}
      </div>

      {/* FOOTER */}
      <div style={{ margin:"0 1.5rem 1.5rem", padding:"0.65rem 1rem",
        background:"#0D1117", border:"1px solid #1F2937",
        fontFamily:"monospace", fontSize:"0.6rem", color:"#4B5563", lineHeight:1.7 }}>
        Fuentes: DTPM — GTFS {data.gtfs_version} · INE — Boletín Metro mensual ·
        Pipeline: GitHub Actions (cron lunes 06h UTC) ·
        Los datos de frecuencia son programados, no en tiempo real.
      </div>
    </div>
  );
}
