/**
 * Returns the day of the year for a given date.
 *
 * @see https://momentjs.com/docs/#/get-set/day-of-year/
 * @see https://github.com/you-dont-need/You-Dont-Need-Momentjs#day-of-year
 * @see https://stackoverflow.com/a/8619946/722162
 *
 * @param {Date} date
 * @returns {number} 1-366
 */
function getDayOfYear(date) {
  if (!date) return NaN;

  // check if input is a Date object
  if (Object.prototype.toString.call(date) !== "[object Date]") return NaN;

  var start = new Date(date.getFullYear(), 0, 0);
  var offset = start.getTimezoneOffset() - date.getTimezoneOffset();
  var diff = date - start + offset * 60 * 1000;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  return day;
}

/**
 * Sets the given date to the given day of the year.
 *
 * @see https://momentjs.com/docs/#/get-set/day-of-year/
 * @see https://stackoverflow.com/a/4049020/722162
 *
 * @param {Date} date
 * @param {number} dayOfYear 1-366
 * @returns {Date} the same date object that was provided in 'date'
 */
function setDayOfYear(date, dayOfYear) {
  if (
    date === 0 ||
    date === null ||
    date === undefined ||
    Object.prototype.toString.call(date) !== "[object Date]" ||
    date.toString && date.toString() === 'Invalid Date'
  ) {
    throw new Error("Invalid date value");
  }

  if (dayOfYear < 1 || dayOfYear > 366) {
    throw new RangeError(
      `dayOfYear must between 1 and 366, was "${dayOfYear}"`
    );
  }

  date.setMonth(0);
  date.setDate(dayOfYear);
  return date;
}

/**
 * Adds the given amount of time to the given date.
 * 
 * @see https://momentjs.com/docs/#/durations/add/
 * 
 * @param {Date} date 
 * @param {number} amount 
 * @param {String} unitString 
 * @returns {Date} the same date object that was provided in 'date'
 */
function add(date, amount, unitString) {
  let unit = unitString.toLowerCase();
  if (unit.endsWith('s')) unit = unit.slice(0, -1);

  switch (unit) {
    case 'year':
      date.setFullYear(date.getFullYear() + amount);
      break;
    case 'month':
      date.setMonth(date.getMonth() + amount);
      break;
    case 'week':
      date.setDate(date.getDate() + amount * 7);
      break;
    case 'day':
      date.setDate(date.getDate() + amount);
      break;
    case 'hour':
      date.setHours(date.getHours() + amount);
      break;
    case 'minute':
      date.setMinutes(date.getMinutes() + amount);
      break;
    case 'second':
      date.setSeconds(date.getSeconds() + amount);
      break;
    case 'millisecond':
      date.setMilliseconds(date.getMilliseconds() + amount);
      break;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }

  return date;
}

/**
 * Adds the given amount of time to the given date.
 * 
 * @see https://momentjs.com/docs/#/durations/subtract/
 * 
 * @param {Date} date 
 * @param {number} amount 
 * @param {String} unitString 
 * @returns {Date} the same date object that was provided in 'date'
 */
function subtract(date, amount, unitString) {
  let unit = unitString.toLowerCase();
  if (unit.endsWith('s')) unit = unit.slice(0, -1);

  switch (unit) {
    case 'year':
      date.setFullYear(date.getFullYear() - amount);
      break;
    case 'month':
      date.setMonth(date.getMonth() - amount);
      break;
    case 'week':
      date.setDate(date.getDate() - amount * 7);
      break;
    case 'day':
      date.setDate(date.getDate() - amount);
      break;
    case 'hour':
      date.setHours(date.getHours() - amount);
      break;
    case 'minute':
      date.setMinutes(date.getMinutes() - amount);
      break;
    case 'second':
      date.setSeconds(date.getSeconds() - amount);
      break;
    case 'millisecond':
      date.setMilliseconds(date.getMilliseconds() - amount);
      break;
    default:
      throw new Error(`Unknown unit: ${unit}`);
  }

  return date;
}

/**
 * Clone a date.
 * 
 * @param {Date} date 
 * @returns {Date} a new date object
 */
function clone(date) {
  if (
    date === 0 ||
    date === null ||
    date === undefined ||
    Object.prototype.toString.call(date) !== "[object Date]" ||
    date.toString && date.toString() === 'Invalid Date'
  ) {
    return new Date(date);
  }

  return new Date(date.getTime());
}

module.exports = {
  getDayOfYear,
  setDayOfYear,
  add,
  subtract,
  clone
};
