# Web app (v1)

Aplicação React + Vite + Convex para a mesma experiência de preenchimento
do formulário de perfilização.home office.

## Estrutura inicial

- `src/lib/form-config.js` — definição das perguntas, motivos e URL de
  prefill.
- `src/lib/index.js` — re-export público para os componentes.

## Configuração duplicada

O `FORM_URL`, `FIELDS` e `MOTIVOS` deste ficheiro e de
`extension/form-config.js` devem manter-se sincronizados manualmente. Os dois
runtimes não partilham código, e o formulário do Google Forms é o mesmo.

## Próximos passos

- Rota `/` com landing e CTA para `/auth`.
- Rota protegida `/dashboard` com editor dos campos guardados, preview dos 5
  campos e botão “Abrir formulário” que usa `makePrefillUrl()`.
- Backend Convex para guardar os dados por utilizador.
