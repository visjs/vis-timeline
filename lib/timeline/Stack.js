// Utility functions for ordering and stacking of items
const EPSILON = 0.001; // used when checking collisions, to prevent round-off errors

/**
 * Order items by their start data
 * @param {Item[]} items
 */
export function orderByStart(items) {
  items.sort((a, b) => a.data.start - b.data.start);
}

/**
 * Order items by their end date. If they have no end date, their start date
 * is used.
 * @param {Item[]} items
 */
export function orderByEnd(items) {
  items.sort((a, b) => {
    const aTime = ('end' in a.data) ? a.data.end : a.data.start;
    const bTime = ('end' in b.data) ? b.data.end : b.data.start;

    return aTime - bTime;
  });
}

/**
 * Adjust vertical positions of the items such that they don't overlap each
 * other.
 * @param {Item[]} items
 *            All visible items
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 *            Margins between items and between items and the axis.
 * @param {boolean} [force=false]
 *            If true, all items will be repositioned. If false (default), only
 *            items having a top===null will be re-stacked
 * @param {function} shouldBailItemsRedrawFunction
 *            bailing function
 * @return {boolean} shouldBail
 */
export function stack(items, margin, force, shouldBailItemsRedrawFunction) {
  if (force) {
    // reset top position of all items
    for (var i = 0; i < items.length; i++) {
      items[i].top = null;
    }
  }

  // calculate new, non-overlapping positions
  for (var i = 0; i < items.length; i++) {  // eslint-disable-line no-redeclare
    const item = items[i];
    if (item.stack && item.top === null) {
      // initialize top position
      item.top = margin.axis;
      var shouldBail = false;

      do {
        // TODO: optimize checking for overlap. when there is a gap without items,
        //       you only need to check for items from the next item on, not from zero
        var collidingItem = null;
        for (let j = 0, jj = items.length; j < jj; j++) {
          const other = items[j];
          shouldBail = shouldBailItemsRedrawFunction() || false;

          if (shouldBail) { return true; }

          if (other.top !== null && other !== item && other.stack && collision(item, other, margin.item, other.options.rtl)) {
            collidingItem = other;
            break;
          }
        }

        if (collidingItem != null) {
          // There is a collision. Reposition the items above the colliding element
          item.top = collidingItem.top + collidingItem.height + margin.item.vertical;
        }
      } while (collidingItem);
    }
  }
  return shouldBail;
}

/**
 * Adjust vertical positions of the items within a single subgroup such that they
 * don't overlap each other.
 * @param {Item[]} items
 *            All items withina subgroup
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 *            Margins between items and between items and the axis.
 * @param {subgroup} subgroup
 *            The subgroup that is being stacked
 */
export function substack(items, margin, subgroup) {
  for (var i = 0; i < items.length; i++) {
    items[i].top = null;
  }

  // Set the initial height
  let subgroupHeight = subgroup.height;

  // calculate new, non-overlapping positions
  for (i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.stack && item.top === null) {
      // initialize top position
      item.top = item.baseTop;//margin.axis + item.baseTop;

      do {
        // TODO: optimize checking for overlap. when there is a gap without items,
        //       you only need to check for items from the next item on, not from zero
        var collidingItem = null;
        for (let j = 0, jj = items.length; j < jj; j++) {
          const other = items[j];
          if (other.top !== null && other !== item /*&& other.stack*/ && collision(item, other, margin.item, other.options.rtl)) {
            collidingItem = other;
            break;
          }
        }

        if (collidingItem != null) {
          // There is a collision. Reposition the items above the colliding element
          item.top = collidingItem.top + collidingItem.height + margin.item.vertical;// + item.baseTop;
        }

        if (item.top + item.height > subgroupHeight) {
          subgroupHeight = item.top + item.height;
        }
      } while (collidingItem);
    }
  }

  // Set the new height
  subgroup.height = subgroupHeight - subgroup.top + 0.5 * margin.item.vertical;
}

/**
 * Adjust vertical positions of the items without stacking them
 * @param {Item[]} items
 *            All visible items
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 *            Margins between items and between items and the axis.
 * @param {subgroups[]} subgroups
 *            All subgroups
 * @param {boolean} isStackSubgroups
 */
export function nostack(items, margin, subgroups, isStackSubgroups) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].data.subgroup == undefined) {
      items[i].top = margin.item.vertical;
    } else if (items[i].data.subgroup !== undefined && isStackSubgroups) {
      let newTop = 0;
      for (const subgroup in subgroups) {
        if (subgroups.hasOwnProperty(subgroup)) {
          if (subgroups[subgroup].visible == true && subgroups[subgroup].index < subgroups[items[i].data.subgroup].index) {
            newTop += subgroups[subgroup].height;
            subgroups[items[i].data.subgroup].top = newTop;
          }
        }
      }
      items[i].top = newTop + 0.5 * margin.item.vertical;
    }
  }
  if (!isStackSubgroups) {
    stackSubgroups(items, margin, subgroups)
  }
}

/**
 * Adjust vertical positions of the subgroups such that they don't overlap each
 * other.
 * @param {Array.<timeline.Item>} items
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin Margins between items and between items and the axis.
 * @param {subgroups[]} subgroups
 *            All subgroups
 */
export function stackSubgroups(items, margin, subgroups) {
  for (const subgroup in subgroups) {
    if (subgroups.hasOwnProperty(subgroup)) {


      subgroups[subgroup].top = 0;
      do {
        // TODO: optimize checking for overlap. when there is a gap without items,
        //       you only need to check for items from the next item on, not from zero
        var collidingItem = null;
        for (const otherSubgroup in subgroups) {
          if (subgroups[otherSubgroup].top !== null && otherSubgroup !== subgroup && subgroups[subgroup].index > subgroups[otherSubgroup].index && collisionByTimes(subgroups[subgroup], subgroups[otherSubgroup])) {
            collidingItem = subgroups[otherSubgroup];
            break;
          }
        }

        if (collidingItem != null) {
          // There is a collision. Reposition the subgroups above the colliding element
          subgroups[subgroup].top = collidingItem.top + collidingItem.height;
        }
      } while (collidingItem);
    }
  }
  for (let i = 0; i < items.length; i++) {
    if (items[i].data.subgroup !== undefined) {
      items[i].top = subgroups[items[i].data.subgroup].top + 0.5 * margin.item.vertical;
    }
  }
}

/**
 * Adjust vertical positions of the subgroups such that they don't overlap each
 * other, then stacks the contents of each subgroup individually.
 * @param {Item[]} subgroupItems
 *            All the items in a subgroup
 * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
 *            Margins between items and between items and the axis.
 * @param {subgroups[]} subgroups
 *            All subgroups
 */
export function stackSubgroupsWithInnerStack(subgroupItems, margin, subgroups) {
  let doSubStack = false;

  // Run subgroups in their order (if any)
  const subgroupOrder = [];

  for(var subgroup in subgroups) {
    if (subgroups[subgroup].hasOwnProperty("index")) {
      subgroupOrder[subgroups[subgroup].index] = subgroup;
    }
    else {
      subgroupOrder.push(subgroup);
    }
  }

  for(let j = 0; j < subgroupOrder.length; j++) {
    subgroup = subgroupOrder[j];
    if (subgroups.hasOwnProperty(subgroup)) {

      doSubStack = doSubStack || subgroups[subgroup].stack;
      subgroups[subgroup].top = 0;

      for (const otherSubgroup in subgroups) {
        if (subgroups[otherSubgroup].visible && subgroups[subgroup].index > subgroups[otherSubgroup].index) {
          subgroups[subgroup].top += subgroups[otherSubgroup].height;
        }
      }

      const items = subgroupItems[subgroup];
      for(let i = 0; i < items.length; i++) {
        if (items[i].data.subgroup !== undefined) {
          items[i].top = subgroups[items[i].data.subgroup].top + 0.5 * margin.item.vertical;

          if (subgroups[subgroup].stack) {
            items[i].baseTop = items[i].top;
          }
        }
      }

      if (doSubStack && subgroups[subgroup].stack) {
        substack(subgroupItems[subgroup], margin, subgroups[subgroup]);
      }
    }
  }
}

/**
 * Test if the two provided items collide
 * The items must have parameters left, width, top, and height.
 * @param {Item} a          The first item
 * @param {Item} b          The second item
 * @param {{horizontal: number, vertical: number}} margin
 *                          An object containing a horizontal and vertical
 *                          minimum required margin.
 * @param {boolean} rtl
 * @return {boolean}        true if a and b collide, else false
 */
export function collision(a, b, margin, rtl) {
  if (rtl) {
    return  ((a.right - margin.horizontal + EPSILON)  < (b.right + b.width) &&
    (a.right + a.width + margin.horizontal - EPSILON) > b.right &&
    (a.top - margin.vertical + EPSILON)              < (b.top + b.height) &&
    (a.top + a.height + margin.vertical - EPSILON)   > b.top);
  } else {
    return ((a.left - margin.horizontal + EPSILON)   < (b.left + b.width) &&
    (a.left + a.width + margin.horizontal - EPSILON) > b.left &&
    (a.top - margin.vertical + EPSILON)              < (b.top + b.height) &&
    (a.top + a.height + margin.vertical - EPSILON)   > b.top);
  }
}

/**
 * Test if the two provided objects collide
 * The objects must have parameters start, end, top, and height.
 * @param {Object} a          The first Object
 * @param {Object} b          The second Object
 * @return {boolean}        true if a and b collide, else false
 */
export function collisionByTimes(a, b) {

  // Check for overlap by time and height. Abutting is OK and
  // not considered a collision while overlap is considered a collision.
  const timeOverlap = a.start < b.end && a.end > b.start;
  const heightOverlap = a.top < (b.top + b.height) && (a.top + a.height) > b.top;
  return timeOverlap && heightOverlap;
}
