/**
 * Set up mock 2D context, for usage in unit tests.
 *
 * Adapted from: https://github.com/Cristy94/canvas-mock
 */
import jsdom from 'jsdom'
import jsdom_global from 'jsdom-global'

/**
 * Initialize the mock, jsdom and jsdom_global for unit test usage.
 *
 * Suppresses a warning from `jsdom` on usage of `getContext()`. A mock definition is added for
 * it, so the message is not relevant.
 *
 * @param {string} [html='']  html definitions which should be added to the jsdom definition
 * @returns {function}  function to call in after(), to clean up for `jsdom_global`
 */
const mockify = (html = '') => {
  // Start of message that we want to suppress.
  let getContextErrorMsg = 'Error: Not implemented: HTMLCanvasElement.prototype.getContext'
    + ' (without installing the canvas npm package)';

  // Override default virtual console of jsdom
  const virtualConsole = new jsdom.VirtualConsole();

  // Set up a simple 'mock' console output. Only 'error' needs to be overridden
  let myConsole = {
    error: (msg) => {
      if (msg.indexOf(getContextErrorMsg) === 0) {
        //console.error('all is well');
      } else {
        // All other messages pass through
        console.error(msg);
      }
    }
  };

  // Using the global catch instead of specific event handler, because I couldn't get them to work
	virtualConsole.sendTo(myConsole);

  let cleanupFunction = jsdom_global(
    html,
    { skipWindowCheck: true, virtualConsole: virtualConsole}
  );

  return cleanupFunction;
}


export default mockify
