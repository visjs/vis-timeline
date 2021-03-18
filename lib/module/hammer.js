import PropagatingHammer from 'propagating-hammerjs';
import Hammer from '@egjs/hammerjs';

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

let modifiedHammer

if (typeof window !== 'undefined') {
  const OurHammer = window['Hammer'] || Hammer;
  modifiedHammer = PropagatingHammer(OurHammer, {
    preventDefault: 'mouse'
  });
} else {
  modifiedHammer = () => // hammer.js is only available in a browser, not in node.js. Replacing it with a mock object.
  hammerMock()
}

export default modifiedHammer;
