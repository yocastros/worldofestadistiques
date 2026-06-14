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
  return (
    <button
      onClick={() => activa && onOpen(ciudad.route)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={!activa}
      style={{
        textAlign: "left", border: `1px solid ${C.line}`, borderRadius: 16,
        background: activa ? C.card : "#FBFCFE", padding: "22px 22px 20px",
        cursor: activa ? "pointer" : "default", fontFamily: "inherit",
        boxShadow: activa && hover ? shadowHover : shadow,
        transform: activa && hover ? "translateY(-3px)" : "none",
        transition: "all .2s", opacity: activa ? 1 : 0.72, position: "relative",
      }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ width: 46, height: 46, borderRadius: 12, background: `${ciudad.accent}15`, display: "grid", placeItems: "center", fontSize: "1.4rem" }}>{ciudad.emoji}</span>
        {!activa && (
          <span style={{ fontSize: ".62rem", fontWeight: 700, color: C.faint, background: "#EEF2F8", padding: ".2rem .55rem", borderRadius: 999, textTransform: "uppercase", letterSpacing: ".05em" }}>Próximamente</span>
        )}
      </div>
      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: C.ink }}>{ciudad.nombre}</div>
      <div style={{ fontSize: ".82rem", color: C.muted, marginTop: 2 }}>{ciudad.tema}</div>

      {activa && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.line}`, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <span>
            <span style={{ fontSize: "1.6rem", fontWeight: 900, color: ciudad.accent, lineHeight: 1 }}>{ciudad.kpi}</span>
            <span style={{ display: "block", fontSize: ".68rem", color: C.faint, marginTop: 2 }}>{ciudad.kpiLabel}</span>
          </span>
          <span style={{ fontSize: ".78rem", fontWeight: 600, color: ciudad.accent }}>Explorar →</span>
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
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "1.15rem" }}>📊</span>
          <strong style={{ fontSize: ".98rem", fontWeight: 800, marginRight: "auto" }}>
            Mundo de <span style={{ color: C.blue }}>Estadísticas</span>
          </strong>
          <span style={{ fontSize: ".72rem", color: C.faint }}>Datos abiertos, explicados</span>
        </div>
      </header>

      {/* HERO */}
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "56px 24px 20px" }}>
        <div style={{ fontSize: ".74rem", fontWeight: 600, color: C.blue, textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16 }}>
          Estadísticas claras, de fuentes oficiales
        </div>
        <h1 style={{ fontSize: "clamp(2.1rem, 5.5vw, 3.6rem)", fontWeight: 900, lineHeight: 1.05, letterSpacing: "-.03em", maxWidth: 760 }}>
          El mundo, contado <span style={{ color: C.blue }}>con datos</span>
        </h1>
        <p style={{ fontSize: "1.05rem", color: C.muted, maxWidth: 600, marginTop: 18, lineHeight: 1.6 }}>
          Paneles interactivos de datos abiertos. Empezamos por <strong style={{ color: C.ink }}>Chile</strong> y sus
          principales ciudades; iremos sumando más países, comenzando por sus capitales.
        </p>
      </section>

      {/* PAÍSES Y CIUDADES */}
      {PAISES.map((p) => (
        <section key={p.pais} style={{ maxWidth: 1080, margin: "0 auto", padding: "16px 24px 8px" }}>
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
      <section style={{ maxWidth: 1080, margin: "0 auto", padding: "28px 24px 8px" }}>
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
      <footer style={{ maxWidth: 1080, margin: "0 auto", padding: "40px 24px 56px" }}>
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
