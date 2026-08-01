import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Lorena Ortega Dietética" },
      { name: "description", content: "Acceso a la plataforma de pacientes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("No se ha podido iniciar sesión", { description: error.message });
      return;
    }
    if (data.user) {
      supabase
        .from("profiles")
        .update({ last_sign_in_at: new Date().toISOString() })
        .eq("id", data.user.id)
        .then(() => {});
    }
    if (!remember) sessionStorage.setItem("lo-no-remember", "1");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="relative z-10 p-12 flex flex-col justify-between text-primary-foreground w-full">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Lorena Ortega Dietética</span>
          </Link>
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-semibold leading-tight">
              Tu plan de nutrición, siempre a mano.
            </h1>
            <p className="opacity-90">
              Consulta tu dieta semanal, tu progreso y los materiales de tu nutricionista desde
              cualquier dispositivo.
            </p>
          </div>
          <p className="text-xs opacity-80">© {new Date().getFullYear()} Lorena Ortega Dietética</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-2 text-primary">
            <Link to="/" className="flex items-center gap-2 text-primary">
              <Leaf className="h-6 w-6" />
              <span className="font-semibold">Lorena Ortega Dietética</span>
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Accede con las credenciales que te ha facilitado tu nutricionista.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Usuario / correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Recordar sesión
            </label>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Iniciar sesión
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            ¿Problemas para acceder? Contacta con tu nutricionista para restablecer tu contraseña.
          </p>
        </div>
      </div>
    </div>
  );
}
