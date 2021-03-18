import assert from 'assert'
import jsdom_global from 'jsdom-global'
import moment from '../lib/module/moment'
import PointItem from "../lib/timeline/component/item/PointItem"
import Range from '../lib/timeline/Range'
import TestSupport from './TestSupport'

const internals = {}

describe('Timeline PointItem', () => {
  
  const now = moment();

  before(() => {
    internals.jsdom_global = jsdom_global();
  });

  after(() => {
    internals.jsdom_global();
  });

  it('should initialize with minimal data', () => {
    const pointItem = new PointItem({start: now.toDate()}, null, null);
    assert.equal(pointItem.props.content.height, 0);
    assert.deepEqual(pointItem.data.start, now.toDate());
  });

  it('should have a default width of 0', () => {
    const pointItem = new PointItem({start: now}, null, null);
    assert.equal(pointItem.getWidthRight(), 0);
    assert.equal(pointItem.getWidthLeft(), 0);
   });

  it('should error if there is missing data', () => {
    assert.throws(() => { new PointItem({}, null, null)}, Error);
  });

  it('should be visible if the range is during', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.start = now.clone().add(-1, 'second');
    range.end = range.start.clone().add(1, 'hour');
    const pointItem = new PointItem({start: now.toDate()}, null, null);
    assert(pointItem.isVisible(range));
  });

  it('should not be visible if the range is after', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.start = now.clone().add(1, 'second');
    range.end = range.start.clone().add(1, 'hour');
    const pointItem = new PointItem({start: now.toDate()}, null, null);
    assert(!pointItem.isVisible(range));
  });

  it('should not be visible if the range is before', () => {
    const now = moment();
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    range.end = now.clone().add(-1, 'second');
    range.start = range.end.clone().add(-1, 'hour');
    const pointItem = new PointItem({start: now.toDate()}, null, null);
    assert(!pointItem.isVisible(range));
  });

  it('should be visible for a "now" point with a default range', () => {
    const range = new Range(TestSupport.buildSimpleTimelineRangeBody());
    const pointItem = new PointItem({start: now.toDate()}, null, null);
    assert(pointItem.isVisible(range));
  });


describe('should redraw() and then', () => {

  it('not be dirty', () => {
    const pointItem = new PointItem({start: now.toDate()}, null, {editable: false});
    pointItem.setParent(TestSupport.buildMockItemSet());
    assert(pointItem.dirty);
    pointItem.redraw();
    assert(!pointItem.dirty);
  });


  it('have point attached to its parent', () => {
    const pointItem = new PointItem({start: now.toDate()}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    assert(!parent.dom.foreground.hasChildNodes());
    pointItem.redraw();
    assert(parent.dom.foreground.hasChildNodes());
  });


describe('have the correct classname for', () => {

  it('a non-editable item', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: false}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-readonly");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-readonly");
  });

  it('an editable item (with object option)', () => {
    const pointItem = new PointItem({start: now.toDate()}, null, {editable: {updateTime: true, updateGroup: false}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-editable");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-editable");
  });

  it('an editable item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate()}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-editable");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-editable");
  });

  it('an editable:false override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: false}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-readonly");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-readonly");
  });

  it('an editable:true override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: true}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-editable");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-editable");
  });

  it('an editable:false override item (with object option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: false}, null, {editable: {updateTime: true, updateGroup: false}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-readonly");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-readonly");
  });

  it('an editable:false override item (with object option for group change)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: false}, null, {editable: {updateTime: false, updateGroup: true}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-readonly");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-readonly");
  });

  it('an editable:true override item (with object option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: true}, null, {editable: {updateTime: false, updateGroup: false}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-editable");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-editable");
  });

  it('an editable:true non-override item (with object option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: true}, null, {editable: {updateTime: false, updateGroup: false, overrideItems: true}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-readonly");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-readonly");
  });

  it('an editable:false non-override item (with object option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: false}, null, {editable: {updateTime: true, updateGroup: false, overrideItems: true}});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.dom.dot.className, "vis-item vis-dot vis-editable");
    assert.equal(pointItem.dom.point.className, "vis-item vis-point vis-editable");
  });

  it('an editable: {updateTime} override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true}}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, undefined);
  });

  it('an editable: {updateTime} override item (with boolean option false)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true}}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, undefined);
  });

  it('an editable: {updateGroup} override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateGroup: true}}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, undefined);
    assert.equal(pointItem.editable.updateGroup, true);
    assert.equal(pointItem.editable.remove, undefined);
  });

}); // have the correct classname for


describe('have the correct property for', () => {

  it('an editable: {updateGroup} override item (with boolean option false)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateGroup: true}}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, undefined);
    assert.equal(pointItem.editable.updateGroup, true);
    assert.equal(pointItem.editable.remove, undefined);
  });

  it('an editable: {remove} override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {remove: true}}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, undefined);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, true);
  });

  it('an editable: {remove} override item (with boolean option false)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {remove: true}}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, undefined);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, true);
  });

  it('an editable: {updateTime, remove} override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true, remove: true}}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, true);
  });

  it('an editable: {updateTime, remove} override item (with boolean option false)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true, remove: true}}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, undefined);
    assert.equal(pointItem.editable.remove, true);
  });

  it('an editable: {updateTime, updateGroup, remove} override item (with boolean option)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true, updateGroup: true, remove: true}}, null, {editable: true});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, true);
    assert.equal(pointItem.editable.remove, true);
  });

  it('an editable: {updateTime, updateGroup, remove} override item (with boolean option false)', () => {
    const pointItem = new PointItem({start: now.toDate(), editable: {updateTime: true, updateGroup: true, remove: true}}, null, {editable: false});
    const parent = TestSupport.buildMockItemSet();
    pointItem.setParent(parent);
    pointItem.redraw();
    assert.equal(pointItem.editable.updateTime, true);
    assert.equal(pointItem.editable.updateGroup, true);
    assert.equal(pointItem.editable.remove, true);
  });

}); // have the correct property for
});  // should redraw() and then
});  // Timeline PointItem
