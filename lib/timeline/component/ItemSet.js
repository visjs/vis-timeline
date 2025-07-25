import Hammer from '../../module/hammer.js';
import util, { typeCoerceDataSet, randomUUID, isDataViewLike } from '../../util.js';
import TimeStep from '../TimeStep.js';
import Component from './Component.js';
import Group from './Group.js';
import BackgroundGroup from './BackgroundGroup.js';
import BoxItem from './item/BoxItem.js';
import PointItem from './item/PointItem.js';
import RangeItem from './item/RangeItem.js';
import BackgroundItem from './item/BackgroundItem.js';
import Popup from '../../shared/Popup.js';
import ClusterGenerator from './ClusterGenerator.js';

const UNGROUPED = '__ungrouped__';   // reserved group id for ungrouped items
const BACKGROUND = '__background__'; // reserved group id for background items without group

export const ReservedGroupIds = {
  UNGROUPED,
  BACKGROUND
}

/**
 * An ItemSet holds a set of items and ranges which can be displayed in a
 * range. The width is determined by the parent of the ItemSet, and the height
 * is determined by the size of the items.
 */
class ItemSet extends Component {
  /**
 * @param {{dom: Object, domProps: Object, emitter: Emitter, range: Range}} body
 * @param {Object} [options]      See ItemSet.setOptions for the available options.
 * @constructor ItemSet
 * @extends Component
 */
  constructor(body, options) {
    super()
    this.body = body;
    this.defaultOptions = {
      type: null,  // 'box', 'point', 'range', 'background'
      orientation: {
        item: 'bottom'   // item orientation: 'top' or 'bottom'
      },
      align: 'auto', // alignment of box items
      stack: true,
      stackSubgroups: true,
      groupOrderSwap(fromGroup, toGroup, groups) {  // eslint-disable-line no-unused-vars
        const targetOrder = toGroup.order;
        toGroup.order = fromGroup.order;
        fromGroup.order = targetOrder;
      },
      groupOrder: 'order',

      selectable: true,
      multiselect: false,
      longSelectPressTime: 251,
      itemsAlwaysDraggable: {
        item: false,
        range: false,
      },

      editable: {
        updateTime: false,
        updateGroup: false,
        add: false,
        remove: false,
        overrideItems: false
      },

      groupEditable: {
        order: false,
        add: false,
        remove: false
      },

      snap: TimeStep.snap,

      // Only called when `objectData.target === 'item'.
      onDropObjectOnItem(objectData, item, callback) {
        callback(item)
      },
      onAdd(item, callback) {
        callback(item);
      },
      onUpdate(item, callback) {
        callback(item);
      },
      onMove(item, callback) {
        callback(item);
      },
      onRemove(item, callback) {
        callback(item);
      },
      onMoving(item, callback) {
        callback(item);
      },
      onAddGroup(item, callback) {
        callback(item);
      },
      onMoveGroup(item, callback) {
        callback(item);
      },
      onRemoveGroup(item, callback) {
        callback(item);
      },

      margin: {
        item: {
          horizontal: 10,
          vertical: 10
        },
        axis: 20
      },

      showTooltips: true,

      tooltip: {
        followMouse: false,
        overflowMethod: 'flip',
        delay: 500
      },

      tooltipOnItemUpdateTime: false
    };

    // options is shared by this ItemSet and all its items
    this.options = util.extend({}, this.defaultOptions);
    this.options.rtl = options.rtl;
    this.options.onTimeout = options.onTimeout;

    this.conversion = {
      toScreen: body.util.toScreen,
      toTime: body.util.toTime
    };
    this.dom = {};
    this.props = {};
    this.hammer = null;
    
    const me = this;
    this.itemsData = null;    // DataSet
    this.groupsData = null;   // DataSet
    this.itemsSettingTime = null;
    this.initialItemSetDrawn = false;
    this.userContinueNotBail = null;  

    this.sequentialSelection = false;
    
    // listeners for the DataSet of the items
    this.itemListeners = {
      'add'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onAdd(params.items);
        if (me.options.cluster) {
          me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
        }
        me.redraw();
      },
      'update'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onUpdate(params.items);
        if (me.options.cluster) {
          me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
        }
        me.redraw();
      },
      'remove'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onRemove(params.items);
        if (me.options.cluster) {
          me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
        }
        me.redraw();
      }
    };

    // listeners for the DataSet of the groups
    this.groupListeners = {
      'add'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onAddGroups(params.items);
        
        if (me.groupsData && me.groupsData.length > 0) {
            const groupsData = me.groupsData.getDataSet();
            groupsData.get().forEach(groupData => {
            if (groupData.nestedGroups) {
              if (groupData.showNested != false) {
                groupData.showNested = true;
              }
              let updatedGroups = [];
              groupData.nestedGroups.forEach(nestedGroupId => {
                const updatedNestedGroup = groupsData.get(nestedGroupId);
                if (!updatedNestedGroup) { return; }
                updatedNestedGroup.nestedInGroup = groupData.id;
                if (groupData.showNested == false) {
                  updatedNestedGroup.visible = false;
                }
                updatedGroups = updatedGroups.concat(updatedNestedGroup);
              });
              groupsData.update(updatedGroups, senderId);
            }
          });
        }
      },
      'update'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onUpdateGroups(params.items);
      },
      'remove'(event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onRemoveGroups(params.items);
      }
    };

    this.items = {};      // object with an Item for every data item
    this.groups = {};     // Group object for every group
    this.groupIds = [];

    this.selection = [];  // list with the ids of all selected nodes

    this.popup = null;
    this.popupTimer = null;

    this.touchParams = {}; // stores properties while dragging
    this.groupTouchParams = {
      group: null,
      isDragging: false
    };
  
    // create the HTML DOM
    this._create();

    this.setOptions(options);
    this.clusters = [];
  }

  /**
   * Create the HTML DOM for the ItemSet
   */
  _create() {
    const frame = document.createElement('div');
    frame.className = 'vis-itemset';
    frame['vis-itemset'] = this;
    this.dom.frame = frame;

    // create background panel
    const background = document.createElement('div');
    background.className = 'vis-background';
    frame.appendChild(background);
    this.dom.background = background;

    // create foreground panel
    const foreground = document.createElement('div');
    foreground.className = 'vis-foreground';
    frame.appendChild(foreground);
    this.dom.foreground = foreground;

    // create axis panel
    const axis = document.createElement('div');
    axis.className = 'vis-axis';
    this.dom.axis = axis;

    // create labelset
    const labelSet = document.createElement('div');
    labelSet.className = 'vis-labelset';
    this.dom.labelSet = labelSet;

    // create ungrouped Group
    this._updateUngrouped();

    // create background Group
    const backgroundGroup = new BackgroundGroup(BACKGROUND, null, this);
    backgroundGroup.show();
    this.groups[BACKGROUND] = backgroundGroup;

    // attach event listeners
    // Note: we bind to the centerContainer for the case where the height
    //       of the center container is larger than of the ItemSet, so we
    //       can click in the empty area to create a new item or deselect an item.
    this.hammer = new Hammer(this.body.dom.centerContainer);

    // drag items when selected
    this.hammer.on('hammer.input', event => {
      if (event.isFirst) {
        this._onTouch(event);
      }
    });
    this.hammer.on('panstart', this._onDragStart.bind(this));
    this.hammer.on('panmove',  this._onDrag.bind(this));
    this.hammer.on('panend',   this._onDragEnd.bind(this));
    this.hammer.get('pan').set({threshold:5, direction: Hammer.ALL});
    // delay addition on item click for trackpads...
    this.hammer.get('press').set({time:10000});

    // single select (or unselect) when tapping an item
    this.hammer.on('tap',  this._onSelectItem.bind(this));

    // multi select when holding mouse/touch, or on ctrl+click
    this.hammer.on('press', this._onMultiSelectItem.bind(this));
    // delay addition on item click for trackpads...
    this.hammer.get('press').set({time:10000});

    // add item on doubletap
    this.hammer.on('doubletap', this._onAddItem.bind(this));

    if (this.options.rtl) {
      this.groupHammer = new Hammer(this.body.dom.rightContainer);
    } else {
      this.groupHammer = new Hammer(this.body.dom.leftContainer);
    }
    
    this.groupHammer.on('tap',      this._onGroupClick.bind(this));
    this.groupHammer.on('panstart', this._onGroupDragStart.bind(this));
    this.groupHammer.on('panmove',  this._onGroupDrag.bind(this));
    this.groupHammer.on('panend',   this._onGroupDragEnd.bind(this));
    this.groupHammer.get('pan').set({threshold:5, direction: Hammer.DIRECTION_VERTICAL});
    
    this.body.dom.centerContainer.addEventListener('mouseover', this._onMouseOver.bind(this));
    this.body.dom.centerContainer.addEventListener('mouseout', this._onMouseOut.bind(this));
    this.body.dom.centerContainer.addEventListener('mousemove', this._onMouseMove.bind(this));
    // right-click on timeline 
    this.body.dom.centerContainer.addEventListener('contextmenu', this._onDragEnd.bind(this));

    this.body.dom.centerContainer.addEventListener('mousewheel', this._onMouseWheel.bind(this));

    // attach to the DOM
    this.show();
  }

  /**
   * Set options for the ItemSet. Existing options will be extended/overwritten.
   * @param {Object} [options] The following options are available:
   *                           {string} type
   *                              Default type for the items. Choose from 'box'
   *                              (default), 'point', 'range', or 'background'.
   *                              The default style can be overwritten by
   *                              individual items.
   *                           {string} align
   *                              Alignment for the items, only applicable for
   *                              BoxItem. Choose 'center' (default), 'left', or
   *                              'right'.
   *                           {string} orientation.item
   *                              Orientation of the item set. Choose 'top' or
   *                              'bottom' (default).
   *                           {Function} groupOrder
   *                              A sorting function for ordering groups
   *                           {boolean} stack
   *                              If true (default), items will be stacked on
   *                              top of each other.
   *                           {number} margin.axis
   *                              Margin between the axis and the items in pixels.
   *                              Default is 20.
   *                           {number} margin.item.horizontal
   *                              Horizontal margin between items in pixels.
   *                              Default is 10.
   *                           {number} margin.item.vertical
   *                              Vertical Margin between items in pixels.
   *                              Default is 10.
   *                           {number} margin.item
   *                              Margin between items in pixels in both horizontal
   *                              and vertical direction. Default is 10.
   *                           {number} margin
   *                              Set margin for both axis and items in pixels.
   *                           {boolean} selectable
   *                              If true (default), items can be selected.
   *                           {boolean} multiselect
   *                              If true, multiple items can be selected.
   *                              False by default.
   *                           {boolean} editable
   *                              Set all editable options to true or false
   *                           {boolean} editable.updateTime
   *                              Allow dragging an item to an other moment in time
   *                           {boolean} editable.updateGroup
   *                              Allow dragging an item to an other group
   *                           {boolean} editable.add
   *                              Allow creating new items on double tap
   *                           {boolean} editable.remove
   *                              Allow removing items by clicking the delete button
   *                              top right of a selected item.
   *                           {Function(item: Item, callback: Function)} onAdd
   *                              Callback function triggered when an item is about to be added:
   *                              when the user double taps an empty space in the Timeline.
   *                           {Function(item: Item, callback: Function)} onUpdate
   *                              Callback function fired when an item is about to be updated.
   *                              This function typically has to show a dialog where the user
   *                              change the item. If not implemented, nothing happens.
   *                           {Function(item: Item, callback: Function)} onMove
   *                              Fired when an item has been moved. If not implemented,
   *                              the move action will be accepted.
   *                           {Function(item: Item, callback: Function)} onRemove
   *                              Fired when an item is about to be deleted.
   *                              If not implemented, the item will be always removed.
   */
  setOptions(options) {
    if (options) {
      // copy all options that we know
      const fields = [
        'type', 'rtl', 'align', 'order', 'stack', 'stackSubgroups', 'selectable', 'multiselect', 'sequentialSelection',
        'multiselectPerGroup', 'longSelectPressTime', 'groupOrder', 'dataAttributes', 'template', 'groupTemplate', 'visibleFrameTemplate',
        'hide', 'snap', 'groupOrderSwap', 'showTooltips', 'tooltip', 'tooltipOnItemUpdateTime', 'groupHeightMode', 'onTimeout'
      ];
      util.selectiveExtend(fields, this.options, options);

      if ('itemsAlwaysDraggable' in options) {
        if (typeof options.itemsAlwaysDraggable === 'boolean') {
          this.options.itemsAlwaysDraggable.item = options.itemsAlwaysDraggable;
          this.options.itemsAlwaysDraggable.range = false;
        }
        else if (typeof options.itemsAlwaysDraggable === 'object') {
          util.selectiveExtend(['item', 'range'], this.options.itemsAlwaysDraggable, options.itemsAlwaysDraggable);
          // only allow range always draggable when item is always draggable as well
          if (! this.options.itemsAlwaysDraggable.item) {
            this.options.itemsAlwaysDraggable.range = false;
          }
        }
      }

      if ('sequentialSelection' in options) {
        if (typeof options.sequentialSelection === 'boolean') {
          this.options.sequentialSelection = options.sequentialSelection;
        }
      }

      if ('orientation' in options) {
        if (typeof options.orientation === 'string') {
          this.options.orientation.item = options.orientation === 'top' ? 'top' : 'bottom';
        }
        else if (typeof options.orientation === 'object' && 'item' in options.orientation) {
          this.options.orientation.item = options.orientation.item;
        }
      }

      if ('margin' in options) {
        if (typeof options.margin === 'number') {
          this.options.margin.axis = options.margin;
          this.options.margin.item.horizontal = options.margin;
          this.options.margin.item.vertical = options.margin;
        }
        else if (typeof options.margin === 'object') {
          util.selectiveExtend(['axis'], this.options.margin, options.margin);
          if ('item' in options.margin) {
            if (typeof options.margin.item === 'number') {
              this.options.margin.item.horizontal = options.margin.item;
              this.options.margin.item.vertical = options.margin.item;
            }
            else if (typeof options.margin.item === 'object') {
              util.selectiveExtend(['horizontal', 'vertical'], this.options.margin.item, options.margin.item);
            }
          }
        }
      }

      ['locale', 'locales'].forEach(key => {
        if (key in options) {
          this.options[key] = options[key];
        }
      });

      if ('editable' in options) {
        if (typeof options.editable === 'boolean') {
          this.options.editable.updateTime    = options.editable;
          this.options.editable.updateGroup   = options.editable;
          this.options.editable.add           = options.editable;
          this.options.editable.remove        = options.editable;
          this.options.editable.overrideItems = false;
        }
        else if (typeof options.editable === 'object') {
          util.selectiveExtend(['updateTime', 'updateGroup', 'add', 'remove', 'overrideItems'], this.options.editable, options.editable);
        }
      }

      if ('groupEditable' in options) {
        if (typeof options.groupEditable === 'boolean') {
          this.options.groupEditable.order  = options.groupEditable;
          this.options.groupEditable.add    = options.groupEditable;
          this.options.groupEditable.remove = options.groupEditable;
        }
        else if (typeof options.groupEditable === 'object') {
          util.selectiveExtend(['order', 'add', 'remove'], this.options.groupEditable, options.groupEditable);
        }
      }

      // callback functions
      const addCallback = name => {
        const fn = options[name];
        if (fn) {
          if (!(typeof fn === 'function')) {
            throw new Error(`option ${name} must be a function ${name}(item, callback)`);
          }
          this.options[name] = fn;
        }
      };
      ['onDropObjectOnItem', 'onAdd', 'onUpdate', 'onRemove', 'onMove', 'onMoving', 'onAddGroup', 'onMoveGroup', 'onRemoveGroup'].forEach(addCallback);

      if (options.cluster) {
        Object.assign(this.options, {
          cluster: options.cluster
        });
        if (!this.clusterGenerator) {
          this.clusterGenerator = new ClusterGenerator(this);
        } 
        this.clusterGenerator.setItems(this.items, { applyOnChangedLevel: false });
        this.markDirty({ refreshItems: true, restackGroups: true });

        this.redraw();
      } else if (this.clusterGenerator) {
        this._detachAllClusters();
        this.clusters = [];
        this.clusterGenerator = null;
        this.options.cluster = undefined;
        this.markDirty({ refreshItems: true, restackGroups: true });

        this.redraw();
      } else {
        // force the itemSet to refresh: options like orientation and margins may be changed
        this.markDirty();
      }
    }
  }

  /**
   * Mark the ItemSet dirty so it will refresh everything with next redraw.
   * Optionally, all items can be marked as dirty and be refreshed.
   * @param {{refreshItems: boolean}} [options]
   */
  markDirty(options) {
    this.groupIds = [];

    if (options) {
      if (options.refreshItems) {
        util.forEach(this.items, item => {
          item.dirty = true;
          if (item.displayed) item.redraw();
        });
      }
      
      if (options.restackGroups) {
        util.forEach(this.groups, (group, key) => {
          if (key === BACKGROUND) return;
          group.stackDirty = true;
        });
      }
    }
  }

  /**
   * Destroy the ItemSet
   */
  destroy() {
    this.clearPopupTimer();
    this.hide();
    this.setItems(null);
    this.setGroups(null);

    this.hammer && this.hammer.destroy();
    this.groupHammer && this.groupHammer.destroy();
    this.hammer = null;

    this.body = null;
    this.conversion = null;
  }

  /**
   * Hide the component from the DOM
   */
  hide() {
    // remove the frame containing the items
    if (this.dom.frame.parentNode) {
      this.dom.frame.parentNode.removeChild(this.dom.frame);
    }

    // remove the axis with dots
    if (this.dom.axis.parentNode) {
      this.dom.axis.parentNode.removeChild(this.dom.axis);
    }

    // remove the labelset containing all group labels
    if (this.dom.labelSet.parentNode) {
      this.dom.labelSet.parentNode.removeChild(this.dom.labelSet);
    }
  }

  /**
   * Show the component in the DOM (when not already visible).
   */
  show() {
    // show frame containing the items
    if (!this.dom.frame.parentNode) {
      this.body.dom.center.appendChild(this.dom.frame);
    }

    // show axis with dots
    if (!this.dom.axis.parentNode) {
      this.body.dom.backgroundVertical.appendChild(this.dom.axis);
    }

    // show labelset containing labels
    if (!this.dom.labelSet.parentNode) {
      if (this.options.rtl) {
        this.body.dom.right.appendChild(this.dom.labelSet);
      } else {
        this.body.dom.left.appendChild(this.dom.labelSet);
      }
    }
  }

  /**
   * Activates the popup timer to show the given popup after a fixed time.
   * @param {Popup} popup
   */
  setPopupTimer(popup) {
    this.clearPopupTimer();
    if (popup) {
      const delay = this.options.tooltip.delay || typeof this.options.tooltip.delay === 'number' ?
            this.options.tooltip.delay :
            500;
      this.popupTimer = setTimeout(
        function () {
          popup.show()
        }, delay);
    }
  }

  /**
   * Clears the popup timer for the tooltip.
   */
  clearPopupTimer() {
    if (this.popupTimer != null) {
        clearTimeout(this.popupTimer);
        this.popupTimer = null;
    }
  }
  
  /**
   * Set selected items by their id. Replaces the current selection
   * Unknown id's are silently ignored.
   * @param {string[] | string} [ids] An array with zero or more id's of the items to be
   *                                  selected, or a single item id. If ids is undefined
   *                                  or an empty array, all items will be unselected.
   */
  setSelection(ids) {
    if (ids == undefined) { 
      ids = [];
    }
    
    if (!Array.isArray(ids)) {
      ids = [ids];
    }
  

    const idsToDeselect = this.selection.filter(id => ids.indexOf(id) === -1);

    // unselect currently selected items
    for (let selectedId of idsToDeselect) {
      const item = this.getItemById(selectedId);
      if (item) {
        item.unselect();
      }
    }
  
    // select items
    this.selection = [ ...ids ];
    for (let id of ids) {
      const item = this.getItemById(id);
      if (item) {
        item.select();
      }
    }
  }

  /**
   * Get the selected items by their id
   * @return {Array} ids  The ids of the selected items
   */
  getSelection() {
    return this.selection.concat([]);
  }

  /**
   * Get the id's of the currently visible items.
   * @returns {Array} The ids of the visible items
   */
  getVisibleItems() {
    const range = this.body.range.getRange();
    let right;
    let left;

    if (this.options.rtl) { 
      right  = this.body.util.toScreen(range.start);
      left = this.body.util.toScreen(range.end);
    } else {
      left  = this.body.util.toScreen(range.start);
      right = this.body.util.toScreen(range.end);
    }

    const ids = [];
    for (const groupId in this.groups) {
      if (!Object.prototype.hasOwnProperty.call(this.groups, groupId))
        continue;

      const group = this.groups[groupId];
      const rawVisibleItems = group.isVisible ? group.visibleItems : [];

      // filter the "raw" set with visibleItems into a set which is really
      // visible by pixels
      for (const item of rawVisibleItems) {
        // TODO: also check whether visible vertically
        if (this.options.rtl) { 
          if ((item.right < left) && (item.right + item.width > right)) {
            ids.push(item.id);
          }
        } else {
          if ((item.left < right) && (item.left + item.width > left)) {
            ids.push(item.id);
          }
        }
      }
    }

    return ids;
  }

  /**
   * Get the id's of the items at specific time, where a click takes place on the timeline.
   * @param {Date} timeOfEvent The point in time to query items.
   * @returns {Array} The ids of all items in existence at the time of click event on the timeline.
   */
  getItemsAtCurrentTime(timeOfEvent) {
    let right;
    let left;

    if (this.options.rtl) { 
      right  = this.body.util.toScreen(timeOfEvent);
      left = this.body.util.toScreen(timeOfEvent);
    } else {
      left  = this.body.util.toScreen(timeOfEvent);
      right = this.body.util.toScreen(timeOfEvent);
    }

    const ids = [];
    for (const groupId in this.groups) {
      if (!Object.prototype.hasOwnProperty.call(this.groups, groupId))
        continue;

      const group = this.groups[groupId];
      const rawVisibleItems = group.isVisible ? group.visibleItems : [];

      // filter the "raw" set with visibleItems into a set which is really
      // visible by pixels
      for (const item of rawVisibleItems) {
        if (this.options.rtl) { 
          if ((item.right < left) && (item.right + item.width > right)) {
            ids.push(item.id);
          }
        } else {
          if ((item.left < right) && (item.left + item.width > left)) {
            ids.push(item.id);
          }
        }
      }
    }

    return ids;
  }

  /**
   * Get the id's of the currently visible groups.
   * @returns {Array} The ids of the visible groups
   */
  getVisibleGroups() {
    const ids = [];

    for (const groupId in this.groups) {
      if (!Object.prototype.hasOwnProperty.call(this.groups, groupId))
        continue;

      const group = this.groups[groupId];
      if (group.isVisible)
        ids.push(groupId);
    }

    return ids;
  }
  
  /**
   * get item by id
   * @param {string} id
   * @return {object} item
   */
  getItemById(id) {
    return this.items[id] || this.clusters.find(cluster => cluster.id === id);
  } 

  /**
   * Deselect a selected item
   * @param {string | number} id
   * @private
   */
  _deselect(id) {
    const selection = this.selection;
    for (let i = 0, ii = selection.length; i < ii; i++) {
      if (selection[i] == id) { // non-strict comparison!
        selection.splice(i, 1);
        break;
      }
    }
  }

  /**
   * Repaint the component
   * @return {boolean} Returns true if the component is resized
   */
  redraw() {
    const margin = this.options.margin;
    const range = this.body.range;
    const asSize = util.option.asSize;
    const options = this.options;
    const orientation = options.orientation.item;
    let resized = false;
    const frame = this.dom.frame;

    // recalculate absolute position (before redrawing groups)
    this.props.top = this.body.domProps.top.height + this.body.domProps.border.top;

    if (this.options.rtl) {
      this.props.right = this.body.domProps.right.width + this.body.domProps.border.right;
    } else {
      this.props.left = this.body.domProps.left.width + this.body.domProps.border.left;
    }

    // update class name
    frame.className = 'vis-itemset';

    if (this.options.cluster) {
      this._clusterItems();
    }

    // reorder the groups (if needed)
    resized = this._orderGroups() || resized;

    // check whether zoomed (in that case we need to re-stack everything)
    // TODO: would be nicer to get this as a trigger from Range
    const visibleInterval = range.end - range.start;
    const zoomed = (visibleInterval != this.lastVisibleInterval) || (this.props.width != this.props.lastWidth);
    const scrolled = range.start != this.lastRangeStart;
    const changedStackOption = options.stack != this.lastStack;
    const changedStackSubgroupsOption = options.stackSubgroups != this.lastStackSubgroups;
    const forceRestack = (zoomed || scrolled || changedStackOption || changedStackSubgroupsOption);
    this.lastVisibleInterval = visibleInterval;
    this.lastRangeStart = range.start;
    this.lastStack = options.stack;
    this.lastStackSubgroups = options.stackSubgroups;

    this.props.lastWidth = this.props.width;
    const firstGroup = this._firstGroup();
    const firstMargin = {
      item: margin.item,
      axis: margin.axis
    };
    const nonFirstMargin = {
      item: margin.item,
      axis: margin.item.vertical / 2
    };
    let height = 0;
    const minHeight = margin.axis + margin.item.vertical;

    // redraw the background group
    this.groups[BACKGROUND].redraw(range, nonFirstMargin, forceRestack);

    const redrawQueue = {};
    let redrawQueueLength = 0;

    // collect redraw functions
    util.forEach(this.groups, (group, key) => {
      if (key === BACKGROUND) return;
      const groupMargin = group == firstGroup ? firstMargin : nonFirstMargin;
      const returnQueue = true;
      redrawQueue[key] = group.redraw(range, groupMargin, forceRestack, returnQueue);
      redrawQueueLength = redrawQueue[key].length;
    });

    const needRedraw = redrawQueueLength > 0;
    if (needRedraw) {
      const redrawResults = {};

      for (let i = 0; i < redrawQueueLength; i++) {
        util.forEach(redrawQueue, (fns, key) => {
          redrawResults[key] = fns[i]();
        });
      }

      // redraw all regular groups
      util.forEach(this.groups, (group, key) => {
        if (key === BACKGROUND) return;
        const groupResized = redrawResults[key];
        resized = groupResized || resized;
        height += group.height;
      });
      height = Math.max(height, minHeight);
    }

    height = Math.max(height, minHeight);

    // update frame height
    frame.style.height  = asSize(height);

    // calculate actual size
    this.props.width = frame.offsetWidth;
    this.props.height = height;

    // reposition axis
    this.dom.axis.style.top = asSize((orientation == 'top') ?
        (this.body.domProps.top.height + this.body.domProps.border.top) :
        (this.body.domProps.top.height + this.body.domProps.centerContainer.height));
    if (this.options.rtl) {
      this.dom.axis.style.right = '0';
    } else {
      this.dom.axis.style.left = '0';
    }

    this.hammer.get('press').set({time: this.options.longSelectPressTime});

    this.initialItemSetDrawn = true;
    // check if this component is resized
    resized = this._isResized() || resized;

    return resized;
  }

  /**
   * Get the first group, aligned with the axis
   * @return {Group | null} firstGroup
   * @private
   */
  _firstGroup() {
    const firstGroupIndex = (this.options.orientation.item == 'top') ? 0 : (this.groupIds.length - 1);
    const firstGroupId = this.groupIds[firstGroupIndex];
    const firstGroup = this.groups[firstGroupId] || this.groups[UNGROUPED];

    return firstGroup || null;
  }

  /**
   * Create or delete the group holding all ungrouped items. This group is used when
   * there are no groups specified.
   * @protected
   */
  _updateUngrouped() {
    let ungrouped = this.groups[UNGROUPED];
    let item;
    let itemId;

    if (this.groupsData) {
      // remove the group holding all ungrouped items
      if (ungrouped) {
        ungrouped.dispose();
        delete this.groups[UNGROUPED];

        for (itemId in this.items) {
          if (!Object.prototype.hasOwnProperty.call(this.items, itemId))
            continue;
          item = this.items[itemId];
          item.parent && item.parent.remove(item);
          const groupId = this.getGroupId(item.data);
          const group = this.groups[groupId];
          group && group.add(item) || item.hide();
        }
      }
    }
    else {
      // create a group holding all (unfiltered) items
      if (!ungrouped) {
        const id = null;
        const data = null;
        ungrouped = new Group(id, data, this);
        this.groups[UNGROUPED] = ungrouped;

        for (itemId in this.items) {
          if (!Object.prototype.hasOwnProperty.call(this.items, itemId))
            continue;
          item = this.items[itemId];
          ungrouped.add(item);
        }

        ungrouped.show();
      }
    }
  }

  /**
   * Get the element for the labelset
   * @return {HTMLElement} labelSet
   */
  getLabelSet() {
    return this.dom.labelSet;
  }

  /**
   * Set items
   * @param {vis.DataSet | null} items
   */
  setItems(items) {
    this.itemsSettingTime = new Date();
    const me = this;
    let ids;
    const oldItemsData = this.itemsData;

    // replace the dataset
    if (!items) {
      this.itemsData = null;
    }
    else if (isDataViewLike(items)) {
      this.itemsData = typeCoerceDataSet(items);
    }
    else {
      throw new TypeError('Data must implement the interface of DataSet or DataView');
    }

    if (oldItemsData) {
      // unsubscribe from old dataset
      util.forEach(this.itemListeners, (callback, event) => {
        oldItemsData.off(event, callback);
      });

      // stop maintaining a coerced version of the old data set
      oldItemsData.dispose()

      // remove all drawn items
      ids = oldItemsData.getIds();
      this._onRemove(ids);
    }

    if (this.itemsData) {
      // subscribe to new dataset
      const id = this.id;
      util.forEach(this.itemListeners, (callback, event) => {
        me.itemsData.on(event, callback, id);
      });

      // add all new items
      ids = this.itemsData.getIds();
      this._onAdd(ids);

      // update the group holding all ungrouped items
      this._updateUngrouped();
    }

    this.body.emitter.emit('_change', {queue: true});
  }

  /**
   * Get the current items
   * @returns {vis.DataSet | null}
   */
  getItems() {
    return this.itemsData != null ? this.itemsData.rawDS : null;
  }

  /**
   * Set groups
   * @param {vis.DataSet} groups
   */
  setGroups(groups) {
    const me = this;
    let ids;

    // unsubscribe from current dataset
    if (this.groupsData) {
      util.forEach(this.groupListeners, (callback, event) => {
        me.groupsData.off(event, callback);
      });

      // remove all drawn groups
      ids = this.groupsData.getIds();
      this.groupsData = null;
      this._onRemoveGroups(ids); // note: this will cause a redraw
    }

    // replace the dataset
    if (!groups) {
      this.groupsData = null;
    }
    else if (isDataViewLike(groups)) {
      this.groupsData = groups;
    }
    else {
      throw new TypeError('Data must implement the interface of DataSet or DataView');
    }

    if (this.groupsData) {
      // go over all groups nesting
      const groupsData = this.groupsData.getDataSet()

      groupsData.get().forEach(group => {
        if (group.nestedGroups) {
          group.nestedGroups.forEach(nestedGroupId => {
            const updatedNestedGroup = groupsData.get(nestedGroupId);
            updatedNestedGroup.nestedInGroup = group.id;
            if (group.showNested == false) {
              updatedNestedGroup.visible = false;
            }
            groupsData.update(updatedNestedGroup);
          })
        }
      });

      // subscribe to new dataset
      const id = this.id;
      util.forEach(this.groupListeners, (callback, event) => {
        me.groupsData.on(event, callback, id);
      });

      // draw all ms
      ids = this.groupsData.getIds();
      this._onAddGroups(ids);
    }

    // update the group holding all ungrouped items
    this._updateUngrouped();

    // update the order of all items in each group
    this._order();

    if (this.options.cluster) {
      this.clusterGenerator.updateData();
      this._clusterItems();
      this.markDirty({ refreshItems: true, restackGroups: true });
    }

    this.body.emitter.emit('_change', {queue: true});
  }

  /**
   * Get the current groups
   * @returns {vis.DataSet | null} groups
   */
  getGroups() {
    return this.groupsData;
  }

  /**
   * Remove an item by its id
   * @param {string | number} id
   */
  removeItem(id) {
    const item = this.itemsData.get(id);

    if (item) {
      // confirm deletion
      this.options.onRemove(item, item => {
        if (item) {
          // remove by id here, it is possible that an item has no id defined
          // itself, so better not delete by the item itself
          this.itemsData.remove(id);
        }
      });
    }
  }

  /**
   * Get the time of an item based on it's data and options.type
   * @param {Object} itemData
   * @returns {string} Returns the type
   * @private
   */
  _getType(itemData) {
    return itemData.type || this.options.type || (itemData.end ? 'range' : 'box');
  }

  /**
   * Get the group id for an item
   * @param {Object} itemData
   * @returns {string} Returns the groupId
   * @private
   */
  getGroupId(itemData) {
    const type = this._getType(itemData);
    if (type == 'background' && itemData.group == undefined) {
     return BACKGROUND;
    }
    else {
      return this.groupsData ? itemData.group : UNGROUPED;
    }
  }

  /**
   * Handle updated items
   * @param {number[]} ids
   * @protected
   */
  _onUpdate(ids) {
    const me = this;

    ids.forEach(id => {
      const itemData = me.itemsData.get(id);
      let item = me.items[id];
      const type = itemData ? me._getType(itemData) : null;

      const constructor = ItemSet.types[type];
      let selected;

      if (item) {
        // update item   	
        if (!constructor || !(item instanceof constructor)) {
          // item type has changed, delete the item and recreate it
          selected = item.selected; // preserve selection of this item
          me._removeItem(item);
          item = null;
        }
        else {
          me._updateItem(item, itemData);
        }
      }

      if (!item && itemData) {
        // create item
        if (constructor) {
          item = new constructor(itemData, me.conversion, me.options);
          item.id = id; // TODO: not so nice setting id afterwards

          me._addItem(item);
          if (selected) {
            this.selection.push(id);
            item.select();
          }
        }
        else {
          throw new TypeError(`Unknown item type "${type}"`);
        }
      }
    });

    this._order();
    
    if (this.options.cluster) {
      this.clusterGenerator.setItems(this.items, { applyOnChangedLevel: false });
      this._clusterItems();
    }

    this.body.emitter.emit('_change', {queue: true});
  }

  /**
   * Handle removed items
   * @param {number[]} ids
   * @protected
   */
  _onRemove(ids) {
    let count = 0;
    const me = this;
    ids.forEach(id => {
      const item = me.items[id];
      if (item) {
        count++;
        me._removeItem(item);
      }
    });

    if (count) {
      // update order
      this._order();
      this.body.emitter.emit('_change', {queue: true});
    }
  }

  /**
   * Update the order of item in all groups
   * @private
   */
  _order() {
    // reorder the items in all groups
    // TODO: optimization: only reorder groups affected by the changed items
    util.forEach(this.groups, group => {
      group.order();
    });
  }

  /**
   * Handle updated groups
   * @param {number[]} ids
   * @private
   */
  _onUpdateGroups(ids) {
    this._onAddGroups(ids);
  }

  /**
   * Handle changed groups (added or updated)
   * @param {number[]} ids
   * @private
   */
  _onAddGroups(ids) {
    const me = this;

    ids.forEach(id => {
      const groupData = me.groupsData.get(id);
      let group = me.groups[id];

      if (!group) {
        // check for reserved ids
        if (id == UNGROUPED || id == BACKGROUND) {
          throw new Error(`Illegal group id. ${id} is a reserved id.`);
        }

        const groupOptions = Object.create(me.options);
        util.extend(groupOptions, {
          height: null
        });

        group = new Group(id, groupData, me);
        me.groups[id] = group;

        // add items with this groupId to the new group
        for (const itemId in me.items) {
          if (!Object.prototype.hasOwnProperty.call(me.items, itemId))
            continue;

          const item = me.items[itemId];
          if (item.data.group == id)
            group.add(item);
        }

        group.order();
        group.show();
      }
      else {
        // update group
        group.setData(groupData);
      }
    });

    this.body.emitter.emit('_change', {queue: true});
  }

  /**
   * Handle removed groups
   * @param {number[]} ids
   * @private
   */
  _onRemoveGroups(ids) {
    ids.forEach(id => {
      const group = this.groups[id];

      if (group) {
        group.dispose();
        delete this.groups[id];
      }
    });

    if (this.options.cluster) {
      this.clusterGenerator.updateData();
      this._clusterItems();
    } 

    this.markDirty({ restackGroups: !!this.options.cluster });
    this.body.emitter.emit('_change', {queue: true});
  }

  /**
   * Reorder the groups if needed
   * @return {boolean} changed
   * @private
   */
  _orderGroups() {
    if (this.groupsData) {
      // reorder the groups
      let groupIds = this.groupsData.getIds({
        order: this.options.groupOrder
      });

      groupIds = this._orderNestedGroups(groupIds);

      const changed = !util.equalArray(groupIds, this.groupIds);
      if (changed) {
        // hide all groups, removes them from the DOM
        const groups = this.groups;
        groupIds.forEach(groupId => {
          groups[groupId].hide();
        });

        // show the groups again, attach them to the DOM in correct order
        groupIds.forEach(groupId => {
          groups[groupId].show();
        });

        this.groupIds = groupIds;
      }

      return changed;
    }
    else {
      return false;
    }
  }

  /**
   * Reorder the nested groups
   *
   * @param {Array.<number>} groupIds
   * @returns {Array.<number>}
   * @private
   */
  _orderNestedGroups(groupIds) {
    /**
     * Recursively order nested groups
     *
     * @param {ItemSet} t
     * @param {Array.<number>} groupIds
     * @returns {Array.<number>}
     * @private
     */
    function getOrderedNestedGroups(t, groupIds) {
      let result = [];
      groupIds.forEach(groupId => {
        result.push(groupId);
        const groupData = t.groupsData.get(groupId);
        if (groupData.nestedGroups) {
          const nestedGroupIds = t.groupsData.get({
            filter(nestedGroup) {
              return nestedGroup.nestedInGroup == groupId;
            },
            order: t.options.groupOrder
          }).map(nestedGroup => nestedGroup.id);
          result = result.concat(getOrderedNestedGroups(t, nestedGroupIds));
        }
      });

      return result;
    }

    const topGroupIds = groupIds.filter(groupId => !this.groupsData.get(groupId).nestedInGroup);

    return getOrderedNestedGroups(this, topGroupIds);
  }

  /**
   * Add a new item
   * @param {Item} item
   * @private
   */
  _addItem(item) {
    this.items[item.id] = item;

    // add to group
    const groupId = this.getGroupId(item.data);
    const group = this.groups[groupId];

    if (!group) {
      item.groupShowing = false;
    } else if (group && group.data && group.data.showNested) {
      item.groupShowing = true;
    }

    if (group) group.add(item);
  }

  /**
   * Update an existing item
   * @param {Item} item
   * @param {Object} itemData
   * @private
   */
  _updateItem(item, itemData) {
    // update the items data (will redraw the item when displayed)
    item.setData(itemData);

    const groupId = this.getGroupId(item.data);
    const group = this.groups[groupId];
    if (!group) {
      item.groupShowing = false;
    } else if (group && group.data && group.data.showNested) {
      item.groupShowing = true;
    }
  }

  /**
   * Delete an item from the ItemSet: remove it from the DOM, from the map
   * with items, and from the map with visible items, and from the selection
   * @param {Item} item
   * @private
   */
  _removeItem(item) {
    // remove from DOM
    item.hide();

    // remove from items
    delete this.items[item.id];

    // remove from selection
    const index = this.selection.indexOf(item.id);
    if (index != -1) this.selection.splice(index, 1);

    // remove from group
    item.parent && item.parent.remove(item);

    // remove Tooltip from DOM
    if (this.popup != null) {
      this.popup.hide();
    }
  }

  /**
   * Create an array containing all items being a range (having an end date)
   * @param {Array.<Object>} array
   * @returns {Array}
   * @private
   */
  _constructByEndArray(array) {
    const endArray = [];

    for (let i = 0; i < array.length; i++) {
      if (array[i] instanceof RangeItem) {
        endArray.push(array[i]);
      }
    }
    return endArray;
  }

  /**
   * Register the clicked item on touch, before dragStart is initiated.
   *
   * dragStart is initiated from a mousemove event, AFTER the mouse/touch is
   * already moving. Therefore, the mouse/touch can sometimes be above an other
   * DOM element than the item itself.
   *
   * @param {Event} event
   * @private
   */
  _onTouch(event) {
    // store the touched item, used in _onDragStart
    this.touchParams.item = this.itemFromTarget(event);
    this.touchParams.dragLeftItem = event.target.dragLeftItem || false;
    this.touchParams.dragRightItem = event.target.dragRightItem || false;
    this.touchParams.itemProps = null;
  }

  /**
   * Given an group id, returns the index it has.
   *
   * @param {number} groupId
   * @returns {number} index / groupId
   * @private
   */
  _getGroupIndex(groupId) {
      for (let i = 0; i < this.groupIds.length; i++) {
          if (groupId == this.groupIds[i])
              return i;
      }
  }

  /**
   * Start dragging the selected events
   * @param {Event} event
   * @private
   */
  _onDragStart(event) {
    if (this.touchParams.itemIsDragging) { return; }
    const item = this.touchParams.item || null;
    const me = this;
    let props;

    if (item && (item.selected || this.options.itemsAlwaysDraggable.item)) {

      if (this.options.editable.overrideItems &&
          !this.options.editable.updateTime &&
          !this.options.editable.updateGroup) {
        return;
      }

      // override options.editable
      if ((item.editable != null && !item.editable.updateTime && !item.editable.updateGroup)
          && !this.options.editable.overrideItems) {
        return;
      }

      const dragLeftItem = this.touchParams.dragLeftItem;
      const dragRightItem = this.touchParams.dragRightItem;
      this.touchParams.itemIsDragging = true;
      this.touchParams.selectedItem = item;

      if (dragLeftItem) {
        props = {
          item: dragLeftItem,
          initialX: event.center.x,
          dragLeft:  true,
          data: this._cloneItemData(item.data)
        };

        this.touchParams.itemProps = [props];
      } else if (dragRightItem) {
        props = {
          item: dragRightItem,
          initialX: event.center.x,
          dragRight: true,
          data: this._cloneItemData(item.data)
        };

        this.touchParams.itemProps = [props];
      } else if (this.options.editable.add && (event.srcEvent.ctrlKey || event.srcEvent.metaKey)) {
        // create a new range item when dragging with ctrl key down
        this._onDragStartAddItem(event);
      } else {
        if(this.groupIds.length < 1) {
          // Mitigates a race condition if _onDragStart() is
          // called after markDirty() without redraw() being called between.
          this.redraw();
        }
        
        const baseGroupIndex = this._getGroupIndex(item.data.group);

        const itemsToDrag = (this.options.itemsAlwaysDraggable.item && !item.selected) ? [item.id] : this.getSelection();

        this.touchParams.itemProps = itemsToDrag.map(id => {
          const item = me.items[id];
          const groupIndex = me._getGroupIndex(item.data.group);
          return {
            item,
            initialX: event.center.x,
            groupOffset: baseGroupIndex-groupIndex,
            data: this._cloneItemData(item.data)
          };
        });
      }

      event.stopPropagation();
    } else if (this.options.editable.add && (event.srcEvent.ctrlKey || event.srcEvent.metaKey)) {
      // create a new range item when dragging with ctrl key down
      this._onDragStartAddItem(event);
    }
  }

  /**
   * Start creating a new range item by dragging.
   * @param {Event} event
   * @private
   */
  _onDragStartAddItem(event) {
    const snap = this.options.snap || null;
    const frameRect = this.dom.frame.getBoundingClientRect()

    // plus (if rtl) 10 to compensate for the drag starting as soon as you've moved 10px
    const x = this.options.rtl ? frameRect.right - event.center.x  + 10 : event.center.x - frameRect.left - 10;

    const time = this.body.util.toTime(x);
    const scale = this.body.util.getScale();
    const step = this.body.util.getStep();
    const start = snap ? snap(time, scale, step) : time;
    const end = start;

    const itemData = {
      type: 'range',
      start,
      end,
      content: 'new item'
    };

    const id = randomUUID();
    itemData[this.itemsData.idProp] = id;

    const group = this.groupFromTarget(event);
    if (group) {
      itemData.group = group.groupId;
    }
    const newItem = new RangeItem(itemData, this.conversion, this.options);
    newItem.id = id; // TODO: not so nice setting id afterwards
    newItem.data = this._cloneItemData(itemData);
    this._addItem(newItem);
    this.touchParams.selectedItem = newItem;
    
    const props = {
      item: newItem,
      initialX: event.center.x,
      data: newItem.data
    };

    if (this.options.rtl) {
      props.dragLeft = true;
    } else {
      props.dragRight = true;
    }
    this.touchParams.itemProps = [props];

    event.stopPropagation();
  }

  /**
   * Drag selected items
   * @param {Event} event
   * @private
   */
  _onDrag(event) {
    if (this.popup != null && this.options.showTooltips && !this.popup.hidden) {
      // this.popup.hide();
      const container = this.body.dom.centerContainer;
      const containerRect = container.getBoundingClientRect()
      this.popup.setPosition(
        event.center.x - containerRect.left + container.offsetLeft,
        event.center.y - containerRect.top + container.offsetTop
      );
      this.popup.show(); // redraw
    }
    
    if (this.touchParams.itemProps) {
      event.stopPropagation();

      const me = this;
      const snap = this.options.snap || null;
      const domRootOffsetLeft = this.body.dom.root.offsetLeft;
      const xOffset = this.options.rtl ? domRootOffsetLeft + this.body.domProps.right.width : domRootOffsetLeft + this.body.domProps.left.width;
      const scale = this.body.util.getScale();
      const step = this.body.util.getStep();

      //only calculate the new group for the item that's actually dragged
      const selectedItem = this.touchParams.selectedItem;
      const updateGroupAllowed = ((this.options.editable.overrideItems || selectedItem.editable == null) && this.options.editable.updateGroup) ||
                               (!this.options.editable.overrideItems && selectedItem.editable != null && selectedItem.editable.updateGroup);
      let newGroupBase = null;
      if (updateGroupAllowed && selectedItem) {
        if (selectedItem.data.group != undefined) {
          // drag from one group to another
          const group = me.groupFromTarget(event);
          if (group) {
            //we know the offset for all items, so the new group for all items
            //will be relative to this one.
            newGroupBase = this._getGroupIndex(group.groupId);
          }
        }
      }

      // move
      this.touchParams.itemProps.forEach(props => {
        const current = me.body.util.toTime(event.center.x - xOffset);
        const initial = me.body.util.toTime(props.initialX - xOffset);
        let offset;
        let initialStart;
        let initialEnd;
        let start;
        let end;

        if (this.options.rtl) {
          offset = -(current - initial); // ms
        } else {
          offset = (current - initial); // ms
        }

        let itemData = this._cloneItemData(props.item.data); // clone the data
        if (props.item.editable != null
          && !props.item.editable.updateTime
          && !props.item.editable.updateGroup
          && !me.options.editable.overrideItems) {
          return;
        }

        const updateTimeAllowed = ((this.options.editable.overrideItems || selectedItem.editable == null) && this.options.editable.updateTime) ||
                                 (!this.options.editable.overrideItems && selectedItem.editable != null && selectedItem.editable.updateTime);
        if (updateTimeAllowed) {
          if (props.dragLeft) {
            // drag left side of a range item
            if (this.options.rtl) {
              if (itemData.end != undefined) {
                initialEnd = util.convert(props.data.end, 'Date');
                end = new Date(initialEnd.valueOf() + offset);
                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.end = snap ? snap(end, scale, step) : end;
              }
            } else {
              if (itemData.start != undefined) {
                initialStart = util.convert(props.data.start, 'Date');
                start = new Date(initialStart.valueOf() + offset);
                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.start = snap ? snap(start, scale, step) : start;
              }
            }
          }
          else if (props.dragRight) {
            // drag right side of a range item
            if (this.options.rtl) {
              if (itemData.start != undefined) {
                initialStart = util.convert(props.data.start, 'Date');
                start = new Date(initialStart.valueOf() + offset);
                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.start = snap ? snap(start, scale, step) : start;
              }
            } else {
              if (itemData.end != undefined) {
                initialEnd = util.convert(props.data.end, 'Date');
                end = new Date(initialEnd.valueOf() + offset);
                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.end = snap ? snap(end, scale, step) : end;
              }
            }
          }
          else {
            // drag both start and end
            if (itemData.start != undefined) {

              initialStart = util.convert(props.data.start, 'Date').valueOf();
              start = new Date(initialStart + offset);

              if (itemData.end != undefined) {
                initialEnd = util.convert(props.data.end, 'Date');
                const duration  = initialEnd.valueOf() - initialStart.valueOf();

                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.start = snap ? snap(start, scale, step) : start;
                itemData.end   = new Date(itemData.start.valueOf() + duration);
              }
              else {
                // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                itemData.start = snap ? snap(start, scale, step) : start;
              }
            }
          }
        }

        if (updateGroupAllowed && (!props.dragLeft && !props.dragRight) && newGroupBase!=null) {
          if (itemData.group != undefined) {
            let newOffset = newGroupBase - props.groupOffset;

            //make sure we stay in bounds
            newOffset = Math.max(0, newOffset);
            newOffset = Math.min(me.groupIds.length-1, newOffset);
            itemData.group = me.groupIds[newOffset];
          }
        }

        // confirm moving the item
        itemData = this._cloneItemData(itemData);  // convert start and end to the correct type
        me.options.onMoving(itemData, itemData => {
          if (itemData) {
            props.item.setData(this._cloneItemData(itemData, 'Date'));
          }
        });
      });
      
      this.body.emitter.emit('_change');
    }
  }

  /**
   * Move an item to another group
   * @param {Item} item
   * @param {string | number} groupId
   * @private
   */
  _moveToGroup(item, groupId) {
    const group = this.groups[groupId];
    if (group && group.groupId != item.data.group) {
      const oldGroup = item.parent;
      oldGroup.remove(item);
      oldGroup.order();
      
      item.data.group = group.groupId;
      
      group.add(item);
      group.order();
    }
  }

  /**
   * End of dragging selected items
   * @param {Event} event
   * @private
   */
  _onDragEnd(event) {
    this.touchParams.itemIsDragging = false;
    if (this.touchParams.itemProps) {
      event.stopPropagation();

      const me = this;
      const itemProps = this.touchParams.itemProps;
      this.touchParams.itemProps = null;

      itemProps.forEach(props => {
        const id = props.item.id;
        const exists = me.itemsData.get(id) != null;

        if (!exists) {
          // add a new item
          me.options.onAdd(props.item.data, itemData => {
            me._removeItem(props.item); // remove temporary item
            if (itemData) {
              me.itemsData.add(itemData);
            }

            // force re-stacking of all items next redraw
            me.body.emitter.emit('_change');
          });
        }
        else {
          // update existing item
          const itemData = this._cloneItemData(props.item.data); // convert start and end to the correct type
          me.options.onMove(itemData, itemData => {
            if (itemData) {
              // apply changes
              itemData[this.itemsData.idProp] = id; // ensure the item contains its id (can be undefined)
              this.itemsData.update(itemData);
            }
            else {
              // restore original values
              props.item.setData(props.data);

              me.body.emitter.emit('_change');
            }
          });
        }
      });
    }
  }

  /**
   * On group click
   * @param {Event} event
   * @private
   */
  _onGroupClick(event) {
    const group = this.groupFromTarget(event);
    setTimeout(() => {
      this.toggleGroupShowNested(group);
    }, 1)
  }
  
  /**
   * Toggle show nested
   * @param {object} group
   * @param {boolean} force
   */
  toggleGroupShowNested(group, force = undefined) {

    if (!group || !group.nestedGroups) return;

    const groupsData = this.groupsData.getDataSet();

    if (force != undefined) {
      group.showNested = !!force;
    } else {
      group.showNested = !group.showNested;
    }

    let nestingGroup = groupsData.get(group.groupId);
    nestingGroup.showNested = group.showNested;

    let fullNestedGroups = group.nestedGroups;
    let nextLevel = fullNestedGroups;
    while (nextLevel.length > 0) {
      let current = nextLevel;
      nextLevel = [];
      for (let i = 0; i < current.length; i++) {
        let node = groupsData.get(current[i]);
        if (node.nestedGroups) {
          nextLevel = nextLevel.concat(node.nestedGroups);
        }
      }
      if (nextLevel.length > 0) {
        fullNestedGroups = fullNestedGroups.concat(nextLevel);
      }
    }
    var nestedGroups;
    if (nestingGroup.showNested) {
      var showNestedGroups = groupsData.get(nestingGroup.nestedGroups);
      for (let i = 0; i < showNestedGroups.length; i++) {
        let group = showNestedGroups[i];
        if (
          group.nestedGroups &&
          group.nestedGroups.length > 0 &&
          (group.showNested == undefined || group.showNested == true)
        ) {
          showNestedGroups.push(...groupsData.get(group.nestedGroups));
        }        
      }
      nestedGroups = showNestedGroups.map(function (nestedGroup) {
        if (nestedGroup.visible == undefined) {
          nestedGroup.visible = true;
        }
        nestedGroup.visible = !!nestingGroup.showNested;

        return nestedGroup;
      });
    } else {
      nestedGroups = groupsData
        .get(fullNestedGroups)
        .map(function (nestedGroup) {
          if (nestedGroup.visible == undefined) {
            nestedGroup.visible = true;
          }
          nestedGroup.visible = !!nestingGroup.showNested;
          return nestedGroup;
        });
    }

    groupsData.update(nestedGroups.concat(nestingGroup));

    if (nestingGroup.showNested) {
      util.removeClassName(group.dom.label, 'collapsed');
      util.addClassName(group.dom.label, 'expanded');
    } else {
      util.removeClassName(group.dom.label, 'expanded');
      util.addClassName(group.dom.label, 'collapsed');
    }
  }
  
  /**
   * Toggle group drag classname
   * @param {object} group
   */
  toggleGroupDragClassName(group) {
    group.dom.label.classList.toggle('vis-group-is-dragging');
    group.dom.foreground.classList.toggle('vis-group-is-dragging');
  }
  
  /**
   * on drag start
   * @param {Event} event
   * @return {void}   
   * @private
   */
  _onGroupDragStart(event) {
    if (this.groupTouchParams.isDragging) return;

    if (this.options.groupEditable.order) {
      this.groupTouchParams.group = this.groupFromTarget(event);
      
      if (this.groupTouchParams.group) {
        event.stopPropagation();      
        
        this.groupTouchParams.isDragging = true;
        this.toggleGroupDragClassName(this.groupTouchParams.group);
        
        this.groupTouchParams.originalOrder = this.groupsData.getIds({
          order: this.options.groupOrder
        });
      }
    }
  }

  /**
   * on drag
   * @param {Event} event
   * @return {void}
   * @private
   */
  _onGroupDrag(event) {
      if (this.options.groupEditable.order && this.groupTouchParams.group) {
          event.stopPropagation();
          
      const groupsData = this.groupsData.getDataSet()
          // drag from one group to another
          const group = this.groupFromTarget(event);
          
          // try to avoid toggling when groups differ in height
          if (group && group.height != this.groupTouchParams.group.height) {
              const movingUp = (group.top < this.groupTouchParams.group.top);
              const clientY = event.center ? event.center.y : event.clientY;
              const targetGroup = group.dom.foreground.getBoundingClientRect()
              const draggedGroupHeight = this.groupTouchParams.group.height;
              if (movingUp) {
                  // skip swapping the groups when the dragged group is not below clientY afterwards
                  if (targetGroup.top + draggedGroupHeight < clientY) {
                      return;
                  }
              } else {
                  const targetGroupHeight = group.height;
                  // skip swapping the groups when the dragged group is not below clientY afterwards
                  if (targetGroup.top + targetGroupHeight - draggedGroupHeight > clientY) {
                      return;
                  }
              }
          }
          
          if (group && group != this.groupTouchParams.group) {
              const targetGroup = groupsData.get(group.groupId);
              const draggedGroup = groupsData.get(this.groupTouchParams.group.groupId);
              
              // switch groups
              if (draggedGroup && targetGroup) {
                  this.options.groupOrderSwap(draggedGroup, targetGroup, groupsData);
                  groupsData.update(draggedGroup);
                  groupsData.update(targetGroup);
              }
              
              // fetch current order of groups
              const newOrder = groupsData.getIds({
                order: this.options.groupOrder
              });

              
              // in case of changes since _onGroupDragStart
              if (!util.equalArray(newOrder, this.groupTouchParams.originalOrder)) {
                  const origOrder = this.groupTouchParams.originalOrder;
                  const draggedId = this.groupTouchParams.group.groupId;
                  const numGroups = Math.min(origOrder.length, newOrder.length);
                  let curPos = 0;
                  let newOffset = 0;
                  let orgOffset = 0;
                  while (curPos < numGroups) {
                      // as long as the groups are where they should be step down along the groups order
                      while ((curPos+newOffset) < numGroups 
                          && (curPos+orgOffset) < numGroups 
                          && newOrder[curPos+newOffset] == origOrder[curPos+orgOffset]) {
                          curPos++;
                      }
                      
                      // all ok
                      if (curPos+newOffset >= numGroups) {
                          break;
                      }
                      
                      // not all ok
                      // if dragged group was move upwards everything below should have an offset
                      if (newOrder[curPos+newOffset] == draggedId) {
                          newOffset = 1;

                      }
                      // if dragged group was move downwards everything above should have an offset
                      else if (origOrder[curPos+orgOffset] == draggedId) {
                          orgOffset = 1;

                      } 
                      // found a group (apart from dragged group) that has the wrong position -> switch with the 
                      // group at the position where other one should be, fix index arrays and continue
                      else {
                          const slippedPosition = newOrder.indexOf(origOrder[curPos+orgOffset]);
                          const switchGroup = groupsData.get(newOrder[curPos+newOffset]);
                          const shouldBeGroup = groupsData.get(origOrder[curPos+orgOffset]);
                          this.options.groupOrderSwap(switchGroup, shouldBeGroup, groupsData);
                          groupsData.update(switchGroup);
                          groupsData.update(shouldBeGroup);
                          
                          const switchGroupId = newOrder[curPos+newOffset];
                          newOrder[curPos+newOffset] = origOrder[curPos+orgOffset];
                          newOrder[slippedPosition] = switchGroupId;
                          
                          curPos++;
                      }
                  }
              }
              
          }
      }
  }

  /**
   * on drag end
   * @param {Event} event
   * @return {void}
   * @private
   */
  _onGroupDragEnd(event) {
    this.groupTouchParams.isDragging = false;

    if (this.options.groupEditable.order && this.groupTouchParams.group) {
      event.stopPropagation();
          
      // update existing group
      const me = this;
      const id = me.groupTouchParams.group.groupId;
      const dataset = me.groupsData.getDataSet();
      const groupData = util.extend({}, dataset.get(id)); // clone the data
      me.options.onMoveGroup(groupData, groupData => {
        if (groupData) {
          // apply changes
          groupData[dataset._idProp] = id; // ensure the group contains its id (can be undefined)
          dataset.update(groupData);
        }
        else {

          // fetch current order of groups
          const newOrder = dataset.getIds({
              order: me.options.groupOrder
          });

          // restore original order
          if (!util.equalArray(newOrder, me.groupTouchParams.originalOrder)) {
            const origOrder = me.groupTouchParams.originalOrder;
            const numGroups = Math.min(origOrder.length, newOrder.length);
            let curPos = 0;
            while (curPos < numGroups) {
              // as long as the groups are where they should be step down along the groups order
              while (curPos < numGroups && newOrder[curPos] == origOrder[curPos]) {
                curPos++;
              }

              // all ok
              if (curPos >= numGroups) {
                break;
              }

              // found a group that has the wrong position -> switch with the
              // group at the position where other one should be, fix index arrays and continue
              const slippedPosition = newOrder.indexOf(origOrder[curPos]);
              const switchGroup = dataset.get(newOrder[curPos]);
              const shouldBeGroup = dataset.get(origOrder[curPos]);
              me.options.groupOrderSwap(switchGroup, shouldBeGroup, dataset);
              dataset.update(switchGroup);
              dataset.update(shouldBeGroup);

              const switchGroupId = newOrder[curPos];
              newOrder[curPos] = origOrder[curPos];
              newOrder[slippedPosition] = switchGroupId;

              curPos++;
            }
          }
        }
      });

      me.body.emitter.emit('groupDragged', { groupId: id });
      this.toggleGroupDragClassName(this.groupTouchParams.group);
      this.groupTouchParams.group = null;
    }
  }

  /**
   * Handle selecting/deselecting an item when tapping it
   * @param {Event} event
   * @private
   */
  _onSelectItem(event) {
    if (!this.options.selectable) return;

    const ctrlKey  = event.srcEvent && (event.srcEvent.ctrlKey || event.srcEvent.metaKey);
    const shiftKey = event.srcEvent && event.srcEvent.shiftKey;
    if (ctrlKey || shiftKey) {
      this._onMultiSelectItem(event);
      return;
    }

    const oldSelection = this.getSelection();

    const item = this.itemFromTarget(event);
    const selection = item && item.selectable ? [item.id] : [];
    this.setSelection(selection);

    const newSelection = this.getSelection();

    // emit a select event,
    // except when old selection is empty and new selection is still empty
    if (newSelection.length > 0 || oldSelection.length > 0) {
      this.body.emitter.emit('select', {
        items: newSelection,
        event
      });
    }
  }

  /**
   * Handle hovering an item
   * @param {Event} event
   * @private
   */
  _onMouseOver(event) {
    const item = this.itemFromTarget(event);
    if (!item) return;

    // Item we just left
    const related = this.itemFromRelatedTarget(event);
    if (item === related) {
      // We haven't changed item, just element in the item
      return;
    }

    const title = item.getTitle();
    if (this.options.showTooltips && title) {
      if (this.popup == null) {
        this.popup = new Popup(this.body.dom.root,
            this.options.tooltip.overflowMethod || 'flip');
      }

      this.popup.setText(title);
      const container = this.body.dom.centerContainer;
      const containerRect = container.getBoundingClientRect()
      this.popup.setPosition(
        event.clientX - containerRect.left + container.offsetLeft,
        event.clientY - containerRect.top + container.offsetTop
      );
      this.setPopupTimer(this.popup);
    } else {
      // Hovering over item without a title, hide popup
      // Needed instead of _just_ in _onMouseOut due to #2572
      this.clearPopupTimer();
      if (this.popup != null) {
        this.popup.hide();
      }
    }

    this.body.emitter.emit('itemover', {
      item: item.id,
      event
    });
  }

  /**
   * on mouse start
   * @param {Event} event
   * @return {void}   
   * @private
   */
  _onMouseOut(event) {
    const item = this.itemFromTarget(event);
    if (!item) return;

    // Item we are going to
    const related = this.itemFromRelatedTarget(event);
    if (item === related) {
      // We aren't changing item, just element in the item
      return;
    }

    this.clearPopupTimer();
    if (this.popup != null) {
      this.popup.hide();
    }

    this.body.emitter.emit('itemout', {
      item: item.id,
      event
    });
  }

  /**
   * on mouse move
   * @param {Event} event
   * @return {void}   
   * @private
   */
  _onMouseMove(event) {
    const item = this.itemFromTarget(event);
    if (!item) return;

    if (this.popupTimer != null) {
      // restart timer
      this.setPopupTimer(this.popup);
    }
    
    if (this.options.showTooltips && this.options.tooltip.followMouse && this.popup && !this.popup.hidden) {
      const container = this.body.dom.centerContainer;
      const containerRect = container.getBoundingClientRect()
      this.popup.setPosition(
        event.clientX - containerRect.left + container.offsetLeft,
        event.clientY - containerRect.top + container.offsetTop
      );
      this.popup.show(); // Redraw
    }
  }

  /**
   * Handle mousewheel
   * @param {Event}  event   The event
   * @private
   */
  _onMouseWheel(event) {
    if (this.touchParams.itemIsDragging) {
      this._onDragEnd(event);
    }
  }

  /**
   * Handle updates of an item on double tap
   * @param {timeline.Item}  item   The item
   * @private
   */
  _onUpdateItem(item) {
    if (!this.options.selectable) return;
    if (!this.options.editable.updateTime && !this.options.editable.updateGroup) return;

    const me = this;
   
    if (item) {
      // execute async handler to update the item (or cancel it)
      const itemData = me.itemsData.get(item.id); // get a clone of the data from the dataset
      this.options.onUpdate(itemData, itemData => {
        if (itemData) {
          me.itemsData.update(itemData);
        }
      });
    }
  }

  /**
   * Handle drop event of data on item
   * Only called when `objectData.target === 'item'.
   * @param {Event} event The event 
   * @private
   */
  _onDropObjectOnItem(event) {
    const item = this.itemFromTarget(event);
    const objectData = JSON.parse(event.dataTransfer.getData("text"));
    this.options.onDropObjectOnItem(objectData, item)
  }

  /**
   * Handle creation of an item on double tap or drop of a drag event
   * @param {Event} event   The event
   * @private
   */
  _onAddItem(event) {
    if (!this.options.selectable) return;
    if (!this.options.editable.add) return;

    const me = this;
    const snap = this.options.snap || null;

    // add item
    const frameRect = this.dom.frame.getBoundingClientRect()
    const x = this.options.rtl ? frameRect.right - event.center.x : event.center.x - frameRect.left;
    const start = this.body.util.toTime(x);
    const scale = this.body.util.getScale();
    const step = this.body.util.getStep();
    let end;

    let newItemData;
    if (event.type == 'drop') {
      newItemData = JSON.parse(event.dataTransfer.getData("text"));
      newItemData.content = newItemData.content ? newItemData.content : 'new item';
      newItemData.start = newItemData.start ? newItemData.start : (snap ? snap(start, scale, step) : start);
      newItemData.type = newItemData.type || 'box';
      newItemData[this.itemsData.idProp] = newItemData.id || randomUUID();

      if (newItemData.type == 'range' && !newItemData.end) {
        end = this.body.util.toTime(x + this.props.width / 5);
        newItemData.end = snap ? snap(end, scale, step) : end;
      }
    } else {
      newItemData = {
        start: snap ? snap(start, scale, step) : start,
        content: 'new item'
      };
      newItemData[this.itemsData.idProp] = randomUUID();

      // when default type is a range, add a default end date to the new item
      if (this.options.type === 'range') {
        end = this.body.util.toTime(x + this.props.width / 5);
        newItemData.end = snap ? snap(end, scale, step) : end;
      }
    }

    const group = this.groupFromTarget(event);
    if (group) {
      newItemData.group = group.groupId;
    }

    // execute async handler to customize (or cancel) adding an item
    newItemData = this._cloneItemData(newItemData);     // convert start and end to the correct type
    this.options.onAdd(newItemData, item => {
      if (item) {
        me.itemsData.add(item);
        if (event.type == 'drop') {
          me.setSelection([item.id]);
        }
        // TODO: need to trigger a redraw?
      }
    });
  }

  /**
   * Handle selecting/deselecting multiple items when holding an item
   * @param {Event} event
   * @private
   */
  _onMultiSelectItem(event) {
    if (!this.options.selectable) return;

    const item = this.itemFromTarget(event);

    if (item) {
      // multi select items (if allowed)

      let selection = this.options.multiselect
        ? this.getSelection() // take current selection
        : [];                 // deselect current selection

      const shiftKey = event.srcEvent && event.srcEvent.shiftKey || false;

      if ((shiftKey || this.options.sequentialSelection) && this.options.multiselect) {
        // select all items between the old selection and the tapped item
        const itemGroup = this.itemsData.get(item.id).group;

        // when filtering get the group of the last selected item
        let lastSelectedGroup = undefined;
        if (this.options.multiselectPerGroup) {
          if (selection.length > 0) {
            lastSelectedGroup = this.itemsData.get(selection[0]).group;
          }
        }

        // determine the selection range
        if (!this.options.multiselectPerGroup || lastSelectedGroup == undefined || lastSelectedGroup == itemGroup) {
          selection.push(item.id);
        }
        const range = ItemSet._getItemRange(this.itemsData.get(selection));
        
        if (!this.options.multiselectPerGroup || lastSelectedGroup == itemGroup) {
          // select all items within the selection range
          selection = [];
          for (const id in this.items) {
            if (!Object.prototype.hasOwnProperty.call(this.items, id))
              continue;

            const _item = this.items[id];
            const start = _item.data.start;
            const end = (_item.data.end !== undefined) ? _item.data.end : start;

            if (start >= range.min &&
                end <= range.max &&
                (!this.options.multiselectPerGroup || lastSelectedGroup == this.itemsData.get(_item.id).group) &&
                !(_item instanceof BackgroundItem)) {
              selection.push(_item.id); // do not use id but item.id, id itself is stringified
            }
          }
        }
      }
      else {
        // add/remove this item from the current selection
        const index = selection.indexOf(item.id);
        if (index == -1) {
          // item is not yet selected -> select it
          selection.push(item.id);
        }
        else {
          // item is already selected -> deselect it
          selection.splice(index, 1);
        }
      }

      const filteredSelection = selection.filter(item => this.getItemById(item).selectable);

      this.setSelection(filteredSelection);

      this.body.emitter.emit('select', {
        items: this.getSelection(),
        event
      });
    }
  }

  /**
   * Calculate the time range of a list of items
   * @param {Array.<Object>} itemsData
   * @return {{min: Date, max: Date}} Returns the range of the provided items
   * @private
   */
  static _getItemRange(itemsData) {
    let max = null;
    let min = null;

    itemsData.forEach(data => {
      if (min == null || data.start < min) {
        min = data.start;
      }

      if (data.end != undefined) {
        if (max == null || data.end > max) {
          max = data.end;
        }
      }
      else {
        if (max == null || data.start > max) {
          max = data.start;
        }
      }
    });

    return {
      min,
      max
    }
  }

  /**
   * Find an item from an element:
   * searches for the attribute 'vis-item' in the element's tree
   * @param {HTMLElement} element
   * @return {Item | null} item
   */
  itemFromElement(element) {
    let cur = element;
    while (cur) {
      if (Object.prototype.hasOwnProperty.call(cur, 'vis-item')) {
        return cur['vis-item'];
      }
      cur = cur.parentNode;
    }

    return null;
  }

  /**
   * Find an item from an event target:
   * searches for the attribute 'vis-item' in the event target's element tree
   * @param {Event} event
   * @return {Item | null} item
   */
  itemFromTarget(event) {
    return this.itemFromElement(event.target);
  }

  /**
   * Find an item from an event's related target:
   * searches for the attribute 'vis-item' in the related target's element tree
   * @param {Event} event
   * @return {Item | null} item
   */
  itemFromRelatedTarget(event) {
    return this.itemFromElement(event.relatedTarget);
  }

  /**
   * Find the Group from an event target:
   * searches for the attribute 'vis-group' in the event target's element tree
   * @param {Event} event
   * @return {Group | null} group
   */
  groupFromTarget(event) {
    const clientY = event.center ? event.center.y : event.clientY;
    let groupIds = this.groupIds;
    
    if (groupIds.length <= 0 && this.groupsData) {
      groupIds = this.groupsData.getIds({
        order: this.options.groupOrder
      });
    }
    
    for (let i = 0; i < groupIds.length; i++) {
      const groupId = groupIds[i];
      const group = this.groups[groupId];
      const foreground = group.dom.foreground;
      const foregroundRect = foreground.getBoundingClientRect()
      if (clientY >= foregroundRect.top && clientY < foregroundRect.top + foreground.offsetHeight) {
        return group;
      }

      if (this.options.orientation.item === 'top') {
        if (i === this.groupIds.length - 1 && clientY > foregroundRect.top) {
          return group;
        }
      }
      else {
        if (i === 0 && clientY < foregroundRect.top + foreground.offset) {
          return group;
        }
      }
    }

    return null;
  }

  /**
   * Find the ItemSet from an event target:
   * searches for the attribute 'vis-itemset' in the event target's element tree
   * @param {Event} event
   * @return {ItemSet | null} item
   */
  static itemSetFromTarget(event) {
    let target = event.target;
    while (target) {
      if (Object.prototype.hasOwnProperty.call(target, 'vis-itemset')) {
        return target['vis-itemset'];
      }
      target = target.parentNode;
    }

    return null;
  }

  /**
   * Clone the data of an item, and "normalize" it: convert the start and end date
   * to the type (Date, Moment, ...) configured in the DataSet. If not configured,
   * start and end are converted to Date.
   * @param {Object} itemData, typically `item.data`
   * @param {string} [type]  Optional Date type. If not provided, the type from the DataSet is taken
   * @return {Object} The cloned object
   * @private
   */
  _cloneItemData(itemData, type) {
    const clone = util.extend({}, itemData);

    if (!type) {
      // convert start and end date to the type (Date, Moment, ...) configured in the DataSet
      type = this.itemsData.type;
    }

    if (clone.start != undefined) {
      clone.start = util.convert(clone.start, type && type.start || 'Date');
    }
    if (clone.end != undefined) {
      clone.end = util.convert(clone.end , type && type.end || 'Date');
    }

    return clone;
  }

  /**
   * cluster items
   * @return {void}   
   * @private
   */
  _clusterItems() {
    if (!this.options.cluster) {
      return;
    }

    const { scale } = this.body.range.conversion(this.body.domProps.center.width);
    const clusters = this.clusterGenerator.getClusters(this.clusters, scale, this.options.cluster);

    if (this.clusters != clusters) {
      this._detachAllClusters();

      if (clusters) {
        for (let cluster of clusters) {
          cluster.attach();
        }
        this.clusters = clusters;
      }

      this._updateClusters(clusters);
    }
  }

  /**
   * detach all cluster items
   * @private
   */
  _detachAllClusters() {
    if (this.options.cluster) {
      if (this.clusters && this.clusters.length) {
        for (let cluster of this.clusters) {
          cluster.detach();
        }
      }
    }
  }

  /**
   * update clusters
   * @param {array} clusters
   * @private
   */
  _updateClusters(clusters) {
    if (this.clusters && this.clusters.length) {
      const newClustersIds = new Set(clusters.map(cluster => cluster.id));
      const clustersToUnselect = this.clusters.filter(cluster => !newClustersIds.has(cluster.id));
      let selectionChanged = false;
      for (let cluster of clustersToUnselect) {
        const selectedIdx = this.selection.indexOf(cluster.id);
        if (selectedIdx !== -1) {
          cluster.unselect();
          this.selection.splice(selectedIdx, 1);
          selectionChanged = true;
        }
      }

      if (selectionChanged) {
        const newSelection = this.getSelection();
        this.body.emitter.emit('select', {
          items: newSelection,
          event: event
        });
      }
    }

    this.clusters = clusters || [];
  }
}

// available item types will be registered here
ItemSet.types = {
  background: BackgroundItem,
  box: BoxItem,
  range: RangeItem,
  point: PointItem
};

/**
 * Handle added items
 * @param {number[]} ids
 * @protected
 */
ItemSet.prototype._onAdd = ItemSet.prototype._onUpdate;

export default ItemSet;
