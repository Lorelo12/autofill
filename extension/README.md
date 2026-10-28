# Preenche — Extensão Chrome

Extensão Manifest V3 para abrir o formulário de perfilização já preenchido
com data, horário, BR e ramal.

## O que faz

- Popup com campos editáveis: BR do operador, ramal e motivo.
- DATA e Horário calculados ao abrir e atualizados em tempo real.
- “Guardar dados” guarda os valores atuais em `chrome.storage.local`.
- “Abrir formulário” abre o Google Forms:
  - com URL de prefill quando existem dados suficientes,
  - ou o formulário público quando não existem dados guardados.
- Não envia o formulário automaticamente.

## Arquitectura

- `extension/manifest.json`
- `extension/form-config.js` — URL do formulário, campos, motivos, lógica de
  prefill e validação local.
- `extension/popup.html`
- `extension/popup.css`
- `extension/popup.js`
- `extension/background.js`
- `extension/content.js` — preparado para uso futuro, sem efeito em v1.

## Instalação local

1. Abra `chrome://extensions`.
2. Ative “Modo de desenvolvedor”.
3. Carregue a pasta `extension/`.

## Configuração

Edita `extension/form-config.js`:
- `FORM_URL` — URL pública do formulário.
- `MOTIVOS` — opções válidas do campo motivo.

Se o app web mudar o mesmo formulário, atualiza também
`src/lib/form.ts` manualmente — os dois runtimes não partilham código.
