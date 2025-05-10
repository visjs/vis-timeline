// utility functions

export * from "vis-util/esnext";
import * as util from "vis-util/esnext";
import { getType, isNumber, isString } from "vis-util/esnext";
import { DataSet, createNewDataPipeFrom } from "vis-data/esnext";
import {isDataViewLike as isDataViewLikeUpstream} from "vis-data/esnext";

import moment from "moment";
import xssFilter from 'xss';

export { v4 as randomUUID } from "uuid";
/**
 * Test if an object implements the DataView interface from vis-data.
 * Uses the idProp property instead of expecting a hardcoded id field "id".
 * @param {Object} obj The object to test.
 * @returns {boolean} True if the object implements vis-data DataView interface otherwise false.
 */
export function isDataViewLike(obj) {
    if(!obj) {
        return false;
    }
    let idProp = obj.idProp ?? obj._idProp;
    if(!idProp) {
        return false;
    }
    return isDataViewLikeUpstream(idProp, obj);
}

// parse ASP.Net Date pattern,
// for example '/Date(1198908717056)/' or '/Date(1198908717056-0700)/'
// code from http://momentjs.com/
const ASPDateRegex = /^\/?Date\((-?\d+)/i;
const NumericRegex = /^\d+$/;
/**
 * Convert an object into another type
 *
 * @param {Object} object - Value of unknown type.
 * @param {string} type - Name of the desired type.
 *
 * @returns {Object} Object in the desired type.
 * @throws Error
 */
export function convert(object, type) {
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
      if (isString(object) && !isNaN(Date.parse(object))) {
        return moment(object).valueOf();
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
            "Cannot convert object of type " + getType(object) + " to type " + type
          );
        } else {
          throw e;
        }
      }

    case "Moment":
      if (isNumber(object)) {
        return moment(object);
      }
      if (object instanceof Date) {
        return moment(object.valueOf());
      } else if (moment.isMoment(object)) {
        return moment(object);
      }
      if (isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return moment(Number(match[1])); // parse number
        }
        match = NumericRegex.exec(object);

        if (match) {
          return moment(Number(object));
        }

        return moment(object); // parse string
      } else {
        throw new TypeError(
          "Cannot convert object of type " + getType(object) + " to type " + type
        );
      }

    case "ISODate":
      if (isNumber(object)) {
        return new Date(object);
      } else if (object instanceof Date) {
        return object.toISOString();
      } else if (moment.isMoment(object)) {
        return object.toDate().toISOString();
      } else if (isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return new Date(Number(match[1])).toISOString(); // parse number
        } else {
          return moment(object).format(); // ISO 8601
        }
      } else {
        throw new Error(
          "Cannot convert object of type " +
            getType(object) +
            " to type ISODate"
        );
      }

    case "ASPDate":
      if (isNumber(object)) {
        return "/Date(" + object + ")/";
      } else if (object instanceof Date || moment.isMoment(object)) {
        return "/Date(" + object.valueOf() + ")/";
      } else if (isString(object)) {
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
            getType(object) +
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
 * @param {Object} rawDS - The Data Set with raw uncoerced data.
 * @param {Object} type - A record assigning a data type to property name.
 * @param {string} type.start - Data type name of property 'start'. Default: Date.
 * @param {string} type.end - Data type name of property 'end'. Default: Date.
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
 * @returns {Object} A Data Set like object that saves data into the raw Data Set and
 * retrieves them from the coerced Data Set.
 */
export function typeCoerceDataSet(
  rawDS,
  type = { start: "Date", end: "Date" }
) {
  const idProp = rawDS._idProp;
  const coercedDS = new DataSet({ fieldId: idProp });

  const pipe = createNewDataPipeFrom(rawDS)
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
  const customXSS = new xssFilter.FilterXSS(options);
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
  ...util,
  convert,
  setupXSSProtection
};

Object.defineProperty(availableUtils, 'xss', {
  get: function() {
    return configuredXSSProtection;
  }
})

export default availableUtils;
