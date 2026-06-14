# Pipeline de datos — Santiago en Movimiento

Sistema automático de actualización de datos de transporte público de Santiago.

## Arquitectura

```
DTPM (GTFS)              INE (boletín PDF)
     │                          │
     ▼                          ▼ (manual, ~mensual)
GitHub Actions            gtfs_extractor.py
(cron lunes 06h UTC)             │
     │                           │
     ▼                           ▼
gtfs_extractor.py  ───────► data.json (en /output)
     │                           │
     ▼                           ▼
git commit + push       Frontend (React/HTML)
al mismo repo           consume data.json vía
                        fetch() en raw.githubusercontent.com
```

## Frecuencia de actualización

| Dato | Fuente | Frecuencia pipeline | Cómo se actualiza |
|---|---|---|---|
| Rutas, frecuencias, paradas | GTFS DTPM | Cada lunes, automático | Pipeline detecta cambio por MD5 |
| Pasajeros Metro mensual | INE Sala de Prensa | Mensual, manual | Editar array `SERIE_INE` en `gtfs_extractor.py` |
| Tarifas | Panel de Expertos / DTPM | Cuando cambian | Editar HTML principal |

## Archivos

```
pipeline/
├── gtfs_extractor.py          # Script principal de extracción
├── output/
│   ├── data.json              # Datos procesados (consumido por el frontend)
│   └── .gtfs_state.json       # Estado: checksum y versión del último GTFS
├── .github/
│   └── workflows/
│       └── update_gtfs.yml    # Workflow de GitHub Actions
└── README.md
```

## Cómo ejecutar manualmente

```bash
pip install requests
python pipeline/gtfs_extractor.py
```

## Cómo el frontend consume los datos

```js
const DATA_URL = "https://raw.githubusercontent.com/TU_ORG/TU_REPO/main/pipeline/output/data.json";

useEffect(() => {
  fetch(DATA_URL)
    .then(r => r.json())
    .then(data => setGtfsData(data));
}, []);
```

## Agregar nuevo mes de pasajeros Metro (INE)

1. Ir a [ine.gob.cl → Sala de Prensa](https://www.ine.gob.cl/sala-de-prensa)
2. Buscar: "personas transportadas por Metro de Santiago"
3. Copiar el número de millones del título del comunicado
4. En `gtfs_extractor.py`, agregar al final de `SERIE_INE`:
   ```python
   {"mes": "Ene 2026", "m": 52.3},  # ← ejemplo
   ```
5. Hacer commit → el pipeline tomará el nuevo valor

## Limitaciones conocidas

- **El GTFS refleja el programa de operación planificado**, no posiciones en tiempo real.
  Para tiempo real se requiere acceso formal a la API del DTPM (requiere IP fija y convenio).
- **La URL del GTFS** apunta a un repositorio espejo en GitHub. Si el DTPM actualiza
  su GTFS con una nueva URL o nombre de archivo, hay que actualizar `GTFS_URL` en el script.
- **INE Metro**: publicado ~2 meses después del período. No es automatizable sin scraping
  del PDF/HTML del INE (que puede cambiar de formato).
