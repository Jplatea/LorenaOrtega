# Despliegue (sin Lovable)

App TanStack Start (SSR con Nitro). Se puede desplegar en Vercel, Netlify,
Cloudflare o un VPS. La pieza clave es el **preset de Nitro** según el destino.

> La config de build viene de `@lovable.dev/vite-tanstack-config` (en `vite.config.ts`),
> que usa **Cloudflare** como destino por defecto. Para desplegar en otro sitio,
> se ajusta el preset de Nitro con la variable de entorno `NITRO_PRESET` en el build.

## Variables de entorno (en TODOS los destinos)

Configura en el panel del hosting (NO en el repo):

    SUPABASE_URL=...
    SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
    SUPABASE_SERVICE_ROLE_KEY=sb_secret_...      # SECRETA — solo servidor
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...

La `SERVICE_ROLE_KEY` es imprescindible para las funciones de servidor (crear
pacientes, resetear contraseñas). Nunca la pongas en el `.env` versionado.

---

## Opción A — Vercel (recomendada, la más simple)

1. Sube el repo a GitHub (ver README).
2. En https://vercel.com → **New Project** → importa el repo.
3. Build command: `npm run build` · Output: lo detecta Nitro.
4. Environment Variables: añade las de arriba, y **`NITRO_PRESET=vercel`**.
5. Deploy.

## Opción B — Netlify

1. https://app.netlify.com → **Add new site** → importa el repo.
2. Build: `npm run build`.
3. Environment: las variables de arriba + **`NITRO_PRESET=netlify`**.
4. Deploy.

## Opción C — Cloudflare Pages

Es el destino por defecto de la config, así que no hace falta `NITRO_PRESET`.
1. Cloudflare → **Workers & Pages** → conecta el repo.
2. Build: `npm run build`.
3. Variables de entorno como arriba.

## Opción D — VPS propio (máxima independencia)

    npm ci
    npm run build
    node .output/server/index.mjs   # el arranque exacto depende del preset "node-server"

Usa `NITRO_PRESET=node-server` en el build y sirve `.output/` con un proceso
gestionado (pm2, systemd) detrás de Nginx.

---

## Dominio lorenaortega.es

Cuando el despliegue funcione y hayas validado login + datos:
1. En el panel del hosting, añade el dominio `lorenaortega.es`.
2. En tu registrador de dominios, apunta los DNS al hosting (te da los registros).
3. Deja de publicar en Lovable para no tener dos versiones vivas.
