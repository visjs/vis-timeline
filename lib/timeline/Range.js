import util from '../util';
import moment from '../module/moment';
import Component from './component/Component';
import * as DateUtil  from './DateUtil';

/**
 * A Range controls a numeric range with a start and end value.
 * The Range adjusts the range based on mouse events or programmatic changes,
 * and triggers events when the range is changing or has been changed.
 */
export default class Range extends Component {
  /**
 * @param {{dom: Object, domProps: Object, emitter: Emitter}} body
 * @param {Object} [options]    See description at Range.setOptions
 * @constructor Range
 * @extends Component
 */
  constructor(body, options) {
    super();
    const now = moment().hours(0).minutes(0).seconds(0).milliseconds(0);
    const start = now.clone().add(-3, 'days').valueOf();
    const end = now.clone().add(3, 'days').valueOf(); 
    this.millisecondsPerPixelCache = undefined;
    
    if(options === undefined) {
      this.start = start;
      this.end = end;
    } else {
      this.start = options.start || start;
      this.end = options.end || end
    }

    this.rolling = false;

    this.body = body;
    this.deltaDifference = 0;
    this.scaleOffset = 0;
    this.startToFront = false;
    this.endToFront = true;

    // default options
    this.defaultOptions = {
      rtl: false,
      start: null,
      end: null,
      moment,
      direction: 'horizontal', // 'horizontal' or 'vertical'
      moveable: true,
      zoomable: true,
      min: null,
      max: null,
      zoomMin: 10,                                // milliseconds
      zoomMax: 1000 * 60 * 60 * 24 * 365 * 10000,  // milliseconds
      rollingMode: {
        follow: false,
        offset: 0.5
      }
    };
    this.options = util.extend({}, this.defaultOptions);
    this.props = {
      touch: {}
    };
    this.animationTimer = null;

    // drag listeners for dragging
    this.body.emitter.on('panstart', this._onDragStart.bind(this));
    this.body.emitter.on('panmove',  this._onDrag.bind(this));
    this.body.emitter.on('panend',   this._onDragEnd.bind(this));

    // mouse wheel for zooming
    this.body.emitter.on('mousewheel', this._onMouseWheel.bind(this));

    // pinch to zoom
    this.body.emitter.on('touch', this._onTouch.bind(this));
    this.body.emitter.on('pinch', this._onPinch.bind(this));

    // on click of rolling mode button
    this.body.dom.rollingModeBtn.addEventListener('click', this.startRolling.bind(this));

    this.setOptions(options);
  }

  /**
   * Set options for the range controller
   * @param {Object} options      Available options:
   *                              {number | Date | String} start  Start date for the range
   *                              {number | Date | String} end    End date for the range
   *                              {number} min    Minimum value for start
   *                              {number} max    Maximum value for end
   *                              {number} zoomMin    Set a minimum value for
   *                                                  (end - start).
   *                              {number} zoomMax    Set a maximum value for
   *                                                  (end - start).
   *                              {boolean} moveable Enable moving of the range
   *                                                 by dragging. True by default
   *                              {boolean} zoomable Enable zooming of the range
   *                                                 by pinching/scrolling. True by default
   */
  setOptions(options) {
    if (options) {
      // copy the options that we know
      const fields = [
        'animation', 'direction', 'min', 'max', 'zoomMin', 'zoomMax', 'moveable', 'zoomable',
        'moment', 'activate', 'hiddenDates', 'zoomKey', 'zoomFriction', 'rtl', 'showCurrentTime', 'rollingMode', 'horizontalScroll'
      ];
      util.selectiveExtend(fields, this.options, options);

      if (options.rollingMode && options.rollingMode.follow) {
        this.startRolling();
      }
      if ('start' in options || 'end' in options) {
        // apply a new range. both start and end are optional
        this.setRange(options.start, options.end);
      }
    }
  }

  /**
   * Start auto refreshing the current time bar
   */
  startRolling() {
    const me = this;

    /**
     *  Updates the current time.
     */
    function update () {
      me.stopRolling();
      me.rolling = true;


      let interval = me.end - me.start;
      const t = util.convert(new Date(), 'Date').valueOf();
      const rollingModeOffset = me.options.rollingMode && me.options.rollingMode.offset || 0.5

      const start = t - interval * (rollingModeOffset);
      const end = t + interval * (1 - rollingModeOffset);

      const options = {
        animation: false
      };
      me.setRange(start, end, options);

      // determine interval to refresh
      const scale = me.conversion(me.body.domProps.center.width).scale;
      interval = 1 / scale / 10;
      if (interval < 30)   interval = 30;
      if (interval > 1000) interval = 1000;

      me.body.dom.rollingModeBtn.style.visibility = "hidden";
      // start a renderTimer to adjust for the new time
      me.currentTimeTimer = setTimeout(update, interval);
    }

    update();
  }

  /**
   * Stop auto refreshing the current time bar
   */
  stopRolling() {
    if (this.currentTimeTimer !== undefined) {
      clearTimeout(this.currentTimeTimer);
      this.rolling = false;
      this.body.dom.rollingModeBtn.style.visibility = "visible";
    }
  }

  /**
   * Set a new start and end range
   * @param {Date | number | string} start
   * @param {Date | number | string} end
   * @param {Object} options      Available options:
   *                              {boolean | {duration: number, easingFunction: string}} [animation=false]
   *                                    If true, the range is animated
   *                                    smoothly to the new window. An object can be
   *                                    provided to specify duration and easing function.
   *                                    Default duration is 500 ms, and default easing
   *                                    function is 'easeInOutQuad'.
   *                              {boolean} [byUser=false]
   *                              {Event}  event  Mouse event
   * @param {Function} callback     a callback function to be executed at the end of this function  
   * @param {Function} frameCallback    a callback function executed each frame of the range animation.
   *                                    The callback will be passed three parameters:
   *                                    {number} easeCoefficient    an easing coefficent
   *                                    {boolean} willDraw          If true the caller will redraw after the callback completes
   *                                    {boolean} done              If true then animation is ending after the current frame
   * @return {void}
   */
  setRange(start, end, options, callback, frameCallback) {
    if (!options) {
      options = {};
    }
    if (options.byUser !== true) {
      options.byUser = false;
    }
    const me = this;
    const finalStart = start != undefined ? util.convert(start, 'Date').valueOf() : null;
    const finalEnd   = end != undefined   ? util.convert(end, 'Date').valueOf()   : null;
    this._cancelAnimation();
    this.millisecondsPerPixelCache = undefined;

    if (options.animation) { // true or an Object
      const initStart = this.start;
      const initEnd = this.end;
      const duration = (typeof options.animation === 'object' && 'duration' in options.animation) ? options.animation.duration : 500;
      const easingName = (typeof options.animation === 'object' && 'easingFunction' in options.animation) ? options.animation.easingFunction : 'easeInOutQuad';
      const easingFunction = util.easingFunctions[easingName];
      if (!easingFunction) {
        throw new Error(`Unknown easing function ${JSON.stringify(easingName)}. Choose from: ${Object.keys(util.easingFunctions).join(', ')}`);
      }

      const initTime = Date.now();
      let anyChanged = false;

      const next = () => {
        if (!me.props.touch.dragging) {
          const now = Date.now();
          const time = now - initTime;
          const ease = easingFunction(time / duration);
          const done = time > duration;
          const s = (done || finalStart === null) ? finalStart : initStart + (finalStart - initStart) * ease;
          const e = (done || finalEnd   === null) ? finalEnd   : initEnd   + (finalEnd   - initEnd)   * ease;

          changed = me._applyRange(s, e);
          DateUtil.updateHiddenDates(me.options.moment, me.body, me.options.hiddenDates);
          anyChanged = anyChanged || changed;

          const params = {
            start: new Date(me.start), 
            end: new Date(me.end), 
            byUser: options.byUser,
            event: options.event
          };

          if (frameCallback) { frameCallback(ease, changed, done); }

          if (changed) {          
            me.body.emitter.emit('rangechange', params);
          }

          if (done) {
            if (anyChanged) {
              me.body.emitter.emit('rangechanged', params);
              if (callback) { return callback() }
            }
          }
          else {
            // animate with as high as possible frame rate, leave 20 ms in between
            // each to prevent the browser from blocking
            me.animationTimer = setTimeout(next, 20);
          }
        }
      };

      return next();
    }
    else {
      var changed = this._applyRange(finalStart, finalEnd);
      DateUtil.updateHiddenDates(this.options.moment, this.body, this.options.hiddenDates);
      if (changed) {
        const params = {
          start: new Date(this.start), 
          end: new Date(this.end), 
          byUser: options.byUser, 
          event: options.event
        };

        this.body.emitter.emit('rangechange', params);
        clearTimeout( me.timeoutID );
        me.timeoutID = setTimeout( () => {
          me.body.emitter.emit('rangechanged', params);
        }, 200 );
        if (callback) { return callback() }
      }
    }
  }

  /**
   * Get the number of milliseconds per pixel.
   *
   * @returns {undefined|number}
   */
  getMillisecondsPerPixel() {
    if (this.millisecondsPerPixelCache === undefined) {
      this.millisecondsPerPixelCache = (this.end - this.start) / this.body.dom.center.clientWidth;
    }
    return this.millisecondsPerPixelCache;
  }

  /**
   * Stop an animation
   * @private
   */
  _cancelAnimation() {
    if (this.animationTimer) {
      clearTimeout(this.animationTimer);
      this.animationTimer = null;
    }
  }

  /**
   * Set a new start and end range. This method is the same as setRange, but
   * does not trigger a range change and range changed event, and it returns
   * true when the range is changed
   * @param {number} [start]
   * @param {number} [end]
   * @return {boolean} changed
   * @private
   */
  _applyRange(start, end) {
    let newStart = (start != null) ? util.convert(start, 'Date').valueOf() : this.start;
    let newEnd   = (end != null)   ? util.convert(end, 'Date').valueOf()   : this.end;
    const max = (this.options.max != null) ? util.convert(this.options.max, 'Date').valueOf() : null;
    const min = (this.options.min != null) ? util.convert(this.options.min, 'Date').valueOf() : null;
    let diff;

    // check for valid number
    if (isNaN(newStart) || newStart === null) {
      throw new Error(`Invalid start "${start}"`);
    }
    if (isNaN(newEnd) || newEnd === null) {
      throw new Error(`Invalid end "${end}"`);
    }

    // prevent end < start
    if (newEnd < newStart) {
      newEnd = newStart;
    }

    // prevent start < min
    if (min !== null) {
      if (newStart < min) {
        diff = (min - newStart);
        newStart += diff;
        newEnd += diff;

        // prevent end > max
        if (max != null) {
          if (newEnd > max) {
            newEnd = max;
          }
        }
      }
    }

    // prevent end > max
    if (max !== null) {
      if (newEnd > max) {
        diff = (newEnd - max);
        newStart -= diff;
        newEnd -= diff;

        // prevent start < min
        if (min != null) {
          if (newStart < min) {
            newStart = min;
          }
        }
      }
    }

    // prevent (end-start) < zoomMin
    if (this.options.zoomMin !== null) {
      let zoomMin = parseFloat(this.options.zoomMin);
      if (zoomMin < 0) {
        zoomMin = 0;
      }
      if ((newEnd - newStart) < zoomMin) {
        // compensate for a scale of 0.5 ms
        const compensation = 0.5;
        if ((this.end - this.start) === zoomMin && newStart >= this.start - compensation && newEnd <= this.end) {
          // ignore this action, we are already zoomed to the minimum
          newStart = this.start;
          newEnd = this.end;
        }
        else {
          // zoom to the minimum
          diff = (zoomMin - (newEnd - newStart));
          newStart -= diff / 2;
          newEnd += diff / 2;
        }
      }
    }

    // prevent (end-start) > zoomMax
    if (this.options.zoomMax !== null) {
      let zoomMax = parseFloat(this.options.zoomMax);
      if (zoomMax < 0) {
        zoomMax = 0;
      }

      if ((newEnd - newStart) > zoomMax) {
        if ((this.end - this.start) === zoomMax && newStart < this.start && newEnd > this.end) {
          // ignore this action, we are already zoomed to the maximum
          newStart = this.start;
          newEnd = this.end;
        }
        else {
          // zoom to the maximum
          diff = ((newEnd - newStart) - zoomMax);
          newStart += diff / 2;
          newEnd -= diff / 2;
        }
      }
    }

    const changed = (this.start != newStart || this.end != newEnd);

    // if the new range does NOT overlap with the old range, emit checkRangedItems to avoid not showing ranged items (ranged meaning has end time, not necessarily of type Range)
    if (!((newStart >= this.start && newStart   <= this.end) || (newEnd   >= this.start && newEnd   <= this.end)) &&
        !((this.start >= newStart && this.start <= newEnd)   || (this.end >= newStart   && this.end <= newEnd) )) {
      this.body.emitter.emit('checkRangedItems');
    }

    this.start = newStart;
    this.end = newEnd;
    return changed;
  }

  /**
   * Retrieve the current range.
   * @return {Object} An object with start and end properties
   */
  getRange() {
    return {
      start: this.start,
      end: this.end
    };
  }

  /**
   * Calculate the conversion offset and scale for current range, based on
   * the provided width
   * @param {number} width
   * @param {number} [totalHidden=0]
   * @returns {{offset: number, scale: number}} conversion
   */
  conversion(width, totalHidden) {
    return Range.conversion(this.start, this.end, width, totalHidden);
  }

  /**
   * Static method to calculate the conversion offset and scale for a range,
   * based on the provided start, end, and width
   * @param {number} start
   * @param {number} end
   * @param {number} width
   * @param {number} [totalHidden=0]
   * @returns {{offset: number, scale: number}} conversion
   */
  static conversion(start, end, width, totalHidden) {
    if (totalHidden === undefined) {
      totalHidden = 0;
    }
    if (width != 0 && (end - start != 0)) {
      return {
        offset: start,
        scale: width / (end - start - totalHidden)
      }
    }
    else {
      return {
        offset: 0,
        scale: 1
      };
    }
  }

  /**
   * Start dragging horizontally or vertically
   * @param {Event} event
   * @private
   */
  _onDragStart(event) {
    this.deltaDifference = 0;
    this.previousDelta = 0;

    // only allow dragging when configured as movable
    if (!this.options.moveable) return;

    // only start dragging when the mouse is inside the current range
    if (!this._isInsideRange(event)) return;

    // refuse to drag when we where pinching to prevent the timeline make a jump
    // when releasing the fingers in opposite order from the touch screen
    if (!this.props.touch.allowDragging) return;

    this.stopRolling();

    this.props.touch.start = this.start;
    this.props.touch.end = this.end;
    this.props.touch.dragging = true;

    if (this.body.dom.root) {
      this.body.dom.root.style.cursor = 'move';
    }
  }

  /**
   * Perform dragging operation
   * @param {Event} event
   * @private
   */
  _onDrag(event) {
    if (!event) return;

    if (!this.props.touch.dragging) return;

    // only allow dragging when configured as movable
    if (!this.options.moveable) return;

    // TODO: this may be redundant in hammerjs2
    // refuse to drag when we where pinching to prevent the timeline make a jump
    // when releasing the fingers in opposite order from the touch screen
    if (!this.props.touch.allowDragging) return;

    const direction = this.options.direction;
    validateDirection(direction);
    let delta = (direction == 'horizontal') ? event.deltaX : event.deltaY;
    delta -= this.deltaDifference;
    let interval = (this.props.touch.end - this.props.touch.start);

    // normalize dragging speed if cutout is in between.
    const duration = DateUtil.getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
    interval -= duration;

    const width = (direction == 'horizontal') ? this.body.domProps.center.width : this.body.domProps.center.height;
    let diffRange;
    if (this.options.rtl) {
      diffRange = delta / width * interval;
    } else {
      diffRange = -delta / width * interval;
    }

    const newStart = this.props.touch.start + diffRange;
    const newEnd = this.props.touch.end + diffRange;

    // snapping times away from hidden zones
    const safeStart = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newStart, this.previousDelta-delta, true);
    const safeEnd = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newEnd, this.previousDelta-delta, true);
    if (safeStart != newStart || safeEnd != newEnd) {
      this.deltaDifference += delta;
      this.props.touch.start = safeStart;
      this.props.touch.end = safeEnd;
      this._onDrag(event);
      return;
    }

    this.previousDelta = delta;
    this._applyRange(newStart, newEnd);


    const startDate = new Date(this.start);
    const endDate = new Date(this.end);

    // fire a rangechange event
    this.body.emitter.emit('rangechange', {
      start: startDate,
      end:   endDate,
      byUser: true,
      event
    });

    // fire a panmove event
    this.body.emitter.emit('panmove');
  }

  /**
   * Stop dragging operation
   * @param {event} event
   * @private
   */
  _onDragEnd(event) {
    if (!this.props.touch.dragging) return;

    // only allow dragging when configured as movable
    if (!this.options.moveable) return;

    // TODO: this may be redundant in hammerjs2
    // refuse to drag when we where pinching to prevent the timeline make a jump
    // when releasing the fingers in opposite order from the touch screen
    if (!this.props.touch.allowDragging) return;

    this.props.touch.dragging = false;
    if (this.body.dom.root) {
      this.body.dom.root.style.cursor = 'auto';
    }

    // fire a rangechanged event
    this.body.emitter.emit('rangechanged', {
      start: new Date(this.start),
      end:   new Date(this.end),
      byUser: true,
      event
    });
  }

  /**
   * Event handler for mouse wheel event, used to zoom
   * Code from http://adomas.org/javascript-mouse-wheel/
   * @param {Event} event
   * @private
   */
  _onMouseWheel(event) {
    // retrieve delta
    let delta = 0;
    if (event.wheelDelta) { /* IE/Opera. */
      delta = event.wheelDelta / 120;
    } else if (event.detail) { /* Mozilla case. */
      // In Mozilla, sign of delta is different than in IE.
      // Also, delta is multiple of 3.
      delta = -event.detail / 3;
    } else if (event.deltaY) {
      delta = -event.deltaY / 3;
    } 

    // don't allow zoom when the according key is pressed and the zoomKey option or not zoomable but movable
    if ((this.options.zoomKey && !event[this.options.zoomKey] && this.options.zoomable) 
      || (!this.options.zoomable && this.options.moveable)) {
      return;
    }

    // only allow zooming when configured as zoomable and moveable
    if (!(this.options.zoomable && this.options.moveable)) return;
    
    // only zoom when the mouse is inside the current range
    if (!this._isInsideRange(event)) return;

    // If delta is nonzero, handle it.
    // Basically, delta is now positive if wheel was scrolled up,
    // and negative, if wheel was scrolled down.
    if (delta) {
      // perform the zoom action. Delta is normally 1 or -1

      // adjust a negative delta such that zooming in with delta 0.1
      // equals zooming out with a delta -0.1

      const zoomFriction = this.options.zoomFriction || 5;
      let scale;
      if (delta < 0) {
        scale = 1 - (delta / zoomFriction);
      }
      else {
        scale = 1 / (1 + (delta / zoomFriction)) ;
      }

      // calculate center, the date to zoom around
      let pointerDate;
      if (this.rolling) {
        const rollingModeOffset = this.options.rollingMode && this.options.rollingMode.offset || 0.5;
        pointerDate = this.start + ((this.end - this.start) * rollingModeOffset);
      } else {
        const pointer = this.getPointer({x: event.clientX, y: event.clientY}, this.body.dom.center);
        pointerDate = this._pointerToDate(pointer);
      }
      this.zoom(scale, pointerDate, delta, event);

      // Prevent default actions caused by mouse wheel
      // (else the page and timeline both scroll)
      event.preventDefault();
    }
  }

  /**
   * Start of a touch gesture
   * @param {Event} event
   * @private
   */
  _onTouch(event) {  // eslint-disable-line no-unused-vars
    this.props.touch.start = this.start;
    this.props.touch.end = this.end;
    this.props.touch.allowDragging = true;
    this.props.touch.center = null;
    this.props.touch.centerDate = null;
    this.scaleOffset = 0;
    this.deltaDifference = 0;
    // Disable the browser default handling of this event.
    util.preventDefault(event);
  }

  /**
   * Handle pinch event
   * @param {Event} event
   * @private
   */
  _onPinch(event) {
    // only allow zooming when configured as zoomable and moveable
    if (!(this.options.zoomable && this.options.moveable)) return;

    // Disable the browser default handling of this event.
    util.preventDefault(event);

    this.props.touch.allowDragging = false;

    if (!this.props.touch.center) {
      this.props.touch.center = this.getPointer(event.center, this.body.dom.center);
      this.props.touch.centerDate = this._pointerToDate(this.props.touch.center);
    }

    this.stopRolling();
    const scale = 1 / (event.scale + this.scaleOffset);
    const centerDate = this.props.touch.centerDate;

    const hiddenDuration = DateUtil.getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
    const hiddenDurationBefore = DateUtil.getHiddenDurationBefore(this.options.moment, this.body.hiddenDates, this, centerDate);
    const hiddenDurationAfter = hiddenDuration - hiddenDurationBefore;

    // calculate new start and end
    let newStart = (centerDate - hiddenDurationBefore) + (this.props.touch.start - (centerDate - hiddenDurationBefore)) * scale;
    let newEnd = (centerDate + hiddenDurationAfter) + (this.props.touch.end - (centerDate + hiddenDurationAfter)) * scale;

    // snapping times away from hidden zones
    this.startToFront = 1 - scale <= 0; // used to do the right auto correction with periodic hidden times
    this.endToFront = scale - 1 <= 0;   // used to do the right auto correction with periodic hidden times
    
    const safeStart = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newStart, 1 - scale, true);
    const safeEnd = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newEnd, scale - 1, true);
    if (safeStart != newStart || safeEnd != newEnd) {
      this.props.touch.start = safeStart;
      this.props.touch.end = safeEnd;
      this.scaleOffset = 1 - event.scale;
      newStart = safeStart;
      newEnd = safeEnd;
    }
    
    const options = {
      animation: false,
      byUser: true,
      event
    };
    this.setRange(newStart, newEnd, options);

    this.startToFront = false; // revert to default
    this.endToFront = true; // revert to default
  }

  /**
   * Test whether the mouse from a mouse event is inside the visible window,
   * between the current start and end date
   * @param {Object} event
   * @return {boolean} Returns true when inside the visible window
   * @private
   */
  _isInsideRange(event) {
    // calculate the time where the mouse is, check whether inside
    // and no scroll action should happen.
    const clientX = event.center ? event.center.x : event.clientX;
    const centerContainerRect = this.body.dom.centerContainer.getBoundingClientRect();
    const x = this.options.rtl ? clientX - centerContainerRect.left : centerContainerRect.right - clientX;
    const time = this.body.util.toTime(x);

    return time >= this.start && time <= this.end;
  }

  /**
   * Helper function to calculate the center date for zooming
   * @param {{x: number, y: number}} pointer
   * @return {number} date
   * @private
   */
  _pointerToDate(pointer) {
    let conversion;
    const direction = this.options.direction;

    validateDirection(direction);

    if (direction == 'horizontal') {
      return this.body.util.toTime(pointer.x).valueOf();
    }
    else {
      const height = this.body.domProps.center.height;
      conversion = this.conversion(height);
      return pointer.y / conversion.scale + conversion.offset;
    }
  }

  /**
   * Get the pointer location relative to the location of the dom element
   * @param {{x: number, y: number}} touch
   * @param {Element} element   HTML DOM element
   * @return {{x: number, y: number}} pointer
   * @private
   */
  getPointer(touch, element) {
    const elementRect = element.getBoundingClientRect();
    if (this.options.rtl) {
      return {
        x: elementRect.right - touch.x,
        y: touch.y - elementRect.top
      };
    } else {
      return {
        x: touch.x - elementRect.left,
        y: touch.y - elementRect.top
      };
    }
  }

  /**
   * Zoom the range the given scale in or out. Start and end date will
   * be adjusted, and the timeline will be redrawn. You can optionally give a
   * date around which to zoom.
   * For example, try scale = 0.9 or 1.1
   * @param {number} scale      Scaling factor. Values above 1 will zoom out,
   *                            values below 1 will zoom in.
   * @param {number} [center]   Value representing a date around which will
   *                            be zoomed.
   * @param {number} delta
   * @param {Event} event
   */
  zoom(scale, center, delta, event) {
    // if centerDate is not provided, take it half between start Date and end Date
    if (center == null) {
      center = (this.start + this.end) / 2;
    }

    const hiddenDuration = DateUtil.getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
    const hiddenDurationBefore = DateUtil.getHiddenDurationBefore(this.options.moment, this.body.hiddenDates, this, center);
    const hiddenDurationAfter = hiddenDuration - hiddenDurationBefore;

    // calculate new start and end
    let newStart = (center-hiddenDurationBefore) + (this.start - (center-hiddenDurationBefore)) * scale;
    let newEnd   = (center+hiddenDurationAfter) + (this.end - (center+hiddenDurationAfter)) * scale;

    // snapping times away from hidden zones
    this.startToFront = delta > 0 ? false : true; // used to do the right autocorrection with periodic hidden times
    this.endToFront = -delta  > 0 ? false : true; // used to do the right autocorrection with periodic hidden times
    const safeStart = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newStart, delta, true);
    const safeEnd = DateUtil.snapAwayFromHidden(this.body.hiddenDates, newEnd, -delta, true);
    if (safeStart != newStart || safeEnd != newEnd) {
      newStart = safeStart;
      newEnd = safeEnd;
    }

    const options = {
      animation: false,
      byUser: true,
      event
    };
    this.setRange(newStart, newEnd, options);

    this.startToFront = false; // revert to default
    this.endToFront = true; // revert to default
  }

  /**
   * Move the range with a given delta to the left or right. Start and end
   * value will be adjusted. For example, try delta = 0.1 or -0.1
   * @param {number}  delta     Moving amount. Positive value will move right,
   *                            negative value will move left
   */
  move(delta) {
    // zoom start Date and end Date relative to the centerDate
    const diff = (this.end - this.start);

    // apply new values
    const newStart = this.start + diff * delta;
    const newEnd = this.end + diff * delta;

    // TODO: reckon with min and max range

    this.start = newStart;
    this.end = newEnd;
  }

  /**
   * Move the range to a new center point
   * @param {number} moveTo      New center point of the range
   */
  moveTo(moveTo) {
    const center = (this.start + this.end) / 2;

    const diff = center - moveTo;

    // calculate new start and end
    const newStart = this.start - diff;
    const newEnd = this.end - diff;

    const options = {
      animation: false,
      byUser: true,
      event: null
    };
    this.setRange(newStart, newEnd, options);
  }

  /**
   * Destroy the Range
   */
  destroy() {
    this.stopRolling();
  }
}

/**
 * Test whether direction has a valid value
 * @param {string} direction    'horizontal' or 'vertical'
 */
function validateDirection (direction) {
  if (direction != 'horizontal' && direction != 'vertical') {
    throw new TypeError(`Unknown direction "${direction}". Choose "horizontal" or "vertical".`);
  }
}
