# Lumière — gestão para clínica de estética da pele

Sistema web leve (um único `index.html`, sem instalação) com visual em vidro fosco em tons de cinza e branco.

## Funcionalidades
- **Agenda**: calendário mensal com consultas e retornos previstos, painel do dia e indicadores (consultas de hoje, retornos do próximo mês, faturamento).
- **Pacientes**: cadastro em que só o nome é obrigatório (dá até para cadastrar digitando o nome dentro da consulta). Cada paciente tem uma **pasta** com o histórico, os valores, os procedimentos, os orçamentos, os retornos e a ficha.
- **Consultas**: procedimentos do catálogo com um toque, itens avulsos, desconto em % ou R$ (atalhos 5/10/15/20%) e um retorno rápido: *1 mês, 3 meses, 6 meses, 1 ano* ou *data exata* pelo calendário.
- **Orçamentos**: monte os valores, aplique o desconto, envie pelo WhatsApp, imprima ou gere PDF e converta em consulta.
- **Retornos**: lista por mês (padrão: próximo mês) e atrasados, com **todos os pacientes já selecionados**. Desmarque quem não deve receber e clique em *Disparar mensagens*; a mensagem pode ser editada com variáveis como `{nome}` e `{data}`.
- **Aviso para a doutora**: a partir do dia configurado, a Agenda mostra o resumo dos retornos do **mês seguinte** para enviar ao seu WhatsApp. Com a Evolution API configurada, o resumo pode chegar sozinho ao abrir o sistema.
- **Backup**: exportar e importar um arquivo `.json`.

## Hospedagem (Cloudflare)
O site fica na pasta `public/` e é publicado no **Cloudflare Workers** (arquivos estáticos, sem servidor), configurado em `wrangler.jsonc`.

**Publicar automaticamente a cada atualização no GitHub**
1. Cloudflare → **Workers & Pages → Create → Import a repository** e escolha este repositório.
2. Branch de produção: a branch do projeto. Comando de build: deixe vazio. Comando de deploy: `npx wrangler deploy`.
3. Ao terminar, o endereço será algo como `https://clinica-estetica.SEU-USUARIO.workers.dev`. Domínio próprio: **Settings → Domains & Routes → Add → Custom domain**.

**Publicar manualmente:** `npx wrangler deploy` na raiz do projeto.

No celular, abra o endereço no Safari/Chrome e use “Adicionar à tela de início” para abrir como aplicativo.

## Login e nuvem (Supabase)
As contas são criadas **só pelo administrador**, no painel do Supabase. A tela do sistema tem apenas **Entrar**.

**Criar o acesso da doutora**
1. Supabase → **Authentication → Users → Add user → Create new user**.
2. Preencha o e-mail e a senha e marque **Auto Confirm User**.
3. No **SQL Editor**, libere o e-mail no sistema:
   ```sql
   insert into public.lumiere_allowed (email) values ('email-da-dra@exemplo.com');
   ```

**Trocar a senha (quando ela esquecer)**
O Supabase não mostra senhas, porque elas ficam criptografadas. Defina uma nova no **SQL Editor** e envie para ela:
```sql
update auth.users set encrypted_password = crypt('NOVA-SENHA', gen_salt('bf'))
where email = 'email-da-dra@exemplo.com';
```

Os dados ficam na tabela `lumiere_data` e aparecem em qualquer aparelho em que ela entrar.

## Aparência
Claro, Escuro ou Automático (segue o aparelho), em **Ajustes → Aparência** ou pelo botão de sol/lua no menu lateral.

## WhatsApp automático com Evolution API (Railway)
A configuração fica **no código**, e a doutora não vê nada técnico. No início do `<script>` do `public/index.html`, preencha:

```js
const EVOLUTION={
  url:'https://evolution-production-xxxx.up.railway.app',
  instancia:'clinica',
  token:'TOKEN-DA-INSTANCIA',
  intervalo:8
};
```

- No Railway, a variável `CORS_ORIGIN` da Evolution precisa ser `*`.
- Conecte o WhatsApp da clínica pelo QR Code no Manager da Evolution (`https://SEU-DOMINIO/manager`).
- Com a `url` vazia, o sistema usa o modo manual: abre o WhatsApp com a mensagem pronta.
- Com a Evolution preenchida, retornos, orçamentos e o resumo mensal da doutora são enviados automaticamente.

> ⚠️ O token fica visível no código da página. Use sempre o **token da instância** (nunca a chave global) e não divulgue o link do sistema.

## CRM e campanhas (WhatsApp)

- **Linha do tempo** em cada paciente: consultas, procedimentos, orçamentos e mensagens (enviadas e respondidas).
- **Catálogo por categoria**: Clínica (avaliação), Cirurgia e Estética. Em *Pacientes*, filtros por nome, procedimento, categoria, período e status do orçamento, e a tabela de procedimentos realizados.
- **Campanhas**: filtros combináveis (procedimento, data, aniversário, bairro/cidade/CEP, orçamento aberto, idade, sexo), variáveis `{nome}`, `{procedimento}` e `{data}`, prévia, envio em lotes pequenos com intervalos aleatórios e painel com envios, respostas e taxa de resposta.
- **LGPD**: toda mensagem leva o rodapé “Se não quiser mais receber mensagens, é só avisar.”. O Claude classifica as respostas: *quer sair* tira a paciente da lista na hora; *dúvida* vai para “Mensagens para revisar”. A volta para as campanhas é sempre manual.

### Backend (Supabase)
| Peça | Função |
|---|---|
| `lumiere-wa` | Status, QR Code, envio e cadastro do webhook da Evolution |
| `lumiere-campaign-worker` | Fila de envio (pg_cron, a cada minuto, só em horário comercial) |
| `lumiere-wa-webhook` | Recebe as respostas, liga à campanha e classifica com o Claude |

Segredos em **Supabase → Edge Functions → Secrets**: `EVOLUTION_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE` e `ANTHROPIC_API_KEY`.
Sem esses segredos, as campanhas funcionam no modo manual (abre o WhatsApp uma a uma).
Para subir a Evolution numa VPS, veja [`infra/evolution`](infra/evolution/README.md).
