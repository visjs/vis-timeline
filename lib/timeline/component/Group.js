import util from '../../util';
import * as stack from '../Stack';

const UNGROUPED = '__ungrouped__';   // reserved group id for ungrouped items
const BACKGROUND = '__background__'; // reserved group id for background items without group

export const ReservedGroupIds = {
  UNGROUPED,
  BACKGROUND
}


/**
 * @constructor Group
 */
class Group {
  /**
 * @param {number | string} groupId
 * @param {Object} data
 * @param {ItemSet} itemSet
 * @constructor Group
 */
  constructor(groupId, data, itemSet) {
    this.groupId = groupId;
    this.subgroups = {};
    this.subgroupStack = {};
    this.subgroupStackAll = false;
    this.subgroupVisibility = {};
    this.doInnerStack = false;
    this.shouldBailStackItems = false;
    this.subgroupIndex = 0;
    this.subgroupOrderer = data && data.subgroupOrder;
    this.itemSet = itemSet;
    this.isVisible = null;
    this.stackDirty = true; // if true, items will be restacked on next redraw

    // This is a stack of functions (`() => void`) that will be executed before
    // the instance is disposed off (method `dispose`). Anything that needs to
    // be manually disposed off before garbage collection happens (or so that
    // garbage collection can happen) should be added to this stack.
    this._disposeCallbacks = [];

    if (data && data.nestedGroups) {
      this.nestedGroups = data.nestedGroups;
      if (data.showNested == false) {
        this.showNested = false;
      } else {
        this.showNested = true;
      }
    }

    if (data && data.subgroupStack) {
      if (typeof data.subgroupStack === "boolean") {
        this.doInnerStack = data.subgroupStack;
        this.subgroupStackAll = data.subgroupStack;
      }
      else {
        // We might be doing stacking on specific sub groups, but only
        // if at least one is set to do stacking
        for(const key in data.subgroupStack) {
          this.subgroupStack[key] = data.subgroupStack[key];
          this.doInnerStack = this.doInnerStack || data.subgroupStack[key];
        }
      }
    }

    if (data && data.heightMode) {
      this.heightMode = data.heightMode;
    } else {
      this.heightMode = itemSet.options.groupHeightMode;
    }

    this.nestedInGroup = null;

    this.dom = {};
    this.props = {
      label: {
        width: 0,
        height: 0
      }
    };
    this.className = null;

    this.items = {};        // items filtered by groupId of this group
    this.visibleItems = []; // items currently visible in window
    this.itemsInRange = []; // items currently in range
    this.orderedItems = {
      byStart: [],
      byEnd: []
    };
    this.checkRangedItems = false; // needed to refresh the ranged items if the window is programatically changed with NO overlap.

    const handleCheckRangedItems = () => {
      this.checkRangedItems = true;
    };
    this.itemSet.body.emitter.on("checkRangedItems", handleCheckRangedItems);
    this._disposeCallbacks.push(() => {
      this.itemSet.body.emitter.off("checkRangedItems", handleCheckRangedItems);
    });

    this._create();

    this.setData(data);
  }

  /**
   * Create DOM elements for the group
   * @private
   */
  _create() {
    const label = document.createElement('div');
    if (this.itemSet.options.groupEditable.order) {
      label.className = 'vis-label draggable';
    } else {
      label.className = 'vis-label';
    }
    this.dom.label = label;

    const inner = document.createElement('div');
    inner.className = 'vis-inner';
    label.appendChild(inner);
    this.dom.inner = inner;

    const foreground = document.createElement('div');
    foreground.className = 'vis-group';
    foreground['vis-group'] = this;
    this.dom.foreground = foreground;

    this.dom.background = document.createElement('div');
    this.dom.background.className = 'vis-group';

    this.dom.axis = document.createElement('div');
    this.dom.axis.className = 'vis-group';

    // create a hidden marker to detect when the Timelines container is attached
    // to the DOM, or the style of a parent of the Timeline is changed from
    // display:none is changed to visible.
    this.dom.marker = document.createElement('div');
    this.dom.marker.style.visibility = 'hidden';
    this.dom.marker.style.position = 'absolute';
    this.dom.marker.innerHTML = '';
    this.dom.background.appendChild(this.dom.marker);
  }

  /**
   * Set the group data for this group
   * @param {Object} data   Group data, can contain properties content and className
   */
  setData(data) {
    if (this.itemSet.groupTouchParams.isDragging) return;

    // update contents
    let content;
    let templateFunction;

    if (data && data.subgroupVisibility) {
      for (const key in data.subgroupVisibility) {
        this.subgroupVisibility[key] = data.subgroupVisibility[key];
      }
    }

    if (this.itemSet.options && this.itemSet.options.groupTemplate) {
      templateFunction = this.itemSet.options.groupTemplate.bind(this);
      content = templateFunction(data, this.dom.inner);
    } else {
      content = data && data.content;
    }

    if (content instanceof Element) {
      while (this.dom.inner.firstChild) {
        this.dom.inner.removeChild(this.dom.inner.firstChild);
      }
      this.dom.inner.appendChild(content);
    } else if (content instanceof Object && content.isReactComponent) {
      // Do nothing. Component was rendered into the node be ReactDOM.render.
      // That branch is necessary for evasion of a second call templateFunction.
      // Supports only React < 16(due to the asynchronous nature of React 16).
    } else if (content instanceof Object) {
      templateFunction(data, this.dom.inner);
    } else if (content !== undefined && content !== null) {
      this.dom.inner.innerHTML = util.xss(content);
    } else {
      this.dom.inner.innerHTML = util.xss(this.groupId || ''); // groupId can be null
    }

    // update title
    this.dom.label.title = data && data.title || '';
    if (!this.dom.inner.firstChild) {
      util.addClassName(this.dom.inner, 'vis-hidden');
    }
    else {
      util.removeClassName(this.dom.inner, 'vis-hidden');
    }

    if (data && data.nestedGroups) {
      if (!this.nestedGroups || this.nestedGroups != data.nestedGroups) {
        this.nestedGroups = data.nestedGroups;
      }

      if (data.showNested !== undefined || this.showNested === undefined) {
        if (data.showNested == false) {
          this.showNested = false;
        } else {
          this.showNested = true;
        }
      }

      util.addClassName(this.dom.label, 'vis-nesting-group');
      if (this.showNested) {
        util.removeClassName(this.dom.label, 'collapsed');
        util.addClassName(this.dom.label, 'expanded');
      } else {
        util.removeClassName(this.dom.label, 'expanded');
        util.addClassName(this.dom.label, 'collapsed');
      }
    } else if (this.nestedGroups) {
      this.nestedGroups = null;
      util.removeClassName(this.dom.label, 'collapsed');
      util.removeClassName(this.dom.label, 'expanded');
      util.removeClassName(this.dom.label, 'vis-nesting-group');
    }

    if (data && (data.treeLevel|| data.nestedInGroup)) {
      util.addClassName(this.dom.label, 'vis-nested-group');
      if (data.treeLevel) {
        util.addClassName(this.dom.label, 'vis-group-level-' + data.treeLevel);
      } else {
        // Nesting level is unknown, but we're sure it's at least 1
        util.addClassName(this.dom.label, 'vis-group-level-unknown-but-gte1');
      }
    } else {
      util.addClassName(this.dom.label, 'vis-group-level-0');
    }
    
    // update className
    const className = data && data.className || null;
    if (className != this.className) {
      if (this.className) {
        util.removeClassName(this.dom.label, this.className);
        util.removeClassName(this.dom.foreground, this.className);
        util.removeClassName(this.dom.background, this.className);
        util.removeClassName(this.dom.axis, this.className);
      }
      util.addClassName(this.dom.label, className);
      util.addClassName(this.dom.foreground, className);
      util.addClassName(this.dom.background, className);
      util.addClassName(this.dom.axis, className);
      this.className = className;
    }

    // update style
    if (this.style) {
      util.removeCssText(this.dom.label, this.style);
      this.style = null;
    }
    if (data && data.style) {
      util.addCssText(this.dom.label, data.style);
      this.style = data.style;
    }
  }

  /**
   * Get the width of the group label
   * @return {number} width
   */
  getLabelWidth() {
    return this.props.label.width;
  }

  /**
   * check if group has had an initial height hange
   * @returns {boolean} 
   */
  _didMarkerHeightChange() {
    const markerHeight = this.dom.marker.clientHeight;
    if (markerHeight != this.lastMarkerHeight) {
      this.lastMarkerHeight = markerHeight;
      const redrawQueue = {};
      let redrawQueueLength = 0;

      util.forEach(this.items, (item, key) => {
        item.dirty = true;
        if (item.displayed) {
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
      return true;
    } else {
      return false;
    }
  }

  /**
   * calculate group dimentions and position
   * @param {number} pixels
   */
  _calculateGroupSizeAndPosition() {
    const { offsetTop, offsetLeft, offsetWidth } = this.dom.foreground;
    this.top = offsetTop;
    this.right = offsetLeft;
    this.width = offsetWidth;
  }

  /**
   * checks if should bail redraw of items
   * @returns {boolean} should bail 
   */
  _shouldBailItemsRedraw() {
    const me = this;
    const timeoutOptions = this.itemSet.options.onTimeout;
    const bailOptions = {
      relativeBailingTime: this.itemSet.itemsSettingTime,
      bailTimeMs: timeoutOptions && timeoutOptions.timeoutMs,
      userBailFunction: timeoutOptions && timeoutOptions.callback,
      shouldBailStackItems: this.shouldBailStackItems
    };
    let bail = null;
    if (!this.itemSet.initialDrawDone) {
      if (bailOptions.shouldBailStackItems) { return true; }
      if (Math.abs(Date.now() - new Date(bailOptions.relativeBailingTime)) > bailOptions.bailTimeMs) {
        if (bailOptions.userBailFunction && this.itemSet.userContinueNotBail == null) {
          bailOptions.userBailFunction(didUserContinue => {
            me.itemSet.userContinueNotBail = didUserContinue;
            bail = !didUserContinue;
          })
        } else if (me.itemSet.userContinueNotBail == false) {
          bail = true;
        } else {
          bail = false;
        }
      }
    }

    return bail;
  }

  /**
   * redraws items
   * @param {boolean} forceRestack
   * @param {boolean} lastIsVisible
   * @param {number} margin
   * @param {object} range
   * @private
   */
  _redrawItems(forceRestack, lastIsVisible, margin, range) {
    const restack = forceRestack || this.stackDirty || this.isVisible && !lastIsVisible;

    // if restacking, reposition visible items vertically
    if (restack) {
      const orderedItems = {
        byEnd: this.orderedItems.byEnd.filter(item => !item.isCluster),
        byStart: this.orderedItems.byStart.filter(item => !item.isCluster)
      }

      const orderedClusters = {
        byEnd: [...new Set(this.orderedItems.byEnd.map(item => item.cluster).filter(item => !!item))],
        byStart: [...new Set(this.orderedItems.byStart.map(item => item.cluster).filter(item => !!item))],
      }

     /**
     * Get all visible items in range
     * @return {array} items
     */
      const getVisibleItems = () => {
        const visibleItems = this._updateItemsInRange(orderedItems, this.visibleItems.filter(item => !item.isCluster), range);
        const visibleClusters = this._updateClustersInRange(orderedClusters, this.visibleItems.filter(item => item.isCluster), range);
        return [...visibleItems, ...visibleClusters];
      }

      /**
       * Get visible items grouped by subgroup
       * @param {function} orderFn An optional function to order items inside the subgroups
       * @return {Object}
       */
      const getVisibleItemsGroupedBySubgroup = orderFn => {
        let visibleSubgroupsItems = {};
        for (const subgroup in this.subgroups) {
          const items = this.visibleItems.filter(item => item.data.subgroup === subgroup);
          visibleSubgroupsItems[subgroup] = orderFn ? items.sort((a, b) => orderFn(a.data, b.data)) : items;
        }
        return visibleSubgroupsItems;
      };

      if (typeof this.itemSet.options.order === 'function') {
        // a custom order function
        //show all items
        const me = this;
        if (this.doInnerStack && this.itemSet.options.stackSubgroups) {
          // Order the items within each subgroup
          const visibleSubgroupsItems = getVisibleItemsGroupedBySubgroup(this.itemSet.options.order);
          stack.stackSubgroupsWithInnerStack(visibleSubgroupsItems, margin, this.subgroups);
          this.visibleItems = getVisibleItems();
          this._updateSubGroupHeights(margin);
        }
        else {
          this.visibleItems = getVisibleItems();
          this._updateSubGroupHeights(margin);
          // order all items and force a restacking
           // order all items outside clusters and force a restacking
          const customOrderedItems = this.visibleItems
                                  .slice()
                                  .filter(item => item.isCluster || (!item.isCluster && !item.cluster))
                                  .sort((a, b) => {
                                      return me.itemSet.options.order(a.data, b.data);
                                  });
          this.shouldBailStackItems = stack.stack(customOrderedItems, margin, true, this._shouldBailItemsRedraw.bind(this));
        }
      } else {
        // no custom order function, lazy stacking
        this.visibleItems = getVisibleItems();
        this._updateSubGroupHeights(margin);

        if (this.itemSet.options.stack) {
          if (this.doInnerStack && this.itemSet.options.stackSubgroups) {
            const visibleSubgroupsItems = getVisibleItemsGroupedBySubgroup();
            stack.stackSubgroupsWithInnerStack(visibleSubgroupsItems, margin, this.subgroups);
          }
          else {
            // TODO: ugly way to access options...
            this.shouldBailStackItems = stack.stack(this.visibleItems, margin, true, this._shouldBailItemsRedraw.bind(this));
          }
        } else {
          // no stacking
          stack.nostack(this.visibleItems, margin, this.subgroups, this.itemSet.options.stackSubgroups);
        }
      }

      for (let i = 0; i < this.visibleItems.length; i++) {
        this.visibleItems[i].repositionX();
        if (this.subgroupVisibility[this.visibleItems[i].data.subgroup] !== undefined) {
          if (!this.subgroupVisibility[this.visibleItems[i].data.subgroup]) {
            this.visibleItems[i].hide();
          }
        }
      }

      if (this.itemSet.options.cluster) {
        util.forEach(this.items, item => {
          if (item.cluster && item.displayed) {
            item.hide();
          }
        });
      }

      if (this.shouldBailStackItems) {
        this.itemSet.body.emitter.emit('destroyTimeline')
      }
      this.stackDirty = false;
    }
  }

  /**
   * check if group resized
   * @param {boolean} resized
   * @param {number} height
   * @return {boolean} did resize
   */
  _didResize(resized, height) {
    resized = util.updateProperty(this, 'height', height) || resized;
    // recalculate size of label
    const labelWidth = this.dom.inner.clientWidth;
    const labelHeight = this.dom.inner.clientHeight;
    resized = util.updateProperty(this.props.label, 'width', labelWidth) || resized;
    resized = util.updateProperty(this.props.label, 'height', labelHeight) || resized;
    return resized;
  }

  /**
   * apply group height
   * @param {number} height
   */
  _applyGroupHeight(height) {
    this.dom.background.style.height = `${height}px`;
    this.dom.foreground.style.height = `${height}px`;
    this.dom.label.style.height = `${height}px`;
  }

  /**
   * update vertical position of items after they are re-stacked and the height of the group is calculated
   * @param {number} margin
   */
  _updateItemsVerticalPosition(margin) {
    for (let i = 0, ii = this.visibleItems.length; i < ii; i++) {
      const item = this.visibleItems[i];
      item.repositionY(margin);
      if (!this.isVisible && this.groupId != ReservedGroupIds.BACKGROUND) {
        if (item.displayed) item.hide();
      }
    }
  }

  /**
   * Repaint this group
   * @param {{start: number, end: number}} range
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   * @param {boolean} [forceRestack=false]  Force restacking of all items
   * @param {boolean} [returnQueue=false]  return the queue or if the group resized
   * @return {boolean} Returns true if the group is resized or the redraw queue if returnQueue=true
   */
  redraw(range, margin, forceRestack, returnQueue) {
    let resized = false;
    const lastIsVisible = this.isVisible;
    let height;

    const queue = [
      () => {
        forceRestack = this._didMarkerHeightChange.call(this) || forceRestack;
      },
      
      // recalculate the height of the subgroups
      this._updateSubGroupHeights.bind(this, margin),

      // calculate actual size and position
      this._calculateGroupSizeAndPosition.bind(this),

      () => {
        this.isVisible = this._isGroupVisible.bind(this)(range, margin);
      },
      
      () => {
        this._redrawItems.bind(this)(forceRestack, lastIsVisible, margin, range)
      },

      // update subgroups
      this._updateSubgroupsSizes.bind(this),

      () => {
        height = this._calculateHeight.bind(this)(margin);
      },

      // calculate actual size and position again
      this._calculateGroupSizeAndPosition.bind(this),

      () => {
        resized = this._didResize.bind(this)(resized, height)
      },

      () => {
        this._applyGroupHeight.bind(this)(height)
      },

      () => {
        this._updateItemsVerticalPosition.bind(this)(margin)
      },

      (() => {
        if (!this.isVisible && this.height) {
          resized = false;
        }
        return resized
      }).bind(this)
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
   * recalculate the height of the subgroups
   *
   * @param {{item: timeline.Item}} margin
   * @private
   */
  _updateSubGroupHeights(margin) {
    if (Object.keys(this.subgroups).length > 0) {
      const me = this;

      this._resetSubgroups();

      util.forEach(this.visibleItems, item => {
        if (item.data.subgroup !== undefined) {
          me.subgroups[item.data.subgroup].height = Math.max(me.subgroups[item.data.subgroup].height, item.height + margin.item.vertical);
          me.subgroups[item.data.subgroup].visible = typeof this.subgroupVisibility[item.data.subgroup] === 'undefined' ? true : Boolean(this.subgroupVisibility[item.data.subgroup]);
        }
      });
    }
  }

  /**
   * check if group is visible
   *
   * @param {timeline.Range} range
   * @param {{axis: timeline.DataAxis}} margin
   * @returns {boolean} is visible
   * @private
   */
  _isGroupVisible(range, margin) {
    return (this.top <= range.body.domProps.centerContainer.height - range.body.domProps.scrollTop + margin.axis)
    && (this.top + this.height + margin.axis >= - range.body.domProps.scrollTop);
  }

  /**
   * recalculate the height of the group
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   * @returns {number} Returns the height
   * @private
   */
  _calculateHeight(margin) {
    // recalculate the height of the group
    let height;

    let items;

    if (this.heightMode === 'fixed') {
      items = util.toArray(this.items);
    } else {
      // default or 'auto'
      items = this.visibleItems;
    }

    if (items.length > 0) {
      let min = items[0].top;
      let max = items[0].top + items[0].height;
      util.forEach(items, item => {
        min = Math.min(min, item.top);
        max = Math.max(max, (item.top + item.height));
      });
      if (min > margin.axis) {
        // there is an empty gap between the lowest item and the axis
        const offset = min - margin.axis;
        max -= offset;
        util.forEach(items, item => {
          item.top -= offset;
        });
      }
      height = Math.ceil(max + margin.item.vertical / 2);
      if (this.heightMode !== "fitItems") {
        height = Math.max(height, this.props.label.height);
      }
    }
    else {
      height = 0 || this.props.label.height;
    }
    return height;
  }

  /**
   * Show this group: attach to the DOM
   */
  show() {
    if (!this.dom.label.parentNode) {
      this.itemSet.dom.labelSet.appendChild(this.dom.label);
    }

    if (!this.dom.foreground.parentNode) {
      this.itemSet.dom.foreground.appendChild(this.dom.foreground);
    }

    if (!this.dom.background.parentNode) {
      this.itemSet.dom.background.appendChild(this.dom.background);
    }

    if (!this.dom.axis.parentNode) {
      this.itemSet.dom.axis.appendChild(this.dom.axis);
    }
  }

  /**
   * Hide this group: remove from the DOM
   */
  hide() {
    const label = this.dom.label;
    if (label.parentNode) {
      label.parentNode.removeChild(label);
    }

    const foreground = this.dom.foreground;
    if (foreground.parentNode) {
      foreground.parentNode.removeChild(foreground);
    }

    const background = this.dom.background;
    if (background.parentNode) {
      background.parentNode.removeChild(background);
    }

    const axis = this.dom.axis;
    if (axis.parentNode) {
      axis.parentNode.removeChild(axis);
    }
  }

  /**
   * Add an item to the group
   * @param {Item} item
   */
  add(item) {
    this.items[item.id] = item;
    item.setParent(this);
    this.stackDirty = true;
    // add to
    if (item.data.subgroup !== undefined) {
      this._addToSubgroup(item);
      this.orderSubgroups();
    }

    if (!this.visibleItems.includes(item)) {
      const range = this.itemSet.body.range; // TODO: not nice accessing the range like this
      this._checkIfVisible(item, this.visibleItems, range);
    }
  }

  /**
   * add item to subgroup
   * @param {object} item
   * @param {string} subgroupId
   */
  _addToSubgroup(item, subgroupId=item.data.subgroup) {
    if (subgroupId != undefined && this.subgroups[subgroupId] === undefined) {
      this.subgroups[subgroupId] = {
        height: 0,
        top: 0,
        start: item.data.start,
        end: item.data.end || item.data.start,
        visible: false,
        index: this.subgroupIndex,
        items: [],
        stack: this.subgroupStackAll || this.subgroupStack[subgroupId] || false
      };
      this.subgroupIndex++;
    }


    if (new Date(item.data.start) < new Date(this.subgroups[subgroupId].start)) {
      this.subgroups[subgroupId].start = item.data.start;
    }

    const itemEnd = item.data.end || item.data.start;
    if (new Date(itemEnd) > new Date(this.subgroups[subgroupId].end)) {
      this.subgroups[subgroupId].end = itemEnd;
    }

    this.subgroups[subgroupId].items.push(item);
  }

  /**
   * update subgroup sizes
   */
  _updateSubgroupsSizes() {
    const me = this;
    if (me.subgroups) {
      for (const subgroup in me.subgroups) {
        const initialEnd = me.subgroups[subgroup].items[0].data.end || me.subgroups[subgroup].items[0].data.start;
        let newStart = me.subgroups[subgroup].items[0].data.start;
        let newEnd = initialEnd - 1;

        me.subgroups[subgroup].items.forEach(item => {
          if (new Date(item.data.start) < new Date(newStart)) {
            newStart = item.data.start;
          }

          const itemEnd = item.data.end || item.data.start;
          if (new Date(itemEnd) > new Date(newEnd)) {
            newEnd = itemEnd;
          }
        })

        me.subgroups[subgroup].start = newStart;
        me.subgroups[subgroup].end = new Date(newEnd - 1) // -1 to compensate for colliding end to start subgroups;

      }
    }
  }

  /**
   * order subgroups
   */
  orderSubgroups() {
    if (this.subgroupOrderer !== undefined) {
      const sortArray = [];
      if (typeof this.subgroupOrderer == 'string') {
        for (const subgroup in this.subgroups) {
          sortArray.push({subgroup, sortField: this.subgroups[subgroup].items[0].data[this.subgroupOrderer]})
        }
        sortArray.sort((a, b) => a.sortField - b.sortField)
      }
      else if (typeof this.subgroupOrderer == 'function') {
        for (const subgroup in this.subgroups) {
          sortArray.push(this.subgroups[subgroup].items[0].data);
        }
        sortArray.sort(this.subgroupOrderer);
      }

      if (sortArray.length > 0) {
        for (let i = 0; i < sortArray.length; i++) {
          this.subgroups[sortArray[i].subgroup].index = i;
        }
      }
    }
  }

  /**
   * add item to subgroup
   */
  _resetSubgroups() {
    for (const subgroup in this.subgroups) {
      if (Object.prototype.hasOwnProperty.call(this.subgroups, subgroup)) {
        this.subgroups[subgroup].visible = false;
        this.subgroups[subgroup].height = 0;
      }
    }
  }

  /**
   * Remove an item from the group
   * @param {Item} item
   */
  remove(item) {
    delete this.items[item.id];
    item.setParent(null);
    this.stackDirty = true;

    // remove from visible items
    const index = this.visibleItems.indexOf(item);
    if (index != -1) this.visibleItems.splice(index, 1);

    if(item.data.subgroup !== undefined){
      this._removeFromSubgroup(item);
      this.orderSubgroups();
    }
  }

  /**
   * remove item from subgroup
   * @param {object} item
   * @param {string} subgroupId
   */
  _removeFromSubgroup(item, subgroupId=item.data.subgroup) {
    if (subgroupId != undefined) {
      const subgroup = this.subgroups[subgroupId];
      if (subgroup){
        const itemIndex = subgroup.items.indexOf(item);
        //  Check the item is actually in this subgroup. How should items not in the group be handled?
        if (itemIndex >= 0) {
          subgroup.items.splice(itemIndex,1);
          if (!subgroup.items.length){
            delete this.subgroups[subgroupId];
          } else {
            this._updateSubgroupsSizes();
          }
        }
      }
    }
  }

  /**
   * Remove an item from the corresponding DataSet
   * @param {Item} item
   */
  removeFromDataSet(item) {
    this.itemSet.removeItem(item.id);
  }

  /**
   * Reorder the items
   */
  order() {
    const array = util.toArray(this.items);
    const startArray = [];
    const endArray = [];

    for (let i = 0; i < array.length; i++) {
      if (array[i].data.end !== undefined) {
        endArray.push(array[i]);
      }
      startArray.push(array[i]);
    }
    this.orderedItems = {
      byStart: startArray,
      byEnd: endArray
    };

    stack.orderByStart(this.orderedItems.byStart);
    stack.orderByEnd(this.orderedItems.byEnd);
  }

  /**
   * Update the visible items
   * @param {{byStart: Item[], byEnd: Item[]}} orderedItems   All items ordered by start date and by end date
   * @param {Item[]} oldVisibleItems                          The previously visible items.
   * @param {{start: number, end: number}} range              Visible range
   * @return {Item[]} visibleItems                            The new visible items.
   * @private
   */
  _updateItemsInRange(orderedItems, oldVisibleItems, range) {
    const visibleItems = [];
    const visibleItemsLookup = {}; // we keep this to quickly look up if an item already exists in the list without using indexOf on visibleItems

    if (!this.isVisible && this.height !== undefined && this.groupId != ReservedGroupIds.BACKGROUND) {
      for (let i = 0; i < oldVisibleItems.length; i++) {
        var item = oldVisibleItems[i];
        if (item.displayed) item.hide();
      }
      return visibleItems;
    } 

    const interval = (range.end - range.start) / 4;
    const lowerBound = range.start - interval;
    const upperBound = range.end + interval;

    // this function is used to do the binary search for items having start date only.
    const startSearchFunction = value => {
      if      (value < lowerBound)  {return -1;}
      else if (value <= upperBound) {return  0;}
      else                          {return  1;}
    };

    // this function is used to do the binary search for items having start and end dates (range).
    const endSearchFunction = data => {
      const {start, end} = data;
      if      (end < lowerBound)    {return -1;}
      else if (start <= upperBound) {return  0;}
      else                          {return  1;}
    }

    // first check if the items that were in view previously are still in view.
    // IMPORTANT: this handles the case for the items with startdate before the window and enddate after the window!
    // also cleans up invisible items.
    if (oldVisibleItems.length > 0) {
      for (let i = 0; i < oldVisibleItems.length; i++) {
        this._checkIfVisibleWithReference(oldVisibleItems[i], visibleItems, visibleItemsLookup, range);
      }
    }

    // we do a binary search for the items that have only start values.
    const initialPosByStart = util.binarySearchCustom(orderedItems.byStart, startSearchFunction, 'data','start');

    // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the start values.
    this._traceVisible(initialPosByStart, orderedItems.byStart, visibleItems, visibleItemsLookup, item => item.data.start < lowerBound || item.data.start > upperBound);

    // if the window has changed programmatically without overlapping the old window, the ranged items with start < lowerBound and end > upperbound are not shown.
    // We therefore have to brute force check all items in the byEnd list
    if (this.checkRangedItems == true) {
      this.checkRangedItems = false;
      for (let i = 0; i < orderedItems.byEnd.length; i++) {
        this._checkIfVisibleWithReference(orderedItems.byEnd[i], visibleItems, visibleItemsLookup, range);
      }
    }
    else {
      // we do a binary search for the items that have defined end times.
      const initialPosByEnd = util.binarySearchCustom(orderedItems.byEnd, endSearchFunction, 'data');

      // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the end values.
      this._traceVisible(initialPosByEnd, orderedItems.byEnd, visibleItems, visibleItemsLookup, item => item.data.end < lowerBound || item.data.start > upperBound);
    }

    const redrawQueue = {};
    let redrawQueueLength = 0;

    for (let i = 0; i < visibleItems.length; i++) {
      const item = visibleItems[i];
      if (!item.displayed) {
        const returnQueue = true;
        redrawQueue[i] = item.redraw(returnQueue);
        redrawQueueLength = redrawQueue[i].length;
      }
    }

    const needRedraw = redrawQueueLength > 0;
    if (needRedraw) {
      // redraw all regular items
      for (let j = 0; j < redrawQueueLength; j++) {
        util.forEach(redrawQueue, fns => {
          fns[j]();
        });
      }
    }

    for (let i = 0; i < visibleItems.length; i++) {
      visibleItems[i].repositionX();
    }

    return visibleItems;
  }

  /**
   * trace visible items in group
   * @param {number} initialPos
   * @param {array} items
   * @param {aray} visibleItems
   * @param {object} visibleItemsLookup
   * @param {function} breakCondition
   */
  _traceVisible(initialPos, items, visibleItems, visibleItemsLookup, breakCondition) {
    if (initialPos != -1) {
      for (let i = initialPos; i >= 0; i--) {
        let item = items[i];
        if (breakCondition(item)) {
          break;
        }
        else {
          if (!(item.isCluster  && !item.hasItems()) && !item.cluster) {
            if (visibleItemsLookup[item.id] === undefined) {
              visibleItemsLookup[item.id] = true;
              visibleItems.push(item);
            }
          }
        }
      }

      for (let i = initialPos + 1; i < items.length; i++) {
        let item = items[i];
        if (breakCondition(item)) {
          break;
        }
        else {
          if (!(item.isCluster && !item.hasItems()) && !item.cluster) {
            if (visibleItemsLookup[item.id] === undefined) {
              visibleItemsLookup[item.id] = true;
              visibleItems.push(item);
            }
          }
        }
      }
    }
  }

  /**
   * this function is very similar to the _checkIfInvisible() but it does not
   * return booleans, hides the item if it should not be seen and always adds to
   * the visibleItems.
   * this one is for brute forcing and hiding.
   *
   * @param {Item} item
   * @param {Array} visibleItems
   * @param {{start:number, end:number}} range
   * @private
   */
  _checkIfVisible(item, visibleItems, range) {
      if (item.isVisible(range)) {
        if (!item.displayed) item.show();
        // reposition item horizontally
        item.repositionX();
        visibleItems.push(item);
      }
      else {
        if (item.displayed) item.hide();
      }
  }

  /**
   * this function is very similar to the _checkIfInvisible() but it does not
   * return booleans, hides the item if it should not be seen and always adds to
   * the visibleItems.
   * this one is for brute forcing and hiding.
   *
   * @param {Item} item
   * @param {Array.<timeline.Item>} visibleItems
   * @param {Object<number, boolean>} visibleItemsLookup
   * @param {{start:number, end:number}} range
   * @private
   */
  _checkIfVisibleWithReference(item, visibleItems, visibleItemsLookup, range) {
    if (item.isVisible(range)) {
      if (visibleItemsLookup[item.id] === undefined) {
        visibleItemsLookup[item.id] = true;
        visibleItems.push(item);
      }
    }
    else {
      if (item.displayed) item.hide();
    }
  }

  /**
   * Update the visible items
   * @param {array} orderedClusters 
   * @param {array} oldVisibleClusters                         
   * @param {{start: number, end: number}} range             
   * @return {Item[]} visibleItems                            
   * @private
   */
  _updateClustersInRange(orderedClusters, oldVisibleClusters, range) {
    // Clusters can overlap each other so we cannot use binary search here
    const visibleClusters = [];
    const visibleClustersLookup = {}; // we keep this to quickly look up if an item already exists in the list without using indexOf on visibleItems
  
    if (oldVisibleClusters.length > 0) {
      for (let i = 0; i < oldVisibleClusters.length; i++) {
        this._checkIfVisibleWithReference(oldVisibleClusters[i], visibleClusters, visibleClustersLookup, range);
      }
    }
  
    for (let i = 0; i < orderedClusters.byStart.length; i++) {
      this._checkIfVisibleWithReference(orderedClusters.byStart[i], visibleClusters, visibleClustersLookup, range);
    }
  
    for (let i = 0; i < orderedClusters.byEnd.length; i++) {
      this._checkIfVisibleWithReference(orderedClusters.byEnd[i], visibleClusters, visibleClustersLookup, range);
    }
  
    const redrawQueue = {};
    let redrawQueueLength = 0;
  
    for (let i = 0; i < visibleClusters.length; i++) {
      const item = visibleClusters[i];
      if (!item.displayed) {
        const returnQueue = true;
        redrawQueue[i] = item.redraw(returnQueue);
        redrawQueueLength = redrawQueue[i].length;
      }
    }
  
    const needRedraw = redrawQueueLength > 0;
    if (needRedraw) {
      // redraw all regular items
      for (var j = 0; j < redrawQueueLength; j++) {
        util.forEach(redrawQueue, function (fns) {
          fns[j]();
        });
      }
    }
  
    for (let i = 0; i < visibleClusters.length; i++) {
      visibleClusters[i].repositionX();
    }
    
    return visibleClusters;
  }

  /**
   * change item subgroup
   * @param {object} item
   * @param {string} oldSubgroup
   * @param {string} newSubgroup
   */
  changeSubgroup(item, oldSubgroup, newSubgroup) {
    this._removeFromSubgroup(item, oldSubgroup);
    this._addToSubgroup(item, newSubgroup);
    this.orderSubgroups();
  }

  /**
   * Call this method before you lose the last reference to an instance of this.
   * It will remove listeners etc.
   */
  dispose() {
    this.hide();

    let disposeCallback;
    while ((disposeCallback = this._disposeCallbacks.pop())) {
      disposeCallback();
    }
  }
}

export default Group;
