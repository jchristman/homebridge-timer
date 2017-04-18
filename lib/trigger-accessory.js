'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _package = require('../package.json');

var _wait = require('./wait.js');

var _wait2 = _interopRequireDefault(_wait);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Accessory = void 0,
    Characteristic = void 0,
    Service = void 0;

var TriggerSensor = function () {
    function TriggerSensor(HOMEBRIDGE, log, timer_config, start, end) {
        _classCallCheck(this, TriggerSensor);

        Accessory = HOMEBRIDGE.Accessory;
        Characteristic = HOMEBRIDGE.Characteristic;
        Service = HOMEBRIDGE.Service;

        this.log = log;
        this.config = timer_config;
        this.seconds = this.config.seconds;
        this.name = this.config.name + ' Trigger';
        this.active_timer = 0;
        this.start = start;
        this.end = end;
        this.cancel = false;
        this.step_length = this.seconds * 1000 / 100; // Divide the time into 100 time steps
    }

    _createClass(TriggerSensor, [{
        key: 'getServices',
        value: function getServices() {
            var _this = this;

            var services = [];

            this.log('Adding ' + this.name);

            var service = new Service.AccessoryInformation();
            service.setCharacteristic(Characteristic.Name, this.name).setCharacteristic(Characteristic.Manufacturer, 'None').setCharacteristic(Characteristic.Model, 'None').setCharacteristic(Characteristic.SerialNumber, '13').setCharacteristic(Characteristic.FirmwareRevision, _package.version).setCharacteristic(Characteristic.HardwareRevision, _package.version);

            services.push(service);

            this.service = new Service.Lightbulb(this.name);
            this.onChar = this.service.getCharacteristic(Characteristic.On);
            this.onVal = 0;

            this.onChar.on('get', function (callback) {
                return callback(_this.onVal);
            }).on('set', function (value, callback) {
                _this.onVal = value;
                if (_this.onVal === 0) {
                    _this.cancel = true;
                    setTimeout(function () {
                        _this.cancel = false;
                    }, _this.step_length);
                } else {
                    _this.cancel = false;
                }

                callback();
            });

            this.brightnessChar = this.service.getCharacteristic(Characteristic.Brightness);
            this.brightness = 0;

            this.brightnessChar.on('get', function (callback) {
                return callback(_this.brightness);
            }).on('set', function (value, callback) {
                // If this class originated the event, then we don't start a timer
                if (_this.brightness !== value) {
                    _this.brightness = value;

                    _this.startTimer().then(function (val) {
                        if (val) {
                            _this.onChar.setValue(0);
                        }
                    });
                }

                callback();
            });

            services.push(this.service);
            return services;
        }
    }, {
        key: 'identify',
        value: function identify(callback) {
            this.log('Identify requested on ' + this.name);
            callback();
        }
    }, {
        key: 'startTimer',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                var timer, steps, i;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                timer = this.active_timer + 1;

                                this.active_timer++;

                                this.log('Starting timer ' + timer + ' on ' + this.name);

                                this.start.activate();

                                steps = this.brightness;

                                // If the brightness is set to 64, it will run for 64% of the seconds

                                i = 0;

                            case 6:
                                if (!(i < steps)) {
                                    _context.next = 15;
                                    break;
                                }

                                _context.next = 9;
                                return (0, _wait2.default)(this.step_length);

                            case 9:
                                if (!this.cancel) {
                                    _context.next = 11;
                                    break;
                                }

                                return _context.abrupt('return', false);

                            case 11:

                                if (timer === this.active_timer) {
                                    this.brightness -= 1;
                                    this.brightnessChar.setValue(this.brightness);
                                }

                            case 12:
                                i++;
                                _context.next = 6;
                                break;

                            case 15:
                                if (!(timer === this.active_timer)) {
                                    _context.next = 20;
                                    break;
                                }

                                this.end.activate();
                                return _context.abrupt('return', true);

                            case 20:
                                return _context.abrupt('return', false);

                            case 21:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function startTimer() {
                return _ref.apply(this, arguments);
            }

            return startTimer;
        }()
    }]);

    return TriggerSensor;
}();

TriggerSensor.START = 1;
TriggerSensor.END = 2;
exports.default = TriggerSensor;
module.exports = exports['default'];