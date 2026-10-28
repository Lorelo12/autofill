document.addEventListener("DOMContentLoaded", () => {
  const brInput = document.getElementById("br");
  const ramalInput = document.getElementById("ramal");
  const motivoSelect = document.getElementById("motivo");
  const dataValue = document.getElementById("data");
  const horarioValue = document.getElementById("horario");
  const saveButton = document.getElementById("save");
  const openButton = document.getElementById("open");
  const statusEl = document.getElementById("status");

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

    // Aceita guardar mesmo sem motivo, mas avisa que o formulário não
    // abrirá com prefill completo nesse estado.
    if (!form.br && !form.ramal && !form.motivo) {
      setStatus("Guarda algo antes de tentar abrir o formulário.", "error");
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

  // Abre o Google Forms.
  // - Se houver dados suficientes guardados, abre a URL de prefill.
  // - Se não, abre o formulário normal e deixa o usuário preencher.
  openButton.addEventListener("click", async () => {
    const form = captureForm();

    // Salva o que foi inserido agora, para reutilizar na próxima vez.
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
    const tab = await chrome.tabs.create({ url, active: true });
  });
});
