'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // This just allows async-await to happen


var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _motionAccessory = require('./motion-accessory.js');

var _motionAccessory2 = _interopRequireDefault(_motionAccessory);

var _triggerAccessory = require('./trigger-accessory.js');

var _triggerAccessory2 = _interopRequireDefault(_triggerAccessory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HOMEBRIDGE = {
    Accessory: null,
    Service: null,
    Characteristic: null,
    UUIDGen: null
};

var platformName = 'homebridge-timer';
var platformPrettyName = 'Timer';

exports.default = function (homebridge) {
    HOMEBRIDGE.Accessory = homebridge.platformAccessory;
    HOMEBRIDGE.Service = homebridge.hap.Service;
    HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
    HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(platformName, platformPrettyName, TimerPlatform, true);
};

var TimerPlatform = function () {
    function TimerPlatform(log, config, api) {
        _classCallCheck(this, TimerPlatform);

        this.log = log;
        this.log('Timer Platform Plugin Loaded');
        this.config = config;
        this.api = api;
    }

    _createClass(TimerPlatform, [{
        key: 'accessories',
        value: function accessories(callback) {
            var _this = this;

            var _accessories = [];
            var timers = this.config.timers;


            _lodash2.default.each(timers, function (timer) {
                _this.log('Found timer in config: "' + timer.name + '" -- ' + timer.seconds);

                var startSensor = new _motionAccessory2.default(HOMEBRIDGE, _this.log, timer, _motionAccessory2.default.START);
                var endSensor = new _motionAccessory2.default(HOMEBRIDGE, _this.log, timer, _motionAccessory2.default.END);
                var trigger = new _triggerAccessory2.default(HOMEBRIDGE, _this.log, timer, startSensor, endSensor);

                _accessories.push(startSensor);
                _accessories.push(endSensor);
                _accessories.push(trigger);
            });

            callback(_accessories);
        }
    }]);

    return TimerPlatform;
}();
module.exports = exports['default'];