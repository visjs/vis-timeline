// first check if moment.js is already loaded in the browser window, if so,
// use this instance. Else, load via commonjs.
//
// Note: This doesn't work in ESM.
module.exports = (typeof window !== 'undefined') && window['moment'] || require('moment');
