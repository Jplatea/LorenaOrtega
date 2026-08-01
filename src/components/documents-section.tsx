import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type DocumentCategory = "diet" | "recipe" | "guide" | "analysis" | "other";

const MAX_MB = 20;
const BUCKET = "patient-documents";

export function DocumentsSection({
  patientId,
  canManage,
}: {
  patientId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const { data: docs, isLoading } = useQuery({
    queryKey: ["patient-documents", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_documents")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = docs ?? [];

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un archivo");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`El archivo supera ${MAX_MB} MB`);
      return;
    }
    if (!form.title.trim()) {
      toast.error("Añade un título");
      return;
    }

    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sesión no válida");

      const safeName = file.name.replace(/[^\w.\-]/g, "_");
      const filePath = `${patientId}/${crypto.randomUUID()}-${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) throw upErr;

      const { error: insErr } = await supabase.from("patient_documents").insert({
        patient_id: patientId,
        uploaded_by: userData.user.id,
        category: "other",
        title: form.title.trim(),
        description: form.description.trim() || null,
        file_path: filePath,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (insErr) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw insErr;
      }

      toast.success("Documento subido");
      setForm({ title: "", description: "" });
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["patient-documents", patientId] });
    } catch (err: any) {
      toast.error("Error al subir", { description: err?.message });
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(filePath: string, title: string) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(filePath, 60);
    if (error || !data?.signedUrl) {
      toast.error("No se pudo descargar", { description: error?.message });
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = title;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleDelete(id: string, filePath: string) {
    const { error: dbErr } = await supabase.from("patient_documents").delete().eq("id", id);
    if (dbErr) {
      toast.error("Error", { description: dbErr.message });
      return;
    }
    await supabase.storage.from(BUCKET).remove([filePath]);
    toast.success("Documento eliminado");
    qc.invalidateQueries({ queryKey: ["patient-documents", patientId] });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className={canManage ? "lg:col-span-2 space-y-4" : "lg:col-span-3 space-y-4"}>
        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="text-sm text-muted-foreground">{filtered.length} documentos</div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No hay documentos todavía.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-muted/40 transition"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{d.title}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
                      <span>
                        {new Date(d.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {d.size_bytes ? <span>{formatSize(d.size_bytes)}</span> : null}
                    </div>
                    {d.description ? (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {d.description}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(d.file_path, d.title)}
                      aria-label="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {canManage && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Se borrará el archivo permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(d.id, d.file_path)}>
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {canManage && (
        <form
          onSubmit={handleUpload}
          className="bg-card border border-border rounded-2xl p-6 space-y-3 h-fit"
        >
          <h3 className="font-semibold">Subir documento</h3>
          <div className="space-y-2">
            <Label htmlFor="doc-title">Título</Label>
            <Input
              id="doc-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={120}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-desc">Descripción (opcional)</Label>
            <Textarea
              id="doc-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              maxLength={500}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-file">Archivo</Label>
            <Input
              id="doc-file"
              ref={fileRef}
              type="file"
              accept=".pdf,image/*,.doc,.docx,.txt"
              required
            />
            <p className="text-xs text-muted-foreground">PDF, imágenes o documentos. Máx {MAX_MB} MB.</p>
          </div>
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Subir
          </Button>
        </form>
      )}
    </div>
  );
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
