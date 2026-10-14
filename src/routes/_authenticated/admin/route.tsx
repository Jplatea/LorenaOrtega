import { createFileRoute, redirect } from "@tanstack/react-router";

// El esqueleto antiguo /admin queda retirado: todo se gestiona desde el panel
// principal (la pantalla de tarjetas en "/"). Cualquier /admin/* redirige allí.
export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
