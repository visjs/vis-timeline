import Item from './Item';
import util from '../../../util';

/**
 * ClusterItem
 */
class ClusterItem extends Item {
  /**
 * @constructor Item
 * @param {Object} data             Object containing (optional) parameters type,
 *                                  start, end, content, group, className.
 * @param {{toScreen: function, toTime: function}} conversion
 *                                  Conversion functions from time to screen and vice versa
 * @param {Object} options          Configuration options
 *                                  // TODO: describe available options
 */
  constructor(data, conversion, options) {
    const modifiedOptions = Object.assign({}, {fitOnDoubleClick: true}, options, {editable: false});
    super(data, conversion, modifiedOptions);

    this.props = {
      content: {
        width: 0,
        height: 0
      },
    };
    
    if (!data || data.uiItems == undefined) {
      throw new Error('Property "uiItems" missing in item ' + data.id);
    }
  
    this.id = util.randomUUID();
    this.group = data.group;
    this._setupRange();
  
    this.emitter = this.data.eventEmitter;
    this.range = this.data.range;
    this.attached = false;
    this.isCluster = true;
    this.data.isCluster = true;
  }

  /**
   * check if there are items
   * @return {boolean}
   */
  hasItems() {
    return this.data.uiItems && this.data.uiItems.length && this.attached;
  }
  
  /**
   * set UI items
   * @param {array} items
   */
  setUiItems(items) {
    this.detach();
  
    this.data.uiItems = items;
  
    this._setupRange();
  
    this.attach();
  }
  
  /**
   * check is visible
   * @param {object} range
   * @return {boolean}
   */
  isVisible(range) {
    const rangeWidth = this.data.end ? this.data.end - this.data.start : 0;
    const widthInMs = this.width * range.getMillisecondsPerPixel();
    const end = Math.max(rangeWidth, this.data.start.getTime() + widthInMs);
    return (this.data.start < range.end) && (end > range.start) && this.hasItems();
  }
  
  /**
   * get cluster data
   * @return {object}
   */
  getData() {
    return {
      isCluster: true,
      id: this.id,
      items: this.data.items || [],
      data: this.data
    }
  }
  
  /**
   * redraw cluster item
   * @param {boolean} returnQueue
   * @return {boolean}
   */
  redraw (returnQueue) {
    var sizes
    var queue = [
      // create item DOM
      this._createDomElement.bind(this),
  
      // append DOM to parent DOM
      this._appendDomElement.bind(this),
  
      // update dirty DOM
      this._updateDirtyDomComponents.bind(this),
  
      (function () {
        if (this.dirty) {
          sizes = this._getDomComponentsSizes();
        }
      }).bind(this),
  
      (function () {
        if (this.dirty) {
          this._updateDomComponentsSizes.bind(this)(sizes);
        }
      }).bind(this),
  
      // repaint DOM additionals
      this._repaintDomAdditionals.bind(this)
    ];
  
    if (returnQueue) {
      return queue;
    } else {
      var result;
      queue.forEach(function (fn) {
        result = fn();
      });
      return result;
    }
  }
  
  /**
   * show cluster item
   */
  show() {
    if (!this.displayed) {
      this.redraw();
    }
  }
  
  /**
   * Hide the item from the DOM (when visible)
   */
  hide() {
    if (this.displayed) {
      var dom = this.dom;
      if (dom.box.parentNode) {
        dom.box.parentNode.removeChild(dom.box);
      }

      if (this.options.showStipes) {
        if (dom.line.parentNode)  {
          dom.line.parentNode.removeChild(dom.line);
        }
        if (dom.dot.parentNode)  {
          dom.dot.parentNode.removeChild(dom.dot);
        }
      }
      this.displayed = false;
    }
  }
  
  /**
   * reposition item x axis
   */
  repositionX() {
    let start = this.conversion.toScreen(this.data.start);
    let end = this.data.end ? this.conversion.toScreen(this.data.end) : 0;
    if (end) {
      this.repositionXWithRanges(start, end);
    } else {
      let align = this.data.align === undefined ? this.options.align : this.data.align;
      this.repositionXWithoutRanges(start, align);
    }
  
    if (this.options.showStipes) {
      this.dom.line.style.display = this._isStipeVisible() ? 'block' : 'none';
      this.dom.dot.style.display = this._isStipeVisible() ? 'block' : 'none';

      if (this._isStipeVisible()) {
        this.repositionStype(start, end);
      }
    }
  }

  /**
   * reposition item stype
   * @param {date} start
   * @param {date} end
   */
  repositionStype(start, end) {
    this.dom.line.style.display = 'block';
    this.dom.dot.style.display = 'block';
    const lineOffsetWidth = this.dom.line.offsetWidth;
    const dotOffsetWidth = this.dom.dot.offsetWidth;

    if (end) {
      const lineOffset = lineOffsetWidth + start + (end - start) / 2;
      const dotOffset = lineOffset - dotOffsetWidth / 2;
      const lineOffsetDirection = this.options.rtl ? lineOffset * -1 : lineOffset;
      const dotOffsetDirection = this.options.rtl ? dotOffset * -1 : dotOffset;

      this.dom.line.style.transform = `translateX(${lineOffsetDirection})px`;
      this.dom.dot.style.transform = `translateX(${dotOffsetDirection}px)`;
    } else {
      const lineOffsetDirection = this.options.rtl ? start * -1 : start;
      const dotOffsetDirection = this.options.rtl ? (start - dotOffsetWidth / 2) * -1 : start - dotOffsetWidth / 2;

      this.dom.line.style.transform = `${lineOffsetDirection}px`;
      this.dom.dot.style.transform = `${dotOffsetDirection}px`;
    }
  }
  
  /**
   * reposition x without ranges
   * @param {date} start
   * @param {string} align
   */
  repositionXWithoutRanges(start, align) {
    // calculate left position of the box
    if (align == 'right') {
      if (this.options.rtl) {
        this.right = start - this.width;
  
        // reposition box, line, and dot
        this.dom.box.style.right = this.right + 'px';
      } else {
        this.left = start - this.width;
  
        // reposition box, line, and dot
        this.dom.box.style.left = this.left + 'px';
      }
    } else if (align == 'left') {
      if (this.options.rtl) {
        this.right = start;
  
        // reposition box, line, and dot
        this.dom.box.style.right = this.right + 'px';
      } else {
        this.left = start;
  
        // reposition box, line, and dot
        this.dom.box.style.left = this.left + 'px';
      }
    } else {
      // default or 'center'
      if (this.options.rtl) {
        this.right = start - this.width / 2;
  
        // reposition box, line, and dot
        this.dom.box.style.right = this.right + 'px';
      } else {
        this.left = start - this.width / 2;
  
        // reposition box, line, and dot
        this.dom.box.style.left = this.left + 'px';
      }
    }
  }
  
  /**
   * reposition x with ranges
   * @param {date} start
   * @param {date} end
   */
  repositionXWithRanges(start, end) {
    let boxWidth = Math.round(Math.max(end - start + 0.5, 1));
  
    if (this.options.rtl) {
      this.right = start;
    } else {
      this.left = start;
    }
  
    this.width = Math.max(boxWidth, this.minWidth || 0);
  
    if (this.options.rtl) {
      this.dom.box.style.right = this.right + 'px';
    } else {
      this.dom.box.style.left = this.left + 'px';
    }
  
    this.dom.box.style.width = boxWidth + 'px';
  }
  
  /**
   * reposition item y axis
   */
  repositionY() {
    var orientation = this.options.orientation.item;
    var box = this.dom.box;
    if (orientation == 'top') {
      box.style.top = (this.top || 0) + 'px';
    } else { 
      // orientation 'bottom'
      box.style.top = (this.parent.height - this.top - this.height || 0) + 'px';
    }
  
    if (this.options.showStipes) {
      if (orientation == 'top') {
        this.dom.line.style.top    = '0';
        this.dom.line.style.height = (this.parent.top + this.top + 1) + 'px';
        this.dom.line.style.bottom = '';
      }
      else { 
        // orientation 'bottom'
        var itemSetHeight = this.parent.itemSet.props.height;
        var lineHeight = itemSetHeight - this.parent.top - this.parent.height + this.top;
        this.dom.line.style.top    = (itemSetHeight - lineHeight) + 'px';
        this.dom.line.style.bottom = '0';
      }
    
      this.dom.dot.style.top = (-this.dom.dot.offsetHeight / 2) + 'px';
    }
  }

  /**
   * get width left
   * @return {number}
   */
  getWidthLeft() {
    return this.width / 2;
  }
  
  /**
   * get width right
   * @return {number}
   */
  getWidthRight() {
    return this.width / 2;
  }
  
  /**
   * move cluster item
   */
  move() {
    this.repositionX();
    this.repositionY();
  }
  
  /**
   * attach
   */
  attach() {
    for (let item of this.data.uiItems) {
      item.cluster = this;
    }
  
    this.data.items = this.data.uiItems.map(item => item.data);

    this.attached = true;
    this.dirty = true;
  }
  
  /**
   * detach
   * @param {boolean} detachFromParent
   * @return {void}
   */
  detach(detachFromParent = false) {
    if (!this.hasItems()) {
      return;
    }
  
    for (let item of this.data.uiItems) {
      delete item.cluster;
    }
  
    this.attached = false;
  
    if (detachFromParent && this.group) {
      this.group.remove(this);
      this.group = null;
    }
  
    this.data.items = [];
    this.dirty = true;
  }
  
  /**
   * handle on double click
   */
  _onDoubleClick() {
   this._fit();
  }
  
  /**
   * set range
   */
  _setupRange() {
    const stats = this.data.uiItems.map(item => ({
      start: item.data.start.valueOf(),
      end: item.data.end ? item.data.end.valueOf() : item.data.start.valueOf(),
    }));
  
    this.data.min = Math.min(...stats.map(s => Math.min(s.start, s.end || s.start)));
    this.data.max = Math.max(...stats.map(s => Math.max(s.start, s.end || s.start)));
    const centers = this.data.uiItems.map(item => item.center);
    const avg = centers.reduce((sum, value) => sum + value, 0) / this.data.uiItems.length;
  
    if (this.data.uiItems.some(item => item.data.end)) {
      // contains ranges
      this.data.start = new Date(this.data.min);
      this.data.end = new Date(this.data.max);
    } else {
      this.data.start = new Date(avg);
      this.data.end = null;
    }
  }
  
  /**
   * get UI items
   * @return {array}
   */
  _getUiItems() {
    if (this.data.uiItems && this.data.uiItems.length) {
      return this.data.uiItems.filter(item => item.cluster === this);
    }
  
    return [];
  }
  
  /**
   * create DOM element
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
  
      if (this.options.showStipes) {
        // line to axis
        this.dom.line = document.createElement('DIV');
        this.dom.line.className = 'vis-cluster-line';
        this.dom.line.style.display = 'none';
  
        // dot on axis
        this.dom.dot = document.createElement('DIV');
        this.dom.dot.className = 'vis-cluster-dot';
        this.dom.dot.style.display = 'none';
      }
  
      if (this.options.fitOnDoubleClick) {
        this.dom.box.ondblclick = ClusterItem.prototype._onDoubleClick.bind(this);
      }
      
      // attach this item as attribute
      this.dom.box['vis-item'] = this;
  
      this.dirty = true;
    }
  }
  
  /**
   * append element to DOM
   */
  _appendDomElement() {
    if (!this.parent) {
      throw new Error('Cannot redraw item: no parent attached');
    }
  
    if (!this.dom.box.parentNode) {
      const foreground = this.parent.dom.foreground;
      if (!foreground) {
        throw new Error('Cannot redraw item: parent has no foreground container element');
      }
  
      foreground.appendChild(this.dom.box);
    }
  
    const background = this.parent.dom.background;
  
    if (this.options.showStipes) {
      if (!this.dom.line.parentNode) {
        if (!background) throw new Error('Cannot redraw item: parent has no background container element');
        background.appendChild(this.dom.line);
      }
    
      if (!this.dom.dot.parentNode) {
        var axis = this.parent.dom.axis;
        if (!background) throw new Error('Cannot redraw item: parent has no axis container element');
        axis.appendChild(this.dom.dot);
      }
    }
  
    this.displayed = true;
  }
  
  /**
   * update dirty DOM components
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
  
      // update class
      const className = this.baseClassName + ' ' + (this.data.className ? ' ' + this.data.className : '') +
        (this.selected ? ' vis-selected' : '') + ' vis-readonly';
      this.dom.box.className = 'vis-item ' + className;
  
      if (this.options.showStipes) {
        this.dom.line.className = 'vis-item vis-cluster-line ' +  (this.selected ? ' vis-selected' : '');
        this.dom.dot.className  = 'vis-item vis-cluster-dot ' +  (this.selected ? ' vis-selected' : '');
      }
  
      if (this.data.end) {
        // turn off max-width to be able to calculate the real width
        // this causes an extra browser repaint/reflow, but so be it
        this.dom.content.style.maxWidth = 'none';
      }
    }
  }
  
  /**
   * get DOM components sizes
   * @return {object}
   */
  _getDomComponentsSizes() {
    return {
      previous: {
        right: this.dom.box.style.right,
        left: this.dom.box.style.left
      },
      box: {
        width: this.dom.box.offsetWidth,
        height: this.dom.box.offsetHeight
      },
    }
  }
  
  /**
   * update DOM components sizes
   * @param {object} sizes
   */
  _updateDomComponentsSizes(sizes) {
    if (this.options.rtl) {
      this.dom.box.style.right = "0px";
    } else {
      this.dom.box.style.left = "0px";
    }
  
    // recalculate size
    if (!this.data.end) {
      this.width = sizes.box.width;
    } else {
      this.minWidth = sizes.box.width;
    }
  
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
   * repaint DOM additional components
   */
  _repaintDomAdditionals() {
    this._repaintOnItemUpdateTimeTooltip(this.dom.box);
  }
  
  /**
   * check is stripe visible
   * @return {number}
   * @private
   */
  _isStipeVisible() {
    return this.minWidth >= this.width || !this.data.end;
  }
  
  /**
   * get fit range
   * @return {object}
   * @private
   */
  _getFitRange() {
    const offset = 0.05*(this.data.max - this.data.min) / 2;
      return {
        fitStart: this.data.min - offset,
        fitEnd: this.data.max + offset
      };
  }
  
   /**
   * fit
   * @private
   */
  _fit() {
    if (this.emitter) {
      const {fitStart, fitEnd} = this._getFitRange();
  
      const fitArgs = {
        start: new Date(fitStart),
        end: new Date(fitEnd),
        animation: true
      };
  
      this.emitter.emit('fit', fitArgs);
    }
  }

   /**
   * get item data
   * @return {object}
   * @private
   */
  _getItemData() {
    return this.data;
  }
}

ClusterItem.prototype.baseClassName = 'vis-item vis-range vis-cluster';
export default ClusterItem;
