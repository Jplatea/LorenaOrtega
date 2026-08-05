import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function genTempPassword(len = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("No autorizado");
  if (!data) throw new Error("Solo administradores");
}

const createPatientSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72).optional().nullable(),
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  dni: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  birth_date: z.string().optional().nullable(),
  sex: z.enum(["male", "female", "other"]).optional().nullable(),
  height: z.number().positive().max(300).optional().nullable(),
  observations: z.string().max(2000).optional().nullable(),
});

export const createPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createPatientSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const adminProvided = !!data.password;
    const password = adminProvided ? data.password! : genTempPassword(12);

    const { data: created, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: data.first_name,
        last_name: data.last_name,
        must_change_password: !adminProvided,
      },
    });
    if (authErr || !created.user) throw new Error(authErr?.message ?? "No se pudo crear usuario");

    const newUserId = created.user.id;

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .update({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone ?? null,
        dni: data.dni ?? null,
        address: data.address ?? null,
        birth_date: data.birth_date || null,
        sex: data.sex ?? null,
        height: data.height ?? null,
        observations: data.observations ?? null,
        must_change_password: !adminProvided,
      })
      .eq("id", newUserId);
    if (profileErr) throw new Error(profileErr.message);

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newUserId, role: "patient" });
    if (roleErr) throw new Error(roleErr.message);

    return { id: newUserId, tempPassword: password, adminProvided };
  });

export const resetPatientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ patient_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tempPassword = genTempPassword(12);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.patient_id, {
      password: tempPassword,
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin
      .from("profiles")
      .update({ must_change_password: true })
      .eq("id", data.patient_id);
    return { tempPassword };
  });

/** Sube (o retira, si base64 vacío) el PDF de la dieta de una semana al
 *  expediente del paciente usando el service_role (evita problemas de RLS en el
 *  cliente). Una única copia por semana: se sobreescribe. */
export const saveDietPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        patient_id: z.string().uuid(),
        week: z.number().int().positive(),
        title: z.string().min(1).max(200),
        base64: z.string().default(""),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.patient_id}/dieta-semana-${data.week}.pdf`;

    if (!data.base64) {
      await supabaseAdmin.storage.from("patient-documents").remove([path]);
      await supabaseAdmin.from("patient_documents").delete().eq("patient_id", data.patient_id).eq("file_path", path);
      return { ok: true, removed: true };
    }

    const bin = atob(data.base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const { error: upErr } = await supabaseAdmin.storage
      .from("patient-documents")
      .upload(path, bytes, { contentType: "application/pdf", upsert: true });
    if (upErr) throw new Error(upErr.message);

    const { data: existing } = await supabaseAdmin
      .from("patient_documents")
      .select("id")
      .eq("patient_id", data.patient_id)
      .eq("file_path", path)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabaseAdmin
        .from("patient_documents")
        .update({ title: data.title, mime_type: "application/pdf", size_bytes: bytes.length })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("patient_documents").insert({
        patient_id: data.patient_id,
        uploaded_by: context.userId,
        title: data.title,
        file_path: path,
        mime_type: "application/pdf",
        size_bytes: bytes.length,
        category: "diet",
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deletePatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ patient_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.patient_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const copyWeek = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        patient_id: z.string().uuid(),
        from_week: z.number().int().positive(),
        to_week: z.number().int().positive(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: rows, error } = await context.supabase
      .from("diets")
      .select("day_of_week, meal, content")
      .eq("patient_id", data.patient_id)
      .eq("week_number", data.from_week);
    if (error) throw new Error(error.message);
    if (!rows?.length) return { copied: 0 };

    const upsertRows = rows.map((r: any) => ({
      patient_id: data.patient_id,
      week_number: data.to_week,
      day_of_week: r.day_of_week,
      meal: r.meal,
      content: r.content,
    }));
    const { error: upErr } = await context.supabase
      .from("diets")
      .upsert(upsertRows, { onConflict: "patient_id,week_number,day_of_week,meal" });
    if (upErr) throw new Error(upErr.message);
    return { copied: rows.length };
  });
