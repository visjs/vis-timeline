// utility functions

export * from "vis-util";
import * as util from "vis-util";
import { getType, isNumber, isString } from "vis-util";

import moment from "moment";

// parse ASP.Net Date pattern,
// for example '/Date(1198908717056)/' or '/Date(1198908717056-0700)/'
// code from http://momentjs.com/
const ASPDateRegex = /^\/?Date\((-?\d+)/i;

/**
 * Convert an object into another type
 *
 * @param object - Value of unknown type.
 * @param type - Name of the desired type.
 *
 * @returns Object in the desired type.
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
      if (isNumber(object)) {
        return new Date(object);
      }
      if (object instanceof Date) {
        return new Date(object.valueOf());
      } else if (moment.isMoment(object)) {
        return new Date(object.valueOf());
      }
      if (isString(object)) {
        match = ASPDateRegex.exec(object);
        if (match) {
          // object is an ASP date
          return new Date(Number(match[1])); // parse number
        } else {
          return moment(new Date(object)).toDate(); // parse string
        }
      } else {
        throw new Error(
          "Cannot convert object of type " + getType(object) + " to type Date"
        );
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
        } else {
          return moment(object); // parse string
        }
      } else {
        throw new Error(
          "Cannot convert object of type " + getType(object) + " to type Date"
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

export default {
  ...util,
  convert
};
