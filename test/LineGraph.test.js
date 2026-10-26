import assert from "node:assert";

import LineGraph from "../lib/timeline/component/LineGraph.js";

describe("LineGraph", () => {
  describe("_updateYAxis", () => {
    let graph;

    beforeEach(() => {
      const createAxis = () => ({
        width: 30,
        range: null,
        setRange(min, max) {
          this.range = [min, max];
        },
        redraw: () => false,
      });
      graph = Object.create(LineGraph.prototype);
      graph.groups = {};
      graph.yAxisLeft = createAxis();
      graph.yAxisRight = createAxis();
      graph._toggleAxisVisiblity = (used, axis) => {
        axis.used = used;
        return false;
      };
    });

    it("handles empty groups", () => {
      assert.equal(graph._updateYAxis([], {}), false);
      assert.equal(graph.yAxisLeft.used, false);
      assert.equal(graph.yAxisRight.used, false);
    });

    for (const orientation of ["left", "right"]) {
      it(`sets the range of the ${orientation} axis`, () => {
        graph.groups.series = { options: { yAxisOrientation: orientation } };
        const ranges = {
          series: { min: -5, max: 25, yAxisOrientation: orientation },
        };
        assert.equal(graph._updateYAxis(["series"], ranges), false);
        const axis =
          orientation === "left" ? graph.yAxisLeft : graph.yAxisRight;
        assert.deepEqual(axis.range, [-5, 25]);
        assert.equal(axis.used, true);
      });
    }

    it("combines ranges independently for both axes", () => {
      const ranges = {
        first: { min: -5, max: 25, yAxisOrientation: "left" },
        second: { min: -10, max: 15, yAxisOrientation: "left" },
        third: { min: 100, max: 500, yAxisOrientation: "right" },
      };
      graph._updateYAxis(Object.keys(ranges), ranges);
      assert.deepEqual(graph.yAxisLeft.range, [-10, 25]);
      assert.deepEqual(graph.yAxisRight.range, [100, 500]);
      assert.equal(graph.yAxisLeft.drawIcons, true);
      assert.equal(graph.yAxisRight.drawIcons, true);
    });

    it("ignores missing and excluded ranges", () => {
      const ranges = {
        included: { min: 1, max: 5, yAxisOrientation: "left" },
        ignored: { min: -100, max: 100, ignore: true },
      };
      graph._updateYAxis(["missing", "included", "ignored"], ranges);
      assert.deepEqual(graph.yAxisLeft.range, [1, 5]);
      assert.equal(graph.yAxisRight.used, false);
    });

    it("keeps the axis in use for groups without points", () => {
      graph.groups.series = { options: { yAxisOrientation: "right" } };
      graph._updateYAxis(["series"], {});
      assert.equal(graph.yAxisLeft.used, false);
      assert.equal(graph.yAxisRight.used, true);
    });

    it("removes temporary stacked groups after updating the ranges", () => {
      const groups = [
        "series",
        "__barStackLeft",
        "__barStackRight",
        "__lineStackLeft",
        "__lineStackRight",
      ];
      const ranges = {
        __barStackLeft: { min: -20, max: 60, yAxisOrientation: "left" },
        __lineStackRight: { min: 100, max: 800, yAxisOrientation: "right" },
      };
      graph._updateYAxis(groups, ranges);
      assert.deepEqual(groups, ["series"]);
      assert.deepEqual(graph.yAxisLeft.range, [-20, 60]);
      assert.deepEqual(graph.yAxisRight.range, [100, 800]);
    });
  });
});
