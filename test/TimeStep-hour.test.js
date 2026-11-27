import assert from "node:assert";

import moment from "../lib/module/moment.js";
import TimeStep from "../lib/timeline/TimeStep.js";

// Node applies TZ changes to local Date operations; no timezone dependency is
// needed, and the original process timezone is restored after each test.
describe("TimeStep local hour boundaries", () => {
  let originalTZ;
  beforeEach(() => {
    originalTZ = process.env.TZ;
  });
  afterEach(() => {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  });

  function collect(iterator) {
    iterator.start();
    const ticks = [];
    while (iterator.hasNext()) {
      assert(ticks.length < 100, "iteration must terminate");
      const value = iterator.getCurrent().valueOf();
      if (ticks.length)
        assert(value > ticks[ticks.length - 1], "ticks must advance");
      ticks.push(value);
      iterator.next();
    }
    return ticks;
  }

  for (const [zone, day, interval, elapsed] of [
    ["Australia/Sydney", "2025-04-06", 4, 25],
    ["Australia/Sydney", "2025-10-05", 4, 23],
    ["Australia/Lord_Howe", "2025-04-06", 2, 24.5],
    ["Australia/Lord_Howe", "2025-10-05", 2, 23.5],
    ["America/New_York", "2025-11-02", 4, 25],
    ["America/New_York", "2025-03-09", 4, 23],
    ["UTC", "2025-04-06", 4, 24],
  ]) {
    it(`uses actual aligned instants in ${zone} on ${day} at step ${interval}`, () => {
      process.env.TZ = zone;
      const start = new Date(`${day}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const iterator = new TimeStep(start, end);
      iterator.setScale({ scale: "hour", step: interval });
      const expected = [];
      for (let hour = 0; hour < 24; hour += interval) {
        const date = new Date(start);
        date.setHours(hour);
        // Calendar constructors normalize nonexistent hours: exclude these.
        if (date.getHours() === hour && date.getMinutes() === 0)
          expected.push(+date);
      }
      expected.push(+end);
      assert.deepStrictEqual(collect(iterator), expected);
      assert.equal((+end - start) / 3600000, elapsed);
      // Reuse after changing scale and navigating, as TimeAxis does.
      iterator.setScale({ scale: "hour", step: 1 });
      collect(iterator);
      iterator.setRange(end, new Date(+end + 86400000));
      collect(iterator);
      iterator.setRange(start, end);
      iterator.setScale({ scale: "hour", step: interval });
      assert.deepStrictEqual(collect(iterator), expected);
      // Starting partway through the transition must still floor to the grid.
      iterator.setRange(new Date(+start + 4.75 * 3600000), end);
      const partial = collect(iterator);
      assert.deepStrictEqual(
        partial,
        expected.filter((t) => t >= partial[0]),
      );
    });
  }

  for (const [zone, day, repeated, first, second] of [
    ["America/New_York", "2025-11-02", "01:00", "-04:00", "-05:00"],
    ["Australia/Sydney", "2025-04-06", "02:00", "+11:00", "+10:00"],
  ]) {
    it(`keeps both repeated hours and rounds the later occurrence in ${zone}`, () => {
      process.env.TZ = zone;
      const start = new Date(`${day}T00:00:00`);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const iterator = new TimeStep(start, end);
      iterator.setScale({ scale: "hour", step: 1 });
      const ticks = collect(iterator);
      assert.equal(ticks.length, 26);
      assert.deepStrictEqual(
        ticks.filter((t) => moment(t).format("HH:mm") === repeated),
        [
          Date.parse(`${day}T${repeated}:00${first}`),
          Date.parse(`${day}T${repeated}:00${second}`),
        ],
      );
      for (let i = 1; i < ticks.length; i++)
        assert.equal(ticks[i] - ticks[i - 1], 3600000);
      const later = Date.parse(`${day}T${repeated}:00${second}`);
      iterator.setRange(new Date(later + 1800000), end);
      assert.equal(collect(iterator)[0], later);
    });
  }

  it("floors within a partially repeated hour to the nearest real boundary", () => {
    process.env.TZ = "Australia/Lord_Howe";
    const iterator = new TimeStep(
      new Date("2025-04-06T01:45:00+10:30"),
      new Date("2025-04-06T04:00:00+10:30"),
    );
    iterator.setScale({ scale: "hour", step: 1 });
    assert.deepStrictEqual(collect(iterator), [
      Date.parse("2025-04-06T01:00:00+11:00"),
      Date.parse("2025-04-06T02:00:00+10:30"),
      Date.parse("2025-04-06T03:00:00+10:30"),
      Date.parse("2025-04-06T04:00:00+10:30"),
    ]);
  });

  it("does not invent a missing spring hour", () => {
    process.env.TZ = "Australia/Sydney";
    const iterator = new TimeStep(
      new Date("2025-10-05T00:00:00"),
      new Date("2025-10-06T00:00:00"),
    );
    iterator.setScale({ scale: "hour", step: 1 });
    const ticks = collect(iterator);
    assert.equal(ticks.length, 24);
    assert(!ticks.some((t) => moment(t).format("HH:mm") === "02:00"));
  });

  it("respects a supplied fixed-offset moment factory", () => {
    const factory = (value) => moment(value).utcOffset(345);
    const start = factory("2025-04-06T00:00:00+05:45");
    const iterator = new TimeStep(
      start.toDate(),
      start.clone().add(1, "day").toDate(),
      undefined,
      [],
      { moment: factory },
    );
    iterator.setScale({ scale: "hour", step: 4 });
    assert.deepStrictEqual(
      collect(iterator),
      Array.from({ length: 7 }, (_, i) => +start + i * 4 * 3600000),
    );
  });
});
