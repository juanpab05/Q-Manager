// Jest setup file: polyfills and global test helpers
// Ensure TextEncoder/TextDecoder exist in the test environment
// Enable React 18 act() in the test environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
// Note: setting this flag lets React's act() work correctly with concurrent features
const util = require('util');
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = util.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = util.TextDecoder;
}

// Optional: basic mock for matchMedia if tests rely on it
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  });
}
