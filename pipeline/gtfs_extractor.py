"""
Extractor GTFS — Red Metropolitana de Movilidad, Santiago de Chile
Descarga el GTFS vigente, lo procesa y genera data.json para el frontend.

Fuentes:
  - GTFS: github.com/vargabst/gtfs-santiago-analytics (espejo del DTPM)
  - INE Metro: datos hard-codeados (actualizar manualmente cada mes)
"""

import requests, zipfile, io, csv, json, os, hashlib, sys
from datetime import datetime, timezone
from collections import defaultdict

# Forzar salida UTF-8: en consolas Windows (cp1252) los caracteres como ✓
# provocan UnicodeEncodeError. En VSCode y GitHub Actions ya es UTF-8.
try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

# ── Configuración ──────────────────────────────────────────────────────────
GTFS_URL = "https://github.com/vargabst/gtfs-santiago-analytics/raw/main/GTFS_20251206.zip"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "output", "data.json")
STATE_PATH  = os.path.join(os.path.dirname(__file__), "output", ".gtfs_state.json")

# Serie mensual INE — actualizar manualmente al publicarse cada boletín
# Fuente: ine.gob.cl → Sala de Prensa → "Personas transportadas por Metro"
SERIE_INE = [
    {"mes": "Ene 2024", "m": 48.2},
    {"mes": "Feb 2024", "m": 45.1},
    {"mes": "Mar 2024", "m": 52.3},
    {"mes": "Abr 2024", "m": 51.0},
    {"mes": "May 2024", "m": 53.4},
    {"mes": "Jun 2024", "m": 52.1},
    {"mes": "Jul 2024", "m": 50.8},
    {"mes": "Ago 2024", "m": 53.9},
    {"mes": "Sep 2024", "m": 54.2},
    {"mes": "Oct 2024", "m": 55.8},
    {"mes": "Nov 2024", "m": 56.9},
    {"mes": "Dic 2024", "m": 51.3},
    {"mes": "Ene 2025", "m": 50.1},
    {"mes": "Feb 2025", "m": 47.8},
    {"mes": "Mar 2025", "m": 55.2},
    {"mes": "Abr 2025", "m": 54.6},
    {"mes": "May 2025", "m": 57.1},
    {"mes": "Jun 2025", "m": 55.9},
    {"mes": "Jul 2025", "m": 53.4},
    {"mes": "Ago 2025", "m": 56.3},
    {"mes": "Sep 2025", "m": 57.0},
    {"mes": "Oct 2025", "m": 62.2},
    {"mes": "Nov 2025", "m": 57.7},
    # ← AGREGAR AQUÍ cuando el INE publique nuevos datos
    # {"mes": "Dic 2025", "m": XX.X},
]

# ── Descarga y checksum ────────────────────────────────────────────────────

def load_state():
    if os.path.exists(STATE_PATH):
        with open(STATE_PATH) as f:
            return json.load(f)
    return {}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_PATH), exist_ok=True)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f)

def download_gtfs():
    print(f"[{now()}] Descargando GTFS desde {GTFS_URL} ...")
    r = requests.get(GTFS_URL, timeout=60)
    r.raise_for_status()
    checksum = hashlib.md5(r.content).hexdigest()
    print(f"[{now()}] Descargado: {len(r.content)/1024:.0f} KB · MD5: {checksum}")
    return r.content, checksum

def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

# ── Procesamiento GTFS ─────────────────────────────────────────────────────

def parse_csv(z, filename, encoding="utf-8-sig"):
    with z.open(filename) as f:
        return list(csv.DictReader(io.TextIOWrapper(f, encoding=encoding)))

def process_gtfs(content):
    z = zipfile.ZipFile(io.BytesIO(content))

    # Feed info
    feed_info = parse_csv(z, "feed_info.txt")[0]
    version   = feed_info["feed_version"]
    start     = feed_info["feed_start_date"]
    end       = feed_info["feed_end_date"]

    # Rutas
    routes = {r["route_id"]: r for r in parse_csv(z, "routes.txt")}

    # Trips → route_id
    trips = {r["trip_id"]: r["route_id"] for r in parse_csv(z, "trips.txt")}

    # Paradas
    stops = parse_csv(z, "stops.txt")
    paradas_total = len(stops)

    # Frecuencias
    freqs = parse_csv(z, "frequencies.txt")

    # Conteos por agencia
    by_agency = defaultdict(set)
    for rid, r in routes.items():
        by_agency[r["agency_id"]].add(rid)

    # ── Frecuencias Metro por línea ──
    metro_routes = {rid: r for rid, r in routes.items() if r["agency_id"] == "M"}
    route_headways = defaultdict(list)
    for fr in freqs:
        rid = trips.get(fr["trip_id"])
        if rid:
            route_headways[rid].append({
                "start": fr["start_time"],
                "end":   fr["end_time"],
                "hw":    int(fr["headway_secs"]),
            })

    def avg_punta(rid):
        hw_punta = [e["hw"] for e in route_headways.get(rid, [])
                    if "07:00" <= e["start"] < "09:00"]
        return round(sum(hw_punta) / len(hw_punta) / 60, 1) if hw_punta else None

    metro_lines = []
    for rid, r in sorted(metro_routes.items(), key=lambda x: x[0]):
        ap = avg_punta(rid)
        if ap is not None:
            metro_lines.append({
                "id":        r["route_short_name"],
                "nombre":    r["route_long_name"],
                "punta_min": ap,
                "color":     f"#{r.get('route_color','888888')}",
            })

    # ── Frecuencias buses RED por período ──
    periodos = {
        "madrugada": ("05:00", "07:00"),
        "punta_am":  ("07:00", "09:00"),
        "valle":     ("09:00", "18:00"),
        "punta_pm":  ("18:00", "20:00"),
        "nocturno":  ("20:00", "23:30"),
    }
    LABELS = {
        "madrugada": ("Madrugada", "05:00–07:00"),
        "punta_am":  ("Punta AM",  "07:00–09:00"),
        "valle":     ("Valle",     "09:00–18:00"),
        "punta_pm":  ("Punta PM",  "18:00–20:00"),
        "nocturno":  ("Nocturno",  "20:00–23:30"),
    }

    periodos_bus = []
    for key, (t0, t1) in periodos.items():
        hws = [int(fr["headway_secs"]) / 60
               for fr in freqs
               if routes.get(trips.get(fr["trip_id"]), {}).get("agency_id") == "RM"
               and t0 <= fr["start_time"] < t1]
        if hws:
            hws_sorted = sorted(hws)
            label, horario = LABELS[key]
            periodos_bus.append({
                "periodo": label,
                "horario": horario,
                "avg":     round(sum(hws) / len(hws), 1),
                "mediana": round(hws_sorted[len(hws_sorted) // 2], 1),
                "n":       len(hws),
            })

    # ── Top 10 rutas más frecuentes en hora punta AM ──
    ruta_hw_punta = defaultdict(list)
    for fr in freqs:
        rid = trips.get(fr["trip_id"])
        if rid and routes.get(rid, {}).get("agency_id") == "RM":
            if "07:00" <= fr["start_time"] < "09:00":
                ruta_hw_punta[rid].append(int(fr["headway_secs"]) / 60)

    ruta_avg = [
        (rid, round(sum(v) / len(v), 1))
        for rid, v in ruta_hw_punta.items()
    ]
    ruta_avg.sort(key=lambda x: x[1])

    top_rutas = []
    for rid, avg in ruta_avg[:10]:
        r = routes[rid]
        top_rutas.append({
            "id":          r["route_short_name"],
            "nombre":      r["route_long_name"],
            "freq":        avg,
            "tiene_metro": r["route_long_name"].startswith("(M)"),
        })

    return {
        "gtfs_version":   version,
        "gtfs_start":     start,
        "gtfs_end":       end,
        "rutas_bus":      len(by_agency.get("RM", [])),
        "rutas_metro":    len(metro_lines),
        "paradas_total":  paradas_total,
        "metro_lines":    metro_lines,
        "periodos_bus":   periodos_bus,
        "top_rutas":      top_rutas,
        "serie_metro":    SERIE_INE,
        "generado_en":    now(),
    }

# ── Runner principal ───────────────────────────────────────────────────────

def run():
    print(f"\n{'='*60}")
    print(f"[{now()}] Pipeline GTFS — iniciando")

    state = load_state()
    content, checksum = download_gtfs()

    # Si el archivo no cambió, salir
    if state.get("last_checksum") == checksum:
        print(f"[{now()}] GTFS sin cambios (MD5 idéntico). Nada que hacer.")
        return False

    print(f"[{now()}] GTFS actualizado. Procesando...")
    data = process_gtfs(content)

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    save_state({"last_checksum": checksum, "last_run": now(), "version": data["gtfs_version"]})

    print(f"[{now()}] ✓ data.json generado: {data['gtfs_version']}")
    print(f"  Rutas bus: {data['rutas_bus']} | Metro: {data['rutas_metro']} | Paradas: {data['paradas_total']}")
    return True

if __name__ == "__main__":
    run()
