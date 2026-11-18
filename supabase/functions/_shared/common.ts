// Funções compartilhadas pelas Edge Functions do Lumière.
// Variáveis de ambiente (Supabase → Edge Functions → Secrets):
//   EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE   → WhatsApp (Evolution API)
//   ANTHROPIC_API_KEY       → classificação das respostas (sair / normal / dúvida)
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem automaticamente.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

export const env = (k: string) => (Deno.env.get(k) ?? "").trim();
export const admin = (): SupabaseClient =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

// Tokens internos (fila e webhook) ficam na tabela protegida lumiere_internal
export async function internal(key: string) {
  const { data } = await admin().from("lumiere_internal").select("value").eq("key", key).maybeSingle();
  return (data?.value as string | undefined) ?? "";
}

/* ---------- WhatsApp (Evolution API v2) ---------- */
// URL e nome da instância: segredo do Supabase ou, se faltar, a tabela lumiere_internal
// (evolution_url / evolution_instance). A chave fica só nos segredos (EVOLUTION_API_KEY).
const CFG: Record<string, string> = {};
export async function loadEvo() {
  for (const [k, ik, def] of [["EVOLUTION_URL", "evolution_url", ""], ["EVOLUTION_INSTANCE", "evolution_instance", "clinica"]]) {
    CFG[k] = env(k) || (await internal(ik)) || def;
  }
  CFG.EVOLUTION_API_KEY = env("EVOLUTION_API_KEY");
}
const cfg = (k: string) => CFG[k] ?? env(k);
export const evoConfigured = () => !!(cfg("EVOLUTION_URL") && cfg("EVOLUTION_API_KEY") && cfg("EVOLUTION_INSTANCE"));
export const evoInstance = () => cfg("EVOLUTION_INSTANCE");
const evoBase = () => {
  let b = cfg("EVOLUTION_URL").replace(/\/+$/, "");
  if (!/^https?:\/\//.test(b)) b = "https://" + b;
  return b;
};
const inst = () => encodeURIComponent(cfg("EVOLUTION_INSTANCE"));
export async function evo(path: string, init: RequestInit = {}) {
  const r = await fetch(evoBase() + path.replace("{inst}", inst()), {
    ...init,
    headers: { "Content-Type": "application/json", apikey: cfg("EVOLUTION_API_KEY"), ...(init.headers ?? {}) },
  });
  let j: any = null;
  try { j = await r.json(); } catch { /* sem corpo */ }
  if (!r.ok) {
    const m = j?.response?.message ?? j?.message ?? j?.error;
    const err = new Error((Array.isArray(m) ? m.join(" ") : typeof m === "string" ? m : "") || `Evolution respondeu ${r.status}`);
    (err as any).status = r.status;
    throw err;
  }
  return j;
}
export async function evoSend(number: string, text: string) {
  try {
    return await evo("/message/sendText/{inst}", { method: "POST", body: JSON.stringify({ number, text }) });
  } catch (e) {
    // Evolution v1 usa outro formato de corpo
    if (/textMessage|400/.test(String((e as Error).message))) {
      return await evo("/message/sendText/{inst}", { method: "POST", body: JSON.stringify({ number, textMessage: { text } }) });
    }
    throw e;
  }
}

/* ---------- telefones ---------- */
export const digits = (s: unknown) => String(s ?? "").replace(/\D/g, "");
// Número no formato do WhatsApp (55 + DDD + número)
export const waNum = (s: unknown) => { let d = digits(s); if (d && d.length <= 11) d = "55" + d; return d; };
// Chave de comparação: DDD + 8 últimos dígitos (o WhatsApp às vezes omite o 9º dígito)
export function phoneKey(s: unknown) {
  let d = digits(s);
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length < 10) return d;
  return d.slice(0, 2) + d.slice(-8);
}

/* ---------- usuário logado (app) ---------- */
export async function authUser(req: Request) {
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const sb = admin();
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const { data: ok } = await sb.from("lumiere_allowed").select("email").eq("email", data.user.email.toLowerCase()).maybeSingle();
  return ok ? data.user : null;
}
