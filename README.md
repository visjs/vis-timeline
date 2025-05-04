# vis-timeline

![example chart](docs/img/timeline.png)

The Timeline/Graph2D is an interactive visualization chart to visualize data in time. The data items can take place on a single date, or have a start and end date (a range). You can freely move and zoom in the timeline by dragging and scrolling in the Timeline. Items can be created, edited, and deleted in the timeline. The time scale on the axis is adjusted automatically, and supports scales ranging from milliseconds to years.

## Table of Contents

- [Badges](#badges)
- [Install](#install)
- [Example](#example)
- [Options](#options)
- [Selectors](#selectors)
  - [Custom CSS](#custom-css)
  - [Grid Styling](#grid-styling)
- [Builds](#builds)
  - [Standalone build](#standalone-build)
  - [Peer build](#peer-build)
  - [ESNext build](#esnext-build)
  - [Legacy build](#legacy-build)
- [Build](#build)
  - [Excluding external dependencies](#excluding-external-dependencies)
- [Test](#test)
- [Contribute](#contribute)
  - [Backers](#backers)
  - [Sponsors](#sponsors)
- [License](#license)

## Badges

[![GitHub contributors](https://img.shields.io/github/contributors/visjs/vis-timeline.svg)](https://github.com/visjs/vis-timeline/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/visjs/vis-timeline.svg)](https://github.com/almende/vis/stargazers)

[![Backers on Open Collective](https://opencollective.com/visjs/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/visjs/sponsors/badge.svg)](#sponsors)

## Install

Install via npm:

    $ npm install vis-timeline

## Example

A basic example on loading a Timeline is shown below. More examples can be
found in the [examples directory](https://github.com/visjs/vis-timeline/tree/master/examples/)
of the project. You can view demos of the examples [here](https://visjs.github.io/vis-timeline/examples/timeline/).

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Timeline</title>
    <script
      type="text/javascript"
      src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"
    ></script>
    <link
      href="https://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css"
      rel="stylesheet"
      type="text/css"
    />
    <style type="text/css">
      #visualization {
        width: 600px;
        height: 400px;
        border: 1px solid lightgray;
      }
    </style>
  </head>
  <body>
    <div id="visualization"></div>
    <script type="text/javascript">
      // DOM element where the Timeline will be attached
      var container = document.getElementById("visualization");

      // Create a DataSet (allows two way data-binding)
      var items = new vis.DataSet([
        { id: 1, content: "item 1", start: "2014-04-20" },
        { id: 2, content: "item 2", start: "2014-04-14" },
        { id: 3, content: "item 3", start: "2014-04-18" },
        { id: 4, content: "item 4", start: "2014-04-16", end: "2014-04-19" },
        { id: 5, content: "item 5", start: "2014-04-25" },
        { id: 6, content: "item 6", start: "2014-04-27", type: "point" },
      ]);

      // Configuration for the Timeline
      var options = {};

      // Create a Timeline
      var timeline = new vis.Timeline(container, items, options);
    </script>
  </body>
</html>
```

## Options

| Property    | Type                                                                                     | Default                         | Description                                                                                                                                                                                                                       | Examples and Demos                                                                                                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **STYLING** |                                                                                          |                                 |                                                                                                                                                                                                                                   |
| rtl         | _boolean_                                                                                | false                           | Right-to-left option for rtl languages, e.g. Arabic.                                                                                                                                                                              |
| orientation | _{axis:<br>"both"\|"bottom" \| "none" \| "top",<br>item: "top" \| "bottom"}_             | {axis:"bottom", item: "bottom"} | There are a number of orientation options for the time axis and the items.                                                                                                                                                        | [Example](https://github.com/visjs/vis-timeline/blob/master/examples/timeline/styling/axisOrientation.html) \| [Demo](https://visjs.github.io/vis-timeline/examples/timeline/styling/axisOrientation.html) |
| **EDITING** |                                                                                          |                                 |                                                                                                                                                                                                                                   |
| editable    | _boolean \| {add: boolean, updateTime: boolean, updateGroup: boolean, remove: boolean }_ | false                           | An editable timeline allows to drag items around, create new items, and remove items. Changes are logged in the browser console.                                                                                                  |                                                                                                                                                                                                            |
| multiselect | _boolean_                                                                                | false                           | **Editable** option is required.<br><br>Allow selecting multiple items using ctrl+click, shift+click, or hold.                                                                                                                    |
| snap        | _function(date: Date, scale: string, step: number) \| null_                              | null                            | **Editable** option is required.<br><br>Snap function controls timeline item alignment:<br>- Returns modified Date object<br>- Called when items are moved<br>- Affects time unit snapping<br>- Set to _null_ to disable snapping | See [Snap Example](#snap-example) for implementation                                                                                                                                                       |

## Selectors

### Custom CSS

[Demo](https://visjs.github.io/vis-timeline/examples/timeline/styling/customCss.html) \| [Example](https://github.com/visjs/vis-timeline/blob/master/examples/timeline/styling/customCss.html)

The style of the Timeline can be fully customized via CSS.

![Custom CSS](docs/img/customCss.png)

Below are some of the selectors to customize the timeline.

```css
.vis-timeline {
}
.vis-item {
}

.vis-item.vis-line {
}
.vis-item.vis-dot {
}

.vis-item.vis-selected {
}

.vis-time-axis .vis-text {
}
.vis-time-axis .vis-text.vis-major {
}
.vis-time-axis .vis-text.vis-minor {
}

.vis-time-axis .vis-grid.vis-minor {
}
.vis-time-axis .vis-grid.vis-major {
}
```

You can use html snippets to embed images within items. Check content in the example below:

```javascript
var items = new vis.DataSet([
  /* Other items */
  {
    start: new Date(2010, 7, 23, 23, 0, 0),
    content:
      '<div>Mail from boss</div><img src="../resources/img/mail-icon.png" style="width:32px; height:32px;">',
  },
]);
```

### Grid Styling

[Demo](https://visjs.github.io/vis-timeline/examples/timeline/styling/gridStyling.html) \| [Example](https://github.com/visjs/vis-timeline/blob/master/examples/timeline/styling/gridStyling.html)

```css
.vis-time-axis .vis-grid.vis-odd {
  /* Used for alternating column styles by selecting the odd (alternatively, you can use `even` ) columns in the current view */
}

.vis-time-axis .vis-grid.vis-saturday {
  /* Can be used to customize the column style of any day, Saturday in this example  */
}

.vis-time-axis .vis-text.vis-saturday {
  /* Can be used to customize the text style of any day, Saturday in this example */
}
```

## Builds

There are four builds provided at the moment.

### Standalone build

```html
<script
  type="text/javascript"
  src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"
></script>
````

```javascript
import { Timeline } from "vis-timeline/standalone";
```

This has no dependencies and therefore is great for things like MWEs but has
more issues with interoperability and bundle bloat. For more information see the
following [example](https://visjs.github.io/vis-timeline/examples/timeline/standalone-build.html).

### Peer build

```html
<script
  type="text/javascript"
  src="https://unpkg.com/vis-timeline@latest/peer/umd/vis-timeline-graph2d.min.js"
></script>
```

```javascript
import { Timeline } from "vis-timeline/peer";
```

For this build to work you have to load Vis Data and Moment (including locales
except English) packages yourself. The advantage here is that it works well with
other packages. For more information see the following [example](https://visjs.github.io/vis-timeline/examples/timeline/peer-build.html).

### ESNext build

```html
<script
  type="text/javascript"
  src="https://unpkg.com/vis-timeline@latest/esnext/umd/vis-timeline-graph2d.min.js"
></script>
```

```javascript
import { Timeline } from "vis-timeline/esnext";
```

This is the same as the peer build but without any bundled dependencies or
pollyfills. It's indented to be used with bundlers like Rollup or Webpack which
will fetch the dependencies, prevent duplicate dependencies in the bundle, use
transpilers to add necessary polyfills etc.

### Legacy build

```html
<script
  type="text/javascript"
  src="https://unpkg.com/vis-timeline@latest/dist/vis-timeline-graph2d.min.js"
></script>
```

```javascript
import { Timeline } from "vis-timeline";
```

This is solely kept for backwards compatibility. It is deprecated and will be
removed in case of URLs and replaced by the peer build in case of
Node.js/bundlers. Don't use this, please.

## Build

To build the library from source, clone the project from github

    $ git clone git://github.com/visjs/vis-timeline.git

The source code uses the module style of node (require and module.exports) to
organize dependencies. To install all dependencies and build the library,
run `npm install` in the root of the project.

    $ cd vis-timeline
    $ npm install

Then, the project can be build running:

    $ npm run build

### Excluding external dependencies

External dependencies such as moment, hammerjs can be excluded in the build by running:

    $ npm run build -- -e [comma separated module names]

Example:

    $ npm run build -- -e moment,hammerjs

## Test

To test the library, install the project dependencies once:

    $ npm install

Then run the tests:

    $ npm run test

## Contribute

Contributions to the vis.js library are very welcome! We can't do this alone!

### Backers

Thank you to all our backers! 🙏

<a href="https://opencollective.com/visjs#backers" target="_blank"><img src="https://opencollective.com/visjs/backers.svg?width=890"></a>

### Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website.

<a href="https://opencollective.com/visjs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/visjs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/visjs/sponsor/9/avatar.svg"></a>

## License

Copyright (c) 2014-2017 Almende B.V. and contributors
Copyright (c) 2017-2019 vis.js contributors

This work is dual-licensed under [Apache-2.0](./LICENSE.Apache-2.0.txt) and [MIT](./LICENSE.MIT.txt).
You can choose between one of them if you use this work.

`SPDX-License-Identifier: Apache-2.0 OR MIT`
