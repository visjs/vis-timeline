import { DataSet } from "vis-data/esnext";

const TestSupport = {
  buildMockItemSet: () => {
    const itemset = {
      dom: {
        foreground: document.createElement("div"),
        content: document.createElement("div"),
      },
      itemSet: {
        itemsData: new DataSet(),
      },
    };
    return itemset;
  },

  buildSimpleTimelineRangeBody: () => {
    const body = {
      dom: {
        center: {
          clientWidth: 1000,
        },
      },
      domProps: {
        centerContainer: {
          width: 900,
          height: 600,
        },
      },
      emitter: {
        on: () => {},
        off: () => {},
        emit: () => {},
      },
      hiddenDates: [],
      util: {},
    };
    body.dom.rollingModeBtn = document.createElement("div");
    return body;
  },
};

export default TestSupport;
