"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
};

module.exports = exports["default"];