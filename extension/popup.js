document.addEventListener("DOMContentLoaded", () => {
  const brInput = document.getElementById("br");
  const ramalInput = document.getElementById("ramal");
  const motivoSelect = document.getElementById("motivo");
  const dataValue = document.getElementById("data");
  const horarioValue = document.getElementById("horario");
  const saveButton = document.getElementById("save");
  const prefillButton = document.getElementById("prefillActive");
  const openButton = document.getElementById("open");
  const statusEl = document.getElementById("status");
  const formStatusEl = document.getElementById("formStatus");

  // Preenche as opções de motivo vindas do config.
  PRE.MOTIVOS.forEach((motivo) => {
    const option = document.createElement("option");
    option.value = motivo;
    option.textContent = motivo;
    motivoSelect.appendChild(option);
  });

  // Mostra data e horário calculados em tempo real.
  function refreshReadouts() {
    dataValue.textContent = PRE.todayISO();
    horarioValue.textContent = PRE.nowTimeISO();
  }
  refreshReadouts();
  setInterval(refreshReadouts, 1000);

  // Carrega o que estava guardado, se existir.
  async function loadSaved() {
    try {
      const raw = await chrome.storage.local.get(PRE.STORAGE_KEY);
      const saved = raw[PRE.STORAGE_KEY] || null;

      if (saved && typeof saved === "object") {
        if (typeof saved.br === "string") brInput.value = saved.br;
        if (typeof saved.ramal === "string") ramalInput.value = saved.ramal;
        if (typeof saved.motivo === "string" && PRE.MOTIVOS.includes(saved.motivo)) {
          motivoSelect.value = saved.motivo;
        }
      }
    } catch (err) {
      setStatus("Não foi possível carregar os dados guardados.", "error");
    }
  }
  loadSaved();

  // Verifica se a página atual já é o formulário alvo.
  async function detectFormTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      formStatusEl.textContent = "Não há aba ativa.";
      formStatusEl.className = "form-status";
      return;
    }

    // Se o popup não tem acesso direto à página, use o content script.
    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: "PRE:DETECT" });
      if (result && result.type === "PRE:DETECTED") {
        formStatusEl.textContent = `Formulário detectado: ${result.detected} campo(s) compatível(eis).`;
        formStatusEl.className = "form-status ok";
        prefillButton.disabled = false;
        return;
      }
    } catch (err) {
      // Se não conseguir comunicar com a página, assume estado neutro.
    }

    formStatusEl.textContent = "Abra o formulário do Google Forms nesta aba.";
    formStatusEl.className = "form-status";
    prefillButton.disabled = true;
  }
  detectFormTab();

  function setStatus(message, kind) {
    statusEl.textContent = message;
    statusEl.className = "status" + (kind ? ` ${kind}` : "");
  }

  function captureForm() {
    const br = brInput.value.trim();
    const ramal = ramalInput.value.trim();
    const motivo = motivoSelect.value;

    return { br, ramal, motivo };
  }

  // Guarda os dados atuais como “preferidos para reutilizar”.
  saveButton.addEventListener("click", async () => {
    const form = captureForm();

    if (!form.br && !form.ramal && !form.motivo) {
      setStatus("Guarda algo antes de tentar preencher.", "error");
      return;
    }

    try {
      await chrome.storage.local.set({
        [PRE.STORAGE_KEY]: {
          br: form.br,
          ramal: form.ramal,
          motivo: form.motivo,
        },
      });
      setStatus("Dados guardados para reutilizar.", "ok");
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      setStatus("Não foi possível guardar os dados.", "error");
    }
  });

  // Envia os dados guardados para o content script na aba aberta.
  prefillButton.addEventListener("click", async () => {
    const form = captureForm();

    if (!form.br && !form.ramal && !form.motivo) {
      setStatus("Guarda pelo menos um campo antes de preencher.", "error");
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      setStatus("Não há aba ativa.", "error");
      return;
    }

    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "PRE:PREFILL",
        payload: {
          br: form.br,
          ramal: form.ramal,
          motivo: form.motivo,
        },
      });
      setStatus("Pedimos preenchimento à página aberta.", "ok");
      setTimeout(() => setStatus(""), 2500);
    } catch (err) {
      setStatus("Não foi possível comunicar com a página aberta.", "error");
    }
  });

  // Abre o Google Forms publicado.
  openButton.addEventListener("click", async () => {
    const form = captureForm();

    await chrome.storage.local.set({
      [PRE.STORAGE_KEY]: {
        br: form.br,
        ramal: form.ramal,
        motivo: form.motivo,
      },
    });

    const issues = PRE.validateSaved(form);
    if (issues.length > 0) {
      setStatus(`Falta(m): ${issues.join(", ")}.`, "error");
      return;
    }

    const url = PRE.buildPrefillUrl(form);
    await chrome.tabs.create({ url, active: true });
  });
});
