import moment from 'moment';

import {version} from '../package.json';
import wait from './wait.js';

let Accessory, Characteristic, Service;

class MotionSensor {
    static START = 1;
    static END = 2;

    constructor(HOMEBRIDGE, log, timer_config, is_start_or_end_sensor) {
        ({ Accessory, Characteristic, Service } = HOMEBRIDGE);
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
            start: moment(this.active.start, 'HH:mm'),
            end: moment(this.active.end, 'HH:mm')
        }

        this.active_cross_days = this.active.end.isBefore(this.active.start);

        this.is_start = is_start_or_end_sensor === MotionSensor.START;
        this.name = `${this.config.name} ${this.is_start ? 'Start' : 'End'}`;
    }

    getServices() {
        const services = [];
        
        let service = new Service.AccessoryInformation();
        service
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'None')
            .setCharacteristic(Characteristic.Model, 'None')
            .setCharacteristic(Characteristic.SerialNumber, '13')
            .setCharacteristic(Characteristic.FirmwareRevision, version)
            .setCharacteristic(Characteristic.HardwareRevision, version);

        services.push(service);

        this.log(`Adding ${this.name}`);
        this.service = new Service.MotionSensor(this.name);
        this.detectedChar = this.service.getCharacteristic(Characteristic.MotionDetected);
        this.detectedChar.getValue();

        services.push(this.service);
        return services;
    }

    identify(callback) {
        this.log(`Identify requested on ${this.name}`);
        callback();
    }

    async activate() {
        if (!this.check_time()) {
            this.log(`${this.name} not activating between ${this.active.end.format('HH:mm')}-${this.active.start.format('HH:mm')}`);
            return;
        }
        this.log(`Activated ${this.name}`);
        this.detectedChar.setValue(true);
        await wait(5000); // Wait 10 seconds
        this.deactivate();
    }

    deactivate() {
        this.log(`Deactivated ${this.name}`);
        this.detectedChar.setValue(false);
    }

    check_time() {
        const cur = moment(),
              cur_hour = cur.hour(),
              cur_minute = cur.minute(),
              start_hour = this.active.start.hour(),
              start_minute = this.active.start.minute(),
              end_hour = this.active.end.hour(),
              end_minute = this.active.end.minute();

        if (this.active_cross_days) {
            if (start_hour <= cur_hour || cur_hour <= end_hour) {
                if ((start_hour === end_hour && start_hour === cur_hour && end_minute < cur_minute && cur_minute < start_minute) ||
                    (start_hour === cur_hour && cur_minute < start_minute) || 
                    (end_hour === cur_hour && end_minute < cur_minute)) {
                    return false;
                }
                return true;
            }
        } else {
            if (start_hour <= cur_hour && cur_hour <= end_hour) {
                if ((start_hour === end_hour && start_hour === cur_hour && end_minute < cur_minute && cur_minute < start_minute) ||
                    (start_hour === cur_hour && cur_minute < start_minute) || 
                    (end_hour === cur_hour && end_minute < cur_minute)) {
                    return false;
                }
                return true;
            }
        }

        return false;
    }
}

export default MotionSensor;
