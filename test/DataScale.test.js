import assert from "node:assert";

import DataScale from "../lib/timeline/component/DataScale.js";

describe("DataScale", () => {
  describe("followScale", () => {
    for (const [name, left, right] of [
      ["a positive peak", [8.8, 10.2], [2, 17]],
      ["a negative trough", [7.4, 8.5], [-20, 19]],
      ["a positive lower bound", [7.4, 8.5], [20, 39]],
      ["data following a narrow negative range", [-3.5, -2.9], [0, 20]],
    ]) {
      for (const height of [200, 400, 800]) {
        it(`keeps ${name} visible at a height of ${height}`, () => {
          const master = new DataScale(...left, true, true, height, 15);
          const follower = new DataScale(...right, true, true, height, 15);
          follower.followScale(master);

          for (const value of right) {
            const y = follower.convertValue(value);
            assert(y >= 0 && y <= height, `${value} is outside the plot: ${y}`);
          }

          const masterStep = master.getStep() * master.scale;
          const followerStep = follower.getStep() * follower.scale;
          assert(Math.abs(masterStep - followerStep) < 1e-8);
          const majorStep =
            master.magnitudefactor *
            master.majorSteps[master.minorStepIdx] *
            master.scale;
          const offset =
            (follower.getFirstMajor() - master.getFirstMajor()) / majorStep;
          assert(Math.abs(offset - Math.round(offset)) < 1e-8);
        });
      }
    }

    it("fits the data when a fixed master range nearly fills one major interval", () => {
      const master = new DataScale(0, 1.01, false, false, 400, 15);
      const follower = new DataScale(-20, 20, true, true, 400, 15);
      follower.followScale(master);

      assert(follower.convertValue(-20) <= 400);
      assert(follower.convertValue(20) >= 0);
      assert(
        Math.abs(
          follower.getStep() * follower.scale - master.getStep() * master.scale,
        ) < 1e-8,
      );
    });

    it("keeps zero alignment when requested", () => {
      const master = new DataScale(-10, 20, true, true, 400, 15, true);
      const follower = new DataScale(-100, 200, true, true, 400, 15, true);
      follower.followScale(master);
      assert(
        Math.abs(follower.convertValue(0) - master.convertValue(0)) < 1e-8,
      );
    });
  });
});
