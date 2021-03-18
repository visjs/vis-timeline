import util from '../../util';

/** Prototype for visual components */
export default class Component {
  /**
 * @param {{dom: Object, domProps: Object, emitter: Emitter, range: Range}} [body]
 * @param {Object} [options]
 */
  constructor(body, options) {  // eslint-disable-line no-unused-vars
    this.options = null;
    this.props = null;
  }

  /**
   * Set options for the component. The new options will be merged into the
   * current options.
   * @param {Object} options
   */
  setOptions(options) {
    if (options) {
      util.extend(this.options, options);
    }
  }

  /**
   * Repaint the component
   * @return {boolean} Returns true if the component is resized
   */
  redraw() {
    // should be implemented by the component
    return false;
  }

  /**
   * Destroy the component. Cleanup DOM and event listeners
   */
  destroy() {
    // should be implemented by the component
  }

  /**
   * Test whether the component is resized since the last time _isResized() was
   * called.
   * @return {Boolean} Returns true if the component is resized
   * @protected
   */
  _isResized() {
    const resized = (
      this.props._previousWidth !== this.props.width ||
      this.props._previousHeight !== this.props.height
    );

    this.props._previousWidth = this.props.width;
    this.props._previousHeight = this.props.height;

    return resized;
  }
}
