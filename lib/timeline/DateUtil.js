
/**
 * used in Core to convert the options into a volatile variable
 * 
 * @param {function} moment
 * @param {Object} body
 * @param {Array | Object} hiddenDates
 * @returns {number}
 */
export function convertHiddenOptions(moment, body, hiddenDates) {
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
        let startDate = moment(hiddenDates[i].start);
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
          let runUntil = end.clone();
          switch (hiddenDates[i].repeat) {
            case "daily": // case of time
              if (startDate.day() != endDate.day()) {
                offset = 1;
              }
              startDate = startDate.dayOfYear(start.dayOfYear())
                .year(start.year())
                .subtract(7,'days');

              endDate = endDate.dayOfYear(start.dayOfYear())
                .year(start.year())
                .subtract(7 - offset,'days');

              runUntil.add(1, 'weeks');
              break;
            case "weekly": {
              const dayOffset = endDate.diff(startDate,'days');
              const day = startDate.day();

              // set the start date to the range.start
              startDate = startDate.date(start.date())
                .month(start.month())
                .year(start.year());
              endDate = startDate.clone();

              // force
              startDate = startDate.day(day).subtract(1,'weeks');
              endDate = endDate.day(day)
                .add(dayOffset,'days')
                .subtract(1,'weeks');

              runUntil.add(1, 'weeks');
              break;
            }
            case "monthly":
              if (startDate.month() != endDate.month()) {
                offset = 1;
              }
              startDate = startDate.month(start.month())
                .year(start.year())
                .subtract(1,'months');

              endDate = endDate.month(start.month())
                .year(start.year())
                .subtract(1,'months')
                .add(offset,'months');

              runUntil.add(1, 'months');
              break;
            case "yearly":
              if (startDate.year() != endDate.year()) {
                offset = 1;
              }
              startDate = startDate.year(start.year())
                .subtract(1,'years');
              endDate = endDate.year(start.year())
                .subtract(1,'years')
                .add(offset,'years');

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
                startDate = startDate.add(1, 'days');
                endDate = endDate.add(1, 'days');
                break;
              case "weekly":
                startDate = startDate.add(1, 'weeks');
                endDate = endDate.add(1, 'weeks');
                break;
              case "monthly":
                startDate = startDate.add(1, 'months');
                endDate = endDate.add(1, 'months');
                break;
              case "yearly":
                startDate = startDate.add(1, 'y');
                endDate = endDate.add(1, 'y');
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
 * Prints dates to console
 * @param {array} dates
 */
export function printDates(dates) {
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
export function stepOverHiddenDates(moment, timeStep, previousTime) {
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
 * @param {function} moment
 * @param {Array.<{start: Window.start, end: *}>} hiddenDates
 * @param {{start: number, end: number}} range
 * @param {Date} time
 * @returns {number}
 */
export function correctTimeForHidden(moment, hiddenDates, range, time) {
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
export function getHiddenDurationBefore(moment, hiddenDates, range, time) {
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
export function getAccumulatedHiddenDuration(hiddenDates, range, requiredDuration) {
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
