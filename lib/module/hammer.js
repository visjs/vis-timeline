/**
 * Setup a mock hammer.js object, for unit testing.
 *
 * Inspiration: https://github.com/uber/deck.gl/pull/658
 *
 * @returns {{on: noop, off: noop, destroy: noop, emit: noop, get: get}}
 */
function hammerMock() {
  const noop = () => {};

  return {
    on: noop,
    off: noop,
    destroy: noop,
    emit: noop,

    get(m) {	//eslint-disable-line no-unused-vars
      return {
        set: noop
      };
    }
  };
}


if (typeof window !== 'undefined') {
  const propagating = require('propagating-hammerjs');
  const Hammer = window['Hammer'] || require('hammerjs');
  module.exports = propagating(Hammer, {
    preventDefault: 'mouse'
  });
}
else {
  module.exports = () => // hammer.js is only available in a browser, not in node.js. Replacing it with a mock object.
  hammerMock()
}
