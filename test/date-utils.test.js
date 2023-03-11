var assert = require("assert");

var { getDayOfYear, setDayOfYear } = require("../lib/date-utils");
var moment = require("moment");

describe("date-utils", function() {

  describe("getDayOfYear", function() {

    [
      "2019-01-01T00:00:00.000Z",

      // problematic dated due to https://stackoverflow.com/a/8619946/722162
      "2019-10-26T00:59:00.000Z",
      "2019-10-27T00:01:01.000Z",
      "2019-10-29T00:59:00.000Z",

      // Leap year
      "2020-02-29 00:00:00",
    ].forEach((dateString) => {
      it(`valid "getDayOfYear(new Date('${dateString}'))" should be equal "moment('${dateString}').dayOfYear()"`, function() {
        assert.equal(
          getDayOfYear(new Date(dateString)),
          moment(dateString).dayOfYear()
        );
      });
    });

    [
      // invalid dates
      null,
      undefined,
      new Date("invalid date"),
      0,
    ].forEach((invalidDate) => {
      it(`invalid "getDayOfYear(${invalidDate}))" should return NaN`, () => {
        assert.equal(
          getDayOfYear(invalidDate),
          NaN
        );
      });
    });
  });

  describe("setDayOfYear", function() {
    [
      ["2019-01-01T00:00:00.000Z", 1],
      ["2019-05-21T00:00:00.000Z", 15],
      ["2019-01-30T00:00:00.000Z", 31],
      ["2019-01-01T00:00:00.000Z", 366],
      ["2019-01-01T00:00:00.000Z", 366],

      // Leap year
      ["2020-01-01T00:00:00.000Z", 365],
      ["2020-01-01T00:00:00.000Z", 60],
    ].forEach(([dateString, dayOfYear]) => {
      it(`valid - "setDayOfYear(new Date('${dateString}'), ${dayOfYear})" should be equal "moment('${dateString}').dayOfYear(${dayOfYear})"`, function() {
        const nativeDate = new Date(dateString);
        setDayOfYear(nativeDate, dayOfYear);

        assert.equal(
          nativeDate.toISOString(),
          moment(dateString).dayOfYear(dayOfYear).toDate().toISOString()
        );
      });
    });

    [
      // invalid dates
      [null, 1],
      [undefined, 1],
      [new Date("invalid date"), 1],
      [0, 1],
    ].forEach(([date, dayOfYear]) => {
      it(`invalid date - "setDayOfYear(${date}, ${dayOfYear}))" should throw Error`, () => {
        assert.throws(() => {
          setDayOfYear(date),
          Error('Invalid date value')
        });
      });
    });

    [
      // invalid day of year
      ["2019-01-01T00:00:00.000Z", 0],
      ["2020-01-01T00:00:00.000Z", 367],
    ].forEach(([date, dayOfYear]) => {
      it(`invalid dayOfYear - "setDayOfYear(new Date(${date}), ${dayOfYear}))" should throw Error`, () => {
        assert.throws(() => {
          setDayOfYear(new Date(date), dayOfYear);
        }, new RangeError(`dayOfYear must between 1 and 366, was "${dayOfYear}"`));
      });
    });
  });
});
