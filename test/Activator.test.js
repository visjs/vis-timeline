import assert from 'assert'
import jsdom_global from 'jsdom-global'
import Activator from '../lib/shared/Activator';

const internals = {}

describe('Activator', () => {
  beforeEach(() => {
    internals.jsdom_global = jsdom_global('<div id="id1"></div><div id="id2"></div>');
    internals.div1 = document.getElementById('id1');
    internals.div2 = document.getElementById('id2');
  });

  afterEach(() => {
    internals.jsdom_global();
  });

  it('should activate only one at time', () => {
    const a1 = new Activator(internals.div1);
    const a2 = new Activator(internals.div2);
    a1.activate();
    assert(internals.div1.classList.contains('vis-active'));
    assert(!internals.div2.classList.contains('vis-active'));
    a2.activate();
    assert(!internals.div1.classList.contains('vis-active'));
    assert(internals.div2.classList.contains('vis-active'));
  });

  it('should not throw on activate after destroying another activator', () => {
    const a1 = new Activator(internals.div1);
    const a2 = new Activator(internals.div2);
    a1.activate();
    a1.destroy();
    a2.activate();
    assert(internals.div2.classList.contains('vis-active'));
  });
});
