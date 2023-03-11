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
  if (!date) {
    return NaN;
  }

  // check if input is a Date object
  if (Object.prototype.toString.call(date) !== '[object Date]') {
    return NaN;
  }

  var start = new Date(date.getFullYear(), 0, 0);
  var diff = (date - start) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  return day;
}

module.exports = {
  getDayOfYear,
};
