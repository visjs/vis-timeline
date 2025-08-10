import Group from "./Group.js";

/**
 * @constructor BackgroundGroup
 * @extends Group
 */
class BackgroundGroup extends Group {
  /**
   * @param {number | string} groupId
   * @param {Object} data
   * @param {ItemSet} itemSet
   */
  constructor(groupId, data, itemSet) {
    super(groupId, data, itemSet);
    // Group.call(this, groupId, data, itemSet);

    this.width = 0;
    this.height = 0;
    this.top = 0;
    this.left = 0;
  }

  /**
   * Repaint this group
   * @param {{start: number, end: number}} range
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   * @return {boolean} Returns true if the group is resized
   */
  redraw(range, margin) {
    const resized = false;

    this.visibleItems = this._updateItemsInRange(
      this.orderedItems,
      this.visibleItems,
      range,
    );

    // calculate actual size
    this.width = this.dom.background.offsetWidth;

    // apply new height (just always zero for BackgroundGroup
    this.dom.background.style.height = "0";

    // update vertical position of items after they are re-stacked and the height of the group is calculated
    for (let i = 0, ii = this.visibleItems.length; i < ii; i++) {
      const item = this.visibleItems[i];
      item.repositionY(margin);
    }

    return resized;
  }

  /**
   * Show this group: attach to the DOM
   */
  show() {
    if (!this.dom.background.parentNode) {
      this.itemSet.dom.background.appendChild(this.dom.background);
    }
  }
}

export default BackgroundGroup;
