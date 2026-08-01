import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Copy, Eye, EyeOff, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPatient } from "@/lib/patients.functions";

export const Route = createFileRoute("/_authenticated/admin/patients/new")({
  component: NewPatient,
});

function generatePassword(len = 12) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += abc[bytes[i] % abc.length];
  return out;
}

function NewPatient() {
  const navigate = useNavigate();
  const create = useServerFn(createPatient);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{ id: string; tempPassword: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || "").trim(),
      password: password.trim() || null,
      first_name: String(fd.get("first_name") || "").trim(),
      last_name: String(fd.get("last_name") || "").trim(),
      phone: (fd.get("phone") as string) || null,
      dni: (fd.get("dni") as string) || null,
      address: (fd.get("address") as string) || null,
      birth_date: (fd.get("birth_date") as string) || null,
      sex: (fd.get("sex") as any) || null,

      height: fd.get("height") ? Number(fd.get("height")) : null,
      observations: (fd.get("observations") as string) || null,
    };
    if (payload.password && payload.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setLoading(true);
    try {
      const res = await create({ data: payload });
      setResult(res);
      toast.success("Paciente creado");
    } catch (err: any) {
      toast.error("No se pudo crear", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }


  if (result) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto bg-card border border-border rounded-2xl p-8 space-y-6">
          <h1 className="text-xl font-semibold">Paciente creado ✅</h1>
          <p className="text-sm text-muted-foreground">
            Comparte estas credenciales con el paciente. Se le pedirá cambiar la contraseña en el
            primer acceso.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Contraseña temporal</div>
                <div className="font-mono text-lg">{result.tempPassword}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(result.tempPassword);
                  toast.success("Copiado");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate({ to: "/admin/patients/$id", params: { id: result.id } })}>
              Ver ficha
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Crear otro
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: "/admin/patients" })}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Nuevo paciente</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Introduce los datos y define la contraseña para el acceso del paciente. Si la dejas en
          blanco, se generará una temporal.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-4 sm:grid-cols-2 bg-card border border-border rounded-2xl p-6">
          <Field label="Nombre" name="first_name" required />
          <Field label="Apellidos" name="last_name" required />
          <Field label="Email" name="email" type="email" required className="sm:col-span-2" />
          <Field label="Teléfono" name="phone" />
          <Field label="DNI" name="dni" />
          <Field label="Dirección" name="address" className="sm:col-span-2" />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Contraseña de acceso</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres (opcional)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPassword(generatePassword(12));
                  setShowPassword(true);
                }}
              >
                <RefreshCw className="h-4 w-4" /> Generar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Compártela con el paciente por un canal seguro.
            </p>
          </div>
          <Field label="Fecha de nacimiento" name="birth_date" type="date" />

          <div className="space-y-2">

            <Label>Sexo</Label>
            <Select name="sex">
              <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="female">Mujer</SelectItem>
                <SelectItem value="male">Hombre</SelectItem>
                <SelectItem value="other">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Field label="Altura (cm)" name="height" type="number" step="0.1" />
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea id="observations" name="observations" rows={3} />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Crear paciente
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  step,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  step?: string;
  className?: string;
}) {
  return (
    <div className={"space-y-2 " + (className ?? "")}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} step={step} />
    </div>
  );
}
