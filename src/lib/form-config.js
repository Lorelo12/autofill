// src/lib/form-config.js
//
// Mantém a definição das perguntas e o cálculo de data/hora iguais aos da
// extensão Chrome. Se o formulário mudar, altera aqui e em
// extension/form-config.js manualmente — os dois runtimes não partilham
// código.
//
// URL pública do formulário (não a de editor).
export const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSevv9ASZcbHfBPKnel3JNcxySDL5yeL8yQZ2Ji9LDbLVCmxzg/viewform";

export const FIELDS = {
  br: {
    label: "BR do operador",
    entryId: "167069453",
    type: "text",
  },
  ramal: {
    label: "Ramal",
    entryId: "895256511",
    type: "text",
  },
  data: {
    label: "DATA",
    entryId: "1143496904",
    type: "date",
  },
  horario: {
    label: "Horário",
    entryId: "147849836",
    type: "time",
  },
  motivo: {
    label: "Motivo",
    entryId: "1508182660",
    type: "choice",
  },
};

export const MOTIVOS = [
  "CHAMADAS COM RUIDO",
  // Se o formulário tiver mais opções, adicioná-las aqui na mesma ordem em
  // que aparecem no Google Forms.
];

export function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function nowTimeISO() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

export function makePrefillUrl(saved) {
  const params = new URLSearchParams();

  params.set(`entry.${FIELDS.data.entryId}`, todayISO());
  params.set(`entry.${FIELDS.horario.entryId}`, nowTimeISO());

  if (saved?.br) {
    params.set(`entry.${FIELDS.br.entryId}`, saved.br);
  }
  if (saved?.ramal) {
    params.set(`entry.${FIELDS.ramal.entryId}`, saved.ramal);
  }
  if (saved?.motivo) {
    params.set(`entry.${FIELDS.motivo.entryId}`, saved.motivo);
  }

  return `${FORM_URL}?${params.toString()}`;
}

export function validateSavedForPrefill(saved) {
  const missing = [];

  if (!saved?.br) missing.push(FIELDS.br.label);
  if (!saved?.ramal) missing.push(FIELDS.ramal.label);
  if (!saved?.motivo) missing.push(FIELDS.motivo.label);

  return missing;
}
