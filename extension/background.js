// background.js
//
// Mantém os dados do formulário em chrome.storage.local e disponível ao
// popup. Neste momento, o popup lê e escreve diretamente, mas centralizar
// aqui evita derivas caso se adicione sincronização ou validação global.
//
chrome.runtime.onInstalled.addListener(() => {
  // Garante que a chave base existe, sem apagar o que já estiver guardado.
  chrome.storage.local.get("preencheForm", () => {});
});
