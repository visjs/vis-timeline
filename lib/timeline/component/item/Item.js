import Hammer from '../../../module/hammer';
import util from '../../../util';
import moment from '../../../module/moment';
import locales from '../../locales';

import '../css/item.css';

/**
 * Item
 */
class Item {
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
    this.id = null;
    this.parent = null;
    this.data = data;
    this.dom = null;
    this.conversion = conversion || {};
    this.defaultOptions = {
      locales,
      locale: 'en'
    };
    this.options = util.extend({}, this.defaultOptions, options);
    this.options.locales = util.extend({}, locales, this.options.locales);
    const defaultLocales = this.defaultOptions.locales[this.defaultOptions.locale];
    Object.keys(this.options.locales).forEach(locale => {
      this.options.locales[locale] = util.extend(
        {},
        defaultLocales,
        this.options.locales[locale]
      );
    });
    this.selected = false;
    this.displayed = false;
    this.groupShowing = true;
    this.selectable = (options && options.selectable) || false;
    this.dirty = true;

    this.top = null;
    this.right = null;
    this.left = null;
    this.width = null;
    this.height = null;

    this.setSelectability(data);

    this.editable = null;
    this._updateEditStatus();
  }

  /**
   * Select current item
   */
  select() {
    if (this.selectable) {
      this.selected = true;
      this.dirty = true;
      if (this.displayed) this.redraw();
    }
  }

  /**
   * Unselect current item
   */
  unselect() {
    this.selected = false;
    this.dirty = true;
    if (this.displayed) this.redraw();
  }

  /**
   * Set data for the item. Existing data will be updated. The id should not
   * be changed. When the item is displayed, it will be redrawn immediately.
   * @param {Object} data
   */
  setData(data) {
    const groupChanged = data.group != undefined && this.data.group != data.group;
    if (groupChanged && this.parent != null) {
      this.parent.itemSet._moveToGroup(this, data.group);
    }

    this.setSelectability(data);

    if (this.parent) {
      this.parent.stackDirty = true;
    }
    
    const subGroupChanged = data.subgroup != undefined && this.data.subgroup != data.subgroup;
    if (subGroupChanged && this.parent != null) {
      this.parent.changeSubgroup(this, this.data.subgroup, data.subgroup);
    }

    this.data = data;
    this._updateEditStatus();
    this.dirty = true;
    if (this.displayed) this.redraw();
  }

  /**
   * Set whether the item can be selected.
   * Can only be set/unset if the timeline's `selectable` configuration option is `true`.
   * @param {Object} data `data` from `constructor` and `setData`
   */
  setSelectability(data) {
    if (data) {
      this.selectable = typeof data.selectable === 'undefined' ? true : Boolean(data.selectable);
    }
  }

  /**
   * Set a parent for the item
   * @param {Group} parent
   */
  setParent(parent) {
    if (this.displayed) {
      this.hide();
      this.parent = parent;
      if (this.parent) {
        this.show();
      }
    }
    else {
      this.parent = parent;
    }
  }

  /**
   * Check whether this item is visible inside given range
   * @param {timeline.Range} range with a timestamp for start and end
   * @returns {boolean} True if visible
   */
  isVisible(range) {  // eslint-disable-line no-unused-vars
    return false;
  }

  /**
   * Show the Item in the DOM (when not already visible)
   * @return {Boolean} changed
   */
  show() {
    return false;
  }

  /**
   * Hide the Item from the DOM (when visible)
   * @return {Boolean} changed
   */
  hide() {
    return false;
  }

  /**
   * Repaint the item
   */
  redraw() {
    // should be implemented by the item
  }

  /**
   * Reposition the Item horizontally
   */
  repositionX() {
    // should be implemented by the item
  }

  /**
   * Reposition the Item vertically
   */
  repositionY() {
    // should be implemented by the item
  }

  /**
   * Repaint a drag area on the center of the item when the item is selected
   * @protected
   */
  _repaintDragCenter() {
    if (this.selected && this.options.editable.updateTime && !this.dom.dragCenter) {
      const me = this;
      // create and show drag area
      const dragCenter = document.createElement('div');
      dragCenter.className = 'vis-drag-center';
      dragCenter.dragCenterItem = this;
      this.hammerDragCenter = new Hammer(dragCenter);

      this.hammerDragCenter.on('tap', event => {
        me.parent.itemSet.body.emitter.emit('click',  {
          event,
          item: me.id
        });
      });
      this.hammerDragCenter.on('doubletap', event => {
        event.stopPropagation();
        me.parent.itemSet._onUpdateItem(me);
        me.parent.itemSet.body.emitter.emit('doubleClick', {
          event,
          item: me.id
        });
      });
      this.hammerDragCenter.on('panstart', me.parent.itemSet._onDragStart.bind(me.parent.itemSet));
      this.hammerDragCenter.on('panmove',  me.parent.itemSet._onDrag.bind(me.parent.itemSet));
      this.hammerDragCenter.on('panend',   me.parent.itemSet._onDragEnd.bind(me.parent.itemSet));

      if (this.dom.box) {
        if (this.dom.dragLeft) {
          this.dom.box.insertBefore(dragCenter, this.dom.dragLeft);
        }
        else {
          this.dom.box.appendChild(dragCenter);
        }
      }
      else if (this.dom.point) {
        this.dom.point.appendChild(dragCenter);
      }
      
      this.dom.dragCenter = dragCenter;
    }
    else if (!this.selected && this.dom.dragCenter) {
      // delete drag area
      if (this.dom.dragCenter.parentNode) {
        this.dom.dragCenter.parentNode.removeChild(this.dom.dragCenter);
      }
      this.dom.dragCenter = null;
      
      if (this.hammerDragCenter) {
        this.hammerDragCenter.destroy();
        this.hammerDragCenter = null;
      }
    }
  }

  /**
   * Repaint a delete button on the top right of the item when the item is selected
   * @param {HTMLElement} anchor
   * @protected
   */
  _repaintDeleteButton(anchor) {
    const editable = ((this.options.editable.overrideItems || this.editable == null) && this.options.editable.remove) ||
                   (!this.options.editable.overrideItems && this.editable != null && this.editable.remove);

    if (this.selected && editable && !this.dom.deleteButton) {
      // create and show button
      const me = this;

      const deleteButton = document.createElement('div');

      if (this.options.rtl) {
        deleteButton.className = 'vis-delete-rtl';
      } else {
        deleteButton.className = 'vis-delete';
      }
      let optionsLocale = this.options.locales[this.options.locale];
      if (!optionsLocale) {
        if (!this.warned) {
          console.warn(`WARNING: options.locales['${this.options.locale}'] not found. See https://visjs.github.io/vis-timeline/docs/timeline/#Localization`);
          this.warned = true;
        }
        optionsLocale = this.options.locales['en']; // fall back on english when not available
      }
      deleteButton.title = optionsLocale.deleteSelected;

      // TODO: be able to destroy the delete button
      this.hammerDeleteButton = new Hammer(deleteButton).on('tap', event => {
        event.stopPropagation();
        me.parent.removeFromDataSet(me);
      });

      anchor.appendChild(deleteButton);
      this.dom.deleteButton = deleteButton;
    }
    else if (!this.selected && this.dom.deleteButton) {
      // remove button
      if (this.dom.deleteButton.parentNode) {
        this.dom.deleteButton.parentNode.removeChild(this.dom.deleteButton);
      }
      this.dom.deleteButton = null;

      if (this.hammerDeleteButton) {
        this.hammerDeleteButton.destroy();
        this.hammerDeleteButton = null;
      }
    }
  }

  /**
   * Repaint a onChange tooltip on the top right of the item when the item is selected
   * @param {HTMLElement} anchor
   * @protected
   */
  _repaintOnItemUpdateTimeTooltip(anchor) {
    if (!this.options.tooltipOnItemUpdateTime) return;

    const editable = (this.options.editable.updateTime || 
                    this.data.editable === true) &&
                   this.data.editable !== false;

    if (this.selected && editable && !this.dom.onItemUpdateTimeTooltip) {
      const onItemUpdateTimeTooltip = document.createElement('div');

      onItemUpdateTimeTooltip.className = 'vis-onUpdateTime-tooltip';
      anchor.appendChild(onItemUpdateTimeTooltip);
      this.dom.onItemUpdateTimeTooltip = onItemUpdateTimeTooltip;

    } else if (!this.selected && this.dom.onItemUpdateTimeTooltip) {
      // remove button
      if (this.dom.onItemUpdateTimeTooltip.parentNode) {
        this.dom.onItemUpdateTimeTooltip.parentNode.removeChild(this.dom.onItemUpdateTimeTooltip);
      }
      this.dom.onItemUpdateTimeTooltip = null;
    }

    // position onChange tooltip
    if (this.dom.onItemUpdateTimeTooltip) {

      // only show when editing
      this.dom.onItemUpdateTimeTooltip.style.visibility = this.parent.itemSet.touchParams.itemIsDragging ? 'visible' : 'hidden';
      
      // position relative to item's content
      this.dom.onItemUpdateTimeTooltip.style.transform = 'translateX(-50%)';
      this.dom.onItemUpdateTimeTooltip.style.left = '50%';

      // position above or below the item depending on the item's position in the window
      const tooltipOffset = 50; // TODO: should be tooltip height (depends on template)
      const scrollTop = this.parent.itemSet.body.domProps.scrollTop;

        // TODO: this.top for orientation:true is actually the items distance from the bottom... 
        // (should be this.bottom)
      let itemDistanceFromTop; 
      if (this.options.orientation.item == 'top') {
        itemDistanceFromTop = this.top;
      } else {
        itemDistanceFromTop = (this.parent.height - this.top - this.height)
      }
      const isCloseToTop = itemDistanceFromTop + this.parent.top - tooltipOffset < -scrollTop;

      if (isCloseToTop) {
        this.dom.onItemUpdateTimeTooltip.style.bottom = "";
        this.dom.onItemUpdateTimeTooltip.style.top = `${this.height + 2}px`;
      } else {
        this.dom.onItemUpdateTimeTooltip.style.top = "";
        this.dom.onItemUpdateTimeTooltip.style.bottom = `${this.height + 2}px`;
      }
      
      // handle tooltip content
      let content;
      let templateFunction;

      if (this.options.tooltipOnItemUpdateTime && this.options.tooltipOnItemUpdateTime.template) {
        templateFunction = this.options.tooltipOnItemUpdateTime.template.bind(this);
        content = templateFunction(this.data);
      } else {
        content = `start: ${moment(this.data.start).format('MM/DD/YYYY hh:mm')}`;
        if (this.data.end) { 
          content += `<br> end: ${moment(this.data.end).format('MM/DD/YYYY hh:mm')}`;
        }
      }
      this.dom.onItemUpdateTimeTooltip.innerHTML = content;
    }
  }

   /**
   * get item data
   * @return {object}
   * @private
   */
  _getItemData() {
    return this.parent.itemSet.itemsData.get(this.id);
  }

  /**
   * Set HTML contents for the item
   * @param {Element} element   HTML element to fill with the contents
   * @private
   */
  _updateContents(element) {
    let content;
    let changed;
    let templateFunction;
    let itemVisibleFrameContent;
    let visibleFrameTemplateFunction; 
    const itemData = this._getItemData(); // get a clone of the data from the dataset

    const frameElement = this.dom.box || this.dom.point;
    const itemVisibleFrameContentElement = frameElement.getElementsByClassName('vis-item-visible-frame')[0];

    if (this.options.visibleFrameTemplate) {
      visibleFrameTemplateFunction = this.options.visibleFrameTemplate.bind(this);
      itemVisibleFrameContent = visibleFrameTemplateFunction(itemData, itemVisibleFrameContentElement);
    } else {
      itemVisibleFrameContent = '';
    }
    
    if (itemVisibleFrameContentElement) {
      if ((itemVisibleFrameContent instanceof Object) && !(itemVisibleFrameContent instanceof Element)) {
        visibleFrameTemplateFunction(itemData, itemVisibleFrameContentElement)
      } else {
         changed = this._contentToString(this.itemVisibleFrameContent) !== this._contentToString(itemVisibleFrameContent);
         if (changed) {
          // only replace the content when changed
          if (itemVisibleFrameContent instanceof Element) {
            itemVisibleFrameContentElement.innerHTML = '';
            itemVisibleFrameContentElement.appendChild(itemVisibleFrameContent);
          }
          else if (itemVisibleFrameContent != undefined) {
            itemVisibleFrameContentElement.innerHTML = itemVisibleFrameContent;
          }
          else {
            if (!(this.data.type == 'background' && this.data.content === undefined)) {
              throw new Error(`Property "content" missing in item ${this.id}`);
            }
          }

          this.itemVisibleFrameContent = itemVisibleFrameContent;
         }
      }
    }

    if (this.options.template) {
      templateFunction = this.options.template.bind(this);
      content = templateFunction(itemData, element, this.data);
    } else {
      content = this.data.content;
    }

    if ((content instanceof Object) && !(content instanceof Element)) {
      templateFunction(itemData, element)
    } else {
      changed = this._contentToString(this.content) !== this._contentToString(content);
      if (changed) {
        // only replace the content when changed
        if (content instanceof Element) {
          element.innerHTML = '';
          element.appendChild(content);
        }
        else if (content != undefined) {
          element.innerHTML = content;
        }
        else {
          if (!(this.data.type == 'background' && this.data.content === undefined)) {
            throw new Error(`Property "content" missing in item ${this.id}`);
          }
        }
        this.content = content;
      }
    }
  }

  /**
   * Process dataAttributes timeline option and set as data- attributes on dom.content
   * @param {Element} element   HTML element to which the attributes will be attached
   * @private
   */
  _updateDataAttributes(element) {
   if (this.options.dataAttributes && this.options.dataAttributes.length > 0) {
     let attributes = [];

     if (Array.isArray(this.options.dataAttributes)) {
       attributes = this.options.dataAttributes;
     }
     else if (this.options.dataAttributes == 'all') {
       attributes = Object.keys(this.data);
     }
     else {
       return;
     }

     for (const name of attributes) {
       const value = this.data[name];

       if (value != null) {
         element.setAttribute(`data-${name}`, value);
       }
       else {
         element.removeAttribute(`data-${name}`);
       }
     }
   }
 }

  /**
   * Update custom styles of the element
   * @param {Element} element
   * @private
   */
  _updateStyle(element) {
    // remove old styles
    if (this.style) {
      util.removeCssText(element, this.style);
      this.style = null;
    }

    // append new styles
    if (this.data.style) {
      util.addCssText(element, this.data.style);
      this.style = this.data.style;
    }
  }

  /**
   * Stringify the items contents
   * @param {string | Element | undefined} content
   * @returns {string | undefined}
   * @private
   */
  _contentToString(content) {
    if (typeof content === 'string') return content;
    if (content && 'outerHTML' in content) return content.outerHTML;
    return content;
  }

  /**
   * Update the editability of this item.
   */
  _updateEditStatus() {
    if (this.options) {
      if(typeof this.options.editable === 'boolean') {
        this.editable = {
          updateTime: this.options.editable,
          updateGroup: this.options.editable,
          remove: this.options.editable
        };
      } else if(typeof this.options.editable === 'object') {
          this.editable = {};
          util.selectiveExtend(['updateTime', 'updateGroup', 'remove'], this.editable, this.options.editable);
      }
    }
    // Item data overrides, except if options.editable.overrideItems is set.
    if (!this.options || !(this.options.editable) || (this.options.editable.overrideItems !== true)) {
      if (this.data) {
        if (typeof this.data.editable === 'boolean') {
          this.editable = {
            updateTime: this.data.editable,
            updateGroup: this.data.editable,
            remove: this.data.editable
          }
        } else if (typeof this.data.editable === 'object') {
          // TODO: in timeline.js 5.0, we should change this to not reset options from the timeline configuration.
          // Basically just remove the next line...
          this.editable = {};
          util.selectiveExtend(['updateTime', 'updateGroup', 'remove'], this.editable, this.data.editable);
        }
      }
    }
  }

  /**
   * Return the width of the item left from its start date
   * @return {number}
   */
  getWidthLeft() {
    return 0;
  }

  /**
   * Return the width of the item right from the max of its start and end date
   * @return {number}
   */
  getWidthRight() {
    return 0;
  }

  /**
   * Return the title of the item
   * @return {string | undefined}
   */
  getTitle() {
    if (this.options.tooltip && this.options.tooltip.template) {
      const templateFunction = this.options.tooltip.template.bind(this);
      return templateFunction(this._getItemData(), this.data);
    }

    return this.data.title;
  }
}

Item.prototype.stack = true;

export default Item;
