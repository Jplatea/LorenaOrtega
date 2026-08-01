<#
  setup-supabase.ps1
  Automatiza la migración del backend a TU propio proyecto de Supabase.

  Qué hace:
    1. Usa la CLI de Supabase vía `npx` (no instala nada global).
    2. Hace login, enlaza tu proyecto y aplica las 10 migraciones (supabase db push).
    3. Actualiza el .env con la URL y las claves de TU Supabase (guarda copia .env.bak).

  Uso (desde la carpeta del proyecto):
    ./scripts/setup-supabase.ps1 -ProjectRef "abcd1234" -Url "https://abcd1234.supabase.co" -AnonKey "sb_publishable_..."

  Si no pasas parámetros, te los pedirá por consola.
  Consigue estos valores en Supabase -> Project Settings -> API.
#>

param(
  [string]$ProjectRef,
  [string]$Url,
  [string]$AnonKey
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot   # carpeta del proyecto (padre de /scripts)
Set-Location $root

Write-Host "== Migracion de backend a tu Supabase ==" -ForegroundColor Cyan

# 0. Datos del proyecto
if (-not $ProjectRef) { $ProjectRef = Read-Host "Project ref de Supabase (ej. abcd1234)" }
if (-not $Url)        { $Url        = Read-Host "Project URL (ej. https://abcd1234.supabase.co)" }
if (-not $AnonKey)    { $AnonKey    = Read-Host "Anon / publishable key (sb_publishable_...)" }

# CLI de Supabase via npx (funciona en Windows sin instalar global)
$sb = "npx","--yes","supabase@latest"

# 1. Login (abre el navegador)
Write-Host "`n[1/3] Login en Supabase (se abrira el navegador)..." -ForegroundColor Yellow
& $sb login

# 2. Link del proyecto (pedira la contrasena de la base de datos)
Write-Host "[2/3] Enlazando el proyecto $ProjectRef ..." -ForegroundColor Yellow
& $sb link --project-ref $ProjectRef

# 3. Aplicar migraciones
Write-Host "[3/3] Aplicando migraciones (supabase db push) ..." -ForegroundColor Yellow
& $sb db push

# 4. Actualizar .env
$envPath = Join-Path $root ".env"
if (Test-Path $envPath) { Copy-Item $envPath "$envPath.bak" -Force; Write-Host "Copia de seguridad: .env.bak" -ForegroundColor DarkGray }

$envContent = @"
SUPABASE_PROJECT_ID="$ProjectRef"
SUPABASE_PUBLISHABLE_KEY="$AnonKey"
SUPABASE_URL="$Url"
VITE_SUPABASE_PROJECT_ID="$ProjectRef"
VITE_SUPABASE_PUBLISHABLE_KEY="$AnonKey"
VITE_SUPABASE_URL="$Url"
"@
Set-Content -Path $envPath -Value $envContent -Encoding utf8

Write-Host "`n.env actualizado con TU Supabase." -ForegroundColor Green
Write-Host "Reinicia el servidor:  npm run dev" -ForegroundColor Green
Write-Host "`nSiguiente:" -ForegroundColor Yellow
Write-Host " - Crea el bucket de Storage 'patient-documents' (privado) en tu nuevo Supabase." -ForegroundColor Yellow
Write-Host " - Para crear el primer admin (pagina /setup) y crear pacientes, el servidor" -ForegroundColor Yellow
Write-Host "   necesita la SUPABASE_SERVICE_ROLE_KEY. En local anadela temporalmente al .env;" -ForegroundColor Yellow
Write-Host "   en produccion, ponla como variable de entorno del hosting (nunca en el repo)." -ForegroundColor Yellow
