# Lorena Ortega Dietética

Aplicación full-stack (TanStack Start + React + TypeScript + Tailwind + shadcn/ui)
con backend Supabase (auth + base de datos). Copia local de tu proyecto de Lovable
`lorenaortega`, para poder trabajar y desplegar sin depender de Lovable.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre la URL que muestre Vite (normalmente http://localhost:3000).
El archivo `.env` ya incluye las claves del Supabase actual, así que arranca
contra el backend existente sin configurar nada.

> El proyecto usa Bun en Lovable (`bun.lock`), pero funciona con npm.
> Si prefieres Bun: instala https://bun.sh y usa `bun install` / `bun dev`.

## Notas de esta copia local

- **`src/routeTree.gen.ts`** se genera automáticamente al ejecutar `npm run dev`
  (lo crea el plugin de TanStack Router). No hace falta copiarlo a mano.
- **Recursos binarios placeholder** (sustitúyelos por los reales):
  - `src/assets/diet-watermark.jpg` — marca de agua del PDF de dietas.
  - `public/favicon.ico` — icono del sitio.
  Descárgalos del sitio publicado o del repo de Lovable y reemplázalos.
- **Componentes shadcn/ui**: se incluyen los que la app importa. Si añades
  funcionalidad que use otros componentes shadcn, genéralos con
  `npx shadcn@latest add <componente>`.

## Migrar el backend a tu propio Supabase (independencia total)

El esquema completo está en `supabase/migrations/`. Para llevarlo a un Supabase tuyo:

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU_PROJECT_REF
supabase db push
```

Luego actualiza `.env` con la URL y las claves de tu nuevo proyecto Supabase y
reinicia `npm run dev`.

Consulta la guía completa en `../MIGRACION-lorenaortega.md`.

## Subir a tu propio GitHub

```bash
git init
git add -A
git commit -m "Copia local de Lorena Ortega Dietética"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/lorenaortega.git
git push -u origin main
```

## Estructura

- `src/routes/` — páginas (landing, auth, área admin y área paciente).
- `src/components/` — componentes propios + `ui/` (shadcn).
- `src/lib/` — dominio, funciones de servidor, export PDF, hooks de auth.
- `src/integrations/supabase/` — clientes y middleware de Supabase.
- `supabase/migrations/` — esquema de la base de datos (SQL).
