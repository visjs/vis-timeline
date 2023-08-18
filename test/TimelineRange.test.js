import assert from 'assert'
import jsdom_global from 'jsdom-global'
import Range from '../lib/timeline/Range'
import TestSupport from './TestSupport'
import {DateTime} from "luxon";

const internals = {}

describe('Timeline Range', () => {
  
  before(() => {
    internals.jsdom_global = jsdom_global();
  });

  after(() => {
      internals.jsdom_global();
  });

  it('should have start default before now', () => {
    const now = DateTime.now().startOf("day").valueOf();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.start < now, "Default start is before now");
  });

  it('should have end default after now', () => {
    const now = DateTime.now().startOf("day").valueOf();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.end > now, "Default end is after now");
  });

  it('should support custom start and end dates', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.setRange(new Date(2017, 0, 26, 13, 26, 3, 320), new Date(2017, 3, 11, 0, 23, 35, 0), false, false, null);
    assert.equal(range.start, new Date(2017, 0, 26, 13, 26, 3, 320).valueOf(),  "start is as expected");
    assert.equal(range.end, new Date(2017, 3, 11, 0, 23, 35, 0).valueOf(),  "end is as expected");
  });

  it('should calculate milliseconds per pixel', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.getMillisecondsPerPixel() > 0, "positive value for milliseconds per pixel");
  });

  it('should calculate 1 millisecond per pixel for simple range', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.setRange(new Date(2017, 0, 26, 13, 26, 3, 320), new Date(2017, 0, 26, 13, 26, 4, 320), false, false, null);
    assert.equal(range.getMillisecondsPerPixel(), 1, "one second over 1000 pixels");
  });
});
