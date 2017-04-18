import {version} from '../package.json';
import wait from './wait.js';

let Accessory, Characteristic, Service;

class TriggerSensor {
    static START = 1;
    static END = 2;

    constructor(HOMEBRIDGE, log, timer_config, start, end) {
        ({ Accessory, Characteristic, Service } = HOMEBRIDGE);
        this.log = log;
        this.config = timer_config;
        this.seconds = this.config.seconds;
        this.name = `${this.config.name} Trigger`;
        this.active_timer = 0;
        this.start = start;
        this.end = end;
        this.cancel = false;
        this.step_length = this.seconds * 1000 / 100; // Divide the time into 100 time steps
    }

    getServices() {
        const services = [];

        this.log(`Adding ${this.name}`);
        
        let service = new Service.AccessoryInformation();
        service
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'None')
            .setCharacteristic(Characteristic.Model, 'None')
            .setCharacteristic(Characteristic.SerialNumber, '13')
            .setCharacteristic(Characteristic.FirmwareRevision, version)
            .setCharacteristic(Characteristic.HardwareRevision, version);

        services.push(service);

        this.service = new Service.Lightbulb(this.name);
        this.onChar = this.service.getCharacteristic(Characteristic.On);
        this.onVal = 0;

        this.onChar
            .on('get', (callback) => callback(this.onVal))
            .on('set', (value, callback) => {
                this.onVal = value;
                if (this.onVal === 0) {
                    this.cancel = true;
                    setTimeout(() => { this.cancel = false }, this.step_length);
                } else {
                    this.cancel = false;
                }

                callback();
            });

        this.brightnessChar = this.service.getCharacteristic(Characteristic.Brightness);
        this.brightness = 0;

        this.brightnessChar
            .on('get', (callback) => callback(this.brightness))
            .on('set', (value, callback) => {
                // If this class originated the event, then we don't start a timer
                if (this.brightness !== value) {
                    this.brightness = value;

                    this.startTimer()
                        .then((val) => {
                            if (val) {
                                this.onChar.setValue(0);
                            }
                        });
                }

                callback();           
            });

        services.push(this.service);
        return services;
    }

    identify(callback) {
        this.log(`Identify requested on ${this.name}`);
        callback();
    }

    async startTimer() {
        const timer = this.active_timer + 1;
        this.active_timer++;

        this.log(`Starting timer ${timer} on ${this.name}`);

        this.start.activate();

        const steps = this.brightness;

        // If the brightness is set to 64, it will run for 64% of the seconds
        for (let i = 0; i < steps; i++) {
            await wait(this.step_length);
            if (this.cancel)
                return false;

            if (timer === this.active_timer) {
                this.brightness -= 1;
                this.brightnessChar.setValue(this.brightness);
            }
        }

        // Only activate the "end sensor" if this was the last triggering of this timer.
        // This let's, for example, multiple motion events in the front yard trigger a
        // lights timer and only the last timer after the last motion event will trigger
        // the end timer to turn off the light.
        if (timer === this.active_timer) {
            this.end.activate();
            return true;
        } else {
            return false;
        }
        
    }
}

export default TriggerSensor;
