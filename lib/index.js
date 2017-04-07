'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _babelPolyfill = require('babel-polyfill');

var _babelPolyfill2 = _interopRequireDefault(_babelPolyfill);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Accessory = null,
    Service = null,
    Characteristic = null,
    UUIDGen = null;

var platformName = 'homebridge-timer';
var switchAccessoryName = 'TimerLightbulb';
var sensorAccessoryName = 'TimerSensor';

var wait = function wait(ms) {
    return new Promise(function (resolve) {
        return setTimeout(resolve, ms);
    });
};

var TimerPlatform = function () {
    function TimerPlatform(log, config, api) {
        var _this = this;

        _classCallCheck(this, TimerPlatform);

        this.log = log;
        this.config = config;
        this.api = api;
        this.accessories = {};

        this.api.on('didFinishLaunching', function () {
            return _this.didFinishLaunching();
        });
    }

    _createClass(TimerPlatform, [{
        key: 'didFinishLaunching',
        value: function didFinishLaunching() {
            var _this2 = this;

            _lodash2.default.each(this.config.timers, function (timer) {
                if (_this2.accessories[timer.name] === undefined) {
                    var container = new TimerContainer(timer);
                    _this2.api.registerPlatformAccessories(platformName, platformName, [container.Lightbulb]);
                }
            });
        }
    }, {
        key: 'configureAccessory',
        value: function configureAccessory(accessory) {
            var is_switch = accessory.getService(Service.Lightbulb) !== undefined;
            var _timer = _lodash2.default.find(this.config.timers, function (timer) {
                var extra = is_switch ? ' Timer Trigger'.length : ' Timer End'.length;
                var accessoryName = accessory.displayName.substr(0, accessory.displayName.length - extra);
                return accessoryName === timer.name;
            });

            if (_timer === undefined) {
                this.api.unregisterPlatformAccessories(platformName, platformName, [accessory]);
                return;
            }

            if (this.accessories[_timer.name] === undefined) {
                this.accessories[_timer.name] = new TimerContainer(_timer, accessory, is_switch);
            }
        }
    }, {
        key: 'addAccessory',
        value: function addAccessory(accessoryName) {
            console.log('Adding', accessoryName);
        }
    }, {
        key: 'removeAccessory',
        value: function removeAccessory(accessoryName) {
            console.log('Removing', accessoryName);
        }
    }]);

    return TimerPlatform;
}();

var TimerContainer = function TimerContainer(timer, _Accessory, is_switch) {
    var _this3 = this;

    _classCallCheck(this, TimerContainer);

    this.timer = new Timer(timer, this);

    var lightbulb_name = timer.name + ' Timer Trigger';
    var start_motion_sensor_name = timer.name + ' Timer Start';
    var end_motion_sensor_name = timer.name + ' Timer End';
    if (_Accessory === undefined) {
        this.Lightbulb = new Accessory(lightbulb_name, UUIDGen.generate(lightbulb_name));
        this.Lightbulb.addService(Service.Lightbulb, lightbulb_name);
        this.StartMotionSensor = new Accessory(start_motion_sensor_name, UUIDGen.generate(start_motion_sensor_name));
        this.StartMotionSensor.addService(Service.MotionSensor, start_motion_sensor_name);
        this.EndMotionSensor = new Accessory(end_motion_sensor_name, UUIDGen.generate(end_motion_sensor_name));
        this.EndMotionSensor.addService(Service.MotionSensor, end_motion_sensor_name);
    } else {
        this.Lightbulb = _Accessory;
    }

    this.lightbulb_brightness = 0;
    this.selfcall = false;

    var lightbulb_service = this.Lightbulb.getService(Service.Lightbulb);
    lightbulb_service.getCharacteristic(Characteristic.Brightness).on('get', function (callback) {
        console.log('In get handler: ' + _this3.lightbulb_brightness);
        callback(null, _this3.lightbulb_brightness);
    }).on('set', function (value, callback) {
        console.log('In set handler');
        _this3.lightbulb_brightness = value;

        if (value) {
            _this3.timer.start().then(function (val) {
                if (val) {
                    lightbulb_service.setCharacteristic(Characteristic.On, 0); // Turn off the lightbulb
                }
            });
        }

        callback(null);
    });
};

var Timer = function () {
    function Timer(timer, parent) {
        _classCallCheck(this, Timer);

        this.name = timer.name;
        this.seconds = timer.seconds;
        this.active = timer.active;

        this.startTime = null;
        this.parent = parent;
    }

    _createClass(Timer, [{
        key: 'start',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                var t, brightness, step_length, lightbulb_service, i;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                t = (0, _moment2.default)();

                                this.startTime = t;

                                brightness = this.parent.lightbulb_brightness;
                                step_length = this.seconds * 1000 / 100; // Divide the time into 100 time steps

                                lightbulb_service = this.parent.Lightbulb.getService(Service.Lightbulb);

                                // If the brightness is set to 64, it will run for 64% of the seconds

                                i = 0;

                            case 6:
                                if (!(i < brightness)) {
                                    _context.next = 14;
                                    break;
                                }

                                _context.next = 9;
                                return wait(step_length);

                            case 9:

                                this.parent.lightbulb_brightness -= 1;

                                // Trigger a refresh of the brightness value to the Home app
                                lightbulb_service.getCharacteristic(Characteristic.Brightness).getValue();

                            case 11:
                                i++;
                                _context.next = 6;
                                break;

                            case 14:
                                if (!(this.startTime === t)) {
                                    _context.next = 18;
                                    break;
                                }

                                return _context.abrupt('return', true);

                            case 18:
                                return _context.abrupt('return', false);

                            case 19:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function start() {
                return _ref.apply(this, arguments);
            }

            return start;
        }()
    }]);

    return Timer;
}();

exports.default = function (homebridge) {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(platformName, platformName, TimerPlatform, true);
};

module.exports = exports['default'];