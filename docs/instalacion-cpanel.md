# Instalación del sitio en cPanel — paso a paso

Guía para publicar **Mundo de Estadísticas** en un hosting con cPanel y un dominio real.

> **Idea clave:** el sitio es **estático** (HTML + CSS + JS ya compilados). cPanel solo
> tiene que *servir archivos*; **no** necesita Node ni Python instalados en el servidor.
> Los datos del panel de Santiago se leen en vivo desde GitHub, así que **no hay base de
> datos que configurar**.

---

## Resumen en 3 frases

1. En tu ordenador generas la versión publicable con `npm run build` → carpeta `web/dist/`.
2. Subes **el contenido** de `web/dist/` a `public_html` en cPanel.
3. Activas el certificado SSL y listo: el dominio ya muestra la web.

---

## Requisitos previos

- **Node.js** instalado en tu ordenador (ya lo tienes). Comprobar: `node --version`.
- Acceso a **cPanel** (usuario y contraseña que te dio tu proveedor de hosting).
- Un **dominio** apuntando a ese hosting (DNS ya propagado).

---

## Paso 1 — Generar la versión publicable (build)

En la terminal de VSCode, dentro del proyecto:

```bash
cd web
npm install        # solo la primera vez (descarga dependencias)
npm run build
```

Al terminar tendrás la carpeta **`web/dist/`** con algo así:

```
web/dist/
├── index.html
└── assets/
    └── index-XXXXXXXX.js
```

> ⚠️ **Lo que se sube a cPanel es el CONTENIDO de `dist/`** (el `index.html` y la carpeta
> `assets/`), **no** la carpeta `dist` en sí.

---

## Paso 2 — Comprimir para subir más rápido (recomendado)

Subir un solo `.zip` es mucho más rápido que subir archivos sueltos.

1. Abre la carpeta `web/dist/`.
2. Selecciona **todo lo que hay dentro** (el `index.html` y la carpeta `assets/`).
3. Clic derecho → **Enviar a → Carpeta comprimida (en zip)**.
4. Nómbralo, por ejemplo, `sitio.zip`.

> Importante: entra *dentro* de `dist` y comprime su contenido. Si comprimes la carpeta
> `dist` entera, luego los archivos quedarán dentro de una subcarpeta y la web no cargará.

---

## Paso 3 — Subir a cPanel con el Administrador de archivos

1. Entra en **cPanel**.
2. Sección **Archivos → Administrador de archivos**.
3. Abre la carpeta **`public_html`** (es la raíz pública de tu dominio principal).
4. *(Opcional)* Si hay un `index.html` o `default.html` de ejemplo del hosting, bórralo.
5. Pulsa **Cargar** (Upload) arriba y selecciona tu `sitio.zip`.
6. Cuando termine la subida, vuelve a `public_html`.
7. Clic derecho sobre `sitio.zip` → **Extraer** (Extract).
8. Comprueba que **`index.html` ha quedado directamente dentro de `public_html`**
   (no dentro de una subcarpeta como `public_html/dist/`).
9. Borra el `sitio.zip` para no dejar basura.

### Alternativa: subir por FTP (FileZilla)

Si prefieres FTP:

- **Servidor:** `ftp.tudominio.com` (o el host que indique tu proveedor)
- **Usuario / contraseña:** los de tu cuenta de cPanel/FTP
- **Puerto:** 21
- Arrastra **el contenido** de `web/dist/` a la carpeta `public_html`.

---

## Paso 4 — ¿Dominio principal o subdominio?

- **Dominio principal** (`tudominio.com`): sube a `public_html` (lo anterior).
- **Subdominio** (`datos.tudominio.com`):
  1. cPanel → **Dominios → Crear un subdominio**.
  2. Apunta su *Document Root* a una carpeta (p. ej. `public_html/datos`).
  3. Sube ahí el contenido de `dist/` en lugar de en `public_html`.

> El sitio usa rutas **relativas**, así que funciona igual en la raíz del dominio o en una
> subcarpeta, sin cambiar nada.

---

## Paso 5 — Activar HTTPS (certificado SSL)

1. cPanel → **Seguridad → SSL/TLS Status** (o "Estado de SSL/TLS").
2. Selecciona tu dominio y pulsa **Run AutoSSL** (Ejecutar AutoSSL). Es gratuito.
3. Espera unos minutos a que emita el certificado (Let's Encrypt).
4. *(Recomendado)* Fuerza HTTPS: muchos cPanel tienen un botón **"Force HTTPS Redirect"**
   en *Dominios*. Si no, usa el `.htaccess` del paso opcional.

---

## Paso 6 — Comprobar que funciona

Abre en el navegador:

- `https://tudominio.com` → debe verse la **portada "Mundo de Estadísticas"**.
- Haz clic en la caja de **Santiago** → se abre su panel (la URL pasará a
  `https://tudominio.com/#/santiago`).
- En el panel de Santiago, arriba debe verse el indicador verde **"● Datos en vivo"**.
  Eso confirma que está leyendo el `data.json` desde GitHub correctamente.

---

## Actualizar el sitio más adelante

- **Si cambian los DATOS** (pasajeros, frecuencias…): **no tienes que hacer nada**. El panel
  los lee en vivo desde GitHub cada vez que alguien entra.
- **Si cambias el CÓDIGO o el diseño:** vuelve a compilar y re-subir:
  ```bash
  cd web
  npm run build
  ```
  Luego repite el Paso 2 y 3 (comprimir `dist/` y subir/extraer en `public_html`,
  sobrescribiendo los archivos anteriores).

---

## (Opcional) `.htaccess` para rendimiento y HTTPS

Crea un archivo llamado **`.htaccess`** dentro de `public_html` con este contenido para
activar compresión, caché de archivos y forzar HTTPS:

```apache
# Forzar HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]

# Compresión GZIP
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json image/svg+xml
</IfModule>

# Caché del navegador para los assets (llevan hash en el nombre, son seguros de cachear)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
  # El HTML no se cachea, para que siempre cargue la última versión
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

> El sitio usa navegación por `#` (hash), así que **no necesita reglas de reescritura** para
> que funcionen las rutas internas como `/#/santiago`. El `.htaccess` de arriba es solo para
> optimizar; sin él, la web también funciona.

---

## Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| Página en blanco | El navegador no encuentra `assets/` | Asegúrate de que `index.html` y la carpeta `assets/` están **directamente** en `public_html` (no dentro de `dist/`). |
| Error 404 en los archivos `.js` | Subiste la carpeta `dist` en vez de su contenido | Re-sube **el contenido** de `dist/`. |
| El panel dice "Modo demostración" | No pudo leer el `data.json` de GitHub | Verifica que el repositorio sigue siendo **público** y que hay conexión a internet. |
| Sale el candado roto / "no seguro" | Falta el certificado SSL | Ejecuta AutoSSL (Paso 5) y espera unos minutos. |
| Veo la web antigua tras actualizar | Caché del navegador | Recarga con `Ctrl + F5`. |

---

## Qué NO hay que subir a cPanel

Solo se sube el contenido de `web/dist/`. **No** subas estas carpetas (son para el
desarrollo y la automatización, no para el hosting):

- `pipeline/` (el extractor de datos en Python — corre en GitHub, no en cPanel)
- `.github/` (la automatización — corre en GitHub)
- `web/node_modules/`, `web/src/`, `web/package.json`, etc. (código fuente y dependencias)
