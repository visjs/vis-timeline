import assert from "node:assert";

import jsdom_global from "jsdom-global";

import moment from "../lib/module/moment.js";
import Range from "../lib/timeline/Range.js";
import TestSupport from "./TestSupport.js";

const internals = {};

describe("Timeline Range", () => {
  before(() => {
    internals.jsdom_global = jsdom_global();
  });

  after(() => {
    internals.jsdom_global();
  });

  it("should have start default before now", () => {
    const now = moment()
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0)
      .valueOf();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.start < now, "Default start is before now");
  });

  it("should have end default after now", () => {
    const now = moment()
      .hours(0)
      .minutes(0)
      .seconds(0)
      .milliseconds(0)
      .valueOf();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.end > now, "Default end is after now");
  });

  it("should support custom start and end dates", () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.setRange(
      new Date(2017, 0, 26, 13, 26, 3, 320),
      new Date(2017, 3, 11, 0, 23, 35, 0),
      false,
      false,
      null,
    );
    assert.equal(
      range.start,
      new Date(2017, 0, 26, 13, 26, 3, 320).valueOf(),
      "start is as expected",
    );
    assert.equal(
      range.end,
      new Date(2017, 3, 11, 0, 23, 35, 0).valueOf(),
      "end is as expected",
    );
  });

  it("should calculate milliseconds per pixel", () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(
      range.getMillisecondsPerPixel() > 0,
      "positive value for milliseconds per pixel",
    );
  });

  it("should calculate 1 millisecond per pixel for simple range", () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.setRange(
      new Date(2017, 0, 26, 13, 26, 3, 320),
      new Date(2017, 0, 26, 13, 26, 4, 320),
      false,
      false,
      null,
    );
    assert.equal(
      range.getMillisecondsPerPixel(),
      1,
      "one second over 1000 pixels",
    );
  });

  describe("zoom limits", () => {
    const ranges = [];

    const createRange = (options = {}) => {
      const body = TestSupport.buildSimpleTimelineRangeBody();
      const range = new Range(body, options);
      body.range = range;
      range._applyRange(0, 1000);
      ranges.push(range);
      return range;
    };

    const zoom = (range, scale, center) => {
      range.zoom(scale, center, scale > 1 ? -1 : 1, {});
    };

    afterEach(() => {
      for (const range of ranges.splice(0)) {
        clearTimeout(range.timeoutID);
      }
    });

    for (const [limit, options, scale, expected] of [
      ["minimum", { zoomMin: 800, zoomMax: 2000 }, 0.5, [40, 840]],
      ["maximum", { zoomMin: 10, zoomMax: 1500 }, 2, [-100, 1400]],
    ]) {
      it(`preserves the pointer at the ${limit} wheel zoom limit`, () => {
        const range = createRange(options);
        zoom(range, scale, 200);
        assert.deepEqual([range.start, range.end], expected);
      });
    }

    for (const center of [0, 200, 800, 1000]) {
      it(`keeps the date at ${center / 10}% through repeated limiting`, () => {
        const range = createRange({ zoomMin: 800, zoomMax: 1500 });
        for (const scale of [0.5, 0.5, 2, 2, 0.5, 2]) {
          zoom(range, scale, center);
          assert.equal(
            (center - range.start) / (range.end - range.start),
            center / 1000,
          );
        }
      });
    }

    for (const rtl of [false, true]) {
      for (const clientX of [200, 800]) {
        it(`keeps the actual wheel anchor at x=${clientX}, rtl=${rtl}`, () => {
          const range = createRange({ zoomMin: 800, zoomMax: 1500, rtl });
          const body = range.body;
          const bounds = () => ({ left: 0, right: 1000, top: 0 });
          body.dom.center.getBoundingClientRect = bounds;
          body.dom.centerContainer = { getBoundingClientRect: bounds };
          body.util.toTime = (x) =>
            new Date(range.start + ((range.end - range.start) * x) / 1000);
          const fraction = (rtl ? 1000 - clientX : clientX) / 1000;
          const anchor = 1000 * fraction;
          for (const wheelDelta of [600, 600, -600, -600, 600, -600]) {
            range._onMouseWheel({
              wheelDelta,
              clientX,
              clientY: 0,
              preventDefault() {},
            });
            const duration = range.end - range.start;
            assert(duration >= 800 && duration <= 1500);
            assert.equal((anchor - range.start) / duration, fraction);
          }
        });
      }
    }

    it("accepts numeric string limits", () => {
      const range = createRange({ zoomMin: "800", zoomMax: "1500" });
      zoom(range, 0.5, 200);
      assert.deepEqual([range.start, range.end], [40, 840]);
    });

    it("leaves an unlimited zoom unchanged", () => {
      const range = createRange({ zoomMin: null, zoomMax: null });
      zoom(range, 2, 200);
      assert.deepEqual([range.start, range.end], [-200, 1800]);
    });

    it("does not alter an ordinary zoom below the limits", () => {
      const range = createRange({ zoomMin: 800, zoomMax: 1500 });
      zoom(range, 1.2, 200);
      assert.deepEqual([range.start, range.end], [-40, 1160]);
    });

    it("keeps programmatic range limiting centered", () => {
      const range = createRange({ zoomMin: 800, zoomMax: 1500 });
      range.setRange(-200, 1800, { animation: false });
      assert.deepEqual([range.start, range.end], [50, 1550]);
      range.setRange(100, 600, { animation: false });
      assert.deepEqual([range.start, range.end], [-50, 750]);
    });

    it("still enforces the absolute minimum", () => {
      const range = createRange({ min: 0, zoomMax: 1500 });
      zoom(range, 2, 200);
      assert(range.start >= 0);
      assert.equal(range.end - range.start, 1500);
    });

    it("still enforces the absolute maximum", () => {
      const range = createRange({ max: 1000, zoomMax: 1500 });
      zoom(range, 2, 200);
      assert(range.end <= 1000);
      assert.equal(range.end - range.start, 1500);
    });

    it("does not divide a zero interval", () => {
      const range = createRange({ zoomMin: null, zoomMax: null });
      range._applyRange(0, 0);
      zoom(range, 2, 0);
      assert.deepEqual([range.start, range.end], [0, 0]);
    });

    it("retains nonnegative limiting for negative options", () => {
      const range = createRange({ zoomMin: -1, zoomMax: null });
      zoom(range, 0.5, 200);
      assert.deepEqual([range.start, range.end], [100, 600]);
    });
  });
});
