// Locales have to be supplied by the user.

// styles
import "./shared/activator.css";
import "./shared/bootstrap.css";
import "./shared/configuration.css";
import "./shared/tooltip.css";
import "./timeline/component/css/animation.css";
import "./timeline/component/css/currenttime.css";
import "./timeline/component/css/customtime.css";
import "./timeline/component/css/dataaxis.css";
import "./timeline/component/css/item.css";
import "./timeline/component/css/itemset.css";
import "./timeline/component/css/labelset.css";
import "./timeline/component/css/panel.css";
import "./timeline/component/css/pathStyles.css";
import "./timeline/component/css/timeaxis.css";
import "./timeline/component/css/timeline.css";

// Timeline
import Timeline from "./timeline/Timeline.js";
import Graph2d from "./timeline/Graph2d.js";

import Core from "./timeline/Core.js";
import * as DateUtil from "./timeline/DateUtil.js";
import Range from "./timeline/Range.js";
import * as stack from "./timeline/Stack.js";
import TimeStep from "./timeline/TimeStep.js";

import Item from "./timeline/component/item/Item.js";
import BackgroundItem from "./timeline/component/item/BackgroundItem.js";
import BoxItem from "./timeline/component/item/BoxItem.js";
import ClusterItem from "./timeline/component/item/ClusterItem.js";
import PointItem from "./timeline/component/item/PointItem.js";
import RangeItem from "./timeline/component/item/RangeItem.js";

import BackgroundGroup from "./timeline/component/BackgroundGroup.js";
import Component from "./timeline/component/Component.js";
import CurrentTime from "./timeline/component/CurrentTime.js";
import CustomTime from "./timeline/component/CustomTime.js";
import DataAxis from "./timeline/component/DataAxis.js";
import DataScale from "./timeline/component/DataScale.js";
import GraphGroup from "./timeline/component/GraphGroup.js";
import Group from "./timeline/component/Group.js";
import ItemSet from "./timeline/component/ItemSet.js";
import Legend from "./timeline/component/Legend.js";
import LineGraph from "./timeline/component/LineGraph.js";
import TimeAxis from "./timeline/component/TimeAxis.js";

// TODO: This should probably be moved somewhere else to ensure that both builds
// behave the same way.
import moment from "moment";
import { getNavigatorLanguage } from "./DOMutil.js";
const defaultLanguage = getNavigatorLanguage();
moment.locale(defaultLanguage);

const timeline = {
  Core,
  DateUtil,
  Range,
  stack,
  TimeStep,

  components: {
    items: {
      Item,
      BackgroundItem,
      BoxItem,
      ClusterItem,
      PointItem,
      RangeItem,
    },

    BackgroundGroup,
    Component,
    CurrentTime,
    CustomTime,
    DataAxis,
    DataScale,
    GraphGroup,
    Group,
    ItemSet,
    Legend,
    LineGraph,
    TimeAxis,
  },
};

export { Graph2d, Timeline, timeline };
