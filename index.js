// utils
import util from 'vis-util';
import * as DOMutil from './lib/DOMutil';

// data
import { DataSet, DataView, Queue } from 'vis-data';


// Timeline
import Timeline from './lib/timeline/Timeline';
import Graph2d from './lib/timeline/Graph2d';

import Core from './lib/timeline/Core';
import * as DateUtil from './lib/timeline/DateUtil';
import Range from './lib/timeline/Range';
import * as stack from './lib/timeline/Stack';
import TimeStep from './lib/timeline/TimeStep';

import Item from './lib/timeline/component/item/Item';
import BackgroundItem from './lib/timeline/component/item/BackgroundItem';
import BoxItem from './lib/timeline/component/item/BoxItem';
import PointItem from './lib/timeline/component/item/PointItem';
import RangeItem from './lib/timeline/component/item/RangeItem';

import BackgroundGroup from './lib/timeline/component/BackgroundGroup';
import Component from './lib/timeline/component/Component';
import CurrentTime from './lib/timeline/component/CurrentTime';
import CustomTime from './lib/timeline/component/CustomTime';
import DataAxis from './lib/timeline/component/DataAxis';
import DataScale from './lib/timeline/component/DataScale';
import GraphGroup from './lib/timeline/component/GraphGroup';
import Group from './lib/timeline/component/Group';
import ItemSet from './lib/timeline/component/ItemSet';
import Legend from './lib/timeline/component/Legend';
import LineGraph from './lib/timeline/component/LineGraph';
import TimeAxis from './lib/timeline/component/TimeAxis';

// bundled external libraries
import moment from './lib/module/moment';
import Hammer from './lib/module/hammer';
import keycharm from 'keycharm';

const defaultLanguage = DOMutil.getNavigatorLanguage()
moment.locale(defaultLanguage)

const timeline = {
  Core ,
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
    TimeAxis
  }
}

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
  keycharm
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
  keycharm
};
