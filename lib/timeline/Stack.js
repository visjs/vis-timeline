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
  const stackingResult = performStacking(
    items,
    margin.item,
    false,
    item => item.stack && (force || item.top === null),
    item => item.stack,
    item => margin.axis,
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
  const subgroupHeight = performStacking(
    items,
    margin.item,
    false,
    item => item.stack,
    item => true,
    item => item.baseTop
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
    true,
    item => true,
    item => true,
    item => 0
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
 * An array of items to consider during stacking.
 * @param {{horizontal: number, vertical: number}} margins
 * Margins to be used for collision checking and placement of items.
 * @param {boolean} compareTimes
 * By default, horizontal collision is checked based on the spatial position of the items (left/right and width).
 * If this argument is true, horizontal collision will instead be checked based on the start/end times of each item.
 * Vertical collision is always checked spatially.
 * @param {(Item) => number | null} shouldStack
 * A callback function which is called before we start to process an item. The return value indicates whether the item will be processed.
 * @param {(Item) => boolean} shouldOthersStack
 * A callback function which indicates whether other items should consider this item when being stacked.
 * @param {(Item) => number} getInitialHeight
 * A callback function which determines the height items are initially placed at
 * @param {() => boolean} shouldBail 
 * A callback function which should indicate if the stacking process should be aborted.
 * 
 * @returns {null|number}
 * if shouldBail was triggered, returns null
 * otherwise, returns the maximum height
 */
function performStacking(items, margins, compareTimes, shouldStack, shouldOthersStack, getInitialHeight, shouldBail) {
  // Time-based horizontal comparison
  let getItemStart = item => item.start;
  let getItemEnd = item => item.end;
  if(!compareTimes) {
    // Spatial horizontal comparisons
    const rtl = !!(items[0] && items[0].options.rtl);
    if(rtl) {
      getItemStart = item => item.right;
    } else {
      getItemStart = item => item.left;
    }
    getItemEnd = item => getItemStart(item) + item.width + margins.horizontal;
  }

  const itemsToPosition = [];
  const itemsAlreadyPositioned = []; // It's vital that this array is kept sorted based on the start of each item

  // If the order we needed to place items was based purely on the start of each item, we could calculate stacking very efficiently.
  // Unfortunately for us, this is not guaranteed. But the order is often based on the start of items at least to some degree, and
  // we can use this to make some optimisations. While items are proceeding in order of start, we can keep moving our search indexes
  // forwards. Then if we encounter an item that's out of order, we reset our indexes and search from the beginning of the array again.
  let previousStart = null;
  let insertionIndex = 0;

  // First let's handle any immoveable items
  for(const item of items) {
    if(shouldStack(item)) {
      itemsToPosition.push(item);
    } else {
      if(shouldOthersStack(item)) {
        const itemStart = getItemStart(item);

        // We need to put immoveable items into itemsAlreadyPositioned and ensure that this array is sorted.
        // We could simply insert them, and then use JavaScript's sort function to sort them afterwards.
        // This would achieve an average complexity of O(n log n).
        // 
        // Instead, I'm gambling that the start of each item will usually be the same or later than the
        // start of the previous item. While this holds (best case), we can insert items in O(n).
        // In the worst case (where each item starts before the previous item) this grows to O(n^2).
        // 
        // I am making the assumption that for most datasets, the "order" function will have relatively low cardinality,
        // and therefore this tradeoff should be easily worth it.
        if(previousStart !== null && itemStart < previousStart - EPSILON) {
          insertionIndex = 0;
        }
        previousStart = itemStart;

        insertionIndex = findIndexFrom(itemsAlreadyPositioned, i => getItemStart(i) - EPSILON > itemStart, insertionIndex);

        itemsAlreadyPositioned.splice(insertionIndex, 0, item);
        insertionIndex++;
      }
    }
  }

  // Now we can loop through each item (in order) and find a position for them
  previousStart = null;
  let previousEnd = null;
  insertionIndex = 0;
  let horizontalOverlapStartIndex = 0;
  let horizontalOverlapEndIndex = 0;
  let maxHeight = 0;
  while(itemsToPosition.length > 0) {
    const item = itemsToPosition.shift();

    item.top = getInitialHeight(item);

    const itemStart = getItemStart(item);
    const itemEnd = getItemEnd(item);
    if(previousStart !== null && itemStart < previousStart - EPSILON) {
      horizontalOverlapStartIndex = 0;
      horizontalOverlapEndIndex = 0;
      insertionIndex = 0;
      previousEnd = null;
    }
    previousStart = itemStart;

    // Take advantage of the sorted itemsAlreadyPositioned array to narrow down the search
    horizontalOverlapStartIndex = findIndexFrom(itemsAlreadyPositioned, i => itemStart < getItemEnd(i) - EPSILON, horizontalOverlapStartIndex);
    // Since items aren't sorted by end time, it might increase or decrease from one item to the next. In order to keep an efficient search area, we will seek forwards/backwards accordingly.
    if(previousEnd === null || previousEnd < itemEnd - EPSILON) {
      horizontalOverlapEndIndex = findIndexFrom(itemsAlreadyPositioned, i => itemEnd < getItemStart(i) - EPSILON, Math.max(horizontalOverlapStartIndex, horizontalOverlapEndIndex));
    }
    if(previousEnd !== null && previousEnd - EPSILON > itemEnd) {
      horizontalOverlapEndIndex = findLastIndexBetween(itemsAlreadyPositioned, i => itemEnd + EPSILON >= getItemStart(i), horizontalOverlapStartIndex, horizontalOverlapEndIndex) + 1;
    }

    // Sort by vertical position so we don't have to reconsider past items if we move an item
    const horizontallyCollidingItems = itemsAlreadyPositioned
      .slice(horizontalOverlapStartIndex, horizontalOverlapEndIndex)
      .filter(i => itemStart < getItemEnd(i) - EPSILON && itemEnd - EPSILON > getItemStart(i))
      .sort((a, b) => a.top - b.top);

    // Keep moving the item down until it stops colliding with any other items
    for(let i2 = 0; i2 < horizontallyCollidingItems.length; i2++) {
      const otherItem = horizontallyCollidingItems[i2];
      
      if(checkVerticalSpatialCollision(item, otherItem, margins)) {
        item.top = otherItem.top + otherItem.height + margins.vertical;
      }
    }

    if(shouldOthersStack(item)) {
      // Insert the item into itemsAlreadyPositioned, ensuring itemsAlreadyPositioned remains sorted.
      // In the best case, we can insert an item in constant time O(1). In the worst case, we insert an item in linear time O(n).
      // In both cases, this is better than doing a naive insert and then sort, which would cost on average O(n log n).
      insertionIndex = findIndexFrom(itemsAlreadyPositioned, i => getItemStart(i) - EPSILON > itemStart, insertionIndex);

      itemsAlreadyPositioned.splice(insertionIndex, 0, item);
      insertionIndex++;
    }

    // Keep track of the tallest item we've seen before
    const currentHeight = item.top + item.height;
    if(currentHeight > maxHeight) {
      maxHeight = currentHeight;
    }

    if(shouldBail && shouldBail()) { return null; }
  }

  return maxHeight;
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
 * Find index of first item to meet predicate after a certain index.
 * If no such item is found, returns the length of the array.
 * 
 * @param {any[]} arr The array
 * @param {(item) => boolean} predicate A function that should return true when a suitable item is found
 * @param {number|undefined} startIndex The index to start search from (inclusive). Optional, if not provided will search from the beginning of the array.
 * 
 * @return {number}
 */
function findIndexFrom(arr, predicate, startIndex) {
  if(!startIndex) {
    startIndex = 0;
  }
  const matchIndex = arr.slice(startIndex).findIndex(predicate);
  if(matchIndex === -1) {
    return arr.length;
  }
  return matchIndex + startIndex;
}

/**
 * Find index of last item to meet predicate within a given range.
 * If no such item is found, returns the index prior to the start of the range.
 * 
 * @param {any[]} arr The array
 * @param {(item) => boolean} predicate A function that should return true when a suitable item is found
 * @param {number|undefined} startIndex The earliest index to search to (inclusive). Optional, if not provided will continue until the start of the array.
 * @param {number|undefined} endIndex The end of the search range (exclusive). The search will begin on the index prior to this value. Optional, defaults to the end of array.
 * 
 * @return {number}
 */
function findLastIndexBetween(arr, predicate, startIndex, endIndex) {
  if(!startIndex) {
    startIndex = 0;
  }
  if(!endIndex) {
    endIndex = arr.length;
  }
  for(i = endIndex - 1; i >= startIndex; i--) {
    if(predicate(arr[i])) {
      return i;
    }
  }
  return startIndex - 1;
}