// local-module/index.js

function greet(name) {
  return `Hello from local-module, ${name}!`;
}

function add(a, b) {
  return a + b;
}

module.exports = {
  greet,
  add,
  VERSION: '1.0.0'
};
