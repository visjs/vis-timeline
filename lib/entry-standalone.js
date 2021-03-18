// locales
import "moment/locale/de";
import "moment/locale/es";
import "moment/locale/fr";
import "moment/locale/it";
import "moment/locale/ja";
import "moment/locale/nl";
import "moment/locale/pl";
import "moment/locale/ru";
import "moment/locale/uk";

// utils
import * as util from "vis-util/esnext";
import * as DOMutil from "./DOMutil";

// data
import { DataSet, DataView, Queue } from "vis-data/esnext";

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
import ClusterItem from "./timeline/component/item/ClusterItem";
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

// bundled external libraries
import moment from "./module/moment";
import Hammer from "./module/hammer";
import keycharm from "keycharm";

// TODO: This should probably be moved somewhere else to ensure that both builds
// behave the same way.
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

export {
  DOMutil,
  DataSet,
  DataView,
  Graph2d,
  Hammer,
  Queue,
  Timeline,
  keycharm,
  moment,
  timeline,
  util
};
