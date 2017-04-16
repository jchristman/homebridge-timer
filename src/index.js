import polyfill from 'babel-polyfill'; // This just allows async-await to happen
import _ from 'lodash';

import MotionAccessory from './motion-accessory.js';
import TriggerAccessory from './trigger-accessory.js';

const HOMEBRIDGE = {
    Accessory: null,
    Service: null,
    Characteristic: null,
    UUIDGen: null
};

const platformName = 'homebridge-timer';
const platformPrettyName = 'Timer';

export default (homebridge) => {
    HOMEBRIDGE.Accessory = homebridge.platformAccessory;
    HOMEBRIDGE.Service = homebridge.hap.Service;
    HOMEBRIDGE.Characteristic = homebridge.hap.Characteristic;
    HOMEBRIDGE.UUIDGen = homebridge.hap.uuid;

    homebridge.registerPlatform(platformName, platformPrettyName, TimerPlatform, true);
}


const TimerPlatform = class {
    constructor(log, config, api) {
        this.log = log;
        this.log('Timer Platform Plugin Loaded');
        this.config = config;
        this.api = api;
    }

    accessories(callback) {
        let _accessories = [];
        const { timers } = this.config;

        _.each(timers, (timer) => {
            this.log(`Found timer in config: "${timer.name}" -- ${timer.seconds}`);
            
            let startSensor = new MotionAccessory(HOMEBRIDGE, this.log, timer, MotionAccessory.START);
            let endSensor = new MotionAccessory(HOMEBRIDGE, this.log, timer, MotionAccessory.END);
            let trigger = new TriggerAccessory(HOMEBRIDGE, this.log, timer, startSensor, endSensor);

            _accessories.push(startSensor);
            _accessories.push(endSensor);
            _accessories.push(trigger);
        })

        callback(_accessories);
    }
}
