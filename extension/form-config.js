// form-config.js
//
// Mantém a definição das perguntas e o cálculo de data/hora iguais aos da
// extensão Chrome. Se o formulário mudar, altera aqui e em
// src/lib/form-config.js manualmente — os dois runtimes não partilham
// código.
//
// URL pública do formulário (não a de editor).
const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSevv9ASZcbHfBPKnel3JNcxySDL5yeL8yQZ2Ji9LDbLVCmxzg/viewform";

const FORM_HOST_PATTERN =
  /^https?:\/\/[^\/]*google\.com\/forms\/d\/e\/[a-zA-Z0-9_-]+\/viewform/i;

const FIELDS = {
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

const MOTIVOS = [
  "CHAMADAS COM RUIDO"
  // Se o formulário tiver mais opções, adicioná-las aqui na mesma ordem em
  // que aparecem no Google Forms.
];

const STORAGE_KEY = "preencheForm";

// Data no formato YYYY-MM-DD, sempre com zeros à esquerda.
function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Hora no formato HH:MM, sempre com zeros à esquerda.
function nowTimeISO() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

// URL de prefill com data e horário calculados e os outros campos vindos do
// que está guardado.
function buildPrefillUrl(saved) {
  const params = new URLSearchParams();

  params.set(`entry.${FIELDS.data.entryId}`, todayISO());
  params.set(`entry.${FIELDS.horario.entryId}`, nowTimeISO());

  if (saved.br) {
    params.set(`entry.${FIELDS.br.entryId}`, saved.br);
  }
  if (saved.ramal) {
    params.set(`entry.${FIELDS.ramal.entryId}`, saved.ramal);
  }
  if (saved.motivo) {
    params.set(`entry.${FIELDS.motivo.entryId}`, saved.motivo);
  }

  return `${FORM_URL}?${params.toString()}`;
}

// Validação local antes de abrir o formulário.
function validateSaved(saved) {
  const issues = [];

  if (!saved.br || saved.br.trim() === "") {
    issues.push(FIELDS.br.label);
  }
  if (!saved.ramal || saved.ramal.trim() === "") {
    issues.push(FIELDS.ramal.label);
  }
  if (!saved.motivo || !MOTIVOS.includes(saved.motivo)) {
    issues.push(FIELDS.motivo.label);
  }

  return issues;
}

// --- In-page prefill helpers ---

// Converte um texto livre em valor de data YYYY-MM-DD se possível.
// Se não detectar data válida, retorna null.
function parseDateValue(raw) {
  const s = String(raw ?? "").trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2]}-${iso[3]}`;
  }
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const m = String(Number(mdy[1])).padStart(2, "0");
    const d = String(Number(mdy[2])).padStart(2, "0");
    return `${mdy[3]}-${m}-${d}`;
  }
  return null;
}

// Converte um texto livre em valor dehora HH:MM se possível.
function parseTimeValue(raw) {
  const s = String(raw ?? "").trim();
  const h12 = s.match(/^(\d{1,2})\s*(?:[.:hH]*)\s*(am|pm)?$/i);
  const h24 = s.match(/^(\d{1,2})[:.](\d{2})$/);
  if (h24) {
    let h = Number(h24[1]);
    const m = Number(h24[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  if (h12) {
    let h = Number(h12[1]);
    const meridiem = (h12[2] || "").toLowerCase();
    if (h >= 1 && h <= 12) {
      if (meridiem === "pm" && h !== 12) h += 12;
      if (meridiem === "am" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:00`;
    }
  }
  return null;
}

// Tenta definir valor num input simples.
function prefillField(el, value) {
  if (!el || !el.value !== undefined) {
    return false;
  }
  if (el.readOnly || el.disabled) {
    return false;
  }
  const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (nativeSetter) {
    nativeSetter.call(el, value);
  } else {
    el.value = value;
  }
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

// Tenta preencher um campo de texto livre.
function fillFreeText(entryId) {
  const field = chooseFieldFromEntryId(entryId);
  if (!field) return null;
  const value = field.value;
  if (!value) return { filled: false, reason: "sem valor" };
  return prefillField(field.el, value)
    ? { filled: true, value }
    : { filled: false, reason: "campo não escrevível" };
}

// Tenta preencher um campo de data.
// Num formulário real pode vir em múltiplos inputs; aqui tentamos primeiro o
// campo único, e se não conseguir, regista falha controlada.
function fillDate(entryId) {
  const iso = todayISO();
  const field = chooseFieldFromEntryId(entryId);
  if (!field) return null;
  return prefillField(field.el, iso)
    ? { filled: true, value: iso }
    : { filled: false, reason: "campo de data não escrevível" };
}

// Tenta preencher um campo de hora.
function fillTime(entryId) {
  const iso = nowTimeISO();
  const field = chooseFieldFromEntryId(entryId);
  if (!field) return null;
  return prefillField(field.el, iso)
    ? { filled: true, value: iso }
    : { filled: false, reason: "campo de hora não escrevível" };
}

// Tenta marcar uma escolha por entry id.
// Quando o campo usa <input>/<select> simples, tentamos valor direto.
// Quando usa botões de opção, tentamos o botão com name/value correspondente.
function fillChoice(entryId, selectedValue) {
  const field = chooseFieldFromEntryId(entryId);
  if (!field) return null;
  const el = field.el;
  if (!el) return { filled: false, reason: "campo não encontrado" };

  if (el.type === "select-one" || el.tagName === "SELECT") {
    if (el.disabled || el.readOnly) {
      return { filled: false, reason: "select bloqueado" };
    }
    if ([...el.options].some((o) => o.value === selectedValue)) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLSelectElement.prototype,
        "value"
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(el, selectedValue);
      } else {
        el.value = selectedValue;
      }
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return { filled: true, value: selectedValue };
    }
    return { filled: false, reason: "opção não encontrada" };
  }

  if (el.type === "radio" || el.type === "checkbox") {
    if (el.disabled) {
      return { filled: false, reason: "opção bloqueada" };
    }
    if (el.value === selectedValue) {
      el.checked = true;
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return { filled: true, value: selectedValue };
    }
  }

  const candidates = document.querySelectorAll(
    `[name="${CSS.escape(el.name)}"]`
  );
  for (const candidate of candidates) {
    if (
      candidate.type === "radio" &&
      candidate.value === selectedValue &&
      !candidate.disabled
    ) {
      candidate.checked = true;
      candidate.dispatchEvent(new Event("change", { bubbles: true }));
      return { filled: true, value: selectedValue };
    }
  }

  return { filled: false, reason: "opção não encontrada" };
}

// Devolve o primeiro elemento associado a um entry id, se a página parecer
// um formulário compatível.
function chooseFieldFromEntryId(entryId) {
  const escaped = CSS.escape(entryId);

  let el = document.querySelector(
    `input[name="${escaped}"], textarea[name="${escaped}"], select[name="${escaped}"]`
  );
  if (el) return { el, value: el.value };

  // Fallback para campos renderizados com atributo RDFQuery ou similares.
  el = document.querySelector(
    `[data-rdf="${escaped}"], [name="${escaped}" i]`
  );
  if (el) return { el, value: el.value };

  return null;
}

// Detecta se a página atual parece ser o formulário alvo.
function findFormPage() {
  if (!FORM_HOST_PATTERN.test(location.href)) {
    return null;
  }

  const found = {};
  for (const [key, field] of Object.entries(FIELDS)) {
    const match = chooseFieldFromEntryId(field.entryId);
    if (match) {
      found[key] = match;
    }
  }

  return {
    url: location.href,
    fields: found,
    detected: Object.keys(found).length,
  };
}

// Tenta preencher a página atual com os dados guardados.
function prefillFromSaved(saved) {
  const page = findFormPage();
  if (!page) {
    return {
      ok: false,
      reason: "página não é o formulário alvo",
      detected: 0,
    };
  }

  const results = {
    br: fillFreeText(FIELDS.br.entryId),
    ramal: fillFreeText(FIELDS.ramal.entryId),
    data: fillDate(FIELDS.data.entryId),
    horario: fillTime(FIELDS.horario.entryId),
    motivo: fillChoice(FIELDS.motivo.entryId, saved.motivo),
  };

  const ok = page.detected > 0;
  return {
    ok,
    reason: ok ? "preenchimento iniciado na página aberta" : "página insuficiente para preencher",
    page,
    results,
  };
}

// Exporta tudo que o resto da extensão pode usar.
window.PRE = {
  FORM_URL,
  FORM_HOST_PATTERN,
  FIELDS,
  MOTIVOS,
  STORAGE_KEY,
  todayISO,
  nowTimeISO,
  buildPrefillUrl,
  validateSaved,
  parseDateValue,
  parseTimeValue,
  prefillField,
  fillFreeText,
  fillDate,
  fillTime,
  fillChoice,
  chooseFieldFromEntryId,
  findFormPage,
  prefillFromSaved,
};
