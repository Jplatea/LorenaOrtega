import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/lib/auth-hooks";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "Mi cuenta — Lorena Ortega Dietética" }] }),
  component: AccountPage,
});

const emailSchema = z.string().trim().email("Email no válido").max(255);
const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

function AccountPage() {
  const { data: user } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [email, setEmail] = useState(user?.email ?? "");
  const [savingEmail, setSavingEmail] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);

  async function updateEmail(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (parsed.data === user?.email) {
      toast.info("El email no ha cambiado");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: parsed.data });
    setSavingEmail(false);
    if (error) {
      toast.error("No se pudo actualizar el email", { description: error.message });
      return;
    }
    // Also update profile mirror
    if (user?.id) {
      await supabase.from("profiles").update({ email: parsed.data }).eq("id", user.id);
    }
    qc.invalidateQueries({ queryKey: ["current-user"] });
    toast.success("Email actualizado", {
      description: "Revisa tu correo para confirmar el cambio si fuera necesario.",
    });
  }

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setSavingPwd(false);
    if (error) {
      toast.error("No se pudo cambiar la contraseña", { description: error.message });
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Contraseña actualizada");
  }

  return (
    <AppShell>
      <button
        onClick={() => navigate({ to: user?.role === "admin" ? "/admin" : "/patient" })}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">Mi cuenta</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Actualiza tu email y tu contraseña de acceso.
        </p>

        <form
          onSubmit={updateEmail}
          className="mt-6 bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Email</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              required
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingEmail}>
              {savingEmail && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar email
            </Button>
          </div>
        </form>

        <form
          onSubmit={updatePassword}
          className="mt-6 bg-card border border-border rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Contraseña</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Debe tener al menos 8 caracteres.
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={savingPwd}>
              {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
              Cambiar contraseña
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
