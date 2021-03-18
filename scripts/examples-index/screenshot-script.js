/* global window: false */

/**
 * Simulates confirmation usind window.confirm and window.alert otherwise the
 * screenshot generator would just hang forever.
 */
(() => {
  window.alert = function() {};
  window.confirm = function() {
    return true;
  };
})();
