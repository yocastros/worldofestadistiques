import { useState, useEffect, useRef } from "react";
import { C, shadow, shadowHover } from "./theme.js";

// ─── URL del data.json generado por el pipeline (repo público, rama main) ───
const DATA_URL = "https://raw.githubusercontent.com/yocastros/worldofestadistiques/main/pipeline/output/data.json";

// ─── Datos de demostración (fallback si el fetch falla) ─────────────────────
const DEMO_DATA = {
  gtfs_version: "V149.20251206",
  gtfs_start: "20251206",
  gtfs_end: "20251231",
  rutas_bus: 412,
  rutas_metro: 13,
  paradas_total: 13054,
  generado_en: "2026-06-14T08:06:53Z",
  metro_lines: [
    { id: "L1", nombre: "Línea 1 (San Pablo - Los Dominicos)", punta_min: 3.9, color: "#C8102E" },
    { id: "L2", nombre: "Línea 2 (Vespucio Norte - Hospital El Pino)", punta_min: 5.5, color: "#F2A900" },
    { id: "L3", nombre: "Línea 3 (Plaza Quilicura - F. Castillo Velasco)", punta_min: 5.5, color: "#703F2A" },
    { id: "L4", nombre: "Línea 4 (Tobalaba - Plaza de Puente Alto)", punta_min: 6.1, color: "#151F6D" },
    { id: "L4A", nombre: "Línea 4A (La Cisterna - Vicuña Mackenna)", punta_min: 5.5, color: "#0072CE" },
    { id: "L5", nombre: "Línea 5 (Plaza de Maipú - Vicente Valdés)", punta_min: 5.5, color: "#00965E" },
    { id: "L6", nombre: "Línea 6 (Cerrillos - Los Leones)", punta_min: 6.3, color: "#8E3A80" },
  ],
  periodos_bus: [
    { periodo: "Madrugada", horario: "05:00–07:00", avg: 16.8, mediana: 15.0, n: 2905 },
    { periodo: "Punta AM", horario: "07:00–09:00", avg: 16.2, mediana: 13.2, n: 1221 },
    { periodo: "Valle", horario: "09:00–18:00", avg: 14.6, mediana: 12.5, n: 4626 },
    { periodo: "Punta PM", horario: "18:00–20:00", avg: 16.6, mediana: 15.0, n: 1770 },
    { periodo: "Nocturno", horario: "20:00–23:30", avg: 23.1, mediana: 20.0, n: 2362 },
  ],
  top_rutas: [
    { id: "211c", nombre: "(M) La Cisterna - San Bernardo", freq: 5.3, tiene_metro: true },
    { id: "C10e", nombre: "(M) Tobalaba - Camino Juan Pablo II", freq: 5.3, tiene_metro: true },
    { id: "203c", nombre: "La Pintana - La Granja", freq: 6.0, tiene_metro: false },
    { id: "C20", nombre: "(M) Escuela Militar - Parque Arauco", freq: 6.3, tiene_metro: true },
    { id: "208c", nombre: "Huechuraba - (M) Zapadores", freq: 6.4, tiene_metro: false },
    { id: "203e", nombre: "Centro - La Pintana", freq: 7.0, tiene_metro: false },
    { id: "C14", nombre: "(M) Escuela Militar - Los Trapenses", freq: 7.7, tiene_metro: true },
    { id: "104", nombre: "Providencia - Camilo Henríquez", freq: 7.8, tiene_metro: false },
    { id: "425", nombre: "Rigoberto Jara - Lo Hermida", freq: 7.9, tiene_metro: false },
    { id: "I09", nombre: "Rinconada - (M) U. de Chile", freq: 8.0, tiene_metro: false },
  ],
  serie_metro: [
    { mes: "Ene 2024", m: 48.2 }, { mes: "Feb 2024", m: 45.1 }, { mes: "Mar 2024", m: 52.3 },
    { mes: "Abr 2024", m: 51.0 }, { mes: "May 2024", m: 53.4 }, { mes: "Jun 2024", m: 52.1 },
    { mes: "Jul 2024", m: 50.8 }, { mes: "Ago 2024", m: 53.9 }, { mes: "Sep 2024", m: 54.2 },
    { mes: "Oct 2024", m: 55.8 }, { mes: "Nov 2024", m: 56.9 }, { mes: "Dic 2024", m: 51.3 },
    { mes: "Ene 2025", m: 50.1 }, { mes: "Feb 2025", m: 47.8 }, { mes: "Mar 2025", m: 55.2 },
    { mes: "Abr 2025", m: 54.6 }, { mes: "May 2025", m: 57.1 }, { mes: "Jun 2025", m: 55.9 },
    { mes: "Jul 2025", m: 53.4 }, { mes: "Ago 2025", m: 56.3 }, { mes: "Sep 2025", m: 57.0 },
    { mes: "Oct 2025", m: 62.2 }, { mes: "Nov 2025", m: 57.7 },
  ],
};

// ─── Datos editoriales (de fuentes oficiales, no vienen del GTFS) ────────────
const MODAL = [
  { modo: "Transporte público", pct: 54, color: "#2563EB", nota: "viajes al trabajo · Censo INE 2024" },
  { modo: "Automóvil particular", pct: 31.7, color: "#64748B", nota: "viajes totales · CEDEUS 2024" },
  { modo: "Caminata", pct: 30.4, color: "#10B981", nota: "viajes totales · CEDEUS 2024" },
  { modo: "Motocicleta", pct: 1.8, color: "#F59E0B", nota: "viajes totales · CEDEUS 2024" },
  { modo: "Bicicleta u otro", pct: 2, color: "#06B6D4", nota: "viajes totales · CEDEUS 2024" },
];

const TARIFAS = [
  { perfil: "Adulto · Punta", horario: "07–09 / 18–20 h", bus: "$795", metro: "$895", destacado: true },
  { perfil: "Adulto · Valle", horario: "resto del día", bus: "$795", metro: "$815" },
  { perfil: "Adulto · Baja", horario: "06–07 / 20:45–23 h", bus: "$795", metro: "$735" },
  { perfil: "Estudiante", horario: "todo horario", bus: "$260", metro: "$260" },
  { perfil: "Adulto mayor (bip!)", horario: "todo horario", bus: "$390", metro: "$390" },
  { perfil: "Dale QR (tope mensual)", horario: "—", bus: "$42.000 / mes", metro: "$42.000 / mes" },
];

const SEGURIDAD = [
  { v: "75.653", l: "Siniestros de tránsito en Chile (2024)", c: "#EF4444" },
  { v: "1.438", l: "Personas fallecidas en vías (2024)", c: "#F59E0B" },
  { v: "−12%", l: "Reducción de fallecidos vs. 2023", c: "#10B981" },
  { v: "4", l: "Fallecidos diarios promedio (vs. 5 en 2023)", c: "#2563EB" },
];

const EXPANSION = [
  { l: "L7", t: "Brasil → Estoril", d: "19 estaciones · 24,8 km · 2028 · 39% de avance", c: "#E87D1A" },
  { l: "L8", t: "Providencia → Puente Alto", d: "14 estaciones · 19 km · viaje de 23 min · 2028+", c: "#2563EB" },
  { l: "L9", t: "Cal y Canto → La Pintana", d: "19 estaciones · 27 km · primer tramo 2030", c: "#10B981" },
];

// ─── Estilos de texto reutilizados ──────────────────────────────────────────
const txt = {
  detailLead: { fontSize: ".85rem", color: C.muted, lineHeight: 1.65, marginBottom: 18, maxWidth: 720 },
};

// ─── Helpers de UI ───────────────────────────────────────────────────────────
const Chip = ({ children, color = C.blue, bg }) => (
  <span style={{
    fontSize: ".68rem", fontWeight: 600, color, background: bg || `${color}14`,
    padding: ".2rem .55rem", borderRadius: 999, whiteSpace: "nowrap",
  }}>{children}</span>
);

function Bar({ value, max, color, height = 9 }) {
  return (
    <div style={{ background: "#EEF2F8", borderRadius: 999, height, flex: 1, minWidth: 60, overflow: "hidden" }}>
      <div style={{ width: `${Math.max(2, Math.min(100, (value / max) * 100))}%`, height: "100%", background: color, borderRadius: 999, transition: "width .7s cubic-bezier(.22,1,.36,1)" }} />
    </div>
  );
}

// ─── Tarjetas de detalle (el contenido del drill-down) ──────────────────────
function DetailMetro({ data }) {
  const lines = [...data.metro_lines].sort((a, b) => a.punta_min - b.punta_min);
  const max = Math.max(...lines.map((l) => l.punta_min));
  return (
    <div>
      <p style={txt.detailLead}>
        Minutos entre trenes en hora punta de mañana (07:00–09:00), según el GTFS oficial del DTPM.
        Menos minutos = más frecuencia = menos espera. Las rutas exprés (roja/verde) son las más rápidas.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 14 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 52 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: l.color, flexShrink: 0 }} />
              <strong style={{ fontSize: ".82rem", color: C.ink }}>{l.id}</strong>
            </span>
            <Bar value={max - l.punta_min + 1} max={max + 1} color={l.color} />
            <span style={{ fontWeight: 700, fontSize: ".9rem", color: C.ink, minWidth: 60, textAlign: "right" }}>
              {l.punta_min.toFixed(1)} <span style={{ color: C.faint, fontWeight: 500, fontSize: ".7rem" }}>min</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailBuses({ data }) {
  const maxAvg = Math.max(...data.periodos_bus.map((p) => p.avg));
  return (
    <div>
      <p style={txt.detailLead}>
        Frecuencia de las <strong>{data.rutas_bus}</strong> rutas de buses RED por franja horaria.
        La <em>mediana</em> es más representativa que el promedio. Abajo, las 10 rutas más frecuentes.
      </p>
      <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
        {data.periodos_bus.map((p) => (
          <div key={p.periodo} style={{ display: "grid", gridTemplateColumns: "9rem 1fr auto", alignItems: "center", gap: 14 }}>
            <span>
              <span style={{ fontWeight: 600, fontSize: ".82rem", color: C.ink, display: "block" }}>{p.periodo}</span>
              <span style={{ fontSize: ".68rem", color: C.faint }}>{p.horario}</span>
            </span>
            <Bar value={maxAvg - p.avg + 4} max={maxAvg + 2} color={C.blue} />
            <span style={{ minWidth: 96, textAlign: "right", fontSize: ".8rem" }}>
              <strong style={{ color: C.blue }}>{p.mediana}</strong>
              <span style={{ color: C.faint }}> med · {p.avg} avg</span>
            </span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: ".7rem", fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 10 }}>
        Top 10 rutas más frecuentes (punta AM)
      </div>
      <div style={{ display: "grid", gap: 6 }}>
        {data.top_rutas.map((r, i) => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.4rem 3rem 1fr auto auto", alignItems: "center", gap: 10, padding: "7px 10px", background: C.bg, borderRadius: 10 }}>
            <span style={{ fontSize: ".7rem", color: C.faint, fontWeight: 600 }}>{i + 1}</span>
            <strong style={{ fontSize: ".78rem", color: C.blue }}>{r.id}</strong>
            <span style={{ fontSize: ".8rem", color: C.ink }}>{r.nombre.replace(/^\(M\)\s*/, "")}</span>
            {r.tiene_metro ? <Chip color={C.violet}>Metro</Chip> : <span />}
            <span style={{ fontWeight: 700, fontSize: ".82rem", color: r.freq <= 6 ? C.green : C.amber, minWidth: 54, textAlign: "right" }}>
              {r.freq} <span style={{ color: C.faint, fontWeight: 500, fontSize: ".68rem" }}>min</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSerie({ data }) {
  const serie = data.serie_metro;
  const vals = serie.map((d) => d.m);
  const max = Math.max(...vals), min = Math.min(...vals);
  const [hover, setHover] = useState(null);
  const ultimo = serie[serie.length - 1];
  const maxItem = serie.find((d) => d.m === max);
  return (
    <div>
      <p style={txt.detailLead}>
        Pasajeros mensuales del Metro de Santiago (en millones), publicados por el INE con ~2 meses de rezago.
      </p>
      <div style={{ display: "flex", gap: 28, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { l: "Último dato", v: `${ultimo.m}M`, s: ultimo.mes, c: C.blue },
          { l: "Máximo", v: `${max}M`, s: maxItem?.mes, c: C.green },
          { l: "Tendencia", v: vals[vals.length - 1] > vals[0] ? "↑ al alza" : "↓ a la baja", s: `vs ${serie[0].mes}`, c: C.amber },
        ].map((k) => (
          <div key={k.l}>
            <div style={{ fontSize: ".66rem", color: C.faint, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: k.c, lineHeight: 1.1 }}>{k.v}</div>
            <div style={{ fontSize: ".68rem", color: C.faint }}>{k.s}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 150, position: "relative" }}>
        {serie.map((d, i) => {
          const h = ((d.m - min) / (max - min || 1)) * 80 + 18;
          const isLast = i === serie.length - 1;
          return (
            <div key={d.mes} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", position: "relative", cursor: "default" }}>
              {hover === i && (
                <div style={{ position: "absolute", bottom: "calc(100% + 4px)", background: C.ink, color: "#fff", fontSize: ".66rem", padding: "4px 7px", borderRadius: 6, whiteSpace: "nowrap", zIndex: 5, fontWeight: 500 }}>
                  {d.mes}: {d.m}M
                </div>
              )}
              <div style={{ width: "100%", maxWidth: 22, height: `${h}%`, background: isLast ? C.blue : hover === i ? "#93B4F5" : "#CBD9EE", borderRadius: "5px 5px 0 0", transition: "background .15s" }} />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".66rem", color: C.faint, marginTop: 8 }}>
        <span>{serie[0].mes}</span>
        <span>Barra azul = dato más reciente · pasa el cursor</span>
        <span>{ultimo.mes}</span>
      </div>
    </div>
  );
}

function DetailTarifas() {
  return (
    <div>
      <p style={txt.detailLead}>
        Tarifa integrada: con un pago combinas bus, Metro y tren en hasta 2 transbordos durante 120 minutos.
        Vigentes desde feb. 2026 (Panel de Expertos del Transporte Público).
      </p>
      <div style={{ display: "grid", gap: 6 }}>
        {TARIFAS.map((t) => (
          <div key={t.perfil} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12, padding: "10px 14px", background: t.destacado ? "#EFF4FF" : C.bg, borderRadius: 10, border: t.destacado ? `1px solid ${C.blue}22` : "1px solid transparent" }}>
            <span>
              <strong style={{ fontSize: ".82rem", color: C.ink, display: "block" }}>{t.perfil}</strong>
              <span style={{ fontSize: ".68rem", color: C.faint }}>{t.horario}</span>
            </span>
            <span style={{ fontSize: ".82rem", color: C.muted, textAlign: "right", minWidth: 90 }}>
              <span style={{ color: C.faint, fontSize: ".66rem" }}>bus </span><strong>{t.bus}</strong>
            </span>
            <span style={{ fontSize: ".82rem", color: C.muted, textAlign: "right", minWidth: 100 }}>
              <span style={{ color: C.faint, fontSize: ".66rem" }}>metro </span><strong style={{ color: t.destacado ? C.blue : C.ink }}>{t.metro}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailModal() {
  const max = Math.max(...MODAL.map((m) => m.pct));
  return (
    <div>
      <p style={txt.detailLead}>
        Reparto de los viajes por medio de transporte. Ojo: el 54% es "viajes al trabajo" (Censo INE 2024)
        y el resto son "viajes totales diarios" (CEDEUS 2024); provienen de estudios distintos.
      </p>
      <div style={{ display: "grid", gap: 14 }}>
        {MODAL.map((m) => (
          <div key={m.modo} style={{ display: "grid", gridTemplateColumns: "11rem 1fr auto", alignItems: "center", gap: 14 }}>
            <span>
              <span style={{ fontWeight: 600, fontSize: ".82rem", color: C.ink, display: "block" }}>{m.modo}</span>
              <span style={{ fontSize: ".64rem", color: C.faint }}>{m.nota}</span>
            </span>
            <Bar value={m.pct} max={max} color={m.color} height={11} />
            <strong style={{ minWidth: 56, textAlign: "right", color: m.color, fontSize: ".95rem" }}>{m.pct}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailSeguridad() {
  return (
    <div>
      <p style={txt.detailLead}>
        En 2024 Chile registró la menor cifra histórica de fallecidos en tránsito. (CONASET / Carabineros)
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        {SEGURIDAD.map((s) => (
          <div key={s.l} style={{ padding: 16, background: C.bg, borderRadius: 12 }}>
            <div style={{ fontSize: "1.7rem", fontWeight: 800, color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: ".74rem", color: C.muted, marginTop: 6, lineHeight: 1.4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailRed({ data }) {
  return (
    <div>
      <p style={txt.detailLead}>
        La red de Metro más extensa de Sudamérica: {data.rutas_metro} servicios, 143 estaciones y 149 km.
        Tres nuevas líneas en construcción ampliarán la red a ~225 km hacia 2033.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {EXPANSION.map((e) => (
          <div key={e.l} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "center", padding: "12px 14px", background: C.bg, borderRadius: 12, borderLeft: `4px solid ${e.c}` }}>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: e.c, minWidth: 42 }}>{e.l}</span>
            <span>
              <strong style={{ fontSize: ".85rem", color: C.ink, display: "block" }}>{e.t}</strong>
              <span style={{ fontSize: ".72rem", color: C.faint }}>{e.d}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tarjeta de sección con drill-down ──────────────────────────────────────
function SectionCard({ id, icon, title, metric, unit, sub, accent, open, onToggle, children }) {
  const [hover, setHover] = useState(false);
  return (
    <div id={id}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        gridColumn: open ? "1 / -1" : "auto",
        background: C.card, borderRadius: 16, border: `1px solid ${C.line}`,
        boxShadow: hover || open ? shadowHover : shadow, transition: "box-shadow .2s, transform .2s",
        transform: hover && !open ? "translateY(-2px)" : "none", overflow: "hidden",
      }}>
      <button onClick={onToggle} style={{
        width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer",
        padding: "20px 22px", display: "flex", alignItems: "center", gap: 16, font: "inherit", color: "inherit",
      }}>
        <span style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}15`, display: "grid", placeItems: "center", fontSize: "1.3rem", flexShrink: 0 }}>{icon}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: ".72rem", fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em", display: "block" }}>{title}</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
            <strong style={{ fontSize: "1.6rem", fontWeight: 800, color: accent, lineHeight: 1.1 }}>{metric}</strong>
            {unit && <span style={{ fontSize: ".8rem", color: C.faint }}>{unit}</span>}
          </span>
          <span style={{ fontSize: ".78rem", color: C.muted, display: "block", marginTop: 2 }}>{sub}</span>
        </span>
        <span style={{ fontSize: ".74rem", fontWeight: 600, color: accent, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {open ? "Cerrar" : "Ver detalle"}
          <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
        </span>
      </button>
      {open && (
        <div style={{ padding: "0 22px 24px", borderTop: `1px solid ${C.line}` }}>
          <div style={{ paddingTop: 18 }}>{children}</div>
        </div>
      )}
    </div>
  );
}

// ─── KPI grande de cabecera (clic = abre su sección) ────────────────────────
function HeroKpi({ value, unit, label, accent, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        textAlign: "left", border: `1px solid ${C.line}`, background: C.card, borderRadius: 16,
        padding: "20px 22px", cursor: "pointer", boxShadow: hover ? shadowHover : shadow,
        transform: hover ? "translateY(-3px)" : "none", transition: "all .2s", flex: "1 1 200px", minWidth: 0,
      }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
        <span style={{ fontSize: "2.4rem", fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: "-.02em" }}>{value}</span>
        {unit && <span style={{ fontSize: "1rem", fontWeight: 700, color: accent }}>{unit}</span>}
      </div>
      <div style={{ fontSize: ".82rem", color: C.muted, marginTop: 8, lineHeight: 1.4 }}>{label}</div>
      <div style={{ fontSize: ".7rem", color: accent, fontWeight: 600, marginTop: 10 }}>Ver detalle ↓</div>
    </button>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function SantiagoDashboard({ onBack }) {
  const [data, setData] = useState(null);
  const [src, setSrc] = useState("demo");
  const [open, setOpen] = useState(null);
  const sectionsRef = useRef(null);

  useEffect(() => {
    fetch(DATA_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((d) => { setData(d); setSrc("live"); })
      .catch(() => { setData(DEMO_DATA); setSrc("demo"); });
  }, []);

  const goTo = (id) => {
    setOpen(id);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };
  const toggle = (id) => setOpen((o) => (o === id ? null : id));

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: C.faint, fontSize: ".9rem" }}>
      Cargando datos…
    </div>
  );

  const mejorMetro = Math.min(...data.metro_lines.map((l) => l.punta_min));
  const ultimoMetro = data.serie_metro[data.serie_metro.length - 1];
  const fecha = data.generado_en
    ? new Date(data.generado_en).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink }}>
      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,249,252,.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button onClick={onBack} style={{
            border: `1px solid ${C.line}`, background: C.card, color: C.muted, cursor: "pointer",
            borderRadius: 999, padding: "5px 12px", fontSize: ".74rem", fontWeight: 600, fontFamily: "inherit",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>← Mundo de Estadísticas</button>
          <strong style={{ fontSize: ".95rem", fontWeight: 800, marginRight: "auto" }}>
            Santiago <span style={{ color: C.blue }}>en movimiento</span>
          </strong>
          <Chip color={src === "live" ? C.green : C.amber} bg={src === "live" ? "#E7F8F0" : "#FEF6E7"}>
            {src === "live" ? "● Datos en vivo" : "● Modo demostración"}
          </Chip>
          <span style={{ fontSize: ".72rem", color: C.faint }}>Actualizado: {fecha}</span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 24px 12px" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 14 }}>
          El transporte público de Santiago en datos
        </div>
        <h1 style={{ fontSize: "clamp(2.2rem, 5.5vw, 3.9rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-.03em", maxWidth: 940 }}>
          Cómo se mueve la capital, <span style={{ color: C.blue }}>con datos abiertos</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: C.muted, maxWidth: 760, marginTop: 20, lineHeight: 1.6 }}>
          Más de 5 millones de viajes al día. Explora las cifras clave del Metro, los buses RED y la movilidad —
          haz clic en cualquier dato para profundizar.
        </p>

        {/* KPIs grandes */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 36 }}>
          <HeroKpi value="660" unit="M" label="Viajes en Metro durante 2025" accent={C.blue} onClick={() => goTo("sec-serie")} />
          <HeroKpi value="54" unit="%" label="Usa transporte público para ir al trabajo" accent={C.green} onClick={() => goTo("sec-modal")} />
          <HeroKpi value={data.rutas_bus} label="Rutas de buses RED en operación" accent={C.violet} onClick={() => goTo("sec-buses")} />
          <HeroKpi value={mejorMetro.toFixed(1)} unit="min" label="Mejor frecuencia de Metro en hora punta" accent={C.amber} onClick={() => goTo("sec-metro")} />
        </div>
      </section>

      {/* SECCIONES DRILL-DOWN */}
      <section ref={sectionsRef} style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 16px" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 600, color: C.faint, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 16 }}>
          Explora los datos
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, alignItems: "start" }}>
          <SectionCard id="sec-metro" icon="🚇" title="Metro · frecuencia" metric={mejorMetro.toFixed(1)} unit="min (mejor línea)" sub="Tiempo entre trenes en hora punta, por línea" accent={C.red} open={open === "sec-metro"} onToggle={() => toggle("sec-metro")}>
            <DetailMetro data={data} />
          </SectionCard>

          <SectionCard id="sec-buses" icon="🚌" title="Buses RED · frecuencia" metric={data.rutas_bus} unit="rutas" sub="Frecuencia por franja horaria y top de rutas" accent={C.blue} open={open === "sec-buses"} onToggle={() => toggle("sec-buses")}>
            <DetailBuses data={data} />
          </SectionCard>

          <SectionCard id="sec-serie" icon="📈" title="Pasajeros del Metro" metric={`${ultimoMetro.m}M`} unit={ultimoMetro.mes} sub="Serie mensual de pasajeros (INE)" accent={C.green} open={open === "sec-serie"} onToggle={() => toggle("sec-serie")}>
            <DetailSerie data={data} />
          </SectionCard>

          <SectionCard id="sec-modal" icon="🧭" title="Cómo se mueve Santiago" metric="54" unit="% en transp. público" sub="Reparto de viajes por medio de transporte" accent={C.violet} open={open === "sec-modal"} onToggle={() => toggle("sec-modal")}>
            <DetailModal />
          </SectionCard>

          <SectionCard id="sec-tarifas" icon="🎫" title="Tarifas vigentes" metric="$895" unit="adulto punta" sub="Bus, Metro y tren con tarifa integrada" accent={C.amber} open={open === "sec-tarifas"} onToggle={() => toggle("sec-tarifas")}>
            <DetailTarifas />
          </SectionCard>

          <SectionCard id="sec-red" icon="🛤️" title="Red y expansión" metric="149" unit="km · 143 estaciones" sub="3 nuevas líneas en construcción" accent={C.cyan} open={open === "sec-red"} onToggle={() => toggle("sec-red")}>
            <DetailRed data={data} />
          </SectionCard>

          <SectionCard id="sec-seguridad" icon="🛡️" title="Seguridad vial" metric="−12" unit="% fallecidos vs 2023" sub="Menor cifra histórica de víctimas (2024)" accent={C.green} open={open === "sec-seguridad"} onToggle={() => toggle("sec-seguridad")}>
            <DetailSeguridad />
          </SectionCard>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 56px" }}>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, fontSize: ".72rem", color: C.faint, lineHeight: 1.8 }}>
          <strong style={{ color: C.muted }}>Fuentes:</strong> INE (Censo 2024, boletín mensual de Metro) · DTPM / Red Movilidad (GTFS {data.gtfs_version}, tarifas) ·
          Metro de Santiago (Memoria 2025) · CEDEUS (Encuesta de Movilidad 2024) · CONASET (siniestralidad 2024) · Panel de Expertos del Transporte Público.<br />
          Datos de frecuencia: programados según GTFS, no en tiempo real.
        </div>
      </footer>
    </div>
  );
}
