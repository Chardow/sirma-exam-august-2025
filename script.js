/**
 * App Module
 * Използваме Module Pattern, за бонус точките ;)
 */
const App = (() => {

  const init = () => {
    console.log("Приложението е инициализирано!");
    // Те тука ще "слушаме" какво се случва
  };

  // Връщаме обект, който излага функцията `init` като публична.
  return {
    init
  };

})();

// Викаме App.init(), когато DOM е зареден.
document.addEventListener('DOMContentLoaded', App.init);