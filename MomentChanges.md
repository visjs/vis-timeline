# Remove moment.js

see https://github.com/visjs/vis-timeline/issues/672

## Internal Changes

### lib/timeline/DateUtil.js

* remove `moment` from `convertHiddenOptions` function.
* remove `moment` parameter from the `stepOverHiddenDates` function.

## Breaking Changes

*none, so far*