// lib/module/hammer.js decides once, at first import, whether a browser
// `window` is available and picks a real Hammer vs. a no-op mock accordingly.
// Individual test files set up/tear down their own per-test jsdom instance,
// but ES module imports are hoisted and get `require()`-d while mocha loads
// spec files, before any `before`/`beforeEach` hook has run — so without this,
// whichever spec file happens to import lib/timeline/Core.js first would
// permanently cache the no-op mock. Mocha's `--file` loads this ahead of all
// spec files, guaranteeing `window` exists by then.
require("jsdom-global")();
