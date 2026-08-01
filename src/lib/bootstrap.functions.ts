import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const bootstrapAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        email: z.string().email(),
        password: z.string().min(8).max(128),
        first_name: z.string().min(1).max(80),
        last_name: z.string().min(1).max(120),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Only allowed if no admin exists yet
    const { data: existing, error: qErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);
    if (qErr) throw new Error(qErr.message);
    if (existing && existing.length > 0) {
      throw new Error("Ya existe un administrador. Contacta con el nutricionista.");
    }

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
      },
    });
    if (authErr || !created.user) throw new Error(authErr?.message ?? "Error al crear");

    await supabaseAdmin
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        must_change_password: false,
      })
      .eq("id", created.user.id);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true };
  });
