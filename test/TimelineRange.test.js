import assert from 'assert'
import jsdom_global from 'jsdom-global'
import moment from '../lib/module/moment'
import Range from '../lib/timeline/Range'
import TestSupport from './TestSupport'

const internals = {}

describe('Timeline Range', () => {
  
  before(() => {
    internals.jsdom_global = jsdom_global();
  });

  after(() => {
      internals.jsdom_global();
  });

  it('should have start default before now', () => {
    const now = moment().hours(0).minutes(0).seconds(0).milliseconds(0).valueOf();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    assert(range.start < now, "Default start is before now");
  });

  it('should have end default after now', () => {
    const now = moment().hours(0).minutes(0).seconds(0).milliseconds(0).valueOf();
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

  describe('tests for the callback parameter of setRange()', async () => {

    [null, { animation: { duration: 1 } }].forEach((optionParam) => {

      describe(`animation is ${!optionParam ? 'not ' : ''}passed`, () => {

        it('should receive changed=true when the range does change', async function () {
          const firstDate = new Date(2017, 0, 1, 0, 0);

          const range = new Range(TestSupport.buildSimpleTimelineRangeBody());

          range.setRange(firstDate,
              new Date(2017, 0, 26, 13, 0),
              null, null, null);

          let cbParamReceived = undefined;

          range.setRange(firstDate,
              new Date(2018, 0, 26, 13, 0), optionParam,
              (changed) => { cbParamReceived = changed; }, null);

          if (optionParam) {
            await new Promise(resolve => setTimeout(resolve, 30));
          }

          assert.equal(cbParamReceived, true);
        });

        it('should receive changed=false when the range does not change', async () => {
          const dt = new Date(2017, 0, 1, 0, 0, 0, 0);

          const range = new Range(TestSupport.buildSimpleTimelineRangeBody());

          range.setRange(dt, dt, null, null, null);

          let cbParamReceived = undefined;

          range.setRange(dt, dt, optionParam, (changed) => { cbParamReceived = changed; }, null);

          if (optionParam) {
            await new Promise(resolve => setTimeout(resolve, Range.animationTimerTimeout + 10));
          }

          assert.equal(cbParamReceived, false);
        });
      });
    });
  });
});
