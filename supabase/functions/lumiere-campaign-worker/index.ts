// Fila de envio das campanhas. Chamada a cada minuto pelo pg_cron.
// Envia um lote pequeno, com intervalo aleatório entre as mensagens,
// só em horário comercial (8h–20h, horário de Brasília).
import { json, admin, internal, evoSend, evoConfigured, loadEvo } from "../_shared/common.ts";

const LOTE = 4;                 // mensagens por execução (por minuto)
const ESPERA_MIN = 8_000;       // intervalo aleatório entre mensagens
const ESPERA_MAX = 20_000;
const MAX_TENTATIVAS = 3;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function horarioComercial() {
  const h = Number(new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(new Date()));
  return h >= 8 && h < 20;
}

Deno.serve(async (req) => {
  const segredo = await internal("cron_secret");
  if (!segredo || req.headers.get("x-cron-secret") !== segredo) {
    return json({ error: "não autorizado" }, 401);
  }
  await loadEvo();
  if (!evoConfigured()) return json({ skipped: "Evolution não configurada" });
  if (!horarioComercial()) return json({ skipped: "fora do horário comercial" });

  const sb = admin();
  const { data: ativas } = await sb.from("lumiere_campaigns").select("id").eq("status", "enviando");
  const ids = (ativas ?? []).map((c) => c.id);
  if (!ids.length) return json({ sent: 0 });

  const { data: fila } = await sb.from("lumiere_campaign_sends").select("id")
    .eq("status", "na_fila").in("campaign_id", ids).order("created_at").limit(LOTE);
  if (!fila?.length) {
    await sb.from("lumiere_campaigns").update({ status: "concluida", updated_at: new Date().toISOString() }).in("id", ids);
    return json({ sent: 0, finished: ids.length });
  }
  // Reserva o lote (evita envio duplicado se duas execuções se sobrepuserem)
  const { data: lote } = await sb.from("lumiere_campaign_sends").update({ status: "enviando" })
    .in("id", fila.map((f) => f.id)).eq("status", "na_fila").select("id, phone, message, attempts");

  let sent = 0, failed = 0;
  for (let i = 0; i < (lote ?? []).length; i++) {
    const s = lote![i];
    try {
      await evoSend(s.phone, s.message);
      await sb.from("lumiere_campaign_sends").update({ status: "enviado", sent_at: new Date().toISOString(), error: null, attempts: s.attempts + 1 }).eq("id", s.id);
      sent++;
    } catch (e) {
      const tentativas = s.attempts + 1;
      await sb.from("lumiere_campaign_sends").update({
        status: tentativas >= MAX_TENTATIVAS ? "falhou" : "na_fila", error: (e as Error).message.slice(0, 300), attempts: tentativas,
      }).eq("id", s.id);
      failed++;
    }
    if (i < lote!.length - 1) await sleep(ESPERA_MIN + Math.random() * (ESPERA_MAX - ESPERA_MIN));
  }
  return json({ sent, failed });
});
