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
  const rtl = !!(items[0] && items[0].options.rtl);
  items.sort((a, b) => compareSpatially(a, b) * (rtl ? -1 : 1));
  const stackingResult = performStacking(
    items,
    margin.item,
    item => item.stack && (force || item.top === null),
    item => item.stack,
    item => margin.axis,
    (a, b) => checkHorizontalSpatialCollision(a, b, margin.item, b.options.rtl),
    (a, b) => checkVerticalSpatialCollision(a, b, margin.item),
    shouldBailItemsRedrawFunction
  );

  // If shouldBail function returned true during stacking calculation
  return stackingResult === null;
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
  const rtl = !!(items[0] && items[0].options.rtl);
  items.sort((a, b) => compareSpatially(a, b) * (rtl ? -1 : 1));
  const subgroupHeight = performStacking(
    items,
    margin.item,
    item => item.stack,
    item => true,
    item => item.baseTop,
    (a, b) => checkHorizontalSpatialCollision(a, b, margin.item, b.options.rtl),
    (a, b) => checkVerticalSpatialCollision(a, b, margin.item)
  );
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
  performStacking(
    Object.values(subgroups).sort((a, b) => {
      if(a.index > b.index) return 1; 
      if(a.index < b.index) return -1; 
      return 0; 
    }),
    {
      vertical: 0
    },
    item => true,
    item => true,
    item => 0,
    (a, b) => checkHorizontalTimeCollision(a, b),
    (a, b) => checkVerticalSpatialCollision(a, b, {vertical: 0}),
    null
  );

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
 * Reusable stacking function
 * 
 * @param {Item[]} items 
 * An array of items to consider during stacking. Must be sorted by start time!
 * @param {{horizontal: number, vertical: number}} margins
 * Margins to be used for collision checking and placement of items.
 * @param {(Item) => number | null} shouldStack
 * A callback function which is called before we start to process an item. The return value indicates whether the item will be processed.
 * @param {(Item) => boolean} shouldOthersStack
 * A callback function which indicates whether other items should consider this item when being stacked.
 * @param {(Item) => number} getInitialHeight
 * A callback function which determines the height items are initially placed at
 * @param {(Item, Item) => boolean} checkHorizontalOverlap
 * A callback function which indicates whether two items overlap horizontally
 * @param {(Item, Item) => boolean | null} checkVerticalOverlap
 * A callback function which indicates whether two items overlap vertically.
 * If null is specified, items will always be placed below any prior items that overlap horizontally.
 * @param {() => boolean} shouldBail 
 * A callback function which should indicate if the stacking process should be aborted.
 * 
 * @returns {null|number}
 * if shouldBail was triggered, returns null
 * otherwise, returns the maximum height
 */
 function performStacking(items, margins, shouldStack, shouldOthersStack, getInitialHeight, checkHorizontalOverlap, checkVerticalOverlap, shouldBail) {
  const currentStack = [];
  let maxHeight = 0;

  for (var i = 0; i < items.length; i++) {
    const item = items[i];

    if(shouldStack(item)) {
      if(shouldBail && shouldBail()) { return null; }

      item.top = getInitialHeight(item);

      const horizontallyCollidingItems = [];
      // Remove any items from the current stack if they have already ended
      for(let i2 = currentStack.length - 1; i2 >= 0; i2--) {
        const otherItem = currentStack[i2];
        if(checkHorizontalOverlap(item, otherItem)) {
          horizontallyCollidingItems.push(otherItem);
          if(!checkVerticalOverlap) {
            // If checkVerticalOverlap is present, we only care about the deepest stacked item which is horizontally overlapping
            // This means it's not important to remove earlier items which are no longer horizontally overlapping
            break;
          }
        } else {
          currentStack.splice(i2, 1); // Safe because we're iterating over the array backwards
        }
      }

      // Iteratively attempt to find a location where the item does not collide with any other items
      let collided;
      do {
        collided = false;
        for(let i2 = 0; i2 < horizontallyCollidingItems.length; i2++) {
          const otherItem = horizontallyCollidingItems[i2];
          
          if(!checkVerticalOverlap || checkVerticalOverlap(item, otherItem)) {
            item.top = otherItem.top + otherItem.height + margins.vertical;
            collided = true;
            break;
          }
        }
      } while(collided);

      const currentHeight = item.top + item.height;
      if(currentHeight > maxHeight) {
        maxHeight = currentHeight;
      }
    }

    if(shouldOthersStack(item)) {
      currentStack.push(item);
    }
  }
}

/**
 * Test if the two provided items collide
 * The items must have parameters left, width, top, and height.
 * @param {Item} a          The first item
 * @param {Item} b          The second item
 * @param {{horizontal: number}} margin
 *                          An object containing a horizontal and vertical
 *                          minimum required margin.
 * @param {boolean} rtl
 * @return {boolean}        true if a and b collide, else false
 */
function checkHorizontalSpatialCollision(a, b, margin, rtl) {
  if (rtl) {
    return (a.right - margin.horizontal + EPSILON) < (b.right + b.width) &&
    (a.right + a.width + margin.horizontal - EPSILON) > b.right;
  } else {
    return (a.left - margin.horizontal + EPSILON) < (b.left + b.width) &&
    (a.left + a.width + margin.horizontal - EPSILON) > b.left;
  }
}

/**
 * Test if the two provided items collide
 * The items must have parameters left, width, top, and height.
 * @param {Item} a          The first item
 * @param {Item} b          The second item
 * @param {{vertical: number}} margin
 *                          An object containing a horizontal and vertical
 *                          minimum required margin.
 * @return {boolean}        true if a and b collide, else false
 */
function checkVerticalSpatialCollision(a, b, margin) {
  return (a.top - margin.vertical + EPSILON) < (b.top + b.height) &&
  (a.top + a.height + margin.vertical - EPSILON) > b.top;
}

/**
 * Test if the two provided objects collide
 * The objects must have parameters start, end, top, and height.
 * @param {Object} a          The first Object
 * @param {Object} b          The second Object
 * @return {boolean}        true if a and b collide, else false
 */
function checkHorizontalTimeCollision(a, b) {
  // Abutting is OK and not considered a collision, only overlap is considered a collision.
  return a.start < b.end && a.end > b.start;
}

function compareSpatially(a, b) {
  if(a.left > b.left) {
    return 1;
  }
  if(a.left < b.left) {
    return -1;
  }
  return 0;
}