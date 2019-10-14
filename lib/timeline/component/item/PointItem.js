import Item from './Item';

/**
 * @constructor PointItem
 * @extends Item
 */
class PointItem extends Item {
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
        top: 0,
        width: 0,
        height: 0
      },
      content: {
        height: 0,
        marginLeft: 0,
        marginRight: 0
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
    const widthInMs = this.width * range.getMillisecondsPerPixel();
    
    return (this.data.start.getTime() + widthInMs > range.start ) && (this.data.start < range.end);
  }

  /**
   * create DOM element
   * @private
   */
  _createDomElement() {
    if (!this.dom) {
      // create DOM
      this.dom = {};

      // background box
      this.dom.point = document.createElement('div');
      // className is updated in redraw()

      // contents box, right from the dot
      this.dom.content = document.createElement('div');
      this.dom.content.className = 'vis-item-content';
      this.dom.point.appendChild(this.dom.content);

      // dot at start
      this.dom.dot = document.createElement('div');
      this.dom.point.appendChild(this.dom.dot);

      // attach this item as attribute
      this.dom.point['vis-item'] = this;

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
    if (!this.dom.point.parentNode) {
      const foreground = this.parent.dom.foreground;
      if (!foreground) {
        throw new Error('Cannot redraw item: parent has no foreground container element');
      }
      foreground.appendChild(this.dom.point);
    }
    this.displayed = true;
  }

  /**
   * update dirty DOM components
   * @private
   */
  _updateDirtyDomComponents() {
    // An item is marked dirty when:
    // - the item is not yet rendered
    // - the item's data is changed
    // - the item is selected/deselected
    if (this.dirty) {
      this._updateContents(this.dom.content);
      this._updateDataAttributes(this.dom.point);
      this._updateStyle(this.dom.point);

      const editable = (this.editable.updateTime || this.editable.updateGroup);
      // update class
      const className = (this.data.className ? ' ' + this.data.className : '') +
          (this.selected ? ' vis-selected' : '') +
          (editable ? ' vis-editable' : ' vis-readonly');
      this.dom.point.className  = `vis-item vis-point${className}`;
      this.dom.dot.className  = `vis-item vis-dot${className}`;
    }
  }

  /**
   * get DOM component sizes
   * @return {object}
   * @private
   */
  _getDomComponentsSizes() {
    return {
      dot:  {
        width: this.dom.dot.offsetWidth,
        height: this.dom.dot.offsetHeight
      },
      content: {
        width: this.dom.content.offsetWidth,
        height: this.dom.content.offsetHeight
      },
      point: {
        width: this.dom.point.offsetWidth,
        height: this.dom.point.offsetHeight
      }
    }
  }

  /**
   * update DOM components sizes
   * @param {array} sizes
   * @private
   */
  _updateDomComponentsSizes(sizes) {
    // recalculate size of dot and contents
    this.props.dot.width = sizes.dot.width;
    this.props.dot.height = sizes.dot.height;
    this.props.content.height = sizes.content.height;

    // resize contents
    if (this.options.rtl) {
      this.dom.content.style.marginRight = `${2 * this.props.dot.width}px`;
    } else {
      this.dom.content.style.marginLeft = `${2 * this.props.dot.width}px`;
    }
    //this.dom.content.style.marginRight = ... + 'px'; // TODO: margin right

    // recalculate size
    this.width = sizes.point.width;
    this.height = sizes.point.height;

    // reposition the dot
    this.dom.dot.style.top = `${(this.height - this.props.dot.height) / 2}px`;
    if (this.options.rtl) {
      this.dom.dot.style.right = `${this.props.dot.width / 2}px`;
    } else {
      this.dom.dot.style.left = `${this.props.dot.width / 2}px`;
    }

    this.dirty = false;
  }

  /**
   * Repain DOM additionals
   * @private
   */
  _repaintDomAdditionals() {
    this._repaintOnItemUpdateTimeTooltip(this.dom.point);
    this._repaintDragCenter();
    this._repaintDeleteButton(this.dom.point);
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
      if (this.dom.point.parentNode) {
        this.dom.point.parentNode.removeChild(this.dom.point);
      }

      this.displayed = false;
    }
  }

  /**
   * Reposition the item horizontally
   * @Override
   */
  repositionX() {
    const start = this.conversion.toScreen(this.data.start);

    if (this.options.rtl) {
      this.right = start - this.props.dot.width;

      // reposition point
      this.dom.point.style.right = `${this.right}px`;
    } else {
      this.left = start - this.props.dot.width;

      // reposition point
      this.dom.point.style.left = `${this.left}px`;
    }
  }

  /**
   * Reposition the item vertically
   * @Override
   */
  repositionY() {
    const orientation = this.options.orientation.item;
    const point = this.dom.point;
    if (orientation == 'top') {
      point.style.top = `${this.top}px`;
    }
    else {
      point.style.top = `${this.parent.height - this.top - this.height}px`;
    }
  }

  /**
   * Return the width of the item left from its start date
   * @return {number}
   */
  getWidthLeft() {
    return this.props.dot.width;
  }

  /**
   * Return the width of the item right from  its start date
   * @return {number}
   */
  getWidthRight() {
    return this.props.dot.width;
  }
}

export default PointItem;
