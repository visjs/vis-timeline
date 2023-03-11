var assert = require("assert");

var { getDayOfYear } = require("../lib/date-utils");
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
      it(`"getDayOfYear(new Date('${dateString}'))" should be equal "moment('${dateString}').dayOfYear()"`, function() {
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
      it(`"getDayOfYear(${invalidDate}))" should return NaN`, function() {
        assert.equal(
          getDayOfYear(invalidDate),
          NaN
        );
      });
    });
  });
});
