// content.js
//
// v1: a extensão não injeta comportamento no Google Forms automaticamente.
// O fluxo principal é o popup, que abre a URL de prefill e/ou a URL pública.
//
// Este ficheiro fica preparado para ser ativado no futuro, caso se decida
// detectar a página do formulário ou fazer alguma validação visual внутри
// da página. Por enquanto, só regista se for carregado.
//
(() => {
  if (document.body) {
    console.log("[preenche] content script carregado na página:", location.href);
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        console.log("[preenche] content script carregado na página:", location.href);
      },
      { once: true }
    );
  }
})();
