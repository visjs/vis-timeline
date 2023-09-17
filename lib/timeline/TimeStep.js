
import * as DateUtil  from './DateUtil';
import util from '../util';
import {DateTime} from "luxon";
import {getLuxonDateTime} from "./DateUtil";

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
    this.dateTime = (options);
    this.timezone = (options && options.timezone) || "utc";
    this.options = options ? options : {};

    // variables
    this.current = DateTime.now().setZone(this.timezone);
    this._start = DateTime.now().setZone(this.timezone);
    this._end = DateTime.now().setZone(this.timezone);

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
    else if (hiddenDates !== undefined) {
      this.hiddenDates = [hiddenDates];
    }
    else {
      this.hiddenDates = [];
    }

    this.format = TimeStep.FORMAT; // default formatting
  }

  // /**
  //  * Set custom constructor function for moment. Can be used to set dates
  //  * to UTC or to set a utcOffset.
  //  * @param {function} moment
  //  */
  // setMoment(moment) {
  //   this.moment = moment;
  //
  //   // update the date properties, can have a new utcOffset
  //   this.current = this.moment(this.current.valueOf());
  //   this._start = this.moment(this._start.valueOf());
  //   this._end = this.moment(this._end.valueOf());
  // }

  /**
   * Set custom constructor function for DateTime. Can be used to set dates
   * to UTC or to set a utcOffset.
   * @param {String} timezone
   */
  setDateTime(timezone) {
    // this.dateTime = new DateTime().setZone(timezone);

    // update the date properties, can have a new utcOffset
    this.current = getLuxonDateTime(this.current, timezone);
    this._start = getLuxonDateTime(this._start, timezone);
    this._end = getLuxonDateTime(this._end, timezone);
  }

  /**
   * Set custom formatting for the minor an major labels of the TimeStep.
   * Both `minorLabels` and `majorLabels` are an Object with properties:
   * 'millisecond', 'second', 'minute', 'hour', 'weekday', 'day', 'week', 'month', 'year'.
   * @param {{minorLabels: Object, majorLabels: Object}} format
   */
  setFormat(format) {
    const defaultFormat = util.deepExtend({}, TimeStep.FORMAT);
    this.format = util.deepExtend(defaultFormat, format);
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

    this._start = getLuxonDateTime(start, this.timezone);
    this._end = getLuxonDateTime(end, this.timezone);

    if (this.autoScale) {
      this.setMinimumStep(minimumStep);
    }
  }

  /**
   * Set the range iterator to the start date.
   */
  start() {
    this.current = new DateTime(this._start);
    this.roundToMinor();
  }

  /**
   * Round the current date to the first minor date value
   * This must be executed once when the current date is set to start Date
   */
  roundToMinor() {
    let newCurrent = new DateTime(this.current);
    // round to floor
    // to prevent year & month scales rounding down to the first day of week we perform this separately
    if (this.scale === 'week') {
      newCurrent = newCurrent.set({weekday: 1});
    }
    // IMPORTANT: we have no breaks in this switch! (this is no bug)
    // noinspection FallThroughInSwitchStatementJS
    switch (this.scale) {
      case 'year':
        newCurrent = newCurrent.set({year: this.step * Math.floor(this.current.year / this.step)});
        newCurrent = newCurrent.set({month: 0});                            // eslint-disable-line no-fallthrough
      case 'month':        newCurrent = newCurrent.set({day: 1});          // eslint-disable-line no-fallthrough
      case 'week':                                                         // eslint-disable-line no-fallthrough
      case 'day':                                                          // eslint-disable-line no-fallthrough
      case 'weekday':      newCurrent = newCurrent.set({hour: 0});         // eslint-disable-line no-fallthrough
      case 'hour':         newCurrent = newCurrent.set({minute: 0});       // eslint-disable-line no-fallthrough
      case 'minute':       newCurrent = newCurrent.set({second: 0});       // eslint-disable-line no-fallthrough
      case 'second':       newCurrent = newCurrent.set({millisecond: 0});  // eslint-disable-line no-fallthrough
      //case 'millisecond': // nothing to do for milliseconds
    }

    if (this.step !== 1) {
      // round down to the first minor value that is a multiple of the current step size
      let  priorCurrent = new DateTime(newCurrent);
      switch (this.scale) {        
        case 'millisecond':  newCurrent = newCurrent.minus({milliseconds: this.current.millisecond % this.step});  break;
        case 'second':       newCurrent = newCurrent.minus({seconds: this.current.second % this.step}); break;
        case 'minute':       newCurrent = newCurrent.minus({minutes: this.current.minute % this.step}); break;
        case 'hour':         newCurrent = newCurrent.minus({hours: this.current.hour % this.step}); break;
        case 'weekday':      // intentional fall through
        case 'day':          newCurrent = newCurrent.minus({days: (this.current.day - 1) % this.step}); break;
        case 'week':         newCurrent = newCurrent.minus({weeks: this.current.weekNumber % this.step}); break;
        case 'month':        newCurrent = newCurrent.minus({months: this.current.month % this.step});  break;
        case 'year':         newCurrent = newCurrent.minus({years: this.current.year % this.step}); break;
        default: break;
      }
      if (!priorCurrent.equals(newCurrent)) {
          this.current = getLuxonDateTime(DateUtil.snapAwayFromHidden(this.hiddenDates, newCurrent.toJSDate(), -1, true), this.timezone);
      } else {
        this.current = newCurrent;
      }
    } else {
      this.current = newCurrent;
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
    const prev = new DateTime(this.current);
    // Two cases, needed to prevent issues with switching daylight savings
    // (end of March and end of October)
    switch (this.scale) {
      case 'millisecond':
        this.current = prev.plus({milliseconds: this.step});
        break;
      case 'second':
        this.current = prev.plus({second: this.step});
        break;
      case 'minute':
        this.current = prev.plus({minute: this.step});
        break;
      case 'hour':
        this.current = prev.plus({hours: this.step});

        if (this.current.month < 6) {
          this.current = prev.minus({hours: this.current.hour % this.step});
        } else {
          if (this.current.hour % this.step !== 0) {
            this.current = prev.plus({hour: this.step - this.current.hour % this.step});
          }
        }
        break;
      case 'weekday':      // intentional fall through
      case 'day':
        this.current = prev.plus({days: this.step});
        break;
      case 'week':
        /* if (this.current.weekday() !== 0){ // we had a month break not correlating with a week's start before
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
        } */
        //show all days in weeks
        this.current = prev.plus({days: this.step});
        break;
      case 'month':
        this.current = prev.plus({months: this.step});
        break;
      case 'year':
        this.current = prev.plus({years: this.step});
        break;
      default:
        break;
    }

    if (this.step !== 1) {
      let newCurrent = new DateTime(this.current);
      // round down to the correct major value
      switch (this.scale) {
        case 'millisecond':
          if (this.current.millisecond > 0 && this.current.millisecond < this.step) newCurrent = newCurrent.set({millisecond: 0});
          break;
        case 'second':
          if (this.current.second > 0 && this.current.second < this.step) newCurrent = newCurrent.set({second: 0});
          break;
        case 'minute':
          if (this.current.minute > 0 && this.current.minute < this.step) newCurrent = newCurrent.set({minute: 0});
          break;
        case 'hour':
          if (this.current.hour > 0 && this.current.hour < this.step) newCurrent = newCurrent.set({hour: 0});
          break;
        case 'weekday':      // intentional fall through
        case 'day':
          if (this.current.day < this.step + 1) newCurrent = newCurrent.set({day: 1});
          break;
        case 'week':
          if (this.current.weekNumber < this.step) newCurrent = newCurrent.set({week: 1});
          break; // week numbering starts at 1, not 0
        case 'month':
          if (this.current.month < this.step) newCurrent = newCurrent.set({month: 0});
          break;
        case 'year':
          break; // nothing to do for year
        default:
          break;
      }
      this.current = newCurrent;
    }

    // safety mechanism: if current time is still unchanged, move to the end
    if (this.current.equals(prev)) {
      this.current = new DateTime(this._end);
    }

    // Reset switches for year, month and day. Will get set to true where appropriate in DateUtil.stepOverHiddenDates
    this.switchedDay = false;
    this.switchedMonth = false;
    this.switchedYear = false;

    DateUtil.stepOverHiddenDates(this, prev, this.timezone);
  }

  /**
   * Get the current datetime
   * @return {DateTime}  current The current date
   */
  getCurrent() {
    return new DateTime(this.current);
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
    if (minimumStep === undefined) {
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
    let clone = new DateTime(date);

    if (scale === 'year') {
      const year = clone.year + Math.round(clone.month / 12);
      clone = clone.set({year: Math.round(year / step) * step});
      clone = clone.set({month: 0});
      clone = clone.set({day: 0});
      clone = clone.set({hour: 0});
      clone = clone.set({minute: 0});
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'month') {
      /* if (clone.date() > 15) {
        clone.date(1);
        clone.add(1, 'month');
        // important: first set Date to 1, after that change the month.
      }
      else {
        clone.date(1);
      } */
      //every day in month
      clone = clone.set({hour: 0});
      clone = clone.set({minute: 0});
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'week') {
        /* if (clone.weekday() > 2) { // doing it the momentjs locale aware way
            clone.weekday(0);
            clone.add(1, 'week');
        }
        else {
            clone.weekday(0);
        }

        clone.hours(0);
        clone.minutes(0);
        clone.seconds(0);
        clone.milliseconds(0); */
        //every hours in days. + showing all days in week
      clone = clone.set({hour: Math.round(clone.hour)});
      clone = clone.set({minute: 0});
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'day') {
      //noinspection FallthroughInSwitchStatementJS
      switch (step) {
        case 5:
        case 2:
          clone = clone.set({hour: Math.round(clone.hour / 24) * 24}); break;
        default:
          clone = clone.set({hour: Math.round(clone.hour / 12) * 12}); break;
      }
      clone = clone.set({minute: 0});
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'weekday') {
      //noinspection FallthroughInSwitchStatementJS
      switch (step) {
        case 5:
        case 2:
          clone = clone.set({hour: Math.round(clone.hour / 12) * 12}); break;
        default:
          clone = clone.set({hour: Math.round(clone.hour / 6) * 6}); break;
      }
      clone = clone.set({minute: 0});
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'hour') {
      switch (step) {
        case 4:
          clone = clone.set({minute: Math.round(clone.minute / 60) * 60}); break;
        default:
          clone = clone.set({minute: Math.round(clone.minute / 30) * 30}); break;
      }
      clone = clone.set({second: 0});
      clone = clone.set({millisecond: 0});
    } else if (scale === 'minute') {
      //noinspection FallthroughInSwitchStatementJS
      switch (step) {
        case 15:
        case 10:
          clone = clone.set({minute: Math.round(clone.minute / 5) * 5});
          clone = clone.set({second: 0});
          break;
        case 5:
          clone = clone.set({second: Math.round(clone.second / 60) * 60}); break;
        default:
          clone = clone.set({second: Math.round(clone.second / 30) * 30}); break;
      }
      clone = clone.set({millisecond: 0});
    }
    else if (scale === 'second') {
      //noinspection FallthroughInSwitchStatementJS
      switch (step) {
        case 15:
        case 10:
          clone = clone.set({second: Math.round(clone.second / 5) * 5});
          clone = clone.set({millisecond: 0});
          break;
        case 5:
          clone = clone.set({millisecond: Math.round(clone.millisecond / 1000) * 1000}); break;
        default:
          clone = clone.set({millisecond: Math.round(clone.millisecond / 500) * 500}); break;
      }
    }
    else if (scale === 'millisecond') {
      const _step = step > 5 ? step / 2 : 1;
      clone = clone.set({millisecond: Math.round(clone.millisecond / _step) * _step});
    }

    return clone;
  }

  /**
   * Check if the current value is a major value (for example when the step
   * is DAY, a major value is each first day of the MONTH)
   * @return {boolean} true if current date is major, else false.
   */
  isMajor() {
    if (this.switchedYear === true) {
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
    else if (this.switchedMonth === true) {
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
    else if (this.switchedDay === true) {
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

    const date = new DateTime(this.current);
    switch (this.scale) {
      case 'millisecond':
        return (date.millisecond === 0);
      case 'second':
        return (date.second === 0);
      case 'minute':
        return (date.hour === 0) && (date.minute === 0);
      case 'hour':
        return (date.hour === 0);
      case 'weekday': // intentional fall through
      case 'day':
        return this.options.showWeekScale ? (date.weekday === 1) : (date.day === 1);
      case 'week':
        return (date.day === 1);
      case 'month':
        return (date.month === 0);
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
    let luxonDateTime;

    if (date === undefined) {
      luxonDateTime = new DateTime(this.current);
    }
    if (date instanceof Date) {
      luxonDateTime = new DateTime(date)
    } else {
      luxonDateTime = getLuxonDateTime(date, this.timezone)
    }

    if (typeof(this.format.minorLabels) === "function") {
      return this.format.minorLabels(luxonDateTime, this.scale, this.step);
    }

    const format = this.format.minorLabels[this.scale];
    // noinspection FallThroughInSwitchStatementJS
    switch (this.scale) {
      case 'week':
        // Don't draw the minor label if this date is the first day of a month AND if it's NOT the start of the week.
        // The 'date' variable may actually be the 'next' step when called from TimeAxis' _repaintLabels.
        if(luxonDateTime.weekday !== 1){
            return "";
        }
      default: // eslint-disable-line no-fallthrough
        return (format && format.length > 0) ? luxonDateTime.toFormat(format) : '';
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
    let luxonDateTime;

    if (date === undefined) {
      luxonDateTime = new DateTime(this.current);
    }
    if (date instanceof Date) {
      luxonDateTime = new DateTime(date)
    } else {
      luxonDateTime = getLuxonDateTime(date, this.timezone)
    }

    if (typeof(this.format.majorLabels) === "function") {
      return this.format.majorLabels(luxonDateTime, this.scale, this.step);
    }

    const format = this.format.majorLabels[this.scale];
    return (format && format.length > 0) ? luxonDateTime.toFormat(format) : '';
  }

  /**
   * get class name
   * @return {string} class name
   */
  getClassName() {
    const current = new DateTime(this.current)
    const step = this.step;
    const classNames = [];

    /**
     *
     * @param {number} value
     * @returns {String}
     */
    function even(value) {
      return (value / step % 2 === 0) ? ' vis-even' : ' vis-odd';
    }

    /**
     *
     * @param {DateTime} date
     * @returns {String}
     */
    function today(date, timezone) {
      if (date.day === DateTime.now().setZone(timezone).day) {
        return ' vis-today';
      }
      if (date.day === DateTime.now().setZone(timezone).day + 1) {
        return ' vis-tomorrow';
      }
      if (date.day === DateTime.now().setZone(timezone).day - 1) {
        return ' vis-yesterday';
      }
      return '';
    }

    /**
     *
     * @param {DateTime} date
     * @returns {String}
     */
    function currentWeek(date, timezone) {
      return date.weekNumber === DateTime.now().setZone(timezone).weekNumber ? ' vis-current-week' : '';
    }

    /**
     *
     * @param {DateTime} date
     * @returns {String}
     */
    function currentMonth(date, timezone) {
      return date.month === DateTime.now().setZone(timezone).month ? ' vis-current-month' : '';
    }

    /**
     *
     * @param {DateTime} date
     * @returns {String}
     */
    function currentYear(date, timezone) {
      return date.year === DateTime.now().setZone(timezone).year ? ' vis-current-year' : '';
    }

    switch (this.scale) {
      case 'millisecond':
        classNames.push(today(current, this.timezone));
        classNames.push(even(current.millisecond));
        break;
      case 'second':
        classNames.push(today(current, this.timezone));
        classNames.push(even(current.second));
        break;
      case 'minute':
        classNames.push(today(current, this.timezone));
        classNames.push(even(current.minute));
        break;
      case 'hour':
        classNames.push(`vis-h${current.hour}${this.step === 4 ? '-h' + (current.hour + 4) : ''}`);
        classNames.push(today(current, this.timezone));
        classNames.push(even(current.hour));
        break;
      case 'weekday':
        classNames.push(`vis-${current.toFormat('cccc').toLowerCase()}`);
        classNames.push(today(current, this.timezone));
        classNames.push(currentWeek(current, this.timezone));
        classNames.push(even(current.day));
        break;
      case 'day':
        classNames.push(`vis-day${current.day}`);
        classNames.push(`vis-${current.toFormat('MMMM').toLowerCase()}`);
        classNames.push(today(current, this.timezone));
        classNames.push(currentMonth(current, this.timezone));
        classNames.push(this.step <= 2 ? today(current, this.timezone) : '');
        classNames.push(this.step <= 2 ? `vis-${current.toFormat('cccc').toLowerCase()}` : '');
        classNames.push(even(current.day - 1));
        break;
      case 'week':
        classNames.push(`vis-week${current.toFormat('W')}`);
        classNames.push(currentWeek(current, this.timezone));
        classNames.push(even(current.weekNumber));
        break;
      case 'month':
        classNames.push(`vis-${current.toFormat('MMMM').toLowerCase()}`);
        classNames.push(currentMonth(current, this.timezone));
        classNames.push(even(current.month));
        break;
      case 'year':
        classNames.push(`vis-year${current.year}`);
        classNames.push(currentYear(current, this.timezone));
        classNames.push(even(current.year));
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
    weekday:    'ccc d',
    day:        'd',
    week:       'W',
    month:      'MMM',
    year:       'yyyy'
  },
  majorLabels: {
    millisecond:'HH:mm:ss',
    second:     'd MMMM HH:mm',
    minute:     'ccc d MMMM',
    hour:       'ccc d MMMM',
    weekday:    'MMMM yyyy',
    day:        'MMMM yyyy',
    week:       'MMMM yyyy',
    month:      'yyyy',
    year:       ''
  }
};

export default TimeStep;
