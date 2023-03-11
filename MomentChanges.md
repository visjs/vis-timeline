# Remove moment.js

see https://github.com/visjs/vis-timeline/issues/672

## Refactor

* refactor `DateUtil.toScreen` to not use `moment`

## Internal Changes

### lib/timeline/DateUtil.js

* remove `moment` parameter from `convertHiddenOptions` function.
* remove `moment` parameter from the `stepOverHiddenDates` function.
* remove `moment` parameter from the `correctTimeForHidden` function.
* remove `moment` parameter from the `getHiddenDurationBefore` function.

## Breaking Changes

*none, so far*