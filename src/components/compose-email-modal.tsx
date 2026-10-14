import { useState } from "react";
import { toast } from "sonner";
import { X, Send, Loader2 } from "lucide-react";
import { sendClientEmail } from "@/lib/email.functions";

/** Ventana limpia para que Lorena escriba un correo a un cliente. Se monta solo
 *  cuando hace falta (el padre la renderiza de forma condicional), así los
 *  valores iniciales (destinatario/asunto) se aplican en cada apertura. */
export function ComposeEmailModal({
  defaultTo = "",
  defaultSubject = "",
  onClose,
}: {
  defaultTo?: string;
  defaultSubject?: string;
  onClose: () => void;
}) {
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!to.trim() || !subject.trim() || !message.trim()) {
      toast.error("Rellena destinatario, asunto y mensaje");
      return;
    }
    setSending(true);
    try {
      await sendClientEmail({ data: { to: to.trim(), subject: subject.trim(), message } });
      toast.success("Correo enviado");
      onClose();
    } catch (e: any) {
      toast.error("No se pudo enviar", { description: e?.message ?? "Inténtalo de nuevo" });
    } finally {
      setSending(false);
    }
  }

  const field = "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition focus:border-primary";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <div>
            <h2 className="text-base font-medium text-foreground">Escribir correo</h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground">De: hola@lorenaortega.es</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 px-6 py-5">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Para (correo del cliente)"
            className={field}
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Asunto"
            className={field}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribe tu mensaje…"
            rows={9}
            className={field + " resize-none leading-relaxed"}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
