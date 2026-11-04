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

> Os dados ficam salvos no navegador do aparelho. Faça backups em **Ajustes → Exportar backup**.

## WhatsApp automático com Evolution API (Railway)
1. No painel do Railway, abra o serviço da Evolution → **Variables** e confira:
   - `CORS_ORIGIN` = `*` (ou o endereço onde o Lumière está publicado);
   - `AUTHENTICATION_API_KEY` = sua chave global (usada só para criar a instância).
2. Em **Settings → Networking**, gere o domínio público (ex.: `https://evolution-xxxx.up.railway.app`).
3. Crie uma instância pelo Manager da Evolution (`https://SEU-DOMINIO/manager`) e copie o **token da instância**.
4. No Lumière, vá em **Ajustes → WhatsApp automático** e preencha a URL, o nome da instância e o token. Depois clique em **Conectar (QR Code)** e escaneie com o WhatsApp da clínica.
5. Clique em **Testar conexão** e em **Enviar teste para mim**.

Com isso, o disparo de retornos, os orçamentos e o resumo mensal passam a ser enviados direto, com um intervalo entre as mensagens para proteger o número.
