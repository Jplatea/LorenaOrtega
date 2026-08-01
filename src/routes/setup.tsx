import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bootstrapAdmin } from "@/lib/bootstrap.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Configuración inicial" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SetupPage,
});

function SetupPage() {
  const boot = useServerFn(bootstrapAdmin);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      email: String(fd.get("email") || ""),
      password: String(fd.get("password") || ""),
      first_name: String(fd.get("first_name") || ""),
      last_name: String(fd.get("last_name") || ""),
    };
    setLoading(true);
    try {
      await boot({ data: payload });
      const { error } = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password,
      });
      if (error) throw error;
      toast.success("Administrador creado");
      navigate({ to: "/admin", replace: true });
    } catch (err: any) {
      toast.error("No se pudo completar la configuración", { description: err?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-[var(--shadow-elevated)]">
        <Link to="/" className="flex items-center gap-2 text-primary">
          <Leaf className="h-5 w-5" />
          <span className="font-semibold">Lorena Ortega Dietética</span>
        </Link>
        <h1 className="text-xl font-semibold tracking-tight mt-4">Configuración inicial</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crea la cuenta de administrador (nutricionista). Este paso solo está disponible una vez.
        </p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" name="first_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellidos</Label>
              <Input id="last_name" name="last_name" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <Button type="submit" disabled={loading} className="mt-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear administrador
          </Button>
        </form>
      </div>
    </div>
  );
}
