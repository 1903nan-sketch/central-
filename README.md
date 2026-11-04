# Lumière — gestão para clínica de estética da pele

Sistema web leve (um único `index.html`, sem instalação) com visual em vidro fosco em tons de cinza e branco.

## Funcionalidades
- **Agenda**: calendário mensal com consultas e retornos previstos, painel do dia e indicadores (consultas de hoje, retornos do próximo mês, faturamento).
- **Pacientes**: cadastro em que só o nome é obrigatório (dá até para cadastrar digitando o nome dentro da consulta). Cada paciente tem uma **pasta** com o histórico, os valores, os procedimentos, os orçamentos, os retornos e a ficha.
- **Consultas**: procedimentos do catálogo com um toque, itens avulsos, desconto em % ou R$ (atalhos 5/10/15/20%) e um retorno rápido: *1 mês, 3 meses, 6 meses, 1 ano* ou *data exata* pelo calendário.
- **Orçamentos**: monte os valores, aplique o desconto, envie pelo WhatsApp, imprima ou gere PDF e converta em consulta.
- **Retornos**: lista por mês (padrão: próximo mês) e atrasados, com **todos os pacientes já selecionados**. Desmarque quem não deve receber e clique em *Disparar mensagens*; a mensagem pode ser editada com variáveis como `{nome}` e `{data}`.
- **Aviso para a doutora**: a partir do dia configurado, a Agenda mostra o resumo dos retornos do **mês seguinte** para enviar ao seu WhatsApp. Opcionalmente, o envio pode ser automático e gratuito via CallMeBot (em Ajustes).
- **Backup**: exportar e importar um arquivo `.json`.

## Como usar
Abra o `index.html` no navegador ou publique a pasta em qualquer hospedagem estática (GitHub Pages, Netlify, Vercel). No celular, use “Adicionar à tela inicial” para abrir como aplicativo.

> Os dados ficam salvos no navegador do aparelho. Faça backups em **Ajustes → Exportar backup**.
