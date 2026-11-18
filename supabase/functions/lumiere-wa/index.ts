// WhatsApp da clínica, chamado pelo app (usuária logada e autorizada).
// Ações: status | qr | send | setup-webhook
import { CORS, json, env, internal, evo, evoSend, evoConfigured, waNum, authUser } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const user = await authUser(req);
  if (!user) return json({ error: "Sessão inválida ou sem acesso." }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const action = String(body.action ?? "status");

  if (!evoConfigured()) return json({ configured: false });
  try {
    if (action === "status") {
      const j = await evo("/instance/connectionState/{inst}");
      return json({ configured: true, state: j?.instance?.state ?? j?.state ?? "desconhecido" });
    }
    if (action === "qr") {
      const j = await evo("/instance/connect/{inst}");
      return json({ configured: true, qr: j?.base64 ?? j?.qrcode?.base64 ?? "", pairingCode: j?.pairingCode ?? "" });
    }
    if (action === "send") {
      const number = waNum(body.phone);
      const text = String(body.text ?? "").trim();
      if (!number || number.length < 12) return json({ error: "Telefone inválido." }, 400);
      if (!text) return json({ error: "Mensagem vazia." }, 400);
      await evoSend(number, text);
      return json({ configured: true, ok: true });
    }
    if (action === "setup-webhook") {
      const url = `${env("SUPABASE_URL")}/functions/v1/lumiere-wa-webhook?token=${encodeURIComponent(await internal("webhook_token"))}`;
      await evo("/webhook/set/{inst}", {
        method: "POST",
        body: JSON.stringify({ webhook: { enabled: true, url, events: ["MESSAGES_UPSERT"], byEvents: false, base64: false } }),
      });
      return json({ configured: true, ok: true });
    }
    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 502);
  }
});
