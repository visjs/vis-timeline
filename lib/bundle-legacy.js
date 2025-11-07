console.warn(
  [
    "This build has been deprecated.",
    "",
    "In case you are importing this through a URL it will result in a 404 eventually.",
    "In case you are importing this through Node it will be replaced by the peer build eventually.",
    "",
    "Please use the peer or standalone build instead.",
    "Peer: https://visjs.github.io/vis-timeline/examples/timeline/peer-build.html",
    "Standalone: https://visjs.github.io/vis-timeline/examples/timeline/standalone-build.html",
  ].join("\n"),
);

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

// locales
import "moment/locale/de";
import "moment/locale/es";
import "moment/locale/fr";
import "moment/locale/it";
import "moment/locale/ja";
import "moment/locale/nl";
import "moment/locale/pl";
import "moment/locale/ru";
import "moment/locale/tr";
import "moment/locale/uk";

// utils
import * as util from "vis-util/esnext";
import * as DOMutil from "./DOMutil.js";

// data
import { DataSet, DataView, Queue } from "vis-data/esnext";

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

// bundled external libraries
import moment from "./module/moment.js";
import Hammer from "./module/hammer.js";
import keycharm from "keycharm";

const defaultLanguage = DOMutil.getNavigatorLanguage();
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

export {
  util,
  DOMutil,
  DataSet,
  DataView,
  Queue,
  Timeline,
  Graph2d,
  timeline,
  moment,
  Hammer,
  keycharm,
};
export default {
  util,
  DOMutil,

  DataSet,
  DataView,
  Queue,

  Timeline,
  Graph2d,

  timeline,

  moment,
  Hammer,
  keycharm,
};
