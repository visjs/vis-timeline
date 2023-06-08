import Hammer from '../../module/hammer';
import util from '../../util';
import Component from './Component';
import moment from '../../module/moment';
import locales from '../locales';

import './css/customtime.css';

/** A custom time bar */
class CustomTime extends Component {
 /**
 * @param {{range: Range, dom: Object}} body
 * @param {Object} [options]        Available parameters:
 *                                  {number | string} id
 *                                  {string} locales
 *                                  {string} locale
 * @constructor CustomTime
 * @extends Component
 */
  constructor(body, options) {
    super()
    this.body = body;

    // default options
    this.defaultOptions = {
      moment,
      locales,
      locale: 'en',
      id: undefined,
      title: undefined
    };
    this.options = util.extend({}, this.defaultOptions);
    this.setOptions(options);
    this.options.locales = util.extend({}, locales, this.options.locales);
    const defaultLocales = this.defaultOptions.locales[this.defaultOptions.locale];
    Object.keys(this.options.locales).forEach(locale => {
      this.options.locales[locale] = util.extend(
        {},
        defaultLocales,
        this.options.locales[locale]
      );
    });

    if (options && options.time != null) {
      this.customTime = options.time;
    } else {
      this.customTime = new Date();
    }

    this.eventParams = {}; // stores state parameters while dragging the bar

    // create the DOM
    this._create();
  }

  /**
   * Set options for the component. Options will be merged in current options.
   * @param {Object} options  Available parameters:
   *                                  {number | string} id
   *                                  {string} locales
   *                                  {string} locale
   */
  setOptions(options) {
    if (options) {
      // copy all options that we know
      util.selectiveExtend(['moment', 'locale', 'locales', 'id', 'title', 'rtl', 'snap'], this.options, options);
    }
  }

  /**
   * Create the DOM for the custom time
   * @private
   */
  _create() {
    const bar = document.createElement('div');
    bar['custom-time'] = this;
    bar.className = `vis-custom-time ${this.options.id || ''}`;
    bar.style.position = 'absolute';
    bar.style.top = '0px';
    bar.style.height = '100%';
    this.bar = bar;

    const drag = document.createElement('div');
    drag.style.position = 'relative';
    drag.style.top = '0px';
    if(this.options.rtl) {
      drag.style.right = '-10px';
    } else  {
       drag.style.left = '-10px';
    }
    drag.style.height = '100%';
    drag.style.width = '20px';

    /**
     *
     * @param {WheelEvent} e
     */
    function onMouseWheel (e) {
      this.body.range._onMouseWheel(e);
    }

    if (drag.addEventListener) {
      // IE9, Chrome, Safari, Opera
      drag.addEventListener("mousewheel", onMouseWheel.bind(this), false);
      // Firefox
      drag.addEventListener("DOMMouseScroll", onMouseWheel.bind(this), false);
    } else {
      // IE 6/7/8
      drag.attachEvent("onmousewheel", onMouseWheel.bind(this));
    }

    bar.appendChild(drag);
    // attach event listeners
    this.hammer = new Hammer(drag);
    this.hammer.on('panstart', this._onDragStart.bind(this));
    this.hammer.on('panmove',  this._onDrag.bind(this));
    this.hammer.on('panend',   this._onDragEnd.bind(this));
    this.hammer.get('pan').set({threshold:5, direction: Hammer.DIRECTION_ALL});
    // delay addition on item click for trackpads...
    this.hammer.get('press').set({time:10000});
  }

  /**
   * Destroy the CustomTime bar
   */
  destroy() {
    this.hide();

    this.hammer.destroy();
    this.hammer = null;

    this.body = null;
  }

  /**
   * Repaint the component
   * @return {boolean} Returns true if the component is resized
   */
  redraw() {
    const parent = this.body.dom.backgroundVertical;
    if (this.bar.parentNode != parent) {
      // attach to the dom
      if (this.bar.parentNode) {
        this.bar.parentNode.removeChild(this.bar);
      }
      parent.appendChild(this.bar);
    }

    const x = this.body.util.toScreen(this.customTime);

    let locale = this.options.locales[this.options.locale];
    if (!locale) {
      if (!this.warned) {
        console.warn(`WARNING: options.locales['${this.options.locale}'] not found. See https://visjs.github.io/vis-timeline/docs/timeline/#Localization`);
        this.warned = true;
      }
      locale = this.options.locales['en']; // fall back on english when not available
    }

    let title = this.options.title;
    // To hide the title completely use empty string ''.
    if (title === undefined) {
      title = `${locale.time}: ${this.options.moment(this.customTime).format('dddd, MMMM Do YYYY, H:mm:ss')}`;
      title = title.charAt(0).toUpperCase() + title.substring(1);
    } else if (typeof title === "function") {
      title = title.call(this, this.customTime);
    }

    this.options.rtl ? this.bar.style.right = `${x}px` : this.bar.style.left = `${x}px`;
    this.bar.title = title;

    return false;
  }

  /**
   * Remove the CustomTime from the DOM
   */
  hide() {
    // remove the line from the DOM
    if (this.bar.parentNode) {
      this.bar.parentNode.removeChild(this.bar);
    }
  }

  /**
   * Set custom time.
   * @param {Date | number | string} time
   */
  setCustomTime(time) {
    this.customTime = util.convert(time, 'Date');
    this.redraw();
  }

  /**
   * Retrieve the current custom time.
   * @return {Date} customTime
   */
  getCustomTime() {
    return new Date(this.customTime.valueOf());
  }

  /**
   * Set custom marker.
   * @param {string} [title] Title of the custom marker
   * @param {boolean} [editable] Make the custom marker editable.
   */
  setCustomMarker(title, editable) {
    if (this.marker) {
      this.bar.removeChild(this.marker);
    }
    this.marker = document.createElement('div');
    this.marker.className = `vis-custom-time-marker`;
    this.marker.innerHTML = util.xss(title);
    this.marker.style.position = 'absolute';

    if (editable) {
      this.marker.setAttribute('contenteditable', 'true');
      this.marker.addEventListener('pointerdown', function () {
        this.marker.focus();
      });
      this.marker.addEventListener('input', this._onMarkerChange.bind(this));
      // The editable div element has no change event, so here emulates the change event.
      this.marker.title = title;
      this.marker.addEventListener('blur', function (event) {
        if (this.title != event.target.innerHTML) {
          this._onMarkerChanged(event);
          this.title = event.target.innerHTML;
        }
      }.bind(this));
    }

    this.bar.appendChild(this.marker);
  }

  /**
    * Set custom title.
    * @param {Date | number | string} title
    */
  setCustomTitle(title) {
    this.options.title = title;
  }

  /**
   * Start moving horizontally
   * @param {Event} event
   * @private
   */
  _onDragStart(event) {
    this.eventParams.dragging = true;
    this.eventParams.customTime = this.customTime;

    event.stopPropagation();
  }

  /**
   * Perform moving operating.
   * @param {Event} event
   * @private
   */
  _onDrag(event) {
    if (!this.eventParams.dragging) return;

    let deltaX = this.options.rtl ? (-1) * event.deltaX : event.deltaX;

    const x = this.body.util.toScreen(this.eventParams.customTime) + deltaX;
    const time = this.body.util.toTime(x);

    const scale = this.body.util.getScale();
    const step = this.body.util.getStep();
    const snap = this.options.snap;

    const snappedTime = snap ? snap(time, scale, step) : time;

    this.setCustomTime(snappedTime);

    // fire a timechange event
    this.body.emitter.emit('timechange', {
      id: this.options.id,
      time: new Date(this.customTime.valueOf()),
      event
    });

    event.stopPropagation();
  }

  /**
   * Stop moving operating.
   * @param {Event} event
   * @private
   */
  _onDragEnd(event) {
    if (!this.eventParams.dragging) return;

    // fire a timechanged event
    this.body.emitter.emit('timechanged', {
      id: this.options.id,
      time: new Date(this.customTime.valueOf()),
      event
    });

    event.stopPropagation();
  }

  /**
   * Perform input operating.
   * @param {Event} event
   * @private
   */
  _onMarkerChange(event) {
    this.body.emitter.emit('markerchange', {
      id: this.options.id,
      title: event.target.innerHTML,
      event
    });

    event.stopPropagation();
  }

  /**
   * Perform change operating.
   * @param {Event} event
   * @private
   */
  _onMarkerChanged(event) {
    this.body.emitter.emit('markerchanged', {
      id: this.options.id,
      title: event.target.innerHTML,
      event
    });

    event.stopPropagation();
  }

  /**
   * Find a custom time from an event target:
   * searches for the attribute 'custom-time' in the event target's element tree
   * @param {Event} event
   * @return {CustomTime | null} customTime
   */
  static customTimeFromTarget(event) {
    let target = event.target;
    while (target) {
      if (target.hasOwnProperty('custom-time')) {
        return target['custom-time'];
      }
      target = target.parentNode;
    }

    return null;
  }
}

export default CustomTime;
