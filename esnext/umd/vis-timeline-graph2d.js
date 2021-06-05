/**
 * vis-timeline and vis-graph2d
 * https://visjs.github.io/vis-timeline/
 *
 * Create a fully customizable, interactive timeline with items and ranges.
 *
 * @version 0.0.0-no-version
 * @date    2021-06-04T23:51:28.540Z
 *
 * @copyright (c) 2011-2017 Almende B.V, http://almende.com
 * @copyright (c) 2017-2019 visjs contributors, https://github.com/visjs
 *
 * @license
 * vis.js is dual licensed under both
 *
 *   1. The Apache 2.0 License
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *   and
 *
 *   2. The MIT License
 *      http://opensource.org/licenses/MIT
 *
 * vis.js may be distributed under either license.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('moment'), require('vis-util/esnext/umd/vis-util.js'), require('vis-data/esnext/umd/vis-data.js'), require('xss'), require('uuid'), require('component-emitter'), require('propagating-hammerjs'), require('@egjs/hammerjs'), require('keycharm')) :
  typeof define === 'function' && define.amd ? define(['exports', 'moment', 'vis-util/esnext/umd/vis-util.js', 'vis-data/esnext/umd/vis-data.js', 'xss', 'uuid', 'component-emitter', 'propagating-hammerjs', '@egjs/hammerjs', 'keycharm'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vis = global.vis || {}, global.moment, global.vis, global.vis, global.filterXSS, global.uuid, global.Emitter, global.propagating, global.Hammer, global.keycharm));
}(this, (function (exports, moment$3, util, esnext, xssFilter, uuid, Emitter, PropagatingHammer, Hammer$1, keycharm) {
  function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () {
              return e[k];
            }
          });
        }
      });
    }
    n['default'] = e;
    return Object.freeze(n);
  }

  var moment__default = /*#__PURE__*/_interopDefaultLegacy(moment$3);
  var util__namespace = /*#__PURE__*/_interopNamespace(util);
  var xssFilter__default = /*#__PURE__*/_interopDefaultLegacy(xssFilter);
  var Emitter__default = /*#__PURE__*/_interopDefaultLegacy(Emitter);
  var PropagatingHammer__default = /*#__PURE__*/_interopDefaultLegacy(PropagatingHammer);
  var Hammer__default = /*#__PURE__*/_interopDefaultLegacy(Hammer$1);
  var keycharm__default = /*#__PURE__*/_interopDefaultLegacy(keycharm);

  // first check if moment.js is already loaded in the browser window, if so,
  // use this instance. Else, load via commonjs.
  //
  // Note: This doesn't work in ESM.
  var moment$2 = (typeof window !== 'undefined') && window['moment'] || moment__default['default'];

  // utility functions

  // parse ASP.Net Date pattern,
  // for example '/Date(1198908717056)/' or '/Date(1198908717056-0700)/'
  // code from http://momentjs.com/
  const ASPDateRegex = /^\/?Date\((-?\d+)/i;
  const NumericRegex = /^\d+$/;
  /**
   * Convert an object into another type
   *
   * @param object - Value of unknown type.
   * @param type - Name of the desired type.
   *
   * @returns Object in the desired type.
   * @throws Error
   */
  function convert(object, type) {
    let match;

    if (object === undefined) {
      return undefined;
    }
    if (object === null) {
      return null;
    }

    if (!type) {
      return object;
    }
    if (!(typeof type === "string") && !(type instanceof String)) {
      throw new Error("Type must be a string");
    }

    //noinspection FallthroughInSwitchStatementJS
    switch (type) {
      case "boolean":
      case "Boolean":
        return Boolean(object);

      case "number":
      case "Number":
        if (util.isString(object) && !isNaN(Date.parse(object))) {
          return moment__default['default'](object).valueOf();
        } else {
          // @TODO: I don't think that Number and String constructors are a good idea.
          // This could also fail if the object doesn't have valueOf method or if it's redefined.
          // For example: Object.create(null) or { valueOf: 7 }.
          return Number(object.valueOf());
        }
      case "string":
      case "String":
        return String(object);

      case "Date":
        try {
          return convert(object, "Moment").toDate();
        }
        catch(e){
          if (e instanceof TypeError) {
            throw new TypeError(
              "Cannot convert object of type " + util.getType(object) + " to type " + type
            );
          } else {
            throw e;
          }
        }

      case "Moment":
        if (util.isNumber(object)) {
          return moment__default['default'](object);
        }
        if (object instanceof Date) {
          return moment__default['default'](object.valueOf());
        } else if (moment__default['default'].isMoment(object)) {
          return moment__default['default'](object);
        }
        if (util.isString(object)) {
          match = ASPDateRegex.exec(object);
          if (match) {
            // object is an ASP date
            return moment__default['default'](Number(match[1])); // parse number
          }
          match = NumericRegex.exec(object);

          if (match) {
            return moment__default['default'](Number(object));
          }

          return moment__default['default'](object); // parse string
        } else {
          throw new TypeError(
            "Cannot convert object of type " + util.getType(object) + " to type " + type
          );
        }

      case "ISODate":
        if (util.isNumber(object)) {
          return new Date(object);
        } else if (object instanceof Date) {
          return object.toISOString();
        } else if (moment__default['default'].isMoment(object)) {
          return object.toDate().toISOString();
        } else if (util.isString(object)) {
          match = ASPDateRegex.exec(object);
          if (match) {
            // object is an ASP date
            return new Date(Number(match[1])).toISOString(); // parse number
          } else {
            return moment__default['default'](object).format(); // ISO 8601
          }
        } else {
          throw new Error(
            "Cannot convert object of type " +
              util.getType(object) +
              " to type ISODate"
          );
        }

      case "ASPDate":
        if (util.isNumber(object)) {
          return "/Date(" + object + ")/";
        } else if (object instanceof Date || moment__default['default'].isMoment(object)) {
          return "/Date(" + object.valueOf() + ")/";
        } else if (util.isString(object)) {
          match = ASPDateRegex.exec(object);
          let value;
          if (match) {
            // object is an ASP date
            value = new Date(Number(match[1])).valueOf(); // parse number
          } else {
            value = new Date(object).valueOf(); // parse string
          }
          return "/Date(" + value + ")/";
        } else {
          throw new Error(
            "Cannot convert object of type " +
              util.getType(object) +
              " to type ASPDate"
          );
        }

      default:
        throw new Error(`Unknown type ${type}`);
    }
  }

  /**
   * Create a Data Set like wrapper to seamlessly coerce data types.
   *
   * @param rawDS - The Data Set with raw uncoerced data.
   * @param type - A record assigning a data type to property name.
   *
   * @remarks
   * The write operations (`add`, `remove`, `update` and `updateOnly`) write into
   * the raw (uncoerced) data set. These values are then picked up by a pipe
   * which coerces the values using the [[convert]] function and feeds them into
   * the coerced data set. When querying (`forEach`, `get`, `getIds`, `off` and
   * `on`) the values are then fetched from the coerced data set and already have
   * the required data types. The values are coerced only once when inserted and
   * then the same value is returned each time until it is updated or deleted.
   *
   * For example: `typeCoercedDataSet.add({ id: 7, start: "2020-01-21" })` would
   * result in `typeCoercedDataSet.get(7)` returning `{ id: 7, start: moment(new
   * Date("2020-01-21")).toDate() }`.
   *
   * Use the dispose method prior to throwing a reference to this away. Otherwise
   * the pipe connecting the two Data Sets will keep the unaccessible coerced
   * Data Set alive and updated as long as the raw Data Set exists.
   *
   * @returns A Data Set like object that saves data into the raw Data Set and
   * retrieves them from the coerced Data Set.
   */
  function typeCoerceDataSet(
    rawDS,
    type = { start: "Date", end: "Date" }
  ) {
    const idProp = rawDS._idProp;
    const coercedDS = new esnext.DataSet({ fieldId: idProp });

    const pipe = esnext.createNewDataPipeFrom(rawDS)
      .map(item =>
        Object.keys(item).reduce((acc, key) => {
          acc[key] = convert(item[key], type[key]);
          return acc;
        }, {})
      )
      .to(coercedDS);

    pipe.all().start();

    return {
      // Write only.
      add: (...args) => rawDS.getDataSet().add(...args),
      remove: (...args) => rawDS.getDataSet().remove(...args),
      update: (...args) => rawDS.getDataSet().update(...args),
      updateOnly: (...args) => rawDS.getDataSet().updateOnly(...args),
      clear : (...args) => rawDS.getDataSet().clear(...args),

      // Read only.
      forEach: coercedDS.forEach.bind(coercedDS),
      get: coercedDS.get.bind(coercedDS),
      getIds: coercedDS.getIds.bind(coercedDS),
      off: coercedDS.off.bind(coercedDS),
      on: coercedDS.on.bind(coercedDS),

      get length() {
        return coercedDS.length;
      },

      // Non standard.
      idProp,
      type,

      rawDS,
      coercedDS,
      dispose: () => pipe.stop()
    };
  }

  // Configure XSS protection
  const setupXSSCleaner = (options) => {
    const customXSS = new xssFilter__default['default'].FilterXSS(options);
    return (string) => customXSS.process(string);
  };
  const setupNoOpCleaner = (string) => string;

  // when nothing else is configured: filter XSS with the lib's default options
  let configuredXSSProtection = setupXSSCleaner();

  const setupXSSProtection = (options) => {
    // No options? Do nothing.
    if (!options) {
      return;
    }

    // Disable XSS protection completely on request
    if (options.disabled === true) {
      configuredXSSProtection = setupNoOpCleaner;
      console.warn('You disabled XSS protection for vis-Timeline. I sure hope you know what you\'re doing!');
    } else {
      // Configure XSS protection with some custom options.
      // For a list of valid options check the lib's documentation:
      // https://github.com/leizongmin/js-xss#custom-filter-rules
      if (options.filterOptions) {
        configuredXSSProtection = setupXSSCleaner(options.filterOptions);
      }
    }
  };

  const availableUtils = {
    ...util__namespace,
    convert,
    setupXSSProtection
  };

  Object.defineProperty(availableUtils, 'xss', {
    get: function() {
      return configuredXSSProtection;
    }
  });

  /** Prototype for visual components */
  class Component {
    /**
   * @param {{dom: Object, domProps: Object, emitter: Emitter, range: Range}} [body]
   * @param {Object} [options]
   */
    constructor(body, options) {  // eslint-disable-line no-unused-vars
      this.options = null;
      this.props = null;
    }

    /**
     * Set options for the component. The new options will be merged into the
     * current options.
     * @param {Object} options
     */
    setOptions(options) {
      if (options) {
        availableUtils.extend(this.options, options);
      }
    }

    /**
     * Repaint the component
     * @return {boolean} Returns true if the component is resized
     */
    redraw() {
      // should be implemented by the component
      return false;
    }

    /**
     * Destroy the component. Cleanup DOM and event listeners
     */
    destroy() {
      // should be implemented by the component
    }

    /**
     * Test whether the component is resized since the last time _isResized() was
     * called.
     * @return {Boolean} Returns true if the component is resized
     * @protected
     */
    _isResized() {
      const resized = (
        this.props._previousWidth !== this.props.width ||
        this.props._previousHeight !== this.props.height
      );

      this.props._previousWidth = this.props.width;
      this.props._previousHeight = this.props.height;

      return resized;
    }
  }

  /**
   * used in Core to convert the options into a volatile variable
   * 
   * @param {function} moment
   * @param {Object} body
   * @param {Array | Object} hiddenDates
   * @returns {number}
   */
  function convertHiddenOptions(moment, body, hiddenDates) {
    if (hiddenDates && !Array.isArray(hiddenDates)) {
      return convertHiddenOptions(moment, body, [hiddenDates])
    }

    body.hiddenDates = [];
    if (hiddenDates) {
      if (Array.isArray(hiddenDates) == true) {
        for (let i = 0; i < hiddenDates.length; i++) {
          if (hiddenDates[i].repeat === undefined) {
            const dateItem = {};
            dateItem.start = moment(hiddenDates[i].start).toDate().valueOf();
            dateItem.end = moment(hiddenDates[i].end).toDate().valueOf();
            body.hiddenDates.push(dateItem);
          }
        }
        body.hiddenDates.sort((a, b) => a.start - b.start); // sort by start time
      }
    }
  }

  /**
   * create new entrees for the repeating hidden dates
   *
   * @param {function} moment
   * @param {Object} body
   * @param {Array | Object} hiddenDates
   * @returns {null}
   */
  function updateHiddenDates(moment, body, hiddenDates) {
    if (hiddenDates && !Array.isArray(hiddenDates)) {
      return updateHiddenDates(moment, body, [hiddenDates])
    }

    if (hiddenDates && body.domProps.centerContainer.width !== undefined) {
      convertHiddenOptions(moment, body, hiddenDates);

      const start = moment(body.range.start);
      const end = moment(body.range.end);

      const totalRange = (body.range.end - body.range.start);
      const pixelTime = totalRange / body.domProps.centerContainer.width;

      for (let i = 0; i < hiddenDates.length; i++) {
        if (hiddenDates[i].repeat !== undefined) {
          const startDate = moment(hiddenDates[i].start);
          let endDate = moment(hiddenDates[i].end);

          if (startDate._d == "Invalid Date") {
            throw new Error(`Supplied start date is not valid: ${hiddenDates[i].start}`);
          }
          if (endDate._d == "Invalid Date") {
            throw new Error(`Supplied end date is not valid: ${hiddenDates[i].end}`);
          }

          const duration = endDate - startDate;
          if (duration >= 4 * pixelTime) {

            let offset = 0;
            const runUntil = end.clone();
            switch (hiddenDates[i].repeat) {
              case "daily": // case of time
                if (startDate.day() != endDate.day()) {
                  offset = 1;
                }
                startDate.dayOfYear(start.dayOfYear());
                startDate.year(start.year());
                startDate.subtract(7,'days');

                endDate.dayOfYear(start.dayOfYear());
                endDate.year(start.year());
                endDate.subtract(7 - offset,'days');

                runUntil.add(1, 'weeks');
                break;
              case "weekly": {
                const dayOffset = endDate.diff(startDate,'days');
                const day = startDate.day();

                // set the start date to the range.start
                startDate.date(start.date());
                startDate.month(start.month());
                startDate.year(start.year());
                endDate = startDate.clone();

                // force
                startDate.day(day);
                endDate.day(day);
                endDate.add(dayOffset,'days');

                startDate.subtract(1,'weeks');
                endDate.subtract(1,'weeks');

                runUntil.add(1, 'weeks');
                break;
              }
              case "monthly":
                if (startDate.month() != endDate.month()) {
                  offset = 1;
                }
                startDate.month(start.month());
                startDate.year(start.year());
                startDate.subtract(1,'months');

                endDate.month(start.month());
                endDate.year(start.year());
                endDate.subtract(1,'months');
                endDate.add(offset,'months');

                runUntil.add(1, 'months');
                break;
              case "yearly":
                if (startDate.year() != endDate.year()) {
                  offset = 1;
                }
                startDate.year(start.year());
                startDate.subtract(1,'years');
                endDate.year(start.year());
                endDate.subtract(1,'years');
                endDate.add(offset,'years');

                runUntil.add(1, 'years');
                break;
              default:
                console.log("Wrong repeat format, allowed are: daily, weekly, monthly, yearly. Given:", hiddenDates[i].repeat);
                return;
            }
            while (startDate < runUntil) {
              body.hiddenDates.push({start: startDate.valueOf(), end: endDate.valueOf()});
              switch (hiddenDates[i].repeat) {
                case "daily":
                  startDate.add(1, 'days');
                  endDate.add(1, 'days');
                  break;
                case "weekly":
                  startDate.add(1, 'weeks');
                  endDate.add(1, 'weeks');
                  break;
                case "monthly":
                  startDate.add(1, 'months');
                  endDate.add(1, 'months');
                  break;
                case "yearly":
                  startDate.add(1, 'y');
                  endDate.add(1, 'y');
                  break;
                default:
                  console.log("Wrong repeat format, allowed are: daily, weekly, monthly, yearly. Given:", hiddenDates[i].repeat);
                  return;
              }
            }
            body.hiddenDates.push({start: startDate.valueOf(), end: endDate.valueOf()});
          }
        }
      }
      // remove duplicates, merge where possible
      removeDuplicates(body);
      // ensure the new positions are not on hidden dates
      const startHidden = getIsHidden(body.range.start, body.hiddenDates);
      const endHidden = getIsHidden(body.range.end,body.hiddenDates);
      let rangeStart = body.range.start;
      let rangeEnd = body.range.end;
      if (startHidden.hidden == true) {rangeStart = body.range.startToFront == true ? startHidden.startDate - 1 : startHidden.endDate + 1;}
      if (endHidden.hidden == true)   {rangeEnd   = body.range.endToFront == true ?   endHidden.startDate - 1   : endHidden.endDate + 1;}
      if (startHidden.hidden == true || endHidden.hidden == true) {
        body.range._applyRange(rangeStart, rangeEnd);
      }
    }

  }

  /**
   * remove duplicates from the hidden dates list. Duplicates are evil. They mess everything up.
   * Scales with N^2
   *
   * @param {Object} body
   */
  function removeDuplicates(body) {
    const hiddenDates = body.hiddenDates;
    const safeDates = [];
    for (var i = 0; i < hiddenDates.length; i++) {
      for (let j = 0; j < hiddenDates.length; j++) {
        if (i != j && hiddenDates[j].remove != true && hiddenDates[i].remove != true) {
          // j inside i
          if (hiddenDates[j].start >= hiddenDates[i].start && hiddenDates[j].end <= hiddenDates[i].end) {
            hiddenDates[j].remove = true;
          }
          // j start inside i
          else if (hiddenDates[j].start >= hiddenDates[i].start && hiddenDates[j].start <= hiddenDates[i].end) {
            hiddenDates[i].end = hiddenDates[j].end;
            hiddenDates[j].remove = true;
          }
          // j end inside i
          else if (hiddenDates[j].end >= hiddenDates[i].start && hiddenDates[j].end <= hiddenDates[i].end) {
            hiddenDates[i].start = hiddenDates[j].start;
            hiddenDates[j].remove = true;
          }
        }
      }
    }

    for (i = 0; i < hiddenDates.length; i++) {
      if (hiddenDates[i].remove !== true) {
        safeDates.push(hiddenDates[i]);
      }
    }

    body.hiddenDates = safeDates;
    body.hiddenDates.sort((a, b) => a.start - b.start); // sort by start time
  }

  /**
   * Prints dates to console
   * @param {array} dates
   */
  function printDates(dates) {
    for (let i =0; i < dates.length; i++) {
      console.log(i, new Date(dates[i].start),new Date(dates[i].end), dates[i].start, dates[i].end, dates[i].remove);
    }
  }

  /**
   * Used in TimeStep to avoid the hidden times.
   * @param {function} moment
   * @param {TimeStep} timeStep
   * @param {Date} previousTime
   */
  function stepOverHiddenDates(moment, timeStep, previousTime) {
    let stepInHidden = false;
    const currentValue = timeStep.current.valueOf();
    for (let i = 0; i < timeStep.hiddenDates.length; i++) {
      const startDate = timeStep.hiddenDates[i].start;
      var endDate = timeStep.hiddenDates[i].end;
      if (currentValue >= startDate && currentValue < endDate) {
        stepInHidden = true;
        break;
      }
    }

    if (stepInHidden == true && currentValue < timeStep._end.valueOf() && currentValue != previousTime) {
      const prevValue = moment(previousTime);
      const newValue = moment(endDate);
      //check if the next step should be major
      if (prevValue.year() != newValue.year()) {timeStep.switchedYear = true;}
      else if (prevValue.month() != newValue.month()) {timeStep.switchedMonth = true;}
      else if (prevValue.dayOfYear() != newValue.dayOfYear()) {timeStep.switchedDay = true;}

      timeStep.current = newValue;
    }
  }

  ///**
  // * Used in TimeStep to avoid the hidden times.
  // * @param timeStep
  // * @param previousTime
  // */
  //checkFirstStep = function(timeStep) {
  //  var stepInHidden = false;
  //  var currentValue = timeStep.current.valueOf();
  //  for (var i = 0; i < timeStep.hiddenDates.length; i++) {
  //    var startDate = timeStep.hiddenDates[i].start;
  //    var endDate = timeStep.hiddenDates[i].end;
  //    if (currentValue >= startDate && currentValue < endDate) {
  //      stepInHidden = true;
  //      break;
  //    }
  //  }
  //
  //  if (stepInHidden == true && currentValue <= timeStep._end.valueOf()) {
  //    var newValue = moment(endDate);
  //    timeStep.current = newValue.toDate();
  //  }
  //};

  /**
   * replaces the Core toScreen methods
   *
   * @param {timeline.Core} Core
   * @param {Date} time
   * @param {number} width
   * @returns {number}
   */
  function toScreen(Core, time, width) {
    let conversion;
    if (Core.body.hiddenDates.length == 0) {
        conversion = Core.range.conversion(width);
        return (time.valueOf() - conversion.offset) * conversion.scale;
      } else {
        const hidden = getIsHidden(time, Core.body.hiddenDates);
        if (hidden.hidden == true) {
          time = hidden.startDate;
        }

        const duration = getHiddenDurationBetween(Core.body.hiddenDates, Core.range.start, Core.range.end);
        if (time < Core.range.start) {
          conversion = Core.range.conversion(width, duration);
          const hiddenBeforeStart = getHiddenDurationBeforeStart(Core.body.hiddenDates, time, conversion.offset);
          time = Core.options.moment(time).toDate().valueOf();
          time = time + hiddenBeforeStart;
          return -(conversion.offset - time.valueOf()) * conversion.scale;
          
        } else if (time > Core.range.end) {
          const rangeAfterEnd = {start: Core.range.start, end: time};
          time = correctTimeForHidden(Core.options.moment, Core.body.hiddenDates, rangeAfterEnd, time);
          conversion = Core.range.conversion(width, duration);
          return (time.valueOf() - conversion.offset) * conversion.scale;

        } else {
          time = correctTimeForHidden(Core.options.moment, Core.body.hiddenDates, Core.range, time);
          conversion = Core.range.conversion(width, duration);
          return (time.valueOf() - conversion.offset) * conversion.scale;
        }
      }
    }

  /**
   * Replaces the core toTime methods
   *
   * @param {timeline.Core} Core
   * @param {number} x
   * @param {number} width
   * @returns {Date}
   */
  function toTime(Core, x, width) {
    if (Core.body.hiddenDates.length == 0) {
      const conversion = Core.range.conversion(width);
      return new Date(x / conversion.scale + conversion.offset);
    }
    else {
      const hiddenDuration = getHiddenDurationBetween(Core.body.hiddenDates, Core.range.start, Core.range.end);
      const totalDuration = Core.range.end - Core.range.start - hiddenDuration;
      const partialDuration = totalDuration * x / width;
      const accumulatedHiddenDuration = getAccumulatedHiddenDuration(Core.body.hiddenDates, Core.range, partialDuration);

      return new Date(accumulatedHiddenDuration + partialDuration + Core.range.start);
    }
  }

  /**
   * Support function
   *
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {number} start
   * @param {number} end
   * @returns {number}
   */
  function getHiddenDurationBetween(hiddenDates, start, end) {
    let duration = 0;
    for (let i = 0; i < hiddenDates.length; i++) {
      const startDate = hiddenDates[i].start;
      const endDate = hiddenDates[i].end;
      // if time after the cutout, and the
      if (startDate >= start && endDate < end) {
        duration += endDate - startDate;
      }
    }
    return duration;
  }

  /**
   * Support function
   *
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {number} start
   * @param {number} end
   * @returns {number}
   */
  function getHiddenDurationBeforeStart(hiddenDates, start, end) {
    let duration = 0;
    for (let i = 0; i < hiddenDates.length; i++) {
      const startDate = hiddenDates[i].start;
      const endDate = hiddenDates[i].end;

      if (startDate >= start && endDate <= end) {
        duration += endDate - startDate;
      }
    }
    return duration;
  }

  /**
   * Support function
   * @param {function} moment
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {{start: number, end: number}} range
   * @param {Date} time
   * @returns {number}
   */
  function correctTimeForHidden(moment, hiddenDates, range, time) {
    time = moment(time).toDate().valueOf();
    time -= getHiddenDurationBefore(moment, hiddenDates,range,time);
    return time;
  }

  /**
   * Support function
   * @param {function} moment
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {{start: number, end: number}} range
   * @param {Date} time
   * @returns {number}
   */
  function getHiddenDurationBefore(moment, hiddenDates, range, time) {
    let timeOffset = 0;
    time = moment(time).toDate().valueOf();

    for (let i = 0; i < hiddenDates.length; i++) {
      const startDate = hiddenDates[i].start;
      const endDate = hiddenDates[i].end;
      // if time after the cutout, and the
      if (startDate >= range.start && endDate < range.end) {
        if (time >= endDate) {
          timeOffset += (endDate - startDate);
        }
      }
    }
    return timeOffset;
  }

  /**
   * sum the duration from start to finish, including the hidden duration,
   * until the required amount has been reached, return the accumulated hidden duration
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {{start: number, end: number}} range
   * @param {number} [requiredDuration=0]
   * @returns {number}
   */
  function getAccumulatedHiddenDuration(hiddenDates, range, requiredDuration) {
    let hiddenDuration = 0;
    let duration = 0;
    let previousPoint = range.start;
    //printDates(hiddenDates)
    for (let i = 0; i < hiddenDates.length; i++) {
      const startDate = hiddenDates[i].start;
      const endDate = hiddenDates[i].end;
      // if time after the cutout, and the
      if (startDate >= range.start && endDate < range.end) {
        duration += startDate - previousPoint;
        previousPoint = endDate;
        if (duration >= requiredDuration) {
          break;
        }
        else {
          hiddenDuration += endDate - startDate;
        }
      }
    }

    return hiddenDuration;
  }

  /**
   * used to step over to either side of a hidden block. Correction is disabled on tablets, might be set to true
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @param {Date} time
   * @param {number} direction
   * @param {boolean} correctionEnabled
   * @returns {Date|number}
   */
  function snapAwayFromHidden(hiddenDates, time, direction, correctionEnabled) {
    const isHidden = getIsHidden(time, hiddenDates);
    if (isHidden.hidden == true) {
      if (direction < 0) {
        if (correctionEnabled == true) {
          return isHidden.startDate - (isHidden.endDate - time) - 1;
        }
        else {
          return isHidden.startDate - 1;
        }
      }
      else {
        if (correctionEnabled == true) {
          return isHidden.endDate + (time - isHidden.startDate) + 1;
        }
        else {
          return isHidden.endDate + 1;
        }
      }
    }
    else {
      return time;
    }

  }

  /**
   * Check if a time is hidden
   *
   * @param {Date} time
   * @param {Array.<{start: Window.start, end: *}>} hiddenDates
   * @returns {{hidden: boolean, startDate: Window.start, endDate: *}}
   */
  function getIsHidden(time, hiddenDates) {
    for (let i = 0; i < hiddenDates.length; i++) {
      var startDate = hiddenDates[i].start;
      var endDate = hiddenDates[i].end;

      if (time >= startDate && time < endDate) { // if the start is entering a hidden zone
        return {hidden: true, startDate, endDate};
      }
    }
    return {hidden: false, startDate, endDate};
  }

  var DateUtil = /*#__PURE__*/Object.freeze({
    __proto__: null,
    convertHiddenOptions: convertHiddenOptions,
    updateHiddenDates: updateHiddenDates,
    removeDuplicates: removeDuplicates,
    printDates: printDates,
    stepOverHiddenDates: stepOverHiddenDates,
    toScreen: toScreen,
    toTime: toTime,
    getHiddenDurationBetween: getHiddenDurationBetween,
    getHiddenDurationBeforeStart: getHiddenDurationBeforeStart,
    correctTimeForHidden: correctTimeForHidden,
    getHiddenDurationBefore: getHiddenDurationBefore,
    getAccumulatedHiddenDuration: getAccumulatedHiddenDuration,
    snapAwayFromHidden: snapAwayFromHidden,
    getIsHidden: getIsHidden
  });

  /**
   * A Range controls a numeric range with a start and end value.
   * The Range adjusts the range based on mouse events or programmatic changes,
   * and triggers events when the range is changing or has been changed.
   */
  class Range extends Component {
    /**
   * @param {{dom: Object, domProps: Object, emitter: Emitter}} body
   * @param {Object} [options]    See description at Range.setOptions
   * @constructor Range
   * @extends Component
   */
    constructor(body, options) {
      super();
      const now = moment$2().hours(0).minutes(0).seconds(0).milliseconds(0);
      const start = now.clone().add(-3, 'days').valueOf();
      const end = now.clone().add(3, 'days').valueOf(); 
      this.millisecondsPerPixelCache = undefined;
      
      if(options === undefined) {
        this.start = start;
        this.end = end;
      } else {
        this.start = options.start || start;
        this.end = options.end || end;
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
        moment: moment$2,
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
      this.options = availableUtils.extend({}, this.defaultOptions);
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
        availableUtils.selectiveExtend(fields, this.options, options);

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
        const t = availableUtils.convert(new Date(), 'Date').valueOf();
        const rollingModeOffset = me.options.rollingMode && me.options.rollingMode.offset || 0.5;

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
      const finalStart = start != undefined ? availableUtils.convert(start, 'Date').valueOf() : null;
      const finalEnd   = end != undefined   ? availableUtils.convert(end, 'Date').valueOf()   : null;
      this._cancelAnimation();
      this.millisecondsPerPixelCache = undefined;

      if (options.animation) { // true or an Object
        const initStart = this.start;
        const initEnd = this.end;
        const duration = (typeof options.animation === 'object' && 'duration' in options.animation) ? options.animation.duration : 500;
        const easingName = (typeof options.animation === 'object' && 'easingFunction' in options.animation) ? options.animation.easingFunction : 'easeInOutQuad';
        const easingFunction = availableUtils.easingFunctions[easingName];
        if (!easingFunction) {
          throw new Error(`Unknown easing function ${JSON.stringify(easingName)}. Choose from: ${Object.keys(availableUtils.easingFunctions).join(', ')}`);
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
            updateHiddenDates(me.options.moment, me.body, me.options.hiddenDates);
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
        updateHiddenDates(this.options.moment, this.body, this.options.hiddenDates);
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
      let newStart = (start != null) ? availableUtils.convert(start, 'Date').valueOf() : this.start;
      let newEnd   = (end != null)   ? availableUtils.convert(end, 'Date').valueOf()   : this.end;
      const max = (this.options.max != null) ? availableUtils.convert(this.options.max, 'Date').valueOf() : null;
      const min = (this.options.min != null) ? availableUtils.convert(this.options.min, 'Date').valueOf() : null;
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
      const duration = getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
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
      const safeStart = snapAwayFromHidden(this.body.hiddenDates, newStart, this.previousDelta-delta, true);
      const safeEnd = snapAwayFromHidden(this.body.hiddenDates, newEnd, this.previousDelta-delta, true);
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
      availableUtils.preventDefault(event);
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
      availableUtils.preventDefault(event);

      this.props.touch.allowDragging = false;

      if (!this.props.touch.center) {
        this.props.touch.center = this.getPointer(event.center, this.body.dom.center);
        this.props.touch.centerDate = this._pointerToDate(this.props.touch.center);
      }

      this.stopRolling();
      const scale = 1 / (event.scale + this.scaleOffset);
      const centerDate = this.props.touch.centerDate;

      const hiddenDuration = getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
      const hiddenDurationBefore = getHiddenDurationBefore(this.options.moment, this.body.hiddenDates, this, centerDate);
      const hiddenDurationAfter = hiddenDuration - hiddenDurationBefore;

      // calculate new start and end
      let newStart = (centerDate - hiddenDurationBefore) + (this.props.touch.start - (centerDate - hiddenDurationBefore)) * scale;
      let newEnd = (centerDate + hiddenDurationAfter) + (this.props.touch.end - (centerDate + hiddenDurationAfter)) * scale;

      // snapping times away from hidden zones
      this.startToFront = 1 - scale <= 0; // used to do the right auto correction with periodic hidden times
      this.endToFront = scale - 1 <= 0;   // used to do the right auto correction with periodic hidden times
      
      const safeStart = snapAwayFromHidden(this.body.hiddenDates, newStart, 1 - scale, true);
      const safeEnd = snapAwayFromHidden(this.body.hiddenDates, newEnd, scale - 1, true);
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

      const hiddenDuration = getHiddenDurationBetween(this.body.hiddenDates, this.start, this.end);
      const hiddenDurationBefore = getHiddenDurationBefore(this.options.moment, this.body.hiddenDates, this, center);
      const hiddenDurationAfter = hiddenDuration - hiddenDurationBefore;

      // calculate new start and end
      let newStart = (center-hiddenDurationBefore) + (this.start - (center-hiddenDurationBefore)) * scale;
      let newEnd   = (center+hiddenDurationAfter) + (this.end - (center+hiddenDurationAfter)) * scale;

      // snapping times away from hidden zones
      this.startToFront = delta > 0 ? false : true; // used to do the right autocorrection with periodic hidden times
      this.endToFront = -delta  > 0 ? false : true; // used to do the right autocorrection with periodic hidden times
      const safeStart = snapAwayFromHidden(this.body.hiddenDates, newStart, delta, true);
      const safeEnd = snapAwayFromHidden(this.body.hiddenDates, newEnd, -delta, true);
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

  /**
   * Setup a mock hammer.js object, for unit testing.
   *
   * Inspiration: https://github.com/uber/deck.gl/pull/658
   *
   * @returns {{on: noop, off: noop, destroy: noop, emit: noop, get: get}}
   */
  function hammerMock() {
    const noop = () => {};

    return {
      on: noop,
      off: noop,
      destroy: noop,
      emit: noop,

      get(m) {	//eslint-disable-line no-unused-vars
        return {
          set: noop
        };
      }
    };
  }

  let modifiedHammer;

  if (typeof window !== 'undefined') {
    const OurHammer = window['Hammer'] || Hammer__default['default'];
    modifiedHammer = PropagatingHammer__default['default'](OurHammer, {
      preventDefault: 'mouse'
    });
  } else {
    modifiedHammer = () => // hammer.js is only available in a browser, not in node.js. Replacing it with a mock object.
    hammerMock();
  }

  var Hammer = modifiedHammer;

  /**
   * Register a touch event, taking place before a gesture
   * @param {Hammer} hammer       A hammer instance
   * @param {function} callback   Callback, called as callback(event)
   */
  function onTouch (hammer, callback) {
    callback.inputHandler = function (event) {
      if (event.isFirst) {
        callback(event);
      }
    };

    hammer.on('hammer.input', callback.inputHandler);
  }

  /**
   * Register a release event, taking place after a gesture
   * @param {Hammer} hammer       A hammer instance
   * @param {function} callback   Callback, called as callback(event)
   * @returns {*}
   */
  function onRelease (hammer, callback) {
    callback.inputHandler = function (event) {
      if (event.isFinal) {
        callback(event);
      }
    };

    return hammer.on('hammer.input', callback.inputHandler);
  }

  /**
   * Hack the PinchRecognizer such that it doesn't prevent default behavior
   * for vertical panning.
   *
   * Yeah ... this is quite a hack ... see https://github.com/hammerjs/hammer.js/issues/932
   *
   * @param {Hammer.Pinch} pinchRecognizer
   * @return {Hammer.Pinch} returns the pinchRecognizer
   */
  function disablePreventDefaultVertically (pinchRecognizer) {
    const TOUCH_ACTION_PAN_Y = 'pan-y';

    pinchRecognizer.getTouchAction = function() {
      // default method returns [TOUCH_ACTION_NONE]
      return [TOUCH_ACTION_PAN_Y];
    };

    return pinchRecognizer;
  }

  /**
   * The class TimeStep is an iterator for dates. You provide a start date and an
   * end date. The class itself determines the best scale (step size) based on the
   * provided start Date, end Date, and minimumStep.
   *
   * If minimumStep is provided, the step size is chosen as close as possible
   * to the minimumStep but larger than minimumStep. If minimumStep is not
   * provided, the scale is set to 1 DAY.
   * The minimumStep should correspond with the onscreen size of about 6 characters
   *
   * Alternatively, you can set a scale by hand.
   * After creation, you can initialize the class by executing first(). Then you
   * can iterate from the start date to the end date via next(). You can check if
   * the end date is reached with the function hasNext(). After each step, you can
   * retrieve the current date via getCurrent().
   * The TimeStep has scales ranging from milliseconds, seconds, minutes, hours,
   * days, to years.
   *
   * Version: 1.2
   *
   */
  class TimeStep {
    /**
      * @param {Date} [start]         The start date, for example new Date(2010, 9, 21)
      *                               or new Date(2010, 9, 21, 23, 45, 00)
      * @param {Date} [end]           The end date
      * @param {number} [minimumStep] Optional. Minimum step size in milliseconds
      * @param {Date|Array.<Date>} [hiddenDates] Optional.
      * @param {{showMajorLabels: boolean, showWeekScale: boolean}} [options] Optional.
      * @constructor  TimeStep
      */
    constructor(start, end, minimumStep, hiddenDates, options) {
      this.moment = (options && options.moment) || moment$2;
      this.options = options ? options : {};

      // variables
      this.current = this.moment();
      this._start = this.moment();
      this._end = this.moment();

      this.autoScale  = true;
      this.scale = 'day';
      this.step = 1;

      // initialize the range
      this.setRange(start, end, minimumStep);

      // hidden Dates options
      this.switchedDay = false;
      this.switchedMonth = false;
      this.switchedYear = false;
      if (Array.isArray(hiddenDates)) {
        this.hiddenDates = hiddenDates;
      }
      else if (hiddenDates != undefined) {
        this.hiddenDates = [hiddenDates];
      }
      else {
        this.hiddenDates = [];
      }

      this.format = TimeStep.FORMAT; // default formatting
    }

    /**
     * Set custom constructor function for moment. Can be used to set dates
     * to UTC or to set a utcOffset.
     * @param {function} moment
     */
    setMoment(moment) {
      this.moment = moment;

      // update the date properties, can have a new utcOffset
      this.current = this.moment(this.current.valueOf());
      this._start = this.moment(this._start.valueOf());
      this._end = this.moment(this._end.valueOf());
    }

    /**
     * Set custom formatting for the minor an major labels of the TimeStep.
     * Both `minorLabels` and `majorLabels` are an Object with properties:
     * 'millisecond', 'second', 'minute', 'hour', 'weekday', 'day', 'week', 'month', 'year'.
     * @param {{minorLabels: Object, majorLabels: Object}} format
     */
    setFormat(format) {
      const defaultFormat = availableUtils.deepExtend({}, TimeStep.FORMAT);
      this.format = availableUtils.deepExtend(defaultFormat, format);
    }

    /**
     * Set a new range
     * If minimumStep is provided, the step size is chosen as close as possible
     * to the minimumStep but larger than minimumStep. If minimumStep is not
     * provided, the scale is set to 1 DAY.
     * The minimumStep should correspond with the onscreen size of about 6 characters
     * @param {Date} [start]      The start date and time.
     * @param {Date} [end]        The end date and time.
     * @param {int} [minimumStep] Optional. Minimum step size in milliseconds
     */
    setRange(start, end, minimumStep) {
      if (!(start instanceof Date) || !(end instanceof Date)) {
        throw  "No legal start or end date in method setRange";
      }

      this._start = (start != undefined) ? this.moment(start.valueOf()) : Date.now();
      this._end = (end != undefined) ? this.moment(end.valueOf()) : Date.now();

      if (this.autoScale) {
        this.setMinimumStep(minimumStep);
      }
    }

    /**
     * Set the range iterator to the start date.
     */
    start() {
      this.current = this._start.clone();
      this.roundToMinor();
    }

    /**
     * Round the current date to the first minor date value
     * This must be executed once when the current date is set to start Date
     */
    roundToMinor() {
      // round to floor
      // to prevent year & month scales rounding down to the first day of week we perform this separately
      if (this.scale == 'week') {
        this.current.weekday(0);
      }
      // IMPORTANT: we have no breaks in this switch! (this is no bug)
      // noinspection FallThroughInSwitchStatementJS
      switch (this.scale) {
        case 'year':
          this.current.year(this.step * Math.floor(this.current.year() / this.step));
          this.current.month(0);
        case 'month':        this.current.date(1);          // eslint-disable-line no-fallthrough
        case 'week':                                        // eslint-disable-line no-fallthrough
        case 'day':                                         // eslint-disable-line no-fallthrough
        case 'weekday':      this.current.hours(0);         // eslint-disable-line no-fallthrough
        case 'hour':         this.current.minutes(0);       // eslint-disable-line no-fallthrough
        case 'minute':       this.current.seconds(0);       // eslint-disable-line no-fallthrough
        case 'second':       this.current.milliseconds(0);  // eslint-disable-line no-fallthrough
        //case 'millisecond': // nothing to do for milliseconds
      }

      if (this.step != 1) {
        // round down to the first minor value that is a multiple of the current step size
        let  priorCurrent = this.current.clone();
        switch (this.scale) {        
          case 'millisecond':  this.current.subtract(this.current.milliseconds() % this.step, 'milliseconds');  break;
          case 'second':       this.current.subtract(this.current.seconds() % this.step, 'seconds'); break;
          case 'minute':       this.current.subtract(this.current.minutes() % this.step, 'minutes'); break;
          case 'hour':         this.current.subtract(this.current.hours() % this.step, 'hours'); break;
          case 'weekday':      // intentional fall through
          case 'day':          this.current.subtract((this.current.date() - 1) % this.step, 'day'); break;
          case 'week':         this.current.subtract(this.current.week() % this.step, 'week'); break;
          case 'month':        this.current.subtract(this.current.month() % this.step, 'month');  break;
          case 'year':         this.current.subtract(this.current.year() % this.step, 'year'); break;
        }
        if (!priorCurrent.isSame(this.current)) {
            this.current = this.moment(snapAwayFromHidden(this.hiddenDates, this.current.valueOf(), -1, true));
        }
      }
    }

    /**
     * Check if the there is a next step
     * @return {boolean}  true if the current date has not passed the end date
     */
    hasNext() {
      return (this.current.valueOf() <= this._end.valueOf());
    }

    /**
     * Do the next step
     */
    next() {
      const prev = this.current.valueOf();

      // Two cases, needed to prevent issues with switching daylight savings
      // (end of March and end of October)
      switch (this.scale) {
        case 'millisecond':  this.current.add(this.step, 'millisecond'); break;
        case 'second':       this.current.add(this.step, 'second'); break;
        case 'minute':       this.current.add(this.step, 'minute'); break;
        case 'hour':
          this.current.add(this.step, 'hour');

          if (this.current.month() < 6) {
            this.current.subtract(this.current.hours() % this.step, 'hour');
          } else {
            if (this.current.hours() % this.step !== 0) {
              this.current.add(this.step - this.current.hours() % this.step, 'hour');
            }
          }
          break;
        case 'weekday':      // intentional fall through
        case 'day':          this.current.add(this.step, 'day'); break;
        case 'week':
          if (this.current.weekday() !== 0){ // we had a month break not correlating with a week's start before
            this.current.weekday(0); // switch back to week cycles
            this.current.add(this.step, 'week');
          } else if(this.options.showMajorLabels === false) {
            this.current.add(this.step, 'week'); // the default case
          } else { // first day of the week
            const nextWeek = this.current.clone();
            nextWeek.add(1, 'week');
            if(nextWeek.isSame(this.current, 'month')){ // is the first day of the next week in the same month?
              this.current.add(this.step, 'week'); // the default case
            } else { // inject a step at each first day of the month
              this.current.add(this.step, 'week');
              this.current.date(1);
            }
          }
          break;
        case 'month':        this.current.add(this.step, 'month'); break;
        case 'year':         this.current.add(this.step, 'year'); break;
      }

      if (this.step != 1) {
        // round down to the correct major value
        switch (this.scale) {
          case 'millisecond':  if(this.current.milliseconds() > 0 && this.current.milliseconds() < this.step) this.current.milliseconds(0);  break;
          case 'second':       if(this.current.seconds() > 0 && this.current.seconds() < this.step) this.current.seconds(0);  break;
          case 'minute':       if(this.current.minutes() > 0 && this.current.minutes() < this.step) this.current.minutes(0); break;
          case 'hour':         if(this.current.hours() > 0 && this.current.hours() < this.step) this.current.hours(0);  break;
          case 'weekday':      // intentional fall through
          case 'day':          if(this.current.date() < this.step+1) this.current.date(1); break;
          case 'week':         if(this.current.week() < this.step) this.current.week(1); break; // week numbering starts at 1, not 0
          case 'month':        if(this.current.month() < this.step) this.current.month(0);  break;
        }
      }

      // safety mechanism: if current time is still unchanged, move to the end
      if (this.current.valueOf() == prev) {
        this.current = this._end.clone();
      }

      // Reset switches for year, month and day. Will get set to true where appropriate in DateUtil.stepOverHiddenDates
      this.switchedDay = false;
      this.switchedMonth = false;
      this.switchedYear = false;

      stepOverHiddenDates(this.moment, this, prev);
    }

    /**
     * Get the current datetime
     * @return {Moment}  current The current date
     */
    getCurrent() {
      return this.current.clone();
    }

    /**
     * Set a custom scale. Autoscaling will be disabled.
     * For example setScale('minute', 5) will result
     * in minor steps of 5 minutes, and major steps of an hour.
     *
     * @param {{scale: string, step: number}} params
     *                               An object containing two properties:
     *                               - A string 'scale'. Choose from 'millisecond', 'second',
     *                                 'minute', 'hour', 'weekday', 'day', 'week', 'month', 'year'.
     *                               - A number 'step'. A step size, by default 1.
     *                                 Choose for example 1, 2, 5, or 10.
     */
    setScale(params) {
      if (params && typeof params.scale == 'string') {
        this.scale = params.scale;
        this.step = params.step > 0 ? params.step : 1;
        this.autoScale = false;
      }
    }

    /**
     * Enable or disable autoscaling
     * @param {boolean} enable  If true, autoascaling is set true
     */
    setAutoScale(enable) {
      this.autoScale = enable;
    }

    /**
     * Automatically determine the scale that bests fits the provided minimum step
     * @param {number} [minimumStep]  The minimum step size in milliseconds
     */
    setMinimumStep(minimumStep) {
      if (minimumStep == undefined) {
        return;
      }

      //var b = asc + ds;

      const stepYear       = (1000 * 60 * 60 * 24 * 30 * 12);
      const stepMonth      = (1000 * 60 * 60 * 24 * 30);
      const stepDay        = (1000 * 60 * 60 * 24);
      const stepHour       = (1000 * 60 * 60);
      const stepMinute     = (1000 * 60);
      const stepSecond     = (1000);
      const stepMillisecond= (1);

      // find the smallest step that is larger than the provided minimumStep
      if (stepYear*1000 > minimumStep)        {this.scale = 'year';        this.step = 1000;}
      if (stepYear*500 > minimumStep)         {this.scale = 'year';        this.step = 500;}
      if (stepYear*100 > minimumStep)         {this.scale = 'year';        this.step = 100;}
      if (stepYear*50 > minimumStep)          {this.scale = 'year';        this.step = 50;}
      if (stepYear*10 > minimumStep)          {this.scale = 'year';        this.step = 10;}
      if (stepYear*5 > minimumStep)           {this.scale = 'year';        this.step = 5;}
      if (stepYear > minimumStep)             {this.scale = 'year';        this.step = 1;}
      if (stepMonth*3 > minimumStep)          {this.scale = 'month';       this.step = 3;}
      if (stepMonth > minimumStep)            {this.scale = 'month';       this.step = 1;}
      if (stepDay*7 > minimumStep && this.options.showWeekScale)            {this.scale = 'week';        this.step = 1;}
      if (stepDay*2 > minimumStep)            {this.scale = 'day';         this.step = 2;}
      if (stepDay > minimumStep)              {this.scale = 'day';         this.step = 1;}
      if (stepDay/2 > minimumStep)            {this.scale = 'weekday';     this.step = 1;}
      if (stepHour*4 > minimumStep)           {this.scale = 'hour';        this.step = 4;}
      if (stepHour > minimumStep)             {this.scale = 'hour';        this.step = 1;}
      if (stepMinute*15 > minimumStep)        {this.scale = 'minute';      this.step = 15;}
      if (stepMinute*10 > minimumStep)        {this.scale = 'minute';      this.step = 10;}
      if (stepMinute*5 > minimumStep)         {this.scale = 'minute';      this.step = 5;}
      if (stepMinute > minimumStep)           {this.scale = 'minute';      this.step = 1;}
      if (stepSecond*15 > minimumStep)        {this.scale = 'second';      this.step = 15;}
      if (stepSecond*10 > minimumStep)        {this.scale = 'second';      this.step = 10;}
      if (stepSecond*5 > minimumStep)         {this.scale = 'second';      this.step = 5;}
      if (stepSecond > minimumStep)           {this.scale = 'second';      this.step = 1;}
      if (stepMillisecond*200 > minimumStep)  {this.scale = 'millisecond'; this.step = 200;}
      if (stepMillisecond*100 > minimumStep)  {this.scale = 'millisecond'; this.step = 100;}
      if (stepMillisecond*50 > minimumStep)   {this.scale = 'millisecond'; this.step = 50;}
      if (stepMillisecond*10 > minimumStep)   {this.scale = 'millisecond'; this.step = 10;}
      if (stepMillisecond*5 > minimumStep)    {this.scale = 'millisecond'; this.step = 5;}
      if (stepMillisecond > minimumStep)      {this.scale = 'millisecond'; this.step = 1;}
    }

    /**
     * Snap a date to a rounded value.
     * The snap intervals are dependent on the current scale and step.
     * Static function
     * @param {Date} date    the date to be snapped.
     * @param {string} scale Current scale, can be 'millisecond', 'second',
     *                       'minute', 'hour', 'weekday, 'day', 'week', 'month', 'year'.
     * @param {number} step  Current step (1, 2, 4, 5, ...
     * @return {Date} snappedDate
     */
    static snap(date, scale, step) {
      const clone = moment$2(date);

      if (scale == 'year') {
        const year = clone.year() + Math.round(clone.month() / 12);
        clone.year(Math.round(year / step) * step);
        clone.month(0);
        clone.date(0);
        clone.hours(0);
        clone.minutes(0);
        clone.seconds(0);
        clone.milliseconds(0);
      }
      else if (scale == 'month') {
        if (clone.date() > 15) {
          clone.date(1);
          clone.add(1, 'month');
          // important: first set Date to 1, after that change the month.
        }
        else {
          clone.date(1);
        }

        clone.hours(0);
        clone.minutes(0);
        clone.seconds(0);
        clone.milliseconds(0);
      }
      else if (scale == 'week') {
          if (clone.weekday() > 2) { // doing it the momentjs locale aware way
              clone.weekday(0);
              clone.add(1, 'week');
          }
          else {
              clone.weekday(0);
          }

          clone.hours(0);
          clone.minutes(0);
          clone.seconds(0);
          clone.milliseconds(0);
      }
      else if (scale == 'day') {
        //noinspection FallthroughInSwitchStatementJS
        switch (step) {
          case 5:
          case 2:
            clone.hours(Math.round(clone.hours() / 24) * 24); break;
          default:
            clone.hours(Math.round(clone.hours() / 12) * 12); break;
        }
        clone.minutes(0);
        clone.seconds(0);
        clone.milliseconds(0);
      }
      else if (scale == 'weekday') {
        //noinspection FallthroughInSwitchStatementJS
        switch (step) {
          case 5:
          case 2:
            clone.hours(Math.round(clone.hours() / 12) * 12); break;
          default:
            clone.hours(Math.round(clone.hours() / 6) * 6); break;
        }
        clone.minutes(0);
        clone.seconds(0);
        clone.milliseconds(0);
      }
      else if (scale == 'hour') {
        switch (step) {
          case 4:
            clone.minutes(Math.round(clone.minutes() / 60) * 60); break;
          default:
            clone.minutes(Math.round(clone.minutes() / 30) * 30); break;
        }
        clone.seconds(0);
        clone.milliseconds(0);
      } else if (scale == 'minute') {
        //noinspection FallthroughInSwitchStatementJS
        switch (step) {
          case 15:
          case 10:
            clone.minutes(Math.round(clone.minutes() / 5) * 5);
            clone.seconds(0);
            break;
          case 5:
            clone.seconds(Math.round(clone.seconds() / 60) * 60); break;
          default:
            clone.seconds(Math.round(clone.seconds() / 30) * 30); break;
        }
        clone.milliseconds(0);
      }
      else if (scale == 'second') {
        //noinspection FallthroughInSwitchStatementJS
        switch (step) {
          case 15:
          case 10:
            clone.seconds(Math.round(clone.seconds() / 5) * 5);
            clone.milliseconds(0);
            break;
          case 5:
            clone.milliseconds(Math.round(clone.milliseconds() / 1000) * 1000); break;
          default:
            clone.milliseconds(Math.round(clone.milliseconds() / 500) * 500); break;
        }
      }
      else if (scale == 'millisecond') {
        const _step = step > 5 ? step / 2 : 1;
        clone.milliseconds(Math.round(clone.milliseconds() / _step) * _step);
      }

      return clone;
    }

    /**
     * Check if the current value is a major value (for example when the step
     * is DAY, a major value is each first day of the MONTH)
     * @return {boolean} true if current date is major, else false.
     */
    isMajor() {
      if (this.switchedYear == true) {
        switch (this.scale) {
          case 'year':
          case 'month':
          case 'week':
          case 'weekday':
          case 'day':
          case 'hour':
          case 'minute':
          case 'second':
          case 'millisecond':
            return true;
          default:
            return false;
        }
      }
      else if (this.switchedMonth == true) {
        switch (this.scale) {
          case 'week':
          case 'weekday':
          case 'day':
          case 'hour':
          case 'minute':
          case 'second':
          case 'millisecond':
            return true;
          default:
            return false;
        }
      }
      else if (this.switchedDay == true) {
        switch (this.scale) {
          case 'millisecond':
          case 'second':
          case 'minute':
          case 'hour':
            return true;
          default:
            return false;
        }
      }

      const date = this.moment(this.current);
      switch (this.scale) {
        case 'millisecond':
          return (date.milliseconds() == 0);
        case 'second':
          return (date.seconds() == 0);
        case 'minute':
          return (date.hours() == 0) && (date.minutes() == 0);
        case 'hour':
          return (date.hours() == 0);
        case 'weekday': // intentional fall through
        case 'day':
          return (date.date() == 1);
        case 'week':
          return (date.date() == 1);
        case 'month':
          return (date.month() == 0);
        case 'year':
          return false;
        default:
          return false;
      }
    }

    /**
     * Returns formatted text for the minor axislabel, depending on the current
     * date and the scale. For example when scale is MINUTE, the current time is
     * formatted as "hh:mm".
     * @param {Date} [date=this.current] custom date. if not provided, current date is taken
     * @returns {String}
     */
    getLabelMinor(date) {
      if (date == undefined) {
        date = this.current;
      }
      if (date instanceof Date) {
        date = this.moment(date);
      }

      if (typeof(this.format.minorLabels) === "function") {
        return this.format.minorLabels(date, this.scale, this.step);
      }

      const format = this.format.minorLabels[this.scale];
      // noinspection FallThroughInSwitchStatementJS
      switch (this.scale) {
        case 'week':
          // Don't draw the minor label if this date is the first day of a month AND if it's NOT the start of the week.
          // The 'date' variable may actually be the 'next' step when called from TimeAxis' _repaintLabels.
          if(date.date() === 1 && date.weekday() !== 0){
              return "";
          }
        default: // eslint-disable-line no-fallthrough
          return (format && format.length > 0) ? this.moment(date).format(format) : '';
      }
    }

    /**
     * Returns formatted text for the major axis label, depending on the current
     * date and the scale. For example when scale is MINUTE, the major scale is
     * hours, and the hour will be formatted as "hh".
     * @param {Date} [date=this.current] custom date. if not provided, current date is taken
     * @returns {String}
     */
    getLabelMajor(date) {
      if (date == undefined) {
        date = this.current;
      }
      if (date instanceof Date) {
        date = this.moment(date);
      }

      if (typeof(this.format.majorLabels) === "function") {
        return this.format.majorLabels(date, this.scale, this.step);
      }

      const format = this.format.majorLabels[this.scale];
      return (format && format.length > 0) ? this.moment(date).format(format) : '';
    }

    /**
     * get class name
     * @return {string} class name
     */
    getClassName() {
      const _moment = this.moment;
      const m = this.moment(this.current);
      const current = m.locale ? m.locale('en') : m.lang('en'); // old versions of moment have .lang() function
      const step = this.step;
      const classNames = [];

      /**
       *
       * @param {number} value
       * @returns {String}
       */
      function even(value) {
        return (value / step % 2 == 0) ? ' vis-even' : ' vis-odd';
      }

      /**
       *
       * @param {Date} date
       * @returns {String}
       */
      function today(date) {
        if (date.isSame(Date.now(), 'day')) {
          return ' vis-today';
        }
        if (date.isSame(_moment().add(1, 'day'), 'day')) {
          return ' vis-tomorrow';
        }
        if (date.isSame(_moment().add(-1, 'day'), 'day')) {
          return ' vis-yesterday';
        }
        return '';
      }

      /**
       *
       * @param {Date} date
       * @returns {String}
       */
      function currentWeek(date) {
        return date.isSame(Date.now(), 'week') ? ' vis-current-week' : '';
      }

      /**
       *
       * @param {Date} date
       * @returns {String}
       */
      function currentMonth(date) {
        return date.isSame(Date.now(), 'month') ? ' vis-current-month' : '';
      }

      /**
       *
       * @param {Date} date
       * @returns {String}
       */
      function currentYear(date) {
        return date.isSame(Date.now(), 'year') ? ' vis-current-year' : '';
      }

      switch (this.scale) {
        case 'millisecond':
          classNames.push(today(current));
          classNames.push(even(current.milliseconds()));
          break;
        case 'second':
          classNames.push(today(current));
          classNames.push(even(current.seconds()));
          break;
        case 'minute':
          classNames.push(today(current));
          classNames.push(even(current.minutes()));
          break;
        case 'hour':
          classNames.push(`vis-h${current.hours()}${this.step == 4 ? '-h' + (current.hours() + 4) : ''}`);
          classNames.push(today(current));
          classNames.push(even(current.hours()));
          break;
        case 'weekday':
          classNames.push(`vis-${current.format('dddd').toLowerCase()}`);
          classNames.push(today(current));
          classNames.push(currentWeek(current));
          classNames.push(even(current.date()));
          break;
        case 'day':
          classNames.push(`vis-day${current.date()}`);
          classNames.push(`vis-${current.format('MMMM').toLowerCase()}`);
          classNames.push(today(current));
          classNames.push(currentMonth(current));
          classNames.push(this.step <= 2 ? today(current) : '');
          classNames.push(this.step <= 2 ? `vis-${current.format('dddd').toLowerCase()}` : '');
          classNames.push(even(current.date() - 1));
          break;
        case 'week':
          classNames.push(`vis-week${current.format('w')}`);
          classNames.push(currentWeek(current));
          classNames.push(even(current.week()));
          break;
        case 'month':
          classNames.push(`vis-${current.format('MMMM').toLowerCase()}`);
          classNames.push(currentMonth(current));
          classNames.push(even(current.month()));
          break;
        case 'year':
          classNames.push(`vis-year${current.year()}`);
          classNames.push(currentYear(current));
          classNames.push(even(current.year()));
          break;
      }
      return classNames.filter(String).join(" ");
    }
  }

  // Time formatting
  TimeStep.FORMAT = {
    minorLabels: {
      millisecond:'SSS',
      second:     's',
      minute:     'HH:mm',
      hour:       'HH:mm',
      weekday:    'ddd D',
      day:        'D',
      week:       'w',
      month:      'MMM',
      year:       'YYYY'
    },
    majorLabels: {
      millisecond:'HH:mm:ss',
      second:     'D MMMM HH:mm',
      minute:     'ddd D MMMM',
      hour:       'ddd D MMMM',
      weekday:    'MMMM YYYY',
      day:        'MMMM YYYY',
      week:       'MMMM YYYY',
      month:      'YYYY',
      year:       ''
    }
  };

  /** A horizontal time axis */
  class TimeAxis extends Component {
  /**
   * @param {{dom: Object, domProps: Object, emitter: Emitter, range: Range}} body
   * @param {Object} [options]        See TimeAxis.setOptions for the available
   *                                  options.
   * @constructor TimeAxis
   * @extends Component
   */
    constructor(body, options) {
      super();
      this.dom = {
        foreground: null,
        lines: [],
        majorTexts: [],
        minorTexts: [],
        redundant: {
          lines: [],
          majorTexts: [],
          minorTexts: []
        }
      };
      this.props = {
        range: {
          start: 0,
          end: 0,
          minimumStep: 0
        },
        lineTop: 0
      };

      this.defaultOptions = {
        orientation: {
          axis: 'bottom'
        },  // axis orientation: 'top' or 'bottom'
        showMinorLabels: true,
        showMajorLabels: true,
        showWeekScale: false,
        maxMinorChars: 7,
        format: availableUtils.extend({}, TimeStep.FORMAT),
        moment: moment$2,
        timeAxis: null
      };
      this.options = availableUtils.extend({}, this.defaultOptions);

      this.body = body;

      // create the HTML DOM
      this._create();

      this.setOptions(options);
    }

    /**
     * Set options for the TimeAxis.
     * Parameters will be merged in current options.
     * @param {Object} options  Available options:
     *                          {string} [orientation.axis]
     *                          {boolean} [showMinorLabels]
     *                          {boolean} [showMajorLabels]
     *                          {boolean} [showWeekScale]
     */
    setOptions(options) {
      if (options) {
        // copy all options that we know
        availableUtils.selectiveExtend([
          'showMinorLabels',
          'showMajorLabels',
          'showWeekScale',
          'maxMinorChars',
          'hiddenDates',
          'timeAxis',
          'moment',
          'rtl'
        ], this.options, options);

        // deep copy the format options
        availableUtils.selectiveDeepExtend(['format'], this.options, options);

        if ('orientation' in options) {
          if (typeof options.orientation === 'string') {
            this.options.orientation.axis = options.orientation;
          }
          else if (typeof options.orientation === 'object' && 'axis' in options.orientation) {
            this.options.orientation.axis = options.orientation.axis;
          }
        }

        // apply locale to moment.js
        // TODO: not so nice, this is applied globally to moment.js
        if ('locale' in options) {
          if (typeof moment$2.locale === 'function') {
            // moment.js 2.8.1+
            moment$2.locale(options.locale);
          }
          else {
            moment$2.lang(options.locale);
          }
        }
      }
    }

    /**
     * Create the HTML DOM for the TimeAxis
     */
    _create() {
      this.dom.foreground = document.createElement('div');
      this.dom.background = document.createElement('div');

      this.dom.foreground.className = 'vis-time-axis vis-foreground';
      this.dom.background.className = 'vis-time-axis vis-background';
    }

    /**
     * Destroy the TimeAxis
     */
    destroy() {
      // remove from DOM
      if (this.dom.foreground.parentNode) {
        this.dom.foreground.parentNode.removeChild(this.dom.foreground);
      }
      if (this.dom.background.parentNode) {
        this.dom.background.parentNode.removeChild(this.dom.background);
      }

      this.body = null;
    }

    /**
     * Repaint the component
     * @return {boolean} Returns true if the component is resized
     */
    redraw() {
      const props = this.props;
      const foreground = this.dom.foreground;
      const background = this.dom.background;

      // determine the correct parent DOM element (depending on option orientation)
      const parent = (this.options.orientation.axis == 'top') ? this.body.dom.top : this.body.dom.bottom;
      const parentChanged = (foreground.parentNode !== parent);

      // calculate character width and height
      this._calculateCharSize();

      // TODO: recalculate sizes only needed when parent is resized or options is changed
      const showMinorLabels = this.options.showMinorLabels && this.options.orientation.axis !== 'none';
      const showMajorLabels = this.options.showMajorLabels && this.options.orientation.axis !== 'none';

      // determine the width and height of the elemens for the axis
      props.minorLabelHeight = showMinorLabels ? props.minorCharHeight : 0;
      props.majorLabelHeight = showMajorLabels ? props.majorCharHeight : 0;
      props.height = props.minorLabelHeight + props.majorLabelHeight;
      props.width = foreground.offsetWidth;

      props.minorLineHeight = this.body.domProps.root.height - props.majorLabelHeight -
          (this.options.orientation.axis == 'top' ? this.body.domProps.bottom.height : this.body.domProps.top.height);
      props.minorLineWidth = 1; // TODO: really calculate width
      props.majorLineHeight = props.minorLineHeight + props.majorLabelHeight;
      props.majorLineWidth = 1; // TODO: really calculate width

      //  take foreground and background offline while updating (is almost twice as fast)
      const foregroundNextSibling = foreground.nextSibling;
      const backgroundNextSibling = background.nextSibling;
      foreground.parentNode && foreground.parentNode.removeChild(foreground);
      background.parentNode && background.parentNode.removeChild(background);

      foreground.style.height = `${this.props.height}px`;

      this._repaintLabels();

      // put DOM online again (at the same place)
      if (foregroundNextSibling) {
        parent.insertBefore(foreground, foregroundNextSibling);
      }
      else {
        parent.appendChild(foreground);
      }
      if (backgroundNextSibling) {
        this.body.dom.backgroundVertical.insertBefore(background, backgroundNextSibling);
      }
      else {
        this.body.dom.backgroundVertical.appendChild(background);
      }
      return this._isResized() || parentChanged;
    }

    /**
     * Repaint major and minor text labels and vertical grid lines
     * @private
     */
    _repaintLabels() {
      const orientation = this.options.orientation.axis;

      // calculate range and step (step such that we have space for 7 characters per label)
      const start = availableUtils.convert(this.body.range.start, 'Number');
      const end = availableUtils.convert(this.body.range.end, 'Number');
      const timeLabelsize = this.body.util.toTime((this.props.minorCharWidth || 10) * this.options.maxMinorChars).valueOf();
      let minimumStep = timeLabelsize - getHiddenDurationBefore(this.options.moment, this.body.hiddenDates, this.body.range, timeLabelsize);
      minimumStep -= this.body.util.toTime(0).valueOf();

      const step = new TimeStep(new Date(start), new Date(end), minimumStep, this.body.hiddenDates, this.options);
      step.setMoment(this.options.moment);
      if (this.options.format) {
        step.setFormat(this.options.format);
      }
      if (this.options.timeAxis) {
        step.setScale(this.options.timeAxis);
      }
      this.step = step;

      // Move all DOM elements to a "redundant" list, where they
      // can be picked for re-use, and clear the lists with lines and texts.
      // At the end of the function _repaintLabels, left over elements will be cleaned up
      const dom = this.dom;
      dom.redundant.lines = dom.lines;
      dom.redundant.majorTexts = dom.majorTexts;
      dom.redundant.minorTexts = dom.minorTexts;
      dom.lines = [];
      dom.majorTexts = [];
      dom.minorTexts = [];

      let current;
      let next;
      let x;
      let xNext;
      let isMajor;
      let showMinorGrid;
      let width = 0;
      let prevWidth;
      let line;
      let xFirstMajorLabel = undefined;
      let count = 0;
      const MAX = 1000;
      let className;

      step.start();
      next = step.getCurrent();
      xNext = this.body.util.toScreen(next);
      while (step.hasNext() && count < MAX) {
        count++;

        isMajor = step.isMajor();
        className = step.getClassName();

        current = next;
        x = xNext;

        step.next();
        next = step.getCurrent();
        xNext = this.body.util.toScreen(next);

        prevWidth = width;
        width = xNext - x;
        switch (step.scale) {
          case 'week':         showMinorGrid = true; break;
          default:             showMinorGrid = (width >= prevWidth * 0.4); break; // prevent displaying of the 31th of the month on a scale of 5 days
        }

        if (this.options.showMinorLabels && showMinorGrid) {
          var label = this._repaintMinorText(x, step.getLabelMinor(current), orientation, className);
          label.style.width = `${width}px`; // set width to prevent overflow
        }

        if (isMajor && this.options.showMajorLabels) {
          if (x > 0) {
            if (xFirstMajorLabel == undefined) {
              xFirstMajorLabel = x;
            }
            label = this._repaintMajorText(x, step.getLabelMajor(current), orientation, className);
          }
          line = this._repaintMajorLine(x, width, orientation, className);
        }
        else { // minor line
          if (showMinorGrid) {
            line = this._repaintMinorLine(x, width, orientation, className);
          }
          else {
            if (line) {
              // adjust the width of the previous grid
              line.style.width = `${parseInt(line.style.width) + width}px`;
            }
          }
        }
      }

      if (count === MAX && !warnedForOverflow) {
          console.warn(`Something is wrong with the Timeline scale. Limited drawing of grid lines to ${MAX} lines.`);
          warnedForOverflow = true;
      }

      // create a major label on the left when needed
      if (this.options.showMajorLabels) {
        const leftTime = this.body.util.toTime(0); // upper bound estimation
        const leftText = step.getLabelMajor(leftTime);
        const widthText = leftText.length * (this.props.majorCharWidth || 10) + 10;

        if (xFirstMajorLabel == undefined || widthText < xFirstMajorLabel) {
          this._repaintMajorText(0, leftText, orientation, className);
        }
      }

      // Cleanup leftover DOM elements from the redundant list
      availableUtils.forEach(this.dom.redundant, arr => {
        while (arr.length) {
          const elem = arr.pop();
          if (elem && elem.parentNode) {
            elem.parentNode.removeChild(elem);
          }
        }
      });
    }

    /**
     * Create a minor label for the axis at position x
     * @param {number} x
     * @param {string} text
     * @param {string} orientation   "top" or "bottom" (default)
     * @param {string} className
     * @return {Element} Returns the HTML element of the created label
     * @private
     */
    _repaintMinorText(x, text, orientation, className) {
      // reuse redundant label
      let label = this.dom.redundant.minorTexts.shift();

      if (!label) {
        // create new label
        const content = document.createTextNode('');
        label = document.createElement('div');
        label.appendChild(content);
        this.dom.foreground.appendChild(label);
      }
      this.dom.minorTexts.push(label);
      label.innerHTML = availableUtils.xss(text);


      let y = (orientation == 'top') ? this.props.majorLabelHeight : 0;
      this._setXY(label, x, y);

      label.className = `vis-text vis-minor ${className}`;
      //label.title = title;  // TODO: this is a heavy operation

      return label;
    }

    /**
     * Create a Major label for the axis at position x
     * @param {number} x
     * @param {string} text
     * @param {string} orientation   "top" or "bottom" (default)
     * @param {string} className
     * @return {Element} Returns the HTML element of the created label
     * @private
     */
    _repaintMajorText(x, text, orientation, className) {
      // reuse redundant label
      let label = this.dom.redundant.majorTexts.shift();

      if (!label) {
        // create label
        const content = document.createElement('div');
        label = document.createElement('div');
        label.appendChild(content);
        this.dom.foreground.appendChild(label);
      }

      label.childNodes[0].innerHTML = availableUtils.xss(text);
      label.className = `vis-text vis-major ${className}`;
      //label.title = title; // TODO: this is a heavy operation

      let y = (orientation == 'top') ? 0 : this.props.minorLabelHeight;
      this._setXY(label, x, y);

      this.dom.majorTexts.push(label);
      return label;
    }

    /**
     * sets xy
     * @param {string} label
     * @param {number} x
     * @param {number} y
     * @private
     */
    _setXY(label, x, y) {
      // If rtl is true, inverse x.
      const directionX = this.options.rtl ? (x * -1) : x;
      label.style.transform = `translate(${directionX}px, ${y}px)`;
    }

    /**
     * Create a minor line for the axis at position x
     * @param {number} left
     * @param {number} width
     * @param {string} orientation   "top" or "bottom" (default)
     * @param {string} className
     * @return {Element} Returns the created line
     * @private
     */
    _repaintMinorLine(left, width, orientation, className) {
      // reuse redundant line
      let line = this.dom.redundant.lines.shift();
      if (!line) {
        // create vertical line
        line = document.createElement('div');
        this.dom.background.appendChild(line);
      }
      this.dom.lines.push(line);

      const props = this.props;
      
      line.style.width = `${width}px`;
      line.style.height = `${props.minorLineHeight}px`;

      let y = (orientation == 'top') ? props.majorLabelHeight : this.body.domProps.top.height;
      let x = left - props.minorLineWidth / 2;

      this._setXY(line, x, y);
      line.className = `vis-grid ${this.options.rtl ?  'vis-vertical-rtl' : 'vis-vertical'} vis-minor ${className}`;

      return line;
    }

    /**
     * Create a Major line for the axis at position x
     * @param {number} left
     * @param {number} width
     * @param {string} orientation   "top" or "bottom" (default)
     * @param {string} className
     * @return {Element} Returns the created line
     * @private
     */
    _repaintMajorLine(left, width, orientation, className) {
      // reuse redundant line
      let line = this.dom.redundant.lines.shift();
      if (!line) {
        // create vertical line
        line = document.createElement('div');
        this.dom.background.appendChild(line);
      }
      this.dom.lines.push(line);

      const props = this.props;
      
      line.style.width = `${width}px`;
      line.style.height = `${props.majorLineHeight}px`;

      let y = (orientation == 'top') ? 0 : this.body.domProps.top.height;
      let x = left - props.majorLineWidth / 2;

      this._setXY(line, x, y);
      line.className = `vis-grid ${this.options.rtl ?  'vis-vertical-rtl' : 'vis-vertical'} vis-major ${className}`;

      return line;
    }

    /**
     * Determine the size of text on the axis (both major and minor axis).
     * The size is calculated only once and then cached in this.props.
     * @private
     */
    _calculateCharSize() {
      // Note: We calculate char size with every redraw. Size may change, for
      // example when any of the timelines parents had display:none for example.

      // determine the char width and height on the minor axis
      if (!this.dom.measureCharMinor) {
        this.dom.measureCharMinor = document.createElement('DIV');
        this.dom.measureCharMinor.className = 'vis-text vis-minor vis-measure';
        this.dom.measureCharMinor.style.position = 'absolute';

        this.dom.measureCharMinor.appendChild(document.createTextNode('0'));
        this.dom.foreground.appendChild(this.dom.measureCharMinor);
      }
      this.props.minorCharHeight = this.dom.measureCharMinor.clientHeight;
      this.props.minorCharWidth = this.dom.measureCharMinor.clientWidth;

      // determine the char width and height on the major axis
      if (!this.dom.measureCharMajor) {
        this.dom.measureCharMajor = document.createElement('DIV');
        this.dom.measureCharMajor.className = 'vis-text vis-major vis-measure';
        this.dom.measureCharMajor.style.position = 'absolute';

        this.dom.measureCharMajor.appendChild(document.createTextNode('0'));
        this.dom.foreground.appendChild(this.dom.measureCharMajor);
      }
      this.props.majorCharHeight = this.dom.measureCharMajor.clientHeight;
      this.props.majorCharWidth = this.dom.measureCharMajor.clientWidth;
    }
  }


  var warnedForOverflow = false;

  /**
   * Turn an element into an clickToUse element.
   * When not active, the element has a transparent overlay. When the overlay is
   * clicked, the mode is changed to active.
   * When active, the element is displayed with a blue border around it, and
   * the interactive contents of the element can be used. When clicked outside
   * the element, the elements mode is changed to inactive.
   * @param {Element} container
   * @constructor Activator
   */
  function Activator(container) {
    this.active = false;

    this.dom = {
      container: container
    };

    this.dom.overlay = document.createElement('div');
    this.dom.overlay.className = 'vis-overlay';

    this.dom.container.appendChild(this.dom.overlay);

    this.hammer = Hammer(this.dom.overlay);
    this.hammer.on('tap', this._onTapOverlay.bind(this));

    // block all touch events (except tap)
    var me = this;
    var events = [
      'tap', 'doubletap', 'press',
      'pinch',
      'pan', 'panstart', 'panmove', 'panend'
    ];
    events.forEach(function (event) {
      me.hammer.on(event, function (event) {
        event.stopPropagation();
      });
    });

    // attach a click event to the window, in order to deactivate when clicking outside the timeline
    if (document && document.body) {
      this.onClick = function (event) {
        if (!_hasParent(event.target, container)) {
          me.deactivate();
        }
      };
      document.body.addEventListener('click', this.onClick);
    }

    if (this.keycharm !== undefined) {
      this.keycharm.destroy();
    }
    this.keycharm = keycharm__default['default']();

    // keycharm listener only bounded when active)
    this.escListener = this.deactivate.bind(this);
  }

  // turn into an event emitter
  Emitter__default['default'](Activator.prototype);

  // The currently active activator
  Activator.current = null;

  /**
   * Destroy the activator. Cleans up all created DOM and event listeners
   */
  Activator.prototype.destroy = function () {
    this.deactivate();

    // remove dom
    this.dom.overlay.parentNode.removeChild(this.dom.overlay);

    // remove global event listener
    if (this.onClick) {
      document.body.removeEventListener('click', this.onClick);
    }
    // remove keycharm
    if (this.keycharm !== undefined) {
      this.keycharm.destroy();
    }
    this.keycharm = null;
    // cleanup hammer instances
    this.hammer.destroy();
    this.hammer = null;
    // FIXME: cleaning up hammer instances doesn't work (Timeline not removed from memory)
  };

  /**
   * Activate the element
   * Overlay is hidden, element is decorated with a blue shadow border
   */
  Activator.prototype.activate = function () {
    // we allow only one active activator at a time
    if (Activator.current) {
      Activator.current.deactivate();
    }
    Activator.current = this;

    this.active = true;
    this.dom.overlay.style.display = 'none';
    availableUtils.addClassName(this.dom.container, 'vis-active');

    this.emit('change');
    this.emit('activate');

    // ugly hack: bind ESC after emitting the events, as the Network rebinds all
    // keyboard events on a 'change' event
    this.keycharm.bind('esc', this.escListener);
  };

  /**
   * Deactivate the element
   * Overlay is displayed on top of the element
   */
  Activator.prototype.deactivate = function () {
    if (Activator.current === this) {
      Activator.current = null;
    }

    this.active = false;
    this.dom.overlay.style.display = '';
    availableUtils.removeClassName(this.dom.container, 'vis-active');
    this.keycharm.unbind('esc', this.escListener);

    this.emit('change');
    this.emit('deactivate');
  };

  /**
   * Handle a tap event: activate the container
   * @param {Event}  event   The event
   * @private
   */
  Activator.prototype._onTapOverlay = function (event) {
    // activate the container
    this.activate();
    event.stopPropagation();
  };

  /**
   * Test whether the element has the requested parent element somewhere in
   * its chain of parent nodes.
   * @param {HTMLElement} element
   * @param {HTMLElement} parent
   * @returns {boolean} Returns true when the parent is found somewhere in the
   *                    chain of parent nodes.
   * @private
   */
  function _hasParent(element, parent) {
    while (element) {
      if (element === parent) {
        return true
      }
      element = element.parentNode;
    }
    return false;
  }

  /*
   * IMPORTANT: Locales for Moment has to be imported in the legacy and standalone
   * entry points. For the peer build it's users responsibility to do so.
   */

  // English
  const en = {
    current: 'current',
    time: 'time',
    deleteSelected: 'Delete selected',
  };
  const en_EN = en;
  const en_US = en;

  // Italiano
  const it = {
    current: 'attuale',
    time: 'tempo',
    deleteSelected: 'Cancella la selezione',
  };
  const it_IT = it;
  const it_CH = it;

  // Dutch
  const nl = {
    current: 'huidige',
    time: 'tijd',
    deleteSelected: 'Selectie verwijderen'
  };
  const nl_NL = nl;
  const nl_BE = nl;

  // German
  const de = {
    current: 'Aktuelle',
    time: 'Zeit',
    deleteSelected: 'L\u00f6sche Auswahl',
  };
  const de_DE = de;

  // French
  const fr = {
    current: 'actuel',
    time: 'heure',
    deleteSelected: 'Effacer la selection',
  };
  const fr_FR = fr;
  const fr_CA = fr;
  const fr_BE = fr;

  // Espanol
  const es = {
    current: 'corriente',
    time: 'hora',
    deleteSelected: 'Eliminar selecci\u00f3n',
  };
  const es_ES = es;

  // Ukrainian
  const uk = {
    current: 'поточний',
    time: 'час',
    deleteSelected: 'Видалити обране',
  };
  const uk_UA = uk;

  // Russian
  const ru = {
    current: 'текущее',
    time: 'время',
    deleteSelected: 'Удалить выбранное',
  };
  const ru_RU = ru;

  // Polish
  const pl = {
    current: 'aktualny',
    time: 'czas',
    deleteSelected: 'Usuń wybrane',
  };
  const pl_PL = pl;

  // Portuguese
  const pt = {
    current: 'atual',
    time: 'data',
    deleteSelected: 'Apagar selecionado',
  };
  const pt_BR = pt;
  const pt_PT = pt;

  // Japanese
  const ja = {
    current: '現在',
    time: '時刻',
    deleteSelected: '選択されたものを削除',
  };
  const ja_JP = ja;

  // Swedish
  const sv = {
    current: 'nuvarande',
    time: 'tid',
    deleteSelected: 'Radera valda',
  };
  const sv_SE = sv;

  // Norwegian
  const nb = {
    current: 'nåværende',
    time: 'tid',
    deleteSelected: 'Slett valgte',
  };
  const nb_NO = nb;
  const nn = nb;
  const nn_NO = nb;


  const locales = {
    en,
    en_EN,
    en_US,
    it,
    it_IT,
    it_CH,
    nl,
    nl_NL,
    nl_BE,
    de,
    de_DE,
    fr,
    fr_FR,
    fr_CA,
    fr_BE,
    es,
    es_ES,
    uk,
    uk_UA,
    ru,
    ru_RU,
    pl,
    pl_PL,
    pt,
    pt_BR,
    pt_PT,
    ja,
    ja_JP,
    sv,
    sv_SE,
    nb,
    nn,
    nb_NO,
    nn_NO
  };

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
      super();
      this.body = body;

      // default options
      this.defaultOptions = {
        moment: moment$2,
        locales,
        locale: 'en',
        id: undefined,
        title: undefined
      };
      this.options = availableUtils.extend({}, this.defaultOptions);
      this.setOptions(options);
      this.options.locales = availableUtils.extend({}, locales, this.options.locales);
      const defaultLocales = this.defaultOptions.locales[this.defaultOptions.locale];
      Object.keys(this.options.locales).forEach(locale => {
        this.options.locales[locale] = availableUtils.extend(
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
        availableUtils.selectiveExtend(['moment', 'locale', 'locales', 'id', 'title', 'rtl', 'snap'], this.options, options);
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
      this.customTime = availableUtils.convert(time, 'Date');
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
      const marker = document.createElement('div');
      marker.className = `vis-custom-time-marker`;
      marker.innerHTML = availableUtils.xss(title);
      marker.style.position = 'absolute';

      if (editable) {
        marker.setAttribute('contenteditable', 'true');
        marker.addEventListener('pointerdown', function () {
          marker.focus();
        });
        marker.addEventListener('input', this._onMarkerChange.bind(this));
        // The editable div element has no change event, so here emulates the change event.
        marker.title = title;
        marker.addEventListener('blur', function (event) {
          if (this.title != event.target.innerHTML) {
            this._onMarkerChanged(event);
            this.title = event.target.innerHTML;
          }
        }.bind(this));
      }

      this.bar.appendChild(marker);
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

  /**
   * Create a timeline visualization
   * @constructor Core
   */
  class Core {
      /**
       * Create the main DOM for the Core: a root panel containing left, right,
       * top, bottom, content, and background panel.
       * @param {Element} container  The container element where the Core will
       *                             be attached.
       * @protected
       */
      _create(container) {
          this.dom = {};

          this.dom.container = container;
          this.dom.container.style.position = 'relative';

          this.dom.root = document.createElement('div');
          this.dom.background = document.createElement('div');
          this.dom.backgroundVertical = document.createElement('div');
          this.dom.backgroundHorizontal = document.createElement('div');
          this.dom.centerContainer = document.createElement('div');
          this.dom.leftContainer = document.createElement('div');
          this.dom.rightContainer = document.createElement('div');
          this.dom.center = document.createElement('div');
          this.dom.left = document.createElement('div');
          this.dom.right = document.createElement('div');
          this.dom.top = document.createElement('div');
          this.dom.bottom = document.createElement('div');
          this.dom.shadowTop = document.createElement('div');
          this.dom.shadowBottom = document.createElement('div');
          this.dom.shadowTopLeft = document.createElement('div');
          this.dom.shadowBottomLeft = document.createElement('div');
          this.dom.shadowTopRight = document.createElement('div');
          this.dom.shadowBottomRight = document.createElement('div');
          this.dom.rollingModeBtn = document.createElement('div');
          this.dom.loadingScreen = document.createElement('div');

          this.dom.root.className = 'vis-timeline';
          this.dom.background.className = 'vis-panel vis-background';
          this.dom.backgroundVertical.className = 'vis-panel vis-background vis-vertical';
          this.dom.backgroundHorizontal.className = 'vis-panel vis-background vis-horizontal';
          this.dom.centerContainer.className = 'vis-panel vis-center';
          this.dom.leftContainer.className = 'vis-panel vis-left';
          this.dom.rightContainer.className = 'vis-panel vis-right';
          this.dom.top.className = 'vis-panel vis-top';
          this.dom.bottom.className = 'vis-panel vis-bottom';
          this.dom.left.className = 'vis-content';
          this.dom.center.className = 'vis-content';
          this.dom.right.className = 'vis-content';
          this.dom.shadowTop.className = 'vis-shadow vis-top';
          this.dom.shadowBottom.className = 'vis-shadow vis-bottom';
          this.dom.shadowTopLeft.className = 'vis-shadow vis-top';
          this.dom.shadowBottomLeft.className = 'vis-shadow vis-bottom';
          this.dom.shadowTopRight.className = 'vis-shadow vis-top';
          this.dom.shadowBottomRight.className = 'vis-shadow vis-bottom';
          this.dom.rollingModeBtn.className = 'vis-rolling-mode-btn';
          this.dom.loadingScreen.className = 'vis-loading-screen';

          this.dom.root.appendChild(this.dom.background);
          this.dom.root.appendChild(this.dom.backgroundVertical);
          this.dom.root.appendChild(this.dom.backgroundHorizontal);
          this.dom.root.appendChild(this.dom.centerContainer);
          this.dom.root.appendChild(this.dom.leftContainer);
          this.dom.root.appendChild(this.dom.rightContainer);
          this.dom.root.appendChild(this.dom.top);
          this.dom.root.appendChild(this.dom.bottom);
          this.dom.root.appendChild(this.dom.rollingModeBtn);

          this.dom.centerContainer.appendChild(this.dom.center);
          this.dom.leftContainer.appendChild(this.dom.left);
          this.dom.rightContainer.appendChild(this.dom.right);
          this.dom.centerContainer.appendChild(this.dom.shadowTop);
          this.dom.centerContainer.appendChild(this.dom.shadowBottom);
          this.dom.leftContainer.appendChild(this.dom.shadowTopLeft);
          this.dom.leftContainer.appendChild(this.dom.shadowBottomLeft);
          this.dom.rightContainer.appendChild(this.dom.shadowTopRight);
          this.dom.rightContainer.appendChild(this.dom.shadowBottomRight);

          // size properties of each of the panels
          this.props = {
              root: {},
              background: {},
              centerContainer: {},
              leftContainer: {},
              rightContainer: {},
              center: {},
              left: {},
              right: {},
              top: {},
              bottom: {},
              border: {},
              scrollTop: 0,
              scrollTopMin: 0
          };

          this.on('rangechange', () => {
              if (this.initialDrawDone === true) {
                  this._redraw();
              }
          });
          this.on('rangechanged', () => {
              if (!this.initialRangeChangeDone) {
                  this.initialRangeChangeDone = true;
              }
          });
          this.on('touch', this._onTouch.bind(this));
          this.on('panmove', this._onDrag.bind(this));

          const me = this;
          this._origRedraw = this._redraw.bind(this);
          this._redraw = availableUtils.throttle(this._origRedraw);

          this.on('_change', properties => {
              if (me.itemSet && me.itemSet.initialItemSetDrawn && properties && properties.queue == true) {
                  me._redraw();
              } else {
                  me._origRedraw();
              }
          });

          // create event listeners for all interesting events, these events will be
          // emitted via emitter
          this.hammer = new Hammer(this.dom.root);
          const pinchRecognizer = this.hammer.get('pinch').set({enable: true});
          pinchRecognizer && disablePreventDefaultVertically(pinchRecognizer);
          this.hammer.get('pan').set({threshold: 5, direction: Hammer.DIRECTION_ALL});
          this.timelineListeners = {};

          const events = [
              'tap', 'doubletap', 'press',
              'pinch',
              'pan', 'panstart', 'panmove', 'panend'
              // TODO: cleanup
              //'touch', 'pinch',
              //'tap', 'doubletap', 'hold',
              //'dragstart', 'drag', 'dragend',
              //'mousewheel', 'DOMMouseScroll' // DOMMouseScroll is needed for Firefox
          ];
          events.forEach(type => {
              const listener = event => {
                  if (me.isActive()) {
                      me.emit(type, event);
                  }
              };
              me.hammer.on(type, listener);
              me.timelineListeners[type] = listener;
          });

          // emulate a touch event (emitted before the start of a pan, pinch, tap, or press)
          onTouch(this.hammer, event => {
              me.emit('touch', event);
          });

          // emulate a release event (emitted after a pan, pinch, tap, or press)
          onRelease(this.hammer, event => {
              me.emit('release', event);
          });

          /**
           *
           * @param {WheelEvent} event
           */
          function onMouseWheel(event) {

              // Reasonable default wheel deltas
              const LINE_HEIGHT = 40;
              const PAGE_HEIGHT = 800;

              if (this.isActive()) {
                  this.emit('mousewheel', event);
              }

              // deltaX and deltaY normalization from jquery.mousewheel.js
              let deltaX = 0;
              let deltaY = 0;

              // Old school scrollwheel delta
              if ('detail' in event) {
                  deltaY = event.detail * -1;
              }
              if ('wheelDelta' in event) {
                  deltaY = event.wheelDelta;
              }
              if ('wheelDeltaY' in event) {
                  deltaY = event.wheelDeltaY;
              }
              if ('wheelDeltaX' in event) {
                  deltaX = event.wheelDeltaX * -1;
              }

              // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
              if ('axis' in event && event.axis === event.HORIZONTAL_AXIS) {
                  deltaX = deltaY * -1;
                  deltaY = 0;
              }

              // New school wheel delta (wheel event)
              if ('deltaY' in event) {
                  deltaY = event.deltaY * -1;
              }
              if ('deltaX' in event) {
                  deltaX = event.deltaX;
              }

              // Normalize deltas
              if (event.deltaMode) {
                  if (event.deltaMode === 1) {   // delta in LINE units
                      deltaX *= LINE_HEIGHT;
                      deltaY *= LINE_HEIGHT;
                  } else {                       // delta in PAGE units
                      deltaX *= LINE_HEIGHT;
                      deltaY *= PAGE_HEIGHT;
                  }
              }
              // Prevent scrolling when zooming (no zoom key, or pressing zoom key)
              if (this.options.preferZoom) {
                  if (!this.options.zoomKey || event[this.options.zoomKey]) return;
              } else {
                  if (this.options.zoomKey && event[this.options.zoomKey]) return
              }
              // Don't preventDefault if you can't scroll
              if (!this.options.verticalScroll && !this.options.horizontalScroll) return;

              if (this.options.verticalScroll && Math.abs(deltaY) >= Math.abs(deltaX)) {
                  const current = this.props.scrollTop;
                  const adjusted = current + deltaY;

                  if (this.isActive()) {
                      const newScrollTop = this._setScrollTop(adjusted);

                      if (newScrollTop !== current) {
                          this._redraw();
                          this.emit('scroll', event);

                          // Prevent default actions caused by mouse wheel
                          // (else the page and timeline both scroll)
                          event.preventDefault();
                      }
                  }
              } else if (this.options.horizontalScroll) {
                  const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;

                  // calculate a single scroll jump relative to the range scale
                  const diff = (delta / 120) * (this.range.end - this.range.start) / 20;
                  // calculate new start and end
                  const newStart = this.range.start + diff;
                  const newEnd = this.range.end + diff;

                  const options = {
                      animation: false,
                      byUser: true,
                      event
                  };
                  this.range.setRange(newStart, newEnd, options);

                  event.preventDefault();
              }
          }

          // Add modern wheel event listener
          const wheelType = "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
              document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"

                  // DOMMouseScroll - Older Firefox versions use "DOMMouseScroll"
                  // onmousewheel - All the use "onmousewheel"
                  this.dom.centerContainer.addEventListener ? "DOMMouseScroll" : "onmousewheel";
          this.dom.top.addEventListener ? "DOMMouseScroll" : "onmousewheel";
          this.dom.bottom.addEventListener ? "DOMMouseScroll" : "onmousewheel";
          this.dom.centerContainer.addEventListener(wheelType, onMouseWheel.bind(this), false);
          this.dom.top.addEventListener(wheelType, onMouseWheel.bind(this), false);
          this.dom.bottom.addEventListener(wheelType, onMouseWheel.bind(this), false);


          /**
           *
           * @param {scroll} event
           */
          function onMouseScrollSide(event) {
              if (!me.options.verticalScroll) return;

              event.preventDefault();
              if (me.isActive()) {
                  const adjusted = -event.target.scrollTop;
                  me._setScrollTop(adjusted);
                  me._redraw();
                  me.emit('scrollSide', event);
              }
          }

          this.dom.left.parentNode.addEventListener('scroll', onMouseScrollSide.bind(this));
          this.dom.right.parentNode.addEventListener('scroll', onMouseScrollSide.bind(this));

          let itemAddedToTimeline = false;

          /**
           *
           * @param {dragover} event
           * @returns {boolean}
           */
          function handleDragOver(event) {
              if (event.preventDefault) {
                  me.emit('dragover', me.getEventProperties(event));
                  event.preventDefault(); // Necessary. Allows us to drop.
              }

              // make sure your target is a timeline element
              if (!(event.target.className.indexOf("timeline") > -1)) return;

              // make sure only one item is added every time you're over the timeline
              if (itemAddedToTimeline) return;

              event.dataTransfer.dropEffect = 'move';
              itemAddedToTimeline = true;
              return false;
          }

          /**
           *
           * @param {drop} event
           * @returns {boolean}
           */
          function handleDrop(event) {
              // prevent redirect to blank page - Firefox
              if (event.preventDefault) {
                  event.preventDefault();
              }
              if (event.stopPropagation) {
                  event.stopPropagation();
              }
              // return when dropping non-timeline items
              try {
                  var itemData = JSON.parse(event.dataTransfer.getData("text"));
                  if (!itemData || !itemData.content) return
              } catch (err) {
                  return false;
              }

              itemAddedToTimeline = false;
              event.center = {
                  x: event.clientX,
                  y: event.clientY
              };

              if (itemData.target !== 'item') {
                  me.itemSet._onAddItem(event);
              } else {
                  me.itemSet._onDropObjectOnItem(event);
              }
              me.emit('drop', me.getEventProperties(event));
              return false;
          }

          this.dom.center.addEventListener('dragover', handleDragOver.bind(this), false);
          this.dom.center.addEventListener('drop', handleDrop.bind(this), false);

          this.customTimes = [];

          // store state information needed for touch events
          this.touch = {};

          this.redrawCount = 0;
          this.initialDrawDone = false;
          this.initialRangeChangeDone = false;

          // attach the root panel to the provided container
          if (!container) throw new Error('No container provided');
          container.appendChild(this.dom.root);
          container.appendChild(this.dom.loadingScreen);
      }

      /**
       * Set options. Options will be passed to all components loaded in the Timeline.
       * @param {Object} [options]
       *                           {String} orientation
       *                              Vertical orientation for the Timeline,
       *                              can be 'bottom' (default) or 'top'.
       *                           {string | number} width
       *                              Width for the timeline, a number in pixels or
       *                              a css string like '1000px' or '75%'. '100%' by default.
       *                           {string | number} height
       *                              Fixed height for the Timeline, a number in pixels or
       *                              a css string like '400px' or '75%'. If undefined,
       *                              The Timeline will automatically size such that
       *                              its contents fit.
       *                           {string | number} minHeight
       *                              Minimum height for the Timeline, a number in pixels or
       *                              a css string like '400px' or '75%'.
       *                           {string | number} maxHeight
       *                              Maximum height for the Timeline, a number in pixels or
       *                              a css string like '400px' or '75%'.
       *                           {number | Date | string} start
       *                              Start date for the visible window
       *                           {number | Date | string} end
       *                              End date for the visible window
       */
      setOptions(options) {
          if (options) {
              // copy the known options
              const fields = [
                  'width', 'height', 'minHeight', 'maxHeight', 'autoResize',
                  'start', 'end', 'clickToUse', 'dataAttributes', 'hiddenDates',
                  'locale', 'locales', 'moment', 'preferZoom', 'rtl', 'zoomKey',
                  'horizontalScroll', 'verticalScroll', 'longSelectPressTime', 'snap'
              ];
              availableUtils.selectiveExtend(fields, this.options, options);
              this.dom.rollingModeBtn.style.visibility = 'hidden';

              if (this.options.rtl) {
                  this.dom.container.style.direction = "rtl";
                  this.dom.backgroundVertical.className = 'vis-panel vis-background vis-vertical-rtl';
              }

              if (this.options.verticalScroll) {
                  if (this.options.rtl) {
                      this.dom.rightContainer.className = 'vis-panel vis-right vis-vertical-scroll';
                  } else {
                      this.dom.leftContainer.className = 'vis-panel vis-left vis-vertical-scroll';
                  }
              }

              if (typeof this.options.orientation !== 'object') {
                  this.options.orientation = {item: undefined, axis: undefined};
              }
              if ('orientation' in options) {
                  if (typeof options.orientation === 'string') {
                      this.options.orientation = {
                          item: options.orientation,
                          axis: options.orientation
                      };
                  } else if (typeof options.orientation === 'object') {
                      if ('item' in options.orientation) {
                          this.options.orientation.item = options.orientation.item;
                      }
                      if ('axis' in options.orientation) {
                          this.options.orientation.axis = options.orientation.axis;
                      }
                  }
              }

              if (this.options.orientation.axis === 'both') {
                  if (!this.timeAxis2) {
                      const timeAxis2 = this.timeAxis2 = new TimeAxis(this.body);
                      timeAxis2.setOptions = options => {
                          const _options = options ? availableUtils.extend({}, options) : {};
                          _options.orientation = 'top'; // override the orientation option, always top
                          TimeAxis.prototype.setOptions.call(timeAxis2, _options);
                      };
                      this.components.push(timeAxis2);
                  }
              } else {
                  if (this.timeAxis2) {
                      const index = this.components.indexOf(this.timeAxis2);
                      if (index !== -1) {
                          this.components.splice(index, 1);
                      }
                      this.timeAxis2.destroy();
                      this.timeAxis2 = null;
                  }
              }

              // if the graph2d's drawPoints is a function delegate the callback to the onRender property
              if (typeof options.drawPoints == 'function') {
                  options.drawPoints = {
                      onRender: options.drawPoints
                  };
              }

              if ('hiddenDates' in this.options) {
                  convertHiddenOptions(this.options.moment, this.body, this.options.hiddenDates);
              }

              if ('clickToUse' in options) {
                  if (options.clickToUse) {
                      if (!this.activator) {
                          this.activator = new Activator(this.dom.root);
                      }
                  } else {
                      if (this.activator) {
                          this.activator.destroy();
                          delete this.activator;
                      }
                  }
              }

              // enable/disable autoResize
              this._initAutoResize();
          }

          // propagate options to all components
          this.components.forEach(component => component.setOptions(options));

          // enable/disable configure
          if ('configure' in options) {
              if (!this.configurator) {
                  this.configurator = this._createConfigurator();
              }

              this.configurator.setOptions(options.configure);

              // collect the settings of all components, and pass them to the configuration system
              const appliedOptions = availableUtils.deepExtend({}, this.options);
              this.components.forEach(component => {
                  availableUtils.deepExtend(appliedOptions, component.options);
              });
              this.configurator.setModuleOptions({global: appliedOptions});
          }

          this._redraw();
      }

      /**
       * Returns true when the Timeline is active.
       * @returns {boolean}
       */
      isActive() {
          return !this.activator || this.activator.active;
      }

      /**
       * Destroy the Core, clean up all DOM elements and event listeners.
       */
      destroy() {
          // unbind datasets
          this.setItems(null);
          this.setGroups(null);

          // remove all event listeners
          this.off();

          // stop checking for changed size
          this._stopAutoResize();

          // remove from DOM
          if (this.dom.root.parentNode) {
              this.dom.root.parentNode.removeChild(this.dom.root);
          }
          this.dom = null;

          // remove Activator
          if (this.activator) {
              this.activator.destroy();
              delete this.activator;
          }

          // cleanup hammer touch events
          for (const event in this.timelineListeners) {
              if (this.timelineListeners.hasOwnProperty(event)) {
                  delete this.timelineListeners[event];
              }
          }
          this.timelineListeners = null;
          this.hammer && this.hammer.destroy();
          this.hammer = null;

          // give all components the opportunity to cleanup
          this.components.forEach(component => component.destroy());

          this.body = null;
      }

      /**
       * Set a custom time bar
       * @param {Date} time
       * @param {number} [id=undefined] Optional id of the custom time bar to be adjusted.
       */
      setCustomTime(time, id) {
          const customTimes = this.customTimes.filter(component => id === component.options.id);

          if (customTimes.length === 0) {
              throw new Error(`No custom time bar found with id ${JSON.stringify(id)}`)
          }

          if (customTimes.length > 0) {
              customTimes[0].setCustomTime(time);
          }
      }

      /**
       * Retrieve the current custom time.
       * @param {number} [id=undefined]    Id of the custom time bar.
       * @return {Date | undefined} customTime
       */
      getCustomTime(id) {
          const customTimes = this.customTimes.filter(component => component.options.id === id);

          if (customTimes.length === 0) {
              throw new Error(`No custom time bar found with id ${JSON.stringify(id)}`)
          }
          return customTimes[0].getCustomTime();
      }

      /**
       * Set a custom marker for the custom time bar.
       * @param {string} [title] Title of the custom marker.
       * @param {number} [id=undefined] Id of the custom marker.
       * @param {boolean} [editable=false] Make the custom marker editable.
       */
      setCustomTimeMarker(title, id, editable) {
          const customTimes = this.customTimes.filter(component => component.options.id === id);

          if (customTimes.length === 0) {
              throw new Error(`No custom time bar found with id ${JSON.stringify(id)}`)
          }
          if (customTimes.length > 0) {
              customTimes[0].setCustomMarker(title, editable);
          }
      }

      /**
       * Set a custom title for the custom time bar.
       * @param {string} [title] Custom title
       * @param {number} [id=undefined]    Id of the custom time bar.
       * @returns {*}
       */
      setCustomTimeTitle(title, id) {
          const customTimes = this.customTimes.filter(component => component.options.id === id);

          if (customTimes.length === 0) {
              throw new Error(`No custom time bar found with id ${JSON.stringify(id)}`)
          }
          if (customTimes.length > 0) {
              return customTimes[0].setCustomTitle(title);
          }
      }

      /**
       * Retrieve meta information from an event.
       * Should be overridden by classes extending Core
       * @param {Event} event
       * @return {Object} An object with related information.
       */
      getEventProperties(event) {
          return {event};
      }

      /**
       * Add custom vertical bar
       * @param {Date | string | number} [time]  A Date, unix timestamp, or
       *                                         ISO date string. Time point where
       *                                         the new bar should be placed.
       *                                         If not provided, `new Date()` will
       *                                         be used.
       * @param {number | string} [id=undefined] Id of the new bar. Optional
       * @return {number | string}               Returns the id of the new bar
       */
      addCustomTime(time, id) {
          const timestamp = time !== undefined
              ? availableUtils.convert(time, 'Date')
              : new Date();

          const exists = this.customTimes.some(customTime => customTime.options.id === id);
          if (exists) {
              throw new Error(`A custom time with id ${JSON.stringify(id)} already exists`);
          }

          const customTime = new CustomTime(this.body, availableUtils.extend({}, this.options, {
              time: timestamp,
              id,
              snap: this.itemSet ? this.itemSet.options.snap : this.options.snap
          }));

          this.customTimes.push(customTime);
          this.components.push(customTime);
          this._redraw();

          return id;
      }

      /**
       * Remove previously added custom bar
       * @param {int} id ID of the custom bar to be removed
       * [at]returns {boolean} True if the bar exists and is removed, false otherwise
       */
      removeCustomTime(id) {
          const customTimes = this.customTimes.filter(bar => bar.options.id === id);

          if (customTimes.length === 0) {
              throw new Error(`No custom time bar found with id ${JSON.stringify(id)}`)
          }

          customTimes.forEach(customTime => {
              this.customTimes.splice(this.customTimes.indexOf(customTime), 1);
              this.components.splice(this.components.indexOf(customTime), 1);
              customTime.destroy();
          });
      }

      /**
       * Get the id's of the currently visible items.
       * @returns {Array} The ids of the visible items
       */
      getVisibleItems() {
          return this.itemSet && this.itemSet.getVisibleItems() || [];
      }

      /**
       * Get the id's of the items at specific time, where a click takes place on the timeline.
       * @returns {Array} The ids of all items in existence at the time of event.
       */
      getItemsAtCurrentTime(timeOfEvent) {
          this.time = timeOfEvent;
          return this.itemSet && this.itemSet.getItemsAtCurrentTime(this.time) || [];
      }

      /**
       * Get the id's of the currently visible groups.
       * @returns {Array} The ids of the visible groups
       */
      getVisibleGroups() {
          return this.itemSet && this.itemSet.getVisibleGroups() || [];
      }

      /**
       * Set Core window such that it fits all items
       * @param {Object} [options]  Available options:
       *                                `animation: boolean | {duration: number, easingFunction: string}`
       *                                    If true (default), the range is animated
       *                                    smoothly to the new window. An object can be
       *                                    provided to specify duration and easing function.
       *                                    Default duration is 500 ms, and default easing
       *                                    function is 'easeInOutQuad'.
       * @param {function} [callback] a callback funtion to be executed at the end of this function
       */
      fit(options, callback) {
          const range = this.getDataRange();

          // skip range set if there is no min and max date
          if (range.min === null && range.max === null) {
              return;
          }

          // apply a margin of 1% left and right of the data
          const interval = range.max - range.min;
          const min = new Date(range.min.valueOf() - interval * 0.01);
          const max = new Date(range.max.valueOf() + interval * 0.01);
          const animation = (options && options.animation !== undefined) ? options.animation : true;
          this.range.setRange(min, max, {animation}, callback);
      }

      /**
       * Calculate the data range of the items start and end dates
       * [at]returns {{min: [Date], max: [Date]}}
       * @protected
       */
      getDataRange() {
          // must be implemented by Timeline and Graph2d
          throw new Error('Cannot invoke abstract method getDataRange');
      }

      /**
       * Set the visible window. Both parameters are optional, you can change only
       * start or only end. Syntax:
       *
       *     TimeLine.setWindow(start, end)
       *     TimeLine.setWindow(start, end, options)
       *     TimeLine.setWindow(range)
       *
       * Where start and end can be a Date, number, or string, and range is an
       * object with properties start and end.
       *
       * @param {Date | number | string | Object} [start] Start date of visible window
       * @param {Date | number | string} [end]            End date of visible window
       * @param {Object} [options]  Available options:
       *                                `animation: boolean | {duration: number, easingFunction: string}`
       *                                    If true (default), the range is animated
       *                                    smoothly to the new window. An object can be
       *                                    provided to specify duration and easing function.
       *                                    Default duration is 500 ms, and default easing
       *                                    function is 'easeInOutQuad'.
       * @param {function} [callback] a callback funtion to be executed at the end of this function
       */
      setWindow(start, end, options, callback) {
          if (typeof arguments[2] == "function") {
              callback = arguments[2];
              options = {};
          }
          let animation;
          let range;
          if (arguments.length == 1) {
              range = arguments[0];
              animation = (range.animation !== undefined) ? range.animation : true;
              this.range.setRange(range.start, range.end, {animation});
          } else if (arguments.length == 2 && typeof arguments[1] == "function") {
              range = arguments[0];
              callback = arguments[1];
              animation = (range.animation !== undefined) ? range.animation : true;
              this.range.setRange(range.start, range.end, {animation}, callback);
          } else {
              animation = (options && options.animation !== undefined) ? options.animation : true;
              this.range.setRange(start, end, {animation}, callback);
          }
      }

      /**
       * Move the window such that given time is centered on screen.
       * @param {Date | number | string} time
       * @param {Object} [options]  Available options:
       *                                `animation: boolean | {duration: number, easingFunction: string}`
       *                                    If true (default), the range is animated
       *                                    smoothly to the new window. An object can be
       *                                    provided to specify duration and easing function.
       *                                    Default duration is 500 ms, and default easing
       *                                    function is 'easeInOutQuad'.
       * @param {function} [callback] a callback funtion to be executed at the end of this function
       */
      moveTo(time, options, callback) {
          if (typeof arguments[1] == "function") {
              callback = arguments[1];
              options = {};
          }
          const interval = this.range.end - this.range.start;
          const t = availableUtils.convert(time, 'Date').valueOf();

          const start = t - interval / 2;
          const end = t + interval / 2;
          const animation = (options && options.animation !== undefined) ? options.animation : true;

          this.range.setRange(start, end, {animation}, callback);
      }

      /**
       * Get the visible window
       * @return {{start: Date, end: Date}}   Visible range
       */
      getWindow() {
          const range = this.range.getRange();
          return {
              start: new Date(range.start),
              end: new Date(range.end)
          };
      }

      /**
       * Zoom in the window such that given time is centered on screen.
       * @param {number} percentage - must be between [0..1]
       * @param {Object} [options]  Available options:
       *                                `animation: boolean | {duration: number, easingFunction: string}`
       *                                    If true (default), the range is animated
       *                                    smoothly to the new window. An object can be
       *                                    provided to specify duration and easing function.
       *                                    Default duration is 500 ms, and default easing
       *                                    function is 'easeInOutQuad'.
       * @param {function} [callback] a callback funtion to be executed at the end of this function
       */
      zoomIn(percentage, options, callback) {
          if (!percentage || percentage < 0 || percentage > 1) return;
          if (typeof arguments[1] == "function") {
              callback = arguments[1];
              options = {};
          }
          const range = this.getWindow();
          const start = range.start.valueOf();
          const end = range.end.valueOf();
          const interval = end - start;
          const newInterval = interval / (1 + percentage);
          const distance = (interval - newInterval) / 2;
          const newStart = start + distance;
          const newEnd = end - distance;

          this.setWindow(newStart, newEnd, options, callback);
      }

      /**
       * Zoom out the window such that given time is centered on screen.
       * @param {number} percentage - must be between [0..1]
       * @param {Object} [options]  Available options:
       *                                `animation: boolean | {duration: number, easingFunction: string}`
       *                                    If true (default), the range is animated
       *                                    smoothly to the new window. An object can be
       *                                    provided to specify duration and easing function.
       *                                    Default duration is 500 ms, and default easing
       *                                    function is 'easeInOutQuad'.
       * @param {function} [callback] a callback funtion to be executed at the end of this function
       */
      zoomOut(percentage, options, callback) {
          if (!percentage || percentage < 0 || percentage > 1) return
          if (typeof arguments[1] == "function") {
              callback = arguments[1];
              options = {};
          }
          const range = this.getWindow();
          const start = range.start.valueOf();
          const end = range.end.valueOf();
          const interval = end - start;
          const newStart = start - interval * percentage / 2;
          const newEnd = end + interval * percentage / 2;

          this.setWindow(newStart, newEnd, options, callback);
      }

      /**
       * Force a redraw. Can be overridden by implementations of Core
       *
       * Note: this function will be overridden on construction with a trottled version
       */
      redraw() {
          this._redraw();
      }

      /**
       * Redraw for internal use. Redraws all components. See also the public
       * method redraw.
       * @protected
       */
      _redraw() {
          this.redrawCount++;
          const dom = this.dom;

          if (!dom || !dom.container || dom.root.offsetWidth == 0) return; // when destroyed, or invisible

          let resized = false;
          const options = this.options;
          const props = this.props;

          updateHiddenDates(this.options.moment, this.body, this.options.hiddenDates);

          // update class names
          if (options.orientation == 'top') {
              availableUtils.addClassName(dom.root, 'vis-top');
              availableUtils.removeClassName(dom.root, 'vis-bottom');
          } else {
              availableUtils.removeClassName(dom.root, 'vis-top');
              availableUtils.addClassName(dom.root, 'vis-bottom');
          }

          if (options.rtl) {
              availableUtils.addClassName(dom.root, 'vis-rtl');
              availableUtils.removeClassName(dom.root, 'vis-ltr');
          } else {
              availableUtils.addClassName(dom.root, 'vis-ltr');
              availableUtils.removeClassName(dom.root, 'vis-rtl');
          }

          // update root width and height options
          dom.root.style.maxHeight = availableUtils.option.asSize(options.maxHeight, '');
          dom.root.style.minHeight = availableUtils.option.asSize(options.minHeight, '');
          dom.root.style.width = availableUtils.option.asSize(options.width, '');
          const rootOffsetWidth = dom.root.offsetWidth;

          // calculate border widths
          props.border.left = 1;
          props.border.right = 1;
          props.border.top = 1;
          props.border.bottom = 1;

          // calculate the heights. If any of the side panels is empty, we set the height to
          // minus the border width, such that the border will be invisible
          props.center.height = dom.center.offsetHeight;
          props.left.height = dom.left.offsetHeight;
          props.right.height = dom.right.offsetHeight;
          props.top.height = dom.top.clientHeight || -props.border.top;
          props.bottom.height = Math.round(dom.bottom.getBoundingClientRect().height) || dom.bottom.clientHeight || -props.border.bottom;

          // TODO: compensate borders when any of the panels is empty.

          // apply auto height
          // TODO: only calculate autoHeight when needed (else we cause an extra reflow/repaint of the DOM)
          const contentHeight = Math.max(props.left.height, props.center.height, props.right.height);
          const autoHeight = props.top.height + contentHeight + props.bottom.height + props.border.top + props.border.bottom;
          dom.root.style.height = availableUtils.option.asSize(options.height, `${autoHeight}px`);

          // calculate heights of the content panels
          props.root.height = dom.root.offsetHeight;
          props.background.height = props.root.height;
          const containerHeight = props.root.height - props.top.height - props.bottom.height;
          props.centerContainer.height = containerHeight;
          props.leftContainer.height = containerHeight;
          props.rightContainer.height = props.leftContainer.height;

          // calculate the widths of the panels
          props.root.width = rootOffsetWidth;
          props.background.width = props.root.width;

          if (!this.initialDrawDone) {
              props.scrollbarWidth = availableUtils.getScrollBarWidth();
          }

          const leftContainerClientWidth = dom.leftContainer.clientWidth;
          const rightContainerClientWidth = dom.rightContainer.clientWidth;

          if (options.verticalScroll) {
              if (options.rtl) {
                  props.left.width = leftContainerClientWidth || -props.border.left;
                  props.right.width = rightContainerClientWidth + props.scrollbarWidth || -props.border.right;
              } else {
                  props.left.width = leftContainerClientWidth + props.scrollbarWidth || -props.border.left;
                  props.right.width = rightContainerClientWidth || -props.border.right;
              }
          } else {
              props.left.width = leftContainerClientWidth || -props.border.left;
              props.right.width = rightContainerClientWidth || -props.border.right;
          }

          this._setDOM();

          // update the scrollTop, feasible range for the offset can be changed
          // when the height of the Core or of the contents of the center changed
          let offset = this._updateScrollTop();

          // reposition the scrollable contents
          if (options.orientation.item != 'top') {
              offset += Math.max(props.centerContainer.height - props.center.height -
                  props.border.top - props.border.bottom, 0);
          }
          dom.center.style.transform = `translateY(${offset}px)`;

          // show shadows when vertical scrolling is available
          const visibilityTop = props.scrollTop == 0 ? 'hidden' : '';
          const visibilityBottom = props.scrollTop == props.scrollTopMin ? 'hidden' : '';
          dom.shadowTop.style.visibility = visibilityTop;
          dom.shadowBottom.style.visibility = visibilityBottom;
          dom.shadowTopLeft.style.visibility = visibilityTop;
          dom.shadowBottomLeft.style.visibility = visibilityBottom;
          dom.shadowTopRight.style.visibility = visibilityTop;
          dom.shadowBottomRight.style.visibility = visibilityBottom;

          if (options.verticalScroll) {
              dom.rightContainer.className = 'vis-panel vis-right vis-vertical-scroll';
              dom.leftContainer.className = 'vis-panel vis-left vis-vertical-scroll';

              dom.shadowTopRight.style.visibility = "hidden";
              dom.shadowBottomRight.style.visibility = "hidden";
              dom.shadowTopLeft.style.visibility = "hidden";
              dom.shadowBottomLeft.style.visibility = "hidden";

              dom.left.style.top = '0px';
              dom.right.style.top = '0px';
          }

          if (!options.verticalScroll || props.center.height < props.centerContainer.height) {
              dom.left.style.top = `${offset}px`;
              dom.right.style.top = `${offset}px`;
              dom.rightContainer.className = dom.rightContainer.className.replace(new RegExp('(?:^|\\s)' + 'vis-vertical-scroll' + '(?:\\s|$)'), ' ');
              dom.leftContainer.className = dom.leftContainer.className.replace(new RegExp('(?:^|\\s)' + 'vis-vertical-scroll' + '(?:\\s|$)'), ' ');
              props.left.width = leftContainerClientWidth || -props.border.left;
              props.right.width = rightContainerClientWidth || -props.border.right;
              this._setDOM();
          }

          // enable/disable vertical panning
          const contentsOverflow = props.center.height > props.centerContainer.height;
          this.hammer.get('pan').set({
              direction: contentsOverflow ? Hammer.DIRECTION_ALL : Hammer.DIRECTION_HORIZONTAL
          });

          // set the long press time
          this.hammer.get('press').set({
              time: this.options.longSelectPressTime
          });

          // redraw all components
          this.components.forEach(component => {
              resized = component.redraw() || resized;
          });
          const MAX_REDRAW = 5;
          if (resized) {
              if (this.redrawCount < MAX_REDRAW) {
                  this.body.emitter.emit('_change');
                  return;
              } else {
                  console.log('WARNING: infinite loop in redraw?');
              }
          } else {
              this.redrawCount = 0;
          }

          //Emit public 'changed' event for UI updates, see issue #1592
          this.body.emitter.emit("changed");
      }

      /**
       * sets the basic DOM components needed for the timeline\graph2d
       */
      _setDOM() {
          const props = this.props;
          const dom = this.dom;

          props.leftContainer.width = props.left.width;
          props.rightContainer.width = props.right.width;
          const centerWidth = props.root.width - props.left.width - props.right.width;
          props.center.width = centerWidth;
          props.centerContainer.width = centerWidth;
          props.top.width = centerWidth;
          props.bottom.width = centerWidth;

          // resize the panels
          dom.background.style.height = `${props.background.height}px`;
          dom.backgroundVertical.style.height = `${props.background.height}px`;
          dom.backgroundHorizontal.style.height = `${props.centerContainer.height}px`;
          dom.centerContainer.style.height = `${props.centerContainer.height}px`;
          dom.leftContainer.style.height = `${props.leftContainer.height}px`;
          dom.rightContainer.style.height = `${props.rightContainer.height}px`;

          dom.background.style.width = `${props.background.width}px`;
          dom.backgroundVertical.style.width = `${props.centerContainer.width}px`;
          dom.backgroundHorizontal.style.width = `${props.background.width}px`;
          dom.centerContainer.style.width = `${props.center.width}px`;
          dom.top.style.width = `${props.top.width}px`;
          dom.bottom.style.width = `${props.bottom.width}px`;

          // reposition the panels
          dom.background.style.left = '0';
          dom.background.style.top = '0';
          dom.backgroundVertical.style.left = `${props.left.width + props.border.left}px`;
          dom.backgroundVertical.style.top = '0';
          dom.backgroundHorizontal.style.left = '0';
          dom.backgroundHorizontal.style.top = `${props.top.height}px`;
          dom.centerContainer.style.left = `${props.left.width}px`;
          dom.centerContainer.style.top = `${props.top.height}px`;
          dom.leftContainer.style.left = '0';
          dom.leftContainer.style.top = `${props.top.height}px`;
          dom.rightContainer.style.left = `${props.left.width + props.center.width}px`;
          dom.rightContainer.style.top = `${props.top.height}px`;
          dom.top.style.left = `${props.left.width}px`;
          dom.top.style.top = '0';
          dom.bottom.style.left = `${props.left.width}px`;
          dom.bottom.style.top = `${props.top.height + props.centerContainer.height}px`;
          dom.center.style.left = '0';
          dom.left.style.left = '0';
          dom.right.style.left = '0';
      }

      /**
       * Set a current time. This can be used for example to ensure that a client's
       * time is synchronized with a shared server time.
       * Only applicable when option `showCurrentTime` is true.
       * @param {Date | string | number} time     A Date, unix timestamp, or
       *                                          ISO date string.
       */
      setCurrentTime(time) {
          if (!this.currentTime) {
              throw new Error('Option showCurrentTime must be true');
          }

          this.currentTime.setCurrentTime(time);
      }

      /**
       * Get the current time.
       * Only applicable when option `showCurrentTime` is true.
       * @return {Date} Returns the current time.
       */
      getCurrentTime() {
          if (!this.currentTime) {
              throw new Error('Option showCurrentTime must be true');
          }

          return this.currentTime.getCurrentTime();
      }

      /**
       * Convert a position on screen (pixels) to a datetime
       * @param {int}     x    Position on the screen in pixels
       * @return {Date}   time The datetime the corresponds with given position x
       * @protected
       * TODO: move this function to Range
       */
      _toTime(x) {
          return toTime(this, x, this.props.center.width);
      }

      /**
       * Convert a position on the global screen (pixels) to a datetime
       * @param {int}     x    Position on the screen in pixels
       * @return {Date}   time The datetime the corresponds with given position x
       * @protected
       * TODO: move this function to Range
       */
      _toGlobalTime(x) {
          return toTime(this, x, this.props.root.width);
          //var conversion = this.range.conversion(this.props.root.width);
          //return new Date(x / conversion.scale + conversion.offset);
      }

      /**
       * Convert a datetime (Date object) into a position on the screen
       * @param {Date}   time A date
       * @return {int}   x    The position on the screen in pixels which corresponds
       *                      with the given date.
       * @protected
       * TODO: move this function to Range
       */
      _toScreen(time) {
          return toScreen(this, time, this.props.center.width);
      }

      /**
       * Convert a datetime (Date object) into a position on the root
       * This is used to get the pixel density estimate for the screen, not the center panel
       * @param {Date}   time A date
       * @return {int}   x    The position on root in pixels which corresponds
       *                      with the given date.
       * @protected
       * TODO: move this function to Range
       */
      _toGlobalScreen(time) {
          return toScreen(this, time, this.props.root.width);
          //var conversion = this.range.conversion(this.props.root.width);
          //return (time.valueOf() - conversion.offset) * conversion.scale;
      }

      /**
       * Initialize watching when option autoResize is true
       * @private
       */
      _initAutoResize() {
          if (this.options.autoResize == true) {
              this._startAutoResize();
          } else {
              this._stopAutoResize();
          }
      }

      /**
       * Watch for changes in the size of the container. On resize, the Panel will
       * automatically redraw itself.
       * @private
       */
      _startAutoResize() {
          const me = this;

          this._stopAutoResize();

          this._onResize = () => {
              if (me.options.autoResize != true) {
                  // stop watching when the option autoResize is changed to false
                  me._stopAutoResize();
                  return;
              }

              if (me.dom.root) {
                  const rootOffsetHeight = me.dom.root.offsetHeight;
                  const rootOffsetWidth = me.dom.root.offsetWidth;
                  // check whether the frame is resized
                  // Note: we compare offsetWidth here, not clientWidth. For some reason,
                  // IE does not restore the clientWidth from 0 to the actual width after
                  // changing the timeline's container display style from none to visible
                  if ((rootOffsetWidth != me.props.lastWidth) ||
                      (rootOffsetHeight != me.props.lastHeight)) {
                      me.props.lastWidth = rootOffsetWidth;
                      me.props.lastHeight = rootOffsetHeight;
                      me.props.scrollbarWidth = availableUtils.getScrollBarWidth();

                      me.body.emitter.emit('_change');
                  }
              }
          };

          // add event listener to window resize
          availableUtils.addEventListener(window, 'resize', this._onResize);

          //Prevent initial unnecessary redraw
          if (me.dom.root) {
              me.props.lastWidth = me.dom.root.offsetWidth;
              me.props.lastHeight = me.dom.root.offsetHeight;
          }

          this.watchTimer = setInterval(this._onResize, 1000);
      }

      /**
       * Stop watching for a resize of the frame.
       * @private
       */
      _stopAutoResize() {
          if (this.watchTimer) {
              clearInterval(this.watchTimer);
              this.watchTimer = undefined;
          }

          // remove event listener on window.resize
          if (this._onResize) {
              availableUtils.removeEventListener(window, 'resize', this._onResize);
              this._onResize = null;
          }
      }

      /**
       * Start moving the timeline vertically
       * @param {Event} event
       * @private
       */
      _onTouch(event) {  // eslint-disable-line no-unused-vars
          this.touch.allowDragging = true;
          this.touch.initialScrollTop = this.props.scrollTop;
      }

      /**
       * Start moving the timeline vertically
       * @param {Event} event
       * @private
       */
      _onPinch(event) {  // eslint-disable-line no-unused-vars
          this.touch.allowDragging = false;
      }

      /**
       * Move the timeline vertically
       * @param {Event} event
       * @private
       */
      _onDrag(event) {
          if (!event) return
          // refuse to drag when we where pinching to prevent the timeline make a jump
          // when releasing the fingers in opposite order from the touch screen
          if (!this.touch.allowDragging) return;

          const delta = event.deltaY;

          const oldScrollTop = this._getScrollTop();
          const newScrollTop = this._setScrollTop(this.touch.initialScrollTop + delta);

          if (this.options.verticalScroll) {
              this.dom.left.parentNode.scrollTop = -this.props.scrollTop;
              this.dom.right.parentNode.scrollTop = -this.props.scrollTop;
          }

          if (newScrollTop != oldScrollTop) {
              this.emit("verticalDrag");
          }
      }

      /**
       * Apply a scrollTop
       * @param {number} scrollTop
       * @returns {number} scrollTop  Returns the applied scrollTop
       * @private
       */
      _setScrollTop(scrollTop) {
          this.props.scrollTop = scrollTop;
          this._updateScrollTop();
          return this.props.scrollTop;
      }

      /**
       * Update the current scrollTop when the height of  the containers has been changed
       * @returns {number} scrollTop  Returns the applied scrollTop
       * @private
       */
      _updateScrollTop() {
          // recalculate the scrollTopMin
          const scrollTopMin = Math.min(this.props.centerContainer.height - this.props.border.top - this.props.border.bottom - this.props.center.height, 0); // is negative or zero
          if (scrollTopMin != this.props.scrollTopMin) {
              // in case of bottom orientation, change the scrollTop such that the contents
              // do not move relative to the time axis at the bottom
              if (this.options.orientation.item != 'top') {
                  this.props.scrollTop += (scrollTopMin - this.props.scrollTopMin);
              }
              this.props.scrollTopMin = scrollTopMin;
          }

          // limit the scrollTop to the feasible scroll range
          if (this.props.scrollTop > 0) this.props.scrollTop = 0;
          if (this.props.scrollTop < scrollTopMin) this.props.scrollTop = scrollTopMin;

          if (this.options.verticalScroll) {
              this.dom.left.parentNode.scrollTop = -this.props.scrollTop;
              this.dom.right.parentNode.scrollTop = -this.props.scrollTop;
          }
          return this.props.scrollTop;
      }

      /**
       * Get the current scrollTop
       * @returns {number} scrollTop
       * @private
       */
      _getScrollTop() {
          return this.props.scrollTop;
      }

      /**
       * Load a configurator
       * [at]returns {Object}
       * @private
       */
      _createConfigurator() {
          throw new Error('Cannot invoke abstract method _createConfigurator');
      }
  }

  // turn Core into an event emitter
  Emitter__default['default'](Core.prototype);

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
      super();
      this.body = body;

      // default options
      this.defaultOptions = {
        rtl: false,
        showCurrentTime: true,
        alignCurrentTime: undefined,

        moment: moment$2,
        locales,
        locale: 'en'
      };
      this.options = availableUtils.extend({}, this.defaultOptions);
      this.setOptions(options);
      this.options.locales = availableUtils.extend({}, locales, this.options.locales);
      const defaultLocales = this.defaultOptions.locales[this.defaultOptions.locale];
      Object.keys(this.options.locales).forEach(locale => {
        this.options.locales[locale] = availableUtils.extend(
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
        availableUtils.selectiveExtend(['rtl', 'showCurrentTime', 'alignCurrentTime', 'moment', 'locale', 'locales'], this.options, options);
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
      const t = availableUtils.convert(time, 'Date').valueOf();
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

  // Utility functions for ordering and stacking of items
  const EPSILON = 0.001; // used when checking collisions, to prevent round-off errors

  /**
   * Order items by their start data
   * @param {Item[]} items
   */
  function orderByStart(items) {
    items.sort((a, b) => a.data.start - b.data.start);
  }

  /**
   * Order items by their end date. If they have no end date, their start date
   * is used.
   * @param {Item[]} items
   */
  function orderByEnd(items) {
    items.sort((a, b) => {
      const aTime = ('end' in a.data) ? a.data.end : a.data.start;
      const bTime = ('end' in b.data) ? b.data.end : b.data.start;

      return aTime - bTime;
    });
  }

  /**
   * Adjust vertical positions of the items such that they don't overlap each
   * other.
   * @param {Item[]} items
   *            All visible items
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   *            Margins between items and between items and the axis.
   * @param {boolean} [force=false]
   *            If true, all items will be repositioned. If false (default), only
   *            items having a top===null will be re-stacked
   * @param {function} shouldBailItemsRedrawFunction
   *            bailing function
   * @return {boolean} shouldBail
   */
  function stack(items, margin, force, shouldBailItemsRedrawFunction) {
    if (force) {
      // reset top position of all items
      for (var i = 0; i < items.length; i++) {
        items[i].top = null;
      }
    }

    // calculate new, non-overlapping positions
    for (var i = 0; i < items.length; i++) {  // eslint-disable-line no-redeclare
      const item = items[i];
      if (item.stack && item.top === null) {
        // initialize top position
        item.top = margin.axis;
        var shouldBail = false;

        do {
          // TODO: optimize checking for overlap. when there is a gap without items,
          //       you only need to check for items from the next item on, not from zero
          var collidingItem = null;
          for (let j = 0, jj = items.length; j < jj; j++) {
            const other = items[j];
            shouldBail = shouldBailItemsRedrawFunction() || false;

            if (shouldBail) { return true; }

            if (other.top !== null && other !== item && other.stack && collision(item, other, margin.item, other.options.rtl)) {
              collidingItem = other;
              break;
            }
          }

          if (collidingItem != null) {
            // There is a collision. Reposition the items above the colliding element
            item.top = collidingItem.top + collidingItem.height + margin.item.vertical;
          }
        } while (collidingItem);
      }
    }
    return shouldBail;
  }

  /**
   * Adjust vertical positions of the items within a single subgroup such that they
   * don't overlap each other.
   * @param {Item[]} items
   *            All items withina subgroup
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   *            Margins between items and between items and the axis.
   * @param {subgroup} subgroup
   *            The subgroup that is being stacked
   */
  function substack(items, margin, subgroup) {
    for (var i = 0; i < items.length; i++) {
      items[i].top = null;
    }

    // Set the initial height
    let subgroupHeight = subgroup.height;

    // calculate new, non-overlapping positions
    for (i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.stack && item.top === null) {
        // initialize top position
        item.top = item.baseTop;//margin.axis + item.baseTop;

        do {
          // TODO: optimize checking for overlap. when there is a gap without items,
          //       you only need to check for items from the next item on, not from zero
          var collidingItem = null;
          for (let j = 0, jj = items.length; j < jj; j++) {
            const other = items[j];
            if (other.top !== null && other !== item /*&& other.stack*/ && collision(item, other, margin.item, other.options.rtl)) {
              collidingItem = other;
              break;
            }
          }

          if (collidingItem != null) {
            // There is a collision. Reposition the items above the colliding element
            item.top = collidingItem.top + collidingItem.height + margin.item.vertical;// + item.baseTop;
          }

          if (item.top + item.height > subgroupHeight) {
            subgroupHeight = item.top + item.height;
          }
        } while (collidingItem);
      }
    }

    // Set the new height
    subgroup.height = subgroupHeight - subgroup.top + 0.5 * margin.item.vertical;
  }

  /**
   * Adjust vertical positions of the items without stacking them
   * @param {Item[]} items
   *            All visible items
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   *            Margins between items and between items and the axis.
   * @param {subgroups[]} subgroups
   *            All subgroups
   * @param {boolean} isStackSubgroups
   */
  function nostack(items, margin, subgroups, isStackSubgroups) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].data.subgroup == undefined) {
        items[i].top = margin.item.vertical;
      } else if (items[i].data.subgroup !== undefined && isStackSubgroups) {
        let newTop = 0;
        for (const subgroup in subgroups) {
          if (subgroups.hasOwnProperty(subgroup)) {
            if (subgroups[subgroup].visible == true && subgroups[subgroup].index < subgroups[items[i].data.subgroup].index) {
              newTop += subgroups[subgroup].height;
              subgroups[items[i].data.subgroup].top = newTop;
            }
          }
        }
        items[i].top = newTop + 0.5 * margin.item.vertical;
      }
    }
    if (!isStackSubgroups) {
      stackSubgroups(items, margin, subgroups);
    }
  }

  /**
   * Adjust vertical positions of the subgroups such that they don't overlap each
   * other.
   * @param {Array.<timeline.Item>} items
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin Margins between items and between items and the axis.
   * @param {subgroups[]} subgroups
   *            All subgroups
   */
  function stackSubgroups(items, margin, subgroups) {
    for (const subgroup in subgroups) {
      if (subgroups.hasOwnProperty(subgroup)) {


        subgroups[subgroup].top = 0;
        do {
          // TODO: optimize checking for overlap. when there is a gap without items,
          //       you only need to check for items from the next item on, not from zero
          var collidingItem = null;
          for (const otherSubgroup in subgroups) {
            if (subgroups[otherSubgroup].top !== null && otherSubgroup !== subgroup && subgroups[subgroup].index > subgroups[otherSubgroup].index && collisionByTimes(subgroups[subgroup], subgroups[otherSubgroup])) {
              collidingItem = subgroups[otherSubgroup];
              break;
            }
          }

          if (collidingItem != null) {
            // There is a collision. Reposition the subgroups above the colliding element
            subgroups[subgroup].top = collidingItem.top + collidingItem.height;
          }
        } while (collidingItem);
      }
    }
    for (let i = 0; i < items.length; i++) {
      if (items[i].data.subgroup !== undefined) {
        items[i].top = subgroups[items[i].data.subgroup].top + 0.5 * margin.item.vertical;
      }
    }
  }

  /**
   * Adjust vertical positions of the subgroups such that they don't overlap each
   * other, then stacks the contents of each subgroup individually.
   * @param {Item[]} subgroupItems
   *            All the items in a subgroup
   * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
   *            Margins between items and between items and the axis.
   * @param {subgroups[]} subgroups
   *            All subgroups
   */
  function stackSubgroupsWithInnerStack(subgroupItems, margin, subgroups) {
    let doSubStack = false;

    // Run subgroups in their order (if any)
    const subgroupOrder = [];

    for(var subgroup in subgroups) {
      if (subgroups[subgroup].hasOwnProperty("index")) {
        subgroupOrder[subgroups[subgroup].index] = subgroup;
      }
      else {
        subgroupOrder.push(subgroup);
      }
    }

    for(let j = 0; j < subgroupOrder.length; j++) {
      subgroup = subgroupOrder[j];
      if (subgroups.hasOwnProperty(subgroup)) {

        doSubStack = doSubStack || subgroups[subgroup].stack;
        subgroups[subgroup].top = 0;

        for (const otherSubgroup in subgroups) {
          if (subgroups[otherSubgroup].visible && subgroups[subgroup].index > subgroups[otherSubgroup].index) {
            subgroups[subgroup].top += subgroups[otherSubgroup].height;
          }
        }

        const items = subgroupItems[subgroup];
        for(let i = 0; i < items.length; i++) {
          if (items[i].data.subgroup !== undefined) {
            items[i].top = subgroups[items[i].data.subgroup].top + 0.5 * margin.item.vertical;

            if (subgroups[subgroup].stack) {
              items[i].baseTop = items[i].top;
            }
          }
        }

        if (doSubStack && subgroups[subgroup].stack) {
          substack(subgroupItems[subgroup], margin, subgroups[subgroup]);
        }
      }
    }
  }

  /**
   * Test if the two provided items collide
   * The items must have parameters left, width, top, and height.
   * @param {Item} a          The first item
   * @param {Item} b          The second item
   * @param {{horizontal: number, vertical: number}} margin
   *                          An object containing a horizontal and vertical
   *                          minimum required margin.
   * @param {boolean} rtl
   * @return {boolean}        true if a and b collide, else false
   */
  function collision(a, b, margin, rtl) {
    if (rtl) {
      return  ((a.right - margin.horizontal + EPSILON)  < (b.right + b.width) &&
      (a.right + a.width + margin.horizontal - EPSILON) > b.right &&
      (a.top - margin.vertical + EPSILON)              < (b.top + b.height) &&
      (a.top + a.height + margin.vertical - EPSILON)   > b.top);
    } else {
      return ((a.left - margin.horizontal + EPSILON)   < (b.left + b.width) &&
      (a.left + a.width + margin.horizontal - EPSILON) > b.left &&
      (a.top - margin.vertical + EPSILON)              < (b.top + b.height) &&
      (a.top + a.height + margin.vertical - EPSILON)   > b.top);
    }
  }

  /**
   * Test if the two provided objects collide
   * The objects must have parameters start, end, top, and height.
   * @param {Object} a          The first Object
   * @param {Object} b          The second Object
   * @return {boolean}        true if a and b collide, else false
   */
  function collisionByTimes(a, b) {

    // Check for overlap by time and height. Abutting is OK and
    // not considered a collision while overlap is considered a collision.
    const timeOverlap = a.start < b.end && a.end > b.start;
    const heightOverlap = a.top < (b.top + b.height) && (a.top + a.height) > b.top;
    return timeOverlap && heightOverlap;
  }

  var stack$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    orderByStart: orderByStart,
    orderByEnd: orderByEnd,
    stack: stack,
    substack: substack,
    nostack: nostack,
    stackSubgroups: stackSubgroups,
    stackSubgroupsWithInnerStack: stackSubgroupsWithInnerStack,
    collision: collision,
    collisionByTimes: collisionByTimes
  });

  const UNGROUPED$3 = '__ungrouped__';   // reserved group id for ungrouped items
  const BACKGROUND$2 = '__background__'; // reserved group id for background items without group

  const ReservedGroupIds$1 = {
    UNGROUPED: UNGROUPED$3,
    BACKGROUND: BACKGROUND$2
  };


  /**
   * @constructor Group
   */
  class Group {
    /**
   * @param {number | string} groupId
   * @param {Object} data
   * @param {ItemSet} itemSet
   * @constructor Group
   */
    constructor(groupId, data, itemSet) {
      this.groupId = groupId;
      this.subgroups = {};
      this.subgroupStack = {};
      this.subgroupStackAll = false;
      this.subgroupVisibility = {};
      this.doInnerStack = false;
      this.shouldBailStackItems = false;
      this.subgroupIndex = 0;
      this.subgroupOrderer = data && data.subgroupOrder;
      this.itemSet = itemSet;
      this.isVisible = null;
      this.stackDirty = true; // if true, items will be restacked on next redraw

      // This is a stack of functions (`() => void`) that will be executed before
      // the instance is disposed off (method `dispose`). Anything that needs to
      // be manually disposed off before garbage collection happens (or so that
      // garbage collection can happen) should be added to this stack.
      this._disposeCallbacks = [];

      if (data && data.nestedGroups) {
        this.nestedGroups = data.nestedGroups;
        if (data.showNested == false) {
          this.showNested = false;
        } else {
          this.showNested = true;
        }
      }

      if (data && data.subgroupStack) {
        if (typeof data.subgroupStack === "boolean") {
          this.doInnerStack = data.subgroupStack;
          this.subgroupStackAll = data.subgroupStack;
        }
        else {
          // We might be doing stacking on specific sub groups, but only
          // if at least one is set to do stacking
          for(const key in data.subgroupStack) {
            this.subgroupStack[key] = data.subgroupStack[key];
            this.doInnerStack = this.doInnerStack || data.subgroupStack[key];
          }
        }
      }

      if (data && data.heightMode) {
        this.heightMode = data.heightMode;
      } else {
        this.heightMode = itemSet.options.groupHeightMode;
      }

      this.nestedInGroup = null;

      this.dom = {};
      this.props = {
        label: {
          width: 0,
          height: 0
        }
      };
      this.className = null;

      this.items = {};        // items filtered by groupId of this group
      this.visibleItems = []; // items currently visible in window
      this.itemsInRange = []; // items currently in range
      this.orderedItems = {
        byStart: [],
        byEnd: []
      };
      this.checkRangedItems = false; // needed to refresh the ranged items if the window is programatically changed with NO overlap.

      const handleCheckRangedItems = () => {
        this.checkRangedItems = true;
      };
      this.itemSet.body.emitter.on("checkRangedItems", handleCheckRangedItems);
      this._disposeCallbacks.push(() => {
        this.itemSet.body.emitter.off("checkRangedItems", handleCheckRangedItems);
      });

      this._create();

      this.setData(data);
    }

    /**
     * Create DOM elements for the group
     * @private
     */
    _create() {
      const label = document.createElement('div');
      if (this.itemSet.options.groupEditable.order) {
        label.className = 'vis-label draggable';
      } else {
        label.className = 'vis-label';
      }
      this.dom.label = label;

      const inner = document.createElement('div');
      inner.className = 'vis-inner';
      label.appendChild(inner);
      this.dom.inner = inner;

      const foreground = document.createElement('div');
      foreground.className = 'vis-group';
      foreground['vis-group'] = this;
      this.dom.foreground = foreground;

      this.dom.background = document.createElement('div');
      this.dom.background.className = 'vis-group';

      this.dom.axis = document.createElement('div');
      this.dom.axis.className = 'vis-group';

      // create a hidden marker to detect when the Timelines container is attached
      // to the DOM, or the style of a parent of the Timeline is changed from
      // display:none is changed to visible.
      this.dom.marker = document.createElement('div');
      this.dom.marker.style.visibility = 'hidden';
      this.dom.marker.style.position = 'absolute';
      this.dom.marker.innerHTML = '';
      this.dom.background.appendChild(this.dom.marker);
    }

    /**
     * Set the group data for this group
     * @param {Object} data   Group data, can contain properties content and className
     */
    setData(data) {
      if (this.itemSet.groupTouchParams.isDragging) return;

      // update contents
      let content;
      let templateFunction;

      if (data && data.subgroupVisibility) {
        for (const key in data.subgroupVisibility) {
          this.subgroupVisibility[key] = data.subgroupVisibility[key];
        }
      }

      if (this.itemSet.options && this.itemSet.options.groupTemplate) {
        templateFunction = this.itemSet.options.groupTemplate.bind(this);
        content = templateFunction(data, this.dom.inner);
      } else {
        content = data && data.content;
      }

      if (content instanceof Element) {
        while (this.dom.inner.firstChild) {
          this.dom.inner.removeChild(this.dom.inner.firstChild);
        }
        this.dom.inner.appendChild(content);
      } else if (content instanceof Object && content.isReactComponent) ; else if (content instanceof Object) {
        templateFunction(data, this.dom.inner);
      } else if (content !== undefined && content !== null) {
        this.dom.inner.innerHTML = availableUtils.xss(content);
      } else {
        this.dom.inner.innerHTML = availableUtils.xss(this.groupId || ''); // groupId can be null
      }

      // update title
      this.dom.label.title = data && data.title || '';
      if (!this.dom.inner.firstChild) {
        availableUtils.addClassName(this.dom.inner, 'vis-hidden');
      }
      else {
        availableUtils.removeClassName(this.dom.inner, 'vis-hidden');
      }

      if (data && data.nestedGroups) {
        if (!this.nestedGroups || this.nestedGroups != data.nestedGroups) {
          this.nestedGroups = data.nestedGroups;
        }

        if (data.showNested !== undefined || this.showNested === undefined) {
          if (data.showNested == false) {
            this.showNested = false;
          } else {
            this.showNested = true;
          }
        }

        availableUtils.addClassName(this.dom.label, 'vis-nesting-group');
        if (this.showNested) {
          availableUtils.removeClassName(this.dom.label, 'collapsed');
          availableUtils.addClassName(this.dom.label, 'expanded');
        } else {
          availableUtils.removeClassName(this.dom.label, 'expanded');
          availableUtils.addClassName(this.dom.label, 'collapsed');
        }
      } else if (this.nestedGroups) {
        this.nestedGroups = null;
        availableUtils.removeClassName(this.dom.label, 'collapsed');
        availableUtils.removeClassName(this.dom.label, 'expanded');
        availableUtils.removeClassName(this.dom.label, 'vis-nesting-group');
      }

      if (data && (data.treeLevel|| data.nestedInGroup)) {
        availableUtils.addClassName(this.dom.label, 'vis-nested-group');
        if (data.treeLevel) {
          availableUtils.addClassName(this.dom.label, 'vis-group-level-' + data.treeLevel);
        } else {
          // Nesting level is unknown, but we're sure it's at least 1
          availableUtils.addClassName(this.dom.label, 'vis-group-level-unknown-but-gte1');
        }
      } else {
        availableUtils.addClassName(this.dom.label, 'vis-group-level-0');
      }
      
      // update className
      const className = data && data.className || null;
      if (className != this.className) {
        if (this.className) {
          availableUtils.removeClassName(this.dom.label, this.className);
          availableUtils.removeClassName(this.dom.foreground, this.className);
          availableUtils.removeClassName(this.dom.background, this.className);
          availableUtils.removeClassName(this.dom.axis, this.className);
        }
        availableUtils.addClassName(this.dom.label, className);
        availableUtils.addClassName(this.dom.foreground, className);
        availableUtils.addClassName(this.dom.background, className);
        availableUtils.addClassName(this.dom.axis, className);
        this.className = className;
      }

      // update style
      if (this.style) {
        availableUtils.removeCssText(this.dom.label, this.style);
        this.style = null;
      }
      if (data && data.style) {
        availableUtils.addCssText(this.dom.label, data.style);
        this.style = data.style;
      }
    }

    /**
     * Get the width of the group label
     * @return {number} width
     */
    getLabelWidth() {
      return this.props.label.width;
    }

    /**
     * check if group has had an initial height hange
     * @returns {boolean} 
     */
    _didMarkerHeightChange() {
      const markerHeight = this.dom.marker.clientHeight;
      if (markerHeight != this.lastMarkerHeight) {
        this.lastMarkerHeight = markerHeight;
        const redrawQueue = {};
        let redrawQueueLength = 0;

        availableUtils.forEach(this.items, (item, key) => {
          item.dirty = true;
          if (item.displayed) {
            const returnQueue = true;
            redrawQueue[key] = item.redraw(returnQueue);
            redrawQueueLength = redrawQueue[key].length;
          }
        });

        const needRedraw = redrawQueueLength > 0;
        if (needRedraw) {
          // redraw all regular items
          for (let i = 0; i < redrawQueueLength; i++) {
            availableUtils.forEach(redrawQueue, fns => {
              fns[i]();
            });
          }
        }
        return true;
      } else {
        return false;
      }
    }

    /**
     * calculate group dimentions and position
     * @param {number} pixels
     */
    _calculateGroupSizeAndPosition() {
      const { offsetTop, offsetLeft, offsetWidth } = this.dom.foreground;
      this.top = offsetTop;
      this.right = offsetLeft;
      this.width = offsetWidth;
    }

    /**
     * checks if should bail redraw of items
     * @returns {boolean} should bail 
     */
    _shouldBailItemsRedraw() {
      const me = this;
      const timeoutOptions = this.itemSet.options.onTimeout;
      const bailOptions = {
        relativeBailingTime: this.itemSet.itemsSettingTime,
        bailTimeMs: timeoutOptions && timeoutOptions.timeoutMs,
        userBailFunction: timeoutOptions && timeoutOptions.callback,
        shouldBailStackItems: this.shouldBailStackItems
      };
      let bail = null;
      if (!this.itemSet.initialDrawDone) {
        if (bailOptions.shouldBailStackItems) { return true; }
        if (Math.abs(Date.now() - new Date(bailOptions.relativeBailingTime)) > bailOptions.bailTimeMs) {
          if (bailOptions.userBailFunction && this.itemSet.userContinueNotBail == null) {
            bailOptions.userBailFunction(didUserContinue => {
              me.itemSet.userContinueNotBail = didUserContinue;
              bail = !didUserContinue;
            });
          } else if (me.itemSet.userContinueNotBail == false) {
            bail = true;
          } else {
            bail = false;
          }
        }
      }

      return bail;
    }

    /**
     * redraws items
     * @param {boolean} forceRestack
     * @param {boolean} lastIsVisible
     * @param {number} margin
     * @param {object} range
     * @private
     */
    _redrawItems(forceRestack, lastIsVisible, margin, range) {
      const restack = forceRestack || this.stackDirty || this.isVisible && !lastIsVisible;

      // if restacking, reposition visible items vertically
      if (restack) {
        const orderedItems = {
          byEnd: this.orderedItems.byEnd.filter(item => !item.isCluster),
          byStart: this.orderedItems.byStart.filter(item => !item.isCluster)
        };

        const orderedClusters = {
          byEnd: [...new Set(this.orderedItems.byEnd.map(item => item.cluster).filter(item => !!item))],
          byStart: [...new Set(this.orderedItems.byStart.map(item => item.cluster).filter(item => !!item))],
        };

       /**
       * Get all visible items in range
       * @return {array} items
       */
        const getVisibleItems = () => {
          const visibleItems = this._updateItemsInRange(orderedItems, this.visibleItems.filter(item => !item.isCluster), range);
          const visibleClusters = this._updateClustersInRange(orderedClusters, this.visibleItems.filter(item => item.isCluster), range);
          return [...visibleItems, ...visibleClusters];
        };

        /**
         * Get visible items grouped by subgroup
         * @param {function} orderFn An optional function to order items inside the subgroups
         * @return {Object}
         */
        const getVisibleItemsGroupedBySubgroup = orderFn => {
          let visibleSubgroupsItems = {};
          for (const subgroup in this.subgroups) {
            const items = this.visibleItems.filter(item => item.data.subgroup === subgroup);
            visibleSubgroupsItems[subgroup] = orderFn ? items.sort((a, b) => orderFn(a.data, b.data)) : items;
          }
          return visibleSubgroupsItems;
        };

        if (typeof this.itemSet.options.order === 'function') {
          // a custom order function
          //show all items
          const me = this;
          if (this.doInnerStack && this.itemSet.options.stackSubgroups) {
            // Order the items within each subgroup
            const visibleSubgroupsItems = getVisibleItemsGroupedBySubgroup(this.itemSet.options.order);
            stackSubgroupsWithInnerStack(visibleSubgroupsItems, margin, this.subgroups);
            this.visibleItems = getVisibleItems();
            this._updateSubGroupHeights(margin);
          }
          else {
            this.visibleItems = getVisibleItems();
            this._updateSubGroupHeights(margin);
            // order all items and force a restacking
             // order all items outside clusters and force a restacking
            const customOrderedItems = this.visibleItems
                                    .slice()
                                    .filter(item => item.isCluster || (!item.isCluster && !item.cluster))
                                    .sort((a, b) => {
                                        return me.itemSet.options.order(a.data, b.data);
                                    });
            this.shouldBailStackItems = stack(customOrderedItems, margin, true, this._shouldBailItemsRedraw.bind(this));
          }
        } else {
          // no custom order function, lazy stacking
          this.visibleItems = getVisibleItems();
          this._updateSubGroupHeights(margin);

          if (this.itemSet.options.stack) {
            if (this.doInnerStack && this.itemSet.options.stackSubgroups) {
              const visibleSubgroupsItems = getVisibleItemsGroupedBySubgroup();
              stackSubgroupsWithInnerStack(visibleSubgroupsItems, margin, this.subgroups);
            }
            else {
              // TODO: ugly way to access options...
              this.shouldBailStackItems = stack(this.visibleItems, margin, true, this._shouldBailItemsRedraw.bind(this));
            }
          } else {
            // no stacking
            nostack(this.visibleItems, margin, this.subgroups, this.itemSet.options.stackSubgroups);
          }
        }

        for (let i = 0; i < this.visibleItems.length; i++) {
          this.visibleItems[i].repositionX();
          if (this.subgroupVisibility[this.visibleItems[i].data.subgroup] !== undefined) {
            if (!this.subgroupVisibility[this.visibleItems[i].data.subgroup]) {
              this.visibleItems[i].hide();
            }
          }
        }

        if (this.itemSet.options.cluster) {
          availableUtils.forEach(this.items, item => {
            if (item.cluster && item.displayed) {
              item.hide();
            }
          });
        }

        if (this.shouldBailStackItems) {
          this.itemSet.body.emitter.emit('destroyTimeline');
        }
        this.stackDirty = false;
      }
    }

    /**
     * check if group resized
     * @param {boolean} resized
     * @param {number} height
     * @return {boolean} did resize
     */
    _didResize(resized, height) {
      resized = availableUtils.updateProperty(this, 'height', height) || resized;
      // recalculate size of label
      const labelWidth = this.dom.inner.clientWidth;
      const labelHeight = this.dom.inner.clientHeight;
      resized = availableUtils.updateProperty(this.props.label, 'width', labelWidth) || resized;
      resized = availableUtils.updateProperty(this.props.label, 'height', labelHeight) || resized;
      return resized;
    }

    /**
     * apply group height
     * @param {number} height
     */
    _applyGroupHeight(height) {
      this.dom.background.style.height = `${height}px`;
      this.dom.foreground.style.height = `${height}px`;
      this.dom.label.style.height = `${height}px`;
    }

    /**
     * update vertical position of items after they are re-stacked and the height of the group is calculated
     * @param {number} margin
     */
    _updateItemsVerticalPosition(margin) {
      for (let i = 0, ii = this.visibleItems.length; i < ii; i++) {
        const item = this.visibleItems[i];
        item.repositionY(margin);
        if (!this.isVisible && this.groupId != ReservedGroupIds$1.BACKGROUND) {
          if (item.displayed) item.hide();
        }
      }
    }

    /**
     * Repaint this group
     * @param {{start: number, end: number}} range
     * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
     * @param {boolean} [forceRestack=false]  Force restacking of all items
     * @param {boolean} [returnQueue=false]  return the queue or if the group resized
     * @return {boolean} Returns true if the group is resized or the redraw queue if returnQueue=true
     */
    redraw(range, margin, forceRestack, returnQueue) {
      let resized = false;
      const lastIsVisible = this.isVisible;
      let height;

      const queue = [
        () => {
          forceRestack = this._didMarkerHeightChange.call(this) || forceRestack;
        },
        
        // recalculate the height of the subgroups
        this._updateSubGroupHeights.bind(this, margin),

        // calculate actual size and position
        this._calculateGroupSizeAndPosition.bind(this),

        () => {
          this.isVisible = this._isGroupVisible.bind(this)(range, margin);
        },
        
        () => {
          this._redrawItems.bind(this)(forceRestack, lastIsVisible, margin, range);
        },

        // update subgroups
        this._updateSubgroupsSizes.bind(this),

        () => {
          height = this._calculateHeight.bind(this)(margin);
        },

        // calculate actual size and position again
        this._calculateGroupSizeAndPosition.bind(this),

        () => {
          resized = this._didResize.bind(this)(resized, height);
        },

        () => {
          this._applyGroupHeight.bind(this)(height);
        },

        () => {
          this._updateItemsVerticalPosition.bind(this)(margin);
        },

        (() => {
          if (!this.isVisible && this.height) {
            resized = false;
          }
          return resized
        }).bind(this)
      ];

      if (returnQueue) {
        return queue;
      } else {
        let result;
        queue.forEach(fn => {
          result = fn();
        });
        return result;
      }
    }

    /**
     * recalculate the height of the subgroups
     *
     * @param {{item: timeline.Item}} margin
     * @private
     */
    _updateSubGroupHeights(margin) {
      if (Object.keys(this.subgroups).length > 0) {
        const me = this;

        this._resetSubgroups();

        availableUtils.forEach(this.visibleItems, item => {
          if (item.data.subgroup !== undefined) {
            me.subgroups[item.data.subgroup].height = Math.max(me.subgroups[item.data.subgroup].height, item.height + margin.item.vertical);
            me.subgroups[item.data.subgroup].visible = typeof this.subgroupVisibility[item.data.subgroup] === 'undefined' ? true : Boolean(this.subgroupVisibility[item.data.subgroup]);
          }
        });
      }
    }

    /**
     * check if group is visible
     *
     * @param {timeline.Range} range
     * @param {{axis: timeline.DataAxis}} margin
     * @returns {boolean} is visible
     * @private
     */
    _isGroupVisible(range, margin) {
      return (this.top <= range.body.domProps.centerContainer.height - range.body.domProps.scrollTop + margin.axis)
      && (this.top + this.height + margin.axis >= - range.body.domProps.scrollTop);
    }

    /**
     * recalculate the height of the group
     * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
     * @returns {number} Returns the height
     * @private
     */
    _calculateHeight(margin) {
      // recalculate the height of the group
      let height;

      let items;

      if (this.heightMode === 'fixed') {
        items = availableUtils.toArray(this.items);
      } else {
        // default or 'auto'
        items = this.visibleItems;
      }

      if (items.length > 0) {
        let min = items[0].top;
        let max = items[0].top + items[0].height;
        availableUtils.forEach(items, item => {
          min = Math.min(min, item.top);
          max = Math.max(max, (item.top + item.height));
        });
        if (min > margin.axis) {
          // there is an empty gap between the lowest item and the axis
          const offset = min - margin.axis;
          max -= offset;
          availableUtils.forEach(items, item => {
            item.top -= offset;
          });
        }
        height = Math.ceil(max + margin.item.vertical / 2);
        if (this.heightMode !== "fitItems") {
          height = Math.max(height, this.props.label.height);
        }
      }
      else {
        height = this.props.label.height;
      }
      return height;
    }

    /**
     * Show this group: attach to the DOM
     */
    show() {
      if (!this.dom.label.parentNode) {
        this.itemSet.dom.labelSet.appendChild(this.dom.label);
      }

      if (!this.dom.foreground.parentNode) {
        this.itemSet.dom.foreground.appendChild(this.dom.foreground);
      }

      if (!this.dom.background.parentNode) {
        this.itemSet.dom.background.appendChild(this.dom.background);
      }

      if (!this.dom.axis.parentNode) {
        this.itemSet.dom.axis.appendChild(this.dom.axis);
      }
    }

    /**
     * Hide this group: remove from the DOM
     */
    hide() {
      const label = this.dom.label;
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }

      const foreground = this.dom.foreground;
      if (foreground.parentNode) {
        foreground.parentNode.removeChild(foreground);
      }

      const background = this.dom.background;
      if (background.parentNode) {
        background.parentNode.removeChild(background);
      }

      const axis = this.dom.axis;
      if (axis.parentNode) {
        axis.parentNode.removeChild(axis);
      }
    }

    /**
     * Add an item to the group
     * @param {Item} item
     */
    add(item) {
      this.items[item.id] = item;
      item.setParent(this);
      this.stackDirty = true;
      // add to
      if (item.data.subgroup !== undefined) {
        this._addToSubgroup(item);
        this.orderSubgroups();
      }

      if (!this.visibleItems.includes(item)) {
        const range = this.itemSet.body.range; // TODO: not nice accessing the range like this
        this._checkIfVisible(item, this.visibleItems, range);
      }
    }

    /**
     * add item to subgroup
     * @param {object} item
     * @param {string} subgroupId
     */
    _addToSubgroup(item, subgroupId=item.data.subgroup) {
      if (subgroupId != undefined && this.subgroups[subgroupId] === undefined) {
        this.subgroups[subgroupId] = {
          height: 0,
          top: 0,
          start: item.data.start,
          end: item.data.end || item.data.start,
          visible: false,
          index: this.subgroupIndex,
          items: [],
          stack: this.subgroupStackAll || this.subgroupStack[subgroupId] || false
        };
        this.subgroupIndex++;
      }


      if (new Date(item.data.start) < new Date(this.subgroups[subgroupId].start)) {
        this.subgroups[subgroupId].start = item.data.start;
      }

      const itemEnd = item.data.end || item.data.start;
      if (new Date(itemEnd) > new Date(this.subgroups[subgroupId].end)) {
        this.subgroups[subgroupId].end = itemEnd;
      }

      this.subgroups[subgroupId].items.push(item);
    }

    /**
     * update subgroup sizes
     */
    _updateSubgroupsSizes() {
      const me = this;
      if (me.subgroups) {
        for (const subgroup in me.subgroups) {
          const initialEnd = me.subgroups[subgroup].items[0].data.end || me.subgroups[subgroup].items[0].data.start;
          let newStart = me.subgroups[subgroup].items[0].data.start;
          let newEnd = initialEnd - 1;

          me.subgroups[subgroup].items.forEach(item => {
            if (new Date(item.data.start) < new Date(newStart)) {
              newStart = item.data.start;
            }

            const itemEnd = item.data.end || item.data.start;
            if (new Date(itemEnd) > new Date(newEnd)) {
              newEnd = itemEnd;
            }
          });

          me.subgroups[subgroup].start = newStart;
          me.subgroups[subgroup].end = new Date(newEnd - 1); // -1 to compensate for colliding end to start subgroups;

        }
      }
    }

    /**
     * order subgroups
     */
    orderSubgroups() {
      if (this.subgroupOrderer !== undefined) {
        const sortArray = [];
        if (typeof this.subgroupOrderer == 'string') {
          for (const subgroup in this.subgroups) {
            sortArray.push({subgroup, sortField: this.subgroups[subgroup].items[0].data[this.subgroupOrderer]});
          }
          sortArray.sort((a, b) => a.sortField - b.sortField);
        }
        else if (typeof this.subgroupOrderer == 'function') {
          for (const subgroup in this.subgroups) {
            sortArray.push(this.subgroups[subgroup].items[0].data);
          }
          sortArray.sort(this.subgroupOrderer);
        }

        if (sortArray.length > 0) {
          for (let i = 0; i < sortArray.length; i++) {
            this.subgroups[sortArray[i].subgroup].index = i;
          }
        }
      }
    }

    /**
     * add item to subgroup
     */
    _resetSubgroups() {
      for (const subgroup in this.subgroups) {
        if (this.subgroups.hasOwnProperty(subgroup)) {
          this.subgroups[subgroup].visible = false;
          this.subgroups[subgroup].height = 0;
        }
      }
    }

    /**
     * Remove an item from the group
     * @param {Item} item
     */
    remove(item) {
      delete this.items[item.id];
      item.setParent(null);
      this.stackDirty = true;

      // remove from visible items
      const index = this.visibleItems.indexOf(item);
      if (index != -1) this.visibleItems.splice(index, 1);

      if(item.data.subgroup !== undefined){
        this._removeFromSubgroup(item);
        this.orderSubgroups();
      }
    }

    /**
     * remove item from subgroup
     * @param {object} item
     * @param {string} subgroupId
     */
    _removeFromSubgroup(item, subgroupId=item.data.subgroup) {
      if (subgroupId != undefined) {
        const subgroup = this.subgroups[subgroupId];
        if (subgroup){
          const itemIndex = subgroup.items.indexOf(item);
          //  Check the item is actually in this subgroup. How should items not in the group be handled?
          if (itemIndex >= 0) {
            subgroup.items.splice(itemIndex,1);
            if (!subgroup.items.length){
              delete this.subgroups[subgroupId];
            } else {
              this._updateSubgroupsSizes();
            }
          }
        }
      }
    }

    /**
     * Remove an item from the corresponding DataSet
     * @param {Item} item
     */
    removeFromDataSet(item) {
      this.itemSet.removeItem(item.id);
    }

    /**
     * Reorder the items
     */
    order() {
      const array = availableUtils.toArray(this.items);
      const startArray = [];
      const endArray = [];

      for (let i = 0; i < array.length; i++) {
        if (array[i].data.end !== undefined) {
          endArray.push(array[i]);
        }
        startArray.push(array[i]);
      }
      this.orderedItems = {
        byStart: startArray,
        byEnd: endArray
      };

      orderByStart(this.orderedItems.byStart);
      orderByEnd(this.orderedItems.byEnd);
    }

    /**
     * Update the visible items
     * @param {{byStart: Item[], byEnd: Item[]}} orderedItems   All items ordered by start date and by end date
     * @param {Item[]} oldVisibleItems                          The previously visible items.
     * @param {{start: number, end: number}} range              Visible range
     * @return {Item[]} visibleItems                            The new visible items.
     * @private
     */
    _updateItemsInRange(orderedItems, oldVisibleItems, range) {
      const visibleItems = [];
      const visibleItemsLookup = {}; // we keep this to quickly look up if an item already exists in the list without using indexOf on visibleItems

      if (!this.isVisible && this.groupId != ReservedGroupIds$1.BACKGROUND) {
        for (let i = 0; i < oldVisibleItems.length; i++) {
          var item = oldVisibleItems[i];
          if (item.displayed) item.hide();
        }
        return visibleItems;
      } 

      const interval = (range.end - range.start) / 4;
      const lowerBound = range.start - interval;
      const upperBound = range.end + interval;

      // this function is used to do the binary search for items having start date only.
      const startSearchFunction = value => {
        if      (value < lowerBound)  {return -1;}
        else if (value <= upperBound) {return  0;}
        else                          {return  1;}
      };

      // this function is used to do the binary search for items having start and end dates (range).
      const endSearchFunction = data => {
        const {start, end} = data;
        if      (end < lowerBound)    {return -1;}
        else if (start <= upperBound) {return  0;}
        else                          {return  1;}
      };

      // first check if the items that were in view previously are still in view.
      // IMPORTANT: this handles the case for the items with startdate before the window and enddate after the window!
      // also cleans up invisible items.
      if (oldVisibleItems.length > 0) {
        for (let i = 0; i < oldVisibleItems.length; i++) {
          this._checkIfVisibleWithReference(oldVisibleItems[i], visibleItems, visibleItemsLookup, range);
        }
      }

      // we do a binary search for the items that have only start values.
      const initialPosByStart = availableUtils.binarySearchCustom(orderedItems.byStart, startSearchFunction, 'data','start');

      // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the start values.
      this._traceVisible(initialPosByStart, orderedItems.byStart, visibleItems, visibleItemsLookup, item => item.data.start < lowerBound || item.data.start > upperBound);

      // if the window has changed programmatically without overlapping the old window, the ranged items with start < lowerBound and end > upperbound are not shown.
      // We therefore have to brute force check all items in the byEnd list
      if (this.checkRangedItems == true) {
        this.checkRangedItems = false;
        for (let i = 0; i < orderedItems.byEnd.length; i++) {
          this._checkIfVisibleWithReference(orderedItems.byEnd[i], visibleItems, visibleItemsLookup, range);
        }
      }
      else {
        // we do a binary search for the items that have defined end times.
        const initialPosByEnd = availableUtils.binarySearchCustom(orderedItems.byEnd, endSearchFunction, 'data');

        // trace the visible items from the inital start pos both ways until an invisible item is found, we only look at the end values.
        this._traceVisible(initialPosByEnd, orderedItems.byEnd, visibleItems, visibleItemsLookup, item => item.data.end < lowerBound || item.data.start > upperBound);
      }

      const redrawQueue = {};
      let redrawQueueLength = 0;

      for (let i = 0; i < visibleItems.length; i++) {
        const item = visibleItems[i];
        if (!item.displayed) {
          const returnQueue = true;
          redrawQueue[i] = item.redraw(returnQueue);
          redrawQueueLength = redrawQueue[i].length;
        }
      }

      const needRedraw = redrawQueueLength > 0;
      if (needRedraw) {
        // redraw all regular items
        for (let j = 0; j < redrawQueueLength; j++) {
          availableUtils.forEach(redrawQueue, fns => {
            fns[j]();
          });
        }
      }

      for (let i = 0; i < visibleItems.length; i++) {
        visibleItems[i].repositionX();
      }

      return visibleItems;
    }

    /**
     * trace visible items in group
     * @param {number} initialPos
     * @param {array} items
     * @param {aray} visibleItems
     * @param {object} visibleItemsLookup
     * @param {function} breakCondition
     */
    _traceVisible(initialPos, items, visibleItems, visibleItemsLookup, breakCondition) {
      if (initialPos != -1) {
        for (let i = initialPos; i >= 0; i--) {
          let item = items[i];
          if (breakCondition(item)) {
            break;
          }
          else {
            if (!(item.isCluster  && !item.hasItems()) && !item.cluster) {
              if (visibleItemsLookup[item.id] === undefined) {
                visibleItemsLookup[item.id] = true;
                visibleItems.push(item);
              }
            }
          }
        }

        for (let i = initialPos + 1; i < items.length; i++) {
          let item = items[i];
          if (breakCondition(item)) {
            break;
          }
          else {
            if (!(item.isCluster && !item.hasItems()) && !item.cluster) {
              if (visibleItemsLookup[item.id] === undefined) {
                visibleItemsLookup[item.id] = true;
                visibleItems.push(item);
              }
            }
          }
        }
      }
    }

    /**
     * this function is very similar to the _checkIfInvisible() but it does not
     * return booleans, hides the item if it should not be seen and always adds to
     * the visibleItems.
     * this one is for brute forcing and hiding.
     *
     * @param {Item} item
     * @param {Array} visibleItems
     * @param {{start:number, end:number}} range
     * @private
     */
    _checkIfVisible(item, visibleItems, range) {
        if (item.isVisible(range)) {
          if (!item.displayed) item.show();
          // reposition item horizontally
          item.repositionX();
          visibleItems.push(item);
        }
        else {
          if (item.displayed) item.hide();
        }
    }

    /**
     * this function is very similar to the _checkIfInvisible() but it does not
     * return booleans, hides the item if it should not be seen and always adds to
     * the visibleItems.
     * this one is for brute forcing and hiding.
     *
     * @param {Item} item
     * @param {Array.<timeline.Item>} visibleItems
     * @param {Object<number, boolean>} visibleItemsLookup
     * @param {{start:number, end:number}} range
     * @private
     */
    _checkIfVisibleWithReference(item, visibleItems, visibleItemsLookup, range) {
      if (item.isVisible(range)) {
        if (visibleItemsLookup[item.id] === undefined) {
          visibleItemsLookup[item.id] = true;
          visibleItems.push(item);
        }
      }
      else {
        if (item.displayed) item.hide();
      }
    }

    /**
     * Update the visible items
     * @param {array} orderedClusters 
     * @param {array} oldVisibleClusters                         
     * @param {{start: number, end: number}} range             
     * @return {Item[]} visibleItems                            
     * @private
     */
    _updateClustersInRange(orderedClusters, oldVisibleClusters, range) {
      // Clusters can overlap each other so we cannot use binary search here
      const visibleClusters = [];
      const visibleClustersLookup = {}; // we keep this to quickly look up if an item already exists in the list without using indexOf on visibleItems
    
      if (oldVisibleClusters.length > 0) {
        for (let i = 0; i < oldVisibleClusters.length; i++) {
          this._checkIfVisibleWithReference(oldVisibleClusters[i], visibleClusters, visibleClustersLookup, range);
        }
      }
    
      for (let i = 0; i < orderedClusters.byStart.length; i++) {
        this._checkIfVisibleWithReference(orderedClusters.byStart[i], visibleClusters, visibleClustersLookup, range);
      }
    
      for (let i = 0; i < orderedClusters.byEnd.length; i++) {
        this._checkIfVisibleWithReference(orderedClusters.byEnd[i], visibleClusters, visibleClustersLookup, range);
      }
    
      const redrawQueue = {};
      let redrawQueueLength = 0;
    
      for (let i = 0; i < visibleClusters.length; i++) {
        const item = visibleClusters[i];
        if (!item.displayed) {
          const returnQueue = true;
          redrawQueue[i] = item.redraw(returnQueue);
          redrawQueueLength = redrawQueue[i].length;
        }
      }
    
      const needRedraw = redrawQueueLength > 0;
      if (needRedraw) {
        // redraw all regular items
        for (var j = 0; j < redrawQueueLength; j++) {
          availableUtils.forEach(redrawQueue, function (fns) {
            fns[j]();
          });
        }
      }
    
      for (let i = 0; i < visibleClusters.length; i++) {
        visibleClusters[i].repositionX();
      }
      
      return visibleClusters;
    }

    /**
     * change item subgroup
     * @param {object} item
     * @param {string} oldSubgroup
     * @param {string} newSubgroup
     */
    changeSubgroup(item, oldSubgroup, newSubgroup) {
      this._removeFromSubgroup(item, oldSubgroup);
      this._addToSubgroup(item, newSubgroup);
      this.orderSubgroups();
    }

    /**
     * Call this method before you lose the last reference to an instance of this.
     * It will remove listeners etc.
     */
    dispose() {
      this.hide();

      let disposeCallback;
      while ((disposeCallback = this._disposeCallbacks.pop())) {
        disposeCallback();
      }
    }
  }

  /**
   * @constructor BackgroundGroup
   * @extends Group
   */
  class BackgroundGroup extends Group {
    /**
   * @param {number | string} groupId
   * @param {Object} data
   * @param {ItemSet} itemSet
   */
    constructor(groupId, data, itemSet) {
      super(groupId, data, itemSet);
      // Group.call(this, groupId, data, itemSet);

      this.width = 0;
      this.height = 0;
      this.top = 0;
      this.left = 0;
    }

    /**
     * Repaint this group
     * @param {{start: number, end: number}} range
     * @param {{item: {horizontal: number, vertical: number}, axis: number}} margin
     * @param {boolean} [forceRestack=false]  Force restacking of all items
     * @return {boolean} Returns true if the group is resized
     */
    redraw(range, margin, forceRestack) {  // eslint-disable-line no-unused-vars
      const resized = false;

      this.visibleItems = this._updateItemsInRange(this.orderedItems, this.visibleItems, range);

      // calculate actual size
      this.width = this.dom.background.offsetWidth;

      // apply new height (just always zero for BackgroundGroup
      this.dom.background.style.height  = '0';

      // update vertical position of items after they are re-stacked and the height of the group is calculated
      for (let i = 0, ii = this.visibleItems.length; i < ii; i++) {
        const item = this.visibleItems[i];
        item.repositionY(margin);
      }

      return resized;
    }

    /**
     * Show this group: attach to the DOM
     */
    show() {
      if (!this.dom.background.parentNode) {
        this.itemSet.dom.background.appendChild(this.dom.background);
      }
    }
  }

  /**
   * Item
   */
  class Item {
    /**
   * @constructor Item
   * @param {Object} data             Object containing (optional) parameters type,
   *                                  start, end, content, group, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} options          Configuration options
   *                                  // TODO: describe available options
   */
    constructor(data, conversion, options) {
      this.id = null;
      this.parent = null;
      this.data = data;
      this.dom = null;
      this.conversion = conversion || {};
      this.defaultOptions = {
        locales,
        locale: 'en'
      };
      this.options = availableUtils.extend({}, this.defaultOptions, options);
      this.options.locales = availableUtils.extend({}, locales, this.options.locales);
      const defaultLocales = this.defaultOptions.locales[this.defaultOptions.locale];
      Object.keys(this.options.locales).forEach(locale => {
        this.options.locales[locale] = availableUtils.extend(
          {},
          defaultLocales,
          this.options.locales[locale]
        );
      });
      this.selected = false;
      this.displayed = false;
      this.groupShowing = true;
      this.selectable = (options && options.selectable) || false;
      this.dirty = true;

      this.top = null;
      this.right = null;
      this.left = null;
      this.width = null;
      this.height = null;

      this.setSelectability(data);

      this.editable = null;
      this._updateEditStatus();
    }

    /**
     * Select current item
     */
    select() {
      if (this.selectable) {
        this.selected = true;
        this.dirty = true;
        if (this.displayed) this.redraw();
      }
    }

    /**
     * Unselect current item
     */
    unselect() {
      this.selected = false;
      this.dirty = true;
      if (this.displayed) this.redraw();
    }

    /**
     * Set data for the item. Existing data will be updated. The id should not
     * be changed. When the item is displayed, it will be redrawn immediately.
     * @param {Object} data
     */
    setData(data) {
      const groupChanged = data.group != undefined && this.data.group != data.group;
      if (groupChanged && this.parent != null) {
        this.parent.itemSet._moveToGroup(this, data.group);
      }

      this.setSelectability(data);

      if (this.parent) {
        this.parent.stackDirty = true;
      }
      
      const subGroupChanged = data.subgroup != undefined && this.data.subgroup != data.subgroup;
      if (subGroupChanged && this.parent != null) {
        this.parent.changeSubgroup(this, this.data.subgroup, data.subgroup);
      }

      this.data = data;
      this._updateEditStatus();
      this.dirty = true;
      if (this.displayed) this.redraw();
    }

    /**
     * Set whether the item can be selected.
     * Can only be set/unset if the timeline's `selectable` configuration option is `true`.
     * @param {Object} data `data` from `constructor` and `setData`
     */
    setSelectability(data) {
      if (data) {
        this.selectable = typeof data.selectable === 'undefined' ? true : Boolean(data.selectable);
      }
    }

    /**
     * Set a parent for the item
     * @param {Group} parent
     */
    setParent(parent) {
      if (this.displayed) {
        this.hide();
        this.parent = parent;
        if (this.parent) {
          this.show();
        }
      }
      else {
        this.parent = parent;
      }
    }

    /**
     * Check whether this item is visible inside given range
     * @param {timeline.Range} range with a timestamp for start and end
     * @returns {boolean} True if visible
     */
    isVisible(range) {  // eslint-disable-line no-unused-vars
      return false;
    }

    /**
     * Show the Item in the DOM (when not already visible)
     * @return {Boolean} changed
     */
    show() {
      return false;
    }

    /**
     * Hide the Item from the DOM (when visible)
     * @return {Boolean} changed
     */
    hide() {
      return false;
    }

    /**
     * Repaint the item
     */
    redraw() {
      // should be implemented by the item
    }

    /**
     * Reposition the Item horizontally
     */
    repositionX() {
      // should be implemented by the item
    }

    /**
     * Reposition the Item vertically
     */
    repositionY() {
      // should be implemented by the item
    }

    /**
     * Repaint a drag area on the center of the item when the item is selected
     * @protected
     */
    _repaintDragCenter() {
      if (this.selected && this.editable.updateTime && !this.dom.dragCenter) {
        const me = this;
        // create and show drag area
        const dragCenter = document.createElement('div');
        dragCenter.className = 'vis-drag-center';
        dragCenter.dragCenterItem = this;
        this.hammerDragCenter = new Hammer(dragCenter);

        this.hammerDragCenter.on('tap', event => {
          me.parent.itemSet.body.emitter.emit('click',  {
            event,
            item: me.id
          });
        });
        this.hammerDragCenter.on('doubletap', event => {
          event.stopPropagation();
          me.parent.itemSet._onUpdateItem(me);
          me.parent.itemSet.body.emitter.emit('doubleClick', {
            event,
            item: me.id
          });
        });
        this.hammerDragCenter.on('panstart', event => {
          // do not allow this event to propagate to the Range
          event.stopPropagation();
          me.parent.itemSet._onDragStart(event);
        });
        this.hammerDragCenter.on('panmove',  me.parent.itemSet._onDrag.bind(me.parent.itemSet));
        this.hammerDragCenter.on('panend',   me.parent.itemSet._onDragEnd.bind(me.parent.itemSet));
        // delay addition on item click for trackpads...
        this.hammerDragCenter.get('press').set({time:10000});

        if (this.dom.box) {
          if (this.dom.dragLeft) {
            this.dom.box.insertBefore(dragCenter, this.dom.dragLeft);
          }
          else {
            this.dom.box.appendChild(dragCenter);
          }
        }
        else if (this.dom.point) {
          this.dom.point.appendChild(dragCenter);
        }
        
        this.dom.dragCenter = dragCenter;
      }
      else if (!this.selected && this.dom.dragCenter) {
        // delete drag area
        if (this.dom.dragCenter.parentNode) {
          this.dom.dragCenter.parentNode.removeChild(this.dom.dragCenter);
        }
        this.dom.dragCenter = null;
        
        if (this.hammerDragCenter) {
          this.hammerDragCenter.destroy();
          this.hammerDragCenter = null;
        }
      }
    }

    /**
     * Repaint a delete button on the top right of the item when the item is selected
     * @param {HTMLElement} anchor
     * @protected
     */
    _repaintDeleteButton(anchor) {
      const editable = ((this.options.editable.overrideItems || this.editable == null) && this.options.editable.remove) ||
                     (!this.options.editable.overrideItems && this.editable != null && this.editable.remove);

      if (this.selected && editable && !this.dom.deleteButton) {
        // create and show button
        const me = this;

        const deleteButton = document.createElement('div');

        if (this.options.rtl) {
          deleteButton.className = 'vis-delete-rtl';
        } else {
          deleteButton.className = 'vis-delete';
        }
        let optionsLocale = this.options.locales[this.options.locale];
        if (!optionsLocale) {
          if (!this.warned) {
            console.warn(`WARNING: options.locales['${this.options.locale}'] not found. See https://visjs.github.io/vis-timeline/docs/timeline/#Localization`);
            this.warned = true;
          }
          optionsLocale = this.options.locales['en']; // fall back on english when not available
        }
        deleteButton.title = optionsLocale.deleteSelected;

        // TODO: be able to destroy the delete button
        this.hammerDeleteButton = new Hammer(deleteButton).on('tap', event => {
          event.stopPropagation();
          me.parent.removeFromDataSet(me);
        });

        anchor.appendChild(deleteButton);
        this.dom.deleteButton = deleteButton;
      }
      else if ((!this.selected || !editable) && this.dom.deleteButton) {
        // remove button
        if (this.dom.deleteButton.parentNode) {
          this.dom.deleteButton.parentNode.removeChild(this.dom.deleteButton);
        }
        this.dom.deleteButton = null;

        if (this.hammerDeleteButton) {
          this.hammerDeleteButton.destroy();
          this.hammerDeleteButton = null;
        }
      }
    }

    /**
     * Repaint a onChange tooltip on the top right of the item when the item is selected
     * @param {HTMLElement} anchor
     * @protected
     */
    _repaintOnItemUpdateTimeTooltip(anchor) {
      if (!this.options.tooltipOnItemUpdateTime) return;

      const editable = (this.options.editable.updateTime || 
                      this.data.editable === true) &&
                     this.data.editable !== false;

      if (this.selected && editable && !this.dom.onItemUpdateTimeTooltip) {
        const onItemUpdateTimeTooltip = document.createElement('div');

        onItemUpdateTimeTooltip.className = 'vis-onUpdateTime-tooltip';
        anchor.appendChild(onItemUpdateTimeTooltip);
        this.dom.onItemUpdateTimeTooltip = onItemUpdateTimeTooltip;

      } else if (!this.selected && this.dom.onItemUpdateTimeTooltip) {
        // remove button
        if (this.dom.onItemUpdateTimeTooltip.parentNode) {
          this.dom.onItemUpdateTimeTooltip.parentNode.removeChild(this.dom.onItemUpdateTimeTooltip);
        }
        this.dom.onItemUpdateTimeTooltip = null;
      }

      // position onChange tooltip
      if (this.dom.onItemUpdateTimeTooltip) {

        // only show when editing
        this.dom.onItemUpdateTimeTooltip.style.visibility = this.parent.itemSet.touchParams.itemIsDragging ? 'visible' : 'hidden';
        
        // position relative to item's content
        this.dom.onItemUpdateTimeTooltip.style.transform = 'translateX(-50%)';
        this.dom.onItemUpdateTimeTooltip.style.left = '50%';

        // position above or below the item depending on the item's position in the window
        const tooltipOffset = 50; // TODO: should be tooltip height (depends on template)
        const scrollTop = this.parent.itemSet.body.domProps.scrollTop;

          // TODO: this.top for orientation:true is actually the items distance from the bottom... 
          // (should be this.bottom)
        let itemDistanceFromTop; 
        if (this.options.orientation.item == 'top') {
          itemDistanceFromTop = this.top;
        } else {
          itemDistanceFromTop = (this.parent.height - this.top - this.height);
        }
        const isCloseToTop = itemDistanceFromTop + this.parent.top - tooltipOffset < -scrollTop;

        if (isCloseToTop) {
          this.dom.onItemUpdateTimeTooltip.style.bottom = "";
          this.dom.onItemUpdateTimeTooltip.style.top = `${this.height + 2}px`;
        } else {
          this.dom.onItemUpdateTimeTooltip.style.top = "";
          this.dom.onItemUpdateTimeTooltip.style.bottom = `${this.height + 2}px`;
        }
        
        // handle tooltip content
        let content;
        let templateFunction;

        if (this.options.tooltipOnItemUpdateTime && this.options.tooltipOnItemUpdateTime.template) {
          templateFunction = this.options.tooltipOnItemUpdateTime.template.bind(this);
          content = templateFunction(this.data);
        } else {
          content = `start: ${moment$2(this.data.start).format('MM/DD/YYYY hh:mm')}`;
          if (this.data.end) { 
            content += `<br> end: ${moment$2(this.data.end).format('MM/DD/YYYY hh:mm')}`;
          }
        }
        this.dom.onItemUpdateTimeTooltip.innerHTML = availableUtils.xss(content);
      }
    }

     /**
     * get item data
     * @return {object}
     * @private
     */
    _getItemData() {
      return this.parent.itemSet.itemsData.get(this.id);
    }

    /**
     * Set HTML contents for the item
     * @param {Element} element   HTML element to fill with the contents
     * @private
     */
    _updateContents(element) {
      let content;
      let changed;
      let templateFunction;
      let itemVisibleFrameContent;
      let visibleFrameTemplateFunction; 
      const itemData = this._getItemData(); // get a clone of the data from the dataset

      const frameElement = this.dom.box || this.dom.point;
      const itemVisibleFrameContentElement = frameElement.getElementsByClassName('vis-item-visible-frame')[0];

      if (this.options.visibleFrameTemplate) {
        visibleFrameTemplateFunction = this.options.visibleFrameTemplate.bind(this);
        itemVisibleFrameContent = availableUtils.xss(visibleFrameTemplateFunction(itemData, itemVisibleFrameContentElement));
      } else {
        itemVisibleFrameContent = '';
      }
      
      if (itemVisibleFrameContentElement) {
        if ((itemVisibleFrameContent instanceof Object) && !(itemVisibleFrameContent instanceof Element)) {
          visibleFrameTemplateFunction(itemData, itemVisibleFrameContentElement);
        } else {
           changed = this._contentToString(this.itemVisibleFrameContent) !== this._contentToString(itemVisibleFrameContent);
           if (changed) {
            // only replace the content when changed
            if (itemVisibleFrameContent instanceof Element) {
              itemVisibleFrameContentElement.innerHTML = '';
              itemVisibleFrameContentElement.appendChild(itemVisibleFrameContent);
            }
            else if (itemVisibleFrameContent != undefined) {
              itemVisibleFrameContentElement.innerHTML = availableUtils.xss(itemVisibleFrameContent);
            }
            else {
              if (!(this.data.type == 'background' && this.data.content === undefined)) {
                throw new Error(`Property "content" missing in item ${this.id}`);
              }
            }

            this.itemVisibleFrameContent = itemVisibleFrameContent;
           }
        }
      }

      if (this.options.template) {
        templateFunction = this.options.template.bind(this);
        content = templateFunction(itemData, element, this.data);
      } else {
        content = this.data.content;
      }

      if ((content instanceof Object) && !(content instanceof Element)) {
        templateFunction(itemData, element);
      } else {
        changed = this._contentToString(this.content) !== this._contentToString(content);
        if (changed) {
          // only replace the content when changed
          if (content instanceof Element) {
            element.innerHTML = '';
            element.appendChild(content);
          }
          else if (content != undefined) {
            element.innerHTML = availableUtils.xss(content);
          }
          else {
            if (!(this.data.type == 'background' && this.data.content === undefined)) {
              throw new Error(`Property "content" missing in item ${this.id}`);
            }
          }
          this.content = content;
        }
      }
    }

    /**
     * Process dataAttributes timeline option and set as data- attributes on dom.content
     * @param {Element} element   HTML element to which the attributes will be attached
     * @private
     */
    _updateDataAttributes(element) {
     if (this.options.dataAttributes && this.options.dataAttributes.length > 0) {
       let attributes = [];

       if (Array.isArray(this.options.dataAttributes)) {
         attributes = this.options.dataAttributes;
       }
       else if (this.options.dataAttributes == 'all') {
         attributes = Object.keys(this.data);
       }
       else {
         return;
       }

       for (const name of attributes) {
         const value = this.data[name];

         if (value != null) {
           element.setAttribute(`data-${name}`, value);
         }
         else {
           element.removeAttribute(`data-${name}`);
         }
       }
     }
   }

    /**
     * Update custom styles of the element
     * @param {Element} element
     * @private
     */
    _updateStyle(element) {
      // remove old styles
      if (this.style) {
        availableUtils.removeCssText(element, this.style);
        this.style = null;
      }

      // append new styles
      if (this.data.style) {
        availableUtils.addCssText(element, this.data.style);
        this.style = this.data.style;
      }
    }

    /**
     * Stringify the items contents
     * @param {string | Element | undefined} content
     * @returns {string | undefined}
     * @private
     */
    _contentToString(content) {
      if (typeof content === 'string') return content;
      if (content && 'outerHTML' in content) return content.outerHTML;
      return content;
    }

    /**
     * Update the editability of this item.
     */
    _updateEditStatus() {
      if (this.options) {
        if(typeof this.options.editable === 'boolean') {
          this.editable = {
            updateTime: this.options.editable,
            updateGroup: this.options.editable,
            remove: this.options.editable
          };
        } else if(typeof this.options.editable === 'object') {
            this.editable = {};
            availableUtils.selectiveExtend(['updateTime', 'updateGroup', 'remove'], this.editable, this.options.editable);
        }
      }
      // Item data overrides, except if options.editable.overrideItems is set.
      if (!this.options || !(this.options.editable) || (this.options.editable.overrideItems !== true)) {
        if (this.data) {
          if (typeof this.data.editable === 'boolean') {
            this.editable = {
              updateTime: this.data.editable,
              updateGroup: this.data.editable,
              remove: this.data.editable
            };
          } else if (typeof this.data.editable === 'object') {
            // TODO: in timeline.js 5.0, we should change this to not reset options from the timeline configuration.
            // Basically just remove the next line...
            this.editable = {};
            availableUtils.selectiveExtend(['updateTime', 'updateGroup', 'remove'], this.editable, this.data.editable);
          }
        }
      }
    }

    /**
     * Return the width of the item left from its start date
     * @return {number}
     */
    getWidthLeft() {
      return 0;
    }

    /**
     * Return the width of the item right from the max of its start and end date
     * @return {number}
     */
    getWidthRight() {
      return 0;
    }

    /**
     * Return the title of the item
     * @return {string | undefined}
     */
    getTitle() {
      if (this.options.tooltip && this.options.tooltip.template) {
        const templateFunction = this.options.tooltip.template.bind(this);
        return templateFunction(this._getItemData(), this.data);
      }

      return this.data.title;
    }
  }

  Item.prototype.stack = true;

  /**
   * @constructor BoxItem
   * @extends Item
   */
  class BoxItem extends Item {
    /**
   * @param {Object} data             Object containing parameters start
   *                                  content, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} [options]        Configuration options
   *                                  // TODO: describe available options
   */
    constructor(data, conversion, options) {
      super(data, conversion, options);
      this.props = {
        dot: {
          width: 0,
          height: 0
        },
        line: {
          width: 0,
          height: 0
        }
      };
      // validate data
      if (data) {
        if (data.start == undefined) {
          throw new Error(`Property "start" missing in item ${data}`);
        }
      }
    }

    /**
     * Check whether this item is visible inside given range
     * @param {{start: number, end: number}} range with a timestamp for start and end
     * @returns {boolean} True if visible
     */
    isVisible(range) {
      if (this.cluster) {
        return false;
      }
      // determine visibility
      let isVisible;
      const align = this.data.align || this.options.align;
      const widthInMs = this.width * range.getMillisecondsPerPixel();

      if (align == 'right') {
        isVisible = (this.data.start.getTime() > range.start) && (this.data.start.getTime() - widthInMs < range.end);
      }
      else if (align == 'left') {
        isVisible = (this.data.start.getTime() + widthInMs > range.start) && (this.data.start.getTime() < range.end);
      }
      else {
        // default or 'center'
        isVisible = (this.data.start.getTime() + widthInMs / 2 > range.start ) && (this.data.start.getTime() - widthInMs/2 < range.end);
      }
      return isVisible;
    }

     /**
     * create DOM element
     * @private
     */
    _createDomElement() {
      if (!this.dom) {
        // create DOM
        this.dom = {};

        // create main box
        this.dom.box = document.createElement('DIV');

        // contents box (inside the background box). used for making margins
        this.dom.content = document.createElement('DIV');
        this.dom.content.className = 'vis-item-content';
        this.dom.box.appendChild(this.dom.content);

        // line to axis
        this.dom.line = document.createElement('DIV');
        this.dom.line.className = 'vis-line';

        // dot on axis
        this.dom.dot = document.createElement('DIV');
        this.dom.dot.className = 'vis-dot';

        // attach this item as attribute
        this.dom.box['vis-item'] = this;

        this.dirty = true;
      }
    }

    /**
     * append DOM element
     * @private
     */
    _appendDomElement() {
      if (!this.parent) {
        throw new Error('Cannot redraw item: no parent attached');
      }
      if (!this.dom.box.parentNode) {
        const foreground = this.parent.dom.foreground;
        if (!foreground) throw new Error('Cannot redraw item: parent has no foreground container element');
        foreground.appendChild(this.dom.box);
      }
      if (!this.dom.line.parentNode) {
        var background = this.parent.dom.background;
        if (!background) throw new Error('Cannot redraw item: parent has no background container element');
        background.appendChild(this.dom.line);
      }
      if (!this.dom.dot.parentNode) {
        const axis = this.parent.dom.axis;
        if (!background) throw new Error('Cannot redraw item: parent has no axis container element');
        axis.appendChild(this.dom.dot);
      }
      this.displayed = true;
    }

    /**
     * update dirty DOM element
     * @private
     */
    _updateDirtyDomComponents() {
      // An item is marked dirty when:
      // - the item is not yet rendered
      // - the item's data is changed
      // - the item is selected/deselected
      if (this.dirty) {
        this._updateContents(this.dom.content);
        this._updateDataAttributes(this.dom.box);
        this._updateStyle(this.dom.box);

        const editable = (this.editable.updateTime || this.editable.updateGroup);

        // update class
        const className = (this.data.className ? ' ' + this.data.className : '') +
          (this.selected ? ' vis-selected' : '') +
          (editable ? ' vis-editable' : ' vis-readonly');
        this.dom.box.className = `vis-item vis-box${className}`;
        this.dom.line.className = `vis-item vis-line${className}`;
        this.dom.dot.className = `vis-item vis-dot${className}`;
      }
    }

    /**
     * get DOM components sizes
     * @return {object}
     * @private
     */
    _getDomComponentsSizes() {
      return {
        previous: {
          right: this.dom.box.style.right,
          left: this.dom.box.style.left
        },
        dot: {
          height: this.dom.dot.offsetHeight,
          width: this.dom.dot.offsetWidth
        },
        line: {
          width: this.dom.line.offsetWidth
        },
        box: {
          width: this.dom.box.offsetWidth,
          height: this.dom.box.offsetHeight
        }
      }
    }

    /**
     * update DOM components sizes
     * @param {object} sizes
     * @private
     */
    _updateDomComponentsSizes(sizes) {
      if (this.options.rtl) {
        this.dom.box.style.right = "0px";
      } else {
        this.dom.box.style.left = "0px";
      }

      // recalculate size
      this.props.dot.height = sizes.dot.height;
      this.props.dot.width = sizes.dot.width;
      this.props.line.width = sizes.line.width;
      this.width = sizes.box.width;
      this.height = sizes.box.height;

      // restore previous position
      if (this.options.rtl) {
        this.dom.box.style.right = sizes.previous.right;
      } else {
        this.dom.box.style.left = sizes.previous.left;
      }

      this.dirty = false;
    }

    /**
     * repaint DOM additionals
     * @private
     */
    _repaintDomAdditionals() {
      this._repaintOnItemUpdateTimeTooltip(this.dom.box);
      this._repaintDragCenter();
      this._repaintDeleteButton(this.dom.box);
    }

    /**
     * Repaint the item
     * @param {boolean} [returnQueue=false]  return the queue
     * @return {boolean} the redraw queue if returnQueue=true
     */
    redraw(returnQueue) {
      let sizes;
      const queue = [
        // create item DOM
        this._createDomElement.bind(this),

        // append DOM to parent DOM
        this._appendDomElement.bind(this),

        // update dirty DOM
        this._updateDirtyDomComponents.bind(this),

        () => {
          if (this.dirty) {
            sizes = this._getDomComponentsSizes();
          }
        },

        () => {
          if (this.dirty) {
            this._updateDomComponentsSizes.bind(this)(sizes);
          }
        },

        // repaint DOM additionals
        this._repaintDomAdditionals.bind(this)
      ];

      if (returnQueue) {
        return queue;
      } else {
        let result;
        queue.forEach(fn => {
          result = fn();
        });
        return result;
      }
    }

    /**
     * Show the item in the DOM (when not already visible). The items DOM will
     * be created when needed.
     * @param {boolean} [returnQueue=false]  whether to return a queue of functions to execute instead of just executing them
     * @return {boolean} the redraw queue if returnQueue=true
     */
    show(returnQueue) {
      if (!this.displayed) {
        return this.redraw(returnQueue);
      }
    }

    /**
     * Hide the item from the DOM (when visible)
     */
    hide() {
      if (this.displayed) {
        const dom = this.dom;

        if (dom.box.remove) dom.box.remove();
        else if (dom.box.parentNode) dom.box.parentNode.removeChild(dom.box); // IE11

        if (dom.line.remove) dom.line.remove();
        else if (dom.line.parentNode) dom.line.parentNode.removeChild(dom.line); // IE11
        
        if (dom.dot.remove) dom.dot.remove();
        else if (dom.dot.parentNode) dom.dot.parentNode.removeChild(dom.dot); // IE11

        this.displayed = false;
      }
    }

    /**
     * Reposition the item XY
     */
    repositionXY() {
      const rtl = this.options.rtl;

      const repositionXY = (element, x, y, rtl = false) => {
        if (x === undefined && y === undefined) return;
        // If rtl invert the number.
        const directionX = rtl ? (x * -1) : x;

        //no y. translate x
        if (y === undefined) {
          element.style.transform = `translateX(${directionX}px)`;
          return;
        }

        //no x. translate y
        if (x === undefined) {
          element.style.transform = `translateY(${y}px)`;
          return;
        }

        element.style.transform = `translate(${directionX}px, ${y}px)`;
      };
      repositionXY(this.dom.box, this.boxX, this.boxY, rtl);
      repositionXY(this.dom.dot, this.dotX, this.dotY, rtl);
      repositionXY(this.dom.line, this.lineX, this.lineY, rtl);
    }

    /**
     * Reposition the item horizontally
     * @Override
     */
    repositionX() {
      const start = this.conversion.toScreen(this.data.start);
      const align = this.data.align === undefined ? this.options.align : this.data.align;
      const lineWidth = this.props.line.width;
      const dotWidth = this.props.dot.width;
      
      if (align == 'right') {
        // calculate right position of the box
        this.boxX = start - this.width;
        this.lineX = start - lineWidth;
        this.dotX = start - lineWidth / 2 - dotWidth / 2;
      }
      else if (align == 'left') {
        // calculate left position of the box
        this.boxX = start;
        this.lineX = start;
        this.dotX = start + lineWidth / 2 - dotWidth / 2;
      }
      else {
        // default or 'center'
        this.boxX = start - this.width / 2;
        this.lineX = this.options.rtl ? start - lineWidth : start - lineWidth / 2;
        this.dotX = start - dotWidth / 2;
      }

      if (this.options.rtl)
        this.right = this.boxX;
      else
        this.left = this.boxX;

      this.repositionXY();
    }

    /**
     * Reposition the item vertically
     * @Override
     */
    repositionY() {
      const orientation = this.options.orientation.item;
      const lineStyle = this.dom.line.style;

      if (orientation == 'top') {
        const lineHeight = this.parent.top + this.top + 1;

        this.boxY = this.top || 0;
        lineStyle.height = `${lineHeight}px`;
        lineStyle.bottom = '';
        lineStyle.top = '0';
      }
      else { // orientation 'bottom'
        const itemSetHeight = this.parent.itemSet.props.height; // TODO: this is nasty
        const lineHeight = itemSetHeight - this.parent.top - this.parent.height + this.top;

        this.boxY = this.parent.height - this.top - (this.height || 0);
        lineStyle.height = `${lineHeight}px`;
        lineStyle.top = '';
        lineStyle.bottom = '0';
      }

      this.dotY = -this.props.dot.height / 2;

      this.repositionXY();
    }

    /**
     * Return the width of the item left from its start date
     * @return {number}
     */
    getWidthLeft() {
      return this.width / 2;
    }

    /**
     * Return the width of the item right from its start date
     * @return {number}
     */
    getWidthRight() {
      return this.width / 2;
    }
  }

  /**
   * @constructor PointItem
   * @extends Item
   */
  class PointItem extends Item {
    /**
   * @param {Object} data             Object containing parameters start
   *                                  content, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} [options]        Configuration options
   *                                  // TODO: describe available options
   */
    constructor(data, conversion, options) {
      super(data, conversion, options);
      this.props = {
        dot: {
          top: 0,
          width: 0,
          height: 0
        },
        content: {
          height: 0,
          marginLeft: 0,
          marginRight: 0
        }
      };
      // validate data
      if (data) {
        if (data.start == undefined) {
          throw new Error(`Property "start" missing in item ${data}`);
        }
      }
    }

    /**
     * Check whether this item is visible inside given range
     * @param {{start: number, end: number}} range with a timestamp for start and end
     * @returns {boolean} True if visible
     */
    isVisible(range) {
      if (this.cluster) {
        return false;
      }
      // determine visibility
      const widthInMs = this.width * range.getMillisecondsPerPixel();

      return (this.data.start.getTime() + widthInMs > range.start ) && (this.data.start < range.end);
    }

    /**
     * create DOM element
     * @private
     */
    _createDomElement() {
      if (!this.dom) {
        // create DOM
        this.dom = {};

        // background box
        this.dom.point = document.createElement('div');
        // className is updated in redraw()

        // contents box, right from the dot
        this.dom.content = document.createElement('div');
        this.dom.content.className = 'vis-item-content';
        this.dom.point.appendChild(this.dom.content);

        // dot at start
        this.dom.dot = document.createElement('div');
        this.dom.point.appendChild(this.dom.dot);

        // attach this item as attribute
        this.dom.point['vis-item'] = this;

        this.dirty = true;
      }
    }

    /**
     * append DOM element
     * @private
     */
    _appendDomElement() {
      if (!this.parent) {
        throw new Error('Cannot redraw item: no parent attached');
      }
      if (!this.dom.point.parentNode) {
        const foreground = this.parent.dom.foreground;
        if (!foreground) {
          throw new Error('Cannot redraw item: parent has no foreground container element');
        }
        foreground.appendChild(this.dom.point);
      }
      this.displayed = true;
    }

    /**
     * update dirty DOM components
     * @private
     */
    _updateDirtyDomComponents() {
      // An item is marked dirty when:
      // - the item is not yet rendered
      // - the item's data is changed
      // - the item is selected/deselected
      if (this.dirty) {
        this._updateContents(this.dom.content);
        this._updateDataAttributes(this.dom.point);
        this._updateStyle(this.dom.point);

        const editable = (this.editable.updateTime || this.editable.updateGroup);
        // update class
        const className = (this.data.className ? ' ' + this.data.className : '') +
            (this.selected ? ' vis-selected' : '') +
            (editable ? ' vis-editable' : ' vis-readonly');
        this.dom.point.className  = `vis-item vis-point${className}`;
        this.dom.dot.className  = `vis-item vis-dot${className}`;
      }
    }

    /**
     * get DOM component sizes
     * @return {object}
     * @private
     */
    _getDomComponentsSizes() {
      return {
        dot:  {
          width: this.dom.dot.offsetWidth,
          height: this.dom.dot.offsetHeight
        },
        content: {
          width: this.dom.content.offsetWidth,
          height: this.dom.content.offsetHeight
        },
        point: {
          width: this.dom.point.offsetWidth,
          height: this.dom.point.offsetHeight
        }
      }
    }

    /**
     * update DOM components sizes
     * @param {array} sizes
     * @private
     */
    _updateDomComponentsSizes(sizes) {
      // recalculate size of dot and contents
      this.props.dot.width = sizes.dot.width;
      this.props.dot.height = sizes.dot.height;
      this.props.content.height = sizes.content.height;

      // resize contents
      if (this.options.rtl) {
        this.dom.content.style.marginRight = `${this.props.dot.width / 2}px`;
      } else {
        this.dom.content.style.marginLeft = `${this.props.dot.width / 2}px`;
      }
      //this.dom.content.style.marginRight = ... + 'px'; // TODO: margin right

      // recalculate size
      this.width = sizes.point.width;
      this.height = sizes.point.height;

      // reposition the dot
      this.dom.dot.style.top = `${(this.height - this.props.dot.height) / 2}px`;

      const dotWidth = this.props.dot.width;
      const translateX = this.options.rtl ? dotWidth / 2 : (dotWidth / 2) * -1;
      this.dom.dot.style.transform = `translateX(${translateX}px`;
      this.dirty = false;
    }

    /**
     * Repain DOM additionals
     * @private
     */
    _repaintDomAdditionals() {
      this._repaintOnItemUpdateTimeTooltip(this.dom.point);
      this._repaintDragCenter();
      this._repaintDeleteButton(this.dom.point);
    }

    /**
     * Repaint the item
     * @param {boolean} [returnQueue=false]  return the queue
     * @return {boolean} the redraw queue if returnQueue=true
     */
    redraw(returnQueue) {
      let sizes;
      const queue = [
        // create item DOM
        this._createDomElement.bind(this),

        // append DOM to parent DOM
        this._appendDomElement.bind(this),

        // update dirty DOM
        this._updateDirtyDomComponents.bind(this),

        () => {
          if (this.dirty) {
            sizes = this._getDomComponentsSizes();
          }
        },

        () => {
          if (this.dirty) {
            this._updateDomComponentsSizes.bind(this)(sizes);
          }
        },

        // repaint DOM additionals
        this._repaintDomAdditionals.bind(this)
      ];

      if (returnQueue) {
        return queue;
      } else {
        let result;
        queue.forEach(fn => {
          result = fn();
        });
        return result;
      }
    }


    /**
     * Reposition XY
     */
    repositionXY() {
      const rtl = this.options.rtl;

      const repositionXY = (element, x, y, rtl = false) => {
        if (x === undefined && y === undefined) return;
        // If rtl invert the number.
        const directionX = rtl ? (x * -1) : x;

        //no y. translate x
        if (y === undefined) {
          element.style.transform = `translateX(${directionX}px)`;
          return;
        }

        //no x. translate y
        if (x === undefined) {
          element.style.transform = `translateY(${y}px)`;
          return;
        }

        element.style.transform = `translate(${directionX}px, ${y}px)`;
      };
      repositionXY(this.dom.point, this.pointX, this.pointY, rtl);
    }

    /**
     * Show the item in the DOM (when not already visible). The items DOM will
     * be created when needed.
     * @param {boolean} [returnQueue=false]  whether to return a queue of functions to execute instead of just executing them
     * @return {boolean} the redraw queue if returnQueue=true
     */
    show(returnQueue) {
      if (!this.displayed) {
        return this.redraw(returnQueue);
      }
    }

    /**
     * Hide the item from the DOM (when visible)
     */
    hide() {
      if (this.displayed) {
        if (this.dom.point.parentNode) {
          this.dom.point.parentNode.removeChild(this.dom.point);
        }

        this.displayed = false;
      }
    }

    /**
     * Reposition the item horizontally
     * @Override
     */
    repositionX() {
      const start = this.conversion.toScreen(this.data.start);

      this.pointX = start;
      if (this.options.rtl) {
        this.right = start - this.props.dot.width;
      } else {
        this.left = start - this.props.dot.width;
      }

      this.repositionXY();
    }

    /**
     * Reposition the item vertically
     * @Override
     */
    repositionY() {
      const orientation = this.options.orientation.item;
      if (orientation == 'top') {
        this.pointY = this.top;
      }
      else {
        this.pointY = this.parent.height - this.top - this.height;
      }

      this.repositionXY();
    }

    /**
     * Return the width of the item left from its start date
     * @return {number}
     */
    getWidthLeft() {
      return this.props.dot.width;
    }

    /**
     * Return the width of the item right from  its start date
     * @return {number}
     */
    getWidthRight() {
      return this.props.dot.width;
    }
  }

  /**
   * @constructor RangeItem
   * @extends Item
   */
  class RangeItem extends Item {
    /**
   * @param {Object} data             Object containing parameters start, end
   *                                  content, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} [options]        Configuration options
   *                                  // TODO: describe options
   */
    constructor(data, conversion, options) {
      super(data, conversion, options);
      this.props = {
        content: {
          width: 0
        }
      };
      this.overflow = false; // if contents can overflow (css styling), this flag is set to true
      // validate data
      if (data) {
        if (data.start == undefined) {
          throw new Error(`Property "start" missing in item ${data.id}`);
        }
        if (data.end == undefined) {
          throw new Error(`Property "end" missing in item ${data.id}`);
        }
      }
    }

    /**
     * Check whether this item is visible inside given range
     *
     * @param {timeline.Range} range with a timestamp for start and end
     * @returns {boolean} True if visible
     */
    isVisible(range) {
      if (this.cluster) {
        return false;
      }
      // determine visibility
      return (this.data.start < range.end) && (this.data.end > range.start);
    }

    /**
     * create DOM elements
     * @private
     */
    _createDomElement() {
      if (!this.dom) {
        // create DOM
        this.dom = {};

          // background box
        this.dom.box = document.createElement('div');
        // className is updated in redraw()

        // frame box (to prevent the item contents from overflowing)
        this.dom.frame = document.createElement('div');
        this.dom.frame.className = 'vis-item-overflow';
        this.dom.box.appendChild(this.dom.frame);
      
        // visible frame box (showing the frame that is always visible)
        this.dom.visibleFrame = document.createElement('div');
        this.dom.visibleFrame.className = 'vis-item-visible-frame';
        this.dom.box.appendChild(this.dom.visibleFrame);

        // contents box
        this.dom.content = document.createElement('div');
        this.dom.content.className = 'vis-item-content';
        this.dom.frame.appendChild(this.dom.content);

        // attach this item as attribute
        this.dom.box['vis-item'] = this;

        this.dirty = true;
      }

    }

    /**
     * append element to DOM
     * @private
     */
    _appendDomElement() {
      if (!this.parent) {
        throw new Error('Cannot redraw item: no parent attached');
      }
      if (!this.dom.box.parentNode) {
        const foreground = this.parent.dom.foreground;
        if (!foreground) {
          throw new Error('Cannot redraw item: parent has no foreground container element');
        }
        foreground.appendChild(this.dom.box);
      }
      this.displayed = true;
    }

    /**
     * update dirty DOM components
     * @private
     */
    _updateDirtyDomComponents() {
      // update dirty DOM. An item is marked dirty when:
      // - the item is not yet rendered
      // - the item's data is changed
      // - the item is selected/deselected
      if (this.dirty) {
        this._updateContents(this.dom.content);
        this._updateDataAttributes(this.dom.box);
        this._updateStyle(this.dom.box);

        const editable = (this.editable.updateTime || this.editable.updateGroup);

        // update class
        const className = (this.data.className ? (' ' + this.data.className) : '') +
            (this.selected ? ' vis-selected' : '') + 
            (editable ? ' vis-editable' : ' vis-readonly');
        this.dom.box.className = this.baseClassName + className;

        // turn off max-width to be able to calculate the real width
        // this causes an extra browser repaint/reflow, but so be it
        this.dom.content.style.maxWidth = 'none';
      }
    }

    /**
     * get DOM component sizes
     * @return {object}
     * @private
     */
    _getDomComponentsSizes() {
      // determine from css whether this box has overflow
      this.overflow = window.getComputedStyle(this.dom.frame).overflow !== 'hidden';
      this.whiteSpace = window.getComputedStyle(this.dom.content).whiteSpace !== 'nowrap';
      return {
        content: {
          width: this.dom.content.offsetWidth,
        },
        box: {
          height: this.dom.box.offsetHeight
        }
      }
    }

    /**
     * update DOM component sizes
     * @param {array} sizes
     * @private
     */
    _updateDomComponentsSizes(sizes) {
      this.props.content.width = sizes.content.width;
      this.height = sizes.box.height;
      this.dom.content.style.maxWidth = '';
      this.dirty = false;
    }

    /**
     * repaint DOM additional components
     * @private
     */
    _repaintDomAdditionals() {
      this._repaintOnItemUpdateTimeTooltip(this.dom.box);
      this._repaintDeleteButton(this.dom.box);
      this._repaintDragCenter();
      this._repaintDragLeft();
      this._repaintDragRight();
    }

    /**
     * Repaint the item
     * @param {boolean} [returnQueue=false]  return the queue
     * @return {boolean} the redraw queue if returnQueue=true
     */
    redraw(returnQueue) {
      let sizes;
      const queue = [
        // create item DOM
        this._createDomElement.bind(this),

        // append DOM to parent DOM
        this._appendDomElement.bind(this),

        // update dirty DOM 
        this._updateDirtyDomComponents.bind(this),

        () => {
          if (this.dirty) {
            sizes = this._getDomComponentsSizes.bind(this)();
          }
        },

        () => {
          if (this.dirty) {
            this._updateDomComponentsSizes.bind(this)(sizes);
          }
        },

        // repaint DOM additionals
        this._repaintDomAdditionals.bind(this)
      ];

      if (returnQueue) {
        return queue;
      } else {
        let result;
        queue.forEach(fn => {
          result = fn();
        });
        return result;
      }
    }

    /**
     * Show the item in the DOM (when not already visible). The items DOM will
     * be created when needed.
     * @param {boolean} [returnQueue=false]  whether to return a queue of functions to execute instead of just executing them
     * @return {boolean} the redraw queue if returnQueue=true
     */
    show(returnQueue) {
      if (!this.displayed) {
        return this.redraw(returnQueue);
      }
    }

    /**
     * Hide the item from the DOM (when visible)
     */
    hide() {
      if (this.displayed) {
        const box = this.dom.box;

        if (box.parentNode) {
          box.parentNode.removeChild(box);
        }

        this.displayed = false;
      }
    }

    /**
     * Reposition the item horizontally
     * @param {boolean} [limitSize=true] If true (default), the width of the range
     *                                   item will be limited, as the browser cannot
     *                                   display very wide divs. This means though
     *                                   that the applied left and width may
     *                                   not correspond to the ranges start and end
     * @Override
     */
    repositionX(limitSize) {
      const parentWidth = this.parent.width;
      let start = this.conversion.toScreen(this.data.start);
      let end = this.conversion.toScreen(this.data.end);
      const align = this.data.align === undefined ? this.options.align : this.data.align;
      let contentStartPosition;
      let contentWidth;

      // limit the width of the range, as browsers cannot draw very wide divs
      // unless limitSize: false is explicitly set in item data
      if (this.data.limitSize !== false && (limitSize === undefined || limitSize === true)) {
        if (start < -parentWidth) {
          start = -parentWidth;
        }
        if (end > 2 * parentWidth) {
          end = 2 * parentWidth;
        }
      }

      //round to 3 decimals to compensate floating-point values rounding
      const boxWidth = Math.max(Math.round((end - start) * 1000) / 1000, 1);

      if (this.overflow) {
        if (this.options.rtl) {
          this.right = start;
        } else {
          this.left = start;
        }
        this.width = boxWidth + this.props.content.width;
        contentWidth = this.props.content.width;

        // Note: The calculation of width is an optimistic calculation, giving
        //       a width which will not change when moving the Timeline
        //       So no re-stacking needed, which is nicer for the eye;
      }
      else {
        if (this.options.rtl) {
          this.right = start;
        } else {
          this.left = start;
        }
        this.width = boxWidth;
        contentWidth = Math.min(end - start, this.props.content.width);
      }

      if (this.options.rtl) {
        this.dom.box.style.transform = `translateX(${this.right * -1}px)`;
      } else {
        this.dom.box.style.transform = `translateX(${this.left}px)`;
      }
      this.dom.box.style.width = `${boxWidth}px`;
      if (this.whiteSpace) {
          this.height = this.dom.box.offsetHeight;
      }

      switch (align) {
        case 'left':
          this.dom.content.style.transform = 'translateX(0)';
          break;

        case 'right':
          if (this.options.rtl) {
            const translateX = Math.max((boxWidth - contentWidth), 0) * -1;
            this.dom.content.style.transform = `translateX(${translateX}px)`;
          } else {
            this.dom.content.style.transform = `translateX(${Math.max((boxWidth - contentWidth), 0)}px)`;
          }
          break;

        case 'center':
          if (this.options.rtl) {
            const translateX = Math.max((boxWidth - contentWidth) / 2, 0) * -1;
            this.dom.content.style.transform = `translateX(${translateX}px)`;
          } else {
            this.dom.content.style.transform = `translateX(${Math.max((boxWidth - contentWidth) / 2, 0)}px)`;
          }
          
          break;

        default: // 'auto'
          // when range exceeds left of the window, position the contents at the left of the visible area
          if (this.overflow) {
            if (end > 0) {
              contentStartPosition = Math.max(-start, 0);
            }
            else {
              contentStartPosition = -contentWidth; // ensure it's not visible anymore
            }
          }
          else {
            if (start < 0) {
              contentStartPosition = -start;
            }
            else {
              contentStartPosition = 0;
            }
          }
          if (this.options.rtl) {
            const translateX = contentStartPosition * -1;
            this.dom.content.style.transform = `translateX(${translateX}px)`;
          } else {
            this.dom.content.style.transform = `translateX(${contentStartPosition}px)`;
            // this.dom.content.style.width = `calc(100% - ${contentStartPosition}px)`;
          }
      }
    }

    /**
     * Reposition the item vertically
     * @Override
     */
    repositionY() {
      const orientation = this.options.orientation.item;
      const box = this.dom.box;

      if (orientation == 'top') {
        box.style.top = `${this.top}px`;
      }
      else {
        box.style.top = `${this.parent.height - this.top - this.height}px`;
      }
    }

    /**
     * Repaint a drag area on the left side of the range when the range is selected
     * @protected
     */
    _repaintDragLeft() {
      if ((this.selected || this.options.itemsAlwaysDraggable.range) && this.editable.updateTime && !this.dom.dragLeft) {
        // create and show drag area
        const dragLeft = document.createElement('div');
        dragLeft.className = 'vis-drag-left';
        dragLeft.dragLeftItem = this;

        this.dom.box.appendChild(dragLeft);
        this.dom.dragLeft = dragLeft;
      }
      else if (!this.selected && !this.options.itemsAlwaysDraggable.range && this.dom.dragLeft) {
        // delete drag area
        if (this.dom.dragLeft.parentNode) {
          this.dom.dragLeft.parentNode.removeChild(this.dom.dragLeft);
        }
        this.dom.dragLeft = null;
      }
    }

    /**
     * Repaint a drag area on the right side of the range when the range is selected
     * @protected
     */
    _repaintDragRight() {
      if ((this.selected || this.options.itemsAlwaysDraggable.range) && this.editable.updateTime && !this.dom.dragRight) {
        // create and show drag area
        const dragRight = document.createElement('div');
        dragRight.className = 'vis-drag-right';
        dragRight.dragRightItem = this;

        this.dom.box.appendChild(dragRight);
        this.dom.dragRight = dragRight;
      }
      else if (!this.selected && !this.options.itemsAlwaysDraggable.range && this.dom.dragRight) {
        // delete drag area
        if (this.dom.dragRight.parentNode) {
          this.dom.dragRight.parentNode.removeChild(this.dom.dragRight);
        }
        this.dom.dragRight = null;
      }
    }
  }

  RangeItem.prototype.baseClassName = 'vis-item vis-range';

  /**
   * @constructor BackgroundItem
   * @extends Item
   */
  class BackgroundItem extends Item {
    /**
   * @constructor BackgroundItem
   * @param {Object} data             Object containing parameters start, end
   *                                  content, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} [options]        Configuration options
   *                                  // TODO: describe options
   * // TODO: implement support for the BackgroundItem just having a start, then being displayed as a sort of an annotation
   */
    constructor(data, conversion, options) {
      super(data, conversion, options);
      this.props = {
        content: {
          width: 0
        }
      };
      this.overflow = false; // if contents can overflow (css styling), this flag is set to true

      // validate data
      if (data) {
        if (data.start == undefined) {
          throw new Error(`Property "start" missing in item ${data.id}`);
        }
        if (data.end == undefined) {
          throw new Error(`Property "end" missing in item ${data.id}`);
        }
      }
    }

    /**
     * Check whether this item is visible inside given range
     * @param {timeline.Range} range with a timestamp for start and end
     * @returns {boolean} True if visible
     */
    isVisible(range) {
      // determine visibility
      return (this.data.start < range.end) && (this.data.end > range.start); 
    }

    /**
     * create DOM element
     * @private
     */
    _createDomElement() {
      if (!this.dom) {
        // create DOM
        this.dom = {};

        // background box
        this.dom.box = document.createElement('div');
        // className is updated in redraw()

        // frame box (to prevent the item contents from overflowing
        this.dom.frame = document.createElement('div');
        this.dom.frame.className = 'vis-item-overflow';
        this.dom.box.appendChild(this.dom.frame);

        // contents box
        this.dom.content = document.createElement('div');
        this.dom.content.className = 'vis-item-content';
        this.dom.frame.appendChild(this.dom.content);

        // Note: we do NOT attach this item as attribute to the DOM,
        //       such that background items cannot be selected
        //this.dom.box['vis-item'] = this;

        this.dirty = true;
      }
    }

    /**
     * append DOM element
     * @private
     */
    _appendDomElement() {
      if (!this.parent) {
        throw new Error('Cannot redraw item: no parent attached');
      }
      if (!this.dom.box.parentNode) {
        const background = this.parent.dom.background;
        if (!background) {
          throw new Error('Cannot redraw item: parent has no background container element');
        }
        background.appendChild(this.dom.box);
      }
      this.displayed = true;
    }

    /**
     * update DOM Dirty components
     * @private
     */
    _updateDirtyDomComponents() {
      // update dirty DOM. An item is marked dirty when:
      // - the item is not yet rendered
      // - the item's data is changed
      // - the item is selected/deselected
      if (this.dirty) {
        this._updateContents(this.dom.content);
        this._updateDataAttributes(this.dom.content);
        this._updateStyle(this.dom.box);

        // update class
        const className = (this.data.className ? (' ' + this.data.className) : '') +
            (this.selected ? ' vis-selected' : '');
        this.dom.box.className = this.baseClassName + className;
      }
    }

    /**
     * get DOM components sizes
     * @return {object}
     * @private
     */
    _getDomComponentsSizes() {
      // determine from css whether this box has overflow
      this.overflow = window.getComputedStyle(this.dom.content).overflow !== 'hidden';
      return {
        content: {
          width: this.dom.content.offsetWidth
        }
      }
    }

    /**
     * update DOM components sizes
     * @param {object} sizes
     * @private
     */
    _updateDomComponentsSizes(sizes) {
      // recalculate size
      this.props.content.width = sizes.content.width;
      this.height = 0; // set height zero, so this item will be ignored when stacking items

      this.dirty = false;
    }

    /**
     * repaint DOM additionals
     * @private
     */
    _repaintDomAdditionals() {
    }

    /**
     * Repaint the item
     * @param {boolean} [returnQueue=false]  return the queue
     * @return {boolean} the redraw result or the redraw queue if returnQueue=true
     */
    redraw(returnQueue) {
      let sizes;
      const queue = [
        // create item DOM
        this._createDomElement.bind(this),

        // append DOM to parent DOM
        this._appendDomElement.bind(this),

        this._updateDirtyDomComponents.bind(this),

        () => {
          if (this.dirty) {
            sizes = this._getDomComponentsSizes.bind(this)();
          }
        },

        () => {
          if (this.dirty) {
            this._updateDomComponentsSizes.bind(this)(sizes);
          }
        },

        // repaint DOM additionals
        this._repaintDomAdditionals.bind(this)
      ];

      if (returnQueue) {
        return queue;
      } else {
        let result;
        queue.forEach(fn => {
          result = fn();
        });
        return result;
      }
    }

    /**
     * Reposition the item vertically
     * @Override
     */
    repositionY(margin) {  // eslint-disable-line no-unused-vars
      let height;
      const orientation = this.options.orientation.item;

      // special positioning for subgroups
      if (this.data.subgroup !== undefined) {
        // TODO: instead of calculating the top position of the subgroups here for every BackgroundItem, calculate the top of the subgroup once in Itemset
        const itemSubgroup = this.data.subgroup;

        this.dom.box.style.height = `${this.parent.subgroups[itemSubgroup].height}px`;

        if (orientation == 'top') { 
          this.dom.box.style.top = `${this.parent.top + this.parent.subgroups[itemSubgroup].top}px`;
        } else {
          this.dom.box.style.top = `${this.parent.top + this.parent.height - this.parent.subgroups[itemSubgroup].top - this.parent.subgroups[itemSubgroup].height}px`;
        }
        this.dom.box.style.bottom = '';
      }
      // and in the case of no subgroups:
      else {
        // we want backgrounds with groups to only show in groups.
        if (this.parent instanceof BackgroundGroup) {
          // if the item is not in a group:
          height = Math.max(this.parent.height,
              this.parent.itemSet.body.domProps.center.height,
              this.parent.itemSet.body.domProps.centerContainer.height);
          this.dom.box.style.bottom = orientation == 'bottom' ? '0' : '';
          this.dom.box.style.top = orientation == 'top' ? '0' : '';
        }
        else {
          height = this.parent.height;
          // same alignment for items when orientation is top or bottom
          this.dom.box.style.top = `${this.parent.top}px`;
          this.dom.box.style.bottom = '';
        }
      }
      this.dom.box.style.height = `${height}px`;
    }
  }

  BackgroundItem.prototype.baseClassName = 'vis-item vis-background';

  BackgroundItem.prototype.stack = false;

  /**
   * Show the item in the DOM (when not already visible). The items DOM will
   * be created when needed.
   */
  BackgroundItem.prototype.show = RangeItem.prototype.show;

  /**
   * Hide the item from the DOM (when visible)
   * @return {Boolean} changed
   */
  BackgroundItem.prototype.hide = RangeItem.prototype.hide;

  /**
   * Reposition the item horizontally
   * @Override
   */
  BackgroundItem.prototype.repositionX = RangeItem.prototype.repositionX;

  /**
   * Popup is a class to create a popup window with some text
   */
  class Popup {
    /**
     * @param {Element} container       The container object.
     * @param {string}  overflowMethod  How the popup should act to overflowing ('flip', 'cap' or 'none')
     */
    constructor(container, overflowMethod) {
      this.container = container;
      this.overflowMethod = overflowMethod || 'cap';

      this.x = 0;
      this.y = 0;
      this.padding = 5;
      this.hidden = false;

      // create the frame
      this.frame = document.createElement('div');
      this.frame.className = 'vis-tooltip';
      this.container.appendChild(this.frame);
    }

    /**
     * @param {number} x   Horizontal position of the popup window
     * @param {number} y   Vertical position of the popup window
     */
    setPosition(x, y) {
      this.x = parseInt(x);
      this.y = parseInt(y);
    }

    /**
     * Set the content for the popup window. This can be HTML code or text.
     * @param {string | Element} content
     */
    setText(content) {
      if (content instanceof Element) {
        this.frame.innerHTML = '';
        this.frame.appendChild(content);
      }
      else {
        this.frame.innerHTML = availableUtils.xss(content); // string containing text or HTML
      }
    }

    /**
     * Show the popup window
     * @param {boolean} [doShow]    Show or hide the window
     */
    show(doShow) {
      if (doShow === undefined) {
        doShow = true;
      }

      if (doShow === true) {
        var height = this.frame.clientHeight;
        var width = this.frame.clientWidth;
        var maxHeight = this.frame.parentNode.clientHeight;
        var maxWidth = this.frame.parentNode.clientWidth;

        var left = 0, top = 0;

        if (this.overflowMethod == 'flip' || this.overflowMethod == 'none') {
          let isLeft = false, isTop = true; // Where around the position it's located

          if (this.overflowMethod == 'flip') {
            if (this.y - height < this.padding) {
              isTop = false;
            }

            if (this.x + width > maxWidth - this.padding) {
              isLeft = true;
            }
          }

          if (isLeft) {
            left = this.x - width;
          } else {
            left = this.x;
          }

          if (isTop) {
            top = this.y - height;
          } else {
            top = this.y;
          }
        } else { // this.overflowMethod == 'cap'
          top = (this.y - height);
          if (top + height + this.padding > maxHeight) {
            top = maxHeight - height - this.padding;
          }
          if (top < this.padding) {
            top = this.padding;
          }

          left = this.x;
          if (left + width + this.padding > maxWidth) {
            left = maxWidth - width - this.padding;
          }
          if (left < this.padding) {
            left = this.padding;
          }
        }

        this.frame.style.left = left + "px";
        this.frame.style.top = top + "px";
        this.frame.style.visibility = "visible";
        this.hidden = false;
      }
      else {
        this.hide();
      }
    }

    /**
     * Hide the popup window
     */
    hide() {
      this.hidden = true;
      this.frame.style.left = "0";
      this.frame.style.top = "0";
      this.frame.style.visibility = "hidden";
    }

    /**
     * Remove the popup window
     */
    destroy() {
      this.frame.parentNode.removeChild(this.frame); // Remove element from DOM
    }
  }

  /**
   * ClusterItem
   */
  class ClusterItem extends Item {
    /**
   * @constructor Item
   * @param {Object} data             Object containing (optional) parameters type,
   *                                  start, end, content, group, className.
   * @param {{toScreen: function, toTime: function}} conversion
   *                                  Conversion functions from time to screen and vice versa
   * @param {Object} options          Configuration options
   *                                  // TODO: describe available options
   */
    constructor(data, conversion, options) {
      const modifiedOptions = Object.assign({}, {fitOnDoubleClick: true}, options, {editable: false});
      super(data, conversion, modifiedOptions);

      this.props = {
        content: {
          width: 0,
          height: 0
        },
      };
      
      if (!data || data.uiItems == undefined) {
        throw new Error('Property "uiItems" missing in item ' + data.id);
      }
    
      this.id = uuid.v4();
      this.group = data.group;
      this._setupRange();
    
      this.emitter = this.data.eventEmitter;
      this.range = this.data.range;
      this.attached = false;
      this.isCluster = true;
      this.data.isCluster = true;
    }

    /**
     * check if there are items
     * @return {boolean}
     */
    hasItems() {
      return this.data.uiItems && this.data.uiItems.length && this.attached;
    }
    
    /**
     * set UI items
     * @param {array} items
     */
    setUiItems(items) {
      this.detach();
    
      this.data.uiItems = items;
    
      this._setupRange();
    
      this.attach();
    }
    
    /**
     * check is visible
     * @param {object} range
     * @return {boolean}
     */
    isVisible(range) {
      const rangeWidth = this.data.end ? this.data.end - this.data.start : 0;
      const widthInMs = this.width * range.getMillisecondsPerPixel();
      const end = Math.max(this.data.start.getTime() + rangeWidth, this.data.start.getTime() + widthInMs);
      return (this.data.start < range.end) && (end > range.start) && this.hasItems();
    }
    
    /**
     * get cluster data
     * @return {object}
     */
    getData() {
      return {
        isCluster: true,
        id: this.id,
        items: this.data.items || [],
        data: this.data
      }
    }
    
    /**
     * redraw cluster item
     * @param {boolean} returnQueue
     * @return {boolean}
     */
    redraw (returnQueue) {
      var sizes;
      var queue = [
        // create item DOM
        this._createDomElement.bind(this),
    
        // append DOM to parent DOM
        this._appendDomElement.bind(this),
    
        // update dirty DOM
        this._updateDirtyDomComponents.bind(this),
    
        (function () {
          if (this.dirty) {
            sizes = this._getDomComponentsSizes();
          }
        }).bind(this),
    
        (function () {
          if (this.dirty) {
            this._updateDomComponentsSizes.bind(this)(sizes);
          }
        }).bind(this),
    
        // repaint DOM additionals
        this._repaintDomAdditionals.bind(this)
      ];
    
      if (returnQueue) {
        return queue;
      } else {
        var result;
        queue.forEach(function (fn) {
          result = fn();
        });
        return result;
      }
    }
    
    /**
     * show cluster item
     */
    show() {
      if (!this.displayed) {
        this.redraw();
      }
    }
    
    /**
     * Hide the item from the DOM (when visible)
     */
    hide() {
      if (this.displayed) {
        var dom = this.dom;
        if (dom.box.parentNode) {
          dom.box.parentNode.removeChild(dom.box);
        }

        if (this.options.showStipes) {
          if (dom.line.parentNode)  {
            dom.line.parentNode.removeChild(dom.line);
          }
          if (dom.dot.parentNode)  {
            dom.dot.parentNode.removeChild(dom.dot);
          }
        }
        this.displayed = false;
      }
    }
    
    /**
     * reposition item x axis
     */
    repositionX() {
      let start = this.conversion.toScreen(this.data.start);
      let end = this.data.end ? this.conversion.toScreen(this.data.end) : 0;
      if (end) {
        this.repositionXWithRanges(start, end);
      } else {
        let align = this.data.align === undefined ? this.options.align : this.data.align;
        this.repositionXWithoutRanges(start, align);
      }
    
      if (this.options.showStipes) {
        this.dom.line.style.display = this._isStipeVisible() ? 'block' : 'none';
        this.dom.dot.style.display = this._isStipeVisible() ? 'block' : 'none';

        if (this._isStipeVisible()) {
          this.repositionStype(start, end);
        }
      }
    }

    /**
     * reposition item stype
     * @param {date} start
     * @param {date} end
     */
    repositionStype(start, end) {
      this.dom.line.style.display = 'block';
      this.dom.dot.style.display = 'block';
      const lineOffsetWidth = this.dom.line.offsetWidth;
      const dotOffsetWidth = this.dom.dot.offsetWidth;

      if (end) {
        const lineOffset = lineOffsetWidth + start + (end - start) / 2;
        const dotOffset = lineOffset - dotOffsetWidth / 2;
        const lineOffsetDirection = this.options.rtl ? lineOffset * -1 : lineOffset;
        const dotOffsetDirection = this.options.rtl ? dotOffset * -1 : dotOffset;

        this.dom.line.style.transform = `translateX(${lineOffsetDirection}px)`;
        this.dom.dot.style.transform = `translateX(${dotOffsetDirection}px)`;
      } else {
        const lineOffsetDirection = this.options.rtl ? (start * -1) : start;
        const dotOffsetDirection = this.options.rtl ? ((start - dotOffsetWidth / 2) * -1) : (start - dotOffsetWidth / 2);

        this.dom.line.style.transform = `translateX(${lineOffsetDirection}px)`;
        this.dom.dot.style.transform = `translateX(${dotOffsetDirection}px)`;
      }
    }
    
    /**
     * reposition x without ranges
     * @param {date} start
     * @param {string} align
     */
    repositionXWithoutRanges(start, align) {
      // calculate left position of the box
      if (align == 'right') {
        if (this.options.rtl) {
          this.right = start - this.width;
    
          // reposition box, line, and dot
          this.dom.box.style.right = this.right + 'px';
        } else {
          this.left = start - this.width;
    
          // reposition box, line, and dot
          this.dom.box.style.left = this.left + 'px';
        }
      } else if (align == 'left') {
        if (this.options.rtl) {
          this.right = start;
    
          // reposition box, line, and dot
          this.dom.box.style.right = this.right + 'px';
        } else {
          this.left = start;
    
          // reposition box, line, and dot
          this.dom.box.style.left = this.left + 'px';
        }
      } else {
        // default or 'center'
        if (this.options.rtl) {
          this.right = start - this.width / 2;
    
          // reposition box, line, and dot
          this.dom.box.style.right = this.right + 'px';
        } else {
          this.left = start - this.width / 2;
    
          // reposition box, line, and dot
          this.dom.box.style.left = this.left + 'px';
        }
      }
    }
    
    /**
     * reposition x with ranges
     * @param {date} start
     * @param {date} end
     */
    repositionXWithRanges(start, end) {
      let boxWidth = Math.round(Math.max(end - start + 0.5, 1));
    
      if (this.options.rtl) {
        this.right = start;
      } else {
        this.left = start;
      }
    
      this.width = Math.max(boxWidth, this.minWidth || 0);
    
      if (this.options.rtl) {
        this.dom.box.style.right = this.right + 'px';
      } else {
        this.dom.box.style.left = this.left + 'px';
      }
    
      this.dom.box.style.width = boxWidth + 'px';
    }
    
    /**
     * reposition item y axis
     */
    repositionY() {
      var orientation = this.options.orientation.item;
      var box = this.dom.box;
      if (orientation == 'top') {
        box.style.top = (this.top || 0) + 'px';
      } else { 
        // orientation 'bottom'
        box.style.top = (this.parent.height - this.top - this.height || 0) + 'px';
      }
    
      if (this.options.showStipes) {
        if (orientation == 'top') {
          this.dom.line.style.top    = '0';
          this.dom.line.style.height = (this.parent.top + this.top + 1) + 'px';
          this.dom.line.style.bottom = '';
        }
        else { 
          // orientation 'bottom'
          var itemSetHeight = this.parent.itemSet.props.height;
          var lineHeight = itemSetHeight - this.parent.top - this.parent.height + this.top;
          this.dom.line.style.top    = (itemSetHeight - lineHeight) + 'px';
          this.dom.line.style.bottom = '0';
        }
      
        this.dom.dot.style.top = (-this.dom.dot.offsetHeight / 2) + 'px';
      }
    }

    /**
     * get width left
     * @return {number}
     */
    getWidthLeft() {
      return this.width / 2;
    }
    
    /**
     * get width right
     * @return {number}
     */
    getWidthRight() {
      return this.width / 2;
    }
    
    /**
     * move cluster item
     */
    move() {
      this.repositionX();
      this.repositionY();
    }
    
    /**
     * attach
     */
    attach() {
      for (let item of this.data.uiItems) {
        item.cluster = this;
      }
    
      this.data.items = this.data.uiItems.map(item => item.data);

      this.attached = true;
      this.dirty = true;
    }
    
    /**
     * detach
     * @param {boolean} detachFromParent
     * @return {void}
     */
    detach(detachFromParent = false) {
      if (!this.hasItems()) {
        return;
      }
    
      for (let item of this.data.uiItems) {
        delete item.cluster;
      }
    
      this.attached = false;
    
      if (detachFromParent && this.group) {
        this.group.remove(this);
        this.group = null;
      }
    
      this.data.items = [];
      this.dirty = true;
    }
    
    /**
     * handle on double click
     */
    _onDoubleClick() {
     this._fit();
    }
    
    /**
     * set range
     */
    _setupRange() {
      const stats = this.data.uiItems.map(item => ({
        start: item.data.start.valueOf(),
        end: item.data.end ? item.data.end.valueOf() : item.data.start.valueOf(),
      }));
    
      this.data.min = Math.min(...stats.map(s => Math.min(s.start, s.end || s.start)));
      this.data.max = Math.max(...stats.map(s => Math.max(s.start, s.end || s.start)));
      const centers = this.data.uiItems.map(item => item.center);
      const avg = centers.reduce((sum, value) => sum + value, 0) / this.data.uiItems.length;
    
      if (this.data.uiItems.some(item => item.data.end)) {
        // contains ranges
        this.data.start = new Date(this.data.min);
        this.data.end = new Date(this.data.max);
      } else {
        this.data.start = new Date(avg);
        this.data.end = null;
      }
    }
    
    /**
     * get UI items
     * @return {array}
     */
    _getUiItems() {
      if (this.data.uiItems && this.data.uiItems.length) {
        return this.data.uiItems.filter(item => item.cluster === this);
      }
    
      return [];
    }
    
    /**
     * create DOM element
     */
    _createDomElement() {
      if (!this.dom) {
        // create DOM
        this.dom = {};
    
        // create main box
        this.dom.box = document.createElement('DIV');
    
        // contents box (inside the background box). used for making margins
        this.dom.content = document.createElement('DIV');
        this.dom.content.className = 'vis-item-content';
        
        this.dom.box.appendChild(this.dom.content);
    
        if (this.options.showStipes) {
          // line to axis
          this.dom.line = document.createElement('DIV');
          this.dom.line.className = 'vis-cluster-line';
          this.dom.line.style.display = 'none';
    
          // dot on axis
          this.dom.dot = document.createElement('DIV');
          this.dom.dot.className = 'vis-cluster-dot';
          this.dom.dot.style.display = 'none';
        }
    
        if (this.options.fitOnDoubleClick) {
          this.dom.box.ondblclick = ClusterItem.prototype._onDoubleClick.bind(this);
        }
        
        // attach this item as attribute
        this.dom.box['vis-item'] = this;
    
        this.dirty = true;
      }
    }
    
    /**
     * append element to DOM
     */
    _appendDomElement() {
      if (!this.parent) {
        throw new Error('Cannot redraw item: no parent attached');
      }
    
      if (!this.dom.box.parentNode) {
        const foreground = this.parent.dom.foreground;
        if (!foreground) {
          throw new Error('Cannot redraw item: parent has no foreground container element');
        }
    
        foreground.appendChild(this.dom.box);
      }
    
      const background = this.parent.dom.background;
    
      if (this.options.showStipes) {
        if (!this.dom.line.parentNode) {
          if (!background) throw new Error('Cannot redraw item: parent has no background container element');
          background.appendChild(this.dom.line);
        }
      
        if (!this.dom.dot.parentNode) {
          var axis = this.parent.dom.axis;
          if (!background) throw new Error('Cannot redraw item: parent has no axis container element');
          axis.appendChild(this.dom.dot);
        }
      }
    
      this.displayed = true;
    }
    
    /**
     * update dirty DOM components
     */
    _updateDirtyDomComponents() {
      // An item is marked dirty when:
      // - the item is not yet rendered
      // - the item's data is changed
      // - the item is selected/deselected
      if (this.dirty) {
        this._updateContents(this.dom.content);
        this._updateDataAttributes(this.dom.box);
        this._updateStyle(this.dom.box);
    
        // update class
        const className = this.baseClassName + ' ' + (this.data.className ? ' ' + this.data.className : '') +
          (this.selected ? ' vis-selected' : '') + ' vis-readonly';
        this.dom.box.className = 'vis-item ' + className;
    
        if (this.options.showStipes) {
          this.dom.line.className = 'vis-item vis-cluster-line ' +  (this.selected ? ' vis-selected' : '');
          this.dom.dot.className  = 'vis-item vis-cluster-dot ' +  (this.selected ? ' vis-selected' : '');
        }
    
        if (this.data.end) {
          // turn off max-width to be able to calculate the real width
          // this causes an extra browser repaint/reflow, but so be it
          this.dom.content.style.maxWidth = 'none';
        }
      }
    }
    
    /**
     * get DOM components sizes
     * @return {object}
     */
    _getDomComponentsSizes() {
      const sizes = {
        previous: {
          right: this.dom.box.style.right,
          left: this.dom.box.style.left
        },
        box: {
          width: this.dom.box.offsetWidth,
          height: this.dom.box.offsetHeight
        },
      };

      if (this.options.showStipes) {
        sizes.dot = {
          height: this.dom.dot.offsetHeight,
          width: this.dom.dot.offsetWidth
        };
        sizes.line = {
          width: this.dom.line.offsetWidth
        };
      }

      return sizes;
    }
    
    /**
     * update DOM components sizes
     * @param {object} sizes
     */
    _updateDomComponentsSizes(sizes) {
      if (this.options.rtl) {
        this.dom.box.style.right = "0px";
      } else {
        this.dom.box.style.left = "0px";
      }
    
      // recalculate size
      if (!this.data.end) {
        this.width = sizes.box.width;
      } else {
        this.minWidth = sizes.box.width;
      }
    
      this.height = sizes.box.height;
    
      // restore previous position
      if (this.options.rtl) {
        this.dom.box.style.right = sizes.previous.right;
      } else {
        this.dom.box.style.left = sizes.previous.left;
      }
    
      this.dirty = false;
    }
    
    /**
     * repaint DOM additional components
     */
    _repaintDomAdditionals() {
      this._repaintOnItemUpdateTimeTooltip(this.dom.box);
    }
    
    /**
     * check is stripe visible
     * @return {number}
     * @private
     */
    _isStipeVisible() {
      return this.minWidth >= this.width || !this.data.end;
    }
    
    /**
     * get fit range
     * @return {object}
     * @private
     */
    _getFitRange() {
      const offset = 0.05*(this.data.max - this.data.min) / 2;
        return {
          fitStart: this.data.min - offset,
          fitEnd: this.data.max + offset
        };
    }
    
     /**
     * fit
     * @private
     */
    _fit() {
      if (this.emitter) {
        const {fitStart, fitEnd} = this._getFitRange();
    
        const fitArgs = {
          start: new Date(fitStart),
          end: new Date(fitEnd),
          animation: true
        };
    
        this.emitter.emit('fit', fitArgs);
      }
    }

     /**
     * get item data
     * @return {object}
     * @private
     */
    _getItemData() {
      return this.data;
    }
  }

  ClusterItem.prototype.baseClassName = 'vis-item vis-range vis-cluster';

  const UNGROUPED$2 = '__ungrouped__';   // reserved group id for ungrouped items
  const BACKGROUND$1 = '__background__'; // reserved group id for background items without group

  const ReservedGroupIds = {
    UNGROUPED: UNGROUPED$2,
    BACKGROUND: BACKGROUND$1
  };

  /**
   * An Cluster generator generates cluster items
   */
  class ClusterGenerator {
      /**
       * @param {ItemSet} itemSet itemsSet instance
       * @constructor ClusterGenerator
      */
      constructor(itemSet) {
          this.itemSet = itemSet;
          this.groups = {};
          this.cache = {};
          this.cache[-1] = [];
      }

      /**
       * @param {Object} itemData             Object containing parameters start content, className.
       * @param {{toScreen: function, toTime: function}} conversion
       *                                  Conversion functions from time to screen and vice versa
       * @param {Object} [options]        Configuration options
       * @return {Object} newItem
      */
      createClusterItem(itemData, conversion, options) {
          const newItem = new ClusterItem(itemData, conversion, options);
          return newItem;
      }

      /**
       * Set the items to be clustered.
       * This will clear cached clusters.
       * @param {Item[]} items
       * @param {Object} [options]  Available options:
       *                            {boolean} applyOnChangedLevel
       *                                If true (default), the changed data is applied
       *                                as soon the cluster level changes. If false,
       *                                The changed data is applied immediately
       */
      setItems(items, options) {
          this.items = items || [];
          this.dataChanged = true;
          this.applyOnChangedLevel = false;

          if (options && options.applyOnChangedLevel) {
              this.applyOnChangedLevel = options.applyOnChangedLevel;
          }
      }

      /**
       * Update the current data set: clear cache, and recalculate the clustering for
       * the current level
       */
      updateData() {
          this.dataChanged = true;
          this.applyOnChangedLevel = false;
      }

      /**
       * Cluster the items which are too close together
       * @param {array} oldClusters 
       * @param {number} scale      The scale of the current window : (windowWidth / (endDate - startDate)) 
       * @param {{maxItems: number, clusterCriteria: function, titleTemplate: string}} options             
       * @return {array} clusters
      */
      getClusters(oldClusters, scale, options) {
          let { maxItems, clusterCriteria } = typeof options === "boolean" ? {} : options;
      
          if (!clusterCriteria) {
              clusterCriteria = () => true;
          }

          maxItems = maxItems || 1;

          let level = -1;
          let granularity = 2;
          let timeWindow = 0;

          if (scale > 0) {
              if (scale >= 1) {
                  return [];
              }

              level = Math.abs(Math.round(Math.log(100 / scale) / Math.log(granularity)));
              timeWindow = Math.abs(Math.pow(granularity, level));
          }

          // clear the cache when and re-generate groups the data when needed.
          if (this.dataChanged) {
              const levelChanged = (level != this.cacheLevel);
              const applyDataNow = this.applyOnChangedLevel ? levelChanged : true;
              if (applyDataNow) {
                  this._dropLevelsCache();
                  this._filterData();
              }
          }

          this.cacheLevel = level;
          let clusters = this.cache[level];
          if (!clusters) {
              clusters = [];
              for (let groupName in this.groups) {
                  if (this.groups.hasOwnProperty(groupName)) {
                      const items = this.groups[groupName];
                      const iMax = items.length;
                      let i = 0;
                      while (i < iMax) {
                          // find all items around current item, within the timeWindow
                          let item = items[i];
                          let neighbors = 1; // start at 1, to include itself)

                          // loop through items left from the current item
                          let j = i - 1;
                          while (j >= 0 && (item.center - items[j].center) < timeWindow / 2) {
                              if (!items[j].cluster && clusterCriteria(item.data, items[j].data)) {
                                  neighbors++;
                              }
                              j--;
                          }

                          // loop through items right from the current item
                          let k = i + 1;
                          while (k < items.length && (items[k].center - item.center) < timeWindow / 2) {
                              if (clusterCriteria(item.data, items[k].data)) {
                                  neighbors++;
                              }
                              k++;
                          }

                          // loop through the created clusters
                          let l = clusters.length - 1;
                          while (l >= 0 && (item.center - clusters[l].center) < timeWindow) {
                              if (item.group == clusters[l].group && clusterCriteria(item.data, clusters[l].data)) {
                                  neighbors++;
                              }
                              l--;
                          }

                          // aggregate until the number of items is within maxItems
                          if (neighbors > maxItems) {
                              // too busy in this window.
                              const num = neighbors - maxItems + 1;
                              const clusterItems = [];

                              // append the items to the cluster,
                              // and calculate the average start for the cluster
                              let m = i;
                              while (clusterItems.length < num && m < items.length) {
                                  if (clusterCriteria(items[i].data, items[m].data)) {
                                      clusterItems.push(items[m]);
                                  }
                                  m++;
                              }

                              const groupId = this.itemSet.getGroupId(item.data);
                              const group = this.itemSet.groups[groupId] || this.itemSet.groups[ReservedGroupIds.UNGROUPED];
                              let cluster = this._getClusterForItems(clusterItems, group, oldClusters, options);
                              clusters.push(cluster);

                              i += num;
                          } else {
                              delete item.cluster;
                              i += 1;
                          }
                      }
                  }
              }

              this.cache[level] = clusters;
          }

          return clusters;
      }

      /**
       * Filter the items per group.
       * @private
       */
      _filterData() {
          // filter per group
          const groups = {};
          this.groups = groups;

          // split the items per group
          for (const item of Object.values(this.items)) {
              // put the item in the correct group
              const groupName = item.parent ? item.parent.groupId : '';
              let group = groups[groupName];
              if (!group) {
                  group = [];
                  groups[groupName] = group;
              }
              group.push(item);

              // calculate the center of the item
              if (item.data.start) {
                  if (item.data.end) {
                      // range
                      item.center = (item.data.start.valueOf() + item.data.end.valueOf()) / 2;
                  } else {
                      // box, dot
                      item.center = item.data.start.valueOf();
                  }
              }
          }

          // sort the items per group
          for (let currentGroupName in groups) {
              if (groups.hasOwnProperty(currentGroupName)) {
                  groups[currentGroupName].sort((a, b) => a.center - b.center);
              }
          }

          this.dataChanged = false;
      }

      /**
       * Create new cluster or return existing
       * @private
       * @param {array} clusterItems    
       * @param {object} group 
       * @param {array} oldClusters 
       * @param {object} options 
       * @returns {object} cluster
       */
      _getClusterForItems(clusterItems, group, oldClusters, options) {
          const oldClustersLookup = (oldClusters || []).map(cluster => ({
              cluster,
              itemsIds: new Set(cluster.data.uiItems.map(item => item.id))
          }));
          let cluster;
          if (oldClustersLookup.length) {
              for (let oldClusterData of oldClustersLookup) {
                  if (oldClusterData.itemsIds.size === clusterItems.length 
                      && clusterItems.every(clusterItem => oldClusterData.itemsIds.has(clusterItem.id))) {
                      cluster = oldClusterData.cluster;
                      break;
                  }
              }
          }

          if (cluster) {
              cluster.setUiItems(clusterItems);
              if (cluster.group !== group) {
                  if (cluster.group) {
                      cluster.group.remove(cluster);    
                  }

                  if (group) {
                      group.add(cluster);    
                      cluster.group = group;
                  }
              }
              return cluster;
          }

          let titleTemplate = options.titleTemplate || '';
          const conversion = {
              toScreen: this.itemSet.body.util.toScreen,
              toTime: this.itemSet.body.util.toTime
          };

          const title = titleTemplate.replace(/{count}/, clusterItems.length);
          const clusterContent = '<div title="' + title + '">' + clusterItems.length + '</div>';
          const clusterOptions = Object.assign({}, options, this.itemSet.options);
          const data = {
              'content': clusterContent,
              'title': title,
              'group': group,
              'uiItems': clusterItems,
              'eventEmitter': this.itemSet.body.emitter,
              'range': this.itemSet.body.range
          };
          cluster = this.createClusterItem(data,
          conversion,
          clusterOptions);

          if (group) {
              group.add(cluster);
              cluster.group = group;
          }

          cluster.attach();

          return cluster;
      }

      /**
       * Drop cache
       * @private
       */
      _dropLevelsCache() {
          this.cache = {};
          this.cacheLevel = -1;
          this.cache[this.cacheLevel] = [];
      }
  }

  const UNGROUPED$1 = '__ungrouped__';   // reserved group id for ungrouped items
  const BACKGROUND = '__background__'; // reserved group id for background items without group

  /**
   * An ItemSet holds a set of items and ranges which can be displayed in a
   * range. The width is determined by the parent of the ItemSet, and the height
   * is determined by the size of the items.
   */
  class ItemSet extends Component {
    /**
   * @param {{dom: Object, domProps: Object, emitter: Emitter, range: Range}} body
   * @param {Object} [options]      See ItemSet.setOptions for the available options.
   * @constructor ItemSet
   * @extends Component
   */
    constructor(body, options) {
      super();
      this.body = body;
      this.defaultOptions = {
        type: null,  // 'box', 'point', 'range', 'background'
        orientation: {
          item: 'bottom'   // item orientation: 'top' or 'bottom'
        },
        align: 'auto', // alignment of box items
        stack: true,
        stackSubgroups: true,
        groupOrderSwap(fromGroup, toGroup, groups) {  // eslint-disable-line no-unused-vars
          const targetOrder = toGroup.order;
          toGroup.order = fromGroup.order;
          fromGroup.order = targetOrder;
        },
        groupOrder: 'order',

        selectable: true,
        multiselect: false,
        longSelectPressTime: 251,
        itemsAlwaysDraggable: {
          item: false,
          range: false,
        },

        editable: {
          updateTime: false,
          updateGroup: false,
          add: false,
          remove: false,
          overrideItems: false
        },

        groupEditable: {
          order: false,
          add: false,
          remove: false
        },

        snap: TimeStep.snap,

        // Only called when `objectData.target === 'item'.
        onDropObjectOnItem(objectData, item, callback) {
          callback(item);
        },
        onAdd(item, callback) {
          callback(item);
        },
        onUpdate(item, callback) {
          callback(item);
        },
        onMove(item, callback) {
          callback(item);
        },
        onRemove(item, callback) {
          callback(item);
        },
        onMoving(item, callback) {
          callback(item);
        },
        onAddGroup(item, callback) {
          callback(item);
        },
        onMoveGroup(item, callback) {
          callback(item);
        },
        onRemoveGroup(item, callback) {
          callback(item);
        },

        margin: {
          item: {
            horizontal: 10,
            vertical: 10
          },
          axis: 20
        },

        showTooltips: true,

        tooltip: {
          followMouse: false,
          overflowMethod: 'flip',
          delay: 500
        },

        tooltipOnItemUpdateTime: false
      };

      // options is shared by this ItemSet and all its items
      this.options = availableUtils.extend({}, this.defaultOptions);
      this.options.rtl = options.rtl;
      this.options.onTimeout = options.onTimeout;

      this.conversion = {
        toScreen: body.util.toScreen,
        toTime: body.util.toTime
      };
      this.dom = {};
      this.props = {};
      this.hammer = null;
      
      const me = this;
      this.itemsData = null;    // DataSet
      this.groupsData = null;   // DataSet
      this.itemsSettingTime = null;
      this.initialItemSetDrawn = false;
      this.userContinueNotBail = null;  

      this.sequentialSelection = false;
      
      // listeners for the DataSet of the items
      this.itemListeners = {
        'add'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onAdd(params.items);
          if (me.options.cluster) {
            me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
          }
          me.redraw();
        },
        'update'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onUpdate(params.items);
          if (me.options.cluster) {
            me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
          }
          me.redraw();
        },
        'remove'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onRemove(params.items);
          if (me.options.cluster) {
            me.clusterGenerator.setItems(me.items, { applyOnChangedLevel: false });
          }
          me.redraw();
        }
      };

      // listeners for the DataSet of the groups
      this.groupListeners = {
        'add'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onAddGroups(params.items);
          
          if (me.groupsData && me.groupsData.length > 0) {
              const groupsData = me.groupsData.getDataSet();
              groupsData.get().forEach(groupData => {
              if (groupData.nestedGroups) {
                if (groupData.showNested != false) {
                  groupData.showNested = true;
                }
                let updatedGroups = [];
                groupData.nestedGroups.forEach(nestedGroupId => {
                  const updatedNestedGroup = groupsData.get(nestedGroupId);
                  if (!updatedNestedGroup) { return; }
                  updatedNestedGroup.nestedInGroup = groupData.id;
                  if (groupData.showNested == false) {
                    updatedNestedGroup.visible = false;
                  }
                  updatedGroups = updatedGroups.concat(updatedNestedGroup);
                });
                groupsData.update(updatedGroups, senderId);
              }
            });
          }
        },
        'update'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onUpdateGroups(params.items);
        },
        'remove'(event, params, senderId) {  // eslint-disable-line no-unused-vars
          me._onRemoveGroups(params.items);
        }
      };

      this.items = {};      // object with an Item for every data item
      this.groups = {};     // Group object for every group
      this.groupIds = [];

      this.selection = [];  // list with the ids of all selected nodes

      this.popup = null;
      this.popupTimer = null;

      this.touchParams = {}; // stores properties while dragging
      this.groupTouchParams = {
        group: null,
        isDragging: false
      };
    
      // create the HTML DOM
      this._create();

      this.setOptions(options);
      this.clusters = [];
    }

    /**
     * Create the HTML DOM for the ItemSet
     */
    _create() {
      const frame = document.createElement('div');
      frame.className = 'vis-itemset';
      frame['vis-itemset'] = this;
      this.dom.frame = frame;

      // create background panel
      const background = document.createElement('div');
      background.className = 'vis-background';
      frame.appendChild(background);
      this.dom.background = background;

      // create foreground panel
      const foreground = document.createElement('div');
      foreground.className = 'vis-foreground';
      frame.appendChild(foreground);
      this.dom.foreground = foreground;

      // create axis panel
      const axis = document.createElement('div');
      axis.className = 'vis-axis';
      this.dom.axis = axis;

      // create labelset
      const labelSet = document.createElement('div');
      labelSet.className = 'vis-labelset';
      this.dom.labelSet = labelSet;

      // create ungrouped Group
      this._updateUngrouped();

      // create background Group
      const backgroundGroup = new BackgroundGroup(BACKGROUND, null, this);
      backgroundGroup.show();
      this.groups[BACKGROUND] = backgroundGroup;

      // attach event listeners
      // Note: we bind to the centerContainer for the case where the height
      //       of the center container is larger than of the ItemSet, so we
      //       can click in the empty area to create a new item or deselect an item.
      this.hammer = new Hammer(this.body.dom.centerContainer);

      // drag items when selected
      this.hammer.on('hammer.input', event => {
        if (event.isFirst) {
          this._onTouch(event);
        }
      });
      this.hammer.on('panstart', this._onDragStart.bind(this));
      this.hammer.on('panmove',  this._onDrag.bind(this));
      this.hammer.on('panend',   this._onDragEnd.bind(this));
      this.hammer.get('pan').set({threshold:5, direction: Hammer.ALL});
      // delay addition on item click for trackpads...
      this.hammer.get('press').set({time:10000});

      // single select (or unselect) when tapping an item
      this.hammer.on('tap',  this._onSelectItem.bind(this));

      // multi select when holding mouse/touch, or on ctrl+click
      this.hammer.on('press', this._onMultiSelectItem.bind(this));
      // delay addition on item click for trackpads...
      this.hammer.get('press').set({time:10000});

      // add item on doubletap
      //this.hammer.on('doubletap', this._onAddItem.bind(this));

      if (this.options.rtl) {
        this.groupHammer = new Hammer(this.body.dom.rightContainer);
      } else {
        this.groupHammer = new Hammer(this.body.dom.leftContainer);
      }
      
      this.groupHammer.on('tap',      this._onGroupClick.bind(this));
      this.groupHammer.on('panstart', this._onGroupDragStart.bind(this));
      this.groupHammer.on('panmove',  this._onGroupDrag.bind(this));
      this.groupHammer.on('panend',   this._onGroupDragEnd.bind(this));
      this.groupHammer.get('pan').set({threshold:5, direction: Hammer.DIRECTION_VERTICAL});
      
      this.body.dom.centerContainer.addEventListener('mouseover', this._onMouseOver.bind(this));
      this.body.dom.centerContainer.addEventListener('mouseout', this._onMouseOut.bind(this));
      this.body.dom.centerContainer.addEventListener('mousemove', this._onMouseMove.bind(this));
      // right-click on timeline 
      this.body.dom.centerContainer.addEventListener('contextmenu', this._onDragEnd.bind(this));

      this.body.dom.centerContainer.addEventListener('mousewheel', this._onMouseWheel.bind(this));

      // attach to the DOM
      this.show();
    }

    /**
     * Set options for the ItemSet. Existing options will be extended/overwritten.
     * @param {Object} [options] The following options are available:
     *                           {string} type
     *                              Default type for the items. Choose from 'box'
     *                              (default), 'point', 'range', or 'background'.
     *                              The default style can be overwritten by
     *                              individual items.
     *                           {string} align
     *                              Alignment for the items, only applicable for
     *                              BoxItem. Choose 'center' (default), 'left', or
     *                              'right'.
     *                           {string} orientation.item
     *                              Orientation of the item set. Choose 'top' or
     *                              'bottom' (default).
     *                           {Function} groupOrder
     *                              A sorting function for ordering groups
     *                           {boolean} stack
     *                              If true (default), items will be stacked on
     *                              top of each other.
     *                           {number} margin.axis
     *                              Margin between the axis and the items in pixels.
     *                              Default is 20.
     *                           {number} margin.item.horizontal
     *                              Horizontal margin between items in pixels.
     *                              Default is 10.
     *                           {number} margin.item.vertical
     *                              Vertical Margin between items in pixels.
     *                              Default is 10.
     *                           {number} margin.item
     *                              Margin between items in pixels in both horizontal
     *                              and vertical direction. Default is 10.
     *                           {number} margin
     *                              Set margin for both axis and items in pixels.
     *                           {boolean} selectable
     *                              If true (default), items can be selected.
     *                           {boolean} multiselect
     *                              If true, multiple items can be selected.
     *                              False by default.
     *                           {boolean} editable
     *                              Set all editable options to true or false
     *                           {boolean} editable.updateTime
     *                              Allow dragging an item to an other moment in time
     *                           {boolean} editable.updateGroup
     *                              Allow dragging an item to an other group
     *                           {boolean} editable.add
     *                              Allow creating new items on double tap
     *                           {boolean} editable.remove
     *                              Allow removing items by clicking the delete button
     *                              top right of a selected item.
     *                           {Function(item: Item, callback: Function)} onAdd
     *                              Callback function triggered when an item is about to be added:
     *                              when the user double taps an empty space in the Timeline.
     *                           {Function(item: Item, callback: Function)} onUpdate
     *                              Callback function fired when an item is about to be updated.
     *                              This function typically has to show a dialog where the user
     *                              change the item. If not implemented, nothing happens.
     *                           {Function(item: Item, callback: Function)} onMove
     *                              Fired when an item has been moved. If not implemented,
     *                              the move action will be accepted.
     *                           {Function(item: Item, callback: Function)} onRemove
     *                              Fired when an item is about to be deleted.
     *                              If not implemented, the item will be always removed.
     */
    setOptions(options) {
      if (options) {
        // copy all options that we know
        const fields = [
          'type', 'rtl', 'align', 'order', 'stack', 'stackSubgroups', 'selectable', 'multiselect', 'sequentialSelection',
          'multiselectPerGroup', 'longSelectPressTime', 'groupOrder', 'dataAttributes', 'template', 'groupTemplate', 'visibleFrameTemplate',
          'hide', 'snap', 'groupOrderSwap', 'showTooltips', 'tooltip', 'tooltipOnItemUpdateTime', 'groupHeightMode', 'onTimeout'
        ];
        availableUtils.selectiveExtend(fields, this.options, options);

        if ('itemsAlwaysDraggable' in options) {
          if (typeof options.itemsAlwaysDraggable === 'boolean') {
            this.options.itemsAlwaysDraggable.item = options.itemsAlwaysDraggable;
            this.options.itemsAlwaysDraggable.range = false;
          }
          else if (typeof options.itemsAlwaysDraggable === 'object') {
            availableUtils.selectiveExtend(['item', 'range'], this.options.itemsAlwaysDraggable, options.itemsAlwaysDraggable);
            // only allow range always draggable when item is always draggable as well
            if (! this.options.itemsAlwaysDraggable.item) {
              this.options.itemsAlwaysDraggable.range = false;
            }
          }
        }

        if ('sequentialSelection' in options) {
          if (typeof options.sequentialSelection === 'boolean') {
            this.options.sequentialSelection = options.sequentialSelection;
          }
        }

        if ('orientation' in options) {
          if (typeof options.orientation === 'string') {
            this.options.orientation.item = options.orientation === 'top' ? 'top' : 'bottom';
          }
          else if (typeof options.orientation === 'object' && 'item' in options.orientation) {
            this.options.orientation.item = options.orientation.item;
          }
        }

        if ('margin' in options) {
          if (typeof options.margin === 'number') {
            this.options.margin.axis = options.margin;
            this.options.margin.item.horizontal = options.margin;
            this.options.margin.item.vertical = options.margin;
          }
          else if (typeof options.margin === 'object') {
            availableUtils.selectiveExtend(['axis'], this.options.margin, options.margin);
            if ('item' in options.margin) {
              if (typeof options.margin.item === 'number') {
                this.options.margin.item.horizontal = options.margin.item;
                this.options.margin.item.vertical = options.margin.item;
              }
              else if (typeof options.margin.item === 'object') {
                availableUtils.selectiveExtend(['horizontal', 'vertical'], this.options.margin.item, options.margin.item);
              }
            }
          }
        }

        ['locale', 'locales'].forEach(key => {
          if (key in options) {
            this.options[key] = options[key];
          }
        });

        if ('editable' in options) {
          if (typeof options.editable === 'boolean') {
            this.options.editable.updateTime    = options.editable;
            this.options.editable.updateGroup   = options.editable;
            this.options.editable.add           = options.editable;
            this.options.editable.remove        = options.editable;
            this.options.editable.overrideItems = false;
          }
          else if (typeof options.editable === 'object') {
            availableUtils.selectiveExtend(['updateTime', 'updateGroup', 'add', 'remove', 'overrideItems'], this.options.editable, options.editable);
          }
        }

        if ('groupEditable' in options) {
          if (typeof options.groupEditable === 'boolean') {
            this.options.groupEditable.order  = options.groupEditable;
            this.options.groupEditable.add    = options.groupEditable;
            this.options.groupEditable.remove = options.groupEditable;
          }
          else if (typeof options.groupEditable === 'object') {
            availableUtils.selectiveExtend(['order', 'add', 'remove'], this.options.groupEditable, options.groupEditable);
          }
        }

        // callback functions
        const addCallback = name => {
          const fn = options[name];
          if (fn) {
            if (!(typeof fn === 'function')) {
              throw new Error(`option ${name} must be a function ${name}(item, callback)`);
            }
            this.options[name] = fn;
          }
        };
        ['onDropObjectOnItem', 'onAdd', 'onUpdate', 'onRemove', 'onMove', 'onMoving', 'onAddGroup', 'onMoveGroup', 'onRemoveGroup'].forEach(addCallback);

        if (options.cluster) {
          Object.assign(this.options, {
            cluster: options.cluster
          });
          if (!this.clusterGenerator) {
            this.clusterGenerator = new ClusterGenerator(this);
          } 
          this.clusterGenerator.setItems(this.items, { applyOnChangedLevel: false });
          this.markDirty({ refreshItems: true, restackGroups: true });

          this.redraw();
        } else if (this.clusterGenerator) {
          this._detachAllClusters();
          this.clusters = [];
          this.clusterGenerator = null;
          this.options.cluster = undefined;
          this.markDirty({ refreshItems: true, restackGroups: true });

          this.redraw();
        } else {
          // force the itemSet to refresh: options like orientation and margins may be changed
          this.markDirty();
        }
      }
    }

    /**
     * Mark the ItemSet dirty so it will refresh everything with next redraw.
     * Optionally, all items can be marked as dirty and be refreshed.
     * @param {{refreshItems: boolean}} [options]
     */
    markDirty(options) {
      this.groupIds = [];

      if (options) {
        if (options.refreshItems) {
          availableUtils.forEach(this.items, item => {
            item.dirty = true;
            if (item.displayed) item.redraw();
          });
        }
        
        if (options.restackGroups) {
          availableUtils.forEach(this.groups, (group, key) => {
            if (key === BACKGROUND) return;
            group.stackDirty = true;
          });
        }
      }
    }

    /**
     * Destroy the ItemSet
     */
    destroy() {
      this.clearPopupTimer();
      this.hide();
      this.setItems(null);
      this.setGroups(null);

      this.hammer && this.hammer.destroy();
      this.groupHammer && this.groupHammer.destroy();
      this.hammer = null;

      this.body = null;
      this.conversion = null;
    }

    /**
     * Hide the component from the DOM
     */
    hide() {
      // remove the frame containing the items
      if (this.dom.frame.parentNode) {
        this.dom.frame.parentNode.removeChild(this.dom.frame);
      }

      // remove the axis with dots
      if (this.dom.axis.parentNode) {
        this.dom.axis.parentNode.removeChild(this.dom.axis);
      }

      // remove the labelset containing all group labels
      if (this.dom.labelSet.parentNode) {
        this.dom.labelSet.parentNode.removeChild(this.dom.labelSet);
      }
    }

    /**
     * Show the component in the DOM (when not already visible).
     */
    show() {
      // show frame containing the items
      if (!this.dom.frame.parentNode) {
        this.body.dom.center.appendChild(this.dom.frame);
      }

      // show axis with dots
      if (!this.dom.axis.parentNode) {
        this.body.dom.backgroundVertical.appendChild(this.dom.axis);
      }

      // show labelset containing labels
      if (!this.dom.labelSet.parentNode) {
        if (this.options.rtl) {
          this.body.dom.right.appendChild(this.dom.labelSet);
        } else {
          this.body.dom.left.appendChild(this.dom.labelSet);
        }
      }
    }

    /**
     * Activates the popup timer to show the given popup after a fixed time.
     * @param {Popup} popup
     */
    setPopupTimer(popup) {
      this.clearPopupTimer();
      if (popup) {
        const delay = this.options.tooltip.delay || typeof this.options.tooltip.delay === 'number' ?
              this.options.tooltip.delay :
              500;
        this.popupTimer = setTimeout(
          function () {
            popup.show();
          }, delay);
      }
    }

    /**
     * Clears the popup timer for the tooltip.
     */
    clearPopupTimer() {
      if (this.popupTimer != null) {
          clearTimeout(this.popupTimer);
          this.popupTimer = null;
      }
    }
    
    /**
     * Set selected items by their id. Replaces the current selection
     * Unknown id's are silently ignored.
     * @param {string[] | string} [ids] An array with zero or more id's of the items to be
     *                                  selected, or a single item id. If ids is undefined
     *                                  or an empty array, all items will be unselected.
     */
    setSelection(ids) {
      if (ids == undefined) { 
        ids = [];
      }
      
      if (!Array.isArray(ids)) {
        ids = [ids];
      }
    

      const idsToDeselect = this.selection.filter(id => ids.indexOf(id) === -1);

      // unselect currently selected items
      for (let selectedId of idsToDeselect) {
        const item = this.getItemById(selectedId);
        if (item) {
          item.unselect();
        }
      }
    
      // select items
      this.selection = [ ...ids ];
      for (let id of ids) {
        const item = this.getItemById(id);
        if (item) {
          item.select();
        }
      }
    }

    /**
     * Get the selected items by their id
     * @return {Array} ids  The ids of the selected items
     */
    getSelection() {
      return this.selection.concat([]);
    }

    /**
     * Get the id's of the currently visible items.
     * @returns {Array} The ids of the visible items
     */
    getVisibleItems() {
      const range = this.body.range.getRange();
      let right;
      let left;

      if (this.options.rtl) { 
        right  = this.body.util.toScreen(range.start);
        left = this.body.util.toScreen(range.end);
      } else {
        left  = this.body.util.toScreen(range.start);
        right = this.body.util.toScreen(range.end);
      }

      const ids = [];
      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId)) {
          const group = this.groups[groupId];
          const rawVisibleItems = group.isVisible ? group.visibleItems : [];

          // filter the "raw" set with visibleItems into a set which is really
          // visible by pixels
          for (const item of rawVisibleItems) {
            // TODO: also check whether visible vertically
            if (this.options.rtl) { 
              if ((item.right < left) && (item.right + item.width > right)) {
                ids.push(item.id);
              }
            } else {
              if ((item.left < right) && (item.left + item.width > left)) {
                ids.push(item.id);
              }
            }
          }
        }
      }

      return ids;
    }

      /**
     * Get the id's of the items at specific time, where a click takes place on the timeline.
     * @returns {Array} The ids of all items in existence at the time of click event on the timeline.
     */
    getItemsAtCurrentTime(timeOfEvent) {
      let right;
      let left;

      if (this.options.rtl) { 
        right  = this.body.util.toScreen(timeOfEvent);
        left = this.body.util.toScreen(timeOfEvent);
      } else {
        left  = this.body.util.toScreen(timeOfEvent);
        right = this.body.util.toScreen(timeOfEvent);
      }

      const ids = [];
      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId)) {
          const group = this.groups[groupId];
          const rawVisibleItems = group.isVisible ? group.visibleItems : [];

          // filter the "raw" set with visibleItems into a set which is really
          // visible by pixels
          for (const item of rawVisibleItems) {
            if (this.options.rtl) { 
              if ((item.right < left) && (item.right + item.width > right)) {
                ids.push(item.id);
              }
            } else {
              if ((item.left < right) && (item.left + item.width > left)) {
                ids.push(item.id);
              }
            }
          }
        }
      }
      return ids;
    }

    /**
     * Get the id's of the currently visible groups.
     * @returns {Array} The ids of the visible groups
     */
    getVisibleGroups() {
      const ids = [];

      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId)) {
          const group = this.groups[groupId];
          if (group.isVisible) {
            ids.push(groupId);
          }
        }
      }

      return ids;
    }
    
    /**
     * get item by id
     * @param {string} id
     * @return {object} item
     */
    getItemById(id) {
      return this.items[id] || this.clusters.find(cluster => cluster.id === id);
    } 

    /**
     * Deselect a selected item
     * @param {string | number} id
     * @private
     */
    _deselect(id) {
      const selection = this.selection;
      for (let i = 0, ii = selection.length; i < ii; i++) {
        if (selection[i] == id) { // non-strict comparison!
          selection.splice(i, 1);
          break;
        }
      }
    }

    /**
     * Repaint the component
     * @return {boolean} Returns true if the component is resized
     */
    redraw() {
      const margin = this.options.margin;
      const range = this.body.range;
      const asSize = availableUtils.option.asSize;
      const options = this.options;
      const orientation = options.orientation.item;
      let resized = false;
      const frame = this.dom.frame;

      // recalculate absolute position (before redrawing groups)
      this.props.top = this.body.domProps.top.height + this.body.domProps.border.top;

      if (this.options.rtl) {
        this.props.right = this.body.domProps.right.width + this.body.domProps.border.right;
      } else {
        this.props.left = this.body.domProps.left.width + this.body.domProps.border.left;
      }

      // update class name
      frame.className = 'vis-itemset';

      if (this.options.cluster) {
        this._clusterItems();
      }

      // reorder the groups (if needed)
      resized = this._orderGroups() || resized;

      // check whether zoomed (in that case we need to re-stack everything)
      // TODO: would be nicer to get this as a trigger from Range
      const visibleInterval = range.end - range.start;
      const zoomed = (visibleInterval != this.lastVisibleInterval) || (this.props.width != this.props.lastWidth);
      const scrolled = range.start != this.lastRangeStart;
      const changedStackOption = options.stack != this.lastStack;
      const changedStackSubgroupsOption = options.stackSubgroups != this.lastStackSubgroups;
      const forceRestack = (zoomed || scrolled || changedStackOption || changedStackSubgroupsOption);
      this.lastVisibleInterval = visibleInterval;
      this.lastRangeStart = range.start;
      this.lastStack = options.stack;
      this.lastStackSubgroups = options.stackSubgroups;

      this.props.lastWidth = this.props.width;
      const firstGroup = this._firstGroup();
      const firstMargin = {
        item: margin.item,
        axis: margin.axis
      };
      const nonFirstMargin = {
        item: margin.item,
        axis: margin.item.vertical / 2
      };
      let height = 0;
      const minHeight = margin.axis + margin.item.vertical;

      // redraw the background group
      this.groups[BACKGROUND].redraw(range, nonFirstMargin, forceRestack);

      const redrawQueue = {};
      let redrawQueueLength = 0;

      // collect redraw functions
      availableUtils.forEach(this.groups, (group, key) => {
        if (key === BACKGROUND) return;
        const groupMargin = group == firstGroup ? firstMargin : nonFirstMargin;
        const returnQueue = true;
        redrawQueue[key] = group.redraw(range, groupMargin, forceRestack, returnQueue);
        redrawQueueLength = redrawQueue[key].length;
      });

      const needRedraw = redrawQueueLength > 0;
      if (needRedraw) {
        const redrawResults = {};

        for (let i = 0; i < redrawQueueLength; i++) {
          availableUtils.forEach(redrawQueue, (fns, key) => {
            redrawResults[key] = fns[i]();
          });
        }

        // redraw all regular groups
        availableUtils.forEach(this.groups, (group, key) => {
          if (key === BACKGROUND) return;
          const groupResized = redrawResults[key];
          resized = groupResized || resized;
          height += group.height;
        });
        height = Math.max(height, minHeight);
      }

      height = Math.max(height, minHeight);

      // update frame height
      frame.style.height  = asSize(height);

      // calculate actual size
      this.props.width = frame.offsetWidth;
      this.props.height = height;

      // reposition axis
      this.dom.axis.style.top = asSize((orientation == 'top') ?
          (this.body.domProps.top.height + this.body.domProps.border.top) :
          (this.body.domProps.top.height + this.body.domProps.centerContainer.height));
      if (this.options.rtl) {
        this.dom.axis.style.right = '0';
      } else {
        this.dom.axis.style.left = '0';
      }

      this.hammer.get('press').set({time: this.options.longSelectPressTime});

      this.initialItemSetDrawn = true;
      // check if this component is resized
      resized = this._isResized() || resized;

      return resized;
    }

    /**
     * Get the first group, aligned with the axis
     * @return {Group | null} firstGroup
     * @private
     */
    _firstGroup() {
      const firstGroupIndex = (this.options.orientation.item == 'top') ? 0 : (this.groupIds.length - 1);
      const firstGroupId = this.groupIds[firstGroupIndex];
      const firstGroup = this.groups[firstGroupId] || this.groups[UNGROUPED$1];

      return firstGroup || null;
    }

    /**
     * Create or delete the group holding all ungrouped items. This group is used when
     * there are no groups specified.
     * @protected
     */
    _updateUngrouped() {
      let ungrouped = this.groups[UNGROUPED$1];
      let item;
      let itemId;

      if (this.groupsData) {
        // remove the group holding all ungrouped items
        if (ungrouped) {
          ungrouped.dispose();
          delete this.groups[UNGROUPED$1];

          for (itemId in this.items) {
            if (this.items.hasOwnProperty(itemId)) {
              item = this.items[itemId];
              item.parent && item.parent.remove(item);
              const groupId = this.getGroupId(item.data);
              const group = this.groups[groupId];
              group && group.add(item) || item.hide();
            }
          }
        }
      }
      else {
        // create a group holding all (unfiltered) items
        if (!ungrouped) {
          const id = null;
          const data = null;
          ungrouped = new Group(id, data, this);
          this.groups[UNGROUPED$1] = ungrouped;

          for (itemId in this.items) {
            if (this.items.hasOwnProperty(itemId)) {
              item = this.items[itemId];
              ungrouped.add(item);
            }
          }

          ungrouped.show();
        }
      }
    }

    /**
     * Get the element for the labelset
     * @return {HTMLElement} labelSet
     */
    getLabelSet() {
      return this.dom.labelSet;
    }

    /**
     * Set items
     * @param {vis.DataSet | null} items
     */
    setItems(items) {
      this.itemsSettingTime = new Date();
      const me = this;
      let ids;
      const oldItemsData = this.itemsData;

      // replace the dataset
      if (!items) {
        this.itemsData = null;
      }
      else if (esnext.isDataViewLike("id", items)) {
        this.itemsData = typeCoerceDataSet(items);
      }
      else {
        throw new TypeError('Data must implement the interface of DataSet or DataView');
      }

      if (oldItemsData) {
        // unsubscribe from old dataset
        availableUtils.forEach(this.itemListeners, (callback, event) => {
          oldItemsData.off(event, callback);
        });

        // stop maintaining a coerced version of the old data set
        oldItemsData.dispose();

        // remove all drawn items
        ids = oldItemsData.getIds();
        this._onRemove(ids);
      }

      if (this.itemsData) {
        // subscribe to new dataset
        const id = this.id;
        availableUtils.forEach(this.itemListeners, (callback, event) => {
          me.itemsData.on(event, callback, id);
        });

        // add all new items
        ids = this.itemsData.getIds();
        this._onAdd(ids);

        // update the group holding all ungrouped items
        this._updateUngrouped();
      }

      this.body.emitter.emit('_change', {queue: true});
    }

    /**
     * Get the current items
     * @returns {vis.DataSet | null}
     */
    getItems() {
      return this.itemsData != null ? this.itemsData.rawDS : null;
    }

    /**
     * Set groups
     * @param {vis.DataSet} groups
     */
    setGroups(groups) {
      const me = this;
      let ids;

      // unsubscribe from current dataset
      if (this.groupsData) {
        availableUtils.forEach(this.groupListeners, (callback, event) => {
          me.groupsData.off(event, callback);
        });

        // remove all drawn groups
        ids = this.groupsData.getIds();
        this.groupsData = null;
        this._onRemoveGroups(ids); // note: this will cause a redraw
      }

      // replace the dataset
      if (!groups) {
        this.groupsData = null;
      }
      else if (esnext.isDataViewLike("id", groups)) {
        this.groupsData = groups;
      }
      else {
        throw new TypeError('Data must implement the interface of DataSet or DataView');
      }

      if (this.groupsData) {
        // go over all groups nesting
        const groupsData = this.groupsData.getDataSet();

        groupsData.get().forEach(group => {
          if (group.nestedGroups) {
            group.nestedGroups.forEach(nestedGroupId => {
              const updatedNestedGroup = groupsData.get(nestedGroupId);
              updatedNestedGroup.nestedInGroup = group.id;
              if (group.showNested == false) {
                updatedNestedGroup.visible = false;
              }
              groupsData.update(updatedNestedGroup);
            });
          }
        });

        // subscribe to new dataset
        const id = this.id;
        availableUtils.forEach(this.groupListeners, (callback, event) => {
          me.groupsData.on(event, callback, id);
        });

        // draw all ms
        ids = this.groupsData.getIds();
        this._onAddGroups(ids);
      }

      // update the group holding all ungrouped items
      this._updateUngrouped();

      // update the order of all items in each group
      this._order();

      if (this.options.cluster) {
        this.clusterGenerator.updateData();
        this._clusterItems();
        this.markDirty({ refreshItems: true, restackGroups: true });
      }

      this.body.emitter.emit('_change', {queue: true});
    }

    /**
     * Get the current groups
     * @returns {vis.DataSet | null} groups
     */
    getGroups() {
      return this.groupsData;
    }

    /**
     * Remove an item by its id
     * @param {string | number} id
     */
    removeItem(id) {
      const item = this.itemsData.get(id);

      if (item) {
        // confirm deletion
        this.options.onRemove(item, item => {
          if (item) {
            // remove by id here, it is possible that an item has no id defined
            // itself, so better not delete by the item itself
            this.itemsData.remove(id);
          }
        });
      }
    }

    /**
     * Get the time of an item based on it's data and options.type
     * @param {Object} itemData
     * @returns {string} Returns the type
     * @private
     */
    _getType(itemData) {
      return itemData.type || this.options.type || (itemData.end ? 'range' : 'box');
    }

    /**
     * Get the group id for an item
     * @param {Object} itemData
     * @returns {string} Returns the groupId
     * @private
     */
    getGroupId(itemData) {
      const type = this._getType(itemData);
      if (type == 'background' && itemData.group == undefined) {
       return BACKGROUND;
      }
      else {
        return this.groupsData ? itemData.group : UNGROUPED$1;
      }
    }

    /**
     * Handle updated items
     * @param {number[]} ids
     * @protected
     */
    _onUpdate(ids) {
      const me = this;

      ids.forEach(id => {
        const itemData = me.itemsData.get(id);
        let item = me.items[id];
        const type = itemData ? me._getType(itemData) : null;

        const constructor = ItemSet.types[type];
        let selected;

        if (item) {
          // update item   	
          if (!constructor || !(item instanceof constructor)) {
            // item type has changed, delete the item and recreate it
            selected = item.selected; // preserve selection of this item
            me._removeItem(item);
            item = null;
          }
          else {
            me._updateItem(item, itemData);
          }
        }

        if (!item && itemData) {
          // create item
          if (constructor) {
            item = new constructor(itemData, me.conversion, me.options);
            item.id = id; // TODO: not so nice setting id afterwards

            me._addItem(item);
            if (selected) {
              this.selection.push(id);
              item.select();
            }
          }
          else {
            throw new TypeError(`Unknown item type "${type}"`);
          }
        }
      });

      this._order();
      
      if (this.options.cluster) {
        this.clusterGenerator.setItems(this.items, { applyOnChangedLevel: false });
        this._clusterItems();
      }

      this.body.emitter.emit('_change', {queue: true});
    }

    /**
     * Handle removed items
     * @param {number[]} ids
     * @protected
     */
    _onRemove(ids) {
      let count = 0;
      const me = this;
      ids.forEach(id => {
        const item = me.items[id];
        if (item) {
          count++;
          me._removeItem(item);
        }
      });

      if (count) {
        // update order
        this._order();
        this.body.emitter.emit('_change', {queue: true});
      }
    }

    /**
     * Update the order of item in all groups
     * @private
     */
    _order() {
      // reorder the items in all groups
      // TODO: optimization: only reorder groups affected by the changed items
      availableUtils.forEach(this.groups, group => {
        group.order();
      });
    }

    /**
     * Handle updated groups
     * @param {number[]} ids
     * @private
     */
    _onUpdateGroups(ids) {
      this._onAddGroups(ids);
    }

    /**
     * Handle changed groups (added or updated)
     * @param {number[]} ids
     * @private
     */
    _onAddGroups(ids) {
      const me = this;

      ids.forEach(id => {
        const groupData = me.groupsData.get(id);
        let group = me.groups[id];

        if (!group) {
          // check for reserved ids
          if (id == UNGROUPED$1 || id == BACKGROUND) {
            throw new Error(`Illegal group id. ${id} is a reserved id.`);
          }

          const groupOptions = Object.create(me.options);
          availableUtils.extend(groupOptions, {
            height: null
          });

          group = new Group(id, groupData, me);
          me.groups[id] = group;

          // add items with this groupId to the new group
          for (const itemId in me.items) {
            if (me.items.hasOwnProperty(itemId)) {
              const item = me.items[itemId];
              if (item.data.group == id) {
                group.add(item);
              }
            }
          }

          group.order();
          group.show();
        }
        else {
          // update group
          group.setData(groupData);
        }
      });

      this.body.emitter.emit('_change', {queue: true});
    }

    /**
     * Handle removed groups
     * @param {number[]} ids
     * @private
     */
    _onRemoveGroups(ids) {
      ids.forEach(id => {
        const group = this.groups[id];

        if (group) {
          group.dispose();
          delete this.groups[id];
        }
      });

      if (this.options.cluster) {
        this.clusterGenerator.updateData();
        this._clusterItems();
      } 

      this.markDirty({ restackGroups: !!this.options.cluster });
      this.body.emitter.emit('_change', {queue: true});
    }

    /**
     * Reorder the groups if needed
     * @return {boolean} changed
     * @private
     */
    _orderGroups() {
      if (this.groupsData) {
        // reorder the groups
        let groupIds = this.groupsData.getIds({
          order: this.options.groupOrder
        });

        groupIds = this._orderNestedGroups(groupIds);

        const changed = !availableUtils.equalArray(groupIds, this.groupIds);
        if (changed) {
          // hide all groups, removes them from the DOM
          const groups = this.groups;
          groupIds.forEach(groupId => {
            groups[groupId].hide();
          });

          // show the groups again, attach them to the DOM in correct order
          groupIds.forEach(groupId => {
            groups[groupId].show();
          });

          this.groupIds = groupIds;
        }

        return changed;
      }
      else {
        return false;
      }
    }

    /**
     * Reorder the nested groups
     *
     * @param {Array.<number>} groupIds
     * @returns {Array.<number>}
     * @private
     */
    _orderNestedGroups(groupIds) {
      /**
       * Recursively order nested groups
       *
       * @param {ItemSet} t
       * @param {Array.<number>} groupIds
       * @returns {Array.<number>}
       * @private
       */
      function getOrderedNestedGroups(t, groupIds) {
        let result = [];
        groupIds.forEach(groupId => {
          result.push(groupId);
          const groupData = t.groupsData.get(groupId);
          if (groupData.nestedGroups) {
            const nestedGroupIds = t.groupsData.get({
              filter(nestedGroup) {
                return nestedGroup.nestedInGroup == groupId;
              },
              order: t.options.groupOrder
            }).map(nestedGroup => nestedGroup.id);
            result = result.concat(getOrderedNestedGroups(t, nestedGroupIds));
          }
        });

        return result;
      }

      const topGroupIds = groupIds.filter(groupId => !this.groupsData.get(groupId).nestedInGroup);

      return getOrderedNestedGroups(this, topGroupIds);
    }

    /**
     * Add a new item
     * @param {Item} item
     * @private
     */
    _addItem(item) {
      this.items[item.id] = item;

      // add to group
      const groupId = this.getGroupId(item.data);
      const group = this.groups[groupId];

      if (!group) {
        item.groupShowing = false;
      } else if (group && group.data && group.data.showNested) {
        item.groupShowing = true;
      }

      if (group) group.add(item);
    }

    /**
     * Update an existing item
     * @param {Item} item
     * @param {Object} itemData
     * @private
     */
    _updateItem(item, itemData) {
      // update the items data (will redraw the item when displayed)
      item.setData(itemData);

      const groupId = this.getGroupId(item.data);
      const group = this.groups[groupId];
      if (!group) {
        item.groupShowing = false;
      } else if (group && group.data && group.data.showNested) {
        item.groupShowing = true;
      }
    }

    /**
     * Delete an item from the ItemSet: remove it from the DOM, from the map
     * with items, and from the map with visible items, and from the selection
     * @param {Item} item
     * @private
     */
    _removeItem(item) {
      // remove from DOM
      item.hide();

      // remove from items
      delete this.items[item.id];

      // remove from selection
      const index = this.selection.indexOf(item.id);
      if (index != -1) this.selection.splice(index, 1);

      // remove from group
      item.parent && item.parent.remove(item);

      // remove Tooltip from DOM
      if (this.popup != null) {
        this.popup.hide();
      }
    }

    /**
     * Create an array containing all items being a range (having an end date)
     * @param {Array.<Object>} array
     * @returns {Array}
     * @private
     */
    _constructByEndArray(array) {
      const endArray = [];

      for (let i = 0; i < array.length; i++) {
        if (array[i] instanceof RangeItem) {
          endArray.push(array[i]);
        }
      }
      return endArray;
    }

    /**
     * Register the clicked item on touch, before dragStart is initiated.
     *
     * dragStart is initiated from a mousemove event, AFTER the mouse/touch is
     * already moving. Therefore, the mouse/touch can sometimes be above an other
     * DOM element than the item itself.
     *
     * @param {Event} event
     * @private
     */
    _onTouch(event) {
      // store the touched item, used in _onDragStart
      this.touchParams.item = this.itemFromTarget(event);
      this.touchParams.dragLeftItem = event.target.dragLeftItem || false;
      this.touchParams.dragRightItem = event.target.dragRightItem || false;
      this.touchParams.itemProps = null;
    }

    /**
     * Given an group id, returns the index it has.
     *
     * @param {number} groupId
     * @returns {number} index / groupId
     * @private
     */
    _getGroupIndex(groupId) {
        for (let i = 0; i < this.groupIds.length; i++) {
            if (groupId == this.groupIds[i])
                return i;
        }
    }

    /**
     * Start dragging the selected events
     * @param {Event} event
     * @private
     */
    _onDragStart(event) {
      if (this.touchParams.itemIsDragging) { return; }
      const item = this.touchParams.item || null;
      const me = this;
      let props;

      if (item && (item.selected || this.options.itemsAlwaysDraggable.item)) {

        if (this.options.editable.overrideItems &&
            !this.options.editable.updateTime &&
            !this.options.editable.updateGroup) {
          return;
        }

        // override options.editable
        if ((item.editable != null && !item.editable.updateTime && !item.editable.updateGroup)
            && !this.options.editable.overrideItems) {
          return;
        }

        const dragLeftItem = this.touchParams.dragLeftItem;
        const dragRightItem = this.touchParams.dragRightItem;
        this.touchParams.itemIsDragging = true;
        this.touchParams.selectedItem = item;

        if (dragLeftItem) {
          props = {
            item: dragLeftItem,
            initialX: event.center.x,
            dragLeft:  true,
            data: this._cloneItemData(item.data)
          };

          this.touchParams.itemProps = [props];
        } else if (dragRightItem) {
          props = {
            item: dragRightItem,
            initialX: event.center.x,
            dragRight: true,
            data: this._cloneItemData(item.data)
          };

          this.touchParams.itemProps = [props];
        } else if (this.options.editable.add && (event.srcEvent.ctrlKey || event.srcEvent.metaKey)) {
          // create a new range item when dragging with ctrl key down
          this._onDragStartAddItem(event);
        } else {
          if(this.groupIds.length < 1) {
            // Mitigates a race condition if _onDragStart() is
            // called after markDirty() without redraw() being called between.
            this.redraw();
          }
          
          const baseGroupIndex = this._getGroupIndex(item.data.group);

          const itemsToDrag = (this.options.itemsAlwaysDraggable.item && !item.selected) ? [item.id] : this.getSelection();

          this.touchParams.itemProps = itemsToDrag.map(id => {
            const item = me.items[id];
            const groupIndex = me._getGroupIndex(item.data.group);
            return {
              item,
              initialX: event.center.x,
              groupOffset: baseGroupIndex-groupIndex,
              data: this._cloneItemData(item.data)
            };
          });
        }

        event.stopPropagation();
      } else if (this.options.editable.add && (event.srcEvent.ctrlKey || event.srcEvent.metaKey)) {
        // create a new range item when dragging with ctrl key down
        this._onDragStartAddItem(event);
      }
    }

    /**
     * Start creating a new range item by dragging.
     * @param {Event} event
     * @private
     */
    _onDragStartAddItem(event) {
      const snap = this.options.snap || null;
      const frameRect = this.dom.frame.getBoundingClientRect();

      // plus (if rtl) 10 to compensate for the drag starting as soon as you've moved 10px
      const x = this.options.rtl ? frameRect.right - event.center.x  + 10 : event.center.x - frameRect.left - 10;

      const time = this.body.util.toTime(x);
      const scale = this.body.util.getScale();
      const step = this.body.util.getStep();
      const start = snap ? snap(time, scale, step) : time;
      const end = start;

      const itemData = {
        type: 'range',
        start,
        end,
        content: 'new item'
      };

      const id = uuid.v4();
      itemData[this.itemsData.idProp] = id;

      const group = this.groupFromTarget(event);
      if (group) {
        itemData.group = group.groupId;
      }
      const newItem = new RangeItem(itemData, this.conversion, this.options);
      newItem.id = id; // TODO: not so nice setting id afterwards
      newItem.data = this._cloneItemData(itemData);
      this._addItem(newItem);
      this.touchParams.selectedItem = newItem;
      
      const props = {
        item: newItem,
        initialX: event.center.x,
        data: newItem.data
      };

      if (this.options.rtl) {
        props.dragLeft = true;
      } else {
        props.dragRight = true;
      }
      this.touchParams.itemProps = [props];

      event.stopPropagation();
    }

    /**
     * Drag selected items
     * @param {Event} event
     * @private
     */
    _onDrag(event) {
      if (this.popup != null && this.options.showTooltips && !this.popup.hidden) {
        // this.popup.hide();
        const container = this.body.dom.centerContainer;
        const containerRect = container.getBoundingClientRect();
        this.popup.setPosition(
          event.center.x - containerRect.left + container.offsetLeft,
          event.center.y - containerRect.top + container.offsetTop
        );
        this.popup.show(); // redraw
      }
      
      if (this.touchParams.itemProps) {
        event.stopPropagation();

        const me = this;
        const snap = this.options.snap || null;
        const domRootOffsetLeft = this.body.dom.root.offsetLeft;
        const xOffset = this.options.rtl ? domRootOffsetLeft + this.body.domProps.right.width : domRootOffsetLeft + this.body.domProps.left.width;
        const scale = this.body.util.getScale();
        const step = this.body.util.getStep();

        //only calculate the new group for the item that's actually dragged
        const selectedItem = this.touchParams.selectedItem;
        const updateGroupAllowed = ((this.options.editable.overrideItems || selectedItem.editable == null) && this.options.editable.updateGroup) ||
                                 (!this.options.editable.overrideItems && selectedItem.editable != null && selectedItem.editable.updateGroup);
        let newGroupBase = null;
        if (updateGroupAllowed && selectedItem) {
          if (selectedItem.data.group != undefined) {
            // drag from one group to another
            const group = me.groupFromTarget(event);
            if (group) {
              //we know the offset for all items, so the new group for all items
              //will be relative to this one.
              newGroupBase = this._getGroupIndex(group.groupId);
            }
          }
        }

        // move
        this.touchParams.itemProps.forEach(props => {
          const current = me.body.util.toTime(event.center.x - xOffset);
          const initial = me.body.util.toTime(props.initialX - xOffset);
          let offset;
          let initialStart;
          let initialEnd;
          let start;
          let end;

          if (this.options.rtl) {
            offset = -(current - initial); // ms
          } else {
            offset = (current - initial); // ms
          }

          let itemData = this._cloneItemData(props.item.data); // clone the data
          if (props.item.editable != null
            && !props.item.editable.updateTime
            && !props.item.editable.updateGroup
            && !me.options.editable.overrideItems) {
            return;
          }

          const updateTimeAllowed = ((this.options.editable.overrideItems || selectedItem.editable == null) && this.options.editable.updateTime) ||
                                   (!this.options.editable.overrideItems && selectedItem.editable != null && selectedItem.editable.updateTime);
          if (updateTimeAllowed) {
            if (props.dragLeft) {
              // drag left side of a range item
              if (this.options.rtl) {
                if (itemData.end != undefined) {
                  initialEnd = availableUtils.convert(props.data.end, 'Date');
                  end = new Date(initialEnd.valueOf() + offset);
                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.end = snap ? snap(end, scale, step) : end;
                }
              } else {
                if (itemData.start != undefined) {
                  initialStart = availableUtils.convert(props.data.start, 'Date');
                  start = new Date(initialStart.valueOf() + offset);
                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.start = snap ? snap(start, scale, step) : start;
                }
              }
            }
            else if (props.dragRight) {
              // drag right side of a range item
              if (this.options.rtl) {
                if (itemData.start != undefined) {
                  initialStart = availableUtils.convert(props.data.start, 'Date');
                  start = new Date(initialStart.valueOf() + offset);
                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.start = snap ? snap(start, scale, step) : start;
                }
              } else {
                if (itemData.end != undefined) {
                  initialEnd = availableUtils.convert(props.data.end, 'Date');
                  end = new Date(initialEnd.valueOf() + offset);
                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.end = snap ? snap(end, scale, step) : end;
                }
              }
            }
            else {
              // drag both start and end
              if (itemData.start != undefined) {

                initialStart = availableUtils.convert(props.data.start, 'Date').valueOf();
                start = new Date(initialStart + offset);

                if (itemData.end != undefined) {
                  initialEnd = availableUtils.convert(props.data.end, 'Date');
                  const duration  = initialEnd.valueOf() - initialStart.valueOf();

                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.start = snap ? snap(start, scale, step) : start;
                  itemData.end   = new Date(itemData.start.valueOf() + duration);
                }
                else {
                  // TODO: pass a Moment instead of a Date to snap(). (Breaking change)
                  itemData.start = snap ? snap(start, scale, step) : start;
                }
              }
            }
          }

          if (updateGroupAllowed && (!props.dragLeft && !props.dragRight) && newGroupBase!=null) {
            if (itemData.group != undefined) {
              let newOffset = newGroupBase - props.groupOffset;

              //make sure we stay in bounds
              newOffset = Math.max(0, newOffset);
              newOffset = Math.min(me.groupIds.length-1, newOffset);
              itemData.group = me.groupIds[newOffset];
            }
          }

          // confirm moving the item
          itemData = this._cloneItemData(itemData);  // convert start and end to the correct type
          me.options.onMoving(itemData, itemData => {
            if (itemData) {
              props.item.setData(this._cloneItemData(itemData, 'Date'));
            }
          });
        });
        
        this.body.emitter.emit('_change');
      }
    }

    /**
     * Move an item to another group
     * @param {Item} item
     * @param {string | number} groupId
     * @private
     */
    _moveToGroup(item, groupId) {
      const group = this.groups[groupId];
      if (group && group.groupId != item.data.group) {
        const oldGroup = item.parent;
        oldGroup.remove(item);
        oldGroup.order();
        
        item.data.group = group.groupId;
        
        group.add(item);
        group.order();
      }
    }

    /**
     * End of dragging selected items
     * @param {Event} event
     * @private
     */
    _onDragEnd(event) {
      this.touchParams.itemIsDragging = false;
      if (this.touchParams.itemProps) {
        event.stopPropagation();

        const me = this;
        const itemProps = this.touchParams.itemProps;
        this.touchParams.itemProps = null;

        itemProps.forEach(props => {
          const id = props.item.id;
          const exists = me.itemsData.get(id) != null;

          if (!exists) {
            // add a new item
            me.options.onAdd(props.item.data, itemData => {
              me._removeItem(props.item); // remove temporary item
              if (itemData) {
                me.itemsData.add(itemData);
              }

              // force re-stacking of all items next redraw
              me.body.emitter.emit('_change');
            });
          }
          else {
            // update existing item
            const itemData = this._cloneItemData(props.item.data); // convert start and end to the correct type
            me.options.onMove(itemData, itemData => {
              if (itemData) {
                // apply changes
                itemData[this.itemsData.idProp] = id; // ensure the item contains its id (can be undefined)
                this.itemsData.update(itemData);
              }
              else {
                // restore original values
                props.item.setData(props.data);

                me.body.emitter.emit('_change');
              }
            });
          }
        });
      }
    }

    /**
     * On group click
     * @param {Event} event
     * @private
     */
    _onGroupClick(event) {
      const group = this.groupFromTarget(event);
      setTimeout(() => {
        this.toggleGroupShowNested(group);
      }, 1);
    }
    
    /**
     * Toggle show nested
     * @param {object} group
     * @param {boolean} force
     */
    toggleGroupShowNested(group, force = undefined) {

      if (!group || !group.nestedGroups) return;

      const groupsData = this.groupsData.getDataSet();

      if (force != undefined) {
        group.showNested = !!force;
      } else {
        group.showNested = !group.showNested;
      }

      let nestingGroup = groupsData.get(group.groupId);
      nestingGroup.showNested = group.showNested;

      let fullNestedGroups = group.nestedGroups;
      let nextLevel = fullNestedGroups;
      while (nextLevel.length > 0) {
        let current = nextLevel;
        nextLevel = [];
        for (let i = 0; i < current.length; i++) {
          let node = groupsData.get(current[i]);
          if (node.nestedGroups) {
            nextLevel = nextLevel.concat(node.nestedGroups);
          }
        }
        if (nextLevel.length > 0) {
          fullNestedGroups = fullNestedGroups.concat(nextLevel);
        }
      }
      let nestedGroups = groupsData.get(fullNestedGroups).map(function (nestedGroup) {
          if (nestedGroup.visible == undefined) {
            nestedGroup.visible = true;
          }
          nestedGroup.visible = !!nestingGroup.showNested;
          return nestedGroup;
        });

      groupsData.update(nestedGroups.concat(nestingGroup));

      if (nestingGroup.showNested) {
        availableUtils.removeClassName(group.dom.label, 'collapsed');
        availableUtils.addClassName(group.dom.label, 'expanded');
      } else {
        availableUtils.removeClassName(group.dom.label, 'expanded');
        availableUtils.addClassName(group.dom.label, 'collapsed');
      }
    }
    
    /**
     * Toggle group drag classname
     * @param {object} group
     */
    toggleGroupDragClassName(group) {
      group.dom.label.classList.toggle('vis-group-is-dragging');
      group.dom.foreground.classList.toggle('vis-group-is-dragging');
    }
    
    /**
     * on drag start
     * @param {Event} event
     * @return {void}   
     * @private
     */
    _onGroupDragStart(event) {
      if (this.groupTouchParams.isDragging) return;

      if (this.options.groupEditable.order) {
        this.groupTouchParams.group = this.groupFromTarget(event);
        
        if (this.groupTouchParams.group) {
          event.stopPropagation();      
          
          this.groupTouchParams.isDragging = true;
          this.toggleGroupDragClassName(this.groupTouchParams.group);
          
          this.groupTouchParams.originalOrder = this.groupsData.getIds({
            order: this.options.groupOrder
          });
        }
      }
    }

    /**
     * on drag
     * @param {Event} event
     * @return {void}
     * @private
     */
    _onGroupDrag(event) {
        if (this.options.groupEditable.order && this.groupTouchParams.group) {
            event.stopPropagation();
            
        const groupsData = this.groupsData.getDataSet();
            // drag from one group to another
            const group = this.groupFromTarget(event);
            
            // try to avoid toggling when groups differ in height
            if (group && group.height != this.groupTouchParams.group.height) {
                const movingUp = (group.top < this.groupTouchParams.group.top);
                const clientY = event.center ? event.center.y : event.clientY;
                const targetGroup = group.dom.foreground.getBoundingClientRect();
                const draggedGroupHeight = this.groupTouchParams.group.height;
                if (movingUp) {
                    // skip swapping the groups when the dragged group is not below clientY afterwards
                    if (targetGroup.top + draggedGroupHeight < clientY) {
                        return;
                    }
                } else {
                    const targetGroupHeight = group.height;
                    // skip swapping the groups when the dragged group is not below clientY afterwards
                    if (targetGroup.top + targetGroupHeight - draggedGroupHeight > clientY) {
                        return;
                    }
                }
            }
            
            if (group && group != this.groupTouchParams.group) {
                const targetGroup = groupsData.get(group.groupId);
                const draggedGroup = groupsData.get(this.groupTouchParams.group.groupId);
                
                // switch groups
                if (draggedGroup && targetGroup) {
                    this.options.groupOrderSwap(draggedGroup, targetGroup, groupsData);
                    groupsData.update(draggedGroup);
                    groupsData.update(targetGroup);
                }
                
                // fetch current order of groups
                const newOrder = groupsData.getIds({
                  order: this.options.groupOrder
                });

                
                // in case of changes since _onGroupDragStart
                if (!availableUtils.equalArray(newOrder, this.groupTouchParams.originalOrder)) {
                    const origOrder = this.groupTouchParams.originalOrder;
                    const draggedId = this.groupTouchParams.group.groupId;
                    const numGroups = Math.min(origOrder.length, newOrder.length);
                    let curPos = 0;
                    let newOffset = 0;
                    let orgOffset = 0;
                    while (curPos < numGroups) {
                        // as long as the groups are where they should be step down along the groups order
                        while ((curPos+newOffset) < numGroups 
                            && (curPos+orgOffset) < numGroups 
                            && newOrder[curPos+newOffset] == origOrder[curPos+orgOffset]) {
                            curPos++;
                        }
                        
                        // all ok
                        if (curPos+newOffset >= numGroups) {
                            break;
                        }
                        
                        // not all ok
                        // if dragged group was move upwards everything below should have an offset
                        if (newOrder[curPos+newOffset] == draggedId) {
                            newOffset = 1;

                        }
                        // if dragged group was move downwards everything above should have an offset
                        else if (origOrder[curPos+orgOffset] == draggedId) {
                            orgOffset = 1;

                        } 
                        // found a group (apart from dragged group) that has the wrong position -> switch with the 
                        // group at the position where other one should be, fix index arrays and continue
                        else {
                            const slippedPosition = newOrder.indexOf(origOrder[curPos+orgOffset]);
                            const switchGroup = groupsData.get(newOrder[curPos+newOffset]);
                            const shouldBeGroup = groupsData.get(origOrder[curPos+orgOffset]);
                            this.options.groupOrderSwap(switchGroup, shouldBeGroup, groupsData);
                            groupsData.update(switchGroup);
                            groupsData.update(shouldBeGroup);
                            
                            const switchGroupId = newOrder[curPos+newOffset];
                            newOrder[curPos+newOffset] = origOrder[curPos+orgOffset];
                            newOrder[slippedPosition] = switchGroupId;
                            
                            curPos++;
                        }
                    }
                }
                
            }
        }
    }

    /**
     * on drag end
     * @param {Event} event
     * @return {void}
     * @private
     */
    _onGroupDragEnd(event) {
      this.groupTouchParams.isDragging = false;

      if (this.options.groupEditable.order && this.groupTouchParams.group) {
        event.stopPropagation();
            
        // update existing group
        const me = this;
        const id = me.groupTouchParams.group.groupId;
        const dataset = me.groupsData.getDataSet();
        const groupData = availableUtils.extend({}, dataset.get(id)); // clone the data
        me.options.onMoveGroup(groupData, groupData => {
          if (groupData) {
            // apply changes
            groupData[dataset._idProp] = id; // ensure the group contains its id (can be undefined)
            dataset.update(groupData);
          }
          else {

            // fetch current order of groups
            const newOrder = dataset.getIds({
                order: me.options.groupOrder
            });

            // restore original order
            if (!availableUtils.equalArray(newOrder, me.groupTouchParams.originalOrder)) {
              const origOrder = me.groupTouchParams.originalOrder;
              const numGroups = Math.min(origOrder.length, newOrder.length);
              let curPos = 0;
              while (curPos < numGroups) {
                // as long as the groups are where they should be step down along the groups order
                while (curPos < numGroups && newOrder[curPos] == origOrder[curPos]) {
                  curPos++;
                }

                // all ok
                if (curPos >= numGroups) {
                  break;
                }

                // found a group that has the wrong position -> switch with the
                // group at the position where other one should be, fix index arrays and continue
                const slippedPosition = newOrder.indexOf(origOrder[curPos]);
                const switchGroup = dataset.get(newOrder[curPos]);
                const shouldBeGroup = dataset.get(origOrder[curPos]);
                me.options.groupOrderSwap(switchGroup, shouldBeGroup, dataset);
                dataset.update(switchGroup);
                dataset.update(shouldBeGroup);

                const switchGroupId = newOrder[curPos];
                newOrder[curPos] = origOrder[curPos];
                newOrder[slippedPosition] = switchGroupId;

                curPos++;
              }
            }
          }
        });

        me.body.emitter.emit('groupDragged', { groupId: id });
        this.toggleGroupDragClassName(this.groupTouchParams.group);
        this.groupTouchParams.group = null;
      }
    }

    /**
     * Handle selecting/deselecting an item when tapping it
     * @param {Event} event
     * @private
     */
    _onSelectItem(event) {
      if (!this.options.selectable) return;

      const ctrlKey  = event.srcEvent && (event.srcEvent.ctrlKey || event.srcEvent.metaKey);
      const shiftKey = event.srcEvent && event.srcEvent.shiftKey;
      if (ctrlKey || shiftKey) {
        this._onMultiSelectItem(event);
        return;
      }

      const oldSelection = this.getSelection();

      const item = this.itemFromTarget(event);
      const selection = item && item.selectable ? [item.id] : [];
      this.setSelection(selection);

      const newSelection = this.getSelection();

      // emit a select event,
      // except when old selection is empty and new selection is still empty
      if (newSelection.length > 0 || oldSelection.length > 0) {
        this.body.emitter.emit('select', {
          items: newSelection,
          event
        });
      }
    }

    /**
     * Handle hovering an item
     * @param {Event} event
     * @private
     */
    _onMouseOver(event) {
      const item = this.itemFromTarget(event);
      if (!item) return;

      // Item we just left
      const related = this.itemFromRelatedTarget(event);
      if (item === related) {
        // We haven't changed item, just element in the item
        return;
      }

      const title = item.getTitle();
      if (this.options.showTooltips && title) {
        if (this.popup == null) {
          this.popup = new Popup(this.body.dom.root,
              this.options.tooltip.overflowMethod || 'flip');
        }

        this.popup.setText(title);
        const container = this.body.dom.centerContainer;
        const containerRect = container.getBoundingClientRect();
        this.popup.setPosition(
          event.clientX - containerRect.left + container.offsetLeft,
          event.clientY - containerRect.top + container.offsetTop
        );
        this.setPopupTimer(this.popup);
      } else {
        // Hovering over item without a title, hide popup
        // Needed instead of _just_ in _onMouseOut due to #2572
        this.clearPopupTimer();
        if (this.popup != null) {
          this.popup.hide();
        }
      }

      this.body.emitter.emit('itemover', {
        item: item.id,
        event
      });
    }

    /**
     * on mouse start
     * @param {Event} event
     * @return {void}   
     * @private
     */
    _onMouseOut(event) {
      const item = this.itemFromTarget(event);
      if (!item) return;

      // Item we are going to
      const related = this.itemFromRelatedTarget(event);
      if (item === related) {
        // We aren't changing item, just element in the item
        return;
      }

      this.clearPopupTimer();
      if (this.popup != null) {
        this.popup.hide();
      }

      this.body.emitter.emit('itemout', {
        item: item.id,
        event
      });
    }

    /**
     * on mouse move
     * @param {Event} event
     * @return {void}   
     * @private
     */
    _onMouseMove(event) {
      const item = this.itemFromTarget(event);
      if (!item) return;

      if (this.popupTimer != null) {
        // restart timer
        this.setPopupTimer(this.popup);
      }
      
      if (this.options.showTooltips && this.options.tooltip.followMouse && this.popup && !this.popup.hidden) {
        const container = this.body.dom.centerContainer;
        const containerRect = container.getBoundingClientRect();
        this.popup.setPosition(
          event.clientX - containerRect.left + container.offsetLeft,
          event.clientY - containerRect.top + container.offsetTop
        );
        this.popup.show(); // Redraw
      }
    }

    /**
     * Handle mousewheel
     * @param {Event}  event   The event
     * @private
     */
    _onMouseWheel(event) {
      if (this.touchParams.itemIsDragging) {
        this._onDragEnd(event);
      }
    }

    /**
     * Handle updates of an item on double tap
     * @param {timeline.Item}  item   The item
     * @private
     */
    _onUpdateItem(item) {
      if (!this.options.selectable) return;
      if (!this.options.editable.updateTime && !this.options.editable.updateGroup) return;

      const me = this;
     
      if (item) {
        // execute async handler to update the item (or cancel it)
        const itemData = me.itemsData.get(item.id); // get a clone of the data from the dataset
        this.options.onUpdate(itemData, itemData => {
          if (itemData) {
            me.itemsData.update(itemData);
          }
        });
      }
    }

    /**
     * Handle drop event of data on item
     * Only called when `objectData.target === 'item'.
     * @param {Event} event The event 
     * @private
     */
    _onDropObjectOnItem(event) {
      const item = this.itemFromTarget(event);
      const objectData = JSON.parse(event.dataTransfer.getData("text"));
      this.options.onDropObjectOnItem(objectData, item);
    }

    /**
     * Handle creation of an item on double tap or drop of a drag event
     * @param {Event} event   The event
     * @private
     */
    _onAddItem(event) {
      if (!this.options.selectable) return;
      if (!this.options.editable.add) return;

      const me = this;
      const snap = this.options.snap || null;

      // add item
      const frameRect = this.dom.frame.getBoundingClientRect();
      const x = this.options.rtl ? frameRect.right - event.center.x : event.center.x - frameRect.left;
      const start = this.body.util.toTime(x);
      const scale = this.body.util.getScale();
      const step = this.body.util.getStep();
      let end;

      let newItemData;
      if (event.type == 'drop') {
        newItemData = JSON.parse(event.dataTransfer.getData("text"));
        newItemData.content = newItemData.content ? newItemData.content : 'new item';
        newItemData.start = newItemData.start ? newItemData.start : (snap ? snap(start, scale, step) : start);
        newItemData.type = newItemData.type || 'box';
        newItemData[this.itemsData.idProp] = newItemData.id || uuid.v4();

        if (newItemData.type == 'range' && !newItemData.end) {
          end = this.body.util.toTime(x + this.props.width / 5);
          newItemData.end = snap ? snap(end, scale, step) : end;
        }
      } else {
        newItemData = {
          start: snap ? snap(start, scale, step) : start,
          content: 'new item'
        };
        newItemData[this.itemsData.idProp] = uuid.v4();

        // when default type is a range, add a default end date to the new item
        if (this.options.type === 'range') {
          end = this.body.util.toTime(x + this.props.width / 5);
          newItemData.end = snap ? snap(end, scale, step) : end;
        }
      }

      const group = this.groupFromTarget(event);
      if (group) {
        newItemData.group = group.groupId;
      }

      // execute async handler to customize (or cancel) adding an item
      newItemData = this._cloneItemData(newItemData);     // convert start and end to the correct type
      this.options.onAdd(newItemData, item => {
        if (item) {
          me.itemsData.add(item);
          if (event.type == 'drop') {
            me.setSelection([item.id]);
          }
          // TODO: need to trigger a redraw?
        }
      });
    }

    /**
     * Handle selecting/deselecting multiple items when holding an item
     * @param {Event} event
     * @private
     */
    _onMultiSelectItem(event) {
      if (!this.options.selectable) return;

      const item = this.itemFromTarget(event);

      if (item) {
        // multi select items (if allowed)

        let selection = this.options.multiselect
          ? this.getSelection() // take current selection
          : [];                 // deselect current selection

        const shiftKey = event.srcEvent && event.srcEvent.shiftKey || false;

        if ((shiftKey || this.options.sequentialSelection) && this.options.multiselect) {
          // select all items between the old selection and the tapped item
          const itemGroup = this.itemsData.get(item.id).group;

          // when filtering get the group of the last selected item
          let lastSelectedGroup = undefined;
          if (this.options.multiselectPerGroup) {
            if (selection.length > 0) {
              lastSelectedGroup = this.itemsData.get(selection[0]).group;
            }
          }

          // determine the selection range
          if (!this.options.multiselectPerGroup || lastSelectedGroup == undefined || lastSelectedGroup == itemGroup) {
            selection.push(item.id);
          }
          const range = ItemSet._getItemRange(this.itemsData.get(selection));
          
          if (!this.options.multiselectPerGroup || lastSelectedGroup == itemGroup) {
            // select all items within the selection range
            selection = [];
            for (const id in this.items) {
              if (this.items.hasOwnProperty(id)) {
                const _item = this.items[id];
                const start = _item.data.start;
                const end = (_item.data.end !== undefined) ? _item.data.end : start;

                if (start >= range.min &&
                    end <= range.max &&
                    (!this.options.multiselectPerGroup || lastSelectedGroup == this.itemsData.get(_item.id).group) &&
                    !(_item instanceof BackgroundItem)) {
                  selection.push(_item.id); // do not use id but item.id, id itself is stringified
                }
              }
            }
          }
        }
        else {
          // add/remove this item from the current selection
          const index = selection.indexOf(item.id);
          if (index == -1) {
            // item is not yet selected -> select it
            selection.push(item.id);
          }
          else {
            // item is already selected -> deselect it
            selection.splice(index, 1);
          }
        }

        const filteredSelection = selection.filter(item => this.getItemById(item).selectable);

        this.setSelection(filteredSelection);

        this.body.emitter.emit('select', {
          items: this.getSelection(),
          event
        });
      }
    }

    /**
     * Calculate the time range of a list of items
     * @param {Array.<Object>} itemsData
     * @return {{min: Date, max: Date}} Returns the range of the provided items
     * @private
     */
    static _getItemRange(itemsData) {
      let max = null;
      let min = null;

      itemsData.forEach(data => {
        if (min == null || data.start < min) {
          min = data.start;
        }

        if (data.end != undefined) {
          if (max == null || data.end > max) {
            max = data.end;
          }
        }
        else {
          if (max == null || data.start > max) {
            max = data.start;
          }
        }
      });

      return {
        min,
        max
      }
    }

    /**
     * Find an item from an element:
     * searches for the attribute 'vis-item' in the element's tree
     * @param {HTMLElement} element
     * @return {Item | null} item
     */
    itemFromElement(element) {
      let cur = element;
      while (cur) {
        if (cur.hasOwnProperty('vis-item')) {
          return cur['vis-item'];
        }
        cur = cur.parentNode;
      }

      return null;
    }

    /**
     * Find an item from an event target:
     * searches for the attribute 'vis-item' in the event target's element tree
     * @param {Event} event
     * @return {Item | null} item
     */
    itemFromTarget(event) {
      return this.itemFromElement(event.target);
    }

    /**
     * Find an item from an event's related target:
     * searches for the attribute 'vis-item' in the related target's element tree
     * @param {Event} event
     * @return {Item | null} item
     */
    itemFromRelatedTarget(event) {
      return this.itemFromElement(event.relatedTarget);
    }

    /**
     * Find the Group from an event target:
     * searches for the attribute 'vis-group' in the event target's element tree
     * @param {Event} event
     * @return {Group | null} group
     */
    groupFromTarget(event) {
      const clientY = event.center ? event.center.y : event.clientY;
      let groupIds = this.groupIds;
      
      if (groupIds.length <= 0 && this.groupsData) {
        groupIds = this.groupsData.getIds({
          order: this.options.groupOrder
        });
      }
      
      for (let i = 0; i < groupIds.length; i++) {
        const groupId = groupIds[i];
        const group = this.groups[groupId];
        const foreground = group.dom.foreground;
        const foregroundRect = foreground.getBoundingClientRect();
        if (clientY >= foregroundRect.top && clientY < foregroundRect.top + foreground.offsetHeight) {
          return group;
        }

        if (this.options.orientation.item === 'top') {
          if (i === this.groupIds.length - 1 && clientY > foregroundRect.top) {
            return group;
          }
        }
        else {
          if (i === 0 && clientY < foregroundRect.top + foreground.offset) {
            return group;
          }
        }
      }

      return null;
    }

    /**
     * Find the ItemSet from an event target:
     * searches for the attribute 'vis-itemset' in the event target's element tree
     * @param {Event} event
     * @return {ItemSet | null} item
     */
    static itemSetFromTarget(event) {
      let target = event.target;
      while (target) {
        if (target.hasOwnProperty('vis-itemset')) {
          return target['vis-itemset'];
        }
        target = target.parentNode;
      }

      return null;
    }

    /**
     * Clone the data of an item, and "normalize" it: convert the start and end date
     * to the type (Date, Moment, ...) configured in the DataSet. If not configured,
     * start and end are converted to Date.
     * @param {Object} itemData, typically `item.data`
     * @param {string} [type]  Optional Date type. If not provided, the type from the DataSet is taken
     * @return {Object} The cloned object
     * @private
     */
    _cloneItemData(itemData, type) {
      const clone = availableUtils.extend({}, itemData);

      if (!type) {
        // convert start and end date to the type (Date, Moment, ...) configured in the DataSet
        type = this.itemsData.type;
      }

      if (clone.start != undefined) {
        clone.start = availableUtils.convert(clone.start, type && type.start || 'Date');
      }
      if (clone.end != undefined) {
        clone.end = availableUtils.convert(clone.end , type && type.end || 'Date');
      }

      return clone;
    }

    /**
     * cluster items
     * @return {void}   
     * @private
     */
    _clusterItems() {
      if (!this.options.cluster) {
        return;
      }

      const { scale } = this.body.range.conversion(this.body.domProps.center.width);
      const clusters = this.clusterGenerator.getClusters(this.clusters, scale, this.options.cluster);

      if (this.clusters != clusters) {
        this._detachAllClusters();

        if (clusters) {
          for (let cluster of clusters) {
            cluster.attach();
          }
          this.clusters = clusters;
        }

        this._updateClusters(clusters);
      }
    }

    /**
     * detach all cluster items
     * @private
     */
    _detachAllClusters() {
      if (this.options.cluster) {
        if (this.clusters && this.clusters.length) {
          for (let cluster of this.clusters) {
            cluster.detach();
          }
        }
      }
    }

    /**
     * update clusters
     * @param {array} clusters
     * @private
     */
    _updateClusters(clusters) {
      if (this.clusters && this.clusters.length) {
        const newClustersIds = new Set(clusters.map(cluster => cluster.id));
        const clustersToUnselect = this.clusters.filter(cluster => !newClustersIds.has(cluster.id));
        let selectionChanged = false;
        for (let cluster of clustersToUnselect) {
          const selectedIdx = this.selection.indexOf(cluster.id);
          if (selectedIdx !== -1) {
            cluster.unselect();
            this.selection.splice(selectedIdx, 1);
            selectionChanged = true;
          }
        }

        if (selectionChanged) {
          const newSelection = this.getSelection();
          this.body.emitter.emit('select', {
            items: newSelection,
            event: event
          });
        }
      }

      this.clusters = clusters || [];
    }
  }

  // available item types will be registered here
  ItemSet.types = {
    background: BackgroundItem,
    box: BoxItem,
    range: RangeItem,
    point: PointItem
  };

  /**
   * Handle added items
   * @param {number[]} ids
   * @protected
   */
  ItemSet.prototype._onAdd = ItemSet.prototype._onUpdate;

  let errorFound = false;
  let allOptions$2;
  let printStyle = 'background: #FFeeee; color: #dd0000';
  /**
   *  Used to validate options.
   */
  class Validator {
    /**
     * @ignore
     */
    constructor() {
    }

    /**
     * Main function to be called
     * @param {Object} options
     * @param {Object} referenceOptions
     * @param {Object} subObject
     * @returns {boolean}
     * @static
     */
    static validate(options, referenceOptions, subObject) {
      errorFound = false;
      allOptions$2 = referenceOptions;
      let usedOptions = referenceOptions;
      if (subObject !== undefined) {
        usedOptions = referenceOptions[subObject];
      }
      Validator.parse(options, usedOptions, []);
      return errorFound;
    }


    /**
     * Will traverse an object recursively and check every value
     * @param {Object} options
     * @param {Object} referenceOptions
     * @param {array} path    | where to look for the actual option
     * @static
     */
    static parse(options, referenceOptions, path) {
      for (let option in options) {
        if (options.hasOwnProperty(option)) {
          Validator.check(option, options, referenceOptions, path);
        }
      }
    }


    /**
     * Check every value. If the value is an object, call the parse function on that object.
     * @param {string} option
     * @param {Object} options
     * @param {Object} referenceOptions
     * @param {array} path    | where to look for the actual option
     * @static
     */
    static check(option, options, referenceOptions, path) {
      if (referenceOptions[option] === undefined && referenceOptions.__any__ === undefined) {
        Validator.getSuggestion(option, referenceOptions, path);
        return;
      }

      let referenceOption = option;
      let is_object = true;

      if (referenceOptions[option] === undefined && referenceOptions.__any__ !== undefined) {
        // NOTE: This only triggers if the __any__ is in the top level of the options object.
        //       THAT'S A REALLY BAD PLACE TO ALLOW IT!!!!
        // TODO: Examine if needed, remove if possible

        // __any__ is a wildcard. Any value is accepted and will be further analysed by reference.
        referenceOption = '__any__';

        // if the any-subgroup is not a predefined object in the configurator,
        // we do not look deeper into the object.
        is_object = (Validator.getType(options[option]) === 'object');
      }

      let refOptionObj = referenceOptions[referenceOption];
      if (is_object && refOptionObj.__type__ !== undefined) {
        refOptionObj = refOptionObj.__type__;
      }

      Validator.checkFields(option, options, referenceOptions, referenceOption, refOptionObj, path);
    }

    /**
     *
     * @param {string}  option           | the option property
     * @param {Object}  options          | The supplied options object
     * @param {Object}  referenceOptions | The reference options containing all options and their allowed formats
     * @param {string}  referenceOption  | Usually this is the same as option, except when handling an __any__ tag.
     * @param {string}  refOptionObj     | This is the type object from the reference options
     * @param {Array}   path             | where in the object is the option
     * @static
     */
    static checkFields(option, options, referenceOptions, referenceOption, refOptionObj, path) {
      let log = function(message) {
        console.log('%c' + message + Validator.printLocation(path, option), printStyle);
      };

      let optionType = Validator.getType(options[option]);
      let refOptionType = refOptionObj[optionType];

      if (refOptionType !== undefined) {
        // if the type is correct, we check if it is supposed to be one of a few select values
        if (Validator.getType(refOptionType) === 'array' && refOptionType.indexOf(options[option]) === -1) {
          log('Invalid option detected in "' + option + '".' +
            ' Allowed values are:' + Validator.print(refOptionType) +
            ' not "' + options[option] + '". ');
          errorFound = true;
        }
        else if (optionType === 'object' && referenceOption !== "__any__") {
          path = availableUtils.copyAndExtendArray(path, option);
          Validator.parse(options[option], referenceOptions[referenceOption], path);
        }
      }
      else if (refOptionObj['any'] === undefined) {
        // type of the field is incorrect and the field cannot be any
        log('Invalid type received for "' + option +
          '". Expected: ' + Validator.print(Object.keys(refOptionObj)) +
          '. Received ['  + optionType + '] "' + options[option] + '"');
        errorFound = true;
      }
    }

    /**
     *
     * @param {Object|boolean|number|string|Array.<number>|Date|Node|Moment|undefined|null} object
     * @returns {string}
     * @static
     */
    static getType(object) {
      var type = typeof object;

      if (type === 'object') {
        if (object === null) {
          return 'null';
        }
        if (object instanceof Boolean) {
          return 'boolean';
        }
        if (object instanceof Number) {
          return 'number';
        }
        if (object instanceof String) {
          return 'string';
        }
        if (Array.isArray(object)) {
          return 'array';
        }
        if (object instanceof Date) {
          return 'date';
        }
        if (object.nodeType !== undefined) {
          return 'dom';
        }
        if (object._isAMomentObject === true) {
          return 'moment';
        }
        return 'object';
      }
      else if (type === 'number') {
        return 'number';
      }
      else if (type === 'boolean') {
        return 'boolean';
      }
      else if (type === 'string') {
        return 'string';
      }
      else if (type === undefined) {
        return 'undefined';
      }
      return type;
    }

    /**
     * @param {string} option
     * @param {Object} options
     * @param {Array.<string>} path
     * @static
     */
    static getSuggestion(option, options, path) {
      let localSearch = Validator.findInOptions(option,options,path,false);
      let globalSearch = Validator.findInOptions(option,allOptions$2,[],true);

      let localSearchThreshold = 8;
      let globalSearchThreshold = 4;

      let msg;
      if (localSearch.indexMatch !== undefined) {
        msg = ' in ' + Validator.printLocation(localSearch.path, option,'') +
          'Perhaps it was incomplete? Did you mean: "' + localSearch.indexMatch + '"?\n\n';
      }
      else if (globalSearch.distance <= globalSearchThreshold && localSearch.distance > globalSearch.distance) {
        msg = ' in ' + Validator.printLocation(localSearch.path, option,'') +
          'Perhaps it was misplaced? Matching option found at: ' +
          Validator.printLocation(globalSearch.path, globalSearch.closestMatch,'');
      }
      else if (localSearch.distance <= localSearchThreshold) {
        msg = '. Did you mean "' + localSearch.closestMatch + '"?' +
          Validator.printLocation(localSearch.path, option);
      }
      else {
        msg = '. Did you mean one of these: ' + Validator.print(Object.keys(options)) +
        Validator.printLocation(path, option);
      }

      console.log('%cUnknown option detected: "' + option + '"' + msg, printStyle);
      errorFound = true;
    }

    /**
     * traverse the options in search for a match.
     * @param {string} option
     * @param {Object} options
     * @param {Array} path    | where to look for the actual option
     * @param {boolean} [recursive=false]
     * @returns {{closestMatch: string, path: Array, distance: number}}
     * @static
     */
    static findInOptions(option, options, path, recursive = false) {
      let min = 1e9;
      let closestMatch = '';
      let closestMatchPath = [];
      let lowerCaseOption = option.toLowerCase();
      let indexMatch = undefined;
      for (let op in options) {  // eslint-disable-line guard-for-in
        let distance;
        if (options[op].__type__ !== undefined && recursive === true) {
          let result = Validator.findInOptions(option, options[op], availableUtils.copyAndExtendArray(path,op));
          if (min > result.distance) {
            closestMatch = result.closestMatch;
            closestMatchPath = result.path;
            min = result.distance;
            indexMatch = result.indexMatch;
          }
        }
        else {
          if (op.toLowerCase().indexOf(lowerCaseOption) !== -1) {
            indexMatch = op;
          }
          distance = Validator.levenshteinDistance(option, op);
          if (min > distance) {
            closestMatch = op;
            closestMatchPath = availableUtils.copyArray(path);
            min = distance;
          }
        }
      }
      return {closestMatch:closestMatch, path:closestMatchPath, distance:min, indexMatch: indexMatch};
    }

    /**
     * @param {Array.<string>} path
     * @param {Object} option
     * @param {string} prefix
     * @returns {String}
     * @static
     */
    static printLocation(path, option, prefix = 'Problem value found at: \n') {
      let str = '\n\n' + prefix + 'options = {\n';
      for (let i = 0; i < path.length; i++) {
        for (let j = 0; j < i + 1; j++) {
          str += '  ';
        }
        str += path[i] + ': {\n';
      }
      for (let j = 0; j < path.length + 1; j++) {
        str += '  ';
      }
      str += option + '\n';
      for (let i = 0; i < path.length + 1; i++) {
        for (let j = 0; j < path.length - i; j++) {
          str += '  ';
        }
        str += '}\n';
      }
      return str + '\n\n';
    }

    /**
     * @param {Object} options
     * @returns {String}
     * @static
     */
    static print(options) {
      return JSON.stringify(options).replace(/(\")|(\[)|(\])|(,"__type__")/g, "").replace(/(\,)/g, ', ')
    }


    /**
     *  Compute the edit distance between the two given strings
     * http://en.wikibooks.org/wiki/Algorithm_Implementation/Strings/Levenshtein_distance#JavaScript
     *
     * Copyright (c) 2011 Andrei Mackenzie
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
     *
     * @param {string} a
     * @param {string} b
     * @returns {Array.<Array.<number>>}}
     * @static
     */
    static levenshteinDistance(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;

      var matrix = [];

      // increment along the first column of each row
      var i;
      for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }

      // increment each column in the first row
      var j;
      for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }

      // Fill in the rest of the matrix
      for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) == a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
              Math.min(matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j] + 1)); // deletion
          }
        }
      }

      return matrix[b.length][a.length];
    }
  }

  /**
   * This object contains all possible options. It will check if the types are correct, if required if the option is one
   * of the allowed values.
   *
   * __any__ means that the name of the property does not matter.
   * __type__ is a required field for all objects and contains the allowed types of all objects
   */
  let string$1 = 'string';
  let bool$1 = 'boolean';
  let number$1 = 'number';
  let array$1 = 'array';
  let date$1 = 'date';
  let object$1 = 'object'; // should only be in a __type__ property
  let dom$1 = 'dom';
  let moment$1 = 'moment';
  let any$1 = 'any';

  let allOptions$1 = {
    configure: {
      enabled: { 'boolean': bool$1},
      filter: { 'boolean': bool$1,'function': 'function'},
      container: {dom: dom$1},
      __type__: {object: object$1, 'boolean': bool$1,'function': 'function'}
    },

    //globals :
    align: {string: string$1},
    alignCurrentTime: {string: string$1, 'undefined': 'undefined'},
    rtl: { 'boolean': bool$1, 'undefined': 'undefined'},
    rollingMode: {
      follow: { 'boolean': bool$1 },
      offset: {number: number$1,'undefined': 'undefined'},
      __type__: {object: object$1}
    },
    onTimeout: {
      timeoutMs: {number: number$1},
      callback: {'function': 'function'},
      __type__: {object: object$1}
    },
    verticalScroll: { 'boolean': bool$1, 'undefined': 'undefined'},
    horizontalScroll: { 'boolean': bool$1, 'undefined': 'undefined'},
    autoResize: { 'boolean': bool$1},
    throttleRedraw: {number: number$1}, // TODO: DEPRICATED see https://github.com/almende/vis/issues/2511
    clickToUse: { 'boolean': bool$1},
    dataAttributes: {string: string$1, array: array$1},
    editable: {
      add: { 'boolean': bool$1, 'undefined': 'undefined'},
      remove: { 'boolean': bool$1, 'undefined': 'undefined'},
      updateGroup: { 'boolean': bool$1, 'undefined': 'undefined'},
      updateTime: { 'boolean': bool$1, 'undefined': 'undefined'},
      overrideItems: { 'boolean': bool$1, 'undefined': 'undefined'},
      __type__: { 'boolean': bool$1, object: object$1}
    },
    end: {number: number$1, date: date$1, string: string$1, moment: moment$1},
    format: {
      minorLabels: {
        millisecond: {string: string$1,'undefined': 'undefined'},
        second: {string: string$1,'undefined': 'undefined'},
        minute: {string: string$1,'undefined': 'undefined'},
        hour: {string: string$1,'undefined': 'undefined'},
        weekday: {string: string$1,'undefined': 'undefined'},
        day: {string: string$1,'undefined': 'undefined'},
        week: {string: string$1,'undefined': 'undefined'},
        month: {string: string$1,'undefined': 'undefined'},
        year: {string: string$1,'undefined': 'undefined'},
        __type__: {object: object$1, 'function': 'function'}
      },
      majorLabels: {
        millisecond: {string: string$1,'undefined': 'undefined'},
        second: {string: string$1,'undefined': 'undefined'},
        minute: {string: string$1,'undefined': 'undefined'},
        hour: {string: string$1,'undefined': 'undefined'},
        weekday: {string: string$1,'undefined': 'undefined'},
        day: {string: string$1,'undefined': 'undefined'},
        week: {string: string$1,'undefined': 'undefined'},
        month: {string: string$1,'undefined': 'undefined'},
        year: {string: string$1,'undefined': 'undefined'},
        __type__: {object: object$1, 'function': 'function'}
      },
      __type__: {object: object$1}
    },
    moment: {'function': 'function'},
    groupHeightMode: {string: string$1},
    groupOrder: {string: string$1, 'function': 'function'},
    groupEditable: {
      add: { 'boolean': bool$1, 'undefined': 'undefined'},
      remove: { 'boolean': bool$1, 'undefined': 'undefined'},
      order: { 'boolean': bool$1, 'undefined': 'undefined'},
      __type__: { 'boolean': bool$1, object: object$1}
    },
    groupOrderSwap: {'function': 'function'},
    height: {string: string$1, number: number$1},
    hiddenDates: {
      start: {date: date$1, number: number$1, string: string$1, moment: moment$1},
      end: {date: date$1, number: number$1, string: string$1, moment: moment$1},
      repeat: {string: string$1},
      __type__: {object: object$1, array: array$1}
    },
    itemsAlwaysDraggable: {
      item: { 'boolean': bool$1, 'undefined': 'undefined'},
      range: { 'boolean': bool$1, 'undefined': 'undefined'},
      __type__: { 'boolean': bool$1, object: object$1}
    },
    limitSize: {'boolean': bool$1},
    locale:{string: string$1},
    locales:{
      __any__: {any: any$1},
      __type__: {object: object$1}
    },
    longSelectPressTime: {number: number$1},
    margin: {
      axis: {number: number$1},
      item: {
        horizontal: {number: number$1,'undefined': 'undefined'},
        vertical: {number: number$1,'undefined': 'undefined'},
        __type__: {object: object$1,number: number$1}
      },
      __type__: {object: object$1,number: number$1}
    },
    max: {date: date$1, number: number$1, string: string$1, moment: moment$1},
    maxHeight: {number: number$1, string: string$1},
    maxMinorChars: {number: number$1},
    min: {date: date$1, number: number$1, string: string$1, moment: moment$1},
    minHeight: {number: number$1, string: string$1},
    moveable: { 'boolean': bool$1},
    multiselect: { 'boolean': bool$1},
    multiselectPerGroup: { 'boolean': bool$1},
    onAdd: {'function': 'function'},
    onDropObjectOnItem: {'function': 'function'},
    onUpdate: {'function': 'function'},
    onMove: {'function': 'function'},
    onMoving: {'function': 'function'},
    onRemove: {'function': 'function'},
    onAddGroup: {'function': 'function'},
    onMoveGroup: {'function': 'function'},
    onRemoveGroup: {'function': 'function'},
    onInitialDrawComplete: {'function': 'function'},
    order: {'function': 'function'},
    orientation: {
      axis: {string: string$1,'undefined': 'undefined'},
      item: {string: string$1,'undefined': 'undefined'},
      __type__: {string: string$1, object: object$1}
    },
    selectable: { 'boolean': bool$1},
    sequentialSelection: { 'boolean': bool$1 },
    showCurrentTime: { 'boolean': bool$1},
    showMajorLabels: { 'boolean': bool$1},
    showMinorLabels: { 'boolean': bool$1},
    showWeekScale: { 'boolean': bool$1},
    stack: { 'boolean': bool$1},
    stackSubgroups: { 'boolean': bool$1},
    cluster: {
      maxItems: {'number': number$1, 'undefined': 'undefined'},
      titleTemplate: {'string': string$1, 'undefined': 'undefined'},
      clusterCriteria: { 'function': 'function', 'undefined': 'undefined'},
      showStipes: {'boolean': bool$1, 'undefined': 'undefined'},
      fitOnDoubleClick: {'boolean': bool$1, 'undefined': 'undefined'},
      __type__: {'boolean': bool$1, object: object$1}
    },
    snap: {'function': 'function', 'null': 'null'},
    start: {date: date$1, number: number$1, string: string$1, moment: moment$1},
    template: {'function': 'function'},
    loadingScreenTemplate: {'function': 'function'},
    groupTemplate: {'function': 'function'},
    visibleFrameTemplate: {string: string$1, 'function': 'function'},
    showTooltips: { 'boolean': bool$1},
    tooltip: {
      followMouse: { 'boolean': bool$1 },
      overflowMethod: { 'string': ['cap', 'flip', 'none'] },
      delay: {number: number$1},
      template: {'function': 'function'},
      __type__: {object: object$1}
    },
    tooltipOnItemUpdateTime: {
      template: {'function': 'function'},
      __type__: { 'boolean': bool$1, object: object$1}
    },
    timeAxis: {
      scale: {string: string$1,'undefined': 'undefined'},
      step: {number: number$1,'undefined': 'undefined'},
      __type__: {object: object$1}
    },
    type: {string: string$1},
    width: {string: string$1, number: number$1},
    preferZoom: { 'boolean': bool$1},
    zoomable: { 'boolean': bool$1},
    zoomKey: {string: ['ctrlKey', 'altKey', 'shiftKey', 'metaKey', '']},
    zoomFriction: {number: number$1},
    zoomMax: {number: number$1},
    zoomMin: {number: number$1},
    xss: {
      disabled: { boolean: bool$1 },
      filterOptions: {
        __any__: { any: any$1 },
        __type__: { object: object$1 }
      },
      __type__: { object: object$1 }
    },
    __type__: {object: object$1}
  };

  let configureOptions$1 = {
    global: {
      align:  ['center', 'left', 'right'],
      alignCurrentTime: ['none', 'year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second'],
      direction:  false,
      autoResize: true,
      clickToUse: false,
      // dataAttributes: ['all'], // FIXME: can be 'all' or string[]
        editable: {
        add: false,
        remove: false,
        updateGroup: false,
        updateTime: false
      },
      end: '',
      format: {
        minorLabels: {
          millisecond:'SSS',
          second:     's',
          minute:     'HH:mm',
          hour:       'HH:mm',
          weekday:    'ddd D',
          day:        'D',
          week:       'w',
          month:      'MMM',
          year:       'YYYY'
        },
        majorLabels: {
          millisecond:'HH:mm:ss',
          second:     'D MMMM HH:mm',
          minute:     'ddd D MMMM',
          hour:       'ddd D MMMM',
          weekday:    'MMMM YYYY',
          day:        'MMMM YYYY',
          week:       'MMMM YYYY',
          month:      'YYYY',
          year:       ''
        }
      },
      groupHeightMode: ['auto', 'fixed', 'fitItems'],
      //groupOrder: {string, 'function': 'function'},
      groupsDraggable: false,
      height: '',
      //hiddenDates: {object, array},
      locale: '',
      longSelectPressTime: 251,
      margin: {
        axis: [20, 0, 100, 1],
        item: {
          horizontal: [10, 0, 100, 1],
          vertical: [10, 0, 100, 1]
        }
      },
      max: '',
      maxHeight: '',
      maxMinorChars: [7, 0, 20, 1],
      min: '',
      minHeight: '',
      moveable: false,
      multiselect: false,
      multiselectPerGroup: false,
      //onAdd: {'function': 'function'},
      //onUpdate: {'function': 'function'},
      //onMove: {'function': 'function'},
      //onMoving: {'function': 'function'},
      //onRename: {'function': 'function'},
      //order: {'function': 'function'},
      orientation: {
        axis: ['both', 'bottom', 'top'],
        item: ['bottom', 'top']
      },
      preferZoom: false,
      selectable: true,
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      stack: true,
      stackSubgroups: true,
      cluster: false,
      //snap: {'function': 'function', nada},
      start: '',
      //template: {'function': 'function'},
      //timeAxis: {
      //  scale: ['millisecond', 'second', 'minute', 'hour', 'weekday', 'day', 'week', 'month', 'year'],
      //  step: [1, 1, 10, 1]
      //},
      showTooltips: true,
      tooltip: {
        followMouse: false,
        overflowMethod: 'flip',
        delay: [500, 0, 99999, 100],
      },
      tooltipOnItemUpdateTime: false,
      type: ['box', 'point', 'range', 'background'],
      width: '100%',
      zoomable: true,
      zoomKey: ['ctrlKey', 'altKey', 'shiftKey', 'metaKey', ''],
      zoomMax: [315360000000000, 10, 315360000000000, 1],
      zoomMin: [10, 10, 315360000000000, 1],
      xss: { disabled: false }
    }
  };

  var htmlColors = {black: '#000000', navy: '#000080', darkblue: '#00008B', mediumblue: '#0000CD', blue: '#0000FF', darkgreen: '#006400', green: '#008000', teal: '#008080', darkcyan: '#008B8B', deepskyblue: '#00BFFF', darkturquoise: '#00CED1', mediumspringgreen: '#00FA9A', lime: '#00FF00', springgreen: '#00FF7F', aqua: '#00FFFF', cyan: '#00FFFF', midnightblue: '#191970', dodgerblue: '#1E90FF', lightseagreen: '#20B2AA', forestgreen: '#228B22', seagreen: '#2E8B57', darkslategray: '#2F4F4F', limegreen: '#32CD32', mediumseagreen: '#3CB371', turquoise: '#40E0D0', royalblue: '#4169E1', steelblue: '#4682B4', darkslateblue: '#483D8B', mediumturquoise: '#48D1CC', indigo: '#4B0082', darkolivegreen: '#556B2F', cadetblue: '#5F9EA0', cornflowerblue: '#6495ED', mediumaquamarine: '#66CDAA', dimgray: '#696969', slateblue: '#6A5ACD', olivedrab: '#6B8E23', slategray: '#708090', lightslategray: '#778899', mediumslateblue: '#7B68EE', lawngreen: '#7CFC00', chartreuse: '#7FFF00', aquamarine: '#7FFFD4', maroon: '#800000', purple: '#800080', olive: '#808000', gray: '#808080', skyblue: '#87CEEB', lightskyblue: '#87CEFA', blueviolet: '#8A2BE2', darkred: '#8B0000', darkmagenta: '#8B008B', saddlebrown: '#8B4513', darkseagreen: '#8FBC8F', lightgreen: '#90EE90', mediumpurple: '#9370D8', darkviolet: '#9400D3', palegreen: '#98FB98', darkorchid: '#9932CC', yellowgreen: '#9ACD32', sienna: '#A0522D', brown: '#A52A2A', darkgray: '#A9A9A9', lightblue: '#ADD8E6', greenyellow: '#ADFF2F', paleturquoise: '#AFEEEE', lightsteelblue: '#B0C4DE', powderblue: '#B0E0E6', firebrick: '#B22222', darkgoldenrod: '#B8860B', mediumorchid: '#BA55D3', rosybrown: '#BC8F8F', darkkhaki: '#BDB76B', silver: '#C0C0C0', mediumvioletred: '#C71585', indianred: '#CD5C5C', peru: '#CD853F', chocolate: '#D2691E', tan: '#D2B48C', lightgrey: '#D3D3D3', palevioletred: '#D87093', thistle: '#D8BFD8', orchid: '#DA70D6', goldenrod: '#DAA520', crimson: '#DC143C', gainsboro: '#DCDCDC', plum: '#DDA0DD', burlywood: '#DEB887', lightcyan: '#E0FFFF', lavender: '#E6E6FA', darksalmon: '#E9967A', violet: '#EE82EE', palegoldenrod: '#EEE8AA', lightcoral: '#F08080', khaki: '#F0E68C', aliceblue: '#F0F8FF', honeydew: '#F0FFF0', azure: '#F0FFFF', sandybrown: '#F4A460', wheat: '#F5DEB3', beige: '#F5F5DC', whitesmoke: '#F5F5F5', mintcream: '#F5FFFA', ghostwhite: '#F8F8FF', salmon: '#FA8072', antiquewhite: '#FAEBD7', linen: '#FAF0E6', lightgoldenrodyellow: '#FAFAD2', oldlace: '#FDF5E6', red: '#FF0000', fuchsia: '#FF00FF', magenta: '#FF00FF', deeppink: '#FF1493', orangered: '#FF4500', tomato: '#FF6347', hotpink: '#FF69B4', coral: '#FF7F50', darkorange: '#FF8C00', lightsalmon: '#FFA07A', orange: '#FFA500', lightpink: '#FFB6C1', pink: '#FFC0CB', gold: '#FFD700', peachpuff: '#FFDAB9', navajowhite: '#FFDEAD', moccasin: '#FFE4B5', bisque: '#FFE4C4', mistyrose: '#FFE4E1', blanchedalmond: '#FFEBCD', papayawhip: '#FFEFD5', lavenderblush: '#FFF0F5', seashell: '#FFF5EE', cornsilk: '#FFF8DC', lemonchiffon: '#FFFACD', floralwhite: '#FFFAF0', snow: '#FFFAFA', yellow: '#FFFF00', lightyellow: '#FFFFE0', ivory: '#FFFFF0', white: '#FFFFFF'};

  /**
   * @param {number} [pixelRatio=1]
   */
  class ColorPicker {
    /**
     * @param {number} [pixelRatio=1]
     */
    constructor(pixelRatio = 1) {
      this.pixelRatio = pixelRatio;
      this.generated = false;
      this.centerCoordinates = {x:289/2, y:289/2};
      this.r = 289 * 0.49;
      this.color = {r:255,g:255,b:255,a:1.0};
      this.hueCircle = undefined;
      this.initialColor = {r:255,g:255,b:255,a:1.0};
      this.previousColor= undefined;
      this.applied = false;

      // bound by
      this.updateCallback = () => {};
      this.closeCallback = () => {};

      // create all DOM elements
      this._create();
    }


    /**
     * this inserts the colorPicker into a div from the DOM
     * @param {Element} container
     */
    insertTo(container) {
      if (this.hammer !== undefined) {
        this.hammer.destroy();
        this.hammer = undefined;
      }
      this.container = container;
      this.container.appendChild(this.frame);
      this._bindHammer();

      this._setSize();
    }

    /**
     * the callback is executed on apply and save. Bind it to the application
     * @param {function} callback
     */
    setUpdateCallback(callback) {
      if (typeof callback === 'function') {
        this.updateCallback = callback;
      }
      else {
        throw new Error("Function attempted to set as colorPicker update callback is not a function.");
      }
    }

    /**
     * the callback is executed on apply and save. Bind it to the application
     * @param {function} callback
     */
    setCloseCallback(callback) {
      if (typeof callback === 'function') {
        this.closeCallback = callback;
      }
      else {
        throw new Error("Function attempted to set as colorPicker closing callback is not a function.");
      }
    }

    /**
     *
     * @param {string} color
     * @returns {String}
     * @private
     */
    _isColorString(color) {
      if (typeof color === 'string') {
        return htmlColors[color];
      }
    }


    /**
     * Set the color of the colorPicker
     * Supported formats:
     * 'red'                   --> HTML color string
     * '#ffffff'               --> hex string
     * 'rgb(255,255,255)'      --> rgb string
     * 'rgba(255,255,255,1.0)' --> rgba string
     * {r:255,g:255,b:255}     --> rgb object
     * {r:255,g:255,b:255,a:1.0} --> rgba object
     * @param {string|Object} color
     * @param {boolean} [setInitial=true]
     */
    setColor(color, setInitial = true) {
      if (color === 'none') {
        return;
      }

      let rgba;

      // if a html color shorthand is used, convert to hex
      var htmlColor = this._isColorString(color);
      if (htmlColor !== undefined) {
        color = htmlColor;
      }

      // check format
      if (availableUtils.isString(color) === true) {
        if (availableUtils.isValidRGB(color) === true) {
          let rgbaArray = color.substr(4).substr(0, color.length - 5).split(',');
          rgba = {r:rgbaArray[0], g:rgbaArray[1], b:rgbaArray[2], a:1.0};
        }
        else if (availableUtils.isValidRGBA(color) === true) {
          let rgbaArray = color.substr(5).substr(0, color.length - 6).split(',');
          rgba = {r:rgbaArray[0], g:rgbaArray[1], b:rgbaArray[2], a:rgbaArray[3]};
        }
        else if (availableUtils.isValidHex(color) === true) {
          let rgbObj = availableUtils.hexToRGB(color);
          rgba = {r:rgbObj.r, g:rgbObj.g, b:rgbObj.b, a:1.0};
        }
      }
      else {
        if (color instanceof Object) {
          if (color.r !== undefined && color.g !== undefined && color.b !== undefined) {
            let alpha = color.a !== undefined ? color.a : '1.0';
            rgba = {r:color.r, g:color.g, b:color.b, a:alpha};
          }
        }
      }

      // set color
      if (rgba === undefined) {
        throw new Error("Unknown color passed to the colorPicker. Supported are strings: rgb, hex, rgba. Object: rgb ({r:r,g:g,b:b,[a:a]}). Supplied: " + JSON.stringify(color));
      }
      else {
        this._setColor(rgba, setInitial);
      }
    }


    /**
     * this shows the color picker.
     * The hue circle is constructed once and stored.
     */
    show() {
      if (this.closeCallback !== undefined) {
        this.closeCallback();
        this.closeCallback = undefined;
      }

      this.applied = false;
      this.frame.style.display = 'block';
      this._generateHueCircle();
    }

    // ------------------------------------------ PRIVATE ----------------------------- //

    /**
     * Hide the picker. Is called by the cancel button.
     * Optional boolean to store the previous color for easy access later on.
     * @param {boolean} [storePrevious=true]
     * @private
     */
    _hide(storePrevious = true) {
      // store the previous color for next time;
      if (storePrevious === true) {
        this.previousColor = availableUtils.extend({}, this.color);
      }

      if (this.applied === true) {
        this.updateCallback(this.initialColor);
      }

      this.frame.style.display = 'none';

      // call the closing callback, restoring the onclick method.
      // this is in a setTimeout because it will trigger the show again before the click is done.
      setTimeout(() => {
        if (this.closeCallback !== undefined) {
          this.closeCallback();
          this.closeCallback = undefined;
        }
      },0);
    }


    /**
     * bound to the save button. Saves and hides.
     * @private
     */
    _save() {
      this.updateCallback(this.color);
      this.applied = false;
      this._hide();
    }


    /**
     * Bound to apply button. Saves but does not close. Is undone by the cancel button.
     * @private
     */
    _apply() {
      this.applied = true;
      this.updateCallback(this.color);
      this._updatePicker(this.color);
    }


    /**
     * load the color from the previous session.
     * @private
     */
    _loadLast() {
      if (this.previousColor !== undefined) {
        this.setColor(this.previousColor, false);
      }
      else {
        alert("There is no last color to load...");
      }
    }


    /**
     * set the color, place the picker
     * @param {Object} rgba
     * @param {boolean} [setInitial=true]
     * @private
     */
    _setColor(rgba, setInitial = true) {
      // store the initial color
      if (setInitial === true) {
        this.initialColor = availableUtils.extend({}, rgba);
      }

      this.color = rgba;
      let hsv = availableUtils.RGBToHSV(rgba.r, rgba.g, rgba.b);

      let angleConvert = 2 * Math.PI;
      let radius = this.r * hsv.s;
      let x = this.centerCoordinates.x + radius * Math.sin(angleConvert * hsv.h);
      let y = this.centerCoordinates.y + radius * Math.cos(angleConvert * hsv.h);

      this.colorPickerSelector.style.left = x - 0.5 * this.colorPickerSelector.clientWidth + 'px';
      this.colorPickerSelector.style.top = y - 0.5 * this.colorPickerSelector.clientHeight + 'px';

      this._updatePicker(rgba);
    }


    /**
     * bound to opacity control
     * @param {number} value
     * @private
     */
    _setOpacity(value) {
      this.color.a = value / 100;
      this._updatePicker(this.color);
    }


    /**
     * bound to brightness control
     * @param {number} value
     * @private
     */
    _setBrightness(value) {
      let hsv = availableUtils.RGBToHSV(this.color.r, this.color.g, this.color.b);
      hsv.v = value / 100;
      let rgba = availableUtils.HSVToRGB(hsv.h, hsv.s, hsv.v);
      rgba['a'] = this.color.a;
      this.color = rgba;
      this._updatePicker();
    }


    /**
     * update the color picker. A black circle overlays the hue circle to mimic the brightness decreasing.
     * @param {Object} rgba
     * @private
     */
    _updatePicker(rgba = this.color) {
      let hsv = availableUtils.RGBToHSV(rgba.r, rgba.g, rgba.b);
      let ctx = this.colorPickerCanvas.getContext('2d');
      if (this.pixelRation === undefined) {
        this.pixelRatio = (window.devicePixelRatio || 1) / (ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1);
      }
      ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

      // clear the canvas
      let w = this.colorPickerCanvas.clientWidth;
      let h = this.colorPickerCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      ctx.putImageData(this.hueCircle, 0,0);
      ctx.fillStyle = 'rgba(0,0,0,' + (1- hsv.v) + ')';
      ctx.circle(this.centerCoordinates.x, this.centerCoordinates.y, this.r);
      ctx.fill();

      this.brightnessRange.value = 100 * hsv.v;
      this.opacityRange.value    = 100 * rgba.a;

      this.initialColorDiv.style.backgroundColor = 'rgba(' + this.initialColor.r + ',' + this.initialColor.g + ',' + this.initialColor.b + ',' + this.initialColor.a + ')';
      this.newColorDiv.style.backgroundColor = 'rgba(' + this.color.r + ',' + this.color.g + ',' + this.color.b + ',' + this.color.a + ')';
    }


    /**
     * used by create to set the size of the canvas.
     * @private
     */
    _setSize() {
      this.colorPickerCanvas.style.width = '100%';
      this.colorPickerCanvas.style.height = '100%';

      this.colorPickerCanvas.width = 289 * this.pixelRatio;
      this.colorPickerCanvas.height = 289 * this.pixelRatio;
    }


    /**
     * create all dom elements
     * TODO: cleanup, lots of similar dom elements
     * @private
     */
    _create() {
      this.frame = document.createElement('div');
      this.frame.className = 'vis-color-picker';

      this.colorPickerDiv = document.createElement('div');
      this.colorPickerSelector = document.createElement('div');
      this.colorPickerSelector.className = 'vis-selector';
      this.colorPickerDiv.appendChild(this.colorPickerSelector);

      this.colorPickerCanvas = document.createElement('canvas');
      this.colorPickerDiv.appendChild(this.colorPickerCanvas);

      if (!this.colorPickerCanvas.getContext) {
        let noCanvas = document.createElement( 'DIV' );
        noCanvas.style.color = 'red';
        noCanvas.style.fontWeight =  'bold' ;
        noCanvas.style.padding =  '10px';
        noCanvas.innerHTML =  'Error: your browser does not support HTML canvas';
        this.colorPickerCanvas.appendChild(noCanvas);
      }
      else {
        let ctx = this.colorPickerCanvas.getContext("2d");
        this.pixelRatio = (window.devicePixelRatio || 1) / (ctx.webkitBackingStorePixelRatio ||
        ctx.mozBackingStorePixelRatio ||
        ctx.msBackingStorePixelRatio ||
        ctx.oBackingStorePixelRatio ||
        ctx.backingStorePixelRatio || 1);
        this.colorPickerCanvas.getContext("2d").setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
      }

      this.colorPickerDiv.className = 'vis-color';

      this.opacityDiv = document.createElement('div');
      this.opacityDiv.className = 'vis-opacity';

      this.brightnessDiv = document.createElement('div');
      this.brightnessDiv.className = 'vis-brightness';

      this.arrowDiv = document.createElement('div');
      this.arrowDiv.className = 'vis-arrow';

      this.opacityRange = document.createElement('input');
      try {
        this.opacityRange.type = 'range'; // Not supported on IE9
        this.opacityRange.min = '0';
        this.opacityRange.max = '100';
      }
      // TODO: Add some error handling and remove this lint exception
      catch (err) {}  // eslint-disable-line no-empty
      this.opacityRange.value = '100';
      this.opacityRange.className = 'vis-range';

      this.brightnessRange = document.createElement('input');
      try {
        this.brightnessRange.type = 'range'; // Not supported on IE9
        this.brightnessRange.min = '0';
        this.brightnessRange.max = '100';
      }
      // TODO: Add some error handling and remove this lint exception
      catch (err) {}  // eslint-disable-line no-empty
      this.brightnessRange.value = '100';
      this.brightnessRange.className = 'vis-range';

      this.opacityDiv.appendChild(this.opacityRange);
      this.brightnessDiv.appendChild(this.brightnessRange);

      var me = this;
      this.opacityRange.onchange = function () {me._setOpacity(this.value);};
      this.opacityRange.oninput  = function () {me._setOpacity(this.value);};
      this.brightnessRange.onchange = function () {me._setBrightness(this.value);};
      this.brightnessRange.oninput  = function () {me._setBrightness(this.value);};

      this.brightnessLabel = document.createElement("div");
      this.brightnessLabel.className = "vis-label vis-brightness";
      this.brightnessLabel.innerHTML = 'brightness:';

      this.opacityLabel = document.createElement("div");
      this.opacityLabel.className = "vis-label vis-opacity";
      this.opacityLabel.innerHTML = 'opacity:';

      this.newColorDiv = document.createElement("div");
      this.newColorDiv.className = "vis-new-color";
      this.newColorDiv.innerHTML = 'new';

      this.initialColorDiv = document.createElement("div");
      this.initialColorDiv.className = "vis-initial-color";
      this.initialColorDiv.innerHTML = 'initial';

      this.cancelButton = document.createElement("div");
      this.cancelButton.className = "vis-button vis-cancel";
      this.cancelButton.innerHTML = 'cancel';
      this.cancelButton.onclick = this._hide.bind(this, false);

      this.applyButton = document.createElement("div");
      this.applyButton.className = "vis-button vis-apply";
      this.applyButton.innerHTML = 'apply';
      this.applyButton.onclick = this._apply.bind(this);

      this.saveButton = document.createElement("div");
      this.saveButton.className = "vis-button vis-save";
      this.saveButton.innerHTML = 'save';
      this.saveButton.onclick = this._save.bind(this);

      this.loadButton = document.createElement("div");
      this.loadButton.className = "vis-button vis-load";
      this.loadButton.innerHTML = 'load last';
      this.loadButton.onclick = this._loadLast.bind(this);

      this.frame.appendChild(this.colorPickerDiv);
      this.frame.appendChild(this.arrowDiv);
      this.frame.appendChild(this.brightnessLabel);
      this.frame.appendChild(this.brightnessDiv);
      this.frame.appendChild(this.opacityLabel);
      this.frame.appendChild(this.opacityDiv);
      this.frame.appendChild(this.newColorDiv);
      this.frame.appendChild(this.initialColorDiv);

      this.frame.appendChild(this.cancelButton);
      this.frame.appendChild(this.applyButton);
      this.frame.appendChild(this.saveButton);
      this.frame.appendChild(this.loadButton);
    }


    /**
     * bind hammer to the color picker
     * @private
     */
    _bindHammer() {
      this.drag = {};
      this.pinch = {};
      this.hammer = new Hammer(this.colorPickerCanvas);
      this.hammer.get('pinch').set({enable: true});

      onTouch(this.hammer, (event) => {this._moveSelector(event);});
      this.hammer.on('tap',       (event) => {this._moveSelector(event);});
      this.hammer.on('panstart',  (event) => {this._moveSelector(event);});
      this.hammer.on('panmove',   (event) => {this._moveSelector(event);});
      this.hammer.on('panend',    (event) => {this._moveSelector(event);});
    }


    /**
     * generate the hue circle. This is relatively heavy (200ms) and is done only once on the first time it is shown.
     * @private
     */
    _generateHueCircle() {
      if (this.generated === false) {
        let ctx = this.colorPickerCanvas.getContext('2d');
        if (this.pixelRation === undefined) {
          this.pixelRatio = (window.devicePixelRatio || 1) / (ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1);
        }
        ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);

        // clear the canvas
        let w = this.colorPickerCanvas.clientWidth;
        let h = this.colorPickerCanvas.clientHeight;
        ctx.clearRect(0, 0, w, h);


        // draw hue circle
        let x, y, hue, sat;
        this.centerCoordinates = {x: w * 0.5, y: h * 0.5};
        this.r = 0.49 * w;
        let angleConvert = (2 * Math.PI) / 360;
        let hfac = 1 / 360;
        let sfac = 1 / this.r;
        let rgb;
        for (hue = 0; hue < 360; hue++) {
          for (sat = 0; sat < this.r; sat++) {
            x = this.centerCoordinates.x + sat * Math.sin(angleConvert * hue);
            y = this.centerCoordinates.y + sat * Math.cos(angleConvert * hue);
            rgb = availableUtils.HSVToRGB(hue * hfac, sat * sfac, 1);
            ctx.fillStyle = 'rgb(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ')';
            ctx.fillRect(x - 0.5, y - 0.5, 2, 2);
          }
        }
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.circle(this.centerCoordinates.x, this.centerCoordinates.y, this.r);
        ctx.stroke();

        this.hueCircle = ctx.getImageData(0,0,w,h);
      }
      this.generated = true;
    }


    /**
     * move the selector. This is called by hammer functions.
     *
     * @param {Event}  event   The event
     * @private
     */
    _moveSelector(event) {
      let rect = this.colorPickerDiv.getBoundingClientRect();
      let left = event.center.x - rect.left;
      let top = event.center.y - rect.top;

      let centerY = 0.5 * this.colorPickerDiv.clientHeight;
      let centerX = 0.5 * this.colorPickerDiv.clientWidth;

      let x = left - centerX;
      let y = top - centerY;

      let angle = Math.atan2(x,y);
      let radius = 0.98 * Math.min(Math.sqrt(x * x + y * y), centerX);

      let newTop = Math.cos(angle) * radius + centerY;
      let newLeft = Math.sin(angle) * radius + centerX;

      this.colorPickerSelector.style.top = newTop - 0.5 * this.colorPickerSelector.clientHeight + 'px';
      this.colorPickerSelector.style.left = newLeft - 0.5 * this.colorPickerSelector.clientWidth + 'px';

      // set color
      let h = angle / (2 * Math.PI);
      h = h < 0 ? h + 1 : h;
      let s = radius / this.r;
      let hsv = availableUtils.RGBToHSV(this.color.r, this.color.g, this.color.b);
      hsv.h = h;
      hsv.s = s;
      let rgba = availableUtils.HSVToRGB(hsv.h, hsv.s, hsv.v);
      rgba['a'] = this.color.a;
      this.color = rgba;

      // update previews
      this.initialColorDiv.style.backgroundColor = 'rgba(' + this.initialColor.r + ',' + this.initialColor.g + ',' + this.initialColor.b + ',' + this.initialColor.a + ')';
      this.newColorDiv.style.backgroundColor = 'rgba(' + this.color.r + ',' + this.color.g + ',' + this.color.b + ',' + this.color.a + ')';
    }
  }

  /**
   * The way this works is for all properties of this.possible options, you can supply the property name in any form to list the options.
   * Boolean options are recognised as Boolean
   * Number options should be written as array: [default value, min value, max value, stepsize]
   * Colors should be written as array: ['color', '#ffffff']
   * Strings with should be written as array: [option1, option2, option3, ..]
   *
   * The options are matched with their counterparts in each of the modules and the values used in the configuration are
   */
  class Configurator {
    /**
     * @param {Object} parentModule        | the location where parentModule.setOptions() can be called
     * @param {Object} defaultContainer    | the default container of the module
     * @param {Object} configureOptions    | the fully configured and predefined options set found in allOptions.js
     * @param {number} pixelRatio          | canvas pixel ratio
     */
    constructor(parentModule, defaultContainer, configureOptions, pixelRatio = 1) {
      this.parent = parentModule;
      this.changedOptions = [];
      this.container = defaultContainer;
      this.allowCreation = false;

      this.options = {};
      this.initialized = false;
      this.popupCounter = 0;
      this.defaultOptions = {
        enabled: false,
        filter: true,
        container: undefined,
        showButton: true
      };
      availableUtils.extend(this.options, this.defaultOptions);

      this.configureOptions = configureOptions;
      this.moduleOptions = {};
      this.domElements = [];
      this.popupDiv = {};
      this.popupLimit = 5;
      this.popupHistory = {};
      this.colorPicker = new ColorPicker(pixelRatio);
      this.wrapper = undefined;
    }


    /**
     * refresh all options.
     * Because all modules parse their options by themselves, we just use their options. We copy them here.
     *
     * @param {Object} options
     */
    setOptions(options) {
      if (options !== undefined) {
        // reset the popup history because the indices may have been changed.
        this.popupHistory = {};
        this._removePopup();

        let enabled = true;
        if (typeof options === 'string') {
          this.options.filter = options;
        }
        else if (Array.isArray(options)) {
          this.options.filter = options.join();
        }
        else if (typeof options === 'object') {
          if (options == null) {
            throw new TypeError('options cannot be null');
          }
          if (options.container !== undefined) {
            this.options.container = options.container;
          }
          if (options.filter !== undefined) {
            this.options.filter = options.filter;
          }
          if (options.showButton !== undefined) {
            this.options.showButton = options.showButton;
          }
          if (options.enabled !== undefined) {
            enabled = options.enabled;
          }
        }
        else if (typeof options === 'boolean') {
          this.options.filter = true;
          enabled = options;
        }
        else if (typeof options === 'function') {
          this.options.filter = options;
          enabled = true;
        }
        if (this.options.filter === false) {
          enabled = false;
        }

        this.options.enabled = enabled;
      }
      this._clean();
    }

    /**
     *
     * @param {Object} moduleOptions
     */
    setModuleOptions(moduleOptions) {
      this.moduleOptions = moduleOptions;
      if (this.options.enabled === true) {
        this._clean();
        if (this.options.container !== undefined) {
          this.container = this.options.container;
        }
        this._create();
      }
    }

    /**
     * Create all DOM elements
     * @private
     */
    _create() {
      this._clean();
      this.changedOptions = [];

      let filter = this.options.filter;
      let counter = 0;
      let show = false;
      for (let option in this.configureOptions) {
        if (this.configureOptions.hasOwnProperty(option)) {
          this.allowCreation = false;
          show = false;
          if (typeof filter === 'function') {
            show = filter(option,[]);
            show = show || this._handleObject(this.configureOptions[option], [option], true);
          }
          else if (filter === true || filter.indexOf(option) !== -1) {
            show = true;
          }

          if (show !== false) {
            this.allowCreation = true;

            // linebreak between categories
            if (counter > 0) {
              this._makeItem([]);
            }
            // a header for the category
            this._makeHeader(option);

            // get the sub options
            this._handleObject(this.configureOptions[option], [option]);
          }
          counter++;
        }
      }
      this._makeButton();
      this._push();
      //~ this.colorPicker.insertTo(this.container);
    }


    /**
     * draw all DOM elements on the screen
     * @private
     */
    _push() {
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'vis-configuration-wrapper';
      this.container.appendChild(this.wrapper);
      for (var i = 0; i < this.domElements.length; i++) {
        this.wrapper.appendChild(this.domElements[i]);
      }

      this._showPopupIfNeeded();
    }


    /**
     * delete all DOM elements
     * @private
     */
    _clean() {
      for (var i = 0; i < this.domElements.length; i++) {
        this.wrapper.removeChild(this.domElements[i]);
      }

      if (this.wrapper !== undefined) {
        this.container.removeChild(this.wrapper);
        this.wrapper = undefined;
      }
      this.domElements = [];

      this._removePopup();
    }


    /**
     * get the value from the actualOptions if it exists
     * @param {array} path    | where to look for the actual option
     * @returns {*}
     * @private
     */
    _getValue(path) {
      let base = this.moduleOptions;
      for (let i = 0; i < path.length; i++) {
        if (base[path[i]] !== undefined) {
          base = base[path[i]];
        }
        else {
          base = undefined;
          break;
        }
      }
      return base;
    }


    /**
     * all option elements are wrapped in an item
     * @param {Array} path    | where to look for the actual option
     * @param {Array.<Element>} domElements
     * @returns {number}
     * @private
     */
    _makeItem(path, ...domElements) {
      if (this.allowCreation === true) {
        let item = document.createElement('div');
        item.className = 'vis-configuration vis-config-item vis-config-s' + path.length;
        domElements.forEach((element) => {
          item.appendChild(element);
        });
        this.domElements.push(item);
        return this.domElements.length;
      }
      return 0;
    }


    /**
     * header for major subjects
     * @param {string} name
     * @private
     */
    _makeHeader(name) {
      let div = document.createElement('div');
      div.className = 'vis-configuration vis-config-header';
      div.innerHTML = availableUtils.xss(name);
      this._makeItem([],div);
    }


    /**
     * make a label, if it is an object label, it gets different styling.
     * @param {string} name
     * @param {array} path    | where to look for the actual option
     * @param {string} objectLabel
     * @returns {HTMLElement}
     * @private
     */
    _makeLabel(name, path, objectLabel = false) {
      let div = document.createElement('div');
      div.className = 'vis-configuration vis-config-label vis-config-s' + path.length;
      if (objectLabel === true) {
        div.innerHTML = availableUtils.xss('<i><b>' + name + ':</b></i>');
      }
      else {
        div.innerHTML = availableUtils.xss(name + ':');
      }
      return div;
    }


    /**
     * make a dropdown list for multiple possible string optoins
     * @param {Array.<number>} arr
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _makeDropdown(arr, value, path) {
      let select = document.createElement('select');
      select.className = 'vis-configuration vis-config-select';
      let selectedValue = 0;
      if (value !== undefined) {
        if (arr.indexOf(value) !== -1) {
          selectedValue = arr.indexOf(value);
        }
      }

      for (let i = 0; i < arr.length; i++) {
        let option = document.createElement('option');
        option.value = arr[i];
        if (i === selectedValue) {
          option.selected = 'selected';
        }
        option.innerHTML = arr[i];
        select.appendChild(option);
      }

      let me = this;
      select.onchange = function () {me._update(this.value, path);};

      let label = this._makeLabel(path[path.length-1], path);
      this._makeItem(path, label, select);
    }


    /**
     * make a range object for numeric options
     * @param {Array.<number>} arr
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _makeRange(arr, value, path) {
      let defaultValue = arr[0];
      let min = arr[1];
      let max = arr[2];
      let step = arr[3];
      let range = document.createElement('input');
      range.className = 'vis-configuration vis-config-range';
      try {
        range.type = 'range'; // not supported on IE9
        range.min = min;
        range.max = max;
      }
      // TODO: Add some error handling and remove this lint exception
      catch (err) {}  // eslint-disable-line no-empty
      range.step = step;

      // set up the popup settings in case they are needed.
      let popupString = '';
      let popupValue = 0;

      if (value !== undefined) {
        let factor = 1.20;
        if (value < 0 && value * factor < min) {
          range.min = Math.ceil(value * factor);
          popupValue = range.min;
          popupString = 'range increased';
        }
        else if (value / factor < min) {
          range.min = Math.ceil(value / factor);
          popupValue = range.min;
          popupString = 'range increased';
        }
        if (value * factor > max && max !== 1) {
          range.max = Math.ceil(value * factor);
          popupValue = range.max;
          popupString = 'range increased';
        }
        range.value = value;
      }
      else {
        range.value = defaultValue;
      }

      let input = document.createElement('input');
      input.className = 'vis-configuration vis-config-rangeinput';
      input.value = Number(range.value);

      var me = this;
      range.onchange = function () {input.value = this.value; me._update(Number(this.value), path);};
      range.oninput  = function () {input.value = this.value; };

      let label = this._makeLabel(path[path.length-1], path);
      let itemIndex = this._makeItem(path, label, range, input);

      // if a popup is needed AND it has not been shown for this value, show it.
      if (popupString !== '' && this.popupHistory[itemIndex] !== popupValue) {
        this.popupHistory[itemIndex] = popupValue;
        this._setupPopup(popupString, itemIndex);
      }
    }

    /**
     * make a button object
     * @private
     */
    _makeButton() {
      if (this.options.showButton === true) {
        let generateButton = document.createElement('div');
        generateButton.className = 'vis-configuration vis-config-button';
        generateButton.innerHTML = 'generate options';
        generateButton.onclick =     () => {this._printOptions();};
        generateButton.onmouseover = () => {generateButton.className = 'vis-configuration vis-config-button hover';};
        generateButton.onmouseout =  () => {generateButton.className = 'vis-configuration vis-config-button';};

        this.optionsContainer = document.createElement('div');
        this.optionsContainer.className = 'vis-configuration vis-config-option-container';

        this.domElements.push(this.optionsContainer);
        this.domElements.push(generateButton);
      }
    }


    /**
     * prepare the popup
     * @param {string} string
     * @param {number} index
     * @private
     */
    _setupPopup(string, index) {
      if (this.initialized === true && this.allowCreation === true && this.popupCounter < this.popupLimit) {
        let div = document.createElement("div");
        div.id = "vis-configuration-popup";
        div.className = "vis-configuration-popup";
        div.innerHTML = availableUtils.xss(string);
        div.onclick = () => {this._removePopup();};
        this.popupCounter += 1;
        this.popupDiv = {html:div, index:index};
      }
    }


    /**
     * remove the popup from the dom
     * @private
     */
    _removePopup() {
      if (this.popupDiv.html !== undefined) {
        this.popupDiv.html.parentNode.removeChild(this.popupDiv.html);
        clearTimeout(this.popupDiv.hideTimeout);
        clearTimeout(this.popupDiv.deleteTimeout);
        this.popupDiv = {};
      }
    }


    /**
     * Show the popup if it is needed.
     * @private
     */
    _showPopupIfNeeded() {
      if (this.popupDiv.html !== undefined) {
        let correspondingElement = this.domElements[this.popupDiv.index];
        let rect = correspondingElement.getBoundingClientRect();
        this.popupDiv.html.style.left = rect.left + "px";
        this.popupDiv.html.style.top = rect.top - 30 + "px"; // 30 is the height;
        document.body.appendChild(this.popupDiv.html);
        this.popupDiv.hideTimeout = setTimeout(() => {
          this.popupDiv.html.style.opacity = 0;
        },1500);
        this.popupDiv.deleteTimeout = setTimeout(() => {
          this._removePopup();
        },1800);
      }
    }

    /**
     * make a checkbox for boolean options.
     * @param {number} defaultValue
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _makeCheckbox(defaultValue, value, path) {
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'vis-configuration vis-config-checkbox';
      checkbox.checked = defaultValue;
      if (value !== undefined) {
        checkbox.checked = value;
        if (value !== defaultValue) {
          if (typeof defaultValue === 'object') {
            if (value !== defaultValue.enabled) {
              this.changedOptions.push({path:path, value:value});
            }
          }
          else {
            this.changedOptions.push({path:path, value:value});
          }
        }
      }

      let me = this;
      checkbox.onchange = function() {me._update(this.checked, path);};

      let label = this._makeLabel(path[path.length-1], path);
      this._makeItem(path, label, checkbox);
    }

    /**
     * make a text input field for string options.
     * @param {number} defaultValue
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _makeTextInput(defaultValue, value, path) {
      var checkbox = document.createElement('input');
      checkbox.type = 'text';
      checkbox.className = 'vis-configuration vis-config-text';
      checkbox.value = value;
      if (value !== defaultValue) {
        this.changedOptions.push({path:path, value:value});
      }

      let me = this;
      checkbox.onchange = function() {me._update(this.value, path);};

      let label = this._makeLabel(path[path.length-1], path);
      this._makeItem(path, label, checkbox);
    }


    /**
     * make a color field with a color picker for color fields
     * @param {Array.<number>} arr
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _makeColorField(arr, value, path) {
      let defaultColor = arr[1];
      let div = document.createElement('div');
      value = value === undefined ? defaultColor : value;

      if (value !== 'none') {
        div.className = 'vis-configuration vis-config-colorBlock';
        div.style.backgroundColor = value;
      }
      else {
        div.className = 'vis-configuration vis-config-colorBlock none';
      }

      value = value === undefined ? defaultColor : value;
      div.onclick = () => {
        this._showColorPicker(value,div,path);
      };

      let label = this._makeLabel(path[path.length-1], path);
      this._makeItem(path,label, div);
    }


    /**
     * used by the color buttons to call the color picker.
     * @param {number} value
     * @param {HTMLElement} div
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _showColorPicker(value, div, path) {
      // clear the callback from this div
      div.onclick = function() {};

      this.colorPicker.insertTo(div);
      this.colorPicker.show();

      this.colorPicker.setColor(value);
      this.colorPicker.setUpdateCallback((color) => {
        let colorString = 'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + color.a + ')';
        div.style.backgroundColor = colorString;
        this._update(colorString,path);
      });

      // on close of the colorpicker, restore the callback.
      this.colorPicker.setCloseCallback(() => {
        div.onclick = () => {
          this._showColorPicker(value,div,path);
        };
      });
    }


    /**
     * parse an object and draw the correct items
     * @param {Object} obj
     * @param {array} [path=[]]    | where to look for the actual option
     * @param {boolean} [checkOnly=false]
     * @returns {boolean}
     * @private
     */
    _handleObject(obj, path = [], checkOnly = false) {
      let show = false;
      let filter = this.options.filter;
      let visibleInSet = false;
      for (let subObj in obj) {
        if (obj.hasOwnProperty(subObj)) {
          show = true;
          let item = obj[subObj];
          let newPath = availableUtils.copyAndExtendArray(path, subObj);
          if (typeof filter === 'function') {
            show = filter(subObj,path);

            // if needed we must go deeper into the object.
            if (show === false) {
              if (!Array.isArray(item) && typeof item !== 'string' && typeof item !== 'boolean' && item instanceof Object) {
                this.allowCreation = false;
                show = this._handleObject(item, newPath, true);
                this.allowCreation = checkOnly === false;
              }
            }
          }

          if (show !== false) {
            visibleInSet = true;
            let value = this._getValue(newPath);

            if (Array.isArray(item)) {
              this._handleArray(item, value, newPath);
            }
            else if (typeof item === 'string') {
              this._makeTextInput(item, value, newPath);
            }
            else if (typeof item === 'boolean') {
              this._makeCheckbox(item, value, newPath);
            }
            else if (item instanceof Object) {
              // collapse the physics options that are not enabled
              let draw = true;
              if (path.indexOf('physics') !== -1) {
                if (this.moduleOptions.physics.solver !== subObj) {
                  draw = false;
                }
              }

              if (draw === true) {
                // initially collapse options with an disabled enabled option.
                if (item.enabled !== undefined) {
                  let enabledPath = availableUtils.copyAndExtendArray(newPath, 'enabled');
                  let enabledValue = this._getValue(enabledPath);
                  if (enabledValue === true) {
                    let label = this._makeLabel(subObj, newPath, true);
                    this._makeItem(newPath, label);
                    visibleInSet = this._handleObject(item, newPath) || visibleInSet;
                  }
                  else {
                    this._makeCheckbox(item, enabledValue, newPath);
                  }
                }
                else {
                  let label = this._makeLabel(subObj, newPath, true);
                  this._makeItem(newPath, label);
                  visibleInSet = this._handleObject(item, newPath) || visibleInSet;
                }
              }
            }
            else {
              console.error('dont know how to handle', item, subObj, newPath);
            }
          }
        }
      }
      return visibleInSet;
    }


    /**
     * handle the array type of option
     * @param {Array.<number>} arr
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _handleArray(arr, value, path) {
      if (typeof arr[0] === 'string' && arr[0] === 'color') {
        this._makeColorField(arr, value, path);
        if (arr[1] !== value) {this.changedOptions.push({path:path, value:value});}
      }
      else if (typeof arr[0] === 'string') {
        this._makeDropdown(arr, value, path);
        if (arr[0] !== value) {this.changedOptions.push({path:path, value:value});}
      }
      else if (typeof arr[0] === 'number') {
        this._makeRange(arr, value, path);
        if (arr[0] !== value) {this.changedOptions.push({path:path, value:Number(value)});}
      }
    }



    /**
     * called to update the network with the new settings.
     * @param {number} value
     * @param {array} path    | where to look for the actual option
     * @private
     */
    _update(value, path) {
      let options = this._constructOptions(value,path);

      if (this.parent.body && this.parent.body.emitter && this.parent.body.emitter.emit) {
        this.parent.body.emitter.emit("configChange", options);
      }
      this.initialized = true;
      this.parent.setOptions(options);
    }


    /**
     *
     * @param {string|Boolean} value
     * @param {Array.<string>} path
     * @param {{}} optionsObj
     * @returns {{}}
     * @private
     */
    _constructOptions(value, path, optionsObj = {}) {
      let pointer = optionsObj;

      // when dropdown boxes can be string or boolean, we typecast it into correct types
      value = value === 'true'  ? true  : value;
      value = value === 'false' ? false : value;

      for (let i = 0; i < path.length; i++) {
        if (path[i] !== 'global') {
          if (pointer[path[i]] === undefined) {
            pointer[path[i]] = {};
          }
          if (i !== path.length - 1) {
            pointer = pointer[path[i]];
          }
          else {
            pointer[path[i]] = value;
          }
        }
      }
      return optionsObj;
    }

    /**
     * @private
     */
    _printOptions() {
      let options = this.getOptions();
      this.optionsContainer.innerHTML = '<pre>var options = ' + JSON.stringify(options, null, 2) + '</pre>';
    }

    /**
     *
     * @returns {{}} options
     */
    getOptions() {
      let options = {};
      for (var i = 0; i < this.changedOptions.length; i++) {
        this._constructOptions(this.changedOptions[i].value, this.changedOptions[i].path, options);
      }
      return options;
    }
  }

  /**
   * Create a timeline visualization
   * @extends Core
   */
  class Timeline extends Core {
    /**
   * @param {HTMLElement} container
   * @param {vis.DataSet | vis.DataView | Array} [items]
   * @param {vis.DataSet | vis.DataView | Array} [groups]
   * @param {Object} [options]  See Timeline.setOptions for the available options.
   * @constructor Timeline
   */
    constructor(container, items, groups, options) {
      super();
      this.initTime = new Date();
      this.itemsDone = false;

      if (!(this instanceof Timeline)) {
        throw new SyntaxError('Constructor must be called with the new operator');
      }

      // if the third element is options, the forth is groups (optionally);
      if (!(Array.isArray(groups) || esnext.isDataViewLike("id", groups)) && groups instanceof Object) {
        const forthArgument = options;
        options = groups;
        groups = forthArgument;
      }

      // TODO: REMOVE THIS in the next MAJOR release
      // see https://github.com/almende/vis/issues/2511
      if (options && options.throttleRedraw) {
        console.warn("Timeline option \"throttleRedraw\" is DEPRICATED and no longer supported. It will be removed in the next MAJOR release.");
      }

      const me = this;
      this.defaultOptions = {
        autoResize: true,
        longSelectPressTime: 251,
        orientation: {
          axis: 'bottom',   // axis orientation: 'bottom', 'top', or 'both'
          item: 'bottom'    // not relevant
        },
        moment: moment$2,
      };
      this.options = availableUtils.deepExtend({}, this.defaultOptions);
      options && availableUtils.setupXSSProtection(options.xss);

      // Create the DOM, props, and emitter
      this._create(container);
      if (!options || (options && typeof options.rtl == "undefined")) {
        this.dom.root.style.visibility = 'hidden';
        let directionFromDom;
        let domNode = this.dom.root;
        while (!directionFromDom && domNode) {
          directionFromDom = window.getComputedStyle(domNode, null).direction;
          domNode = domNode.parentElement;
        }
        this.options.rtl = (directionFromDom && (directionFromDom.toLowerCase() == "rtl"));
      } else {
        this.options.rtl = options.rtl;
      }

      if (options) {
        if (options.rollingMode) { this.options.rollingMode = options.rollingMode; }
        if (options.onInitialDrawComplete) { this.options.onInitialDrawComplete = options.onInitialDrawComplete; }
        if (options.onTimeout) { this.options.onTimeout = options.onTimeout; }
        if (options.loadingScreenTemplate) { this.options.loadingScreenTemplate = options.loadingScreenTemplate; }
      }

      // Prepare loading screen
      const loadingScreenFragment = document.createElement('div');
      if (this.options.loadingScreenTemplate) {
        const templateFunction = this.options.loadingScreenTemplate.bind(this);
        const loadingScreen = templateFunction(this.dom.loadingScreen);
        if ((loadingScreen instanceof Object) && !(loadingScreen instanceof Element)) {
          templateFunction(loadingScreenFragment);
        } else {
          if (loadingScreen instanceof Element) {
            loadingScreenFragment.innerHTML = '';
            loadingScreenFragment.appendChild(loadingScreen);
          }
          else if (loadingScreen != undefined) {
            loadingScreenFragment.innerHTML = availableUtils.xss(loadingScreen);
          }
        }
      }
      this.dom.loadingScreen.appendChild(loadingScreenFragment);

      // all components listed here will be repainted automatically
      this.components = [];

      this.body = {
        dom: this.dom,
        domProps: this.props,
        emitter: {
          on: this.on.bind(this),
          off: this.off.bind(this),
          emit: this.emit.bind(this)
        },
        hiddenDates: [],
        util: {
          getScale() {
            return me.timeAxis.step.scale;
          },
          getStep() {
            return me.timeAxis.step.step;
          },

          toScreen: me._toScreen.bind(me),
          toGlobalScreen: me._toGlobalScreen.bind(me), // this refers to the root.width
          toTime: me._toTime.bind(me),
          toGlobalTime : me._toGlobalTime.bind(me)
        }
      };

      // range
      this.range = new Range(this.body, this.options);
      this.components.push(this.range);
      this.body.range = this.range;

      // time axis
      this.timeAxis = new TimeAxis(this.body, this.options);
      this.timeAxis2 = null; // used in case of orientation option 'both'
      this.components.push(this.timeAxis);

      // current time bar
      this.currentTime = new CurrentTime(this.body, this.options);
      this.components.push(this.currentTime);

      // item set
      this.itemSet = new ItemSet(this.body, this.options);
      this.components.push(this.itemSet);

      this.itemsData = null;      // DataSet
      this.groupsData = null;     // DataSet

      function emit(eventName, event) {
        if (!me.hasListeners(eventName)) {
          return;
        }

        me.emit(eventName, me.getEventProperties(event));
      }

      this.dom.root.onclick = event => {
        emit('click', event);
      };
      this.dom.root.ondblclick = event => {
        emit('doubleClick', event);
      };
      this.dom.root.oncontextmenu = event => {
        emit('contextmenu', event);
      };
      this.dom.root.onmouseover = event => {
        emit('mouseOver', event);
      };
      if(window.PointerEvent) {
        this.dom.root.onpointerdown = event => {
          emit('mouseDown', event);
        };
        this.dom.root.onpointermove = event => {
          emit('mouseMove', event);
        };
        this.dom.root.onpointerup = event => {
          emit('mouseUp', event);
        };
      } else {
        this.dom.root.onmousemove = event => {
          emit('mouseMove', event);
        };
        this.dom.root.onmousedown = event => {
          emit('mouseDown', event);
        };
        this.dom.root.onmouseup = event => {
          emit('mouseUp', event);
        };
      }

      //Single time autoscale/fit
      this.initialFitDone = false;
      this.on('changed', () => {
        if (me.itemsData == null) return;
        if (!me.initialFitDone && !me.options.rollingMode) {
          me.initialFitDone = true;
          if (me.options.start != undefined || me.options.end != undefined) {
            if (me.options.start == undefined || me.options.end == undefined) {
              var range = me.getItemRange();
            }

            const start = me.options.start != undefined ? me.options.start : range.min;
            const end   = me.options.end   != undefined ? me.options.end   : range.max;
            me.setWindow(start, end, {animation: false});
          } else {
            me.fit({animation: false});
          }
        }

        if (!me.initialDrawDone && (me.initialRangeChangeDone || (!me.options.start && !me.options.end)
          || me.options.rollingMode)) {
          me.initialDrawDone = true;
          me.itemSet.initialDrawDone = true;
          me.dom.root.style.visibility = 'visible';
          me.dom.loadingScreen.parentNode.removeChild(me.dom.loadingScreen);
          if (me.options.onInitialDrawComplete) {
            setTimeout(() => {
              return me.options.onInitialDrawComplete();
            }, 0);
          }
        }
      });

      this.on('destroyTimeline', () => {
        me.destroy();
      });

      // apply options
      if (options) {
        this.setOptions(options);
      }

      this.body.emitter.on('fit', (args) => {
        this._onFit(args);
        this.redraw();
      });

      // IMPORTANT: THIS HAPPENS BEFORE SET ITEMS!
      if (groups) {
        this.setGroups(groups);
      }

      // create itemset
      if (items) {
        this.setItems(items);
      }

      // draw for the first time
      this._redraw();
    }

    /**
     * Load a configurator
     * @return {Object}
     * @private
     */
    _createConfigurator() {
      return new Configurator(this, this.dom.container, configureOptions$1);
    }

    /**
     * Force a redraw. The size of all items will be recalculated.
     * Can be useful to manually redraw when option autoResize=false and the window
     * has been resized, or when the items CSS has been changed.
     *
     * Note: this function will be overridden on construction with a trottled version
     */
    redraw() {
      this.itemSet && this.itemSet.markDirty({refreshItems: true});
      this._redraw();
    }

    /**
     * Remove an item from the group
     * @param {object} options
     */
    setOptions(options) {
      // validate options
      let errorFound = Validator.validate(options, allOptions$1);

      if (errorFound === true) {
        console.log('%cErrors have been found in the supplied options object.', printStyle);
      }

      Core.prototype.setOptions.call(this, options);

      if ('type' in options) {
        if (options.type !== this.options.type) {
          this.options.type = options.type;

          // force recreation of all items
          const itemsData = this.itemsData;
          if (itemsData) {
            const selection = this.getSelection();
            this.setItems(null);            // remove all
            this.setItems(itemsData.rawDS); // add all
            this.setSelection(selection);   // restore selection
          }
        }
      }
    }

    /**
     * Set items
     * @param {vis.DataSet | Array | null} items
     */
    setItems(items) {
      this.itemsDone = false;

      // convert to type DataSet when needed
      let newDataSet;
      if (!items) {
        newDataSet = null;
      }
      else if (esnext.isDataViewLike("id", items)) {
        newDataSet = typeCoerceDataSet(items);
      }
      else {
        // turn an array into a dataset
        newDataSet = typeCoerceDataSet(new esnext.DataSet(items));
      }

      // set items
      if (this.itemsData) {
        // stop maintaining a coerced version of the old data set
        this.itemsData.dispose();
      }
      this.itemsData = newDataSet;
      this.itemSet && this.itemSet.setItems(newDataSet != null ? newDataSet.rawDS : null);
    }

    /**
     * Set groups
     * @param {vis.DataSet | Array} groups
     */
    setGroups(groups) {
      // convert to type DataSet when needed
      let newDataSet;
      const filter = group => group.visible !== false;

      if (!groups) {
        newDataSet = null;
      }
      else {
        // If groups is array, turn to DataSet & build dataview from that
        if (Array.isArray(groups)) groups = new esnext.DataSet(groups);

        newDataSet = new esnext.DataView(groups,{filter});
      }

      // This looks weird but it's necessary to prevent memory leaks.
      //
      // The problem is that the DataView will exist as long as the DataSet it's
      // connected to. This will force it to swap the groups DataSet for it's own
      // DataSet. In this arrangement it will become unreferenced from the outside
      // and garbage collected.
      //
      // IMPORTANT NOTE: If `this.groupsData` is a DataView was created in this
      // method. Even if the original is a DataView already a new one has been
      // created and assigned to `this.groupsData`. In case this changes in the
      // future it will be necessary to rework this!!!!
      if (this.groupsData != null && typeof this.groupsData.setData === "function") {
        this.groupsData.setData(null);
      }
      this.groupsData = newDataSet;
      this.itemSet.setGroups(newDataSet);
    }

    /**
     * Set both items and groups in one go
     * @param {{items: (Array | vis.DataSet), groups: (Array | vis.DataSet)}} data
     */
    setData(data) {
      if (data && data.groups) {
        this.setGroups(data.groups);
      }

      if (data && data.items) {
        this.setItems(data.items);
      }
    }

    /**
     * Set selected items by their id. Replaces the current selection
     * Unknown id's are silently ignored.
     * @param {string[] | string} [ids]  An array with zero or more id's of the items to be
     *                                selected. If ids is an empty array, all items will be
     *                                unselected.
     * @param {Object} [options]      Available options:
     *                                `focus: boolean`
     *                                    If true, focus will be set to the selected item(s)
     *                                `animation: boolean | {duration: number, easingFunction: string}`
     *                                    If true (default), the range is animated
     *                                    smoothly to the new window. An object can be
     *                                    provided to specify duration and easing function.
     *                                    Default duration is 500 ms, and default easing
     *                                    function is 'easeInOutQuad'.
     *                                    Only applicable when option focus is true.
     */
    setSelection(ids, options) {
      this.itemSet && this.itemSet.setSelection(ids);

      if (options && options.focus) {
        this.focus(ids, options);
      }
    }

    /**
     * Get the selected items by their id
     * @return {Array} ids  The ids of the selected items
     */
    getSelection() {
      return this.itemSet && this.itemSet.getSelection() || [];
    }

    /**
     * Adjust the visible window such that the selected item (or multiple items)
     * are centered on screen.
     * @param {string | String[]} id     An item id or array with item ids
     * @param {Object} [options]      Available options:
     *                                `animation: boolean | {duration: number, easingFunction: string}`
     *                                    If true (default), the range is animated
     *                                    smoothly to the new window. An object can be
     *                                    provided to specify duration and easing function.
     *                                    Default duration is 500 ms, and default easing
     *                                    function is 'easeInOutQuad'.
     *                                `zoom: boolean`
     *                                    If true (default), the timeline will
     *                                    zoom on the element after focus it.
     */
    focus(id, options) {
      if (!this.itemsData || id == undefined) return;

      const ids = Array.isArray(id) ? id : [id];

      // get the specified item(s)
      const itemsData = this.itemsData.get(ids);

      // calculate minimum start and maximum end of specified items
      let start = null;
      let end = null;
      itemsData.forEach(itemData => {
        const s = itemData.start.valueOf();
        const e = 'end' in itemData ? itemData.end.valueOf() : itemData.start.valueOf();

        if (start === null || s < start) {
          start = s;
        }

        if (end === null || e > end) {
          end = e;
        }
      });


      if (start !== null && end !== null) {
        const me = this;
        // Use the first item for the vertical focus
        const item = this.itemSet.items[ids[0]];
        let startPos = this._getScrollTop() * -1;
        let initialVerticalScroll = null;

        // Setup a handler for each frame of the vertical scroll
        const verticalAnimationFrame = (ease, willDraw, done) => {
          const verticalScroll = getItemVerticalScroll(me, item);

          if (verticalScroll === false) {
            return; // We don't need to scroll, so do nothing
          }

          if(!initialVerticalScroll) {
            initialVerticalScroll = verticalScroll;
          }

          if(initialVerticalScroll.itemTop == verticalScroll.itemTop && !initialVerticalScroll.shouldScroll) {
            return; // We don't need to scroll, so do nothing
          }
          else if(initialVerticalScroll.itemTop != verticalScroll.itemTop && verticalScroll.shouldScroll) {
            // The redraw shifted elements, so reset the animation to correct
            initialVerticalScroll = verticalScroll;
            startPos = me._getScrollTop() * -1;
          }

          const from = startPos;
          const to = initialVerticalScroll.scrollOffset;
          const scrollTop = done ? to : (from + (to - from) * ease);

          me._setScrollTop(-scrollTop);

          if(!willDraw) {
            me._redraw();
          }
        };

        // Enforces the final vertical scroll position
        const setFinalVerticalPosition = () => {
          const finalVerticalScroll = getItemVerticalScroll(me, item);

          if (finalVerticalScroll.shouldScroll && finalVerticalScroll.itemTop != initialVerticalScroll.itemTop) {
            me._setScrollTop(-finalVerticalScroll.scrollOffset);
            me._redraw();
          }
        };

        // Perform one last check at the end to make sure the final vertical
        // position is correct
        const finalVerticalCallback = () => {
          // Double check we ended at the proper scroll position
          setFinalVerticalPosition();

          // Let the redraw settle and finalize the position.
          setTimeout(setFinalVerticalPosition, 100);
        };

        // calculate the new middle and interval for the window
        const zoom = options && options.zoom !== undefined ? options.zoom : true;
        const middle = (start + end) / 2;
        const interval = zoom ? (end - start) * 1.1 : Math.max(this.range.end - this.range.start, (end - start) * 1.1);

        const animation = options && options.animation !== undefined ? options.animation : true;

        if (!animation) {
          // We aren't animating so set a default so that the final callback forces the vertical location
          initialVerticalScroll = { shouldScroll: false, scrollOffset: -1, itemTop: -1 };
        }

        this.range.setRange(middle - interval / 2, middle + interval / 2, { animation }, finalVerticalCallback, verticalAnimationFrame);
      }
    }

    /**
     * Set Timeline window such that it fits all items
     * @param {Object} [options]  Available options:
     *                                `animation: boolean | {duration: number, easingFunction: string}`
     *                                    If true (default), the range is animated
     *                                    smoothly to the new window. An object can be
     *                                    provided to specify duration and easing function.
     *                                    Default duration is 500 ms, and default easing
     *                                    function is 'easeInOutQuad'.
     * @param {function} [callback]
     */
    fit(options, callback) {
      const animation = (options && options.animation !== undefined) ? options.animation : true;
      let range;

      if (this.itemsData.length === 1 && this.itemsData.get()[0].end === undefined) {
        // a single item -> don't fit, just show a range around the item from -4 to +3 days
        range = this.getDataRange();
        this.moveTo(range.min.valueOf(), {animation}, callback);
      }
      else {
        // exactly fit the items (plus a small margin)
        range = this.getItemRange();
        this.range.setRange(range.min, range.max, { animation }, callback);
      }
    }

    /**
     * Determine the range of the items, taking into account their actual width
     * and a margin of 10 pixels on both sides.
     *
     * @returns {{min: Date, max: Date}}
     */
    getItemRange() {
      // get a rough approximation for the range based on the items start and end dates
      const range = this.getDataRange();
      let min = range.min !== null ? range.min.valueOf() : null;
      let max = range.max !== null ? range.max.valueOf() : null;
      let minItem = null;
      let maxItem = null;

      if (min != null && max != null) {
        let interval = (max - min); // ms
        if (interval <= 0) {
          interval = 10;
        }
        const factor = interval / this.props.center.width;

        const redrawQueue = {};
        let redrawQueueLength = 0;

        // collect redraw functions
        availableUtils.forEach(this.itemSet.items, (item, key) => {
          if (item.groupShowing) {
            const returnQueue = true;
            redrawQueue[key] = item.redraw(returnQueue);
            redrawQueueLength = redrawQueue[key].length;
          }
        });

        const needRedraw = redrawQueueLength > 0;
        if (needRedraw) {
          // redraw all regular items
          for (let i = 0; i < redrawQueueLength; i++) {
            availableUtils.forEach(redrawQueue, fns => {
              fns[i]();
            });
          }
        }

         // calculate the date of the left side and right side of the items given
        availableUtils.forEach(this.itemSet.items, item => {
          const start = getStart(item);
          const end = getEnd(item);
          let startSide;
          let endSide;

          if (this.options.rtl) {
            startSide  = start - (item.getWidthRight()  + 10) * factor;
            endSide = end   + (item.getWidthLeft() + 10) * factor;
          } else {
            startSide  = start - (item.getWidthLeft()  + 10) * factor;
            endSide = end   + (item.getWidthRight() + 10) * factor;
          }

          if (startSide < min) {
            min = startSide;
            minItem = item;
          }
          if (endSide > max) {
            max = endSide;
            maxItem = item;
          }
        });

        if (minItem && maxItem) {
          const lhs = minItem.getWidthLeft() + 10;
          const rhs = maxItem.getWidthRight() + 10;
          const delta = this.props.center.width - lhs - rhs;  // px

          if (delta > 0) {
            if (this.options.rtl) {
              min = getStart(minItem) - rhs * interval / delta; // ms
              max = getEnd(maxItem)   + lhs * interval / delta; // ms
            } else {
              min = getStart(minItem) - lhs * interval / delta; // ms
              max = getEnd(maxItem)   + rhs * interval / delta; // ms
            }
          }
        }
      }

      return {
        min: min != null ? new Date(min) : null,
        max: max != null ? new Date(max) : null
      }
    }

    /**
     * Calculate the data range of the items start and end dates
     * @returns {{min: Date, max: Date}}
     */
    getDataRange() {
      let min = null;
      let max = null;

      if (this.itemsData) {
        this.itemsData.forEach(item => {
          const start = availableUtils.convert(item.start, 'Date').valueOf();
          const end   = availableUtils.convert(item.end != undefined ? item.end : item.start, 'Date').valueOf();
          if (min === null || start < min) {
            min = start;
          }
          if (max === null || end > max) {
            max = end;
          }
        });
      }

      return {
        min: min != null ? new Date(min) : null,
        max: max != null ? new Date(max) : null
      }
    }

    /**
     * Generate Timeline related information from an event
     * @param {Event} event
     * @return {Object} An object with related information, like on which area
     *                  The event happened, whether clicked on an item, etc.
     */
    getEventProperties(event) {
      const clientX = event.center ? event.center.x : event.clientX;
      const clientY = event.center ? event.center.y : event.clientY;
      const centerContainerRect = this.dom.centerContainer.getBoundingClientRect();
      const x = this.options.rtl ? centerContainerRect.right - clientX : clientX - centerContainerRect.left;
      const y = clientY - centerContainerRect.top;

      const item  = this.itemSet.itemFromTarget(event);
      const group = this.itemSet.groupFromTarget(event);
      const customTime = CustomTime.customTimeFromTarget(event);

      const snap = this.itemSet.options.snap || null;
      const scale = this.body.util.getScale();
      const step = this.body.util.getStep();
      const time = this._toTime(x);
      const snappedTime = snap ? snap(time, scale, step) : time;

      const element = availableUtils.getTarget(event);
      let what = null;
      if (item != null)                                                    {what = 'item';}
      else if (customTime != null)                                         {what = 'custom-time';}
      else if (availableUtils.hasParent(element, this.timeAxis.dom.foreground))      {what = 'axis';}
      else if (this.timeAxis2 && availableUtils.hasParent(element, this.timeAxis2.dom.foreground)) {what = 'axis';}
      else if (availableUtils.hasParent(element, this.itemSet.dom.labelSet))         {what = 'group-label';}
      else if (availableUtils.hasParent(element, this.currentTime.bar))              {what = 'current-time';}
      else if (availableUtils.hasParent(element, this.dom.center))                   {what = 'background';}

      return {
        event,
        item: item ? item.id : null,
        isCluster: item ? !!item.isCluster: false,
        items: item ? item.items || []: null,
        group: group ? group.groupId : null,
        customTime: customTime ? customTime.options.id : null,
        what,
        pageX: event.srcEvent ? event.srcEvent.pageX : event.pageX,
        pageY: event.srcEvent ? event.srcEvent.pageY : event.pageY,
        x,
        y,
        time,
        snappedTime
      }
    }

    /**
     * Toggle Timeline rolling mode
     */
    toggleRollingMode() {
      if (this.range.rolling) {
        this.range.stopRolling();
      } else {
        if (this.options.rollingMode == undefined) {
          this.setOptions(this.options);
        }
        this.range.startRolling();
      }
    }

    /**
     * redraw
     * @private
     */
    _redraw() {
      Core.prototype._redraw.call(this);
    }

    /**
     * on fit callback
     * @param {object} args
     * @private
     */
    _onFit(args) {
      const { start, end, animation } = args;
      if (!end) {
        this.moveTo(start.valueOf(), {
          animation
        });
      } else {
        this.range.setRange(start, end, {
          animation: animation
        });
      }
    }
  }

  /**
   *
   * @param {timeline.Item} item
   * @returns {number}
   */
  function getStart(item) {
    return availableUtils.convert(item.data.start, 'Date').valueOf()
  }

  /**
   *
   * @param {timeline.Item} item
   * @returns {number}
   */
  function getEnd(item) {
    const end = item.data.end != undefined ? item.data.end : item.data.start;
    return availableUtils.convert(end, 'Date').valueOf();
  }

  /**
   * @param {vis.Timeline} timeline
   * @param {timeline.Item} item
   * @return {{shouldScroll: bool, scrollOffset: number, itemTop: number}}
   */
  function getItemVerticalScroll(timeline, item) {
    if (!item.parent) {
      // The item no longer exists, so ignore this focus.
      return false;
    }

    const itemsetHeight = timeline.options.rtl ? timeline.props.rightContainer.height : timeline.props.leftContainer.height;
    const contentHeight = timeline.props.center.height;

    const group = item.parent;
    let offset = group.top;
    let shouldScroll = true;
    const orientation = timeline.timeAxis.options.orientation.axis;

    const itemTop = () => {
    if (orientation == "bottom") {
        return group.height - item.top - item.height;
      }
      else {
        return item.top;
      }
    };

    const currentScrollHeight = timeline._getScrollTop() * -1;
    const targetOffset = offset + itemTop();
    const height = item.height;

    if (targetOffset < currentScrollHeight) {
      if (offset + itemsetHeight <= offset + itemTop() + height) {
        offset += itemTop() - timeline.itemSet.options.margin.item.vertical;
      }
    }
    else if (targetOffset + height > currentScrollHeight + itemsetHeight) {
      offset += itemTop() + height - itemsetHeight + timeline.itemSet.options.margin.item.vertical;
    }
    else {
      shouldScroll = false;
    }

    offset = Math.min(offset, contentHeight - itemsetHeight);

    return { shouldScroll, scrollOffset: offset, itemTop: targetOffset };
  }

  // DOM utility methods

  /**
   * this prepares the JSON container for allocating SVG elements
   * @param {Object} JSONcontainer
   * @private
   */
  function prepareElements(JSONcontainer) {
    // cleanup the redundant svgElements;
    for (var elementType in JSONcontainer) {
      if (JSONcontainer.hasOwnProperty(elementType)) {
        JSONcontainer[elementType].redundant = JSONcontainer[elementType].used;
        JSONcontainer[elementType].used = [];
      }
    }
  }

  /**
   * this cleans up all the unused SVG elements. By asking for the parentNode, we only need to supply the JSON container from
   * which to remove the redundant elements.
   *
   * @param {Object} JSONcontainer
   * @private
   */
  function cleanupElements(JSONcontainer) {
    // cleanup the redundant svgElements;
    for (var elementType in JSONcontainer) {
      if (JSONcontainer.hasOwnProperty(elementType)) {
        if (JSONcontainer[elementType].redundant) {
          for (var i = 0; i < JSONcontainer[elementType].redundant.length; i++) {
            JSONcontainer[elementType].redundant[i].parentNode.removeChild(JSONcontainer[elementType].redundant[i]);
          }
          JSONcontainer[elementType].redundant = [];
        }
      }
    }
  }

  /**
   * Ensures that all elements are removed first up so they can be recreated cleanly
   * @param {Object} JSONcontainer
   */
  function resetElements(JSONcontainer) {
    prepareElements(JSONcontainer);
    cleanupElements(JSONcontainer);
    prepareElements(JSONcontainer);
  }

  /**
   * Allocate or generate an SVG element if needed. Store a reference to it in the JSON container and draw it in the svgContainer
   * the JSON container and the SVG container have to be supplied so other svg containers (like the legend) can use this.
   *
   * @param {string} elementType
   * @param {Object} JSONcontainer
   * @param {Object} svgContainer
   * @returns {Element}
   * @private
   */
  function getSVGElement(elementType, JSONcontainer, svgContainer) {
    var element;
    // allocate SVG element, if it doesnt yet exist, create one.
    if (JSONcontainer.hasOwnProperty(elementType)) { // this element has been created before
      // check if there is an redundant element
      if (JSONcontainer[elementType].redundant.length > 0) {
        element = JSONcontainer[elementType].redundant[0];
        JSONcontainer[elementType].redundant.shift();
      }
      else {
        // create a new element and add it to the SVG
        element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
        svgContainer.appendChild(element);
      }
    }
    else {
      // create a new element and add it to the SVG, also create a new object in the svgElements to keep track of it.
      element = document.createElementNS('http://www.w3.org/2000/svg', elementType);
      JSONcontainer[elementType] = {used: [], redundant: []};
      svgContainer.appendChild(element);
    }
    JSONcontainer[elementType].used.push(element);
    return element;
  }


  /**
   * Allocate or generate an SVG element if needed. Store a reference to it in the JSON container and draw it in the svgContainer
   * the JSON container and the SVG container have to be supplied so other svg containers (like the legend) can use this.
   *
   * @param {string} elementType
   * @param {Object} JSONcontainer
   * @param {Element} DOMContainer
   * @param {Element} insertBefore
   * @returns {*}
   */
  function getDOMElement(elementType, JSONcontainer, DOMContainer, insertBefore) {
    var element;
    // allocate DOM element, if it doesnt yet exist, create one.
    if (JSONcontainer.hasOwnProperty(elementType)) { // this element has been created before
      // check if there is an redundant element
      if (JSONcontainer[elementType].redundant.length > 0) {
        element = JSONcontainer[elementType].redundant[0];
        JSONcontainer[elementType].redundant.shift();
      }
      else {
        // create a new element and add it to the SVG
        element = document.createElement(elementType);
        if (insertBefore !== undefined) {
          DOMContainer.insertBefore(element, insertBefore);
        }
        else {
          DOMContainer.appendChild(element);
        }
      }
    }
    else {
      // create a new element and add it to the SVG, also create a new object in the svgElements to keep track of it.
      element = document.createElement(elementType);
      JSONcontainer[elementType] = {used: [], redundant: []};
      if (insertBefore !== undefined) {
        DOMContainer.insertBefore(element, insertBefore);
      }
      else {
        DOMContainer.appendChild(element);
      }
    }
    JSONcontainer[elementType].used.push(element);
    return element;
  }




  /**
   * Draw a point object. This is a separate function because it can also be called by the legend.
   * The reason the JSONcontainer and the target SVG svgContainer have to be supplied is so the legend can use these functions
   * as well.
   *
   * @param {number} x
   * @param {number} y
   * @param {Object} groupTemplate: A template containing the necessary information to draw the datapoint e.g., {style: 'circle', size: 5, className: 'className' }
   * @param {Object} JSONcontainer
   * @param {Object} svgContainer
   * @param {Object} labelObj
   * @returns {vis.PointItem}
   */
  function drawPoint(x, y, groupTemplate, JSONcontainer, svgContainer, labelObj) {
    var point;
    if (groupTemplate.style == 'circle') {
      point = getSVGElement('circle', JSONcontainer, svgContainer);
      point.setAttributeNS(null, "cx", x);
      point.setAttributeNS(null, "cy", y);
      point.setAttributeNS(null, "r", 0.5 * groupTemplate.size);
    }
    else {
      point = getSVGElement('rect', JSONcontainer, svgContainer);
      point.setAttributeNS(null, "x", x - 0.5 * groupTemplate.size);
      point.setAttributeNS(null, "y", y - 0.5 * groupTemplate.size);
      point.setAttributeNS(null, "width", groupTemplate.size);
      point.setAttributeNS(null, "height", groupTemplate.size);
    }

    if (groupTemplate.styles !== undefined) {
      point.setAttributeNS(null, "style", groupTemplate.styles);
    }
    point.setAttributeNS(null, "class", groupTemplate.className + " vis-point");
    //handle label


    if (labelObj) {
      var label = getSVGElement('text', JSONcontainer, svgContainer);
      if (labelObj.xOffset) {
        x = x + labelObj.xOffset;
      }

      if (labelObj.yOffset) {
        y = y + labelObj.yOffset;
      }
      if (labelObj.content) {
        label.textContent = labelObj.content;
      }

      if (labelObj.className) {
        label.setAttributeNS(null, "class", labelObj.className  + " vis-label");
      }
      label.setAttributeNS(null, "x", x);
      label.setAttributeNS(null, "y", y);
    }

    return point;
  }

  /**
   * draw a bar SVG element centered on the X coordinate
   *
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {string} className
   * @param {Object} JSONcontainer
   * @param {Object} svgContainer
   * @param {string} style
   */
  function drawBar (x, y, width, height, className, JSONcontainer, svgContainer, style) {
    if (height != 0) {
      if (height < 0) {
        height *= -1;
        y -= height;
      }
      var rect = getSVGElement('rect',JSONcontainer, svgContainer);
      rect.setAttributeNS(null, "x", x - 0.5 * width);
      rect.setAttributeNS(null, "y", y);
      rect.setAttributeNS(null, "width", width);
      rect.setAttributeNS(null, "height", height);
      rect.setAttributeNS(null, "class", className);
      if (style) {
        rect.setAttributeNS(null, "style", style);
      }
    }
  }

  /**
   * get default language
   * @returns {string}
   */
  function getNavigatorLanguage() {
    try {
      if (!navigator) return 'en';
      if (navigator.languages && navigator.languages.length) {
        return navigator.languages;
      } else {
        return navigator.userLanguage || navigator.language || navigator.browserLanguage || 'en';
      }
    } 
    catch(error) {
      return 'en';
    }
  }

  /** DataScale */
  class DataScale {
    /**
     *
     * @param {number} start
     * @param {number} end
     * @param {boolean} autoScaleStart
     * @param {boolean} autoScaleEnd
     * @param {number} containerHeight
     * @param {number} majorCharHeight
     * @param {boolean} zeroAlign
     * @param {function} formattingFunction
     * @constructor DataScale
     */
    constructor(
      start,
      end,
      autoScaleStart,
      autoScaleEnd,
      containerHeight,
      majorCharHeight,
      zeroAlign = false,
      formattingFunction=false) {
      this.majorSteps = [1, 2, 5, 10];
      this.minorSteps = [0.25, 0.5, 1, 2];
      this.customLines = null;

      this.containerHeight = containerHeight;
      this.majorCharHeight = majorCharHeight;
      this._start = start;
      this._end = end;

      this.scale = 1;
      this.minorStepIdx = -1;
      this.magnitudefactor = 1;
      this.determineScale();

      this.zeroAlign = zeroAlign;
      this.autoScaleStart = autoScaleStart;
      this.autoScaleEnd = autoScaleEnd;

      this.formattingFunction = formattingFunction;

      if (autoScaleStart || autoScaleEnd) {
        const me = this;
        const roundToMinor = value => {
          const rounded = value - (value % (me.magnitudefactor * me.minorSteps[me.minorStepIdx]));
          if (value % (me.magnitudefactor * me.minorSteps[me.minorStepIdx]) > 0.5 * (me.magnitudefactor * me.minorSteps[me.minorStepIdx])) {
            return rounded + (me.magnitudefactor * me.minorSteps[me.minorStepIdx]);
          }
          else {
            return rounded;
          }
        };
        if (autoScaleStart) {
          this._start -= this.magnitudefactor * 2 * this.minorSteps[this.minorStepIdx];
          this._start = roundToMinor(this._start);
        }

        if (autoScaleEnd) {
          this._end += this.magnitudefactor * this.minorSteps[this.minorStepIdx];
          this._end = roundToMinor(this._end);
        }
        this.determineScale();
      }
    }

    /**
     * set chart height
     * @param {number} majorCharHeight 
     */
    setCharHeight(majorCharHeight) {
      this.majorCharHeight = majorCharHeight;
    }

    /**
     * set height
     * @param {number} containerHeight 
     */
    setHeight(containerHeight) {
      this.containerHeight = containerHeight;
    }

    /**
     * determine scale
     */
    determineScale() {
      const range = this._end - this._start;
      this.scale = this.containerHeight / range;
      const minimumStepValue = this.majorCharHeight / this.scale;
      const orderOfMagnitude = (range > 0)
          ? Math.round(Math.log(range) / Math.LN10)
          : 0;

      this.minorStepIdx = -1;
      this.magnitudefactor = Math.pow(10, orderOfMagnitude);

      let start = 0;
      if (orderOfMagnitude < 0) {
        start = orderOfMagnitude;
      }

      let solutionFound = false;
      for (let l = start; Math.abs(l) <= Math.abs(orderOfMagnitude); l++) {
        this.magnitudefactor = Math.pow(10, l);
        for (let j = 0; j < this.minorSteps.length; j++) {
          const stepSize = this.magnitudefactor * this.minorSteps[j];
          if (stepSize >= minimumStepValue) {
            solutionFound = true;
            this.minorStepIdx = j;
            break;
          }
        }
        if (solutionFound === true) {
          break;
        }
      }
    }

    /**
     * returns if value is major
     * @param {number} value
     * @returns {boolean} 
     */
    is_major(value) {
      return (value % (this.magnitudefactor * this.majorSteps[this.minorStepIdx]) === 0);
    }

    /**
     * returns step size
     * @returns {number} 
     */
    getStep() {
      return this.magnitudefactor * this.minorSteps[this.minorStepIdx];
    }

    /**
     * returns first major
     * @returns {number} 
     */
    getFirstMajor() {
      const majorStep = this.magnitudefactor * this.majorSteps[this.minorStepIdx];
      return this.convertValue(this._start + ((majorStep - (this._start % majorStep)) % majorStep));
    }

    /**
     * returns first major
     * @param {date} current
     * @returns {date} formatted date
     */
    formatValue(current) {
      let returnValue = current.toPrecision(5);
      if (typeof this.formattingFunction === 'function') {
        returnValue = this.formattingFunction(current);
      }

      if (typeof returnValue === 'number') {
        return `${returnValue}`;
      }
      else if (typeof returnValue === 'string') {
        return returnValue;
      }
      else {
        return current.toPrecision(5);
      }

    }

    /**
     * returns lines
     * @returns {object} lines
     */
    getLines() {
      const lines = [];
      const step = this.getStep();
      const bottomOffset = (step - (this._start % step)) % step;
      for (let i = (this._start + bottomOffset); this._end-i > 0.00001; i += step) {
        if (i != this._start) { //Skip the bottom line
          lines.push({major: this.is_major(i), y: this.convertValue(i), val: this.formatValue(i)});
        }
      }
      return lines;
    }

    /**
     * follow scale
     * @param {object} other
     */
    followScale(other) {
      const oldStepIdx = this.minorStepIdx;
      const oldStart = this._start;
      const oldEnd = this._end;

      const me = this;
      const increaseMagnitude = () => {
        me.magnitudefactor *= 2;
      };
      const decreaseMagnitude = () => {
        me.magnitudefactor /= 2;
      };

      if ((other.minorStepIdx <= 1 && this.minorStepIdx <= 1) || (other.minorStepIdx > 1 && this.minorStepIdx > 1)) ; else if (other.minorStepIdx < this.minorStepIdx) {
        //I'm 5, they are 4 per major.
        this.minorStepIdx = 1;
        if (oldStepIdx == 2) {
          increaseMagnitude();
        } else {
          increaseMagnitude();
          increaseMagnitude();
        }
      } else {
        //I'm 4, they are 5 per major
        this.minorStepIdx = 2;
        if (oldStepIdx == 1) {
          decreaseMagnitude();
        } else {
          decreaseMagnitude();
          decreaseMagnitude();
        }
      }

      //Get masters stats:
      const otherZero = other.convertValue(0);
      const otherStep = other.getStep() * other.scale;

      let done = false;
      let count = 0;
      //Loop until magnitude is correct for given constrains.
      while (!done && count++ <5) {

        //Get my stats:
        this.scale = otherStep / (this.minorSteps[this.minorStepIdx] * this.magnitudefactor);
        const newRange = this.containerHeight / this.scale;

        //For the case the magnitudefactor has changed:
        this._start = oldStart;
        this._end = this._start + newRange;

        const myOriginalZero = this._end * this.scale;
        const majorStep = this.magnitudefactor * this.majorSteps[this.minorStepIdx];
        const majorOffset = this.getFirstMajor() - other.getFirstMajor();

        if (this.zeroAlign) {
          const zeroOffset = otherZero - myOriginalZero;
          this._end += (zeroOffset / this.scale);
          this._start = this._end - newRange;
        } else {
          if (!this.autoScaleStart) {
            this._start += majorStep - (majorOffset / this.scale);
            this._end = this._start + newRange;
          } else {
            this._start -= majorOffset / this.scale;
            this._end = this._start + newRange;
          }
        }
        if (!this.autoScaleEnd && this._end > oldEnd+0.00001) {
          //Need to decrease magnitude to prevent scale overshoot! (end)
          decreaseMagnitude();
          done = false;
          continue;
        }
        if (!this.autoScaleStart && this._start < oldStart-0.00001) {
          if (this.zeroAlign && oldStart >= 0) {
            console.warn("Can't adhere to given 'min' range, due to zeroalign");
          } else {
            //Need to decrease magnitude to prevent scale overshoot! (start)
            decreaseMagnitude();
            done = false;
            continue;
          }
        }
        if (this.autoScaleStart && this.autoScaleEnd && newRange < (oldEnd-oldStart)){
          increaseMagnitude();
          done = false;
          continue;
        }
        done = true;
      }
    }

    /**
     * convert value
     * @param {number} value
     * @returns {number} 
     */
    convertValue(value) {
      return this.containerHeight - ((value - this._start) * this.scale);
    }

    /**
     * returns screen to value
     * @param {number} pixels
     * @returns {number} 
     */
    screenToValue(pixels) {
      return ((this.containerHeight - pixels) / this.scale) + this._start;
    }
  }

  /** A horizontal time axis */
  class DataAxis extends Component {
    /**
   * @param {Object} body
   * @param {Object} [options]        See DataAxis.setOptions for the available
   *                                  options.
   * @param {SVGElement} svg
   * @param {timeline.LineGraph.options} linegraphOptions
   * @constructor DataAxis
   * @extends Component
   */
    constructor(body, options, svg, linegraphOptions) {
      super();
      this.id = uuid.v4();
      this.body = body;

      this.defaultOptions = {
        orientation: 'left',  // supported: 'left', 'right'
        showMinorLabels: true,
        showMajorLabels: true,
        showWeekScale: false,
        icons: false,
        majorLinesOffset: 7,
        minorLinesOffset: 4,
        labelOffsetX: 10,
        labelOffsetY: 2,
        iconWidth: 20,
        width: '40px',
        visible: true,
        alignZeros: true,
        left: {
          range: {min: undefined, max: undefined},
          format(value) {
            return `${parseFloat(value.toPrecision(3))}`;
          },
          title: {text: undefined, style: undefined}
        },
        right: {
          range: {min: undefined, max: undefined},
          format(value) {
            return `${parseFloat(value.toPrecision(3))}`;
          },
          title: {text: undefined, style: undefined}
        }
      };

      this.linegraphOptions = linegraphOptions;
      this.linegraphSVG = svg;
      this.props = {};
      this.DOMelements = { // dynamic elements
        lines: {},
        labels: {},
        title: {}
      };

      this.dom = {};
      this.scale = undefined;
      this.range = {start: 0, end: 0};

      this.options = availableUtils.extend({}, this.defaultOptions);
      this.conversionFactor = 1;

      this.setOptions(options);
      this.width = Number((`${this.options.width}`).replace("px", ""));
      this.minWidth = this.width;
      this.height = this.linegraphSVG.getBoundingClientRect().height;
      this.hidden = false;

      this.stepPixels = 25;
      this.zeroCrossing = -1;
      this.amountOfSteps = -1;

      this.lineOffset = 0;
      this.master = true;
      this.masterAxis = null;
      this.svgElements = {};
      this.iconsRemoved = false;

      this.groups = {};
      this.amountOfGroups = 0;

      // create the HTML DOM
      this._create();
      if (this.scale == undefined) {
        this._redrawLabels();
      }
      this.framework = {svg: this.svg, svgElements: this.svgElements, options: this.options, groups: this.groups};

      const me = this;
      this.body.emitter.on("verticalDrag", () => {
        me.dom.lineContainer.style.top = `${me.body.domProps.scrollTop}px`;
      });
    }

    /**
     * Adds group to data axis
     * @param {string} label 
     * @param {object} graphOptions
     */
    addGroup(label, graphOptions) {
      if (!this.groups.hasOwnProperty(label)) {
        this.groups[label] = graphOptions;
      }
      this.amountOfGroups += 1;
    }

    /**
     * updates group of data axis
     * @param {string} label 
     * @param {object} graphOptions
     */
    updateGroup(label, graphOptions) {
      if (!this.groups.hasOwnProperty(label)) {
        this.amountOfGroups += 1;
      }
      this.groups[label] = graphOptions;
    }

    /**
     * removes group of data axis
     * @param {string} label 
     */
    removeGroup(label) {
      if (this.groups.hasOwnProperty(label)) {
        delete this.groups[label];
        this.amountOfGroups -= 1;
      }
    }

    /**
     * sets options
     * @param {object} options
     */
    setOptions(options) {
      if (options) {
        let redraw = false;
        if (this.options.orientation != options.orientation && options.orientation !== undefined) {
          redraw = true;
        }
        const fields = [
          'orientation',
          'showMinorLabels',
          'showMajorLabels',
          'icons',
          'majorLinesOffset',
          'minorLinesOffset',
          'labelOffsetX',
          'labelOffsetY',
          'iconWidth',
          'width',
          'visible',
          'left',
          'right',
          'alignZeros'
        ];
        availableUtils.selectiveDeepExtend(fields, this.options, options);

        this.minWidth = Number((`${this.options.width}`).replace("px", ""));
        if (redraw === true && this.dom.frame) {
          this.hide();
          this.show();
        }
      }
    }

    /**
     * Create the HTML DOM for the DataAxis
     */
    _create() {
      this.dom.frame = document.createElement('div');
      this.dom.frame.style.width = this.options.width;
      this.dom.frame.style.height = this.height;

      this.dom.lineContainer = document.createElement('div');
      this.dom.lineContainer.style.width = '100%';
      this.dom.lineContainer.style.height = this.height;
      this.dom.lineContainer.style.position = 'relative';
      this.dom.lineContainer.style.visibility = 'visible';
      this.dom.lineContainer.style.display = 'block';

      // create svg element for graph drawing.
      this.svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
      this.svg.style.position = "absolute";
      this.svg.style.top = '0px';
      this.svg.style.height = '100%';
      this.svg.style.width = '100%';
      this.svg.style.display = "block";
      this.dom.frame.appendChild(this.svg);
    }

    /**
     * redraws groups icons
     */
    _redrawGroupIcons() {
      prepareElements(this.svgElements);

      let x;
      const iconWidth = this.options.iconWidth;
      const iconHeight = 15;
      const iconOffset = 4;
      let y = iconOffset + 0.5 * iconHeight;

      if (this.options.orientation === 'left') {
        x = iconOffset;
      }
      else {
        x = this.width - iconWidth - iconOffset;
      }

      const groupArray = Object.keys(this.groups);
      groupArray.sort((a, b) => a < b ? -1 : 1);

      for (const groupId of groupArray) {
        if (this.groups[groupId].visible === true && (this.linegraphOptions.visibility[groupId] === undefined || this.linegraphOptions.visibility[groupId] === true)) {
          this.groups[groupId].getLegend(iconWidth, iconHeight, this.framework, x, y);
          y += iconHeight + iconOffset;
        }
      }

      cleanupElements(this.svgElements);
      this.iconsRemoved = false;
    }

    /**
     * Cleans up icons
     */
    _cleanupIcons() {
      if (this.iconsRemoved === false) {
        prepareElements(this.svgElements);
        cleanupElements(this.svgElements);
        this.iconsRemoved = true;
      }
    }

    /**
     * Create the HTML DOM for the DataAxis
     */
    show() {
      this.hidden = false;
      if (!this.dom.frame.parentNode) {
        if (this.options.orientation === 'left') {
          this.body.dom.left.appendChild(this.dom.frame);
        }
        else {
          this.body.dom.right.appendChild(this.dom.frame);
        }
      }

      if (!this.dom.lineContainer.parentNode) {
        this.body.dom.backgroundHorizontal.appendChild(this.dom.lineContainer);
      }
      this.dom.lineContainer.style.display = 'block';
    }

    /**
     * Create the HTML DOM for the DataAxis
     */
    hide() {
      this.hidden = true;
      if (this.dom.frame.parentNode) {
        this.dom.frame.parentNode.removeChild(this.dom.frame);
      }

      this.dom.lineContainer.style.display = 'none';
    }

    /**
     * Set a range (start and end)
     * @param {number} start
     * @param {number} end
     */
    setRange(start, end) {
      this.range.start = start;
      this.range.end = end;
    }

    /**
     * Repaint the component
     * @return {boolean} Returns true if the component is resized
     */
    redraw() {
      let resized = false;
      let activeGroups = 0;

      // Make sure the line container adheres to the vertical scrolling.
      this.dom.lineContainer.style.top = `${this.body.domProps.scrollTop}px`;

      for (const groupId in this.groups) {
        if (this.groups.hasOwnProperty(groupId)) {
          if (this.groups[groupId].visible === true && (this.linegraphOptions.visibility[groupId] === undefined || this.linegraphOptions.visibility[groupId] === true)) {
            activeGroups++;
          }
        }
      }
      if (this.amountOfGroups === 0 || activeGroups === 0) {
        this.hide();
      }
      else {
        this.show();
        this.height = Number(this.linegraphSVG.style.height.replace("px", ""));

        // svg offsetheight did not work in firefox and explorer...
        this.dom.lineContainer.style.height = `${this.height}px`;
        this.width = this.options.visible === true ? Number((`${this.options.width}`).replace("px", "")) : 0;

        const props = this.props;
        const frame = this.dom.frame;

        // update classname
        frame.className = 'vis-data-axis';

        // calculate character width and height
        this._calculateCharSize();

        const orientation = this.options.orientation;
        const showMinorLabels = this.options.showMinorLabels;
        const showMajorLabels = this.options.showMajorLabels;

        const backgroundHorizontalOffsetWidth = this.body.dom.backgroundHorizontal.offsetWidth;

        // determine the width and height of the elements for the axis
        props.minorLabelHeight = showMinorLabels ? props.minorCharHeight : 0;
        props.majorLabelHeight = showMajorLabels ? props.majorCharHeight : 0;

        props.minorLineWidth = backgroundHorizontalOffsetWidth - this.lineOffset - this.width + 2 * this.options.minorLinesOffset;
        props.minorLineHeight = 1;
        props.majorLineWidth = backgroundHorizontalOffsetWidth - this.lineOffset - this.width + 2 * this.options.majorLinesOffset;
        props.majorLineHeight = 1;

        //  take frame offline while updating (is almost twice as fast)
        if (orientation === 'left') {
          frame.style.top = '0';
          frame.style.left = '0';
          frame.style.bottom = '';
          frame.style.width = `${this.width}px`;
          frame.style.height = `${this.height}px`;
          this.props.width = this.body.domProps.left.width;
          this.props.height = this.body.domProps.left.height;
        }
        else { // right
          frame.style.top = '';
          frame.style.bottom = '0';
          frame.style.left = '0';
          frame.style.width = `${this.width}px`;
          frame.style.height = `${this.height}px`;
          this.props.width = this.body.domProps.right.width;
          this.props.height = this.body.domProps.right.height;
        }

        resized = this._redrawLabels();
        resized = this._isResized() || resized;

        if (this.options.icons === true) {
          this._redrawGroupIcons();
        }
        else {
          this._cleanupIcons();
        }

        this._redrawTitle(orientation);
      }
      return resized;
    }

    /**
     * Repaint major and minor text labels and vertical grid lines
     *
     * @returns {boolean}
     * @private
     */
    _redrawLabels() {
      let resized = false;
      prepareElements(this.DOMelements.lines);
      prepareElements(this.DOMelements.labels);
      const orientation = this.options['orientation'];
      const customRange = this.options[orientation].range != undefined ? this.options[orientation].range : {};

      //Override range with manual options:
      let autoScaleEnd = true;
      if (customRange.max != undefined) {
        this.range.end = customRange.max;
        autoScaleEnd = false;
      }
      let autoScaleStart = true;
      if (customRange.min != undefined) {
        this.range.start = customRange.min;
        autoScaleStart = false;
      }

      this.scale = new DataScale(
        this.range.start,
        this.range.end,
        autoScaleStart,
        autoScaleEnd,
        this.dom.frame.offsetHeight,
        this.props.majorCharHeight,
        this.options.alignZeros,
        this.options[orientation].format
      );

      if (this.master === false && this.masterAxis != undefined) {
        this.scale.followScale(this.masterAxis.scale);
        this.dom.lineContainer.style.display = 'none';
      } else {
        this.dom.lineContainer.style.display = 'block';
      }

      //Is updated in side-effect of _redrawLabel():
      this.maxLabelSize = 0;

      const lines = this.scale.getLines();
      lines.forEach(
        line=> {
          const y = line.y;
          const isMajor = line.major;
          if (this.options['showMinorLabels'] && isMajor === false) {
            this._redrawLabel(y - 2, line.val, orientation, 'vis-y-axis vis-minor', this.props.minorCharHeight);
          }
          if (isMajor) {
            if (y >= 0) {
              this._redrawLabel(y - 2, line.val, orientation, 'vis-y-axis vis-major', this.props.majorCharHeight);
            }
          }
          if (this.master === true) {
            if (isMajor) {
              this._redrawLine(y, orientation, 'vis-grid vis-horizontal vis-major', this.options.majorLinesOffset, this.props.majorLineWidth);
            }
            else {
              this._redrawLine(y, orientation, 'vis-grid vis-horizontal vis-minor', this.options.minorLinesOffset, this.props.minorLineWidth);
            }
          }
        });

      // Note that title is rotated, so we're using the height, not width!
      let titleWidth = 0;
      if (this.options[orientation].title !== undefined && this.options[orientation].title.text !== undefined) {
        titleWidth = this.props.titleCharHeight;
      }
      const offset = this.options.icons === true ? Math.max(this.options.iconWidth, titleWidth) + this.options.labelOffsetX + 15 : titleWidth + this.options.labelOffsetX + 15;

      // this will resize the yAxis to accommodate the labels.
      if (this.maxLabelSize > (this.width - offset) && this.options.visible === true) {
        this.width = this.maxLabelSize + offset;
        this.options.width = `${this.width}px`;
        cleanupElements(this.DOMelements.lines);
        cleanupElements(this.DOMelements.labels);
        this.redraw();
        resized = true;
      }
      // this will resize the yAxis if it is too big for the labels.
      else if (this.maxLabelSize < (this.width - offset) && this.options.visible === true && this.width > this.minWidth) {
        this.width = Math.max(this.minWidth, this.maxLabelSize + offset);
        this.options.width = `${this.width}px`;
        cleanupElements(this.DOMelements.lines);
        cleanupElements(this.DOMelements.labels);
        this.redraw();
        resized = true;
      }
      else {
        cleanupElements(this.DOMelements.lines);
        cleanupElements(this.DOMelements.labels);
        resized = false;
      }

      return resized;
    }

    /**
     * converts value
     * @param {number} value
     * @returns {number} converted number
     */
    convertValue(value) {
      return this.scale.convertValue(value);
    }

    /**
     * converts value
     * @param {number} x
     * @returns {number} screen value
     */
    screenToValue(x) {
      return this.scale.screenToValue(x);
    }

    /**
     * Create a label for the axis at position x
     *
     * @param {number} y
     * @param {string} text
     * @param {'top'|'right'|'bottom'|'left'} orientation
     * @param {string} className
     * @param {number} characterHeight
     * @private
     */
    _redrawLabel(y, text, orientation, className, characterHeight) {
      // reuse redundant label
      const label = getDOMElement('div', this.DOMelements.labels, this.dom.frame); //this.dom.redundant.labels.shift();
      label.className = className;
      label.innerHTML = availableUtils.xss(text);
      if (orientation === 'left') {
        label.style.left = `-${this.options.labelOffsetX}px`;
        label.style.textAlign = "right";
      }
      else {
        label.style.right = `-${this.options.labelOffsetX}px`;
        label.style.textAlign = "left";
      }

      label.style.top = `${y - 0.5 * characterHeight + this.options.labelOffsetY}px`;

      text += '';

      const largestWidth = Math.max(this.props.majorCharWidth, this.props.minorCharWidth);
      if (this.maxLabelSize < text.length * largestWidth) {
        this.maxLabelSize = text.length * largestWidth;
      }
    }

    /**
     * Create a minor line for the axis at position y
     * @param {number} y
     * @param {'top'|'right'|'bottom'|'left'} orientation
     * @param {string} className
     * @param {number} offset
     * @param {number} width
     */
    _redrawLine(y, orientation, className, offset, width) {
      if (this.master === true) {
        const line = getDOMElement('div', this.DOMelements.lines, this.dom.lineContainer);  //this.dom.redundant.lines.shift();
        line.className = className;
        line.innerHTML = '';

        if (orientation === 'left') {
          line.style.left = `${this.width - offset}px`;
        }
        else {
          line.style.right = `${this.width - offset}px`;
        }

        line.style.width = `${width}px`;
        line.style.top = `${y}px`;
      }
    }

    /**
     * Create a title for the axis
     * @private
     * @param {'top'|'right'|'bottom'|'left'} orientation
     */
    _redrawTitle(orientation) {
      prepareElements(this.DOMelements.title);

      // Check if the title is defined for this axes
      if (this.options[orientation].title !== undefined && this.options[orientation].title.text !== undefined) {
        const title = getDOMElement('div', this.DOMelements.title, this.dom.frame);
        title.className = `vis-y-axis vis-title vis-${orientation}`;
        title.innerHTML = availableUtils.xss(this.options[orientation].title.text);

        // Add style - if provided
        if (this.options[orientation].title.style !== undefined) {
          availableUtils.addCssText(title, this.options[orientation].title.style);
        }

        if (orientation === 'left') {
          title.style.left = `${this.props.titleCharHeight}px`;
        }
        else {
          title.style.right = `${this.props.titleCharHeight}px`;
        }

        title.style.width = `${this.height}px`;
      }

      // we need to clean up in case we did not use all elements.
      cleanupElements(this.DOMelements.title);
    }

    /**
     * Determine the size of text on the axis (both major and minor axis).
     * The size is calculated only once and then cached in this.props.
     * @private
     */
    _calculateCharSize() {
      // determine the char width and height on the minor axis
      if (!('minorCharHeight' in this.props)) {
        const textMinor = document.createTextNode('0');
        const measureCharMinor = document.createElement('div');
        measureCharMinor.className = 'vis-y-axis vis-minor vis-measure';
        measureCharMinor.appendChild(textMinor);
        this.dom.frame.appendChild(measureCharMinor);

        this.props.minorCharHeight = measureCharMinor.clientHeight;
        this.props.minorCharWidth = measureCharMinor.clientWidth;

        this.dom.frame.removeChild(measureCharMinor);
      }

      if (!('majorCharHeight' in this.props)) {
        const textMajor = document.createTextNode('0');
        const measureCharMajor = document.createElement('div');
        measureCharMajor.className = 'vis-y-axis vis-major vis-measure';
        measureCharMajor.appendChild(textMajor);
        this.dom.frame.appendChild(measureCharMajor);

        this.props.majorCharHeight = measureCharMajor.clientHeight;
        this.props.majorCharWidth = measureCharMajor.clientWidth;

        this.dom.frame.removeChild(measureCharMajor);
      }

      if (!('titleCharHeight' in this.props)) {
        const textTitle = document.createTextNode('0');
        const measureCharTitle = document.createElement('div');
        measureCharTitle.className = 'vis-y-axis vis-title vis-measure';
        measureCharTitle.appendChild(textTitle);
        this.dom.frame.appendChild(measureCharTitle);

        this.props.titleCharHeight = measureCharTitle.clientHeight;
        this.props.titleCharWidth = measureCharTitle.clientWidth;

        this.dom.frame.removeChild(measureCharTitle);
      }
    }
  }

  /**
   *
   * @param {number | string} groupId
   * @param {Object} options   // TODO: Describe options
   *
   * @constructor Points
   */
  function Points(groupId, options) {  // eslint-disable-line no-unused-vars
  }

  /**
   * draw the data points
   *
   * @param {Array} dataset
   * @param {GraphGroup} group
   * @param {Object} framework            | SVG DOM element
   * @param {number} [offset]
   */
  Points.draw = function (dataset, group, framework, offset) {
    offset = offset || 0;
    var callback = getCallback(framework, group);

    for (var i = 0; i < dataset.length; i++) {
      if (!callback) {
        // draw the point the simple way.
        drawPoint(dataset[i].screen_x + offset, dataset[i].screen_y, getGroupTemplate(group), framework.svgElements, framework.svg, dataset[i].label);
      }
      else {
        var callbackResult = callback(dataset[i], group); // result might be true, false or an object
        if (callbackResult === true || typeof callbackResult === 'object') {
          drawPoint(dataset[i].screen_x + offset, dataset[i].screen_y, getGroupTemplate(group, callbackResult), framework.svgElements, framework.svg, dataset[i].label);
        }
      }
    }
  };

  Points.drawIcon = function (group, x, y, iconWidth, iconHeight, framework) {
    var fillHeight = iconHeight * 0.5;

    var outline = getSVGElement("rect", framework.svgElements, framework.svg);
    outline.setAttributeNS(null, "x", x);
    outline.setAttributeNS(null, "y", y - fillHeight);
    outline.setAttributeNS(null, "width", iconWidth);
    outline.setAttributeNS(null, "height", 2 * fillHeight);
    outline.setAttributeNS(null, "class", "vis-outline");

    //Don't call callback on icon
    drawPoint(x + 0.5 * iconWidth, y, getGroupTemplate(group), framework.svgElements, framework.svg);
  };

  /**
   *
   * @param {vis.Group} group
   * @param {any} callbackResult
   * @returns {{style: *, styles: (*|string), size: *, className: *}}
   */
  function getGroupTemplate(group, callbackResult) {
    callbackResult = (typeof callbackResult === 'undefined') ? {} : callbackResult;
    return {
      style: callbackResult.style || group.options.drawPoints.style,
      styles: callbackResult.styles || group.options.drawPoints.styles,
      size: callbackResult.size || group.options.drawPoints.size,
      className: callbackResult.className || group.className
    };
  }

  /**
   *
   * @param {Object} framework            | SVG DOM element
   * @param {vis.Group} group
   * @returns {function}
   */
  function getCallback(framework, group) {
    var callback = undefined;
    // check for the graph2d onRender
    if (framework.options && framework.options.drawPoints && framework.options.drawPoints.onRender && typeof framework.options.drawPoints.onRender == 'function') {
      callback = framework.options.drawPoints.onRender;
    }

    // override it with the group onRender if defined
    if (group.group.options && group.group.options.drawPoints && group.group.options.drawPoints.onRender && typeof group.group.options.drawPoints.onRender == 'function') {
      callback = group.group.options.drawPoints.onRender;
    }
    return callback;
  }

  /**
   *
   * @param {vis.GraphGroup.id} groupId
   * @param {Object} options   // TODO: Describe options
   * @constructor Bargraph
   */
  function Bargraph(groupId, options) {  // eslint-disable-line no-unused-vars
  }

  Bargraph.drawIcon = function (group, x, y, iconWidth, iconHeight, framework) {
    var fillHeight = iconHeight * 0.5;
    var outline = getSVGElement("rect", framework.svgElements, framework.svg);
    outline.setAttributeNS(null, "x", x);
    outline.setAttributeNS(null, "y", y - fillHeight);
    outline.setAttributeNS(null, "width", iconWidth);
    outline.setAttributeNS(null, "height", 2 * fillHeight);
    outline.setAttributeNS(null, "class", "vis-outline");

    var barWidth = Math.round(0.3 * iconWidth);
    var originalWidth = group.options.barChart.width;
    var scale = originalWidth / barWidth;
    var bar1Height = Math.round(0.4 * iconHeight);
    var bar2Height = Math.round(0.75 * iconHeight);

    var offset = Math.round((iconWidth - (2 * barWidth)) / 3);

    drawBar(x + 0.5 * barWidth + offset, y + fillHeight - bar1Height - 1, barWidth, bar1Height, group.className + ' vis-bar', framework.svgElements, framework.svg, group.style);
    drawBar(x + 1.5 * barWidth + offset + 2, y + fillHeight - bar2Height - 1, barWidth, bar2Height, group.className + ' vis-bar', framework.svgElements, framework.svg, group.style);

    if (group.options.drawPoints.enabled == true) {
      var groupTemplate = {
        style: group.options.drawPoints.style,
        styles: group.options.drawPoints.styles,
        size: (group.options.drawPoints.size / scale),
        className: group.className
      };
      drawPoint(x + 0.5 * barWidth + offset, y + fillHeight - bar1Height - 1, groupTemplate, framework.svgElements, framework.svg);
      drawPoint(x + 1.5 * barWidth + offset + 2, y + fillHeight - bar2Height - 1, groupTemplate, framework.svgElements, framework.svg);
    }
  };

  /**
   * draw a bar graph
   *
   * @param {Array.<vis.GraphGroup.id>} groupIds
   * @param {Object} processedGroupData
   * @param {{svg: Object, svgElements: Array.<Object>, options: Object, groups: Array.<vis.Group>}} framework
   */
  Bargraph.draw = function (groupIds, processedGroupData, framework) {
    var combinedData = [];
    var intersections = {};
    var coreDistance;
    var key, drawData;
    var group;
    var i, j;
    var barPoints = 0;

    // combine all barchart data
    for (i = 0; i < groupIds.length; i++) {
      group = framework.groups[groupIds[i]];
      if (group.options.style === 'bar') {
        if (group.visible === true && (framework.options.groups.visibility[groupIds[i]] === undefined || framework.options.groups.visibility[groupIds[i]] === true)) {
          for (j = 0; j < processedGroupData[groupIds[i]].length; j++) {
            combinedData.push({
              screen_x: processedGroupData[groupIds[i]][j].screen_x,
              screen_end: processedGroupData[groupIds[i]][j].screen_end,
              screen_y: processedGroupData[groupIds[i]][j].screen_y,
              x: processedGroupData[groupIds[i]][j].x,
              end: processedGroupData[groupIds[i]][j].end,
              y: processedGroupData[groupIds[i]][j].y,
              groupId: groupIds[i],
              label: processedGroupData[groupIds[i]][j].label
            });
            barPoints += 1;
          }
        }
      }
    }

    if (barPoints === 0) {
      return;
    }

    // sort by time and by group
    combinedData.sort(function (a, b) {
      if (a.screen_x === b.screen_x) {
        return a.groupId < b.groupId ? -1 : 1;
      }
      else {
        return a.screen_x - b.screen_x;
      }
    });

    // get intersections
    Bargraph._getDataIntersections(intersections, combinedData);

    // plot barchart
    for (i = 0; i < combinedData.length; i++) {
      group = framework.groups[combinedData[i].groupId];
      var minWidth = group.options.barChart.minWidth != undefined ? group.options.barChart.minWidth : 0.1 * group.options.barChart.width;

      key = combinedData[i].screen_x;
      var heightOffset = 0;
      if (intersections[key] === undefined) {
        if (i + 1 < combinedData.length) {
          coreDistance = Math.abs(combinedData[i + 1].screen_x - key);
        }
        drawData = Bargraph._getSafeDrawData(coreDistance, group, minWidth);
      }
      else {
        var nextKey = i + (intersections[key].amount - intersections[key].resolved);
        if (nextKey < combinedData.length) {
          coreDistance = Math.abs(combinedData[nextKey].screen_x - key);
        }
        drawData = Bargraph._getSafeDrawData(coreDistance, group, minWidth);
        intersections[key].resolved += 1;

        if (group.options.stack === true && group.options.excludeFromStacking !== true) {
          if (combinedData[i].screen_y < group.zeroPosition) {
            heightOffset = intersections[key].accumulatedNegative;
            intersections[key].accumulatedNegative += group.zeroPosition - combinedData[i].screen_y;
          }
          else {
            heightOffset = intersections[key].accumulatedPositive;
            intersections[key].accumulatedPositive += group.zeroPosition - combinedData[i].screen_y;
          }
        }
        else if (group.options.barChart.sideBySide === true) {
          drawData.width = drawData.width / intersections[key].amount;
          drawData.offset += (intersections[key].resolved) * drawData.width - (0.5 * drawData.width * (intersections[key].amount + 1));
        }
      }
      
      let dataWidth = drawData.width;
      let start = combinedData[i].screen_x;

      // are we drawing explicit boxes? (we supplied an end value)
      if (combinedData[i].screen_end != undefined){
        dataWidth = combinedData[i].screen_end - combinedData[i].screen_x;
        start += (dataWidth * 0.5);
      }
      else {
        start += drawData.offset;
      }

      drawBar(start, combinedData[i].screen_y - heightOffset, dataWidth, group.zeroPosition - combinedData[i].screen_y, group.className + ' vis-bar', framework.svgElements, framework.svg, group.style);

      // draw points
      if (group.options.drawPoints.enabled === true) {
        let pointData = {
          screen_x: combinedData[i].screen_x,
          screen_y: combinedData[i].screen_y - heightOffset,
          x: combinedData[i].x,
          y: combinedData[i].y,
          groupId: combinedData[i].groupId,
          label: combinedData[i].label
        };
        Points.draw([pointData], group, framework, drawData.offset);
        //DOMutil.drawPoint(combinedData[i].x + drawData.offset, combinedData[i].y, group, framework.svgElements, framework.svg);
      }
    }
  };


  /**
   * Fill the intersections object with counters of how many datapoints share the same x coordinates
   * @param {Object} intersections
   * @param {Array.<Object>} combinedData
   * @private
   */
  Bargraph._getDataIntersections = function (intersections, combinedData) {
    // get intersections
    var coreDistance;
    for (var i = 0; i < combinedData.length; i++) {
      if (i + 1 < combinedData.length) {
        coreDistance = Math.abs(combinedData[i + 1].screen_x - combinedData[i].screen_x);
      }
      if (i > 0) {
        coreDistance = Math.min(coreDistance, Math.abs(combinedData[i - 1].screen_x - combinedData[i].screen_x));
      }
      if (coreDistance === 0) {
        if (intersections[combinedData[i].screen_x] === undefined) {
          intersections[combinedData[i].screen_x] = {
            amount: 0,
            resolved: 0,
            accumulatedPositive: 0,
            accumulatedNegative: 0
          };
        }
        intersections[combinedData[i].screen_x].amount += 1;
      }
    }
  };


  /**
   * Get the width and offset for bargraphs based on the coredistance between datapoints
   *
   * @param {number} coreDistance
   * @param {vis.Group} group
   * @param {number} minWidth
   * @returns {{width: number, offset: number}}
   * @private
   */
  Bargraph._getSafeDrawData = function (coreDistance, group, minWidth) {
    var width, offset;
    if (coreDistance < group.options.barChart.width && coreDistance > 0) {
      width = coreDistance < minWidth ? minWidth : coreDistance;

      offset = 0; // recalculate offset with the new width;
      if (group.options.barChart.align === 'left') {
        offset -= 0.5 * coreDistance;
      }
      else if (group.options.barChart.align === 'right') {
        offset += 0.5 * coreDistance;
      }
    }
    else {
      // default settings
      width = group.options.barChart.width;
      offset = 0;
      if (group.options.barChart.align === 'left') {
        offset -= 0.5 * group.options.barChart.width;
      }
      else if (group.options.barChart.align === 'right') {
        offset += 0.5 * group.options.barChart.width;
      }
    }

    return {width: width, offset: offset};
  };

  Bargraph.getStackedYRange = function (combinedData, groupRanges, groupIds, groupLabel, orientation) {
    if (combinedData.length > 0) {
      // sort by time and by group
      combinedData.sort(function (a, b) {
        if (a.screen_x === b.screen_x) {
          return a.groupId < b.groupId ? -1 : 1;
        }
        else {
          return a.screen_x - b.screen_x;
        }
      });
      var intersections = {};

      Bargraph._getDataIntersections(intersections, combinedData);
      groupRanges[groupLabel] = Bargraph._getStackedYRange(intersections, combinedData);
      groupRanges[groupLabel].yAxisOrientation = orientation;
      groupIds.push(groupLabel);
    }
  };

  Bargraph._getStackedYRange = function (intersections, combinedData) {
    var key;
    var yMin = combinedData[0].screen_y;
    var yMax = combinedData[0].screen_y;
    for (var i = 0; i < combinedData.length; i++) {
      key = combinedData[i].screen_x;
      if (intersections[key] === undefined) {
        yMin = yMin > combinedData[i].screen_y ? combinedData[i].screen_y : yMin;
        yMax = yMax < combinedData[i].screen_y ? combinedData[i].screen_y : yMax;
      }
      else {
        if (combinedData[i].screen_y < 0) {
          intersections[key].accumulatedNegative += combinedData[i].screen_y;
        }
        else {
          intersections[key].accumulatedPositive += combinedData[i].screen_y;
        }
      }
    }
    for (var xpos in intersections) {
      if (intersections.hasOwnProperty(xpos)) {
        yMin = yMin > intersections[xpos].accumulatedNegative ? intersections[xpos].accumulatedNegative : yMin;
        yMin = yMin > intersections[xpos].accumulatedPositive ? intersections[xpos].accumulatedPositive : yMin;
        yMax = yMax < intersections[xpos].accumulatedNegative ? intersections[xpos].accumulatedNegative : yMax;
        yMax = yMax < intersections[xpos].accumulatedPositive ? intersections[xpos].accumulatedPositive : yMax;
      }
    }

    return {min: yMin, max: yMax};
  };

  /**
   *
   * @param {vis.GraphGroup.id} groupId
   * @param {Object} options   // TODO: Describe options
   * @constructor Line
   */
  function Line(groupId, options) {  // eslint-disable-line no-unused-vars
  }

  Line.calcPath = function (dataset, group) {
      if (dataset != null) {
          if (dataset.length > 0) {
              var d = [];

              // construct path from dataset
              if (group.options.interpolation.enabled == true) {
                  d = Line._catmullRom(dataset, group);
              }
              else {
                  d = Line._linear(dataset);
              }
              return d;
          }
      }
  };

  Line.drawIcon = function (group, x, y, iconWidth, iconHeight, framework) {
      var fillHeight = iconHeight * 0.5;
      var path, fillPath;

      var outline = getSVGElement("rect", framework.svgElements, framework.svg);
      outline.setAttributeNS(null, "x", x);
      outline.setAttributeNS(null, "y", y - fillHeight);
      outline.setAttributeNS(null, "width", iconWidth);
      outline.setAttributeNS(null, "height", 2 * fillHeight);
      outline.setAttributeNS(null, "class", "vis-outline");

      path = getSVGElement("path", framework.svgElements, framework.svg);
      path.setAttributeNS(null, "class", group.className);
      if (group.style !== undefined) {
          path.setAttributeNS(null, "style", group.style);
      }

      path.setAttributeNS(null, "d", "M" + x + "," + y + " L" + (x + iconWidth) + "," + y + "");
      if (group.options.shaded.enabled == true) {
          fillPath = getSVGElement("path", framework.svgElements, framework.svg);
          if (group.options.shaded.orientation == 'top') {
              fillPath.setAttributeNS(null, "d", "M" + x + ", " + (y - fillHeight) +
                "L" + x + "," + y + " L" + (x + iconWidth) + "," + y + " L" + (x + iconWidth) + "," + (y - fillHeight));
          }
          else {
              fillPath.setAttributeNS(null, "d", "M" + x + "," + y + " " +
                "L" + x + "," + (y + fillHeight) + " " +
                "L" + (x + iconWidth) + "," + (y + fillHeight) +
                "L" + (x + iconWidth) + "," + y);
          }
          fillPath.setAttributeNS(null, "class", group.className + " vis-icon-fill");
          if (group.options.shaded.style !== undefined && group.options.shaded.style !== "") {
              fillPath.setAttributeNS(null, "style", group.options.shaded.style);
          }
      }

      if (group.options.drawPoints.enabled == true) {
          var groupTemplate = {
              style: group.options.drawPoints.style,
              styles: group.options.drawPoints.styles,
              size: group.options.drawPoints.size,
              className: group.className
          };
          drawPoint(x + 0.5 * iconWidth, y, groupTemplate, framework.svgElements, framework.svg);
      }
  };

  Line.drawShading = function (pathArray, group, subPathArray, framework) {
      // append shading to the path
      if (group.options.shaded.enabled == true) {
          var svgHeight = Number(framework.svg.style.height.replace('px',''));
          var fillPath = getSVGElement('path', framework.svgElements, framework.svg);
          var type = "L";
          if (group.options.interpolation.enabled == true){
              type = "C";
          }
          var dFill;
          var zero = 0;
          if (group.options.shaded.orientation == 'top') {
              zero = 0;
          }
          else if (group.options.shaded.orientation == 'bottom') {
              zero = svgHeight;
          }
          else {
              zero = Math.min(Math.max(0, group.zeroPosition), svgHeight);
          }
          if (group.options.shaded.orientation == 'group' && (subPathArray != null && subPathArray != undefined)) {
              dFill = 'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " +
                      this.serializePath(pathArray,type,false) +
                      ' L'+ subPathArray[subPathArray.length-1][0]+ "," + subPathArray[subPathArray.length-1][1] + " " +
                      this.serializePath(subPathArray,type,true) +
                      subPathArray[0][0]+ ","+subPathArray[0][1] + " Z";
          }
          else {
              dFill = 'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " +
                      this.serializePath(pathArray,type,false) +
                      ' V' + zero + ' H'+ pathArray[0][0] + " Z";
          }

          fillPath.setAttributeNS(null, 'class', group.className + ' vis-fill');
          if (group.options.shaded.style !== undefined) {
              fillPath.setAttributeNS(null, 'style', group.options.shaded.style);
          }
          fillPath.setAttributeNS(null, 'd', dFill);
      }
  };

  /**
   * draw a line graph
   *
   * @param {Array.<Object>} pathArray
   * @param {vis.Group} group
   * @param {{svg: Object, svgElements: Array.<Object>, options: Object, groups: Array.<vis.Group>}} framework
   */
  Line.draw = function (pathArray, group, framework) {
      if (pathArray != null && pathArray != undefined) {
          var path = getSVGElement('path', framework.svgElements, framework.svg);
          path.setAttributeNS(null, "class", group.className);
          if (group.style !== undefined) {
              path.setAttributeNS(null, "style", group.style);
          }

          var type = "L";
          if (group.options.interpolation.enabled == true){
              type = "C";
          }
          // copy properties to path for drawing.
          path.setAttributeNS(null, 'd', 'M' + pathArray[0][0]+ ","+pathArray[0][1] + " " + this.serializePath(pathArray,type,false));
      }
  };

  Line.serializePath = function(pathArray,type,inverse){
      if (pathArray.length < 2){
          //Too little data to create a path.
          return "";
      }
      var d = type;
      var i;
      if (inverse){
          for (i = pathArray.length-2; i > 0; i--){
              d += pathArray[i][0] + "," + pathArray[i][1] + " ";
          }
      }
      else {
          for (i = 1; i < pathArray.length; i++){
              d += pathArray[i][0] + "," + pathArray[i][1] + " ";
          }
      }
      return d;
  };

  /**
   * This uses an uniform parametrization of the interpolation algorithm:
   * 'On the Parameterization of Catmull-Rom Curves' by Cem Yuksel et al.
   * @param {Array.<Object>} data
   * @returns {string}
   * @private
   */
  Line._catmullRomUniform = function (data) {
      // catmull rom
      var p0, p1, p2, p3, bp1, bp2;
      var d = [];
      d.push( [ Math.round(data[0].screen_x) , Math.round(data[0].screen_y) ]);
      var normalization = 1 / 6;
      var length = data.length;
      for (var i = 0; i < length - 1; i++) {

          p0 = (i == 0) ? data[0] : data[i - 1];
          p1 = data[i];
          p2 = data[i + 1];
          p3 = (i + 2 < length) ? data[i + 2] : p2;


          // Catmull-Rom to Cubic Bezier conversion matrix
          //    0       1       0       0
          //  -1/6      1      1/6      0
          //    0      1/6      1     -1/6
          //    0       0       1       0

          //    bp0 = { x: p1.x,                               y: p1.y };
          bp1 = {
              screen_x: ((-p0.screen_x + 6 * p1.screen_x + p2.screen_x) * normalization),
              screen_y: ((-p0.screen_y + 6 * p1.screen_y + p2.screen_y) * normalization)
          };
          bp2 = {
              screen_x: (( p1.screen_x + 6 * p2.screen_x - p3.screen_x) * normalization),
              screen_y: (( p1.screen_y + 6 * p2.screen_y - p3.screen_y) * normalization)
          };
          //    bp0 = { x: p2.x,                               y: p2.y };

          d.push( [ bp1.screen_x , bp1.screen_y ]);
          d.push( [ bp2.screen_x , bp2.screen_y ]);
          d.push( [ p2.screen_x  , p2.screen_y  ]);
      }

      return d;
  };

  /**
   * This uses either the chordal or centripetal parameterization of the catmull-rom algorithm.
   * By default, the centripetal parameterization is used because this gives the nicest results.
   * These parameterizations are relatively heavy because the distance between 4 points have to be calculated.
   *
   * One optimization can be used to reuse distances since this is a sliding window approach.
   * @param {Array.<Object>} data
   * @param {vis.GraphGroup} group
   * @returns {string}
   * @private
   */
  Line._catmullRom = function (data, group) {
      var alpha = group.options.interpolation.alpha;
      if (alpha == 0 || alpha === undefined) {
          return this._catmullRomUniform(data);
      }
      else {
          var p0, p1, p2, p3, bp1, bp2, d1, d2, d3, A, B, N, M;
          var d3powA, d2powA, d3pow2A, d2pow2A, d1pow2A, d1powA;
          var d = [];
          d.push( [ Math.round(data[0].screen_x) , Math.round(data[0].screen_y) ]);
          var length = data.length;
          for (var i = 0; i < length - 1; i++) {

              p0 = (i == 0) ? data[0] : data[i - 1];
              p1 = data[i];
              p2 = data[i + 1];
              p3 = (i + 2 < length) ? data[i + 2] : p2;

              d1 = Math.sqrt(Math.pow(p0.screen_x - p1.screen_x, 2) + Math.pow(p0.screen_y - p1.screen_y, 2));
              d2 = Math.sqrt(Math.pow(p1.screen_x - p2.screen_x, 2) + Math.pow(p1.screen_y - p2.screen_y, 2));
              d3 = Math.sqrt(Math.pow(p2.screen_x - p3.screen_x, 2) + Math.pow(p2.screen_y - p3.screen_y, 2));

              // Catmull-Rom to Cubic Bezier conversion matrix

              // A = 2d1^2a + 3d1^a * d2^a + d3^2a
              // B = 2d3^2a + 3d3^a * d2^a + d2^2a

              // [   0             1            0          0          ]
              // [   -d2^2a /N     A/N          d1^2a /N   0          ]
              // [   0             d3^2a /M     B/M        -d2^2a /M  ]
              // [   0             0            1          0          ]

              d3powA = Math.pow(d3, alpha);
              d3pow2A = Math.pow(d3, 2 * alpha);
              d2powA = Math.pow(d2, alpha);
              d2pow2A = Math.pow(d2, 2 * alpha);
              d1powA = Math.pow(d1, alpha);
              d1pow2A = Math.pow(d1, 2 * alpha);

              A = 2 * d1pow2A + 3 * d1powA * d2powA + d2pow2A;
              B = 2 * d3pow2A + 3 * d3powA * d2powA + d2pow2A;
              N = 3 * d1powA * (d1powA + d2powA);
              if (N > 0) {
                  N = 1 / N;
              }
              M = 3 * d3powA * (d3powA + d2powA);
              if (M > 0) {
                  M = 1 / M;
              }

              bp1 = {
                  screen_x: ((-d2pow2A * p0.screen_x + A * p1.screen_x + d1pow2A * p2.screen_x) * N),
                  screen_y: ((-d2pow2A * p0.screen_y + A * p1.screen_y + d1pow2A * p2.screen_y) * N)
              };

              bp2 = {
                  screen_x: (( d3pow2A * p1.screen_x + B * p2.screen_x - d2pow2A * p3.screen_x) * M),
                  screen_y: (( d3pow2A * p1.screen_y + B * p2.screen_y - d2pow2A * p3.screen_y) * M)
              };

              if (bp1.screen_x == 0 && bp1.screen_y == 0) {
                  bp1 = p1;
              }
              if (bp2.screen_x == 0 && bp2.screen_y == 0) {
                  bp2 = p2;
              }
              d.push( [ bp1.screen_x , bp1.screen_y ]);
              d.push( [ bp2.screen_x , bp2.screen_y ]);
              d.push( [ p2.screen_x  , p2.screen_y  ]);
          }

          return d;
      }
  };

  /**
   * this generates the SVG path for a linear drawing between datapoints.
   * @param {Array.<Object>} data
   * @returns {string}
   * @private
   */
  Line._linear = function (data) {
      // linear
      var d = [];
      for (var i = 0; i < data.length; i++) {
          d.push([ data[i].screen_x , data[i].screen_y ]);
      }
      return d;
  };

  /**
   * /**
   * @param {object} group            | the object of the group from the dataset
   * @param {string} groupId          | ID of the group
   * @param {object} options          | the default options
   * @param {array} groupsUsingDefaultStyles  | this array has one entree.
   *                                            It is passed as an array so it is passed by reference.
   *                                            It enumerates through the default styles
   * @constructor GraphGroup
   */
  function GraphGroup(group, groupId, options, groupsUsingDefaultStyles) {
    this.id = groupId;
    var fields = ['sampling', 'style', 'sort', 'yAxisOrientation', 'barChart', 'drawPoints', 'shaded', 'interpolation', 'zIndex','excludeFromStacking', 'excludeFromLegend'];
    this.options = availableUtils.selectiveBridgeObject(fields, options);
    this.usingDefaultStyle = group.className === undefined;
    this.groupsUsingDefaultStyles = groupsUsingDefaultStyles;
    this.zeroPosition = 0;
    this.update(group);
    if (this.usingDefaultStyle == true) {
      this.groupsUsingDefaultStyles[0] += 1;
    }
    this.itemsData = [];
    this.visible = group.visible === undefined ? true : group.visible;
  }

  /**
   * this loads a reference to all items in this group into this group.
   * @param {array} items
   */
  GraphGroup.prototype.setItems = function (items) {
    if (items != null) {
      this.itemsData = items;
      if (this.options.sort == true) {
        availableUtils.insertSort(this.itemsData,function (a, b) {
          return a.x > b.x ? 1 : -1;
        });
      }
    }
    else {
      this.itemsData = [];
    }
  };

  GraphGroup.prototype.getItems = function () {
    return this.itemsData;
  };

  /**
   * this is used for barcharts and shading, this way, we only have to calculate it once.
   * @param {number} pos
   */
  GraphGroup.prototype.setZeroPosition = function (pos) {
    this.zeroPosition = pos;
  };

  /**
   * set the options of the graph group over the default options.
   * @param {Object} options
   */
  GraphGroup.prototype.setOptions = function (options) {
    if (options !== undefined) {
      var fields = ['sampling', 'style', 'sort', 'yAxisOrientation', 'barChart', 'zIndex','excludeFromStacking', 'excludeFromLegend'];
      availableUtils.selectiveDeepExtend(fields, this.options, options);

      // if the group's drawPoints is a function delegate the callback to the onRender property
      if (typeof options.drawPoints == 'function') {
        options.drawPoints = {
          onRender: options.drawPoints
        };
      }

      availableUtils.mergeOptions(this.options, options, 'interpolation');
      availableUtils.mergeOptions(this.options, options, 'drawPoints');
      availableUtils.mergeOptions(this.options, options, 'shaded');

      if (options.interpolation) {
        if (typeof options.interpolation == 'object') {
          if (options.interpolation.parametrization) {
            if (options.interpolation.parametrization == 'uniform') {
              this.options.interpolation.alpha = 0;
            }
            else if (options.interpolation.parametrization == 'chordal') {
              this.options.interpolation.alpha = 1.0;
            }
            else {
              this.options.interpolation.parametrization = 'centripetal';
              this.options.interpolation.alpha = 0.5;
            }
          }
        }
      }
    }
  };


  /**
   * this updates the current group class with the latest group dataset entree, used in _updateGroup in linegraph
   * @param {vis.Group} group
   */
  GraphGroup.prototype.update = function (group) {
    this.group = group;
    this.content = group.content || 'graph';
    this.className = group.className || this.className || 'vis-graph-group' + this.groupsUsingDefaultStyles[0] % 10;
    this.visible = group.visible === undefined ? true : group.visible;
    this.style = group.style;
    this.setOptions(group.options);
  };

  /**
   * return the legend entree for this group.
   *
   * @param {number} iconWidth
   * @param {number} iconHeight
   * @param {{svg: (*|Element), svgElements: Object, options: Object, groups: Array.<Object>}} framework
   * @param {number} x
   * @param {number} y
   * @returns {{icon: (*|Element), label: (*|string), orientation: *}}
   */
  GraphGroup.prototype.getLegend = function (iconWidth, iconHeight, framework, x, y) {
    if (framework == undefined || framework == null) {
      var svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
      framework = {svg: svg, svgElements:{}, options: this.options, groups: [this]};
    }
    if (x == undefined || x == null){
      x = 0;
    }
    if (y == undefined || y == null){
      y = 0.5 * iconHeight;
    }
    switch (this.options.style){
      case "line":
        Line.drawIcon(this, x, y, iconWidth, iconHeight, framework);
        break;
      case "points": //explicit no break
      case "point":
        Points.drawIcon(this, x, y, iconWidth, iconHeight, framework);
        break;
      case "bar":
        Bargraph.drawIcon(this, x, y, iconWidth, iconHeight, framework);
        break;
    }
    return {icon: framework.svg, label: this.content, orientation: this.options.yAxisOrientation};
  };

  GraphGroup.prototype.getYRange = function (groupData) {
    var yMin = groupData[0].y;
    var yMax = groupData[0].y;
    for (var j = 0; j < groupData.length; j++) {
      yMin = yMin > groupData[j].y ? groupData[j].y : yMin;
      yMax = yMax < groupData[j].y ? groupData[j].y : yMax;
    }
    return {min: yMin, max: yMax, yAxisOrientation: this.options.yAxisOrientation};
  };

  /**
   * Legend for Graph2d
   *
   * @param {vis.Graph2d.body} body
   * @param {vis.Graph2d.options} options
   * @param {number} side
   * @param {vis.LineGraph.options} linegraphOptions
   * @constructor Legend
   * @extends Component
   */
  function Legend(body, options, side, linegraphOptions) {
    this.body = body;
    this.defaultOptions = {
      enabled: false,
      icons: true,
      iconSize: 20,
      iconSpacing: 6,
      left: {
        visible: true,
        position: 'top-left' // top/bottom - left,center,right
      },
      right: {
        visible: true,
        position: 'top-right' // top/bottom - left,center,right
      }
    };

    this.side = side;
    this.options = availableUtils.extend({}, this.defaultOptions);
    this.linegraphOptions = linegraphOptions;

    this.svgElements = {};
    this.dom = {};
    this.groups = {};
    this.amountOfGroups = 0;
    this._create();
    this.framework = {svg: this.svg, svgElements: this.svgElements, options: this.options, groups: this.groups};

    this.setOptions(options);
  }

  Legend.prototype = new Component();

  Legend.prototype.clear = function() {
    this.groups = {};
    this.amountOfGroups = 0;
  };

  Legend.prototype.addGroup = function(label, graphOptions) {

    // Include a group only if the group option 'excludeFromLegend: false' is not set.
    if (graphOptions.options.excludeFromLegend != true) {
      if (!this.groups.hasOwnProperty(label)) {
        this.groups[label] = graphOptions;
      }
      this.amountOfGroups += 1;
    }
  };

  Legend.prototype.updateGroup = function(label, graphOptions) {
    this.groups[label] = graphOptions;
  };

  Legend.prototype.removeGroup = function(label) {
    if (this.groups.hasOwnProperty(label)) {
      delete this.groups[label];
      this.amountOfGroups -= 1;
    }
  };

  Legend.prototype._create = function() {
    this.dom.frame = document.createElement('div');
    this.dom.frame.className = 'vis-legend';
    this.dom.frame.style.position = "absolute";
    this.dom.frame.style.top = "10px";
    this.dom.frame.style.display = "block";

    this.dom.textArea = document.createElement('div');
    this.dom.textArea.className = 'vis-legend-text';
    this.dom.textArea.style.position = "relative";
    this.dom.textArea.style.top = "0px";

    this.svg = document.createElementNS('http://www.w3.org/2000/svg',"svg");
    this.svg.style.position = 'absolute';
    this.svg.style.top = 0 +'px';
    this.svg.style.width = this.options.iconSize + 5 + 'px';
    this.svg.style.height = '100%';

    this.dom.frame.appendChild(this.svg);
    this.dom.frame.appendChild(this.dom.textArea);
  };

  /**
   * Hide the component from the DOM
   */
  Legend.prototype.hide = function() {
    // remove the frame containing the items
    if (this.dom.frame.parentNode) {
      this.dom.frame.parentNode.removeChild(this.dom.frame);
    }
  };

  /**
   * Show the component in the DOM (when not already visible).
   */
  Legend.prototype.show = function() {
    // show frame containing the items
    if (!this.dom.frame.parentNode) {
      this.body.dom.center.appendChild(this.dom.frame);
    }
  };

  Legend.prototype.setOptions = function(options) {
    var fields = ['enabled','orientation','icons','left','right'];
    availableUtils.selectiveDeepExtend(fields, this.options, options);
  };

  Legend.prototype.redraw = function() {
    var activeGroups = 0;
    var groupArray = Object.keys(this.groups);
    groupArray.sort(function (a,b) {
      return (a < b ? -1 : 1);
    });

    for (var i = 0; i < groupArray.length; i++) {
      var groupId = groupArray[i];
      if (this.groups[groupId].visible == true && (this.linegraphOptions.visibility[groupId] === undefined || this.linegraphOptions.visibility[groupId] == true)) {
        activeGroups++;
      }
    }

    if (this.options[this.side].visible == false || this.amountOfGroups == 0 || this.options.enabled == false || activeGroups == 0) {
      this.hide();
    }
    else {
      this.show();
      if (this.options[this.side].position == 'top-left' || this.options[this.side].position == 'bottom-left') {
        this.dom.frame.style.left = '4px';
        this.dom.frame.style.textAlign = "left";
        this.dom.textArea.style.textAlign = "left";
        this.dom.textArea.style.left = (this.options.iconSize + 15) + 'px';
        this.dom.textArea.style.right = '';
        this.svg.style.left = 0 +'px';
        this.svg.style.right = '';
      }
      else {
        this.dom.frame.style.right = '4px';
        this.dom.frame.style.textAlign = "right";
        this.dom.textArea.style.textAlign = "right";
        this.dom.textArea.style.right = (this.options.iconSize + 15) + 'px';
        this.dom.textArea.style.left = '';
        this.svg.style.right = 0 +'px';
        this.svg.style.left = '';
      }

      if (this.options[this.side].position == 'top-left' || this.options[this.side].position == 'top-right') {
        this.dom.frame.style.top = 4 - Number(this.body.dom.center.style.top.replace("px","")) + 'px';
        this.dom.frame.style.bottom = '';
      }
      else {
        var scrollableHeight = this.body.domProps.center.height - this.body.domProps.centerContainer.height;
        this.dom.frame.style.bottom = 4 + scrollableHeight + Number(this.body.dom.center.style.top.replace("px","")) + 'px';
        this.dom.frame.style.top = '';
      }

      if (this.options.icons == false) {
        this.dom.frame.style.width = this.dom.textArea.offsetWidth + 10 + 'px';
        this.dom.textArea.style.right = '';
        this.dom.textArea.style.left = '';
        this.svg.style.width = '0px';
      }
      else {
        this.dom.frame.style.width = this.options.iconSize + 15 + this.dom.textArea.offsetWidth + 10 + 'px';
        this.drawLegendIcons();
      }

      var content = '';
      for (i = 0; i < groupArray.length; i++) {
        groupId = groupArray[i];
        if (this.groups[groupId].visible == true && (this.linegraphOptions.visibility[groupId] === undefined || this.linegraphOptions.visibility[groupId] == true)) {
          content += this.groups[groupId].content + '<br />';
        }
      }
      this.dom.textArea.innerHTML = availableUtils.xss(content);
      this.dom.textArea.style.lineHeight = ((0.75 * this.options.iconSize) + this.options.iconSpacing) + 'px';
    }
  };

  Legend.prototype.drawLegendIcons = function() {
    if (this.dom.frame.parentNode) {
      var groupArray = Object.keys(this.groups);
      groupArray.sort(function (a,b) {
        return (a < b ? -1 : 1);
      });

      // this resets the elements so the order is maintained
      resetElements(this.svgElements);

      var padding = window.getComputedStyle(this.dom.frame).paddingTop;
      var iconOffset = Number(padding.replace('px',''));
      var x = iconOffset;
      var iconWidth = this.options.iconSize;
      var iconHeight = 0.75 * this.options.iconSize;
      var y = iconOffset + 0.5 * iconHeight + 3;

      this.svg.style.width = iconWidth + 5 + iconOffset + 'px';

      for (var i = 0; i < groupArray.length; i++) {
        var groupId = groupArray[i];
        if (this.groups[groupId].visible == true && (this.linegraphOptions.visibility[groupId] === undefined || this.linegraphOptions.visibility[groupId] == true)) {
          this.groups[groupId].getLegend(iconWidth, iconHeight, this.framework, x, y);
          y += iconHeight + this.options.iconSpacing;
        }
      }
    }
  };

  var UNGROUPED = '__ungrouped__'; // reserved group id for ungrouped items

  /**
   * This is the constructor of the LineGraph. It requires a Timeline body and options.
   *
   * @param {vis.Timeline.body} body
   * @param {Object} options
   * @constructor LineGraph
   * @extends Component
   */
  function LineGraph(body, options) {
    this.id = uuid.v4();
    this.body = body;

    this.defaultOptions = {
      yAxisOrientation: 'left',
      defaultGroup: 'default',
      sort: true,
      sampling: true,
      stack: false,
      graphHeight: '400px',
      shaded: {
        enabled: false,
        orientation: 'bottom' // top, bottom, zero
      },
      style: 'line', // line, bar
      barChart: {
        width: 50,
        sideBySide: false,
        align: 'center' // left, center, right
      },
      interpolation: {
        enabled: true,
        parametrization: 'centripetal', // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
        alpha: 0.5
      },
      drawPoints: {
        enabled: true,
        size: 6,
        style: 'square' // square, circle
      },
      dataAxis: {}, //Defaults are done on DataAxis level
      legend: {}, //Defaults are done on Legend level
      groups: {
        visibility: {}
      }
    };

    // options is shared by this lineGraph and all its items
    this.options = availableUtils.extend({}, this.defaultOptions);
    this.dom = {};
    this.props = {};
    this.hammer = null;
    this.groups = {};
    this.abortedGraphUpdate = false;
    this.updateSVGheight = false;
    this.updateSVGheightOnResize = false;
    this.forceGraphUpdate = true;

    var me = this;
    this.itemsData = null;    // DataSet
    this.groupsData = null;   // DataSet

    // listeners for the DataSet of the items
    this.itemListeners = {
      'add': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onAdd(params.items);
      },
      'update': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onUpdate(params.items);
      },
      'remove': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onRemove(params.items);
      }
    };

    // listeners for the DataSet of the groups
    this.groupListeners = {
      'add': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onAddGroups(params.items);
      },
      'update': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onUpdateGroups(params.items);
      },
      'remove': function (event, params, senderId) {  // eslint-disable-line no-unused-vars
        me._onRemoveGroups(params.items);
      }
    };

    this.items = {};      // object with an Item for every data item
    this.selection = [];  // list with the ids of all selected nodes
    this.lastStart = this.body.range.start;
    this.touchParams = {}; // stores properties while dragging

    this.svgElements = {};
    this.setOptions(options);
    this.groupsUsingDefaultStyles = [0];
    this.body.emitter.on('rangechanged', function () {
      me.svg.style.left = availableUtils.option.asSize(-me.props.width);

      me.forceGraphUpdate = true;
      //Is this local redraw necessary? (Core also does a change event!)
      me.redraw.call(me);
    });

    // create the HTML DOM
    this._create();
    this.framework = {svg: this.svg, svgElements: this.svgElements, options: this.options, groups: this.groups};
  }

  LineGraph.prototype = new Component();

  /**
   * Create the HTML DOM for the ItemSet
   */
  LineGraph.prototype._create = function () {
    var frame = document.createElement('div');
    frame.className = 'vis-line-graph';
    this.dom.frame = frame;

    // create svg element for graph drawing.
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.style.position = 'relative';
    this.svg.style.height = ('' + this.options.graphHeight).replace('px', '') + 'px';
    this.svg.style.display = 'block';
    frame.appendChild(this.svg);

    // data axis
    this.options.dataAxis.orientation = 'left';
    this.yAxisLeft = new DataAxis(this.body, this.options.dataAxis, this.svg, this.options.groups);

    this.options.dataAxis.orientation = 'right';
    this.yAxisRight = new DataAxis(this.body, this.options.dataAxis, this.svg, this.options.groups);
    delete this.options.dataAxis.orientation;

    // legends
    this.legendLeft = new Legend(this.body, this.options.legend, 'left', this.options.groups);
    this.legendRight = new Legend(this.body, this.options.legend, 'right', this.options.groups);

    this.show();
  };

  /**
   * set the options of the LineGraph. the mergeOptions is used for subObjects that have an enabled element.
   * @param {object} options
   */
  LineGraph.prototype.setOptions = function (options) {
    if (options) {
      var fields = ['sampling', 'defaultGroup', 'stack', 'height', 'graphHeight', 'yAxisOrientation', 'style', 'barChart', 'dataAxis', 'sort', 'groups'];
      if (options.graphHeight === undefined && options.height !== undefined) {
        this.updateSVGheight = true;
        this.updateSVGheightOnResize = true;
      }
      else if (this.body.domProps.centerContainer.height !== undefined && options.graphHeight !== undefined) {
        if (parseInt((options.graphHeight + '').replace("px", '')) < this.body.domProps.centerContainer.height) {
          this.updateSVGheight = true;
        }
      }
      availableUtils.selectiveDeepExtend(fields, this.options, options);
      availableUtils.mergeOptions(this.options, options, 'interpolation');
      availableUtils.mergeOptions(this.options, options, 'drawPoints');
      availableUtils.mergeOptions(this.options, options, 'shaded');
      availableUtils.mergeOptions(this.options, options, 'legend');

      if (options.interpolation) {
        if (typeof options.interpolation == 'object') {
          if (options.interpolation.parametrization) {
            if (options.interpolation.parametrization == 'uniform') {
              this.options.interpolation.alpha = 0;
            }
            else if (options.interpolation.parametrization == 'chordal') {
              this.options.interpolation.alpha = 1.0;
            }
            else {
              this.options.interpolation.parametrization = 'centripetal';
              this.options.interpolation.alpha = 0.5;
            }
          }
        }
      }

      if (this.yAxisLeft) {
        if (options.dataAxis !== undefined) {
          this.yAxisLeft.setOptions(this.options.dataAxis);
          this.yAxisRight.setOptions(this.options.dataAxis);
        }
      }

      if (this.legendLeft) {
        if (options.legend !== undefined) {
          this.legendLeft.setOptions(this.options.legend);
          this.legendRight.setOptions(this.options.legend);
        }
      }

      if (this.groups.hasOwnProperty(UNGROUPED)) {
        this.groups[UNGROUPED].setOptions(options);
      }
    }

    // this is used to redraw the graph if the visibility of the groups is changed.
    if (this.dom.frame) { //not on initial run?
      this.forceGraphUpdate=true;
      this.body.emitter.emit("_change",{queue: true});
    }
  };

  /**
   * Hide the component from the DOM
   */
  LineGraph.prototype.hide = function () {
    // remove the frame containing the items
    if (this.dom.frame.parentNode) {
      this.dom.frame.parentNode.removeChild(this.dom.frame);
    }
  };


  /**
   * Show the component in the DOM (when not already visible).
   */
  LineGraph.prototype.show = function () {
    // show frame containing the items
    if (!this.dom.frame.parentNode) {
      this.body.dom.center.appendChild(this.dom.frame);
    }
  };


  /**
   * Set items
   * @param {vis.DataSet | null} items
   */
  LineGraph.prototype.setItems = function (items) {
    var me = this,
      ids,
      oldItemsData = this.itemsData;

    // replace the dataset
    if (!items) {
      this.itemsData = null;
    }
    else if (esnext.isDataViewLike("id", items)) {
      this.itemsData = typeCoerceDataSet(items);
    }
    else {
      throw new TypeError('Data must implement the interface of DataSet or DataView');
    }

    if (oldItemsData) {
      // unsubscribe from old dataset
      availableUtils.forEach(this.itemListeners, function (callback, event) {
        oldItemsData.off(event, callback);
      });

      // stop maintaining a coerced version of the old data set
      oldItemsData.dispose();

      // remove all drawn items
      ids = oldItemsData.getIds();
      this._onRemove(ids);
    }

    if (this.itemsData) {
      // subscribe to new dataset
      var id = this.id;
      availableUtils.forEach(this.itemListeners, function (callback, event) {
        me.itemsData.on(event, callback, id);
      });

      // add all new items
      ids = this.itemsData.getIds();
      this._onAdd(ids);
    }
  };


  /**
   * Set groups
   * @param {vis.DataSet} groups
   */
  LineGraph.prototype.setGroups = function (groups) {
    var me = this;
    var ids;

    // unsubscribe from current dataset
    if (this.groupsData) {
      availableUtils.forEach(this.groupListeners, function (callback, event) {
        me.groupsData.off(event, callback);
      });

      // remove all drawn groups
      ids = this.groupsData.getIds();
      this.groupsData = null;
      for (var i = 0; i < ids.length; i++) {
        this._removeGroup(ids[i]);
      }
    }

    // replace the dataset
    if (!groups) {
      this.groupsData = null;
    }
    else if (esnext.isDataViewLike("id", groups)) {
      this.groupsData = groups;
    }
    else {
      throw new TypeError('Data must implement the interface of DataSet or DataView');
    }

    if (this.groupsData) {
      // subscribe to new dataset
      var id = this.id;
      availableUtils.forEach(this.groupListeners, function (callback, event) {
        me.groupsData.on(event, callback, id);
      });

      // draw all ms
      ids = this.groupsData.getIds();
      this._onAddGroups(ids);
    }
  };

  LineGraph.prototype._onUpdate = function (ids) {
    this._updateAllGroupData(ids);
  };
  LineGraph.prototype._onAdd = function (ids) {
    this._onUpdate(ids);
  };
  LineGraph.prototype._onRemove = function (ids) {
    this._onUpdate(ids);
  };
  LineGraph.prototype._onUpdateGroups = function (groupIds) {
    this._updateAllGroupData(null, groupIds);
  };
  LineGraph.prototype._onAddGroups = function (groupIds) {
    this._onUpdateGroups(groupIds);
  };

  /**
   * this cleans the group out off the legends and the dataaxis, updates the ungrouped and updates the graph
   * @param {Array} groupIds
   * @private
   */
  LineGraph.prototype._onRemoveGroups = function (groupIds) {
    for (var i = 0; i < groupIds.length; i++) {
      this._removeGroup(groupIds[i]);
    }
    this.forceGraphUpdate = true;
    this.body.emitter.emit("_change",{queue: true});
  };

  /**
   * this cleans the group out off the legends and the dataaxis
   * @param {vis.GraphGroup.id} groupId
   * @private
   */
  LineGraph.prototype._removeGroup = function (groupId) {
    if (this.groups.hasOwnProperty(groupId)) {
      if (this.groups[groupId].options.yAxisOrientation == 'right') {
        this.yAxisRight.removeGroup(groupId);
        this.legendRight.removeGroup(groupId);
        this.legendRight.redraw();
      }
      else {
        this.yAxisLeft.removeGroup(groupId);
        this.legendLeft.removeGroup(groupId);
        this.legendLeft.redraw();
      }
      delete this.groups[groupId];
    }
  };

  /**
   * update a group object with the group dataset entree
   *
   * @param {vis.GraphGroup} group
   * @param {vis.GraphGroup.id} groupId
   * @private
   */
  LineGraph.prototype._updateGroup = function (group, groupId) {
    if (!this.groups.hasOwnProperty(groupId)) {
      this.groups[groupId] = new GraphGroup(group, groupId, this.options, this.groupsUsingDefaultStyles);
      if (this.groups[groupId].options.yAxisOrientation == 'right') {
        this.yAxisRight.addGroup(groupId, this.groups[groupId]);
        this.legendRight.addGroup(groupId, this.groups[groupId]);
      }
      else {
        this.yAxisLeft.addGroup(groupId, this.groups[groupId]);
        this.legendLeft.addGroup(groupId, this.groups[groupId]);
      }
    }
    else {
      this.groups[groupId].update(group);
      if (this.groups[groupId].options.yAxisOrientation == 'right') {
        this.yAxisRight.updateGroup(groupId, this.groups[groupId]);
        this.legendRight.updateGroup(groupId, this.groups[groupId]);
        //If yAxisOrientation changed, clean out the group from the other axis.
        this.yAxisLeft.removeGroup(groupId);
        this.legendLeft.removeGroup(groupId);
      }
      else {
        this.yAxisLeft.updateGroup(groupId, this.groups[groupId]);
        this.legendLeft.updateGroup(groupId, this.groups[groupId]);
        //If yAxisOrientation changed, clean out the group from the other axis.
        this.yAxisRight.removeGroup(groupId);
        this.legendRight.removeGroup(groupId);
      }
    }
    this.legendLeft.redraw();
    this.legendRight.redraw();
  };


  /**
   * this updates all groups, it is used when there is an update the the itemset.
   *
   * @param  {Array} ids
   * @param  {Array} groupIds
   * @private
   */
  LineGraph.prototype._updateAllGroupData = function (ids, groupIds) {
    if (this.itemsData != null) {
      var groupsContent = {};
      var items = this.itemsData.get();
      var fieldId = this.itemsData.idProp;
      var idMap = {};
      if (ids){
        ids.map(function (id) {
          idMap[id] = id;
        });
      }

      //pre-Determine array sizes, for more efficient memory claim
      var groupCounts = {};
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var groupId = item.group;
        if (groupId === null || groupId === undefined) {
          groupId = UNGROUPED;
        }
        groupCounts.hasOwnProperty(groupId) ? groupCounts[groupId]++ : groupCounts[groupId] = 1;
      }

      //Pre-load arrays from existing groups if items are not changed (not in ids)
      var existingItemsMap = {};
      if (!groupIds && ids) {
        for (groupId in this.groups) {
          if (this.groups.hasOwnProperty(groupId)) {
            group = this.groups[groupId];
            var existing_items = group.getItems();

            groupsContent[groupId] = existing_items.filter(function (item) {
              existingItemsMap[item[fieldId]] = item[fieldId];
              return (item[fieldId] !== idMap[item[fieldId]]);
            });
            var newLength = groupCounts[groupId];
            groupCounts[groupId] -= groupsContent[groupId].length;
            if (groupsContent[groupId].length < newLength) {
              groupsContent[groupId][newLength - 1] = {};
            }
          }
        }
      }

      //Now insert data into the arrays.
      for (i = 0; i < items.length; i++) {
        item = items[i];
        groupId = item.group;
        if (groupId === null || groupId === undefined) {
          groupId = UNGROUPED;
        }
        if (!groupIds && ids && (item[fieldId] !== idMap[item[fieldId]]) && existingItemsMap.hasOwnProperty(item[fieldId])) {
          continue;
        }
        if (!groupsContent.hasOwnProperty(groupId)) {
          groupsContent[groupId] = new Array(groupCounts[groupId]);
        }
        //Copy data (because of unmodifiable DataView input.
        var extended = availableUtils.bridgeObject(item);
        extended.x = availableUtils.convert(item.x, 'Date');
        extended.end = availableUtils.convert(item.end, 'Date');
        extended.orginalY = item.y; //real Y
        extended.y = Number(item.y);
        extended[fieldId] = item[fieldId];

        var index= groupsContent[groupId].length - groupCounts[groupId]--;
        groupsContent[groupId][index] = extended;
      }

      //Make sure all groups are present, to allow removal of old groups
      for (groupId in this.groups){
        if (this.groups.hasOwnProperty(groupId)){
          if (!groupsContent.hasOwnProperty(groupId)) {
            groupsContent[groupId] = new Array(0);
          }
        }
      }

      //Update legendas, style and axis
      for (groupId in groupsContent) {
        if (groupsContent.hasOwnProperty(groupId)) {
          if (groupsContent[groupId].length == 0) {
            if (this.groups.hasOwnProperty(groupId)) {
              this._removeGroup(groupId);
            }
          } else {
            var group = undefined;
            if (this.groupsData != undefined) {
              group = this.groupsData.get(groupId);
            }
            if (group == undefined) {
              group = {id: groupId, content: this.options.defaultGroup + groupId};
            }
            this._updateGroup(group, groupId);
            this.groups[groupId].setItems(groupsContent[groupId]);
          }
        }
      }
      this.forceGraphUpdate = true;
      this.body.emitter.emit("_change",{queue: true});
    }
  };

  /**
   * Redraw the component, mandatory function
   * @return {boolean} Returns true if the component is resized
   */
  LineGraph.prototype.redraw = function () {
    var resized = false;

    // calculate actual size and position
    this.props.width = this.dom.frame.offsetWidth;
    this.props.height = this.body.domProps.centerContainer.height
      - this.body.domProps.border.top
      - this.body.domProps.border.bottom;

    // check if this component is resized
    resized = this._isResized() || resized;

    // check whether zoomed (in that case we need to re-stack everything)
    var visibleInterval = this.body.range.end - this.body.range.start;
    var zoomed = (visibleInterval != this.lastVisibleInterval);
    this.lastVisibleInterval = visibleInterval;


    // the svg element is three times as big as the width, this allows for fully dragging left and right
    // without reloading the graph. the controls for this are bound to events in the constructor
    if (resized == true) {
      this.svg.style.width = availableUtils.option.asSize(3 * this.props.width);
      this.svg.style.left = availableUtils.option.asSize(-this.props.width);

      // if the height of the graph is set as proportional, change the height of the svg
      if ((this.options.height + '').indexOf("%") != -1 || this.updateSVGheightOnResize == true) {
        this.updateSVGheight = true;
      }
    }

    // update the height of the graph on each redraw of the graph.
    if (this.updateSVGheight == true) {
      if (this.options.graphHeight != this.props.height + 'px') {
        this.options.graphHeight = this.props.height + 'px';
        this.svg.style.height = this.props.height + 'px';
      }
      this.updateSVGheight = false;
    }
    else {
      this.svg.style.height = ('' + this.options.graphHeight).replace('px', '') + 'px';
    }

    // zoomed is here to ensure that animations are shown correctly.
    if (resized == true || zoomed == true || this.abortedGraphUpdate == true || this.forceGraphUpdate == true) {
      resized = this._updateGraph() || resized;
      this.forceGraphUpdate = false;
      this.lastStart = this.body.range.start;
      this.svg.style.left = (-this.props.width) + 'px';
    }
    else {
      // move the whole svg while dragging
      if (this.lastStart != 0) {
        var offset = this.body.range.start - this.lastStart;
        var range = this.body.range.end - this.body.range.start;
        if (this.props.width != 0) {
          var rangePerPixelInv = this.props.width / range;
          var xOffset = offset * rangePerPixelInv;
          this.svg.style.left = (-this.props.width - xOffset) + 'px';
        }
      }
    }
    this.legendLeft.redraw();
    this.legendRight.redraw();
    return resized;
  };


  LineGraph.prototype._getSortedGroupIds = function(){
    // getting group Ids
    var grouplist = [];
    for (var groupId in this.groups) {
      if (this.groups.hasOwnProperty(groupId)) {
        var group = this.groups[groupId];
        if (group.visible == true && (this.options.groups.visibility[groupId] === undefined || this.options.groups.visibility[groupId] == true)) {
          grouplist.push({id:groupId,zIndex:group.options.zIndex});
        }
      }
    }
    availableUtils.insertSort(grouplist,function(a,b){
      var az = a.zIndex;
      var bz = b.zIndex;
      if (az === undefined) az=0;
      if (bz === undefined) bz=0;
      return az==bz? 0: (az<bz ? -1: 1);
    });
    var groupIds = new Array(grouplist.length);
    for (var i=0; i< grouplist.length; i++){
      groupIds[i] = grouplist[i].id;
    }
    return groupIds;
  };

  /**
   * Update and redraw the graph.
   *
   * @returns {boolean}
   * @private
   */
  LineGraph.prototype._updateGraph = function () {
    // reset the svg elements
    prepareElements(this.svgElements);
    if (this.props.width != 0 && this.itemsData != null) {
      var group, i;
      var groupRanges = {};
      var changeCalled = false;
      // this is the range of the SVG canvas
      var minDate = this.body.util.toGlobalTime(-this.body.domProps.root.width);
      var maxDate = this.body.util.toGlobalTime(2 * this.body.domProps.root.width);

      // getting group Ids
      var groupIds = this._getSortedGroupIds();
      if (groupIds.length > 0) {
        var groupsData = {};

        // fill groups data, this only loads the data we require based on the timewindow
        this._getRelevantData(groupIds, groupsData, minDate, maxDate);

        // apply sampling, if disabled, it will pass through this function.
        this._applySampling(groupIds, groupsData);

        // we transform the X coordinates to detect collisions
        for (i = 0; i < groupIds.length; i++) {
          this._convertXcoordinates(groupsData[groupIds[i]]);
        }

        // now all needed data has been collected we start the processing.
        this._getYRanges(groupIds, groupsData, groupRanges);

        // update the Y axis first, we use this data to draw at the correct Y points
        changeCalled = this._updateYAxis(groupIds, groupRanges);

        //  at changeCalled, abort this update cycle as the graph needs another update with new Width input from the Redraw container.
        //  Cleanup SVG elements on abort.
        if (changeCalled == true) {
          cleanupElements(this.svgElements);
          this.abortedGraphUpdate = true;
          return true;
        }
        this.abortedGraphUpdate = false;

        // With the yAxis scaled correctly, use this to get the Y values of the points.
        var below = undefined;
        for (i = 0; i < groupIds.length; i++) {
          group = this.groups[groupIds[i]];
          if (this.options.stack === true && this.options.style === 'line') {
            if (group.options.excludeFromStacking == undefined || !group.options.excludeFromStacking) {
              if (below != undefined) {
                this._stack(groupsData[group.id], groupsData[below.id]);
                if (group.options.shaded.enabled == true && group.options.shaded.orientation !== "group"){
                  if (group.options.shaded.orientation == "top" && below.options.shaded.orientation !== "group"){
                    below.options.shaded.orientation="group";
                    below.options.shaded.groupId=group.id;
                  } else {
                    group.options.shaded.orientation="group";
                    group.options.shaded.groupId=below.id;
                  }
                }
              }
              below = group;
            }
          }
          this._convertYcoordinates(groupsData[groupIds[i]], group);
        }

        //Precalculate paths and draw shading if appropriate. This will make sure the shading is always behind any lines.
        var paths = {};
        for (i = 0; i < groupIds.length; i++) {
          group = this.groups[groupIds[i]];
          if (group.options.style === 'line' && group.options.shaded.enabled == true) {
            var dataset = groupsData[groupIds[i]];
            if (dataset == null || dataset.length == 0) {
              continue;
            }
            if (!paths.hasOwnProperty(groupIds[i])) {
              paths[groupIds[i]] = Line.calcPath(dataset, group);
            }
            if (group.options.shaded.orientation === "group") {
              var subGroupId = group.options.shaded.groupId;
              if (groupIds.indexOf(subGroupId) === -1) {
                console.log(group.id + ": Unknown shading group target given:" + subGroupId);
                continue;
              }
              if (!paths.hasOwnProperty(subGroupId)) {
                paths[subGroupId] = Line.calcPath(groupsData[subGroupId], this.groups[subGroupId]);
              }
              Line.drawShading(paths[groupIds[i]], group, paths[subGroupId], this.framework);
            }
            else {
              Line.drawShading(paths[groupIds[i]], group, undefined, this.framework);
            }
          }
        }

        // draw the groups, calculating paths if still necessary.
        Bargraph.draw(groupIds, groupsData, this.framework);
        for (i = 0; i < groupIds.length; i++) {
          group = this.groups[groupIds[i]];
          if (groupsData[groupIds[i]].length > 0) {
            switch (group.options.style) {
              case "line":
                if (!paths.hasOwnProperty(groupIds[i])) {
                  paths[groupIds[i]] = Line.calcPath(groupsData[groupIds[i]], group);
                }
                Line.draw(paths[groupIds[i]], group, this.framework);
              // eslint-disable-line no-fallthrough
              case "point":
              // eslint-disable-line no-fallthrough
              case "points":
                if (group.options.style == "point" || group.options.style == "points" || group.options.drawPoints.enabled == true) {
                  Points.draw(groupsData[groupIds[i]], group, this.framework);
                }
                break;
              //do nothing...
            }
          }

        }
      }
    }

    // cleanup unused svg elements
    cleanupElements(this.svgElements);
    return false;
  };

  LineGraph.prototype._stack = function (data, subData) {
    var index, dx, dy, subPrevPoint, subNextPoint;
    index = 0;
    // for each data point we look for a matching on in the set below
    for (var j = 0; j < data.length; j++) {
      subPrevPoint = undefined;
      subNextPoint = undefined;
      // we look for time matches or a before-after point
      for (var k = index; k < subData.length; k++) {
        // if times match exactly
        if (subData[k].x === data[j].x) {
          subPrevPoint = subData[k];
          subNextPoint = subData[k];
          index = k;
          break;
        }
        else if (subData[k].x > data[j].x) { // overshoot
          subNextPoint = subData[k];
          if (k == 0) {
            subPrevPoint = subNextPoint;
          }
          else {
            subPrevPoint = subData[k - 1];
          }
          index = k;
          break;
        }
      }
      // in case the last data point has been used, we assume it stays like this.
      if (subNextPoint === undefined) {
        subPrevPoint = subData[subData.length - 1];
        subNextPoint = subData[subData.length - 1];
      }
      // linear interpolation
      dx = subNextPoint.x - subPrevPoint.x;
      dy = subNextPoint.y - subPrevPoint.y;
      if (dx == 0) {
        data[j].y = data[j].orginalY + subNextPoint.y;
      }
      else {
        data[j].y = data[j].orginalY + (dy / dx) * (data[j].x - subPrevPoint.x) + subPrevPoint.y; // ax + b where b is data[j].y
      }
    }
  };


  /**
   * first select and preprocess the data from the datasets.
   * the groups have their preselection of data, we now loop over this data to see
   * what data we need to draw. Sorted data is much faster.
   * more optimization is possible by doing the sampling before and using the binary search
   * to find the end date to determine the increment.
   *
   * @param {array}  groupIds
   * @param {object} groupsData
   * @param {date}   minDate
   * @param {date}   maxDate
   * @private
   */
  LineGraph.prototype._getRelevantData = function (groupIds, groupsData, minDate, maxDate) {
    var group, i, j, item;
    if (groupIds.length > 0) {
      for (i = 0; i < groupIds.length; i++) {
        group = this.groups[groupIds[i]];
        var itemsData = group.getItems();
        // optimization for sorted data
        if (group.options.sort == true) {
          var dateComparator = function (a, b) {
            return a.getTime() == b.getTime() ? 0 : a < b ? -1 : 1
          };
          var first = Math.max(0, availableUtils.binarySearchValue(itemsData, minDate, 'x', 'before', dateComparator));
          var last = Math.min(itemsData.length, availableUtils.binarySearchValue(itemsData, maxDate, 'x', 'after', dateComparator) + 1);
          if (last <= 0) {
            last = itemsData.length;
          }
          var dataContainer = new Array(last-first);
          for (j = first; j < last; j++) {
            item = group.itemsData[j];
            dataContainer[j-first] = item;
          }
          groupsData[groupIds[i]] = dataContainer;
        }
        else {
          // If unsorted data, all data is relevant, just returning entire structure
          groupsData[groupIds[i]] = group.itemsData;
        }
      }
    }
  };


  /**
   *
   * @param {Array.<vis.GraphGroup.id>} groupIds
   * @param {vis.DataSet} groupsData
   * @private
   */
  LineGraph.prototype._applySampling = function (groupIds, groupsData) {
    var group;
    if (groupIds.length > 0) {
      for (var i = 0; i < groupIds.length; i++) {
        group = this.groups[groupIds[i]];
        if (group.options.sampling == true) {
          var dataContainer = groupsData[groupIds[i]];
          if (dataContainer.length > 0) {
            var increment = 1;
            var amountOfPoints = dataContainer.length;

            // the global screen is used because changing the width of the yAxis may affect the increment, resulting in an endless loop
            // of width changing of the yAxis.
            //TODO: This assumes sorted data, but that's not guaranteed!
            var xDistance = this.body.util.toGlobalScreen(dataContainer[dataContainer.length - 1].x) - this.body.util.toGlobalScreen(dataContainer[0].x);
            var pointsPerPixel = amountOfPoints / xDistance;
            increment = Math.min(Math.ceil(0.2 * amountOfPoints), Math.max(1, Math.round(pointsPerPixel)));

            var sampledData = new Array(amountOfPoints);
            for (var j = 0; j < amountOfPoints; j += increment) {
              var idx = Math.round(j/increment);
              sampledData[idx]=dataContainer[j];
            }
            groupsData[groupIds[i]] = sampledData.splice(0,Math.round(amountOfPoints/increment));
          }
        }
      }
    }
  };


  /**
   *
   * @param {Array.<vis.GraphGroup.id>} groupIds
   * @param {vis.DataSet} groupsData
   * @param {object} groupRanges  | this is being filled here
   * @private
   */
  LineGraph.prototype._getYRanges = function (groupIds, groupsData, groupRanges) {
    var groupData, group, i;
    var combinedDataLeft = [];
    var combinedDataRight = [];
    var options;
    if (groupIds.length > 0) {
      for (i = 0; i < groupIds.length; i++) {
        groupData = groupsData[groupIds[i]];
        options = this.groups[groupIds[i]].options;
        if (groupData.length > 0) {
          group = this.groups[groupIds[i]];
          // if bar graphs are stacked, their range need to be handled differently and accumulated over all groups.
          if (options.stack === true && options.style === 'bar') {
            if (options.yAxisOrientation === 'left') {
              combinedDataLeft = combinedDataLeft.concat(groupData);
            }
            else {
              combinedDataRight = combinedDataRight.concat(groupData);
            }
          }
          else {
            groupRanges[groupIds[i]] = group.getYRange(groupData, groupIds[i]);
          }
        }
      }

      // if bar graphs are stacked, their range need to be handled differently and accumulated over all groups.
      Bargraph.getStackedYRange(combinedDataLeft, groupRanges, groupIds, '__barStackLeft', 'left');
      Bargraph.getStackedYRange(combinedDataRight, groupRanges, groupIds, '__barStackRight', 'right');
    }
  };


  /**
   * this sets the Y ranges for the Y axis. It also determines which of the axis should be shown or hidden.
   * @param {Array.<vis.GraphGroup.id>} groupIds
   * @param {Object} groupRanges
   * @returns {boolean} resized
   * @private
   */
  LineGraph.prototype._updateYAxis = function (groupIds, groupRanges) {
    var resized = false;
    var yAxisLeftUsed = false;
    var yAxisRightUsed = false;
    var minLeft = 1e9, minRight = 1e9, maxLeft = -1e9, maxRight = -1e9, minVal, maxVal;
    // if groups are present
    if (groupIds.length > 0) {
      // this is here to make sure that if there are no items in the axis but there are groups, that there is no infinite draw/redraw loop.
      for (var i = 0; i < groupIds.length; i++) {
        var group = this.groups[groupIds[i]];
        if (group && group.options.yAxisOrientation != 'right') {
          yAxisLeftUsed = true;
          minLeft = 1e9;
          maxLeft = -1e9;
        }
        else if (group && group.options.yAxisOrientation) {
          yAxisRightUsed = true;
          minRight = 1e9;
          maxRight = -1e9;
        }
      }

      // if there are items:
      for (i = 0; i < groupIds.length; i++) {
        if (groupRanges.hasOwnProperty(groupIds[i])) {
          if (groupRanges[groupIds[i]].ignore !== true) {
            minVal = groupRanges[groupIds[i]].min;
            maxVal = groupRanges[groupIds[i]].max;

            if (groupRanges[groupIds[i]].yAxisOrientation != 'right') {
              yAxisLeftUsed = true;
              minLeft = minLeft > minVal ? minVal : minLeft;
              maxLeft = maxLeft < maxVal ? maxVal : maxLeft;
            }
            else {
              yAxisRightUsed = true;
              minRight = minRight > minVal ? minVal : minRight;
              maxRight = maxRight < maxVal ? maxVal : maxRight;
            }
          }
        }
      }

      if (yAxisLeftUsed == true) {
        this.yAxisLeft.setRange(minLeft, maxLeft);
      }
      if (yAxisRightUsed == true) {
        this.yAxisRight.setRange(minRight, maxRight);
      }
    }
    resized = this._toggleAxisVisiblity(yAxisLeftUsed, this.yAxisLeft) || resized;
    resized = this._toggleAxisVisiblity(yAxisRightUsed, this.yAxisRight) || resized;

    if (yAxisRightUsed == true && yAxisLeftUsed == true) {
      this.yAxisLeft.drawIcons = true;
      this.yAxisRight.drawIcons = true;
    }
    else {
      this.yAxisLeft.drawIcons = false;
      this.yAxisRight.drawIcons = false;
    }
    this.yAxisRight.master = !yAxisLeftUsed;
    this.yAxisRight.masterAxis = this.yAxisLeft;

    if (this.yAxisRight.master == false) {
      if (yAxisRightUsed == true) {
        this.yAxisLeft.lineOffset = this.yAxisRight.width;
      }
      else {
        this.yAxisLeft.lineOffset = 0;
      }

      resized = this.yAxisLeft.redraw() || resized;
      resized = this.yAxisRight.redraw() || resized;
    }
    else {
      resized = this.yAxisRight.redraw() || resized;
    }

    // clean the accumulated lists
    var tempGroups = ['__barStackLeft', '__barStackRight', '__lineStackLeft', '__lineStackRight'];
    for (i = 0; i < tempGroups.length; i++) {
      if (groupIds.indexOf(tempGroups[i]) != -1) {
        groupIds.splice(groupIds.indexOf(tempGroups[i]), 1);
      }
    }

    return resized;
  };


  /**
   * This shows or hides the Y axis if needed. If there is a change, the changed event is emitted by the updateYAxis function
   *
   * @param {boolean} axisUsed
   * @param {vis.DataAxis}  axis
   * @returns {boolean}
   * @private
   */
  LineGraph.prototype._toggleAxisVisiblity = function (axisUsed, axis) {
    var changed = false;
    if (axisUsed == false) {
      if (axis.dom.frame.parentNode && axis.hidden == false) {
        axis.hide();
        changed = true;
      }
    }
    else {
      if (!axis.dom.frame.parentNode && axis.hidden == true) {
        axis.show();
        changed = true;
      }
    }
    return changed;
  };


  /**
   * This uses the DataAxis object to generate the correct X coordinate on the SVG window. It uses the
   * util function toScreen to get the x coordinate from the timestamp. It also pre-filters the data and get the minMax ranges for
   * the yAxis.
   *
   * @param {Array.<Object>} datapoints
   * @private
   */
  LineGraph.prototype._convertXcoordinates = function (datapoints) {
    var toScreen = this.body.util.toScreen;
    for (var i = 0; i < datapoints.length; i++) {
      datapoints[i].screen_x = toScreen(datapoints[i].x) + this.props.width;
      datapoints[i].screen_y = datapoints[i].y; //starting point for range calculations
      if (datapoints[i].end != undefined) {
        datapoints[i].screen_end = toScreen(datapoints[i].end) + this.props.width;
      }
      else {
        datapoints[i].screen_end = undefined;
      }
    }
  };


  /**
   * This uses the DataAxis object to generate the correct X coordinate on the SVG window. It uses the
   * util function toScreen to get the x coordinate from the timestamp. It also pre-filters the data and get the minMax ranges for
   * the yAxis.
   *
   * @param {Array.<Object>} datapoints
   * @param {vis.GraphGroup} group
   * @private
   */
  LineGraph.prototype._convertYcoordinates = function (datapoints, group) {
    var axis = this.yAxisLeft;
    var svgHeight = Number(this.svg.style.height.replace('px', ''));
    if (group.options.yAxisOrientation == 'right') {
      axis = this.yAxisRight;
    }
    for (var i = 0; i < datapoints.length; i++) {
      datapoints[i].screen_y = Math.round(axis.convertValue(datapoints[i].y));
    }
    group.setZeroPosition(Math.min(svgHeight, axis.convertValue(0)));
  };

  /**
   * This object contains all possible options. It will check if the types are correct, if required if the option is one
   * of the allowed values.
   *
   * __any__ means that the name of the property does not matter.
   * __type__ is a required field for all objects and contains the allowed types of all objects
   */
  let string = 'string';
  let bool = 'boolean';
  let number = 'number';
  let array = 'array';
  let date = 'date';
  let object = 'object'; // should only be in a __type__ property
  let dom = 'dom';
  let moment = 'moment';
  let any = 'any';


  let allOptions = {
    configure: {
      enabled: {'boolean': bool},
      filter: {'boolean': bool,'function': 'function'},
      container: {dom},
      __type__: {object,'boolean': bool,'function': 'function'}
    },

    //globals :
    alignCurrentTime: {string, 'undefined': 'undefined'},  
    yAxisOrientation: {string:['left','right']},
    defaultGroup: {string},
    sort: {'boolean': bool},
    sampling: {'boolean': bool},
    stack:{'boolean': bool},
    graphHeight: {string, number},
    shaded: {
      enabled: {'boolean': bool},
      orientation: {string:['bottom','top','zero','group']}, // top, bottom, zero, group
      groupId: {object},
      __type__: {'boolean': bool,object}
    },
    style: {string:['line','bar','points']}, // line, bar
    barChart: {
      width: {number},
      minWidth: {number},
      sideBySide: {'boolean': bool},
      align: {string:['left','center','right']},
      __type__: {object}
    },
    interpolation: {
      enabled: {'boolean': bool},
      parametrization: {string:['centripetal', 'chordal','uniform']}, // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
      alpha: {number},
      __type__: {object,'boolean': bool}
    },
    drawPoints: {
      enabled: {'boolean': bool},
      onRender: { 'function': 'function' },
      size: {number},
      style: {string:['square','circle']}, // square, circle
      __type__: {object,'boolean': bool,'function': 'function'}
    },
    dataAxis: {
      showMinorLabels: {'boolean': bool},
      showMajorLabels: {'boolean': bool},
      showWeekScale: {'boolean': bool},
      icons: {'boolean': bool},
      width: {string, number},
      visible: {'boolean': bool},
      alignZeros: {'boolean': bool},
      left:{
        range: {min:{number,'undefined': 'undefined'},max:{number,'undefined': 'undefined'},__type__: {object}},
        format: {'function': 'function'},
        title: {text:{string,number,'undefined': 'undefined'},style:{string,'undefined': 'undefined'},__type__: {object}},
        __type__: {object}
      },
      right:{
        range: {min:{number,'undefined': 'undefined'},max:{number,'undefined': 'undefined'},__type__: {object}},
        format: {'function': 'function'},
        title: {text:{string,number,'undefined': 'undefined'},style:{string,'undefined': 'undefined'},__type__: {object}},
        __type__: {object}
      },
      __type__: {object}
    },
    legend: {
      enabled: {'boolean': bool},
      icons: {'boolean': bool},
      left: {
        visible: {'boolean': bool},
        position: {string:['top-right','bottom-right','top-left','bottom-left']},
        __type__: {object}
      },
      right: {
        visible: {'boolean': bool},
        position: {string:['top-right','bottom-right','top-left','bottom-left']},
        __type__: {object}
      },
      __type__: {object,'boolean': bool}
    },
    groups: {
      visibility: {any},
      __type__: {object}
    },

    autoResize: {'boolean': bool},
    throttleRedraw: {number}, // TODO: DEPRICATED see https://github.com/almende/vis/issues/2511
    clickToUse: {'boolean': bool},
    end: {number, date, string, moment},
    format: {
      minorLabels: {
        millisecond: {string,'undefined': 'undefined'},
        second: {string,'undefined': 'undefined'},
        minute: {string,'undefined': 'undefined'},
        hour: {string,'undefined': 'undefined'},
        weekday: {string,'undefined': 'undefined'},
        day: {string,'undefined': 'undefined'},
        week: {string,'undefined': 'undefined'},
        month: {string,'undefined': 'undefined'},
        quarter: {string,'undefined': 'undefined'},
        year: {string,'undefined': 'undefined'},
        __type__: {object}
      },
      majorLabels: {
        millisecond: {string,'undefined': 'undefined'},
        second: {string,'undefined': 'undefined'},
        minute: {string,'undefined': 'undefined'},
        hour: {string,'undefined': 'undefined'},
        weekday: {string,'undefined': 'undefined'},
        day: {string,'undefined': 'undefined'},
        week: {string,'undefined': 'undefined'},
        month: {string,'undefined': 'undefined'},
        quarter: {string,'undefined': 'undefined'},
        year: {string,'undefined': 'undefined'},
        __type__: {object}
      },
      __type__: {object}
    },
    moment: {'function': 'function'},
    height: {string, number},
    hiddenDates: {
      start: {date, number, string, moment},
      end: {date, number, string, moment},
      repeat: {string},
      __type__: {object, array}
    },
    locale:{string},
    locales:{
      __any__: {any},
      __type__: {object}
    },
    max: {date, number, string, moment},
    maxHeight: {number, string},
    maxMinorChars: {number},
    min: {date, number, string, moment},
    minHeight: {number, string},
    moveable: {'boolean': bool},
    multiselect: {'boolean': bool},
    orientation: {string},
    showCurrentTime: {'boolean': bool},
    showMajorLabels: {'boolean': bool},
    showMinorLabels: {'boolean': bool},
    showWeekScale: {'boolean': bool},
    snap: {'function': 'function', 'null': 'null'},
    start: {date, number, string, moment},
    timeAxis: {
      scale: {string,'undefined': 'undefined'},
      step: {number,'undefined': 'undefined'},
      __type__: {object}
    },
    width: {string, number},
    zoomable: {'boolean': bool},
    zoomKey: {string: ['ctrlKey', 'altKey', 'metaKey', '']},
    zoomMax: {number},
    zoomMin: {number},
    zIndex: {number},
    __type__: {object}
  };

  let configureOptions = {
    global: {
      alignCurrentTime: ['none', 'year', 'month', 'quarter', 'week', 'isoWeek', 'day', 'date', 'hour', 'minute', 'second'],   
      //yAxisOrientation: ['left','right'], // TDOO: enable as soon as Grahp2d doesn't crash when changing this on the fly
      sort: true,
      sampling: true,
      stack:false,
      shaded: {
        enabled: false,
        orientation: ['zero','top','bottom','group'] // zero, top, bottom
      },
      style: ['line','bar','points'], // line, bar
      barChart: {
        width: [50,5,100,5],
        minWidth: [50,5,100,5],
        sideBySide: false,
        align: ['left','center','right'] // left, center, right
      },
      interpolation: {
        enabled: true,
        parametrization: ['centripetal','chordal','uniform'] // uniform (alpha = 0.0), chordal (alpha = 1.0), centripetal (alpha = 0.5)
      },
      drawPoints: {
        enabled: true,
        size: [6,2,30,1],
        style: ['square', 'circle'] // square, circle
      },
      dataAxis: {
        showMinorLabels: true,
        showMajorLabels: true,
        showWeekScale: false,
        icons: false,
        width: [40,0,200,1],
        visible: true,
        alignZeros: true,
        left:{
          //range: {min:'undefined': 'undefined'ined,max:'undefined': 'undefined'ined},
          //format: function (value) {return value;},
          title: {text:'',style:''}
        },
        right:{
          //range: {min:'undefined': 'undefined'ined,max:'undefined': 'undefined'ined},
          //format: function (value) {return value;},
          title: {text:'',style:''}
        }
      },
      legend: {
        enabled: false,
        icons: true,
        left: {
          visible: true,
          position: ['top-right','bottom-right','top-left','bottom-left'] // top/bottom - left,right
        },
        right: {
          visible: true,
          position: ['top-right','bottom-right','top-left','bottom-left'] // top/bottom - left,right
        }
      },

      autoResize: true,
      clickToUse: false,
      end: '',
      format: {
        minorLabels: {
          millisecond:'SSS',
          second:     's',
          minute:     'HH:mm',
          hour:       'HH:mm',
          weekday:    'ddd D',
          day:        'D',
          week:       'w',
          month:      'MMM',
          quarter:    '[Q]Q',
          year:       'YYYY'
        },
        majorLabels: {
          millisecond:'HH:mm:ss',
          second:     'D MMMM HH:mm',
          minute:     'ddd D MMMM',
          hour:       'ddd D MMMM',
          weekday:    'MMMM YYYY',
          day:        'MMMM YYYY',
          week:       'MMMM YYYY',
          month:      'YYYY',
          quarter:    'YYYY',
          year:       ''
        }
      },

      height: '',
      locale: '',
      max: '',
      maxHeight: '',
      maxMinorChars: [7, 0, 20, 1],
      min: '',
      minHeight: '',
      moveable:true,
      orientation: ['both', 'bottom', 'top'],
      showCurrentTime: false,
      showMajorLabels: true,
      showMinorLabels: true,
      showWeekScale: false,
      start: '',
      width: '100%',
      zoomable: true,
      zoomKey: ['ctrlKey', 'altKey', 'metaKey', ''],
      zoomMax: [315360000000000, 10, 315360000000000, 1],
      zoomMin: [10, 10, 315360000000000, 1],
      zIndex: 0
    }
  };

  /**
   * Create a timeline visualization
   * @param {HTMLElement} container
   * @param {vis.DataSet | Array} [items]
   * @param {vis.DataSet | Array | vis.DataView | Object} [groups]
   * @param {Object} [options]  See Graph2d.setOptions for the available options.
   * @constructor Graph2d
   * @extends Core
   */
  function Graph2d (container, items, groups, options) {
    // if the third element is options, the forth is groups (optionally);
    if (!(Array.isArray(groups) || esnext.isDataViewLike("id", groups)) && groups instanceof Object) {
      var forthArgument = options;
      options = groups;
      groups = forthArgument;
    }

    // TODO: REMOVE THIS in the next MAJOR release
    // see https://github.com/almende/vis/issues/2511
    if (options && options.throttleRedraw) {
      console.warn("Graph2d option \"throttleRedraw\" is DEPRICATED and no longer supported. It will be removed in the next MAJOR release.");
    }

    var me = this;
    this.defaultOptions = {
      start: null,
      end:   null,

      autoResize: true,

      orientation: {
        axis: 'bottom',   // axis orientation: 'bottom', 'top', or 'both'
        item: 'bottom'    // not relevant for Graph2d
      },

      moment: moment$2,

      width: null,
      height: null,
      maxHeight: null,
      minHeight: null
    };
    this.options = availableUtils.deepExtend({}, this.defaultOptions);

    // Create the DOM, props, and emitter
    this._create(container);

    // all components listed here will be repainted automatically
    this.components = [];

    this.body = {
      dom: this.dom,
      domProps: this.props,
      emitter: {
        on: this.on.bind(this),
        off: this.off.bind(this),
        emit: this.emit.bind(this)
      },
      hiddenDates: [],
      util: {
        getScale() {
          return me.timeAxis.step.scale;
        },
        getStep() {
          return me.timeAxis.step.step;
        },

        toScreen: me._toScreen.bind(me),
        toGlobalScreen: me._toGlobalScreen.bind(me), // this refers to the root.width
        toTime: me._toTime.bind(me),
        toGlobalTime : me._toGlobalTime.bind(me)
      }
    };

    // range
    this.range = new Range(this.body);
    this.components.push(this.range);
    this.body.range = this.range;

    // time axis
    this.timeAxis = new TimeAxis(this.body);
    this.components.push(this.timeAxis);
    //this.body.util.snap = this.timeAxis.snap.bind(this.timeAxis);

    // current time bar
    this.currentTime = new CurrentTime(this.body);
    this.components.push(this.currentTime);

    // item set
    this.linegraph = new LineGraph(this.body);

    this.components.push(this.linegraph);

    this.itemsData = null;      // DataSet
    this.groupsData = null;     // DataSet


    this.on('tap', function (event) {
      me.emit('click', me.getEventProperties(event));
    });
    this.on('doubletap', function (event) {
      me.emit('doubleClick', me.getEventProperties(event));
    });
    this.dom.root.oncontextmenu = function (event) {
      me.emit('contextmenu', me.getEventProperties(event));
    };
    
    //Single time autoscale/fit
    this.initialFitDone = false;
    this.on('changed', function (){
      if (me.itemsData == null) return;
      if (!me.initialFitDone && !me.options.rollingMode) {
        me.initialFitDone = true;
        if (me.options.start != undefined || me.options.end != undefined) {
          if (me.options.start == undefined || me.options.end == undefined) {
            var range = me.getItemRange();
          }

          var start = me.options.start != undefined ? me.options.start : range.min;
          var end   = me.options.end   != undefined ? me.options.end   : range.max;
          me.setWindow(start, end, {animation: false});
        } else {
          me.fit({animation: false});
        }
      }

      if (!me.initialDrawDone && (me.initialRangeChangeDone || (!me.options.start && !me.options.end) 
        || me.options.rollingMode)) {
        me.initialDrawDone = true;
        me.dom.root.style.visibility = 'visible';
        me.dom.loadingScreen.parentNode.removeChild(me.dom.loadingScreen);
        if (me.options.onInitialDrawComplete) {
          setTimeout(() => {
            return me.options.onInitialDrawComplete();
          }, 0);
        }
      }
    });
    
    // apply options
    if (options) {
      this.setOptions(options);
    }

    // IMPORTANT: THIS HAPPENS BEFORE SET ITEMS!
    if (groups) {
      this.setGroups(groups);
    }

    // create itemset
    if (items) {
      this.setItems(items);
    }

    // draw for the first time
    this._redraw();
  }

  // Extend the functionality from Core
  Graph2d.prototype = new Core();

  Graph2d.prototype.setOptions = function (options) {
    // validate options
    let errorFound = Validator.validate(options, allOptions);
    if (errorFound === true) {
      console.log('%cErrors have been found in the supplied options object.', printStyle);
    }

    Core.prototype.setOptions.call(this, options);
  };

  /**
   * Set items
   * @param {vis.DataSet | Array | null} items
   */
  Graph2d.prototype.setItems = function(items) {
    var initialLoad = (this.itemsData == null);

    // convert to type DataSet when needed
    var newDataSet;
    if (!items) {
      newDataSet = null;
    }
    else if (esnext.isDataViewLike("id", items)) {
      newDataSet = typeCoerceDataSet(items);
    }
    else {
      // turn an array into a dataset
      newDataSet = typeCoerceDataSet(new esnext.DataSet(items));
    }

    // set items
    if (this.itemsData) {
      // stop maintaining a coerced version of the old data set
      this.itemsData.dispose();
    }
    this.itemsData = newDataSet;
    this.linegraph && this.linegraph.setItems(newDataSet != null ? newDataSet.rawDS : null);

    if (initialLoad) {
      if (this.options.start != undefined || this.options.end != undefined) {
        var start = this.options.start != undefined ? this.options.start : null;
        var end   = this.options.end != undefined   ? this.options.end : null;
        this.setWindow(start, end, {animation: false});
      }
      else {
        this.fit({animation: false});
      }
    }
  };

  /**
   * Set groups
   * @param {vis.DataSet | Array} groups
   */
  Graph2d.prototype.setGroups = function(groups) {
    // convert to type DataSet when needed
    var newDataSet;
    if (!groups) {
      newDataSet = null;
    }
    else if (esnext.isDataViewLike("id", groups)) {
      newDataSet = groups;
    }
    else {
      // turn an array into a dataset
      newDataSet = new esnext.DataSet(groups);
    }

    this.groupsData = newDataSet;
    this.linegraph.setGroups(newDataSet);
  };

  /**
   * Returns an object containing an SVG element with the icon of the group (size determined by iconWidth and iconHeight), the label of the group (content) and the yAxisOrientation of the group (left or right).
   * @param {vis.GraphGroup.id} groupId
   * @param {number} width
   * @param {number} height
   * @returns {{icon: SVGElement, label: string, orientation: string}|string}
   */
  Graph2d.prototype.getLegend = function(groupId, width, height) {
    if (width  === undefined) {width  = 15;}
    if (height === undefined) {height = 15;}
    if (this.linegraph.groups[groupId] !== undefined) {
      return this.linegraph.groups[groupId].getLegend(width,height);
    }
    else {
      return "cannot find group:'" +  groupId + "'";
    }
  };

  /**
   * This checks if the visible option of the supplied group (by ID) is true or false.
   * @param {vis.GraphGroup.id} groupId
   * @returns {boolean}
   */
  Graph2d.prototype.isGroupVisible = function(groupId) {
    if (this.linegraph.groups[groupId] !== undefined) {
      return (this.linegraph.groups[groupId].visible && (this.linegraph.options.groups.visibility[groupId] === undefined || this.linegraph.options.groups.visibility[groupId] == true));
    }
    else {
      return false;
    }
  };


  /**
   * Get the data range of the item set.
   * @returns {{min: Date, max: Date}} range  A range with a start and end Date.
   *                                          When no minimum is found, min==null
   *                                          When no maximum is found, max==null
   */
  Graph2d.prototype.getDataRange = function() {
    var min = null;
    var max = null;

    // calculate min from start filed
    for (var groupId in this.linegraph.groups) {
      if (this.linegraph.groups.hasOwnProperty(groupId)) {
        if (this.linegraph.groups[groupId].visible == true) {
          for (var i = 0; i < this.linegraph.groups[groupId].itemsData.length; i++) {
            var item = this.linegraph.groups[groupId].itemsData[i];
            var value = availableUtils.convert(item.x, 'Date').valueOf();
            min = min == null ? value : min > value ? value : min;
            max = max == null ? value : max < value ? value : max;
          }
        }
      }
    }

    return {
      min: (min != null) ? new Date(min) : null,
      max: (max != null) ? new Date(max) : null
    };
  };


  /**
   * Generate Timeline related information from an event
   * @param {Event} event
   * @return {Object} An object with related information, like on which area
   *                  The event happened, whether clicked on an item, etc.
   */
  Graph2d.prototype.getEventProperties = function (event) {
    var clientX = event.center ? event.center.x : event.clientX;
    var clientY = event.center ? event.center.y : event.clientY;
    var x = clientX - availableUtils.getAbsoluteLeft(this.dom.centerContainer);
    var y = clientY - availableUtils.getAbsoluteTop(this.dom.centerContainer);
    var time = this._toTime(x);

    var customTime = CustomTime.customTimeFromTarget(event);

    var element = availableUtils.getTarget(event);
    var what = null;
    if (availableUtils.hasParent(element, this.timeAxis.dom.foreground))              {what = 'axis';}
    else if (this.timeAxis2 && availableUtils.hasParent(element, this.timeAxis2.dom.foreground)) {what = 'axis';}
    else if (availableUtils.hasParent(element, this.linegraph.yAxisLeft.dom.frame))   {what = 'data-axis';}
    else if (availableUtils.hasParent(element, this.linegraph.yAxisRight.dom.frame))  {what = 'data-axis';}
    else if (availableUtils.hasParent(element, this.linegraph.legendLeft.dom.frame))  {what = 'legend';}
    else if (availableUtils.hasParent(element, this.linegraph.legendRight.dom.frame)) {what = 'legend';}
    else if (customTime != null)                {what = 'custom-time';}
    else if (availableUtils.hasParent(element, this.currentTime.bar))                 {what = 'current-time';}
    else if (availableUtils.hasParent(element, this.dom.center))                      {what = 'background';}

    var value = [];
    var yAxisLeft = this.linegraph.yAxisLeft;
    var yAxisRight = this.linegraph.yAxisRight;
    if (!yAxisLeft.hidden && this.itemsData.length > 0) {
      value.push(yAxisLeft.screenToValue(y));
    }
    if (!yAxisRight.hidden && this.itemsData.length > 0) {
      value.push(yAxisRight.screenToValue(y));
    }

    return {
      event: event,
      customTime: customTime ? customTime.options.id : null,
      what: what,
      pageX: event.srcEvent ? event.srcEvent.pageX : event.pageX,
      pageY: event.srcEvent ? event.srcEvent.pageY : event.pageY,
      x: x,
      y: y,
      time: time,
      value: value
    }
  };

  /**
   * Load a configurator
   * @return {Object}
   * @private
   */
  Graph2d.prototype._createConfigurator = function () {
    return new Configurator(this, this.dom.container, configureOptions);
  };

  // Locales have to be supplied by the user.
  const defaultLanguage = getNavigatorLanguage();
  moment__default['default'].locale(defaultLanguage);

  const timeline = {
    Core,
    DateUtil,
    Range,
    stack: stack$1,
    TimeStep,

    components: {
      items: {
        Item,
        BackgroundItem,
        BoxItem,
        ClusterItem,
        PointItem,
        RangeItem
      },

      BackgroundGroup,
      Component,
      CurrentTime,
      CustomTime,
      DataAxis,
      DataScale,
      GraphGroup,
      Group,
      ItemSet,
      Legend,
      LineGraph,
      TimeAxis
    }
  };

  exports.Graph2d = Graph2d;
  exports.Timeline = Timeline;
  exports.timeline = timeline;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=vis-timeline-graph2d.js.map
