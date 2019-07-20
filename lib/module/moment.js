// first check if moment.js is already loaded in the browser window, if so,
// use this instance. Else, load via commonjs.
export default (typeof window !== 'undefined') && window['moment'] || require('moment');
