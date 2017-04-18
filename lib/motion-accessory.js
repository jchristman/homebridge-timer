'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _package = require('../package.json');

var _wait = require('./wait.js');

var _wait2 = _interopRequireDefault(_wait);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Accessory = void 0,
    Characteristic = void 0,
    Service = void 0;

var MotionSensor = function () {
    function MotionSensor(HOMEBRIDGE, log, timer_config, is_start_or_end_sensor) {
        _classCallCheck(this, MotionSensor);

        Accessory = HOMEBRIDGE.Accessory;
        Characteristic = HOMEBRIDGE.Characteristic;
        Service = HOMEBRIDGE.Service;

        this.log = log;
        this.config = timer_config;

        if (this.config.active !== undefined) {
            this.active = this.config.active;
        } else {
            this.active = {
                start: '00:00',
                end: '23:59'
            };
        }

        this.active = {
            start: (0, _moment2.default)(this.active.start, 'HH:mm'),
            end: (0, _moment2.default)(this.active.end, 'HH:mm')
        };

        this.active_cross_days = this.active.end.isBefore(this.active.start);

        this.is_start = is_start_or_end_sensor === MotionSensor.START;
        this.name = this.config.name + ' ' + (this.is_start ? 'Start' : 'End');
    }

    _createClass(MotionSensor, [{
        key: 'getServices',
        value: function getServices() {
            var services = [];

            var service = new Service.AccessoryInformation();
            service.setCharacteristic(Characteristic.Name, this.name).setCharacteristic(Characteristic.Manufacturer, 'None').setCharacteristic(Characteristic.Model, 'None').setCharacteristic(Characteristic.SerialNumber, '13').setCharacteristic(Characteristic.FirmwareRevision, _package.version).setCharacteristic(Characteristic.HardwareRevision, _package.version);

            services.push(service);

            this.log('Adding ' + this.name);
            this.service = new Service.MotionSensor(this.name);
            this.detectedChar = this.service.getCharacteristic(Characteristic.MotionDetected);
            this.detectedChar.getValue();

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
        key: 'activate',
        value: function () {
            var _ref = _asyncToGenerator(regeneratorRuntime.mark(function _callee() {
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (this.check_time()) {
                                    _context.next = 3;
                                    break;
                                }

                                this.log(this.name + ' not activating between ' + this.active.end.format('HH:mm') + '-' + this.active.start.format('HH:mm'));
                                return _context.abrupt('return');

                            case 3:
                                this.log('Activated ' + this.name);
                                this.detectedChar.setValue(true);
                                _context.next = 7;
                                return (0, _wait2.default)(5000);

                            case 7:
                                // Wait 10 seconds
                                this.deactivate();

                            case 8:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function activate() {
                return _ref.apply(this, arguments);
            }

            return activate;
        }()
    }, {
        key: 'deactivate',
        value: function deactivate() {
            this.log('Deactivated ' + this.name);
            this.detectedChar.setValue(false);
        }
    }, {
        key: 'check_time',
        value: function check_time() {
            var cur = (0, _moment2.default)(),
                cur_hour = cur.hour(),
                cur_minute = cur.minute(),
                start_hour = this.active.start.hour(),
                start_minute = this.active.start.minute(),
                end_hour = this.active.end.hour(),
                end_minute = this.active.end.minute();

            if (this.active_cross_days) {
                if (start_hour <= cur_hour || cur_hour <= end_hour) {
                    if (start_hour === end_hour && start_hour === cur_hour && end_minute < cur_minute && cur_minute < start_minute || start_hour === cur_hour && cur_minute < start_minute || end_hour === cur_hour && end_minute < cur_minute) {
                        return false;
                    }
                    return true;
                }
            } else {
                if (start_hour <= cur_hour && cur_hour <= end_hour) {
                    if (start_hour === end_hour && start_hour === cur_hour && end_minute < cur_minute && cur_minute < start_minute || start_hour === cur_hour && cur_minute < start_minute || end_hour === cur_hour && end_minute < cur_minute) {
                        return false;
                    }
                    return true;
                }
            }

            return false;
        }
    }]);

    return MotionSensor;
}();

MotionSensor.START = 1;
MotionSensor.END = 2;
exports.default = MotionSensor;
module.exports = exports['default'];