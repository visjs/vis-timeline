import bundledMoment from 'moment';

// Check if Moment.js is already loaded in the browser window, if so, use this
// instance, else use bundled Moment.js.
const moment = ((typeof window !== 'undefined') && window['moment']) || bundledMoment;

export default moment;
