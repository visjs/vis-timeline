// Locales have to be supplied by the user.

// Timeline
import Timeline from "./timeline/Timeline";
import Graph2d from "./timeline/Graph2d";

import Core from "./timeline/Core";
import * as DateUtil from "./timeline/DateUtil";
import Range from "./timeline/Range";
import * as stack from "./timeline/Stack";
import TimeStep from "./timeline/TimeStep";

import Item from "./timeline/component/item/Item";
import BackgroundItem from "./timeline/component/item/BackgroundItem";
import BoxItem from "./timeline/component/item/BoxItem";
import PointItem from "./timeline/component/item/PointItem";
import RangeItem from "./timeline/component/item/RangeItem";

import BackgroundGroup from "./timeline/component/BackgroundGroup";
import Component from "./timeline/component/Component";
import CurrentTime from "./timeline/component/CurrentTime";
import CustomTime from "./timeline/component/CustomTime";
import DataAxis from "./timeline/component/DataAxis";
import DataScale from "./timeline/component/DataScale";
import GraphGroup from "./timeline/component/GraphGroup";
import Group from "./timeline/component/Group";
import ItemSet from "./timeline/component/ItemSet";
import Legend from "./timeline/component/Legend";
import LineGraph from "./timeline/component/LineGraph";
import TimeAxis from "./timeline/component/TimeAxis";

// TODO: This should probably be moved somewhere else to ensure that both builds
// behave the same way.
import moment from "moment";
import { getNavigatorLanguage } from "./DOMutil";
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
      PointItem,
      RangeItem
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
    TimeAxis
  }
};

export { Graph2d, Timeline, timeline };
