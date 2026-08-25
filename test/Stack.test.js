import assert from "node:assert";

import { stack } from "../lib/timeline/Stack.js";

/**
 * Builds a minimal fake Item as expected by Stack.js: only the properties
 * actually read by performStacking()/checkVerticalSpatialCollision() are
 * needed, no DOM or Item class required.
 * @param {object} options
 * @param {number} options.left
 * @param {number} options.width
 * @param {number} options.height
 * @param {number|null} [options.top]
 * @returns {object} a fake Item
 */
function makeItem({ left, width, height, top = null }) {
  return {
    stack: true,
    top,
    left,
    width,
    height,
    options: { rtl: false },
    data: {},
  };
}

/**
 * @param {object} margin
 * @param {{item: object[], force?: boolean}} config
 * @returns {object[]} the same items, mutated in place with their computed `top`
 */
function runStack(margin, { items, force = true }) {
  stack(items, margin, force, null);
  return items;
}

describe("Stack", () => {
  describe("margin.epsilon (backward compatibility)", () => {
    it("defaults to 0.001 for both axes when margin.epsilon is not provided", () => {
      // Two fully overlapping items: without any epsilon override the
      // second item must still be pushed onto its own row, exactly like
      // before this option existed (EPSILON was hardcoded to 0.001).
      const a = makeItem({ left: 0, width: 100, height: 20 });
      const b = makeItem({ left: 0, width: 100, height: 20 });
      const margin = { item: { horizontal: 0, vertical: 0 }, axis: 0 };

      runStack(margin, { items: [a, b] });

      assert.equal(a.top, 0);
      assert.equal(b.top, 20);
    });
  });

  describe("margin.epsilon.vertical", () => {
    // The incoming item genuinely overlaps the already-positioned item by
    // 0.5px vertically (occupies 0..10.5, the fixed item occupies 10..20).
    function verticalOverlapScenario(verticalEpsilon) {
      const fixed = makeItem({ left: 0, width: 100, height: 10, top: 10 });
      const incoming = makeItem({ left: 0, width: 100, height: 10.5 });
      const margin = {
        item: { horizontal: 0, vertical: 0 },
        axis: 0,
        epsilon: { horizontal: 0.001, vertical: verticalEpsilon },
      };

      // force=false: `fixed` already has a top and is left untouched, only
      // `incoming` (top===null) gets (re)positioned - this is the normal
      // "add one more item" redraw path.
      runStack(margin, { items: [fixed, incoming], force: false });
      return { fixed, incoming };
    }

    it("with the default (tight) tolerance, a genuine small overlap is detected and the item is pushed to a new row", () => {
      const { fixed, incoming } = verticalOverlapScenario(0.001);

      assert.equal(fixed.top, 10);
      assert.equal(
        incoming.top,
        20,
        "incoming item should be pushed below fixed",
      );
    });

    it("with a larger tolerance, the same overlap is now treated as non-colliding and the item stays put", () => {
      const { fixed, incoming } = verticalOverlapScenario(1);

      assert.equal(fixed.top, 10);
      assert.equal(
        incoming.top,
        0,
        "incoming item is left overlapping fixed on screen by 0.5px",
      );
    });
  });

  describe("margin.epsilon.horizontal", () => {
    // `b` overlaps `a` by 0.5px horizontally (a occupies [0, 10], b occupies
    // [9.5, 19.5]) and fully overlaps it vertically (same height, no top yet).
    function horizontalOverlapScenario(horizontalEpsilon) {
      const a = makeItem({ left: 0, width: 10, height: 20 });
      const b = makeItem({ left: 9.5, width: 10, height: 20 });
      const margin = {
        item: { horizontal: 0, vertical: 0 },
        axis: 0,
        epsilon: { horizontal: horizontalEpsilon, vertical: 0.001 },
      };

      runStack(margin, { items: [a, b] });
      return { a, b };
    }

    it("with the default (tight) tolerance, a genuine small horizontal overlap is detected and the item is pushed to a new row", () => {
      const { a, b } = horizontalOverlapScenario(0.001);

      assert.equal(a.top, 0);
      assert.equal(b.top, 20);
    });

    it("with a larger tolerance, the pair is excluded from the collision search window entirely, so the overlap is missed", () => {
      const { a, b } = horizontalOverlapScenario(1);

      assert.equal(a.top, 0);
      assert.equal(
        b.top,
        0,
        "b is left overlapping a on screen, the vertical check never even runs for this pair",
      );
    });
  });
});
