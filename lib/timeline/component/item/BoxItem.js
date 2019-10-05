import Item from './Item';

/**
 * @constructor BoxItem
 * @extends Item
 */
class BoxItem extends Item {
  /**
 * @param {Object} data             Object containing parameters start
 *                                  content, className.
 * @param {{toScreen: function, toTime: function}} conversion
 *                                  Conversion functions from time to screen and vice versa
 * @param {Object} [options]        Configuration options
 *                                  // TODO: describe available options
 */
  constructor(data, conversion, options) {
    super()
    this.props = {
      dot: {
        width: 0,
        height: 0
      },
      line: {
        width: 0,
        height: 0
      }
    };
    this.options = options;
    // validate data
    if (data) {
      if (data.start == undefined) {
        throw new Error(`Property "start" missing in item ${data}`);
      }
    }

    Item.call(this, data, conversion, options);
  }

  /**
   * Check whether this item is visible inside given range
   * @param {{start: number, end: number}} range with a timestamp for start and end
   * @returns {boolean} True if visible
   */
  isVisible(range) {
    if (this.cluster) {
      return false;
    }
    // determine visibility
    let isVisible;
    const align = this.data.align || this.options.align;
    const widthInMs = this.width * range.getMillisecondsPerPixel();

    if (align == 'right') {
      isVisible = (this.data.start.getTime() > range.start ) && (this.data.start.getTime() - widthInMs < range.end);
    }
    else if (align == 'left') {
      isVisible = (this.data.start.getTime() + widthInMs > range.start ) && (this.data.start.getTime() < range.end);
    }
    else {
      // default or 'center'
      isVisible = (this.data.start.getTime() + widthInMs/2 > range.start ) && (this.data.start.getTime() - widthInMs/2 < range.end);
    }
    return isVisible;
  }

   /**
   * create DOM element
   * @private
   */
  _createDomElement() {
    if (!this.dom) {
      // create DOM
      this.dom = {};

      // create main box
      this.dom.box = document.createElement('DIV');

      // contents box (inside the background box). used for making margins
      this.dom.content = document.createElement('DIV');
      this.dom.content.className = 'vis-item-content';
      this.dom.box.appendChild(this.dom.content);

      // line to axis
      this.dom.line = document.createElement('DIV');
      this.dom.line.className = 'vis-line';

      // dot on axis
      this.dom.dot = document.createElement('DIV');
      this.dom.dot.className = 'vis-dot';

      // attach this item as attribute
      this.dom.box['vis-item'] = this;

      this.dirty = true;
    }
  }

  /**
   * append DOM element
   * @private
   */
  _appendDomElement() {
    if (!this.parent) {
      throw new Error('Cannot redraw item: no parent attached');
    }
    if (!this.dom.box.parentNode) {
      const foreground = this.parent.dom.foreground;
      if (!foreground) throw new Error('Cannot redraw item: parent has no foreground container element');
      foreground.appendChild(this.dom.box);
    }
    if (!this.dom.line.parentNode) {
      var background = this.parent.dom.background;
      if (!background) throw new Error('Cannot redraw item: parent has no background container element');
      background.appendChild(this.dom.line);
    }
    if (!this.dom.dot.parentNode) {
      const axis = this.parent.dom.axis;
      if (!background) throw new Error('Cannot redraw item: parent has no axis container element');
      axis.appendChild(this.dom.dot);
    }
    this.displayed = true;
  }

  /**
   * update dirty DOM element
   * @private
   */
  _updateDirtyDomComponents() {
    // An item is marked dirty when:
    // - the item is not yet rendered
    // - the item's data is changed
    // - the item is selected/deselected
    if (this.dirty) {
      this._updateContents(this.dom.content);
      this._updateDataAttributes(this.dom.box);
      this._updateStyle(this.dom.box);

      const editable = (this.editable.updateTime || this.editable.updateGroup);

      // update class
      const className = (this.data.className? ' ' + this.data.className : '') +
          (this.selected ? ' vis-selected' : '') +
          (editable ? ' vis-editable' : ' vis-readonly');
      this.dom.box.className = `vis-item vis-box${className}`;
      this.dom.line.className = `vis-item vis-line${className}`;
      this.dom.dot.className  = `vis-item vis-dot${className}`;
    }
  }

  /**
   * get DOM components sizes
   * @return {object}
   * @private
   */
  _getDomComponentsSizes() {
    return {
      previous: {
        right: this.dom.box.style.right,
        left: this.dom.box.style.left
      },
      dot: {
        height: this.dom.dot.offsetHeight,
        width: this.dom.dot.offsetWidth
      },
      line: {
        width: this.dom.line.offsetWidth
      },
      box: {
        width: this.dom.box.offsetWidth,
        height: this.dom.box.offsetHeight
      }
    }
  }

  /**
   * update DOM components sizes
   * @param {object} sizes
   * @private
   */
  _updateDomComponentsSizes(sizes) {
    if (this.options.rtl) {
      this.dom.box.style.right = "0px";
    } else {
      this.dom.box.style.left = "0px";
    }

    // recalculate size
    this.props.dot.height = sizes.dot.height;
    this.props.dot.width = sizes.dot.width;
    this.props.line.width = sizes.line.width;
    this.width = sizes.box.width;
    this.height = sizes.box.height;

    // restore previous position
    if (this.options.rtl) {
      this.dom.box.style.right = sizes.previous.right;
    } else {
      this.dom.box.style.left = sizes.previous.left;
    }

    this.dirty = false;
  }

  /**
   * repaint DOM additionals
   * @private
   */
  _repaintDomAdditionals() {
    this._repaintOnItemUpdateTimeTooltip(this.dom.box);
    this._repaintDragCenter();
    this._repaintDeleteButton(this.dom.box);
  }

  /**
   * Repaint the item
   * @param {boolean} [returnQueue=false]  return the queue
   * @return {boolean} the redraw queue if returnQueue=true
   */
  redraw(returnQueue) {
    let sizes;
    const queue = [
      // create item DOM
      this._createDomElement.bind(this),

      // append DOM to parent DOM
      this._appendDomElement.bind(this),

      // update dirty DOM
      this._updateDirtyDomComponents.bind(this),

      () => {
        if (this.dirty) {
          sizes = this._getDomComponentsSizes();
        }
      },

      () => {
        if (this.dirty) {
          this._updateDomComponentsSizes.bind(this)(sizes);
        }
      },

      // repaint DOM additionals
      this._repaintDomAdditionals.bind(this)
    ];

    if (returnQueue) {
      return queue;
    } else {
      let result;
      queue.forEach(fn => {
        result = fn();
      });
      return result;
    }
  }

  /**
   * Show the item in the DOM (when not already visible). The items DOM will
   * be created when needed.
   * @param {boolean} [returnQueue=false]  whether to return a queue of functions to execute instead of just executing them
   * @return {boolean} the redraw queue if returnQueue=true
   */
  show(returnQueue) {
    if (!this.displayed) {
      return this.redraw(returnQueue);
    }
  }

  /**
   * Hide the item from the DOM (when visible)
   */
  hide() {
    if (this.displayed) {
      const dom = this.dom;

      if (dom.box.parentNode)   dom.box.parentNode.removeChild(dom.box);
      if (dom.line.parentNode)  dom.line.parentNode.removeChild(dom.line);
      if (dom.dot.parentNode)   dom.dot.parentNode.removeChild(dom.dot);

      this.displayed = false;
    }
  }

  /**
   * Reposition the item horizontally
   * @Override
   */
  repositionX() {
    const start = this.conversion.toScreen(this.data.start);
    const align = this.options.align;

    // calculate left position of the box
    if (align == 'right') {
      if (this.options.rtl) {
        this.right = start - this.width;

        // reposition box, line, and dot
        this.dom.box.style.right = `${this.right}px`;
        this.dom.line.style.right = `${start - this.props.line.width}px`;
        this.dom.dot.style.right = `${start - this.props.line.width / 2 - this.props.dot.width / 2}px`;
      } else {
        this.left = start - this.width;

        // reposition box, line, and dot
        this.dom.box.style.left = `${this.left}px`;
        this.dom.line.style.left = `${start - this.props.line.width}px`;
        this.dom.dot.style.left = `${start - this.props.line.width / 2 - this.props.dot.width / 2}px`;
      }
    }
    else if (align == 'left') {
      if (this.options.rtl) {
        this.right = start;

        // reposition box, line, and dot
        this.dom.box.style.right = `${this.right}px`;
        this.dom.line.style.right = `${start}px`;
        this.dom.dot.style.right = `${start + this.props.line.width / 2 - this.props.dot.width / 2}px`;
      } else {
        this.left = start;

        // reposition box, line, and dot
        this.dom.box.style.left = `${this.left}px`;
        this.dom.line.style.left = `${start}px`;
        this.dom.dot.style.left = `${start + this.props.line.width / 2 - this.props.dot.width / 2}px`;
      }
    }
    else {
      // default or 'center'
      if (this.options.rtl) {
        this.right = start - this.width / 2;

        // reposition box, line, and dot
        this.dom.box.style.right = `${this.right}px`;
        this.dom.line.style.right = `${start - this.props.line.width}px`;
        this.dom.dot.style.right = `${start - this.props.dot.width / 2}px`;
      } else {
        this.left = start - this.width / 2;

        // reposition box, line, and dot
        this.dom.box.style.left = `${this.left}px`;
        this.dom.line.style.left = `${start - this.props.line.width / 2}px`;
        this.dom.dot.style.left = `${start - this.props.dot.width / 2}px`;
      }
    }
  }

  /**
   * Reposition the item vertically
   * @Override
   */
  repositionY() {
    const orientation = this.options.orientation.item;
    const box = this.dom.box;
    const line = this.dom.line;
    const dot = this.dom.dot;

    if (orientation == 'top') {
      box.style.top     = `${this.top || 0}px`;

      line.style.top    = '0';
      line.style.height = `${this.parent.top + this.top + 1}px`;
      line.style.bottom = '';
    }
    else { // orientation 'bottom'
      const itemSetHeight = this.parent.itemSet.props.height; // TODO: this is nasty
      const lineHeight = itemSetHeight - this.parent.top - this.parent.height + this.top;

      box.style.top     = `${this.parent.height - this.top - this.height || 0}px`;
      line.style.top    = `${itemSetHeight - lineHeight}px`;
      line.style.bottom = '0';
    }

    dot.style.top = `${-this.props.dot.height / 2}px`;
  }

  /**
   * Return the width of the item left from its start date
   * @return {number}
   */
  getWidthLeft() {
    return this.width / 2;
  }

  /**
   * Return the width of the item right from its start date
   * @return {number}
   */
  getWidthRight() {
    return this.width / 2;
  }
}

export default BoxItem;
