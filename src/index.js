import polyfill from 'babel-polyfill';
import moment from 'moment';
import _ from 'lodash';

let Accessory = null,
    Service = null,
    Characteristic = null,
    UUIDGen = null;

const platformName = 'homebridge-timer';
const switchAccessoryName = 'TimerLightbulb';
const sensorAccessoryName = 'TimerSensor';
 
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const TimerPlatform = class {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.accessories = {}
        
        this.api.on('didFinishLaunching', () => this.didFinishLaunching());
    }

    didFinishLaunching() {
        _.each(this.config.timers, (timer) => {
            if (this.accessories[timer.name] === undefined) {
                const container = new TimerContainer(timer);
                this.api.registerPlatformAccessories(platformName, platformName, [container.Lightbulb]);
            }
        });
    }

    configureAccessory(accessory) {
        const is_switch = accessory.getService(Service.Lightbulb) !== undefined;
        const _timer = _.find(this.config.timers, (timer) => {
            const extra = is_switch ? ' Timer Trigger'.length : ' Timer End'.length;
            const accessoryName = accessory.displayName.substr(0, accessory.displayName.length - extra);
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

    addAccessory(accessoryName) {
        console.log('Adding', accessoryName);
    }

    removeAccessory(accessoryName) {
        console.log('Removing', accessoryName);
    }
}

const TimerContainer = class {
    constructor(timer, _Accessory, is_switch) {
        this.timer = new Timer(timer, this);

        const lightbulb_name = `${timer.name} Timer Trigger`;
        const start_motion_sensor_name = `${timer.name} Timer Start`;
        const end_motion_sensor_name = `${timer.name} Timer End`;
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

        const lightbulb_service = this.Lightbulb.getService(Service.Lightbulb)
        lightbulb_service.getCharacteristic(Characteristic.Brightness)
            .on('get', (callback) => {
                console.log('In get handler');
                callback(null, this.lightbulb_brightness);
            })
            .on('set', (value, callback) => {
                console.log('In set handler', value);
                this.lightbulb_brightness = value;

                if (this.selfcall) {
                    this.selfcall = false;
                    // Trigger a refresh of the brightness value to the Home app
                    console.log(`Refreshing brightness: ${this.lightbulb_brightness}`);
                    lightbulb_service.getCharacteristic(Characteristic.Brightness)
                                     .getValue();
                } else {

                    if (value) {
                        this.timer.start()
                            .then((val) => {
                                if (val) {
                                    lightbulb_service.setCharacteristic(Characteristic.On, 0); // Turn off the lightbulb
                                }
                            });
                    }

                }
                callback(null);
            });

    }
}

const Timer = class {
    constructor(timer, parent) {
        this.name = timer.name;
        this.seconds = timer.seconds;
        this.active = timer.active;

        this.startTime = null;
        this.parent = parent;
    }

    async start() {
        const t = moment();
        this.startTime = t;

        let brightness = this.parent.lightbulb_brightness;

        const step_length = this.seconds * 1000 / 100; // Divide the time into 100 time steps
        let lightbulb_service = this.parent.Lightbulb
                                           .getService(Service.Lightbulb);

        // If the brightness is set to 64, it will run for 64% of the seconds
        for (let i = 0; i < brightness; i++) {
            await wait(step_length);
            
            this.parent.selfcall = true;
            lightbulb_service.setCharacteristic(Characteristic.Brightness, this.parent.lightbulb_brightness - 1);
        }

        if (this.startTime === t) {
            return true;
        } else {
            return false;
        }
    }
}

export default (homebridge) => {
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(platformName, platformName, TimerPlatform, true);
}
