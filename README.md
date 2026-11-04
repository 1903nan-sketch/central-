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

## Como usar
Abra o `index.html` no navegador ou publique a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel). No celular, use “Adicionar à tela inicial” para abrir como aplicativo.

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
A configuração fica **no código**, e a doutora não vê nada técnico. No início do `<script>` do `index.html`, preencha:

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
