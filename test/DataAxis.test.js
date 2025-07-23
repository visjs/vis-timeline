import assert from 'assert'
import canvasMockify from './canvas-mock.js'

import DataAxis from '../lib/timeline/component/DataAxis.js'

const internals = {}

describe('DataAxis', () => {
  beforeEach(() => {
    internals.jsdom = canvasMockify("<svg id='svg'></svg>");
    internals.svg = internals.container = document.getElementById('svg');
    internals.body = {
      functions: {},
      emitter: {
        on: () => {}
      }
    };
  });

  afterEach(() => {
    internals.jsdom();
    internals.svg.remove();
    internals.svg = undefined;
  });

  it('should work', () => {
    new DataAxis(internals.body, {}, internals.svg, {});
  });

  describe('screenToValue', () => {
    it('can called be without an explicit redraw', () => {
      const dataAxis = new DataAxis(internals.body, {}, internals.svg, {});
      assert(isNaN(dataAxis.screenToValue(77)));
    });
  });

  describe('convertValue', () => {
    it('can called be without an explicit redraw', () => {
      const dataAxis = new DataAxis(internals.body, {}, internals.svg, {});
      assert(isNaN(dataAxis.convertValue(77)));
    });
  });
});
