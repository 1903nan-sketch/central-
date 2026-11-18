// WhatsApp da clínica, chamado pelo app (usuária logada e autorizada).
// Ações: status | qr | send | setup-webhook
import { CORS, json, env, internal, evo, evoSend, evoConfigured, evoInstance, loadEvo, waNum, authUser } from "../_shared/common.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const user = await authUser(req);
  if (!user) return json({ error: "Sessão inválida ou sem acesso." }, 401);
  let body: any = {};
  try { body = await req.json(); } catch { /* vazio */ }
  const action = String(body.action ?? "status");

  await loadEvo();
  if (!evoConfigured()) {
    // Diagnóstico: só os NOMES dos segredos parecidos, nunca os valores
    const nomes = Object.keys(Deno.env.toObject()).filter((k) => /EVO|API|KEY|CHAVE|ANTHROPIC/i.test(k) && !/^SUPABASE_/.test(k));
    console.log("WhatsApp não configurado. Segredos com nome parecido:", JSON.stringify(nomes));
    return json({ configured: false, missing: ["EVOLUTION_API_KEY"].filter((k) => !env(k)) });
  }
  const hookUrl = async () => `${env("SUPABASE_URL")}/functions/v1/lumiere-wa-webhook?token=${encodeURIComponent(await internal("webhook_token"))}`;
  const setHook = async () => evo("/webhook/set/{inst}", {
    method: "POST",
    body: JSON.stringify({ webhook: { enabled: true, url: await hookUrl(), events: ["MESSAGES_UPSERT"], byEvents: false, base64: false } }),
  });
  // Cria a instância na primeira vez (já com o webhook das respostas)
  const ensure = async () => {
    try { return await evo("/instance/connectionState/{inst}"); }
    catch (e) {
      if (![404, 400].includes((e as any).status)) throw e;
      await evo("/instance/create", { method: "POST", body: JSON.stringify({ instanceName: evoInstance(), integration: "WHATSAPP-BAILEYS", qrcode: true }) });
      try { await setHook(); } catch { /* tenta de novo pelo botão */ }
      return await evo("/instance/connectionState/{inst}");
    }
  };
  try {
    if (action === "status") {
      const j = await ensure();
      return json({ configured: true, state: j?.instance?.state ?? j?.state ?? "desconhecido" });
    }
    if (action === "qr") {
      await ensure();
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
      await setHook();
      return json({ configured: true, ok: true });
    }
    return json({ error: "Ação desconhecida." }, 400);
  } catch (e) {
    return json({ configured: true, error: (e as Error).message }, 502);
  }
});
