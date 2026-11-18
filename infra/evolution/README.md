# Evolution API na VPS

Sobe o WhatsApp da clínica (Evolution API) com banco, cache e HTTPS automático.

## 1. Preparar a VPS
- Ubuntu 22.04 ou 24.04, 2 GB de RAM ou mais.
- Instale o Docker: `curl -fsSL https://get.docker.com | sh`
- No DNS do seu domínio, crie um registro **A** (ex.: `whatsapp.suaclinica.com.br`) apontando para o IP da VPS.
- Libere as portas 80 e 443 no firewall da VPS.

## 2. Subir
```bash
git clone <este repositório> && cd central-/infra/evolution
cp .env.example .env    # preencha DOMINIO, AUTHENTICATION_API_KEY e POSTGRES_PASSWORD
docker compose up -d
```
Em 1 a 2 minutos, `https://SEU-DOMINIO` responde com uma mensagem da Evolution.

## 3. Criar a instância (o WhatsApp da clínica)
```bash
curl -X POST https://SEU-DOMINIO/instance/create \
  -H "apikey: SUA_AUTHENTICATION_API_KEY" -H "Content-Type: application/json" \
  -d '{"instanceName":"clinica","integration":"WHATSAPP-BAILEYS","qrcode":true}'
```
Guarde o **token** da instância que aparece na resposta (campo `hash`).

## 4. Ligar no sistema
No Supabase → **Edge Functions → Secrets**, crie:
| Nome | Valor |
|---|---|
| `EVOLUTION_URL` | `https://SEU-DOMINIO` |
| `EVOLUTION_INSTANCE` | `clinica` |
| `EVOLUTION_API_KEY` | o token da instância (ou a chave mestra) |
| `ANTHROPIC_API_KEY` | chave da API do Claude (classifica as respostas) |

Depois, no app: **Ajustes → WhatsApp da clínica → Conectar (QR Code)** e escaneie com o celular da clínica.
Por fim, toque em **Ativar respostas das campanhas** (cadastra o webhook na Evolution).
