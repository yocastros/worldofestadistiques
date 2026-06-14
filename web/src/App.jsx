import { useState, useEffect } from "react";
import { C, shadow, shadowHover } from "./theme.js";
import SantiagoDashboard from "./SantiagoDashboard.jsx";

// ─── Catálogo de estadísticas (escalable: añade países/ciudades aquí) ────────
// Cada ciudad "activa" con `route` abre su dashboard. Las demás salen como
// "Próximamente". Para sumar un país nuevo, añade otro objeto al array.
const PAISES = [
  {
    pais: "Chile",
    bandera: "🇨🇱",
    ciudades: [
      { nombre: "Santiago", tema: "Transporte público", emoji: "🚇", kpi: "660M", kpiLabel: "viajes en Metro (2025)", accent: C.blue, route: "#/santiago" },
      { nombre: "Valparaíso", tema: "Próximamente", emoji: "⚓", accent: C.cyan },
      { nombre: "Concepción", tema: "Próximamente", emoji: "🌆", accent: C.violet },
      { nombre: "Antofagasta", tema: "Próximamente", emoji: "🏜️", accent: C.amber },
    ],
  },
];

// ─── Enrutado por hash (#/...): ideal para hosting estático como cPanel ──────
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

// ─── Caja de ciudad ──────────────────────────────────────────────────────────
function CityCard({ ciudad, onOpen }) {
  const [hover, setHover] = useState(false);
  const activa = !!ciudad.route;
  const a = ciudad.accent;
  return (
    <button
      onClick={() => activa && onOpen(ciudad.route)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={!activa}
      style={{
        textAlign: "left", borderRadius: 18, padding: "22px 22px 20px",
        cursor: activa ? "pointer" : "default", fontFamily: "inherit",
        position: "relative", overflow: "hidden", transition: "all .2s",
        border: activa ? `1.5px solid ${a}55` : `1px solid ${C.line}`,
        background: activa ? `linear-gradient(180deg, #FFFFFF 0%, ${a}0D 100%)` : "#FBFCFE",
        boxShadow: activa ? (hover ? `0 18px 40px ${a}40` : `0 8px 24px ${a}26`) : shadow,
        transform: activa && hover ? "translateY(-5px)" : "none",
        opacity: activa ? 1 : 0.65,
      }}>
      {activa && <span style={{ position: "absolute", top: 0, left: 0, right: 0, height: 6, background: a }} />}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, marginTop: activa ? 6 : 0 }}>
        <span style={{ width: 48, height: 48, borderRadius: 13, background: activa ? a : `${a}15`, display: "grid", placeItems: "center", fontSize: "1.45rem", boxShadow: activa ? `0 6px 14px ${a}55` : "none" }}>{ciudad.emoji}</span>
        {activa
          ? <span style={{ fontSize: ".64rem", fontWeight: 800, color: "#fff", background: a, padding: ".28rem .65rem", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".06em" }}>● Disponible</span>
          : <span style={{ fontSize: ".62rem", fontWeight: 700, color: C.faint, background: "#EEF2F8", padding: ".2rem .55rem", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".05em" }}>Próximamente</span>}
      </div>
      <div style={{ fontSize: activa ? "1.4rem" : "1.15rem", fontWeight: 800, color: C.ink }}>{ciudad.nombre}</div>
      <div style={{ fontSize: ".82rem", color: activa ? C.muted : C.faint, marginTop: 2 }}>{ciudad.tema}</div>

      {activa && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${a}22`, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
          <span>
            <span style={{ fontSize: "1.8rem", fontWeight: 900, color: a, lineHeight: 1 }}>{ciudad.kpi}</span>
            <span style={{ display: "block", fontSize: ".68rem", color: C.faint, marginTop: 2 }}>{ciudad.kpiLabel}</span>
          </span>
          <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#fff", background: a, padding: ".45rem .85rem", borderRadius: 999, whiteSpace: "nowrap", boxShadow: `0 4px 12px ${a}50` }}>Explorar →</span>
        </div>
      )}
    </button>
  );
}

// ─── Portada del portal ──────────────────────────────────────────────────────
function Portal({ onOpen }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink }}>
      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,249,252,.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.15rem" }}>📊</span>
          <strong style={{ fontSize: ".98rem", fontWeight: 800, marginRight: "auto" }}>
            Mundo de <span style={{ color: C.blue }}>Estadísticas</span>
          </strong>
          <span style={{ fontSize: ".72rem", color: C.faint }}>Datos abiertos, explicados</span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 24px 20px" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16 }}>
          Estadísticas claras, de fuentes oficiales
        </div>
        <h1 style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", fontWeight: 900, lineHeight: 1.04, letterSpacing: "-.03em", maxWidth: 1000 }}>
          El mundo, contado <span style={{ color: C.blue }}>con datos</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: C.muted, maxWidth: 760, marginTop: 20, lineHeight: 1.6 }}>
          Paneles interactivos de datos abiertos. Empezamos por <strong style={{ color: C.ink }}>Chile</strong> y sus
          principales ciudades; iremos sumando más países, comenzando por sus capitales.
        </p>
      </section>

      {/* PAÍSES Y CIUDADES */}
      {PAISES.map((p) => (
        <section key={p.pais} style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <span style={{ fontSize: "1.5rem" }}>{p.bandera}</span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>{p.pais}</h2>
            <span style={{ fontSize: ".72rem", color: C.faint }}>· {p.ciudades.filter((c) => c.route).length} disponible(s)</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {p.ciudades.map((c) => <CityCard key={c.nombre} ciudad={c} onOpen={onOpen} />)}
          </div>
        </section>
      ))}

      {/* PRÓXIMOS PAÍSES */}
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 24px 8px" }}>
        <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 16, padding: "22px 24px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ fontSize: "1.4rem" }}>🌎</span>
          <span style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ fontSize: ".92rem", color: C.ink, display: "block" }}>Más países en camino</strong>
            <span style={{ fontSize: ".8rem", color: C.muted }}>Tras Chile, iremos lanzando nuevos países empezando por sus capitales.</span>
          </span>
          <span style={{ fontSize: ".7rem", fontWeight: 700, color: C.faint, background: "#EEF2F8", padding: ".3rem .7rem", borderRadius: 999 }}>PRÓXIMAMENTE</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 24px 56px" }}>
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 20, fontSize: ".72rem", color: C.faint, lineHeight: 1.8 }}>
          <strong style={{ color: C.muted }}>Mundo de Estadísticas</strong> — paneles de datos abiertos de fuentes oficiales.
          Cada panel indica sus fuentes y la fecha de actualización.
        </div>
      </footer>
    </div>
  );
}

// ─── App: decide qué vista mostrar según el hash ────────────────────────────
export default function App() {
  const hash = useHashRoute();
  const go = (h) => { window.location.hash = h; };

  useEffect(() => { window.scrollTo(0, 0); }, [hash]);

  if (hash.startsWith("#/santiago")) {
    return <SantiagoDashboard onBack={() => go("#/")} />;
  }
  return <Portal onOpen={go} />;
}
