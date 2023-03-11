
/**
 * used in Core to convert the options into a volatile variable
 * 
 * @param {Object} body
 * @param {Array | Object} hiddenDates
 * @returns {number}
 */
export function convertHiddenOptions(body, hiddenDates) {
  if (hiddenDates && !Array.isArray(hiddenDates)) {
    return convertHiddenOptions(body, [hiddenDates])
  }

  body.hiddenDates = [];
  if (hiddenDates) {
    if (Array.isArray(hiddenDates) == true) {
      for (let i = 0; i < hiddenDates.length; i++) {
        if (hiddenDates[i].repeat === undefined) {
          const dateItem = {};
          dateItem.start = Date(hiddenDates[i].start).valueOf();
          dateItem.end = Date(hiddenDates[i].end).valueOf();
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
export function updateHiddenDates(moment, body, hiddenDates) {
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
export function removeDuplicates(body) {
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
 * Returns the day of the year for a given date.
 * @see https://momentjs.com/docs/#/get-set/day-of-year/
 * @see https://github.com/you-dont-need/You-Dont-Need-Momentjs#day-of-year
 * 
 * @param {Date} date
 * @returns {number} 1-366
 */
function dayOfYear(date) {
  return Math.floor(
    (new Date() - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
}

/**
 * Used in TimeStep to avoid the hidden times.
 * @param {TimeStep} timeStep
 * @param {Date} previousTime
 */
export function stepOverHiddenDates(timeStep, previousTime) {
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
    const prevValue = Date(previousTime);
    const newValue = Date(endDate);
    //check if the next step should be major
    if (prevValue.getFullYear() != newValue.getFullYear()) {timeStep.switchedYear = true;}
    else if (prevValue.getFullYear() != newValue.getMonth()) {timeStep.switchedMonth = true;}
    else if (dayOfYear(prevValue) != dayOfYear(newValue)) {timeStep.switchedDay = true;}

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
export function toScreen(Core, time, width) {
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
        time = Date(time).valueOf();
        time = time + hiddenBeforeStart;
        return -(conversion.offset - time.valueOf()) * conversion.scale;
        
      } else if (time > Core.range.end) {
        const rangeAfterEnd = {start: Core.range.start, end: time};
        time = correctTimeForHidden(Core.body.hiddenDates, rangeAfterEnd, time);
        conversion = Core.range.conversion(width, duration);
        return (time.valueOf() - conversion.offset) * conversion.scale;

      } else {
        time = correctTimeForHidden(Core.body.hiddenDates, Core.range, time);
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
export function toTime(Core, x, width) {
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
export function getHiddenDurationBetween(hiddenDates, start, end) {
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
export function getHiddenDurationBeforeStart(hiddenDates, start, end) {
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
 * @param {Array.<{start: Window.start, end: *}>} hiddenDates
 * @param {{start: number, end: number}} range
 * @param {Date} time
 * @returns {number}
 */
export function correctTimeForHidden(hiddenDates, range, time) {
  time = Date(time).valueOf();
  time -= getHiddenDurationBefore(hiddenDates, range, time);
  return time;
}

/**
 * Support function
 * @param {Array.<{start: Window.start, end: *}>} hiddenDates
 * @param {{start: number, end: number}} range
 * @param {Date} time
 * @returns {number}
 */
export function getHiddenDurationBefore(hiddenDates, range, time) {
  let timeOffset = 0;
  time = Date(time).valueOf();

  for (let i = 0; i < hiddenDates.length; i++) {
    const startDate = hiddenDates[i].start;
    const endDate = hiddenDates[i].end;
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
export function getAccumulatedHiddenDuration(hiddenDates, range, requiredDuration) {
  let hiddenDuration = 0;
  let duration = 0;
  let previousPoint = range.start;
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
export function snapAwayFromHidden(hiddenDates, time, direction, correctionEnabled) {
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
export function getIsHidden(time, hiddenDates) {
  for (let i = 0; i < hiddenDates.length; i++) {
    var startDate = hiddenDates[i].start;
    var endDate = hiddenDates[i].end;

    if (time >= startDate && time < endDate) { // if the start is entering a hidden zone
      return {hidden: true, startDate, endDate};
    }
  }
  return {hidden: false, startDate, endDate};
}
