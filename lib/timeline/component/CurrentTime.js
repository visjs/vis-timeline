import util from '../../util';
import Component from './Component';
import moment from '../../module/moment';
import locales from '../locales';

/**
 * A current time bar
 */
class CurrentTime extends Component {
/**
 * @param {{range: Range, dom: Object, domProps: Object}} body
 * @param {Object} [options]        Available parameters:
 *                                  {Boolean} [showCurrentTime]
 *                                  {String}  [alignCurrentTime]
 * @constructor CurrentTime
 * @extends Component
 */
  constructor(body, options) {
    super()
    this.body = body;

    // default options
    this.defaultOptions = {
      rtl: false,
      showCurrentTime: true,
      alignCurrentTime: undefined,

      moment,
      locales,
      locale: 'en'
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
    this.offset = 0;

    this._create();

  }

  /**
   * Create the HTML DOM for the current time bar
   * @private
   */
  _create() {
    const bar = document.createElement('div');
    bar.className = 'vis-current-time';
    bar.style.position = 'absolute';
    bar.style.top = '0px';
    bar.style.height = '100%';

    this.bar = bar;
  }

  /**
   * Destroy the CurrentTime bar
   */
  destroy() {
    this.options.showCurrentTime = false;
    this.redraw(); // will remove the bar from the DOM and stop refreshing

    this.body = null;
  }

  /**
   * Set options for the component. Options will be merged in current options.
   * @param {Object} options  Available parameters:
   *                          {boolean} [showCurrentTime]
   *                          {String}  [alignCurrentTime]
   */
  setOptions(options) {
    if (options) {
      // copy all options that we know
      util.selectiveExtend(['rtl', 'showCurrentTime', 'alignCurrentTime', 'moment', 'locale', 'locales'], this.options, options);
    }
  }

  /**
   * Repaint the component
   * @return {boolean} Returns true if the component is resized
   */
  redraw() {
    if (this.options.showCurrentTime) {
      const parent = this.body.dom.backgroundVertical;
      if (this.bar.parentNode != parent) {
        // attach to the dom
        if (this.bar.parentNode) {
          this.bar.parentNode.removeChild(this.bar);
        }
        parent.appendChild(this.bar);

        this.start();
      }

      let now = this.options.moment(Date.now() + this.offset);

      if (this.options.alignCurrentTime) {
        now = now.startOf(this.options.alignCurrentTime);
      }

      const x = this.body.util.toScreen(now);

      let locale = this.options.locales[this.options.locale];
      if (!locale) {
        if (!this.warned) {
          console.warn(`WARNING: options.locales['${this.options.locale}'] not found. See https://visjs.github.io/vis-timeline/docs/timeline/#Localization`);
          this.warned = true;
        }
        locale = this.options.locales['en']; // fall back on english when not available
      }
      let title = `${locale.current} ${locale.time}: ${now.format('dddd, MMMM Do YYYY, H:mm:ss')}`;
      title = title.charAt(0).toUpperCase() + title.substring(1);

      if (this.options.rtl) {
        this.bar.style.transform = `translateX(${x * -1}px)`;
      } else {
        this.bar.style.transform = `translateX(${x}px)`;
      }
      this.bar.title = title;
    }
    else {
      // remove the line from the DOM
      if (this.bar.parentNode) {
        this.bar.parentNode.removeChild(this.bar);
      }
      this.stop();
    }

    return false;
  }

  /**
   * Start auto refreshing the current time bar
   */
  start() {
    const me = this;

      /**
       *  Updates the current time.
       */
      function update () {
      me.stop();

      // determine interval to refresh
      const scale = me.body.range.conversion(me.body.domProps.center.width).scale;
      let interval = 1 / scale / 10;
      if (interval < 30)   interval = 30;
      if (interval > 1000) interval = 1000;

      me.redraw();
      me.body.emitter.emit('currentTimeTick');

      // start a renderTimer to adjust for the new time
      me.currentTimeTimer = setTimeout(update, interval);
    }

    update();
  }

  /**
   * Stop auto refreshing the current time bar
   */
  stop() {
    if (this.currentTimeTimer !== undefined) {
      clearTimeout(this.currentTimeTimer);
      delete this.currentTimeTimer;
    }
  }

  /**
   * Set a current time. This can be used for example to ensure that a client's
   * time is synchronized with a shared server time.
   * @param {Date | string | number} time     A Date, unix timestamp, or
   *                                          ISO date string.
   */
  setCurrentTime(time) {
    const t = util.convert(time, 'Date').valueOf();
    const now = Date.now();
    this.offset = t - now;
    this.redraw();
  }

  /**
   * Get the current time.
   * @return {Date} Returns the current time.
   */
  getCurrentTime() {
    return new Date(Date.now() + this.offset);
  }
}

export default CurrentTime;
