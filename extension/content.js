// content.js
//
// Comporta-se apenas em páginas onde é injetado.
// - REPORT_STATE: responde com a deteção do formulário alvo.
// - PREFILL: tenta preencher os campos usando os dados recebidos.
//
(() => {
  "use strict";

  function reportFormStatus() {
    const page = window.PRE && window.PRE.findFormPage
      ? window.PRE.findFormPage()
      : null;

    const detected = page ? page.detected : 0;
    chrome.runtime.sendMessage({
      type: "PRE:DETECTED",
      detected,
      url: page ? page.url : null,
    }).catch(() => {});
  }

  function handlePrefill(message) {
    if (message.type !== "PRE:PREFILL" || !message.payload) {
      return;
    }

    const saved = message.payload;
    const page = window.PRE && window.PRE.findFormPage
      ? window.PRE.findFormPage()
      : null;

    let outcome;
    if (!page) {
      outcome = { ok: false, reason: "página não é o formulário alvo" };
    } else {
      const results = {
        br: window.PRE.fillFreeText
          ? window.PRE.fillFreeText(window.PRE.FIELDS.br.entryId)
          : null,
        ramal: window.PRE.fillFreeText
          ? window.PRE.fillFreeText(window.PRE.FIELDS.ramal.entryId)
          : null,
        data: window.PRE.fillDate
          ? window.PRE.fillDate(window.PRE.FIELDS.data.entryId)
          : null,
        horario: window.PRE.fillTime
          ? window.PRE.fillTime(window.PRE.FIELDS.horario.entryId)
          : null,
        motivo: window.PRE.fillChoice
          ? window.PRE.fillChoice(
              window.PRE.FIELDS.motivo.entryId,
              saved.motivo
            )
          : null,
      };

      const filledCount = [
        results.br,
        results.ramal,
        results.data,
        results.horario,
        results.motivo,
      ].filter((r) => r && r.filled).length;

      outcome = {
        ok: filledCount > 0,
        reason: filledCount > 0
          ? `preenchida com ${filledCount} campo(s)`
          : "nenhum campo foi preenchido",
        results,
      };
    }

    console.log("[preenche] prefill outcome:", outcome);

    chrome.runtime.sendMessage({
      type: "PRE:PREFILL_RESULT",
      outcome,
    }).catch(() => {});
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "PRE:DETECT") {
      reportFormStatus();
      return true;
    }
    if (message.type === "PRE:PREFILL") {
      handlePrefill(message);
      return true;
    }
  });

  if (document.readyState === "complete" || document.body) {
    reportFormStatus();
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      reportFormStatus,
      { once: true }
    );
  }
})();
