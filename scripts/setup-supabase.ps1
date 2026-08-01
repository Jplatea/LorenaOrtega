<#
  setup-supabase.ps1
  Automatiza la migración del backend a TU propio proyecto de Supabase.

  Qué hace:
    1. Comprueba (e instala) la CLI de Supabase.
    2. Hace login, enlaza tu proyecto y aplica las 10 migraciones (supabase db push).
    3. Actualiza el .env con la URL y las claves de TU Supabase (guarda copia .env.bak).

  Uso (desde la carpeta del proyecto):
    ./scripts/setup-supabase.ps1 -ProjectRef "abcd1234" -Url "https://abcd1234.supabase.co" -AnonKey "sb_publishable_..."

  Si no pasas parámetros, te los pedirá por consola.
  Consigue estos valores en Supabase → Project Settings → API.
#>

param(
  [string]$ProjectRef,
  [string]$Url,
  [string]$AnonKey
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot   # carpeta del proyecto (padre de /scripts)
Set-Location $root

Write-Host "== Migración de backend a tu Supabase ==" -ForegroundColor Cyan

# 1. CLI de Supabase
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
  Write-Host "Instalando la CLI de Supabase (npm global)..." -ForegroundColor Yellow
  npm install -g supabase
}
supabase --version | Out-Null

# 2. Datos del proyecto
if (-not $ProjectRef) { $ProjectRef = Read-Host "Project ref de Supabase (ej. abcd1234)" }
if (-not $Url)        { $Url        = Read-Host "Project URL (ej. https://abcd1234.supabase.co)" }
if (-not $AnonKey)    { $AnonKey    = Read-Host "Anon / publishable key (sb_publishable_...)" }

# 3. Login + link + push
Write-Host "`nHaciendo login en Supabase (se abrirá el navegador)..." -ForegroundColor Yellow
supabase login

Write-Host "Enlazando el proyecto $ProjectRef ..." -ForegroundColor Yellow
supabase link --project-ref $ProjectRef

Write-Host "Aplicando migraciones (supabase db push) ..." -ForegroundColor Yellow
supabase db push

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
Write-Host "`nRecuerda: para operaciones de admin (crear pacientes) el servidor necesita" -ForegroundColor Yellow
Write-Host "la SUPABASE_SERVICE_ROLE_KEY como variable de entorno del hosting (NO en .env del repo)." -ForegroundColor Yellow
Write-Host "Y crea el bucket de Storage 'patient-documents' (privado) en tu nuevo Supabase." -ForegroundColor Yellow
