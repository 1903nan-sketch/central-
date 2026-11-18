# Backend (Supabase)

Edge Functions do sistema da clínica. Estão publicadas no projeto Supabase e versionadas aqui.

| Função | Para quê | Proteção |
|---|---|---|
| `lumiere-wa` | O app consulta o WhatsApp (status, QR Code), envia mensagens avulsas e liga o webhook | sessão da usuária + e-mail autorizado |
| `lumiere-campaign-worker` | Fila das campanhas: lote de 4 por minuto, 8–20 s entre mensagens, só das 8h às 20h | token interno (chamado pelo `pg_cron`) |
| `lumiere-wa-webhook` | Recebe as respostas do WhatsApp, liga à campanha dos últimos 7 dias e classifica com o Claude | token interno na URL |

**Segredos (Supabase → Edge Functions → Secrets):** `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `ANTHROPIC_API_KEY`.
Os tokens internos ficam na tabela protegida `lumiere_internal`, gerados automaticamente.

Para publicar pelo Supabase CLI: `supabase functions deploy <nome> --no-verify-jwt` (a autenticação é feita dentro de cada função).
