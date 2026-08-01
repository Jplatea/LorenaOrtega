import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "patient";

export interface CurrentUser {
  id: string;
  email: string;
  role: AppRole | null;
  profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birth_date: string | null;
    sex: string | null;

    height: number | null;
    observations: string | null;
    must_change_password: boolean;
    is_active: boolean;
  } | null;
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userData.user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
  ]);

  const roleList = (roles ?? []).map((r) => r.role as AppRole);
  const role: AppRole | null = roleList.includes("admin")
    ? "admin"
    : roleList.includes("patient")
      ? "patient"
      : null;

  return {
    id: userData.user.id,
    email: userData.user.email ?? "",
    role,
    profile: profile as CurrentUser["profile"],
  };
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    staleTime: 30_000,
  });
}
