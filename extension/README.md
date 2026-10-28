# Preenche — Extensão Chrome

Extensão Manifest V3 para preencher o formulário de perfilização
na página aberta, quando essa página é o formulário certo.

## O que faz

- Popup com campos editáveis: BR do operador, ramal e motivo.
- DATA e Horário calculados ao abrir e atualizados em tempo real.
- “Guardar dados” guarda os valores atuais em `chrome.storage.local`.
- “Preencher página aberta” envia os dados guardados para o content script
  na aba ativa, se essa aba for o formulário do Google Forms alvo.
- “Abrir formulário” abre o formulário público, com URL de prefill quando
  existem dados suficientes.
- Não envia o formulário automaticamente.

## Como usar

1. Abra o formulário do Google Forms na aba que quer usar.
2. Abra o popup da extensão.
3. Se a aba for o formulário alvo, o popup avisa “Formulário detectado”.
4. Clique em “Preencher página aberta”.
5. Se quiser reutilizar os dados depois, clique em “Guardar dados”.

## Limitações técnicas

- A autofill na página aberta usa content script e tenta preencher apenas
  campos que conseguir escrever diretamente.
- O Google Forms pode renderizar campos de forma diferente, e alguns podem
  estar bloqueados ou em formato incompatível. Nesses casos, a extensão não
  força os campos e regista o resultado no console da página.
- Auto-submit não está incluído.

## Arquitectura

- `extension/manifest.json`
- `extension/form-config.js` — URL do formulário, campos, motivos,
  lógica de prefill e deteção do formulário na página aberta.
- `extension/popup.html`
- `extension/popup.css`
- `extension/popup.js`
- `extension/background.js`
- `extension/content.js`
- `extension/icons/`

## Instalação local

1. Abra `chrome://extensions`.
2. Ative “Modo de desenvolvedor”.
3. Carregue a pasta `extension/`.

## Configuração

Edita `extension/form-config.js`:
- `FORM_URL` — URL pública do formulário.
- `MOTIVOS` — opções válidas do campo motivo.

Se o app web mudar o mesmo formulário, atualiza também
`src/lib/form-config.js` manualmente — os dois runtimes não partilham código.
