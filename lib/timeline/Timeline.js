import moment from '../module/moment';
import util, { typeCoerceDataSet, isDataViewLike } from '../util';
import { DataSet, DataView } from 'vis-data/esnext';
import Range from './Range';
import Core from './Core';
import TimeAxis from './component/TimeAxis';
import CurrentTime from './component/CurrentTime';
import CustomTime from './component/CustomTime';
import ItemSet from './component/ItemSet';

import { Validator } from '../shared/Validator';
import { printStyle } from '../shared/Validator';
import { allOptions } from './optionsTimeline';
import { configureOptions } from './optionsTimeline';

import Configurator from '../shared/Configurator';

/**
 * Create a timeline visualization
 * @extends Core
 */
export default class Timeline extends Core {
  /**
 * @param {HTMLElement} container
 * @param {vis.DataSet | vis.DataView | Array} [items]
 * @param {vis.DataSet | vis.DataView | Array} [groups]
 * @param {Object} [options]  See Timeline.setOptions for the available options.
 * @constructor Timeline
 */
  constructor(container, items, groups, options) {
    super()
    this.initTime = new Date();
    this.itemsDone = false;

    if (!(this instanceof Timeline)) {
      throw new SyntaxError('Constructor must be called with the new operator');
    }

    // if the third element is options, the forth is groups (optionally);
    if (!(Array.isArray(groups) || isDataViewLike(groups)) && groups instanceof Object) {
      const forthArgument = options;
      options = groups;
      groups = forthArgument;
    }

    // TODO: REMOVE THIS in the next MAJOR release
    // see https://github.com/almende/vis/issues/2511
    if (options && options.throttleRedraw) {
      console.warn("Timeline option \"throttleRedraw\" is DEPRICATED and no longer supported. It will be removed in the next MAJOR release.");
    }

    const me = this;
    this.defaultOptions = {
      autoResize: true,
      longSelectPressTime: 251,
      orientation: {
        axis: 'bottom',   // axis orientation: 'bottom', 'top', or 'both'
        item: 'bottom'    // not relevant
      },
      moment,
    };
    this.options = util.deepExtend({}, this.defaultOptions);
    options && util.setupXSSProtection(options.xss);

    // Create the DOM, props, and emitter
    this._create(container);
    if (!options || (options && typeof options.rtl == "undefined")) {
      this.dom.root.style.visibility = 'hidden';
      let directionFromDom;
      let domNode = this.dom.root;
      while (!directionFromDom && domNode) {
        directionFromDom = window.getComputedStyle(domNode, null).direction;
        domNode = domNode.parentElement;
      }
      this.options.rtl = (directionFromDom && (directionFromDom.toLowerCase() == "rtl"));
    } else {
      this.options.rtl = options.rtl;
    }

    if (options) {
      if (options.rollingMode) { this.options.rollingMode = options.rollingMode; }
      if (options.onInitialDrawComplete) { this.options.onInitialDrawComplete = options.onInitialDrawComplete; }
      if (options.onTimeout) { this.options.onTimeout = options.onTimeout; }
      if (options.loadingScreenTemplate) { this.options.loadingScreenTemplate = options.loadingScreenTemplate; }
    }

    // Prepare loading screen
    const loadingScreenFragment = document.createElement('div');
    if (this.options.loadingScreenTemplate) {
      const templateFunction = this.options.loadingScreenTemplate.bind(this);
      const loadingScreen = templateFunction(this.dom.loadingScreen);
      if ((loadingScreen instanceof Object) && !(loadingScreen instanceof Element)) {
        templateFunction(loadingScreenFragment)
      } else {
        if (loadingScreen instanceof Element) {
          loadingScreenFragment.innerHTML = '';
          loadingScreenFragment.appendChild(loadingScreen);
        }
        else if (loadingScreen != undefined) {
          loadingScreenFragment.innerHTML = util.xss(loadingScreen);
        }
      }
    }
    this.dom.loadingScreen.appendChild(loadingScreenFragment);

    // all components listed here will be repainted automatically
    this.components = [];

    this.body = {
      dom: this.dom,
      domProps: this.props,
      emitter: {
        on: this.on.bind(this),
        off: this.off.bind(this),
        emit: this.emit.bind(this)
      },
      hiddenDates: [],
      util: {
        getScale() {
          return me.timeAxis.step.scale;
        },
        getStep() {
          return me.timeAxis.step.step;
        },

        toScreen: me._toScreen.bind(me),
        toGlobalScreen: me._toGlobalScreen.bind(me), // this refers to the root.width
        toTime: me._toTime.bind(me),
        toGlobalTime : me._toGlobalTime.bind(me)
      }
    };

    // range
    this.range = new Range(this.body, this.options);
    this.components.push(this.range);
    this.body.range = this.range;

    // time axis
    this.timeAxis = new TimeAxis(this.body, this.options);
    this.timeAxis2 = null; // used in case of orientation option 'both'
    this.components.push(this.timeAxis);

    // current time bar
    this.currentTime = new CurrentTime(this.body, this.options);
    this.components.push(this.currentTime);

    // item set
    this.itemSet = new ItemSet(this.body, this.options);
    this.components.push(this.itemSet);

    this.itemsData = null;      // DataSet
    this.groupsData = null;     // DataSet

    /**
     * Emit an event.
     * @param {string} eventName Name of event. 
     * @param {Event} event The event object.
     */
    function emit(eventName, event) {
      if (!me.hasListeners(eventName)) {
        return;
      }

      me.emit(eventName, me.getEventProperties(event));
    }

    this.dom.root.onclick = event => {
      emit('click', event)
    };
    this.dom.root.ondblclick = event => {
      emit('doubleClick', event)
    };
    this.dom.root.oncontextmenu = event => {
      emit('contextmenu', event)
    };
    this.dom.root.onmouseover = event => {
      emit('mouseOver', event)
    };
    if(window.PointerEvent) {
      this.dom.root.onpointerdown = event => {
        emit('mouseDown', event)
      };
      this.dom.root.onpointermove = event => {
        emit('mouseMove', event)
      };
      this.dom.root.onpointerup = event => {
        emit('mouseUp', event)
      };
    } else {
      this.dom.root.onmousemove = event => {
        emit('mouseMove', event)
      };
      this.dom.root.onmousedown = event => {
        emit('mouseDown', event)
      };
      this.dom.root.onmouseup = event => {
        emit('mouseUp', event)
      };
    }

    //Single time autoscale/fit
    this.initialFitDone = false;
    this.on('changed', () => {
      if (me.itemsData == null) return;
      if (!me.initialFitDone && !me.options.rollingMode) {
        me.initialFitDone = true;
        if (me.options.start != undefined || me.options.end != undefined) {
          if (me.options.start == undefined || me.options.end == undefined) {
            var range = me.getItemRange();
          }

          const start = me.options.start != undefined ? me.options.start : range.min;
          const end   = me.options.end   != undefined ? me.options.end   : range.max;
          me.setWindow(start, end, {animation: false});
        } else {
          me.fit({animation: false});
        }
      }

      if (!me.initialDrawDone && (me.initialRangeChangeDone || (!me.options.start && !me.options.end)
        || me.options.rollingMode)) {
        me.initialDrawDone = true;
        me.itemSet.initialDrawDone = true;
        me.dom.root.style.visibility = 'visible';
        me.dom.loadingScreen.parentNode.removeChild(me.dom.loadingScreen);
        if (me.options.onInitialDrawComplete) {
          setTimeout(() => {
            return me.options.onInitialDrawComplete();
          }, 0)
        }
      }
    });

    this.on('destroyTimeline', () => {
      me.destroy()
    });

    // apply options
    if (options) {
      this.setOptions(options);
    }

    this.body.emitter.on('fit', (args) => {
      this._onFit(args);
      this.redraw();
    });

    // IMPORTANT: THIS HAPPENS BEFORE SET ITEMS!
    if (groups) {
      this.setGroups(groups);
    }

    // create itemset
    if (items) {
      this.setItems(items);
    }

    // draw for the first time
    this._redraw();
  }

  /**
   * Load a configurator
   * @return {Object}
   * @private
   */
  _createConfigurator() {
    return new Configurator(this, this.dom.container, configureOptions);
  }

  /**
   * Force a redraw. The size of all items will be recalculated.
   * Can be useful to manually redraw when option autoResize=false and the window
   * has been resized, or when the items CSS has been changed.
   *
   * Note: this function will be overridden on construction with a trottled version
   */
  redraw() {
    this.itemSet && this.itemSet.markDirty({refreshItems: true});
    this._redraw();
  }

  /**
   * Remove an item from the group
   * @param {object} options
   */
  setOptions(options) {
    // validate options
    let errorFound = Validator.validate(options, allOptions);

    if (errorFound === true) {
      console.log('%cErrors have been found in the supplied options object.', printStyle);
    }

    Core.prototype.setOptions.call(this, options);

    if ('type' in options) {
      if (options.type !== this.options.type) {
        this.options.type = options.type;

        // force recreation of all items
        const itemsData = this.itemsData;
        if (itemsData) {
          const selection = this.getSelection();
          this.setItems(null);            // remove all
          this.setItems(itemsData.rawDS); // add all
          this.setSelection(selection);   // restore selection
        }
      }
    }
  }

  /**
   * Set items
   * @param {vis.DataSet | Array | null} items
   */
  setItems(items) {
    this.itemsDone = false;

    // convert to type DataSet when needed
    let newDataSet;
    if (!items) {
      newDataSet = null;
    }
    else if (isDataViewLike(items)) {
      newDataSet = typeCoerceDataSet(items);
    }
    else {
      // turn an array into a dataset
      newDataSet = typeCoerceDataSet(new DataSet(items));
    }

    // set items
    if (this.itemsData) {
      // stop maintaining a coerced version of the old data set
      this.itemsData.dispose();
    }
    this.itemsData = newDataSet;
    this.itemSet && this.itemSet.setItems(newDataSet != null ? newDataSet.rawDS : null);
  }

  /**
   * Set groups
   * @param {vis.DataSet | Array} groups
   */
  setGroups(groups) {
    // convert to type DataSet when needed
    let newDataSet;
    const filter = group => group.visible !== false;

    if (!groups) {
      newDataSet = null;
    }
    else {
      // If groups is array, turn to DataSet & build dataview from that
      if (Array.isArray(groups)) groups = new DataSet(groups);

      newDataSet = new DataView(groups,{filter});
    }

    // This looks weird but it's necessary to prevent memory leaks.
    //
    // The problem is that the DataView will exist as long as the DataSet it's
    // connected to. This will force it to swap the groups DataSet for it's own
    // DataSet. In this arrangement it will become unreferenced from the outside
    // and garbage collected.
    //
    // IMPORTANT NOTE: If `this.groupsData` is a DataView was created in this
    // method. Even if the original is a DataView already a new one has been
    // created and assigned to `this.groupsData`. In case this changes in the
    // future it will be necessary to rework this!!!!
    if (this.groupsData != null && typeof this.groupsData.setData === "function") {
      this.groupsData.setData(null);
    }
    this.groupsData = newDataSet;
    this.itemSet.setGroups(newDataSet);
  }

  /**
   * Set both items and groups in one go
   * @param {{items: (Array | vis.DataSet), groups: (Array | vis.DataSet)}} data
   */
  setData(data) {
    if (data && data.groups) {
      this.setGroups(data.groups);
    }

    if (data && data.items) {
      this.setItems(data.items);
    }
  }

  /**
   * Set selected items by their id. Replaces the current selection
   * Unknown id's are silently ignored.
   * @param {string[] | string} [ids]  An array with zero or more id's of the items to be
   *                                selected. If ids is an empty array, all items will be
   *                                unselected.
   * @param {Object} [options]      Available options:
   *                                `focus: boolean`
   *                                    If true, focus will be set to the selected item(s)
   *                                `animation: boolean | {duration: number, easingFunction: string}`
   *                                    If true (default), the range is animated
   *                                    smoothly to the new window. An object can be
   *                                    provided to specify duration and easing function.
   *                                    Default duration is 500 ms, and default easing
   *                                    function is 'easeInOutQuad'.
   *                                    Only applicable when option focus is true.
   */
  setSelection(ids, options) {
    this.itemSet && this.itemSet.setSelection(ids);

    if (options && options.focus) {
      this.focus(ids, options);
    }
  }

  /**
   * Get the selected items by their id
   * @return {Array} ids  The ids of the selected items
   */
  getSelection() {
    return this.itemSet && this.itemSet.getSelection() || [];
  }

  /**
   * Adjust the visible window such that the selected item (or multiple items)
   * are centered on screen.
   * @param {string | String[]} id     An item id or array with item ids
   * @param {Object} [options]      Available options:
   *                                `animation: boolean | {duration: number, easingFunction: string}`
   *                                    If true (default), the range is animated
   *                                    smoothly to the new window. An object can be
   *                                    provided to specify duration and easing function.
   *                                    Default duration is 500 ms, and default easing
   *                                    function is 'easeInOutQuad'.
   *                                `zoom: boolean`
   *                                    If true (default), the timeline will
   *                                    zoom on the element after focus it.
   */
  focus(id, options) {
    if (!this.itemsData || id == undefined) return;

    const ids = Array.isArray(id) ? id : [id];

    // get the specified item(s)
    const itemsData = this.itemsData.get(ids);

    // calculate minimum start and maximum end of specified items
    let start = null;
    let end = null;
    itemsData.forEach(itemData => {
      const s = itemData.start.valueOf();
      const e = 'end' in itemData ? itemData.end.valueOf() : itemData.start.valueOf();

      if (start === null || s < start) {
        start = s;
      }

      if (end === null || e > end) {
        end = e;
      }
    });


    if (start !== null && end !== null) {
      const me = this;
      // Use the first item for the vertical focus
      const item = this.itemSet.items[ids[0]];
      let startPos = this._getScrollTop() * -1;
      let initialVerticalScroll = null;

      // Setup a handler for each frame of the vertical scroll
      const verticalAnimationFrame = (ease, willDraw, done) => {
        const verticalScroll = getItemVerticalScroll(me, item);

        if (verticalScroll === false) {
          return; // We don't need to scroll, so do nothing
        }

        if(!initialVerticalScroll) {
          initialVerticalScroll = verticalScroll;
        }

        if(initialVerticalScroll.itemTop == verticalScroll.itemTop && !initialVerticalScroll.shouldScroll) {
          return; // We don't need to scroll, so do nothing
        }
        else if(initialVerticalScroll.itemTop != verticalScroll.itemTop && verticalScroll.shouldScroll) {
          // The redraw shifted elements, so reset the animation to correct
          initialVerticalScroll = verticalScroll;
          startPos = me._getScrollTop() * -1;
        }

        const from = startPos;
        const to = initialVerticalScroll.scrollOffset;
        const scrollTop = done ? to : (from + (to - from) * ease);

        me._setScrollTop(-scrollTop);

        if(!willDraw) {
          me._redraw();
        }
      };

      // Enforces the final vertical scroll position
      const setFinalVerticalPosition = () => {
        const finalVerticalScroll = getItemVerticalScroll(me, item);

        if (finalVerticalScroll.shouldScroll && finalVerticalScroll.itemTop != initialVerticalScroll.itemTop) {
          me._setScrollTop(-finalVerticalScroll.scrollOffset);
          me._redraw();
        }
      };

      // Perform one last check at the end to make sure the final vertical
      // position is correct
      const finalVerticalCallback = () => {
        // Double check we ended at the proper scroll position
        setFinalVerticalPosition();

        // Let the redraw settle and finalize the position.
        setTimeout(setFinalVerticalPosition, 100);
      };

      // calculate the new middle and interval for the window
      const zoom = options && options.zoom !== undefined ? options.zoom : true;
      const middle = (start + end) / 2;
      const interval = zoom ? (end - start) * 1.1 : Math.max(this.range.end - this.range.start, (end - start) * 1.1);

      const animation = options && options.animation !== undefined ? options.animation : true;

      if (!animation) {
        // We aren't animating so set a default so that the final callback forces the vertical location
        initialVerticalScroll = { shouldScroll: false, scrollOffset: -1, itemTop: -1 };
      }

      this.range.setRange(middle - interval / 2, middle + interval / 2, { animation }, finalVerticalCallback, verticalAnimationFrame);
    }
  }

  /**
   * Set Timeline window such that it fits all items
   * @param {Object} [options]  Available options:
   *                                `animation: boolean | {duration: number, easingFunction: string}`
   *                                    If true (default), the range is animated
   *                                    smoothly to the new window. An object can be
   *                                    provided to specify duration and easing function.
   *                                    Default duration is 500 ms, and default easing
   *                                    function is 'easeInOutQuad'.
   * @param {function} [callback]
   */
  fit(options, callback) {
    const animation = (options && options.animation !== undefined) ? options.animation : true;
    let range;

    if (this.itemsData.length === 1 && this.itemsData.get()[0].end === undefined) {
      // a single item -> don't fit, just show a range around the item from -4 to +3 days
      range = this.getDataRange();
      this.moveTo(range.min.valueOf(), {animation}, callback);
    }
    else {
      // exactly fit the items (plus a small margin)
      range = this.getItemRange();
      this.range.setRange(range.min, range.max, { animation }, callback);
    }
  }

  /**
   * Determine the range of the items, taking into account their actual width
   * and a margin of 10 pixels on both sides.
   *
   * @returns {{min: Date, max: Date}}
   */
  getItemRange() {
    // get a rough approximation for the range based on the items start and end dates
    const range = this.getDataRange();
    let min = range.min !== null ? range.min.valueOf() : null;
    let max = range.max !== null ? range.max.valueOf() : null;
    let minItem = null;
    let maxItem = null;

    if (min != null && max != null) {
      let interval = (max - min); // ms
      if (interval <= 0) {
        interval = 10;
      }
      const factor = interval / this.props.center.width;

      const redrawQueue = {};
      let redrawQueueLength = 0;

      // collect redraw functions
      util.forEach(this.itemSet.items, (item, key) => {
        if (item.groupShowing) {
          const returnQueue = true;
          redrawQueue[key] = item.redraw(returnQueue);
          redrawQueueLength = redrawQueue[key].length;
        }
      })

      const needRedraw = redrawQueueLength > 0;
      if (needRedraw) {
        // redraw all regular items
        for (let i = 0; i < redrawQueueLength; i++) {
          util.forEach(redrawQueue, fns => {
            fns[i]();
          });
        }
      }

       // calculate the date of the left side and right side of the items given
      util.forEach(this.itemSet.items, item => {
        const start = getStart(item);
        const end = getEnd(item);
        let startSide;
        let endSide;

        if (this.options.rtl) {
          startSide  = start - (item.getWidthRight()  + 10) * factor;
          endSide = end   + (item.getWidthLeft() + 10) * factor;
        } else {
          startSide  = start - (item.getWidthLeft()  + 10) * factor;
          endSide = end   + (item.getWidthRight() + 10) * factor;
        }

        if (startSide < min) {
          min = startSide;
          minItem = item;
        }
        if (endSide > max) {
          max = endSide;
          maxItem = item;
        }
      });

      if (minItem && maxItem) {
        const lhs = minItem.getWidthLeft() + 10;
        const rhs = maxItem.getWidthRight() + 10;
        const delta = this.props.center.width - lhs - rhs;  // px

        if (delta > 0) {
          if (this.options.rtl) {
            min = getStart(minItem) - rhs * interval / delta; // ms
            max = getEnd(maxItem)   + lhs * interval / delta; // ms
          } else {
            min = getStart(minItem) - lhs * interval / delta; // ms
            max = getEnd(maxItem)   + rhs * interval / delta; // ms
          }
        }
      }
    }

    return {
      min: min != null ? new Date(min) : null,
      max: max != null ? new Date(max) : null
    }
  }

  /**
   * Calculate the data range of the items start and end dates
   * @returns {{min: Date, max: Date}}
   */
  getDataRange() {
    let min = null;
    let max = null;

    if (this.itemsData) {
      this.itemsData.forEach(item => {
        const start = util.convert(item.start, 'Date').valueOf();
        const end   = util.convert(item.end != undefined ? item.end : item.start, 'Date').valueOf();
        if (min === null || start < min) {
          min = start;
        }
        if (max === null || end > max) {
          max = end;
        }
      });
    }

    return {
      min: min != null ? new Date(min) : null,
      max: max != null ? new Date(max) : null
    }
  }

  /**
   * Generate Timeline related information from an event
   * @param {Event} event
   * @return {Object} An object with related information, like on which area
   *                  The event happened, whether clicked on an item, etc.
   */
  getEventProperties(event) {
    const clientX = event.center ? event.center.x : event.clientX;
    const clientY = event.center ? event.center.y : event.clientY;
    const centerContainerRect = this.dom.centerContainer.getBoundingClientRect();
    const x = this.options.rtl ? centerContainerRect.right - clientX : clientX - centerContainerRect.left;
    const y = clientY - centerContainerRect.top;

    const item  = this.itemSet.itemFromTarget(event);
    const group = this.itemSet.groupFromTarget(event);
    const customTime = CustomTime.customTimeFromTarget(event);

    const snap = this.itemSet.options.snap || null;
    const scale = this.body.util.getScale();
    const step = this.body.util.getStep();
    const time = this._toTime(x);
    const snappedTime = snap ? snap(time, scale, step) : time;

    const element = util.getTarget(event);
    let what = null;
    if (item != null)                                                    {what = 'item';}
    else if (customTime != null)                                         {what = 'custom-time';}
    else if (util.hasParent(element, this.timeAxis.dom.foreground))      {what = 'axis';}
    else if (this.timeAxis2 && util.hasParent(element, this.timeAxis2.dom.foreground)) {what = 'axis';}
    else if (util.hasParent(element, this.itemSet.dom.labelSet))         {what = 'group-label';}
    else if (util.hasParent(element, this.currentTime.bar))              {what = 'current-time';}
    else if (util.hasParent(element, this.dom.center))                   {what = 'background';}

    return {
      event,
      item: item ? item.id : null,
      isCluster: item ? !!item.isCluster: false,
      items: item ? item.items || []: null,
      group: group ? group.groupId : null,
      customTime: customTime ? customTime.options.id : null,
      what,
      pageX: event.srcEvent ? event.srcEvent.pageX : event.pageX,
      pageY: event.srcEvent ? event.srcEvent.pageY : event.pageY,
      x,
      y,
      time,
      snappedTime
    }
  }

  /**
   * Toggle Timeline rolling mode
   */
  toggleRollingMode() {
    if (this.range.rolling) {
      this.range.stopRolling();
    } else {
      if (this.options.rollingMode == undefined) {
        this.setOptions(this.options)
      }
      this.range.startRolling();
    }
  }

  /**
   * redraw
   * @private
   */
  _redraw() {
    Core.prototype._redraw.call(this);
  }

  /**
   * on fit callback
   * @param {object} args
   * @private
   */
  _onFit(args) {
    const { start, end, animation } = args;
    if (!end) {
      this.moveTo(start.valueOf(), {
        animation
      });
    } else {
      this.range.setRange(start, end, {
        animation: animation
      });
    }
  }
}

/**
 *
 * @param {timeline.Item} item
 * @returns {number}
 */
function getStart(item) {
  return util.convert(item.data.start, 'Date').valueOf()
}

/**
 *
 * @param {timeline.Item} item
 * @returns {number}
 */
function getEnd(item) {
  const end = item.data.end != undefined ? item.data.end : item.data.start;
  return util.convert(end, 'Date').valueOf();
}

/**
 * @param {vis.Timeline} timeline
 * @param {timeline.Item} item
 * @return {{shouldScroll: bool, scrollOffset: number, itemTop: number}}
 */
function getItemVerticalScroll(timeline, item) {
  if (!item.parent) {
    // The item no longer exists, so ignore this focus.
    return false;
  }

  const itemsetHeight = timeline.options.rtl ? timeline.props.rightContainer.height : timeline.props.leftContainer.height;
  const contentHeight = timeline.props.center.height;

  const group = item.parent;
  let offset = group.top;
  let shouldScroll = true;
  const orientation = timeline.timeAxis.options.orientation.axis;

  const itemTop = () => {
  if (orientation == "bottom") {
      return group.height - item.top - item.height;
    }
    else {
      return item.top;
    }
  };

  const currentScrollHeight = timeline._getScrollTop() * -1;
  const targetOffset = offset + itemTop();
  const height = item.height;

  if (targetOffset < currentScrollHeight) {
    if (offset + itemsetHeight <= offset + itemTop() + height) {
      offset += itemTop() - timeline.itemSet.options.margin.item.vertical;
    }
  }
  else if (targetOffset + height > currentScrollHeight + itemsetHeight) {
    offset += itemTop() + height - itemsetHeight + timeline.itemSet.options.margin.item.vertical;
  }
  else {
    shouldScroll = false;
  }

  offset = Math.min(offset, contentHeight - itemsetHeight);

  return { shouldScroll, scrollOffset: offset, itemTop: targetOffset };
}
