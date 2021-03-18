import snapshot from "snap-shot-it";
import { inspectNpmPack } from "vis-dev-utils";

describe("Package", function () {
  it("Exported files", function () {
    this.timeout("5m");
    snapshot(inspectNpmPack());
  });
});
