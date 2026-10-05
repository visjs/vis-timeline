import assert from "node:assert/strict";

import jsdom_global from "jsdom-global";
import { DataSet } from "vis-data/esnext";

import LineGraph from "../lib/timeline/component/LineGraph.js";

describe("LineGraph groups", () => {
  let cleanup;

  before(() => {
    cleanup = jsdom_global();
    globalThis.Element = window.Element;
  });

  after(() => {
    cleanup();
    delete globalThis.Element;
  });

  it("uses the original numeric group ID to find legend content", () => {
    const itemsData = new DataSet([
      { id: 1, group: 0, x: new Date("2026-01-01"), y: 1 },
      { id: 2, group: 1, x: new Date("2026-01-02"), y: 2 },
      { id: 3, group: "named", x: new Date("2026-01-03"), y: 3 },
    ]);
    const groupsData = new DataSet([
      { id: 0, content: "Temperature" },
      { id: 1, content: "Humidity" },
      { id: "named", content: "Pressure" },
    ]);
    const contents = new Map();
    const graph = {
      itemsData,
      groupsData,
      groups: {},
      options: { defaultGroup: "default" },
      body: { emitter: { emit() {} } },
      _updateGroup(group, groupId) {
        contents.set(groupId, group.content);
        this.groups[groupId] = { setItems() {} };
      },
    };

    LineGraph.prototype._updateAllGroupData.call(graph, null, null);

    assert.deepEqual(
      [...contents.entries()],
      [
        ["0", "Temperature"],
        ["1", "Humidity"],
        ["named", "Pressure"],
      ],
    );

    groupsData.update({ id: 0, content: "Updated temperature" });
    LineGraph.prototype._updateAllGroupData.call(graph, null, null);
    assert.equal(contents.get("0"), "Updated temperature");
  });
});
